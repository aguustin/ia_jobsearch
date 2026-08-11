/**
 * MASTER PROFILE — Source of Truth for CV Generation
 *
 * This file is the single source of truth for the user's professional profile.
 * It must be consulted before generating or adapting any CV.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * TECHNOLOGY EVIDENCE CATEGORIES
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *   A — Professional Experience
 *       Used in real employment. Present as professional experience.
 *
 *   B — Hands-on / Project
 *       Used in personal, freelance or portfolio projects.
 *       Present in Skills and Projects. NEVER as employment experience.
 *
 *   C — Learning
 *       Currently studying or exploring. Do NOT present as professional experience.
 *       May appear as "currently developing hands-on experience" when relevant.
 *
 *   D — Not Verified
 *       No sufficient evidence. Do NOT include in any CV.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PENDING MARKERS
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *   Fields marked with // PENDING indicate information that should be completed
 *   with real data before use. Never use PENDING data as verified content.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * COMPATIBILITY
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *   This file is ADDITIVE. It does NOT replace userDefaults.js.
 *   Existing defaults continue to work during the migration period.
 *   Phase 2 will connect this profile to the generation pipeline.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TECHNOLOGY EVIDENCE MATRIX
// ─────────────────────────────────────────────────────────────────────────────

export const TECHNOLOGY_EVIDENCE_MATRIX = [

  // ── Languages ───────────────────────────────────────────────────────────────
  {
    name: "JavaScript",
    normalized: "javascript",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz (Feb 2022–present) and DivisionGIS (2020–2022)",
    wording: "Professional experience",
    tags: ["language", "frontend", "backend"],
  },
  {
    name: "TypeScript",
    normalized: "typescript",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + personal projects",
    wording: "Professional experience",
    tags: ["language", "frontend", "backend"],
  },
  {
    name: "PHP",
    normalized: "php",
    category: "A",
    evidence: "Professional at DivisionGIS (Mar 2020 – Feb 2022) — primary language",
    wording: "Professional experience",
    tags: ["language", "backend"],
  },
  {
    name: "Python",
    normalized: "python",
    category: "B",
    evidence: "Personal projects: Task Manager (Django), E-commerce demo. Certification: Udemy 2024",
    wording: "Hands-on / project experience",
    tags: ["language", "backend"],
  },
  {
    name: "HTML5",
    normalized: "html5",
    category: "A",
    evidence: "Fundamental to all professional and personal web development",
    wording: "Professional experience",
    tags: ["language", "frontend"],
  },
  {
    name: "CSS3",
    normalized: "css3",
    category: "A",
    evidence: "Fundamental to all professional and personal web development",
    wording: "Professional experience",
    tags: ["language", "frontend"],
  },
  {
    name: "SQL",
    normalized: "sql",
    category: "A",
    evidence: "MySQL at DivisionGIS (professional), PostgreSQL in personal projects",
    wording: "Professional experience",
    tags: ["language", "database"],
  },

  // ── Frontend Frameworks & Libraries ─────────────────────────────────────────
  {
    name: "React",
    normalized: "react",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + multiple personal projects (SaaS, Security, Lead Gen, Job Search)",
    wording: "Professional experience",
    tags: ["frontend", "framework"],
  },
  {
    name: "Next.js",
    normalized: "nextjs",
    category: "B",
    evidence: "Personal projects: Task Manager (Next.js 14), E-commerce demo",
    wording: "Hands-on / project experience",
    tags: ["frontend", "framework"],
  },
  {
    name: "React Native",
    normalized: "react native",
    category: "B",
    evidence: "Personal project: Security Management Platform. Certification: Udemy 2023",
    wording: "Hands-on / project experience",
    tags: ["mobile", "framework"],
  },
  {
    name: "TailwindCSS",
    normalized: "tailwind",
    category: "B",
    evidence: "Multiple personal projects: Task Manager, E-commerce, Event Platform",
    wording: "Hands-on / project experience",
    tags: ["frontend", "styling"],
  },
  {
    name: "Bootstrap",
    normalized: "bootstrap",
    category: "B",
    evidence: "Used in early personal/professional projects",
    wording: "Experience",
    tags: ["frontend", "styling"],
  },

  // ── Backend Frameworks ───────────────────────────────────────────────────────
  {
    name: "Node.js",
    normalized: "nodejs",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + multiple personal projects (SaaS, Security, Lead Gen, Job Search)",
    wording: "Professional experience",
    tags: ["backend", "runtime"],
  },
  {
    name: "Express.js",
    normalized: "expressjs",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + personal projects",
    wording: "Professional experience",
    tags: ["backend", "framework"],
  },
  {
    name: "Django",
    normalized: "django",
    category: "B",
    evidence: "Personal projects: Task Manager (Django REST Framework + PostgreSQL), E-commerce demo. Certification: Udemy 2024",
    wording: "Hands-on / project experience",
    tags: ["backend", "framework"],
  },
  {
    name: "Django REST Framework",
    normalized: "django rest framework",
    category: "B",
    evidence: "Task Manager project (backend API with DRF + PostgreSQL)",
    wording: "Hands-on / project experience",
    tags: ["backend", "framework", "api"],
  },
  {
    name: "Laravel",
    normalized: "laravel",
    category: "B",
    evidence: "PHP experience at DivisionGIS — Laravel usage not fully confirmed, treat as hands-on",
    wording: "Experience",
    tags: ["backend", "framework"],
  },
  {
    name: "NestJS",
    normalized: "nestjs",
    category: "C",
    evidence: "Familiarity — no verified project evidence",
    wording: "Familiarity",
    tags: ["backend", "framework"],
  },
  {
    name: "FastAPI",
    normalized: "fastapi",
    category: "D",
    evidence: "No verified experience",
    wording: "Do not include",
    tags: ["backend", "framework"],
  },

  // ── Databases ────────────────────────────────────────────────────────────────
  {
    name: "MongoDB",
    normalized: "mongodb",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + multiple personal projects (MERN stack: SaaS Event, Lead Gen, Job Search, Municipal works)",
    wording: "Professional experience",
    tags: ["database", "nosql"],
  },
  {
    name: "PostgreSQL",
    normalized: "postgresql",
    category: "B",
    evidence: "Personal projects: Task Manager, Security Platform",
    wording: "Hands-on / project experience",
    tags: ["database", "sql"],
  },
  {
    name: "MySQL",
    normalized: "mysql",
    category: "A",
    evidence: "Professional at DivisionGIS (2020–2022)",
    wording: "Professional experience",
    tags: ["database", "sql"],
  },
  {
    name: "SQLite",
    normalized: "sqlite",
    category: "C",
    evidence: "Basic familiarity in development contexts",
    wording: "Familiarity",
    tags: ["database", "sql"],
  },
  {
    name: "Redis",
    normalized: "redis",
    category: "C",
    evidence: "Familiarity — no confirmed project implementation",
    wording: "Familiarity",
    tags: ["database", "cache"],
  },

  // ── DevOps / Infrastructure ──────────────────────────────────────────────────
  {
    name: "Docker",
    normalized: "docker",
    category: "A",
    evidence: "Professional workflow at Municipalidad de Godoy Cruz + personal projects (Task Manager, Municipal works)",
    wording: "Experience",
    tags: ["devops", "infrastructure"],
  },
  {
    name: "Docker Compose",
    normalized: "docker compose",
    category: "B",
    evidence: "Personal projects — multi-container setup (Task Manager + PostgreSQL)",
    wording: "Hands-on / project experience",
    tags: ["devops", "infrastructure"],
  },
  {
    name: "Git",
    normalized: "git",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz and DivisionGIS",
    wording: "Professional experience",
    tags: ["devops", "version-control"],
  },
  {
    name: "GitHub",
    normalized: "github",
    category: "A",
    evidence: "Professional + personal project workflows",
    wording: "Professional experience",
    tags: ["devops", "version-control"],
  },
  {
    name: "MinIO",
    normalized: "minio",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz — S3-compatible storage with signed URLs in the municipal works system",
    wording: "Professional experience",
    tags: ["devops", "storage"],
  },
  {
    name: "Vercel",
    normalized: "vercel",
    category: "B",
    evidence: "Personal projects (portfolio, frontend deployments)",
    wording: "Hands-on / project experience",
    tags: ["devops", "hosting"],
  },
  {
    name: "Nginx",
    normalized: "nginx",
    category: "C",
    evidence: "Basic familiarity in Docker/server contexts — not primary responsibility",
    wording: "Familiarity",
    tags: ["devops", "infrastructure"],
  },
  {
    name: "CI/CD",
    normalized: "cicd",
    category: "C",
    evidence: "Understanding of concepts — no production CI/CD pipeline as primary responsibility",
    wording: "Familiarity",
    tags: ["devops", "methodology"],
  },

  // ── Cloud (LEARNING ONLY — never present as professional/production) ─────────
  {
    name: "AWS",
    normalized: "aws",
    category: "C",
    evidence: "Currently learning. No production experience.",
    wording: "Currently developing hands-on experience — do NOT claim production experience",
    tags: ["cloud"],
  },
  {
    name: "Google Cloud",
    normalized: "google cloud",
    category: "C",
    evidence: "Currently learning. No production experience.",
    wording: "Currently developing hands-on experience — do NOT claim production experience",
    tags: ["cloud"],
  },
  {
    name: "Azure",
    normalized: "azure",
    category: "C",
    evidence: "Currently learning. No production experience.",
    wording: "Currently developing hands-on experience — do NOT claim production experience",
    tags: ["cloud"],
  },
  {
    name: "Linux",
    normalized: "linux",
    category: "C",
    evidence: "Basic server/command-line usage in development context — not system administration level",
    wording: "Development context familiarity",
    tags: ["infrastructure"],
  },
  {
    name: "Kubernetes",
    normalized: "kubernetes",
    category: "D",
    evidence: "No verified experience",
    wording: "Do not include",
    tags: ["devops", "infrastructure"],
  },
  {
    name: "Terraform",
    normalized: "terraform",
    category: "D",
    evidence: "No verified experience",
    wording: "Do not include",
    tags: ["devops", "infrastructure"],
  },

  // ── Tools ────────────────────────────────────────────────────────────────────
  {
    name: "Postman",
    normalized: "postman",
    category: "A",
    evidence: "API testing in professional and personal workflows",
    wording: "Experience",
    tags: ["tools"],
  },
  {
    name: "VS Code",
    normalized: "vs code",
    category: "A",
    evidence: "Primary IDE",
    wording: "Experience",
    tags: ["tools"],
  },
  {
    name: "Figma",
    normalized: "figma",
    category: "B",
    evidence: "UI design reference in development projects",
    wording: "Experience",
    tags: ["tools", "design"],
  },
  {
    name: "Jira",
    normalized: "jira",
    category: "B",
    evidence: "Project management tool usage in development workflows",
    wording: "Experience",
    tags: ["tools", "methodology"],
  },

  // ── Auth / APIs ───────────────────────────────────────────────────────────────
  {
    name: "JWT",
    normalized: "jwt",
    category: "B",
    evidence: "Personal projects: SaaS Event Platform, Municipal works system, Security Platform",
    wording: "Hands-on / project experience",
    tags: ["auth", "backend"],
  },
  {
    name: "REST APIs",
    normalized: "rest api",
    category: "A",
    evidence: "Professional at Municipalidad de Godoy Cruz + all personal projects",
    wording: "Professional experience",
    tags: ["backend", "api"],
  },
  {
    name: "OAuth",
    normalized: "oauth",
    category: "C",
    evidence: "Familiarity — not primary auth in confirmed projects",
    wording: "Familiarity",
    tags: ["auth"],
  },
  {
    name: "GraphQL",
    normalized: "graphql",
    category: "C",
    evidence: "Familiarity — not used as primary API style in confirmed projects",
    wording: "Familiarity",
    tags: ["backend", "api"],
  },
  {
    name: "WebSockets",
    normalized: "websocket",
    category: "B",
    evidence: "Security Platform via Socket.io (real-time communication + emergency alerts)",
    wording: "Hands-on / project experience",
    tags: ["backend", "realtime"],
  },

  // ── Mobile ────────────────────────────────────────────────────────────────────
  {
    name: "Expo",
    normalized: "expo",
    category: "B",
    evidence: "Security Management Platform (React Native / Expo). Certification: Udemy 2023",
    wording: "Hands-on / project experience",
    tags: ["mobile"],
  },

  // ── Real-time ─────────────────────────────────────────────────────────────────
  {
    name: "Socket.io",
    normalized: "socketio",
    category: "B",
    evidence: "Security Management Platform — real-time location, emergency alerts, internal chat",
    wording: "Hands-on / project experience",
    tags: ["backend", "realtime"],
  },

  // ── Media / Storage ───────────────────────────────────────────────────────────
  {
    name: "Cloudinary",
    normalized: "cloudinary",
    category: "B",
    evidence: "Task Manager project (file attachments in tasks)",
    wording: "Hands-on / project experience",
    tags: ["storage", "media"],
  },
  {
    name: "S3",
    normalized: "s3",
    category: "A",
    evidence: "MinIO (S3-compatible) used professionally at Municipalidad de Godoy Cruz",
    wording: "Experience via S3-compatible (MinIO)",
    tags: ["storage", "cloud"],
  },

  // ── Payments ──────────────────────────────────────────────────────────────────
  {
    name: "Mercado Pago",
    normalized: "mercado pago",
    category: "B",
    evidence: "SaaS Event Management / Ticketing Platform — full payment flow with webhooks",
    wording: "Hands-on / project experience",
    tags: ["payments"],
  },

  // ── AI / ML Tools ─────────────────────────────────────────────────────────────
  {
    name: "Claude API",
    normalized: "claude",
    category: "B",
    evidence: "Personal projects: AI Job Search platform (keyword extraction, CV optimization), AI Lead Generation",
    wording: "Hands-on / project experience",
    tags: ["ai", "llm"],
  },
  {
    name: "Ollama",
    normalized: "ollama",
    category: "B",
    evidence: "AI Job Search platform — local LLM inference for CV translation",
    wording: "Hands-on / project experience",
    tags: ["ai", "llm"],
  },
  {
    name: "Gemini",
    normalized: "gemini",
    category: "B",
    evidence: "Used in personal AI projects and development workflow",
    wording: "Hands-on / project experience",
    tags: ["ai", "llm"],
  },
  {
    name: "face-api.js",
    normalized: "face-api",
    category: "B",
    evidence: "Security Platform: facial biometric authentication for guard check-in/check-out",
    wording: "Hands-on / project experience",
    tags: ["ai", "ml", "mobile"],
  },
  {
    name: "TensorFlow.js",
    normalized: "tensorflowjs",
    category: "B",
    evidence: "Security Platform: underlying engine for face-api.js biometric auth",
    wording: "Hands-on / project experience",
    tags: ["ai", "ml"],
  },
  {
    name: "Hugging Face",
    normalized: "hugging face",
    category: "C",
    evidence: "Familiarity — used in development workflow, no confirmed project implementation",
    wording: "Familiarity",
    tags: ["ai", "ml"],
  },

  // ── Methodologies ─────────────────────────────────────────────────────────────
  {
    name: "Scrum",
    normalized: "scrum",
    category: "B",
    evidence: "Certification: Kodigo 2023. Methodology experience in projects.",
    wording: "Certified / Experience",
    tags: ["methodology"],
  },
  {
    name: "Kanban",
    normalized: "kanban",
    category: "B",
    evidence: "Workflow methodology in personal and professional projects",
    wording: "Experience",
    tags: ["methodology"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Technology Evidence Lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the evidence record for a given technology name.
 * Matches by normalized name or exact name (case-insensitive).
 */
