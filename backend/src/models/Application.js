import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "interview", "offer", "rejected", "withdrawn"],
      default: "draft",
    },
    message: String,
    cvVersion: String,
    sentAt: Date,
    interviewAt: Date,
    notes: String,
    contactPerson: String,
    contactEmail: String,
    followUpAt: Date,
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
