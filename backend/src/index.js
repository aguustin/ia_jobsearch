import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { startWorkers, scheduleFetchJobs } from "./queues/index.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("[DB] Connected to MongoDB");

  await startWorkers();
  await scheduleFetchJobs();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[API] Server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
