import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config/index.js";
import { fetchJobsProcessor } from "./processors/fetchJobs.processor.js";
import { analyzeJobProcessor } from "./processors/analyzeJob.processor.js";

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const fetchQueue = new Queue("fetch-jobs", { connection });
export const analyzeQueue = new Queue("analyze-jobs", { connection });

let workersStarted = false;

export async function startWorkers() {
  if (workersStarted) return;
  workersStarted = true;

  const fetchWorker = new Worker("fetch-jobs", fetchJobsProcessor, {
    connection,
    concurrency: 1,
  });

  const analyzeWorker = new Worker("analyze-jobs", analyzeJobProcessor, {
    connection,
    concurrency: config.analysisConcurrency,
  });

  fetchWorker.on("completed", (job) =>
    console.log(`[Queue] fetch-jobs completed: ${job.id}`)
  );
  fetchWorker.on("failed", (job, err) =>
    console.error(`[Queue] fetch-jobs failed: ${job?.id} - ${err.message}`)
  );

  analyzeWorker.on("completed", (job) =>
    console.log(`[Queue] analyze-jobs completed: ${job.id}`)
  );
  analyzeWorker.on("failed", (job, err) =>
    console.error(`[Queue] analyze-jobs failed: ${job?.id} - ${err.message}`)
  );

  console.log("[Queue] Workers started");
}

export async function scheduleFetchJobs() {
  await fetchQueue.add(
    "fetch-all-providers",
    { providers: "all" },
    {
      repeat: { every: config.fetchIntervalMs },
      removeOnComplete: 10,
      removeOnFail: 20,
    }
  );
  console.log(`[Queue] Scheduled fetch every ${config.fetchIntervalMs / 60000} minutes`);
}

export async function triggerFetchNow(providers = "all") {
  return fetchQueue.add("fetch-manual", { providers }, {
    removeOnComplete: 5,
    removeOnFail: 10,
  });
}

export async function getQueueStats() {
  const [fetchCounts, analyzeCounts] = await Promise.all([
    fetchQueue.getJobCounts(),
    analyzeQueue.getJobCounts(),
  ]);
  return { fetchQueue: fetchCounts, analyzeQueue: analyzeCounts };
}
