import { Router } from "express";
import { Job } from "../../models/Job.js";
import { analyzeQueue, triggerFetchNow } from "../../queues/index.js";
import { messageGenerator } from "../../services/MessageGenerator.js";
import { interviewPrepGenerator } from "../../services/InterviewPrepGenerator.js";
import { Profile } from "../../models/Profile.js";

const router = Router();

// GET /api/jobs - list with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      source,
      minScore,
      language,
      page = 1,
      limit = 20,
      sort = "-analysis.score",
      search,
    } = req.query;

    const filter = {};
    if (status) filter.status = { $in: status.split(",") };
    if (source) filter.source = source;
    if (minScore) filter["analysis.score"] = { $gte: parseInt(minScore) };
    if (language) filter.language = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Job.countDocuments(filter),
    ]);

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/stats
router.get("/stats", async (req, res) => {
  try {
    const [statusCounts, sourceCounts, avgScore] = await Promise.all([
      Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]),
      Job.aggregate([
        { $match: { "analysis.score": { $exists: true } } },
        { $group: { _id: null, avg: { $avg: "$analysis.score" }, max: { $max: "$analysis.score" } } },
      ]),
    ]);

    res.json({
      byStatus: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
      bySource: Object.fromEntries(sourceCounts.map((s) => [s._id, s.count])),
      avgScore: avgScore[0]?.avg?.toFixed(1) || 0,
      maxScore: avgScore[0]?.max || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = { status };
    if (notes !== undefined) update.notes = notes;

    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/:id/analyze - re-analyze a single job
router.post("/:id/analyze", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    await analyzeQueue.add(
      "analyze-job",
      { jobId: job._id.toString() },
      { removeOnComplete: 5, removeOnFail: 10 }
    );

    res.json({ message: "Analysis queued", jobId: job._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/:id/generate-message
router.post("/:id/generate-message", async (req, res) => {
  try {
    const { tone, language, maxLength } = req.body;
    const [job, profile] = await Promise.all([
      Job.findById(req.params.id),
      Profile.findOne().sort({ updatedAt: -1 }),
    ]);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!profile) return res.status(400).json({ error: "Profile not configured" });

    const result = await messageGenerator.generate(job, profile, { tone, language, maxLength });

    await Job.findByIdAndUpdate(req.params.id, {
      applicationMessage: result.message,
      cvAdaptations: result.cvAdaptations,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/:id/interview-prep — generate interview questions
router.post("/:id/interview-prep", async (req, res) => {
  try {
    const [job, profile] = await Promise.all([
      Job.findById(req.params.id),
      Profile.findOne().sort({ updatedAt: -1 }),
    ]);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!profile) return res.status(400).json({ error: "Profile not configured" });

    const questions = await interviewPrepGenerator.generate(job, profile);

    const interviewPrep = { questions, generatedAt: new Date() };
    await Job.findByIdAndUpdate(req.params.id, { interviewPrep });

    res.json(interviewPrep);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/interview-prep — update practiced flags
router.patch("/:id/interview-prep", async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) return res.status(400).json({ error: "questions array required" });

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { "interviewPrep.questions": questions },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json(job.interviewPrep);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/fetch - trigger manual fetch
router.post("/fetch", async (req, res) => {
  try {
    const { providers = "all" } = req.body;
    const job = await triggerFetchNow(providers);
    res.json({ message: "Fetch triggered", jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
