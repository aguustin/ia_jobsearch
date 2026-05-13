import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    matchReasons: [String],
    missingSkills: [String],
    highlights: [String],
    concerns: [String],
    summary: String,
    seniority: String,
    estimatedSalary: String,
    analyzedAt: Date,
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    source: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, default: "Unknown" },
    location: { type: String, default: "Remote" },
    remote: { type: Boolean, default: false },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "USD" },
      raw: String,
    },
    tags: [String],
    postedAt: Date,
    fetchedAt: { type: Date, default: Date.now },
    language: { type: String, enum: ["en", "es"], default: "en" },

    analysis: analysisSchema,

    status: {
      type: String,
      enum: ["new", "analyzing", "analyzed", "shortlisted", "applied", "rejected", "archived"],
      default: "new",
    },
    applicationMessage: String,
    cvAdaptations: String,
    interviewPrep: {
      questions: [
        {
          category: { type: String, enum: ["technical", "behavioral", "company"] },
          question: String,
          hint: String,
          practiced: { type: Boolean, default: false },
          _id: false,
        },
      ],
      generatedAt: Date,
    },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

jobSchema.index({ externalId: 1, source: 1 }, { unique: true });
jobSchema.index({ status: 1 });
jobSchema.index({ "analysis.score": -1 });
jobSchema.index({ fetchedAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
