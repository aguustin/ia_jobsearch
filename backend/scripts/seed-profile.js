import "dotenv/config";
import mongoose from "mongoose";
import { config } from "../src/config/index.js";
import { Profile } from "../src/models/Profile.js";

const defaultProfile = {
  name: "Tu Nombre",
  title: "Full Stack Developer",
  email: "tu@email.com",
  location: "Buenos Aires, Argentina",
  summary:
    "Desarrollador Full Stack con experiencia en React, Node.js y bases de datos NoSQL. Apasionado por construir productos escalables y de alta calidad.",
  skills: [
    { name: "JavaScript", level: "expert", years: 4 },
    { name: "TypeScript", level: "advanced", years: 2 },
    { name: "React", level: "expert", years: 4 },
    { name: "Node.js", level: "advanced", years: 3 },
    { name: "MongoDB", level: "advanced", years: 3 },
    { name: "Express", level: "advanced", years: 3 },
    { name: "React Native", level: "intermediate", years: 2 },
    { name: "PostgreSQL", level: "intermediate", years: 2 },
    { name: "Docker", level: "intermediate", years: 2 },
    { name: "Git", level: "advanced", years: 4 },
  ],
  experience: [
    {
      company: "Empresa Anterior",
      role: "Full Stack Developer",
      startDate: "2022-01",
      endDate: "present",
      current: true,
      description:
        "Desarrollo de aplicaciones web con React y Node.js. Implementación de APIs REST. Trabajo con equipos ágiles.",
    },
    {
      company: "Freelance",
      role: "Frontend Developer",
      startDate: "2020-06",
      endDate: "2021-12",
      current: false,
      description:
        "Proyectos freelance de desarrollo web con React y Vue.js para clientes locales e internacionales.",
    },
  ],
  education: [
    {
      institution: "Universidad Nacional",
      degree: "Licenciatura",
      field: "Sistemas de Información",
      year: 2021,
    },
  ],
  languages: [
    { language: "Español", level: "Nativo" },
    { language: "Inglés", level: "B2 - Avanzado" },
  ],
  preferences: {
    roles: [
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "React Developer",
    ],
    technologies: ["React", "Node.js", "TypeScript", "MongoDB", "React Native"],
    remoteOnly: true,
    locations: ["Argentina", "Remote"],
    salaryMin: 3000,
    currency: "USD",
    avoidCompanies: [],
    avoidIndustries: [],
  },
  cvText: `
NOMBRE: Tu Nombre
EMAIL: tu@email.com
LINKEDIN: linkedin.com/in/tunombre

PERFIL PROFESIONAL
Desarrollador Full Stack con 4 años de experiencia en desarrollo web y mobile...

SKILLS TÉCNICAS
- Frontend: React, TypeScript, HTML/CSS, Tailwind
- Backend: Node.js, Express, REST APIs
- Bases de datos: MongoDB, PostgreSQL
- Mobile: React Native
- Herramientas: Git, Docker, AWS básico

EXPERIENCIA
Full Stack Developer - Empresa Anterior (2022 - Presente)
...

EDUCACIÓN
Lic. en Sistemas - Universidad Nacional (2021)
`.trim(),
};

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const existing = await Profile.findOne();
  if (existing) {
    console.log("Profile already exists. Skipping. Edit it via the UI.");
  } else {
    await Profile.create(defaultProfile);
    console.log("Default profile created. Edit it via the UI at /profile");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
