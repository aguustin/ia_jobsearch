import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: String,
    level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] },
    years: Number,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: String,
    email: String,
    location: String,
    summary: String,
    skills: [skillSchema],
    experience: [experienceSchema],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        year: Number,
        _id: false,
      },
    ],
    languages: [
      {
        language: String,
        level: String,
        _id: false,
      },
    ],
    preferences: {
      roles: [String],
      technologies: [String],
      remoteOnly: { type: Boolean, default: true },
      locations: [String],
      salaryMin: Number,
      currency: { type: String, default: "USD" },
      avoidCompanies: [String],
      avoidIndustries: [String],
    },
    cvText: String,
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String,
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
