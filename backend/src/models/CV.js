import mongoose from "mongoose";

const PersonalInfoSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  location: String,
  linkedin: String,
  github: String,
  website: String,
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  role: String,
  company: String,
  startDate: String,
  endDate: String,
  description: String,
  achievements: [String],
}, { _id: false });

const SkillGroupSchema = new mongoose.Schema({
  category: String,
  items: [String],
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  startDate: String,
  endDate: String,
}, { _id: false });

const LanguageSchema = new mongoose.Schema({
  name: String,
  level: String,
  certificateUrl: String,
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
  name: String,
  issuer: String,
  date: String,
  url: String,
}, { _id: false });

const CVSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  rawText: { type: String, required: true },
  parsed: {
    personalInfo: PersonalInfoSchema,
    summary: String,
    experience: [ExperienceSchema],
    skills: [SkillGroupSchema],
    education: [EducationSchema],
    languages: [LanguageSchema],
    certifications: [CertificationSchema],
  },
  uploadedAt: { type: Date, default: Date.now },
});

export const CV = mongoose.model("CV", CVSchema);
