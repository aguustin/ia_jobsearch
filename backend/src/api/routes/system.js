import { Router } from "express";
import { getQueueStats, triggerFetchNow } from "../../queues/index.js";
import { ollamaService } from "../../services/OllamaService.js";
import { providerRegistry } from "../../providers/registry.js";
import { jobEvents } from "../../events.js";
import { Job } from "../../models/Job.js";
import { detectLanguage } from "../../utils/detectLanguage.js";

const router = Router();

// GET /api/system/health
router.get("/health", async (req, res) => {
  const [ollamaOk, models, queueStats] = await Promise.all([
    ollamaService.isAvailable(),
    ollamaService.isAvailable().then((ok) => (ok ? ollamaService.listModels() : [])).catch(() => []),
    getQueueStats().catch(() => ({})),
  ]);

  res.json({
    status: "ok",
    ollama: { available: ollamaOk, models: models.map((m) => m.name) },
    providers: providerRegistry.getNames(),
    queues: queueStats,
  });
});

// POST /api/system/fetch
router.post("/fetch", async (req, res) => {
  try {
    const { providers = "all" } = req.body;
    const job = await triggerFetchNow(providers);
    res.json({ message: "Fetch triggered", queueJobId: job.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/events — Server-Sent Events stream for real-time job notifications
router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({ type: "connected" });

  // Push an event every time a high-score job finishes analysis
  const onJobAnalyzed = (job) => send({ type: "job-analyzed", job });
  jobEvents.on("job-analyzed", onJobAnalyzed);

  // Heartbeat every 25 s — keeps proxies and browsers from closing the connection
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25000);

  req.on("close", () => {
    jobEvents.off("job-analyzed", onJobAnalyzed);
    clearInterval(heartbeat);
  });
});

// POST /api/system/reanalyze-spanish — queue re-analysis for all Spanish jobs already analyzed
router.post("/reanalyze-spanish", async (req, res) => {
  try {
    const { analyzeQueue } = await import("../../queues/index.js");
    const jobs = await Job.find({ language: "es", "analysis.score": { $exists: true } }, { _id: 1 }).lean();

    for (const job of jobs) {
      await analyzeQueue.add(
        "analyze-job",
        { jobId: job._id.toString() },
        { removeOnComplete: 20, removeOnFail: 50 }
      );
    }

    res.json({ message: `Re-analysis queued for ${jobs.length} Spanish jobs` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/system/migrate-languages — re-detect language for all jobs
router.post("/migrate-languages", async (req, res) => {
  try {
    const jobs = await Job.find({}, { _id: 1, title: 1, description: 1 }).lean();
    let updated = 0;

    const bulkOps = jobs.map((job) => {
      const lang = detectLanguage((job.title || "") + " " + (job.description || ""));
      updated++;
      return {
        updateOne: {
          filter: { _id: job._id },
          update: { $set: { language: lang } },
        },
      };
    });

    if (bulkOps.length) await Job.bulkWrite(bulkOps);
    res.json({ message: `Language re-detected for ${updated} jobs` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/queue-stats
router.get("/queue-stats", async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
