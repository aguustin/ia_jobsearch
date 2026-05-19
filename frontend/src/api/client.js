import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

export const jobsApi = {
  list: (params) => api.get("/jobs", { params }).then((r) => r.data),
  get: (id) => api.get(`/jobs/${id}`).then((r) => r.data),
  stats: () => api.get("/jobs/stats").then((r) => r.data),
  updateStatus: (id, status, notes) => api.patch(`/jobs/${id}/status`, { status, notes }).then((r) => r.data),
  analyze: (id) => api.post(`/jobs/${id}/analyze`).then((r) => r.data),
  generateMessage: (id, opts) => api.post(`/jobs/${id}/generate-message`, opts, { timeout: 300000 }).then((r) => r.data),
  generateInterviewPrep: (id) => api.post(`/jobs/${id}/interview-prep`, {}, { timeout: 300000 }).then((r) => r.data),
  updateInterviewPrep: (id, questions) => api.patch(`/jobs/${id}/interview-prep`, { questions }).then((r) => r.data),
};

export const profileApi = {
  get: () => api.get("/profile").then((r) => r.data),
  update: (data) => api.put("/profile", data).then((r) => r.data),
  patch: (data) => api.patch("/profile", data).then((r) => r.data),
};

export const applicationsApi = {
  list: (params) => api.get("/applications", { params }).then((r) => r.data),
  create: (data) => api.post("/applications", data).then((r) => r.data),
  update: (id, data) => api.patch(`/applications/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/applications/${id}`).then((r) => r.data),
};

export const analyticsApi = {
  get: () => api.get("/analytics").then((r) => r.data),
};

export const systemApi = {
  health: () => api.get("/system/health").then((r) => r.data),
  triggerFetch: (providers) => api.post("/system/fetch", { providers }).then((r) => r.data),
  queueStats: () => api.get("/system/queue-stats").then((r) => r.data),
  migrateLanguages: () => api.post("/system/migrate-languages").then((r) => r.data),
  reanalyzeSpanish: () => api.post("/system/reanalyze-spanish").then((r) => r.data),
};

export const cvApi = {
  list: () => api.get("/cv").then((r) => r.data),
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/cv/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    }).then((r) => r.data);
  },
  delete: (id) => api.delete(`/cv/${id}`).then((r) => r.data),
  generateATS: (cvId, jobDescription) =>
    api.post("/cv/generate-ats", { cvId, jobDescription }, { timeout: 600000 }).then((r) => r.data),
  compareATS: (cvId1, cvId2, jobDescription) =>
    api.post("/cv/compare-ats", { cvId1, cvId2, jobDescription }, { timeout: 300000 }).then((r) => r.data),
};
