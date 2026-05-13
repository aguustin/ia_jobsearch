import { Router } from "express";
import { Application } from "../../models/Application.js";
import { Job } from "../../models/Job.js";

const router = Router();

// GET /api/applications
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate("jobId", "title company url analysis.score source")
        .sort("-updatedAt")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Application.countDocuments(filter),
    ]);

    res.json({ applications: apps, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/applications
router.post("/", async (req, res) => {
  try {
    const { jobId, message, cvVersion, notes, contactPerson, contactEmail, status, sentAt } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const app = await Application.create({
      jobId,
      message: message || job.applicationMessage,
      cvVersion,
      notes,
      contactPerson,
      contactEmail,
      status: status || "draft",
      sentAt: sentAt ? new Date(sentAt) : undefined,
    });

    await Job.findByIdAndUpdate(jobId, { status: "applied" });

    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/applications/:id
router.patch("/:id", async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!app) return res.status(404).json({ error: "Application not found" });

    if (req.body.status === "sent") {
      app.sentAt = app.sentAt || new Date();
      await app.save();
    }

    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/applications/:id
router.delete("/:id", async (req, res) => {
  try {
    const app = await Application.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    await Job.findByIdAndUpdate(app.jobId, { status: "shortlisted" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
