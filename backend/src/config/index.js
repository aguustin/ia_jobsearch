import "dotenv/config";

export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ia_job_search",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
  },
  fetchIntervalMs: parseInt(process.env.FETCH_INTERVAL_MS || "3600000"),
  analysisConcurrency: parseInt(process.env.ANALYSIS_CONCURRENCY || "2"),
  getonbrd: {
    apiUrl: process.env.GETONBRD_API_URL || "https://www.getonbrd.com/api/v0",
  },
};
