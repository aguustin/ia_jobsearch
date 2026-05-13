import { providerRegistry } from "../../providers/registry.js";
import { Job } from "../../models/Job.js";
import { analyzeQueue } from "../index.js";
import { detectLanguage } from "../../utils/detectLanguage.js";
import { findDuplicate } from "../../utils/deduplication.js";

export async function fetchJobsProcessor(queueJob) {
  const { providers: providerFilter } = queueJob.data;
  const allProviders = providerRegistry.getAll();

  const providers =
    providerFilter === "all"
      ? allProviders
      : allProviders.filter((p) => providerFilter.includes(p.name));

  console.log(`[Fetch] Running ${providers.length} provider(s)`);

  // Load recent jobs once — avoids N individual queries during dedup.
  // 60-day window covers re-posts and stale listings.
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const recentPool = await Job.find({ fetchedAt: { $gte: since } })
    .select("externalId source title company")
    .lean();

  // Fast exact-match lookup: "source:externalId"
  const exactKeys = new Set(recentPool.map((j) => `${j.source}:${j.externalId}`));

  let totalNew = 0;
  let totalDuplicates = 0;

  for (const provider of providers) {
    try {
      console.log(`[Fetch] Fetching from ${provider.displayName}...`);
      const jobs = await provider.fetchJobs({ limit: 50 });

      let newCount = 0;
      let dupCount = 0;

      for (const jobData of jobs) {
        const exactKey = `${jobData.source}:${jobData.externalId}`;

        // 1. Exact duplicate — already saved from this same source
        if (exactKeys.has(exactKey)) continue;

        // 2. Cross-source fuzzy duplicate
        const duplicate = findDuplicate(jobData, recentPool);
        if (duplicate) {
          dupCount++;
          console.log(
            `[Dedup] Skipped "${jobData.title}" (${jobData.source}) — matches "${duplicate.title}" (${duplicate.source})`
          );
          continue;
        }

        // 3. New job — save it
        try {
          const language = detectLanguage(jobData.title + " " + jobData.description);
          const newJob = await Job.create({ ...jobData, language });

          // Add to in-memory pool so subsequent jobs in this same run can dedup against it
          recentPool.push({
            _id: newJob._id,
            externalId: newJob.externalId,
            source: newJob.source,
            title: newJob.title,
            company: newJob.company,
          });
          exactKeys.add(exactKey);

          await analyzeQueue.add(
            "analyze-job",
            { jobId: newJob._id.toString() },
            { removeOnComplete: 20, removeOnFail: 50 }
          );
          newCount++;
        } catch (err) {
          if (err.code !== 11000) {
            console.error(`[Fetch] Error saving job: ${err.message}`);
          }
        }
      }

      console.log(
        `[Fetch] ${provider.displayName}: ${jobs.length} fetched, ${newCount} new, ${dupCount} cross-source duplicates skipped`
      );
      totalNew += newCount;
      totalDuplicates += dupCount;
    } catch (err) {
      console.error(`[Fetch] ${provider.displayName} failed: ${err.message}`);
    }
  }

  return { totalNew, totalDuplicates };
}
