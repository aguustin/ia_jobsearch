import { Router } from "express";
import multer from "multer";
import { CV } from "../../models/CV.js";
import { Profile } from "../../models/Profile.js";
import { cvParserService } from "../../services/CVParserService.js";
import { atsOptimizerService } from "../../services/ATSOptimizerService.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se aceptan archivos PDF o DOCX"));
    }
  },
});

// GET /api/cv — list CVs (omit rawText for performance)
router.get("/", async (req, res) => {
  try {
    const cvs = await CV.find({}, { rawText: 0 }).sort({ uploadedAt: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cv/upload — upload, extract text, parse structure
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const rawText = await cvParserService.extractText(req.file.buffer, req.file.mimetype);
    if (!rawText || rawText.trim().length < 30) {
      return res.status(422).json({ error: "No se pudo extraer texto del archivo. Verificá que no sea un PDF escaneado." });
    }

    const parsed = await cvParserService.parseToStructured(rawText);

    const cv = await CV.create({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      rawText,
      parsed,
    });

    res.json({
      _id: cv._id,
      originalName: cv.originalName,
      mimeType: cv.mimeType,
      parsed: cv.parsed,
      uploadedAt: cv.uploadedAt,
    });
  } catch (err) {
    console.error("[CV upload]", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cv/:id
router.delete("/:id", async (req, res) => {
  try {
    await CV.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cv/generate-ats — full ATS optimization pipeline
router.post("/generate-ats", async (req, res) => {
  try {
    const { cvId, jobDescription } = req.body;

    if (!cvId) return res.status(400).json({ error: "Se requiere cvId" });
    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: "La descripción laboral debe tener al menos 50 caracteres" });
    }

    const [cv, profile] = await Promise.all([CV.findById(cvId), Profile.findOne()]);
    if (!cv) return res.status(404).json({ error: "CV no encontrado" });

    const profileSummary = profile?.summary?.trim() || "";

    // Step 1: extract keywords and requirements from JD
    const jdAnalysis = await atsOptimizerService.analyzeJobDescription(jobDescription);

    // Step 2: score original CV against JD (include rawText so keywords match even if Ollama parse was incomplete)
    const initialScore = atsOptimizerService.calculateATSScore(cv.parsed, jdAnalysis, cv.rawText);

    // Step 3: optimize CV with AI
    const optimizedCV = await atsOptimizerService.optimizeCV(cv.rawText, cv.parsed, jobDescription, jdAnalysis, profileSummary);

    // Step 5: render text version and apply keyword replacements
    const rawText = atsOptimizerService.formatOptimizedCVText(optimizedCV);
    const optimizedText = atsOptimizerService.applyKeywordReplacements(rawText, jdAnalysis.keywords);

    // Step 4: score optimized CV (pre-injection)
    const preScore = atsOptimizerService.calculateATSScore(
      optimizedCV, jdAnalysis, optimizedText + " " + cv.rawText
    );

    // Step 5: recover missing JD keywords into the correct skill category.
    // recoverMissingKeywords() places A/B-evidence tech normally, C-tier (e.g. AWS)
    // in its proper category (not hidden), and D/unverified tech for manual review —
    // it never fabricates achievements, only adds Skills entries the user can edit/remove.
    // Passing jdAnalysis lets it rank/cap the "Tecnologías adicionales" bucket by
    // must-have > nice-to-have > secondary priority instead of raw JD order.
    const optimizedCVWithKeywords = atsOptimizerService.recoverMissingKeywords(
      optimizedCV, jdAnalysis.keywords, jdAnalysis
    );

    // Step 6: recalculate final score with injected keywords
    const finalRawText = atsOptimizerService.formatOptimizedCVText(optimizedCVWithKeywords);
    const finalOptimizedText = atsOptimizerService.applyKeywordReplacements(finalRawText, jdAnalysis.keywords);
    const finalScore = atsOptimizerService.calculateATSScore(
      optimizedCVWithKeywords, jdAnalysis, finalOptimizedText + " " + cv.rawText
    );

    res.json({ initialScore, finalScore, jdAnalysis, optimizedCV: optimizedCVWithKeywords, optimizedText: finalOptimizedText });
  } catch (err) {
    console.error("[CV generate-ats]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cv/translate — translate CV fields to English using Ollama
router.post("/translate", async (req, res) => {
  try {
    const { cv } = req.body;
    if (!cv) return res.status(400).json({ error: "Se requiere el objeto cv" });
    const translatedCV = await atsOptimizerService.translateCV(cv);
    res.json({ translatedCV });
  } catch (err) {
    console.error("[CV translate]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cv/score-live — real-time scoring while editing (no AI, pure regex)
router.post("/score-live", async (req, res) => {
  try {
    const { parsedCV, jdAnalysis, rawText = "" } = req.body;
    if (!parsedCV || !jdAnalysis) {
      return res.status(400).json({ error: "Se requieren parsedCV y jdAnalysis" });
    }
    const score = atsOptimizerService.calculateATSScore(parsedCV, jdAnalysis, rawText);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cv/compare-ats — score two CVs against the same job description
router.post("/compare-ats", async (req, res) => {
  try {
    const { cvId1, cvId2, jobDescription } = req.body;

    if (!cvId1 || !cvId2) return res.status(400).json({ error: "Se requieren cvId1 y cvId2" });
    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: "La descripción laboral debe tener al menos 50 caracteres" });
    }

    const [cv1, cv2] = await Promise.all([CV.findById(cvId1), CV.findById(cvId2)]);
    if (!cv1) return res.status(404).json({ error: "CV 1 no encontrado" });
    if (!cv2) return res.status(404).json({ error: "CV 2 no encontrado" });

    const jdAnalysis = await atsOptimizerService.analyzeJobDescription(jobDescription);

    const [score1, score2] = await Promise.all([
      atsOptimizerService.calculateATSScore(cv1.parsed, jdAnalysis, cv1.rawText),
      atsOptimizerService.calculateATSScore(cv2.parsed, jdAnalysis, cv2.rawText),
    ]);

    res.json({
      jdAnalysis,
      cv1: { _id: cv1._id, originalName: cv1.originalName, score: score1 },
      cv2: { _id: cv2._id, originalName: cv2.originalName, score: score2 },
    });
  } catch (err) {
    console.error("[CV compare-ats]", err);
    res.status(500).json({ error: err.message });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "El archivo supera el límite de 10 MB" });
  }
  res.status(400).json({ error: err.message });
});

export default router;