export function getTechnologyEvidence(techName) {
  if (!techName) return null;
  const lower = techName.toLowerCase().replace(/[.\-_]/g, "").replace(/\s+/g, " ").trim();
  return TECHNOLOGY_EVIDENCE_MATRIX.find(
    (t) => t.normalized === lower || t.name.toLowerCase() === techName.toLowerCase()
  ) || null;
}

/**
 * Returns true if the technology can be included in a CV given a minimum category.
 * Default: "B" — allows A and B, blocks C and D.
 * Use "C" to also allow learning-stage technologies (e.g. for Learning sections).
 */
export function canIncludeTechnology(techName, minCategory = "B") {
  const ORDER = ["A", "B", "C", "D"];
  const tech = getTechnologyEvidence(techName);
  if (!tech) return false;
  return ORDER.indexOf(tech.category) <= ORDER.indexOf(minCategory);
}

/**
 * Convenience grouping of technologies by category.
 */
export const TECHNOLOGY_CATEGORIES = {
  A: TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "A"),
  B: TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "B"),
  C: TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "C"),
  D: TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "D"),
};

// ─────────────────────────────────────────────────────────────────────────────
// MASTER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const MASTER_PROFILE = {

  // ── Personal Info ────────────────────────────────────────────────────────────
  personalInfo: {
    name:      "Agustín Molé",
    location:  "Mendoza, Argentina",
    email:     "agustin.molee@gmail.com",
    linkedin:  "https://www.linkedin.com/in/agust%C3%ADn-mol%C3%A9-barolo-b042141b1/",
    github:    "https://github.com/aguustin",
    portfolio: "portfolioc-two.vercel.app",
  },

  // ── Professional Positioning ─────────────────────────────────────────────────
  positioning: {
    mainTitle:        "Full Stack Developer",
    yearsExperience:  6,
    coreStack:        ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Django"],
    primaryDomain:    "Full Stack Web Development",
    secondaryDomains: ["SaaS Platforms", "AI-powered Applications", "REST APIs", "Mobile (React Native)", "Automation"],

    // Title variants — adapt to job description
    // Rule: never add "Senior" without justification from evidence
    titleVariants: {
      fullstack: "Full Stack Developer",
      backend:   "Backend Developer",
      frontend:  "Frontend Developer",
      react:     "React Developer",
      python:    "Full Stack Developer | Python · Django",
      node:      "Backend Developer | Node.js · TypeScript",
      mobile:    "Full Stack Developer | React Native",
      ai:        "Full Stack Developer | AI Applications",
      engineer:  "Software Engineer",
    },
  },

  // ── Summary Variants ─────────────────────────────────────────────────────────
  // Concise, honest summaries adapted by job type.
  // Rules:
  //   - Max ~4-6 lines
  //   - Answer: who, years of experience, main stack, systems built, value
  //   - No generic phrases ("passionate about technology", etc.)
  //   - Only technologies with A or B evidence
  summaryVariants: {
    default:
      "Desarrollador Web Full Stack con más de 6 años de experiencia construyendo aplicaciones web y móviles para el sector público y privado. " +
      "Especializado en TypeScript, React, Node.js y Python/Django, con experiencia en plataformas SaaS, REST APIs, integraciones de pago y automatización con IA. " +
      "He construido soluciones end-to-end de manera autónoma y en empleo, cubriendo frontend, backend, arquitectura y bases de datos.",

    fullstack:
      "Desarrollador Web Full Stack con más de 6 años de experiencia diseñando y desarrollando aplicaciones web y móviles escalables. " +
      "Especializado en TypeScript, React, Next.js, Node.js y Python/Django, con experiencia en plataformas SaaS, APIs REST, " +
      "integraciones de pago, aplicaciones en tiempo real y automatización con IA. " +
      "He desarrollado soluciones completas de manera autónoma y en entornos laborales para el sector público y privado.",

    backend:
      "Desarrollador Full Stack con más de 6 años de experiencia y especialización en backend, APIs REST y arquitectura de sistemas. " +
      "Experiencia profesional en Node.js, Express.js y TypeScript, con conocimiento práctico de Python y Django. " +
      "He construido APIs de producción, sistemas de gestión con control de roles, integración de almacenamiento S3 (MinIO) y flujos de autenticación JWT, " +
      "utilizando MongoDB, PostgreSQL y MySQL.",

    frontend:
      "Desarrollador Full Stack con más de 6 años de experiencia y especialización en frontend con React y TypeScript. " +
      "He construido interfaces responsivas, sistemas de gestión con roles, drag & drop, integración de APIs REST y flujos de autenticación " +
      "en empleo profesional y proyectos propios. " +
      "Complemento el frontend con experiencia en backend Node.js y APIs Express.js.",

    react:
      "Desarrollador Full Stack con más de 6 años de experiencia y especialización en React, TypeScript y Next.js. " +
      "He construido aplicaciones web completas — desde interfaces React hasta APIs Node.js — incluyendo plataformas SaaS, " +
      "sistemas de gestión con control de acceso e integraciones de pago con Mercado Pago. " +
      "Complemento con experiencia en backend Python/Django y conocimiento en aplicaciones mobile con React Native.",

    python:
      "Desarrollador Full Stack con más de 6 años de experiencia y conocimiento práctico en Python, Django y Django REST Framework. " +
      "He construido plataformas colaborativas con Django + PostgreSQL + Docker, combinadas con frontends Next.js modernos. " +
      "Complemento con experiencia profesional en Node.js, Express.js y TypeScript/JavaScript en entorno laboral.",

    ai:
      "Desarrollador Full Stack con más de 6 años de experiencia especializado en aplicaciones con IA y automatización de procesos. " +
      "He integrado LLMs (Claude API, Ollama, Gemini) en plataformas de búsqueda laboral, generación de leads, " +
      "análisis de documentos PDF y optimización de CVs. " +
      "Stack principal: React, Node.js, Python, con arquitecturas orientadas a SaaS y productos impulsados por IA.",

    mobile:
      "Desarrollador Full Stack con más de 6 años de experiencia en aplicaciones web y móviles. " +
      "He construido una aplicación React Native / Expo con autenticación biométrica facial (face-api.js / TensorFlow.js), " +
      "monitoreo en tiempo real (Socket.io), alertas de emergencia y dashboard administrativo. " +
      "Complemento con backend Node.js, PostgreSQL y arquitecturas REST API completas.",
  },

  // ── Professional Experience ───────────────────────────────────────────────────
  experience: [
    {
      id:            "municipalidad-godoy-cruz",
      role:          "Desarrollador Web Full Stack",
      company:       "Municipalidad de Godoy Cruz",
      location:      "Mendoza, Argentina",
      startDate:     "Feb 2022",
      endDate:       "Presente",
      type:          "employment",
      evidenceLevel: "A",
      technologies:  ["JavaScript", "TypeScript", "React", "Node.js", "Express.js", "MongoDB", "Docker", "MinIO", "JWT", "REST APIs", "Git"],

      // Verified achievements — based on confirmed responsibilities and the municipal works system.
      // No invented metrics. Impact described technically or functionally.
      achievements: [
        "Desarrollé y mantuve aplicaciones web full stack para el sector público, utilizando React y TypeScript en frontend y Node.js con Express.js en backend.",
        "Diseñé e implementé REST APIs para sistemas internos de gestión municipal con autenticación JWT y control de acceso por roles.",
        "Construí plataforma de gestión de planos técnicos con flujo de estados de trámite (presentado → en revisión → observado → pre-aprobado), versionado de documentos y notificaciones por email.",
        "Implementé almacenamiento seguro de archivos con MinIO (S3-compatible), generación de URLs firmadas para descarga y compresión de PDFs.",
        "Integré análisis de documentos PDF con IA para asistencia en la revisión técnica de planos.",
        "Mantuve y evoluccioné aplicaciones existentes, analizando e implementando nuevos requerimientos del área municipal.",
      ],

      // The key project integrated in this experience
      // (Should NOT be duplicated in the projects section)
      keyProject: {
        name:         "Sistema de gestión de planos técnicos municipales",
        description:  "Plataforma integral para la gestión de trámites de obras. Incluye control de acceso por roles (profesional, técnico, administrador), versionado de planos, workflow de estados, notificaciones por email, procesamiento de PDFs, almacenamiento seguro en MinIO/S3 y análisis asistido por IA.",
        technologies: ["React", "Node.js", "Express.js", "MongoDB", "MinIO", "Docker", "JWT", "REST APIs"],
      },

      useStrategically: "Always — primary and most recent professional experience. Prioritize when job requires public sector, management systems, REST APIs, Node.js, React, MongoDB, Docker or S3-compatible storage.",
    },

    {
      id:            "casa-del-futuro",
      role:          "Profesor de Programación",
      company:       "Casa del Futuro",
      location:      "Mendoza, Argentina",
      startDate:     "Jul 2025",
      endDate:       "Presente",
      type:          "employment",
      evidenceLevel: "A",
      technologies:  ["JavaScript", "Python", "programming fundamentals", "web development"],

      achievements: [
        "Enseño programación y desarrollo de software, preparando contenido práctico orientado a tecnologías modernas.",
        "Guío a estudiantes en resolución de problemas, debugging y desarrollo de sus primeras aplicaciones.",
        "Explico conceptos de programación y buenas prácticas de desarrollo adaptando el contenido al nivel del grupo.",
      ],

      useStrategically: "Include when position values: mentoring, technical communication, knowledge sharing, leadership, training. Do NOT feature prominently in pure technical CVs unless the role has an education or leadership component.",
    },

    {
      id:            "division-gis",
      role:          "Desarrollador PHP",
      company:       "DivisionGIS",
      location:      "Mendoza, Argentina",
      startDate:     "Mar 2020",
      endDate:       "Feb 2022",
      type:          "employment",
      evidenceLevel: "A",
      technologies:  ["PHP", "JavaScript", "MySQL", "Git", "HTML", "CSS"],

      achievements: [
        "Desarrollé y mantuve aplicaciones web con PHP y JavaScript, implementando nuevas funcionalidades según requerimientos del cliente.",
        "Realicé bug fixing, troubleshooting y evolución de sistemas existentes.",
        "Trabajé con bases de datos relacionales para desarrollo de soluciones de gestión.",
        "Participé en desarrollo colaborativo utilizando Git.",
      ],

      useStrategically: "Include as foundational experience. Emphasize when role values PHP, legacy systems, or strong web fundamentals. Summarize to 1-2 bullets when more recent experience is more relevant.",
    },
  ],

  // ── Projects ─────────────────────────────────────────────────────────────────
  // Metadata enables adaptive selection based on job type.
  // roleTypes: fullstack | backend | frontend | mobile | ai | saas | ecommerce | realtime | api | automation
  // strength:  high | medium | low  (how strong is this as supporting evidence)
  // evidenceLevel: A (professional) | B (personal/hands-on)
  projects: [
    {
      id:           "saas-event-ticketing",
      name:         "Plataforma SaaS de gestión de eventos y venta de entradas",
      stack:        "MERN Stack · Mercado Pago API · JWT",
      description:  "Plataforma completa para gestión de eventos con venta de entradas y procesamiento de pagos end-to-end integrado a Mercado Pago. Incluye manejo de webhooks, control de capacidad, administración de usuarios y trabajadores, y autenticación JWT.",
      technologies: ["React", "Node.js", "Express.js", "MongoDB", "TailwindCSS", "Mercado Pago", "JWT", "REST APIs"],
      roleTypes:    ["fullstack", "backend", "saas", "ecommerce", "api"],
      evidenceLevel: "B",
      strength:     "high",
      aiAssisted:   false,
      achievements: [
        "Desarrollé sistema completo de venta y gestión de entradas con flujo de pago end-to-end integrado a Mercado Pago.",
        "Implementé manejo de webhooks y confirmaciones de pago para garantizar consistencia transaccional.",
        "Construí administración de eventos con control de capacidad, disponibilidad y gestión de usuarios.",
        "Aseguré la autenticación y autorización con JWT, protegiendo rutas sensibles de administración.",
      ],
      warnings:     [],
      prioritize:   ["fullstack", "backend", "saas", "ecommerce", "api", "payment"],
      deprioritize: ["ai", "mobile", "frontend-only"],
    },

    {
      id:           "task-manager-collaborative",
      name:         "Gestor de tareas colaborativo con tableros Kanban",
      stack:        "Next.js 14 · React 18 · Python · Django · PostgreSQL · Docker",
      description:  "Plataforma colaborativa con tableros Kanban, drag & drop, actualizaciones optimistas, compartición de listas por email, comentarios por tarea, notificaciones y adjuntos de archivos. Backend Django REST Framework + PostgreSQL, frontend Next.js 14 con TailwindCSS, contenerizado con Docker.",
      technologies: ["Python", "Django", "Django REST Framework", "PostgreSQL", "Next.js", "React", "TailwindCSS", "Docker", "Cloudinary"],
      roleTypes:    ["fullstack", "backend", "api"],
      evidenceLevel: "B",
      strength:     "high",
      aiAssisted:   false,
      achievements: [
        "Desarrollé drag & drop visual entre columnas Kanban con actualizaciones optimistas en tiempo real para una UX fluida.",
        "Implementé compartición de listas por email y sistema de comentarios por tarea con notificaciones.",
        "Contenerizé la aplicación con Docker y gestioné archivos adjuntos en tareas mediante Cloudinary.",
        "Arquitecturé backend desacoplado con Django REST Framework + PostgreSQL y frontend en Next.js 14 con TailwindCSS.",
      ],
      warnings:     [],
      prioritize:   ["fullstack", "backend", "python", "api"],
      deprioritize: ["mobile", "ai", "ecommerce"],
    },

    {
      id:           "ecommerce-clothing-demo",
      name:         "Plataforma de e-commerce de ropa (demo)",
      stack:        "Python · Django · Next.js · TailwindCSS",
      description:  "Aplicación de e-commerce para búsqueda, filtrado y gestión de productos, carrito de compras y checkout simulado con control de acceso por roles.",
      technologies: ["Python", "Django", "Next.js", "React", "TailwindCSS"],
      roleTypes:    ["fullstack", "frontend", "ecommerce"],
      evidenceLevel: "B",
      strength:     "medium",
      aiAssisted:   false,
      achievements: [
        "Construí catálogo de productos con búsqueda, filtrado por categoría y gestión CRUD con control de acceso por roles.",
        "Implementé carrito de compras y flujo de checkout simulado (sin pago real).",
        "Diseñé interfaz responsiva con Next.js y TailwindCSS.",
      ],
      // IMPORTANT: never claim real payment integration for this project
      warnings: ["NO real payment integration — checkout is simulated only. Never claim real payment processing."],
      prioritize:   ["frontend", "ecommerce", "python", "fullstack"],
      deprioritize: ["backend-heavy", "mobile", "ai", "realtime"],
    },

    {
      id:           "twitter-clone",
      name:         "Twitter / X Clone",
      stack:        "", // PENDING: Confirm exact stack
      description:  "Aplicación Full Stack desarrollada desde cero replicando funcionalidades principales de Twitter/X: autenticación, feed, interacciones sociales y perfiles de usuario.",
      technologies: [], // PENDING: Specify exact technologies used
      roleTypes:    ["fullstack", "frontend", "backend", "api"],
      evidenceLevel: "B",
      strength:     "low",
      aiAssisted:   false,
      achievements: [
        "Construí funcionalidades sociales: feed, follows, likes e interacciones entre usuarios.",
        "Implementé autenticación y autorización desde cero.",
        "Diseñé arquitectura Full Stack completa de la aplicación.",
      ],
      warnings:  [],
      _pending:  "Stack not fully confirmed. Verify and add specific technologies. Low priority — include only when stronger projects are not available.",
      prioritize:   ["fullstack", "frontend"],
      deprioritize: ["backend-heavy", "ai", "mobile", "saas"],
    },

    {
      id:           "security-platform",
      name:         "Sistema de gestión de seguridad para barrios privados",
      stack:        "React Native · Expo · Node.js · PostgreSQL · Socket.io · face-api.js",
      description:  "Plataforma de gestión de seguridad con autenticación biométrica facial, monitoreo de ubicación en tiempo real, alertas de emergencia, check-in/check-out de guardias, chat interno, dashboard administrativo y gestión de finanzas. Desarrollado con workflow de ingeniería AI-assisted.",
      technologies: ["React Native", "Expo", "Node.js", "PostgreSQL", "Socket.io", "face-api.js", "TensorFlow.js", "JWT", "REST APIs"],
      roleTypes:    ["fullstack", "backend", "mobile", "realtime", "api"],
      evidenceLevel: "B",
      strength:     "high",
      aiAssisted:   true,
      aiDescription: "Developed using an AI-assisted engineering workflow, with architecture, implementation decisions, validation and iteration directed by me.",
      achievements: [
        "Implementé reconocimiento facial biométrico con face-api.js (TensorFlow.js) para registro de ingreso/egreso de turno de guardias.",
        "Desarrollé monitoreo de ubicaciones en tiempo real y sistema de alertas de emergencia con Socket.io entre vecinos y seguridad.",
        "Construí verificaciones periódicas automáticas para guardias en turno y chat interno en tiempo real.",
        "Diseñé dashboard administrativo para gestión de finanzas, estadísticas y control de acceso del barrio.",
      ],
      warnings:     [],
      prioritize:   ["mobile", "realtime", "backend", "fullstack"],
      deprioritize: ["frontend-only", "ai-llm", "ecommerce"],
    },

    {
      id:           "ai-lead-generation",
      name:         "Plataforma de generación automática de leads con IA",
      stack:        "React · Node.js · MongoDB · APIs de scraping · IA",
      description:  "Sistema de automatización para captación de leads: búsqueda de negocios por nicho, recopilación de datos de contacto desde múltiples fuentes, generación de insights comerciales con IA y sugerencias de outreach personalizadas.",
      technologies: ["React", "Node.js", "MongoDB", "REST APIs", "Claude API", "AI/LLM integration", "Web scraping"],
      roleTypes:    ["fullstack", "backend", "ai", "automation", "saas", "api"],
      evidenceLevel: "B",
      strength:     "high",
      aiAssisted:   true,
      aiDescription: "Developed using an AI-assisted engineering workflow.",
      achievements: [
        "Automaticé la captación de leads buscando negocios por nicho y recopilando datos de contacto desde múltiples fuentes.",
        "Integré IA generativa para generar insights comerciales y sugerencias de acercamiento personalizadas por lead.",
        "Implementé exportación estructurada de resultados con filtros por industria y ubicación.",
      ],
      warnings:     [],
      prioritize:   ["ai", "automation", "backend", "saas", "fullstack"],
      deprioritize: ["mobile", "frontend-only", "ecommerce"],
    },

    {
      id:           "ai-job-search",
      name:         "Plataforma SaaS de búsqueda laboral con IA",
      stack:        "MERN Stack · IA generativa · APIs externas · Anthropic Claude · Ollama",
      description:  "Plataforma que agrega ofertas laborales desde múltiples fuentes externas (APIs y scrapers), aplica ranking y análisis de compatibilidad con IA generativa, y ofrece generación de CVs ATS-optimizados adaptados a cada oferta.",
      technologies: ["React", "Node.js", "Express.js", "MongoDB", "REST APIs", "Claude API", "Ollama", "AI/LLM integration"],
      roleTypes:    ["fullstack", "backend", "ai", "automation", "saas", "api"],
      evidenceLevel: "B",
      strength:     "high",
      aiAssisted:   true,
      aiDescription: "Developed using an AI-assisted engineering workflow.",
      achievements: [
        "Centralicé ofertas laborales desde múltiples fuentes externas integrando APIs y scrapers.",
        "Implementé sistema de recomendación con IA generativa para filtrar y rankear vacantes según el perfil del usuario.",
        "Desarrollé análisis automático de vacantes que evalúa compatibilidad y sugiere mejoras al CV.",
        "Diseñé arquitectura full-stack escalable con React, Node.js, Express y MongoDB.",
      ],
      warnings:     [],
      prioritize:   ["ai", "automation", "saas", "backend", "fullstack"],
      deprioritize: ["mobile", "frontend-only", "ecommerce"],
    },

    // ── Professional Project — should be integrated into Municipalidad experience ──
    {
      id:           "municipal-works-system",
      name:         "Sistema de gestión de obras técnicas para municipio con IA",
      stack:        "React · Node.js · MongoDB · MinIO (S3) · Docker · JWT",
      description:  "Plataforma profesional desarrollada en la Municipalidad de Godoy Cruz para la gestión de trámites de planos técnicos. Control de acceso por roles, versionado, workflow de estados, notificaciones, almacenamiento S3 y análisis IA de documentos PDF.",
      technologies: ["React", "Node.js", "Express.js", "MongoDB", "MinIO", "Docker", "JWT", "REST APIs"],
      roleTypes:    ["fullstack", "backend", "saas", "api", "ai"],
      evidenceLevel: "A",
      strength:     "high",
      aiAssisted:   false,
      achievements: [
        "Desarrollé plataforma de gestión de planos técnicos con control de acceso por roles (profesional / técnico / administrador).",
        "Integré IA para analizar versiones de planos PDF y generar sugerencias automáticas de corrección de errores técnicos.",
        "Implementé versionado de planos y sistema de estados del trámite con notificaciones por email.",
        "Configuré almacenamiento seguro con MinIO (S3), descarga con URLs firmadas y compresión de PDFs.",
      ],
      warnings: [
        "Professional project — belongs in Municipalidad de Godoy Cruz experience entry, not as a standalone personal project.",
        "Avoid duplicating the same content in both Professional Experience and Projects sections.",
      ],
      prioritize:   ["fullstack", "backend", "saas", "api", "ai"],
      deprioritize: ["mobile", "ecommerce", "frontend-only"],
    },

    // ── Projects with incomplete information — marked PENDING ─────────────────

    {
      id:           "saas-store-management",
      name:         "SaaS de gestión de tiendas",
      stack:        "", // PENDING
      description:  "", // PENDING
      technologies: [], // PENDING
      roleTypes:    ["fullstack", "saas"], // preliminary
      evidenceLevel: "B",
      strength:     "unknown",
      aiAssisted:   false,
      achievements: [], // PENDING
      warnings:     [],
      _pending:     "Project details not documented. Add: description, stack, main features, achievements.",
      prioritize:   [],
      deprioritize: [],
    },

    {
      id:           "commercial-proposal-generator",
      name:         "Generador de propuestas comerciales",
      stack:        "", // PENDING
      description:  "", // PENDING
      technologies: [], // PENDING
      roleTypes:    ["fullstack", "saas", "automation"], // preliminary
      evidenceLevel: "B",
      strength:     "unknown",
      aiAssisted:   false,
      achievements: [], // PENDING
      warnings:     [],
      _pending:     "Project details not documented. Add: description, stack, main features, achievements.",
      prioritize:   [],
      deprioritize: [],
    },

    {
      id:           "ai-niche-platform",
      name:         "Plataforma IA orientada a nichos / productización",
      stack:        "", // PENDING
      description:  "", // PENDING — clarify if distinct from AI Lead Generation
      technologies: [], // PENDING
      roleTypes:    ["ai", "automation", "saas"], // preliminary
      evidenceLevel: "B",
      strength:     "unknown",
      aiAssisted:   true,
      achievements: [], // PENDING
      warnings:     [],
      _pending:     "Project details not documented. Clarify if distinct from AI Lead Generation Platform.",
      prioritize:   [],
      deprioritize: [],
    },
  ],

  // ── Education ────────────────────────────────────────────────────────────────
  education: [
    {
      degree:      "Desarrollador Web Full Stack",
      institution: "Udemy",
      startDate:   "Feb 2020",
      endDate:     "Ago 2020",
      relevantFor: ["fullstack", "general"],
    },
    {
      degree:      "Desarrollador ReactJS + Firebase",
      institution: "Coderhouse",
      startDate:   "May 2021",
      endDate:     "Nov 2021",
      relevantFor: ["frontend", "react"],
    },
    {
      degree:      "Desarrollador Móvil con React Native",
      institution: "Udemy",
      startDate:   "Mar 2023",
      endDate:     "Jul 2023",
      relevantFor: ["mobile", "react native"],
    },
    {
      degree:      "SCRUM",
      institution: "Kodigo",
      startDate:   "May 2023",
      endDate:     "Jul 2023",
      relevantFor: ["methodology", "agile"],
    },
    {
      degree:      "Desarrollador Python + Django",
      institution: "Udemy",
      startDate:   "Ago 2024",
      endDate:     "Nov 2024",
      relevantFor: ["python", "backend", "django"],
    },
  ],

  // ── Certifications ───────────────────────────────────────────────────────────
  certifications: [
    {
      name:        "Desarrollador Móvil con React Native",
      issuer:      "Udemy",
      date:        "Mar 2023 – Jul 2023",
      url:         "https://www.udemy.com/certificate/UC-b09fde1b-84a0-4db4-bad3-01e2c19be3d2/",
      relevantFor: ["mobile", "react native"],
    },
    {
      name:        "Desarrollador ReactJS + Firebase",
      issuer:      "Coderhouse",
      date:        "May 2021 – Nov 2021",
      url:         "https://postimg.cc/gallery/WqGLR3C",
      relevantFor: ["frontend", "react"],
    },
    {
      name:        "Desarrollador Web Full Stack",
      issuer:      "Udemy",
      date:        "Feb 2020 – Ago 2020",
      url:         "https://www.udemy.com/certificate/UC-09B65a8b-e7b2-47af-824e-f0d66d218253/",
      relevantFor: ["fullstack", "general"],
    },
    {
      name:        "SCRUM",
      issuer:      "Kodigo",
      date:        "May 2023 – Jul 2023",
      url:         "https://postimg.cc/gallery/WqGLR3C",
      relevantFor: ["methodology", "agile"],
    },
    {
      name:        "Desarrollador Python + Django",
      issuer:      "Udemy",
      date:        "Ago 2024 – Nov 2024",
      url:         null, // certificate URL not yet available
      relevantFor: ["python", "backend", "django"],
    },
  ],

  // ── Languages ────────────────────────────────────────────────────────────────
  languages: [
    {
      name:           "Español",
      level:          "Nativo",
      certificateUrl: null,
    },
    {
      name:           "Inglés",
      level:          "B2 - Avanzado",
      certificateUrl: "https://cert.efset.org/en/G1QU2J",
      // Do not represent as C1/C2 or "Fluent" without additional evidence
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Project Selection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns projects that match a given role type, excluding PENDING projects
 * (those with empty achievements or a _pending marker), sorted by strength.
 */
export function getProjectsForRoleType(roleType) {
  const STRENGTH_ORDER = { high: 0, medium: 1, low: 2, unknown: 3 };
  return MASTER_PROFILE.projects
    .filter(
      (p) =>
        !p._pending &&
        p.achievements.length > 0 &&
        p.roleTypes.includes(roleType)
    )
    .sort(
      (a, b) => (STRENGTH_ORDER[a.strength] ?? 3) - (STRENGTH_ORDER[b.strength] ?? 3)
    );
}

/**
 * Returns the top N projects for a role type, applying prioritize/deprioritize hints.
 * Projects that explicitly deprioritize this roleType are moved to the end.
 */
export function selectProjects(roleType, maxCount = 5) {
  const all = MASTER_PROFILE.projects.filter(
    (p) => !p._pending && p.achievements.length > 0
  );

  const STRENGTH_ORDER = { high: 0, medium: 1, low: 2, unknown: 3 };

  const scored = all.map((p) => {
    let score = STRENGTH_ORDER[p.strength] ?? 3;
    if (p.prioritize.includes(roleType)) score -= 2;
    if (p.deprioritize.includes(roleType)) score += 3;
    return { ...p, _score: score };
  });

  return scored
    .sort((a, b) => a._score - b._score)
    .slice(0, maxCount)
    .map(({ _score, ...p }) => p); // remove internal score field
}
