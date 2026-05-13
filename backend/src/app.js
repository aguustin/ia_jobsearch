import express from "express";
import cors from "cors";
import jobsRouter from "./api/routes/jobs.js";
import profileRouter from "./api/routes/profile.js";
import applicationsRouter from "./api/routes/applications.js";
import systemRouter from "./api/routes/system.js";
import analyticsRouter from "./api/routes/analytics.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.use("/api/jobs", jobsRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/system", systemRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
