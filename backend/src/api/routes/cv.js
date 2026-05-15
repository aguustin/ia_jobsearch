import { Router } from "express";
import multer from "multer";
import { CV } from "../../models/CV.js";
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

    const cv = await CV.findById(cvId);
    if (!cv) return res.status(404).json({ error: "CV no encontrado" });

    // Step 1: extract keywords and requirements from JD
    const jdAnalysis = await atsOptimizerService.analyzeJobDescription(jobDescription);

    // Step 2: score original CV against JD
    const initialScore = atsOptimizerService.calculateATSScore(cv.parsed, jdAnalysis);

    // Step 3: optimize CV with AI
    const optimizedCV = await atsOptimizerService.optimizeCV(cv.rawText, cv.parsed, jobDescription, jdAnalysis);

    // Step 4: score optimized CV
    const finalScore = atsOptimizerService.calculateATSScore(optimizedCV, jdAnalysis);

    // Step 5: render text version
    const optimizedText = atsOptimizerService.formatOptimizedCVText(optimizedCV);

    res.json({ initialScore, finalScore, jdAnalysis, optimizedCV, optimizedText });
  } catch (err) {
    console.error("[CV generate-ats]", err);
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
