// Default personal info applied when generated CV fields are empty
export const DEFAULT_PERSONAL_INFO = {
  location:  "Mendoza, Argentina",
  linkedin:  "https://www.linkedin.com/in/agust%C3%ADn-mol%C3%A9-barolo-b042141b1/",
  github:    "https://github.com/aguustin",
  portfolio: "portfolioc-two.vercel.app",
};

// Default skill categories (used when Ollama and regex fallback return nothing)
export const DEFAULT_SKILL_CATEGORIES = [
  { category: "Frontend",        items: ["React", "Next.js", "React Native", "TypeScript", "JavaScript", "HTML5", "CSS3", "TailwindCSS", "Expo"] },
  { category: "Backend",         items: ["Node.js", "Express.js", "Python", "Django", "PHP", "REST API", "JWT", "Socket.io"] },
  { category: "Base de datos",   items: ["MongoDB", "PostgreSQL", "MySQL"] },
  { category: "DevOps",          items: ["Docker", "Git", "GitHub", "Vercel", "MinIO"] },
  { category: "Herramientas",    items: ["Postman", "VS Code", "Figma", "Jira"] },
  { category: "Stack adicional", items: [] },
];

// Default summary used when Ollama doesn't generate one
export const DEFAULT_SUMMARY = "Desarrollador Web Full Stack con más de 6 años de experiencia en el diseño, desarrollo e implementación de aplicaciones web y móviles escalables, modernas y orientadas a negocio. Especializado en JavaScript/TypeScript y ecosistemas React (ReactJS, Next.js, React Native) junto con desarrollo backend en Node.js, Python/Django y PHP. Experiencia desarrollando plataformas SaaS, sistemas de automatización con IA, aplicaciones mobile, integraciones con APIs externas y pasarelas de pago.\n\nHe liderado y desarrollado de forma autónoma soluciones full stack para el sector público y privado, incluyendo sistemas de gestión, plataformas con inteligencia artificial, aplicaciones en tiempo real y herramientas de automatización de procesos. Manejo de tecnologías modernas como MongoDB, PostgreSQL, JWT, TailwindCSS, Docker, GitHub y Postman, con enfoque en arquitectura escalable, experiencia de usuario y desarrollo ágil orientado a resultados.";

// Certifications always included in every generated CV
export const DEFAULT_CERTIFICATIONS = [
  { name: "Desarrollador Móvil con React Native", issuer: "Udemy",      date: "Mar 2023 – Jul 2023" },
  { name: "Desarrollador ReactJS",                issuer: "Coderhouse", date: "May 2021 – Nov 2021" },
  { name: "Desarrollador Web Full Stack",          issuer: "Udemy",      date: "Feb 2020 – Ago 2020" },
  { name: "SCRUM",                                 issuer: "Kodigo",     date: "May 2023 – Jul 2023" },
  { name: "React Native",                          issuer: "Coderhouse", date: "Jul 2022 – Oct 2022" },
  { name: "Desarrollador Python + Django",         issuer: "Udemy",      date: "Ago 2024 – Nov 2024" },
];

// Regular experience entries always used as canonical base (role/company/dates come from here;
// Ollama achievements are merged in when available)
export const DEFAULT_REGULAR_EXPERIENCE = [
  {
    role: "Desarrollador Web Full Stack",
    company: "Municipalidad de Godoy Cruz — Mendoza, Argentina",
    startDate: "Feb 2022",
    endDate: "Presente",
    achievements: [],
  },
  {
    role: "Desarrollador PHP",
    company: "DivisionGIS — Mendoza, Argentina",
    startDate: "Mar 2020",
    endDate: "Feb 2022",
    achievements: [],
  },
];

