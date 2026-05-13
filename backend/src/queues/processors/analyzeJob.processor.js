import { Job } from "../../models/Job.js";
import { Profile } from "../../models/Profile.js";
import { jobAnalyzer } from "../../services/JobAnalyzer.js";
import { jobEvents } from "../../events.js";

const NOTIFY_THRESHOLD = parseInt(process.env.NOTIFY_MIN_SCORE || "75");

export async function analyzeJobProcessor(queueJob) {
  const { jobId } = queueJob.data;

  const [job, profile] = await Promise.all([
    Job.findById(jobId),
    Profile.findOne().sort({ updatedAt: -1 }),
  ]);

  if (!job) throw new Error(`Job ${jobId} not found`);

  if (!profile) {
    console.warn(`[Analyze] No profile found, skipping analysis for ${jobId}`);
    return { skipped: true, reason: "no-profile" };
  }

  await Job.findByIdAndUpdate(jobId, { status: "analyzing" });

  try {
    const analysis = await jobAnalyzer.analyze(job, profile);

    await Job.findByIdAndUpdate(jobId, { analysis, status: "analyzed" });

    console.log(`[Analyze] Job ${jobId} scored ${analysis.score}/100`);

    if (analysis.score >= NOTIFY_THRESHOLD) {
      jobEvents.emit("job-analyzed", {
        _id: jobId,
        title: job.title,
        company: job.company,
        score: analysis.score,
        source: job.source,
        url: job.url,
      });
    }

    return { score: analysis.score };
  } catch (err) {
    await Job.findByIdAndUpdate(jobId, { status: "new" });
    throw err;
  }
}