// Projects always injected after regular experience (replace anything Ollama generates)
export const DEFAULT_PROJECTS = [
  {
    role: "Plataforma SaaS de búsqueda laboral con IA",
    company: "MERN Stack · IA generativa · APIs externas",
    startDate: "", endDate: "",
    achievements: [
      "Centralicé ofertas laborales desde múltiples fuentes externas integrando APIs y scrapers, reduciendo el tiempo de búsqueda manual.",
      "Implementé sistema de recomendación con IA generativa para filtrar y rankear vacantes según el perfil del usuario.",
      "Desarrollé análisis automático de vacantes que evalúa compatibilidad y sugiere mejoras al CV en tiempo real.",
      "Diseñé arquitectura full-stack escalable con React, Node.js, Express y MongoDB.",
    ],
  },
  {
    role: "Plataforma web para venta de entradas con Mercado Pago",
    company: "MERN Stack · Mercado Pago API · JWT",
    startDate: "", endDate: "",
    achievements: [
      "Desarrollé sistema completo de venta y gestión de entradas con flujo de pago end-to-end integrado a Mercado Pago.",
      "Implementé manejo de webhooks y confirmaciones de pago para garantizar consistencia transaccional.",
      "Construí administración de eventos con control de capacidad, disponibilidad y gestión de usuarios.",
      "Aseguré la autenticación y autorización con JWT, protegiendo rutas sensibles de administración.",
    ],
  },
  {
    role: "Sistema de gestión de seguridad para barrios privados",
    company: "React Native · Expo · Node.js · PostgreSQL · Socket.io · face-api.js",
    startDate: "", endDate: "",
    achievements: [
      "Implementé reconocimiento facial biométrico con face-api.js (TensorFlow.js) para registro de ingreso/egreso de turno de guardias.",
      "Desarrollé monitoreo de ubicaciones en tiempo real y sistema de alertas de emergencia con Socket.io entre vecinos y seguridad.",
      "Construí verificaciones periódicas automáticas para guardias en turno y chat interno en tiempo real.",
      "Diseñé dashboard administrativo para gestión de finanzas, estadísticas y control de acceso del barrio.",
    ],
  },
  {
    role: "Sistema de generación automática de leads con IA",
    company: "React · Node.js · MongoDB · APIs de scraping · IA",
    startDate: "", endDate: "",
    achievements: [
      "Automaticé la captación de leads buscando negocios por nicho y recopilando datos de contacto desde múltiples fuentes.",
      "Integré IA para generar insights comerciales personalizados y sugerencias de acercamiento para cada lead.",
      "Implementé exportación de resultados estructurados para equipos de ventas y marketing con filtros por industria y ubicación.",
    ],
  },
  {
    role: "Gestor de tareas colaborativo con tableros Kanban",
    company: "Next.js 14 · React 18 · Python · Django · PostgreSQL · Docker",
    startDate: "", endDate: "",
    achievements: [
      "Desarrollé drag & drop visual entre columnas Kanban con actualizaciones optimistas en tiempo real para una UX fluida.",
      "Implementé compartición de listas por email y sistema de comentarios por tarea con notificaciones.",
      "Contenerizé la aplicación con Docker y gestioné archivos adjuntos en tareas mediante Cloudinary.",
      "Arquitecturé backend desacoplado con Django REST Framework + PostgreSQL y frontend en Next.js 14 con Tailwind CSS.",
    ],
  },
  {
    role: "Sistema de gestión de obras para municipio con IA",
    company: "React · Node.js · MongoDB · MinIO (S3) · Docker · JWT",
    startDate: "", endDate: "",
    achievements: [
      "Desarrollé plataforma de gestión de trámites de planos técnicos para la Municipalidad de Godoy Cruz con control de acceso por roles (profesional / técnico / administrador).",
      "Integré IA para analizar versiones de planos PDF y generar sugerencias automáticas de corrección de errores técnicos.",
      "Implementé versionado de planos, sistema de estados del trámite (presentado → en revisión → observado → pre-aprobado) y notificaciones por email.",
      "Configuré almacenamiento seguro con MinIO (S3), descarga con URLs firmadas y compresión de PDFs.",
    ],
  },
  {
    role: "Aplicaciones web y móviles Full Stack",
    company: "React · React Native · Expo · Node.js · MongoDB · Django · Python",
    startDate: "", endDate: "",
    achievements: [
      "Desarrollé múltiples aplicaciones web y mobile freelance utilizando arquitecturas modernas y escalables.",
      "Implementé soluciones end-to-end cubriendo diseño de APIs REST, gestión de bases de datos y UI responsiva.",
      "Apliqué desarrollo móvil con React Native y Expo entregando apps iOS/Android con funcionalidades nativas.",
    ],
  },
];
