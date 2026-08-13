import { ollamaService } from "./OllamaService.js";
import Anthropic from "@anthropic-ai/sdk";
import {
  MASTER_PROFILE,
  TECHNOLOGY_EVIDENCE_MATRIX,
  TECHNOLOGY_CATEGORIES,
  getTechnologyEvidence,
  selectProjects,
} from "../config/masterProfile.js";
import {
  DEFAULT_PERSONAL_INFO,
  DEFAULT_CERTIFICATIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SUMMARY,
  DEFAULT_SKILL_CATEGORIES,
  DEFAULT_REGULAR_EXPERIENCE,
  DEFAULT_LANGUAGES,
} from "../config/userDefaults.js";

const anthropic = new Anthropic();

// ─── Tech keyword dictionary ──────────────────────────────────────────────────
const TECH_TERMS = [
  "python", "javascript", "typescript", "java", "golang", "go", "rust", "ruby",
  "php", "kotlin", "swift", "dart", "scala", "elixir", "perl", "lua",
  "bash", "powershell", "shell", "sql", "plsql", "tsql", "cobol", "groovy",
  "c++", "c#", "objective-c",
  "react", "reactjs", "vue", "vuejs", "angular", "angularjs", "svelte",
  "nextjs", "nuxtjs", "gatsby", "remix", "astro", "jquery", "bootstrap", "tailwind",
  "webpack", "vite", "babel", "rollup", "parcel", "esbuild",
  "sass", "scss", "less", "css", "css3", "html", "html5",
  "styled components", "emotion", "chakra", "shadcn",
  "redux", "zustand", "mobx", "rxjs", "recoil", "jotai", "react query", "tanstack",
  "storybook", "jest", "vitest", "cypress", "playwright", "testing library",
  "mocha", "chai", "jasmine", "selenium", "puppeteer",
  "nodejs", "express", "expressjs", "fastapi", "django", "flask", "rails",
  "spring", "springboot", "laravel", "symfony", "nestjs", "koa", "fastify",
  "hono", "gin", "fiber", "actix", "asp.net", "aspnet", "bun", "deno",
  "oauth", "oauth2", "passport", "auth0", "keycloak", "jwt", "saml", "openid",
  "prisma", "sequelize", "mongoose", "typeorm", "drizzle", "sqlalchemy",
  "android", "ios", "flutter", "xamarin", "ionic", "capacitor",
  "react native", "reactnative", "cordova", "phonegap", "android studio", "expo",
  "aws", "gcp", "azure", "heroku", "vercel", "netlify", "cloudflare",
  "google cloud", "google cloud platform",
  "lambda", "ec2", "s3", "rds", "cloudfront", "route53",
  "gke", "aks", "ecs", "fargate", "cloud run", "cloud functions",
  "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef",
  "jenkins", "gitlab", "github", "bitbucket", "circleci", "travis",
  "github actions", "gitlab ci", "helm", "argocd", "grafana", "prometheus",
  "nginx", "apache", "linux", "ubuntu", "debian", "centos", "rhel",
  "vault", "pulumi",
  "postgresql", "postgres", "mysql", "mariadb", "mongodb", "redis",
  "elasticsearch", "cassandra", "dynamodb", "sqlite", "oracle", "mssql",
  "neo4j", "firebase", "supabase", "clickhouse", "influxdb", "minio",
  "rabbitmq", "kafka", "celery", "bull", "sqs", "pubsub",
  "microservices", "serverless", "restful", "rest api", "graphql", "grpc",
  "websocket", "event-driven", "clean architecture", "hexagonal", "solid",
  "ddd", "tdd", "bdd", "cicd",
  "agile", "scrum", "kanban", "lean", "devops",
  "pair programming", "code review", "test driven",
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "spark", "airflow", "mlops",
];

const MULTIWORD_TERMS = TECH_TERMS.filter((t) => t.includes(" "));
const SINGLEWORD_TERMS = TECH_TERMS.filter((t) => !t.includes(" "));

const TECH_CAPS = new Set([
  "JWT", "SQL", "SDK", "CLI", "SSR", "SSG", "CSR", "CDN", "SPA", "MVC",
  "OOP", "ORM", "DDD", "TDD", "BDD", "CRUD", "JSON", "XML", "YAML", "DOM",
  "HTTP", "HTTPS", "GRPC", "PWA", "SSH", "FTP", "SFTP",
  "VPN", "VPC", "IAM", "S3", "EC2", "RDS", "SNS", "SQS", "ECS", "EKS",
  "GKE", "AKS", "RBAC", "CORS", "XSS", "CSRF", "WASM", "JVM",
  "SAML", "OIDC", "PHP", "CSS", "HTML", "SASS", "SCSS", "LESS",
]);

const ALIAS_GROUPS = [
  ["javascript", "js", "ecmascript", "es6", "es2015", "es2020"],
  ["typescript", "ts"],
  ["kubernetes", "k8s"],
  ["nodejs", "node"],
  ["reactjs", "react"],
  ["vuejs", "vue"],
  ["angularjs", "angular", "ng"],
  ["nextjs", "next"],
  ["nestjs", "nest"],
  ["expressjs", "express"],
  ["nuxtjs", "nuxt"],
  ["golang", "go"],
  ["python", "py"],
  ["postgresql", "postgres", "psql"],
  ["mongodb", "mongo"],
  ["elasticsearch", "elastic", "elk"],
  ["c#", "csharp", "dotnet", "net"],
  ["machine learning", "ml"],
  ["artificial intelligence", "ai"],
  ["cicd", "ci cd", "continuous integration", "continuous delivery", "continuous deployment"],
  ["rest api", "restful", "rest"],
  ["graphql", "gql"],
  ["amazon web services", "aws"],
  ["google cloud", "google cloud platform", "gcp"],
  ["microsoft azure", "azure"],
  ["github actions", "gha"],
  ["react native", "reactnative"],
  ["android studio", "android"],
  ["oauth", "oauth2", "openid connect", "oidc"],
  ["redux", "rtk", "react redux", "redux toolkit"],
  ["css3", "css"],
  ["html5", "html"],
  ["scss", "sass"],
  ["testing library", "react testing library", "rtl"],
];

const ALIAS_MAP = new Map();
for (const group of ALIAS_GROUPS) {
  for (const term of group) {
    ALIAS_MAP.set(term, group.filter((t) => t !== term));
  }
}

// Category signal detector — used by both injectMissingKeywords and recoverMissingSupportedKeywords
const ITEM_SIGNALS = [
  { type: "frontend", keys: ["react", "vue", "angular", "svelte", "html", "css", "javascript", "typescript", "nextjs", "nuxtjs", "sass", "scss", "redux", "webpack", "vite", "jquery", "bootstrap", "tailwind", "gatsby", "remix", "astro"] },
  { type: "backend",  keys: ["nodejs", "express", "django", "flask", "rails", "spring", "php", "fastapi", "nestjs", "koa", "graphql", "restful", "python", "golang", "java", "laravel", "aspnet", "dotnet"] },
  { type: "database", keys: ["postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra", "mariadb", "oracle", "sql", "dynamodb", "firebase", "supabase"] },
  { type: "devops",   keys: ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "circleci", "cicd", "linux", "github", "gitlab", "helm", "nginx", "ansible", "argocd", "github actions", "gitlab ci"] },
  { type: "mobile",   keys: ["react native", "flutter", "android", "ios", "swift", "kotlin", "ionic", "expo", "capacitor"] },
];

// ─── Adaptive skill category templates per job type ───────────────────────────
// Each entry defines category order and the candidate tech pool.
// Technologies NOT in masterProfile with evidence A or B will be silently excluded.
const SKILL_TEMPLATES = {
  backend: [
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "Django REST Framework", "PHP", "Laravel", "REST APIs", "JWT", "WebSockets", "Socket.io"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "HTML5", "CSS3", "TailwindCSS", "Bootstrap"] },
    { category: "DevOps",        pool: ["Docker", "Docker Compose", "Git", "GitHub", "MinIO", "Vercel", "Nginx", "CI/CD"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code", "Figma", "Jira"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  frontend: [
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "TailwindCSS", "Bootstrap", "HTML5", "CSS3"] },
    { category: "Mobile",        pool: ["React Native", "Expo"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "REST APIs", "JWT", "Socket.io"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub", "Vercel"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code", "Figma", "Jira"] },
  ],
  react: [
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "TailwindCSS", "Bootstrap", "HTML5", "CSS3"] },
    { category: "Mobile",        pool: ["React Native", "Expo"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "REST APIs", "JWT", "Socket.io"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub", "Vercel"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code", "Figma"] },
  ],
  node: [
    { category: "Backend",       pool: ["Node.js", "Express.js", "REST APIs", "JWT", "WebSockets", "Socket.io", "Python", "Django"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL", "Redis"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "HTML5", "CSS3"] },
    { category: "DevOps",        pool: ["Docker", "Docker Compose", "Git", "GitHub", "MinIO", "CI/CD"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code", "Jira"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  python: [
    { category: "Backend",       pool: ["Python", "Django", "Django REST Framework", "Node.js", "Express.js", "REST APIs", "JWT"] },
    { category: "Base de datos", pool: ["PostgreSQL", "MongoDB", "MySQL", "SQLite"] },
    { category: "Frontend",      pool: ["React", "Next.js", "TypeScript", "JavaScript", "HTML5", "CSS3", "TailwindCSS"] },
    { category: "DevOps",        pool: ["Docker", "Docker Compose", "Git", "GitHub"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  ai: [
    { category: "AI / ML",       pool: ["Claude API", "Ollama", "Gemini", "TensorFlow.js", "face-api.js"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "REST APIs", "JWT"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  mobile: [
    { category: "Mobile",        pool: ["React Native", "Expo"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "REST APIs", "JWT", "WebSockets", "Socket.io"] },
    { category: "Base de datos", pool: ["PostgreSQL", "MongoDB"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3"] },
    { category: "AI / ML",       pool: ["face-api.js", "TensorFlow.js"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub"] },
  ],
  fullstack: [
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "React Native", "TailwindCSS", "Bootstrap", "HTML5", "CSS3"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "Django REST Framework", "PHP", "REST APIs", "JWT", "Socket.io", "WebSockets"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL", "SQLite"] },
    { category: "DevOps",        pool: ["Docker", "Docker Compose", "Git", "GitHub", "MinIO", "Vercel"] },
    { category: "AI / ML",       pool: ["Claude API", "Ollama", "Gemini", "TensorFlow.js", "face-api.js"] },
    { category: "Pagos",         pool: ["Mercado Pago"] },
    { category: "Herramientas",  pool: ["Postman", "VS Code", "Figma", "Jira"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  automation: [
    { category: "AI / ML",       pool: ["Claude API", "Ollama", "Gemini", "TensorFlow.js", "face-api.js"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "REST APIs", "JWT"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub"] },
  ],
  saas: [
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "REST APIs", "JWT", "Socket.io"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "TailwindCSS"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "Pagos",         pool: ["Mercado Pago"] },
    { category: "AI / ML",       pool: ["Claude API", "Ollama", "Gemini"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub"] },
  ],
  ecommerce: [
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js", "TailwindCSS", "Bootstrap", "HTML5", "CSS3"] },
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "PHP", "Laravel", "REST APIs", "JWT"] },
    { category: "Pagos",         pool: ["Mercado Pago"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub", "Vercel"] },
  ],
  api: [
    { category: "Backend",       pool: ["Node.js", "Express.js", "Python", "Django", "REST APIs", "JWT", "WebSockets", "Socket.io"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "MySQL", "Redis"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript"] },
    { category: "DevOps",        pool: ["Docker", "Docker Compose", "Git", "GitHub", "Postman"] },
    { category: "Metodologías",  pool: ["Scrum", "Kanban"] },
  ],
  realtime: [
    { category: "Backend",       pool: ["Node.js", "Express.js", "WebSockets", "Socket.io", "REST APIs", "JWT"] },
    { category: "Base de datos", pool: ["MongoDB", "PostgreSQL", "Redis"] },
    { category: "Frontend",      pool: ["React", "TypeScript", "JavaScript", "Next.js"] },
    { category: "Mobile",        pool: ["React Native", "Expo"] },
    { category: "DevOps",        pool: ["Docker", "Git", "GitHub"] },
  ],
};

// Achievement relevance keywords per job type — used to rank experience bullets
const TYPE_ACHIEVEMENT_KEYWORDS = {
  backend:    ["api", "rest", "backend", "autenticación", "jwt", "base de datos", "datos", "docker", "arquitectura", "implementé", "diseñé", "mongodb", "postgresql", "mysql", "minio", "node", "express", "django", "python", "servidor", "integré", "configuré"],
  frontend:   ["react", "typescript", "interfaz", "frontend", "componentes", "responsive", "ui", "next.js", "tailwind", "html", "css", "diseñé", "construí"],
  react:      ["react", "typescript", "interfaz", "componentes", "next.js", "tailwind", "html", "css"],
  node:       ["node", "nodejs", "express", "api", "javascript", "typescript", "npm", "rest", "jwt", "mongodb"],
  ai:         ["ia", "inteligencia artificial", "análisis", "pdf", "documentos", "llm", "claude", "automatización", "machine learning", "integré ia", "análisis automático", "análisis de documentos"],
  python:     ["python", "django", "postgresql", "docker", "framework", "rest", "api"],
  mobile:     ["react native", "expo", "móvil", "biométrico", "ubicación", "face-api", "socket", "nativo", "alertas"],
  automation: ["automatización", "automaticé", "pipeline", "workflow", "scraping", "proceso", "leads"],
  realtime:   ["tiempo real", "socket", "websocket", "notificaciones", "chat", "alertas"],
  saas:       ["plataforma", "roles", "usuarios", "gestión", "workflow", "estados", "notificaciones"],
  ecommerce:  ["pago", "mercado pago", "webhook", "transaccional", "checkout", "carrito", "productos"],
  api:        ["api", "rest", "endpoint", "autenticación", "jwt", "postman"],
  fullstack:  ["full stack", "frontend", "backend", "api", "react", "node", "implementé", "desarrollé", "diseñé", "construí", "arquitecturé"],
};

export class ATSOptimizerService {

  // ─── Regex keyword extraction ────────────────────────────────────────────────

  _extractKeywordsRegex(text) {
    const found = new Set();
    const lower = this._normalize(text);

    for (const term of SINGLEWORD_TERMS) {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (pattern.test(lower)) found.add(term);
    }
    for (const term of MULTIWORD_TERMS) {
      if (lower.includes(term)) found.add(term);
    }
    const capsMatches = text.match(/\b[A-Z]{2,10}\b/g) || [];
    capsMatches.forEach((m) => { if (TECH_CAPS.has(m)) found.add(m.toLowerCase()); });
    const camelMatches = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]*)+\b/g) || [];
    camelMatches.forEach((m) => found.add(this._normalize(m)));
    const dottedMatches = text.match(/\b[A-Za-z]+\.[Jj][Ss]\b/g) || [];
    dottedMatches.forEach((m) => found.add(this._normalize(m)));
    if (/\bCI[\s/\-]?CD\b/i.test(text)) found.add("cicd");

    return [...found].filter((k) => k.length > 1);
  }

  _normalize(text) {
    return text
      .toLowerCase()
      .replace(/[/\\]/g, " ")
      .replace(/[.\-_]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  _sortByRelevance(items, jdKeywords) {
    if (!jdKeywords?.length || !items?.length) return items;
    const kwNorms = jdKeywords.map((k) => this._normalize(String(k)));
    const score = (item) => {
      const norm = this._normalize(String(item));
      const words = norm.split(/\s+/);
      let s = 0;
      for (const kw of kwNorms) {
        if (norm === kw) { s += 3; continue; }
        if (norm.includes(kw) || kw.includes(norm)) { s += 2; continue; }
        if (words.some((w) => w.length >= 3 && (w === kw || w.startsWith(kw) || kw.startsWith(w)))) s += 1;
      }
      return s;
    };
    return [...items].sort((a, b) => score(b) - score(a));
  }

  _extractRoleFromJD(jd) {
    if (!jd) return "";
    const patterns = [
      /buscamos?\s+(?:un|una)\s+([A-Za-záéíóúüñÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s/+\-.]{3,50}?)(?:\s+para|\s+con|\s+que|[,.]|$)/i,
      /(?:posici[oó]n|rol|cargo|puesto)[:\s]+([A-Za-záéíóúüñÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s/+\-.]{3,50}?)(?:\n|[,.]|$)/i,
      /^##?\s+([A-Z][^\n]{4,55})$/m,
      /we(?:'re|re|\s+are)\s+looking\s+for\s+(?:a|an)\s+([A-Za-z][A-Za-z\s/+\-.]{3,50}?)(?:\s+to|\s+who|\s+with|[,.]|$)/i,
      /(?:position|role|job\s*title)[:\s]+([A-Za-z][A-Za-z\s/+\-.]{3,50}?)(?:\n|[,.]|$)/i,
    ];
    for (const pat of patterns) {
      const m = jd.match(pat);
      if (m?.[1]) {
        const role = m[1].trim().replace(/\s+/g, " ");
        if (role.length >= 4 && role.length <= 60) return role;
      }
    }
    return "";
  }

  // ─── JD Analysis ────────────────────────────────────────────────────────────

  async analyzeJobDescription(jobDescription) {
    const regexKeywords = this._extractKeywordsRegex(jobDescription);

    const prompt = `Eres un experto ATS. Analiza esta descripción laboral y extrae TODOS los términos técnicos, lenguajes, frameworks, herramientas y skills visibles en el texto.

DESCRIPCIÓN:
${jobDescription.slice(0, 2500)}

IMPORTANTE: Identificá CADA tecnología mencionada aunque sea brevemente. Por ejemplo si el texto dice "VueJS, NodeJS, Linux (excluyente) - Apache Cordova, Android Studio (deseable)", extraé TODOS: VueJS, NodeJS, Linux, Apache Cordova, Android Studio.

Devuelve SOLO JSON válido:
{
  "requiredSkills": ["<tecnologías/skills marcadas como excluyentes, requeridas o imprescindibles>"],
  "niceToHaveSkills": ["<tecnologías/skills marcadas como deseables o plus>"],
  "keywords": ["<TODOS los términos técnicos del texto>"],
  "experienceLevel": "junior|mid|senior|lead|unknown",
  "industry": "",
  "role": "",
  "softSkills": ["<habilidades blandas mencionadas>"]
}`;

    let aiResult = {};
    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
    } catch {
      // Claude failed: regex extraction alone is enough
    }

    const mergedKeywords = [...new Set([
      ...(aiResult.keywords || []).map((k) => this._normalize(k)),
      ...(aiResult.requiredSkills || []).map((k) => this._normalize(k)),
      ...(aiResult.niceToHaveSkills || []).map((k) => this._normalize(k)),
      ...regexKeywords,
    ])].filter(Boolean);

    const mergedRequired = [...new Set([
      ...(aiResult.requiredSkills || []).map((k) => this._normalize(k)),
      ...(!(aiResult.requiredSkills?.length) ? regexKeywords.slice(0, 8) : []),
    ])].filter(Boolean);

    return {
      requiredSkills: mergedRequired,
      niceToHaveSkills: (aiResult.niceToHaveSkills || []).map((k) => this._normalize(k)),
      keywords: mergedKeywords,
      experienceLevel: aiResult.experienceLevel || "unknown",
      industry: aiResult.industry || "",
      role: aiResult.role || this._extractRoleFromJD(jobDescription) || "",
      softSkills: aiResult.softSkills || [],
      _regexKeywords: regexKeywords,
    };
  }

  // ─── CV Translation ──────────────────────────────────────────────────────────

  async translateCV(cv) {
    const TRANSLATE_RULES = `RULES:
- DO translate: summary, job role titles, achievement bullet points, skill category names, education degree names, language names, proficiency levels, certification names.
- DO NOT translate: technology names (React, Node.js, Docker, MongoDB, JWT…), company names, university names, proper nouns, date strings, URLs, acronyms.
- Return ONLY a valid JSON object with the EXACT same structure and array lengths as the input. No extra keys, no missing keys.`;

    const makePrompt = (payload) =>
      `Translate the following CV fields from Spanish to English.\n\n${TRANSLATE_RULES}\n\nINPUT:\n${JSON.stringify(payload)}`;

    const textPayload = {
      summary:         cv.summary || "",
      expRoles:        (cv.experience    || []).map((e) => e.role     || ""),
      skillCategories: (cv.skills        || []).map((s) => s.category || ""),
      eduDegrees:      (cv.education     || []).map((e) => e.degree   || ""),
      langNames:       (cv.languages     || []).map((l) => l.name     || ""),
      langLevels:      (cv.languages     || []).map((l) => l.level    || ""),
      certNames:       (cv.certifications|| []).map((c) => c.name     || ""),
    };

    let textResult = {};
    try {
      textResult = await ollamaService.generateJSON(makePrompt(textPayload), { maxTokens: 2048, numCtx: 6144 });
    } catch (err) {
      throw new Error("La traducción falló: " + err.message);
    }

    const translatedAchievements = [];
    for (const exp of (cv.experience || [])) {
      const achs = exp.achievements || [];
      if (!achs.length) { translatedAchievements.push([]); continue; }
      try {
        const achResult = await ollamaService.generateJSON(
          makePrompt({ achievements: achs }),
          { maxTokens: 2048, numCtx: 6144 }
        );
        translatedAchievements.push(Array.isArray(achResult.achievements) ? achResult.achievements : achs);
      } catch {
        translatedAchievements.push(achs);
      }
    }

    return {
      ...cv,
      summary: textResult.summary || cv.summary,
      experience: (cv.experience || []).map((e, i) => ({
        ...e,
        role:         textResult.expRoles?.[i]    || e.role,
        achievements: translatedAchievements[i]   ?? e.achievements,
      })),
      skills: (cv.skills || []).map((s, i) => ({
        ...s,
        category: textResult.skillCategories?.[i] || s.category,
      })),
      education: (cv.education || []).map((e, i) => ({
        ...e,
        degree: textResult.eduDegrees?.[i] || e.degree,
      })),
      languages: (cv.languages || []).map((l, i) => ({
        ...l,
        name:  textResult.langNames?.[i]  || l.name,
        level: textResult.langLevels?.[i] || l.level,
      })),
      certifications: (cv.certifications || []).map((c, i) => ({
        ...c,
        name: textResult.certNames?.[i] || c.name,
      })),
    };
  }

  // ─── FASE 2: Job Identity Detection ─────────────────────────────────────────
  //
  // Analyzes JD text + extracted analysis to determine the primary and secondary
  // job types. Scores each type using role keywords + tech signals from jdAnalysis.
  // Returns: { primary, secondary[], confidence }

  detectJobIdentity(jobDescription, jdAnalysis) {
    const jdLower = (jobDescription || "").toLowerCase();
    const allKws = [
      ...(jdAnalysis.keywords || []),
      ...(jdAnalysis.requiredSkills || []),
    ].map((k) => this._normalize(k));

    const JOB_TYPES = {
      fullstack: {
        roleKws:   ["fullstack", "full stack", "full-stack"],
        techSigs:  ["react", "nodejs", "express", "mongodb", "postgresql", "typescript"],
        weight:    1.0,
      },
      backend: {
        roleKws:   ["backend", "back-end", "back end", "servidor", "server side", "server-side"],
        techSigs:  ["nodejs", "expressjs", "django", "flask", "fastapi", "nestjs", "spring", "laravel", "restful", "microservices", "graphql"],
        weight:    1.1,
      },
      frontend: {
        roleKws:   ["frontend", "front-end", "front end", "ui developer", "web developer"],
        techSigs:  ["react", "vue", "angular", "svelte", "nextjs", "css", "html", "tailwind", "bootstrap", "sass", "webpack", "vite"],
        weight:    1.0,
      },
      react: {
        roleKws:   ["react developer", "reactjs", "react.js"],
        techSigs:  ["react", "reactjs", "nextjs", "redux", "jsx"],
        weight:    1.2,
      },
      node: {
        roleKws:   ["node developer", "node.js developer", "nodejs developer"],
        techSigs:  ["nodejs", "expressjs", "npm", "typescript", "javascript"],
        weight:    1.1,
      },
      python: {
        roleKws:   ["python developer", "django developer", "python engineer"],
        techSigs:  ["python", "django", "flask", "fastapi", "sqlalchemy", "pandas", "celery", "pytest", "poetry"],
        weight:    1.3,
      },
      mobile: {
        roleKws:   ["mobile developer", "react native developer", "ios developer", "android developer", "flutter developer"],
        techSigs:  ["react native", "reactnative", "flutter", "swift", "kotlin", "expo", "ionic", "capacitor"],
        weight:    1.2,
      },
      ai: {
        roleKws:   [
          "machine learning", "data scientist", "ai engineer", "ml engineer",
          "nlp engineer", "llm engineer", "ai developer",
          // Spanish AI role keywords
          "desarrollador ia", "desarrollador de ia", "inteligencia artificial",
          "ia generativa", "llm", "ingeniería de ia", "ingeniero ia",
        ],
        techSigs:  [
          "tensorflow", "pytorch", "scikit", "pandas", "numpy",
          "openai", "langchain", "hugging face", "llm", "mlops", "airflow",
          // Tools with A/B evidence in our matrix
          "claude api", "ollama", "gemini",
        ],
        weight:    1.4,
      },
      automation: {
        roleKws:   [
          "automation engineer", "rpa developer", "scraping developer",
          // Spanish automation role keywords
          "automatización", "automatizaci", "desarrollador automatización",
          "automatización de procesos", "generación de leads",
        ],
        techSigs:  ["celery", "airflow", "selenium", "playwright", "puppeteer", "bull", "cron"],
        weight:    1.1,
      },
      saas: {
        roleKws:   ["saas developer", "platform engineer"],
        techSigs:  ["stripe", "webhooks", "multi-tenant", "billing", "subscription"],
        weight:    0.9,
      },
      ecommerce: {
        roleKws:   ["ecommerce developer", "e-commerce developer", "tienda online"],
        techSigs:  ["stripe", "paypal", "mercadopago", "woocommerce", "shopify", "cart", "checkout"],
        weight:    1.0,
      },
      api: {
        roleKws:   ["api developer", "rest developer", "backend api"],
        techSigs:  ["rest", "graphql", "swagger", "openapi", "grpc", "postman"],
        weight:    0.9,
      },
      realtime: {
        roleKws:   ["realtime developer", "websocket developer"],
        techSigs:  ["socketio", "websocket", "pusher", "firebase", "ably"],
        weight:    1.0,
      },
    };

    const roleStr = (jdAnalysis.role || "").toLowerCase();

    const scores = {};
    for (const [type, cfg] of Object.entries(JOB_TYPES)) {
      let s = 0;

      // Role title match (highest weight)
      for (const kw of cfg.roleKws) {
        if (roleStr.includes(kw))  s += 5 * cfg.weight;
        if (jdLower.slice(0, 300).includes(kw)) s += 3 * cfg.weight;
      }

      // Tech signals match against extracted keywords
      for (const sig of cfg.techSigs) {
        const sigNorm = this._normalize(sig);
        if (allKws.some((k) => k === sigNorm || k.startsWith(sigNorm.slice(0, 5)) || sigNorm.startsWith(k.slice(0, 5)))) {
          s += 1 * cfg.weight;
        }
      }

      // Full JD text keyword presence
      for (const kw of cfg.roleKws) {
        if (jdLower.includes(kw)) s += 1 * cfg.weight;
      }

      scores[type] = s;
    }

    const sorted = Object.entries(scores)
      .filter(([, s]) => s > 0)
      .sort(([, a], [, b]) => b - a);

    if (sorted.length === 0) {
      return { primary: "fullstack", secondary: [], confidence: 0.5 };
    }

    const maxScore = sorted[0][1];
    const primary  = sorted[0][0];

    // Secondary: types with ≥30% of max score (excluding primary)
    const secondary = sorted
      .slice(1, 4)
      .filter(([, s]) => s >= maxScore * 0.30)
      .map(([t]) => t);

    const confidence = Math.min(0.99, maxScore / (maxScore + 6));

    return { primary, secondary, confidence };
  }

  // ─── FASE 2: Keyword Classification ─────────────────────────────────────────
  //
  // Classifies each JD keyword against the Technology Evidence Matrix.
  // Returns: [{ keyword, status, evidence, action }]
  // status: "verified" (A) | "project" (B) | "learning" (C) | "unsupported" (D) | "unknown"
  // action: "include" | "learning-only" | "exclude"

  classifyKeywords(jdKeywords) {
    return (jdKeywords || []).map((kw) => {
      const tech = getTechnologyEvidence(kw);
      if (!tech) {
        return { keyword: kw, status: "unknown", evidence: null, action: "exclude" };
      }
      const MAP = {
        A: { status: "verified",     action: "include"       },
        B: { status: "project",      action: "include"       },
        C: { status: "learning",     action: "learning-only" },
        D: { status: "unsupported",  action: "exclude"       },
      };
      return { keyword: kw, evidence: tech.category, ...MAP[tech.category] };
    });
  }

  // ─── FASE 2: Adaptive Skill Categories ───────────────────────────────────────
  //
  // Builds skill categories ordered and populated for the detected job type.
  // Only technologies with evidence A or B are included.
  // Items within each category are sorted: JD matches first, then A before B.

  buildAdaptiveSkills(jobIdentity, jdKeywords) {
    const template = SKILL_TEMPLATES[jobIdentity.primary] || SKILL_TEMPLATES.fullstack;
    const jdNorms  = (jdKeywords || []).map((k) => this._normalize(k));
    const usedNames = new Set();

    const _jdScore = (name) => {
      const norm = this._normalize(name);
      return jdNorms.some((kw) => norm === kw || norm.includes(kw) || kw.includes(norm) ||
        (norm.length >= 4 && kw.length >= 4 && norm.slice(0, 4) === kw.slice(0, 4))) ? 1 : 0;
    };

    const categories = template.map(({ category, pool }) => {
      const items = pool
        .filter((name) => !usedNames.has(name))
        .map((name) => {
          const tech = getTechnologyEvidence(name);
          if (!tech || (tech.category !== "A" && tech.category !== "B")) return null;
          return {
            name,
            evidenceScore: tech.category === "A" ? 2 : 1,
            jdScore:       _jdScore(name),
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          // JD relevance first, then A before B
          if (b.jdScore !== a.jdScore) return b.jdScore - a.jdScore;
          return b.evidenceScore - a.evidenceScore;
        })
        .map(({ name }) => { usedNames.add(name); return name; });

      return { category, items };
    }).filter((sg) => sg.items.length > 0);

    // If JD requires C-level techs that aren't covered, add a transparent learning section
    const cRequired = (jdKeywords || [])
      .map((kw) => getTechnologyEvidence(kw))
      .filter((t) => t && t.category === "C" && !usedNames.has(t.name))
      .map((t) => t.name);

    if (cRequired.length > 0) {
      categories.push({
        category: "Conocimientos en desarrollo",
        items: [...new Set(cRequired)],
      });
    }

    return categories;
  }

  // ─── FASE 2: Adaptive Experience ─────────────────────────────────────────────
  //
  // Selects and ranks achievement bullets from MASTER_PROFILE.experience
  // based on job type. Applies bullet limits per entry.

  buildAdaptiveExperience(jobIdentity, jdKeywords) {
    const { primary, secondary } = jobIdentity;
    const allTypes  = [primary, ...secondary];
    const jdNorms   = (jdKeywords || []).map((k) => k.toLowerCase());

    // Pool of relevance keywords from all detected job types
    const relevantKws = [...new Set(
      allTypes.flatMap((t) => TYPE_ACHIEVEMENT_KEYWORDS[t] || [])
    )];

    const scoreAch = (text) => {
      const low = text.toLowerCase();
      let s = 0;
      for (const kw of relevantKws) if (low.includes(kw)) s += 2;
      for (const kw of jdNorms)     if (low.includes(kw)) s += 3;
      return s;
    };

    // Teaching relevance: include more bullets only if the JD mentions it
    const teachingInJD = jdNorms.some((kw) =>
      ["mentor", "enseña", "docente", "profesor", "train", "coach", "formac"].some((s) => kw.includes(s))
    );

    const BULLET_LIMITS = {
      "municipalidad-godoy-cruz": primary === "ai" ? 5 : 4,
      "casa-del-futuro":          teachingInJD ? 3 : 2,
      "division-gis":             2,
    };

    return MASTER_PROFILE.experience.map((exp) => {
      const limit = BULLET_LIMITS[exp.id] ?? 3;
      const achievements = (exp.achievements || [])
        .map((a) => ({ text: a, score: scoreAch(a) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((a) => a.text);

      return {
        role:      exp.role,
        company:   `${exp.company} — ${exp.location}`,
        startDate: exp.startDate,
        endDate:   exp.endDate || "Presente",
        achievements,
      };
    });
  }

  // ─── FASE 2: Adaptive Project Selection ──────────────────────────────────────
  //
  // Selects projects from MASTER_PROFILE using selectProjects(), converts them
  // to the experience-array format used by the frontend/PDF.
  //
  // Rules:
  //  - evidence: "pending" → never selected (enforced by selectProjects)
  //  - municipal-works-system → excluded from projects (already in Municipalidad experience)
  //  - Bullet count: rank 0 → 4 bullets, rank 1-2 → 3 bullets, rank 3+ → 2 bullets

  buildAdaptiveProjects(jobIdentity, jdKeywords, maxCount) {
    const { primary, secondary } = jobIdentity;

    const PROJECT_COUNT = {
      fullstack: 5, backend: 4, frontend: 4, react: 4,
      node: 4, python: 4, ai: 4, mobile: 3,
      automation: 4, saas: 4, ecommerce: 3, api: 4, realtime: 3,
    };
    const max = maxCount ?? (PROJECT_COUNT[primary] ?? 4);

    // Exclude municipal-works-system to avoid duplicating Municipalidad experience
    const EXCLUDED = new Set(["municipal-works-system"]);

    // Primary type selection
    let selected = selectProjects(primary, max + 2)
      .filter((p) => !EXCLUDED.has(p.id));

    // Supplement with secondary types if needed
    if (selected.length < max) {
      for (const secType of secondary) {
        const extras = selectProjects(secType, max)
          .filter((p) => !EXCLUDED.has(p.id) && !selected.some((s) => s.id === p.id));
        selected = [...selected, ...extras].slice(0, max);
        if (selected.length >= max) break;
      }
    }

    // Score by tech overlap with JD keywords
    const jdNorms = (jdKeywords || []).map((k) => this._normalize(k));
    const jdScore = (project) => {
      const text = [project.name, project.description, ...project.technologies, ...project.achievements]
        .join(" ").toLowerCase();
      return jdNorms.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
    };

    selected = selected
      .map((p) => ({ ...p, _jdScore: jdScore(p) }))
      .sort((a, b) => b._jdScore - a._jdScore)
      .slice(0, max);

    // Convert to the experience-array format
    return selected.map((project, rank) => {
      const bulletLimit = rank === 0 ? 4 : rank <= 2 ? 3 : 2;
      const sortedAchievements = this._sortByRelevance(project.achievements || [], jdKeywords || [])
        .slice(0, bulletLimit);

      return {
        role:         project.name,
        company:      project.stack || project.technologies.join(" · "),
        startDate:    "",
        endDate:      "",
        achievements: sortedAchievements,
      };
    });
  }

  // ─── FASE 2: Summary Variant Selection ───────────────────────────────────────

  _selectSummaryVariant(jobIdentity) {
    const { primary, secondary } = jobIdentity;
    const variants = MASTER_PROFILE.summaryVariants;
    if (variants[primary]) return variants[primary];
    for (const type of secondary) {
      if (variants[type]) return variants[type];
    }
    return variants.default;
  }

  // ─── FASE 2: Adaptive Summary Generation ─────────────────────────────────────
  //
  // Calls Claude Haiku to write a concise summary adapted to the job type.
  // Falls back to the pre-written summaryVariant from masterProfile if Claude fails.

  async _generateAdaptiveSummary(jobDescription, jdAnalysis, jobIdentity, baseSummary) {
    const allowedTechs = [...TECHNOLOGY_CATEGORIES.A, ...TECHNOLOGY_CATEGORIES.B]
      .map((t) => t.name)
      .slice(0, 30)
      .join(", ");

    const requiredStr = (jdAnalysis.requiredSkills || []).slice(0, 10).join(", ");
    const secondaryStr = jobIdentity.secondary.length
      ? ` (también: ${jobIdentity.secondary.join(", ")})`
      : "";

    const yearsExp = MASTER_PROFILE.positioning?.yearsExperience ?? 6;
    const mainTitle = MASTER_PROFILE.positioning?.mainTitle ?? "Full Stack Developer";

    const prompt = `Eres un experto en redacción de CVs profesionales. Tu tarea es escribir un resumen profesional conciso y adaptado.

PERFIL BASE DEL CANDIDATO:
${baseSummary}

TIPO DE PUESTO DETECTADO: ${jobIdentity.primary}${secondaryStr}

DESCRIPCIÓN DEL PUESTO (extracto):
${(jobDescription || "").slice(0, 800)}

SKILLS REQUERIDAS POR EL PUESTO: ${requiredStr}

TECNOLOGÍAS CON EVIDENCIA REAL (ÚNICAS PERMITIDAS):
${allowedTechs}

IDENTIDAD PROFESIONAL (REGLAS INMUTABLES):
- La identidad real del candidato es: "${mainTitle}" con ${yearsExp}+ años de experiencia.
- NO cambiar la identidad a "Especialista en ${jobIdentity.primary}" ni "Senior ${jobIdentity.primary} Engineer".
- ADAPTAR el énfasis sin reinventar el perfil:
  * Para puestos frontend: "Full Stack Developer con fuerte énfasis en React y TypeScript..."
  * Para puestos backend: "Full Stack Developer especializado en backend y APIs REST..."
  * Para puestos python: mencionar Python/Django como complemento del stack principal
  * Para puestos AI: destacar integración de LLMs y automatización
- Mantener SIEMPRE que el candidato tiene experiencia en ambos frontend y backend (es Full Stack).
- Los años de experiencia son ${yearsExp}+ años. No aumentarlos ni inventar "10 años" u otras cifras.

INSTRUCCIONES DE REDACCIÓN:
- Escribe SOLO el párrafo del resumen. Sin títulos, sin comillas, sin JSON.
- Longitud objetivo: 75-110 palabras.
- Incorporar naturalmente las keywords ATS más relevantes para este puesto.
- NO mencionar tecnologías fuera de la lista de tecnologías permitidas.
- NO inventar métricas, responsabilidades ni logros no documentados.
- NO usar frases vacías ("apasionado por", "dinámico", "proactivo", "soy una persona...").
- NO usar Markdown (sin **, sin #, sin *).
- Responder ÚNICAMENTE con el texto del resumen, sin encabezados ni explicaciones.

Resumen:`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      const text = (message.content[0].text || "").trim();
      // Reject JSON-shaped responses or too-short/too-long outputs
      const wordCount = text.split(/\s+/).length;
      if (wordCount >= 40 && wordCount <= 200 && !text.startsWith("{") && !text.startsWith("[")) {
        return text;
      }
    } catch (err) {
      console.warn("[_generateAdaptiveSummary] Claude failed, using base variant:", err.message);
    }

    return baseSummary;
  }

  // ─── FASE 2: Section Order Metadata ──────────────────────────────────────────

  _getSectionOrder(jobIdentity) {
    // All types currently use the same order; Phase 3 will vary this.
    return ["summary", "experience", "skills", "education", "languages", "certifications"];
  }

  // ─── FASE 2: optimizeCV (REWRITTEN) ──────────────────────────────────────────
  //
  // New flow:
  //   1. Detect job identity
  //   2. Classify JD keywords against evidence matrix
  //   3. Build adaptive experience, projects, and skills from masterProfile
  //   4. Generate adapted summary via Claude
  //   5. Assemble the final CV with architecture metadata
  //
  // Falls back to legacy _normalizeOptimizedCV() on any unexpected error.

  async optimizeCV(rawCVText, parsedCV, jobDescription, jdAnalysis, profileSummary = "") {
    try {
      // ── 1. Detect job identity ────────────────────────────────────────────────
      const jobIdentity = this.detectJobIdentity(jobDescription, jdAnalysis);
      console.log(`[optimizeCV] Job identity: ${jobIdentity.primary} (secondary: ${jobIdentity.secondary.join(",")})`);

      // ── 2. Classify JD keywords ───────────────────────────────────────────────
      const keywordClassification = this.classifyKeywords(jdAnalysis.keywords || []);

      // ── 3. Build adaptive components from masterProfile ───────────────────────
      const adaptiveExperience = this.buildAdaptiveExperience(jobIdentity, jdAnalysis.keywords);
      const adaptiveProjects   = this.buildAdaptiveProjects(jobIdentity, jdAnalysis.keywords);
      const adaptiveSkills     = this.buildAdaptiveSkills(jobIdentity, jdAnalysis.keywords);

      // ── 4. Generate adapted summary ───────────────────────────────────────────
      const baseSummary = this._selectSummaryVariant(jobIdentity);
      const summary     = await this._generateAdaptiveSummary(
        jobDescription, jdAnalysis, jobIdentity, baseSummary
      );

      // ── 5. Assemble personal info (masterProfile as authority) ─────────────────
      // Preserve phone from the uploaded CV if available (not stored in masterProfile)
      const uploadedPhone = parsedCV?.personalInfo?.phone || "";
      const personalInfo  = {
        ...MASTER_PROFILE.personalInfo,
        phone: uploadedPhone,
      };

      // ── 6. Assemble full experience array (regular + "Proyectos" header + projects) ──
      // This preserves the "Proyectos Destacados" split pattern expected by the frontend and PDF.
      const experience = [
        ...adaptiveExperience,
        { role: "Proyectos Destacados", company: "", startDate: "", endDate: "", achievements: [] },
        ...adaptiveProjects,
      ];

      // ── 7. Languages and certifications from masterProfile ───────────────────────
      const languages = MASTER_PROFILE.languages.map((l) => ({
        name:           l.name,
        level:          l.level,
        certificateUrl: l.certificateUrl || null,
      }));

      const certifications = MASTER_PROFILE.certifications.map((c) => ({
        name:   c.name,
        issuer: c.issuer,
        date:   c.date,
        url:    c.url || null,
      }));

      // ── 8. Apply bullet validation to all experience entries ──────────────────
      // Deduplicates, removes fragments, and quality-checks each achievement list.
      const sanitizedExperience = experience.map((exp) => ({
        ...exp,
        achievements: this._validateBullets(exp.achievements || [], exp.role || ""),
      }));

      // ── 9. Assemble the adaptive CV ────────────────────────────────────────────
      // IMPORTANT: education[] is intentionally EMPTY.
      // All education/course data is in certifications[] which renders as "Formación"
      // with certificate URLs. Populating both would create duplicate sections
      // ("Educación" + "Formación") in both the PDF and the CVPreview component.
      const rawCV = {
        personalInfo,
        summary,
        experience: sanitizedExperience,
        skills: adaptiveSkills.filter((sg) => (sg.items || []).length > 0),
        education: [],
        languages,
        certifications,
        // Architecture metadata — ignored by current frontend, available for Phase 3
        architecture: {
          jobIdentity,
          sectionOrder:          this._getSectionOrder(jobIdentity),
          projectCount:          adaptiveProjects.length,
          experienceBulletLimits: {
            municipalidadGodoyCruz: adaptiveExperience[0]?.achievements.length ?? 0,
            casaDelFuturo:          adaptiveExperience[1]?.achievements.length ?? 0,
            divisionGIS:            adaptiveExperience[2]?.achievements.length ?? 0,
          },
          keywordClassification,
          keywordsSupported:    keywordClassification.filter((k) => k.action === "include").map((k) => k.keyword),
          keywordsLearning:     keywordClassification.filter((k) => k.status === "learning").map((k) => k.keyword),
          keywordsExcluded:     keywordClassification.filter((k) => k.action === "exclude").map((k) => k.keyword),
        },
      };

      // ── 10. Validate structure and content ────────────────────────────────────
      const { cv: validatedCV, warnings } = this.validateGeneratedCV(rawCV, jdAnalysis.keywords || []);
      if (warnings.length > 0) {
        console.warn("[optimizeCV] Validation warnings:", warnings.join(" | "));
      }

      // ── 11. Sanitize text encoding (fixes jsPDF `→` corruption) ───────────────
      return this._sanitizeCV(validatedCV);

    } catch (err) {
      console.error("[optimizeCV adaptive] Unexpected error, falling back to legacy:", err.message);
      return this._normalizeOptimizedCV({}, parsedCV, rawCVText, profileSummary, jdAnalysis);
    }
  }

  // ─── Skill text extractor (fallback) ─────────────────────────────────────────

  _extractSkillsFromText(rawText) {
    const allLines = rawText.split("\n").map((l) => l.trim());
    const SKILL_HEADER = /^(?:habilidades|skills?|tecnolog|stack\s+t[eé]cnico|competencias)/i;
    const NEXT_SECTION = /^(?:experiencia|experience|educaci[oó]n|education|idiomas?|languages?|certif)/i;
    const startIdx = allLines.findIndex((l) => SKILL_HEADER.test(l));
    let sourceLines = allLines;
    if (startIdx !== -1) {
      const endIdx = allLines.findIndex((l, i) => i > startIdx && NEXT_SECTION.test(l));
      sourceLines = allLines.slice(startIdx + 1, endIdx === -1 ? undefined : endIdx);
    }
    const skillMap = new Map();
    for (const line of sourceLines) {
      if (/^[•\-\*▪►]\s*/.test(line)) continue;
      const m = line.match(/^([^:\n]{2,40}):\s*(.{4,})$/);
      if (!m) continue;
      const items = m[2].split(/[,;]/).map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
      if (items.length < 2) continue;
      const key = m[1].trim().toLowerCase();
      if (skillMap.has(key)) {
        skillMap.get(key).items = [...new Set([...skillMap.get(key).items, ...items])];
      } else {
        skillMap.set(key, { category: m[1].trim(), items });
      }
    }
    return [...skillMap.values()];
  }

  // ─── Legacy normalizer (kept as fallback for catch blocks) ──────────────────

  _normalizeOptimizedCV(raw, original, rawText = "", profileSummary = "", jdAnalysis = null) {
    const hasSkills = (arr) => Array.isArray(arr) && arr.some((sg) => sg.items?.length > 0);
    const hasExp    = (arr) => Array.isArray(arr) && arr.length > 0;

    const filterSkillItems = (groups) =>
      groups.map((sg) => ({
        ...sg,
        items: (sg.items || []).filter(
          (item) => typeof item === "string" && item.trim().length > 0
            && item.split(/\s+/).length <= 4 && item.length <= 50
        ),
      }));

    const extractedSkills = this._extractSkillsFromText(rawText);
    const sourceSkills = hasSkills(raw.skills)
      ? filterSkillItems(raw.skills)
      : hasSkills(original.skills)
        ? filterSkillItems(original.skills)
        : hasSkills(extractedSkills)
          ? filterSkillItems(extractedSkills)
          : [];

    const skillMap = new Map(
      DEFAULT_SKILL_CATEGORIES.map((sg) => [sg.category.toLowerCase(), { ...sg, items: [...sg.items] }])
    );
    for (const sg of sourceSkills) {
      if (!sg.category) continue;
      const key = sg.category.toLowerCase();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        existing.items = [...new Set([...existing.items, ...sg.items])];
      } else {
        skillMap.set(key, sg);
      }
    }
    const skills = [...skillMap.values()];

    const rawExp = hasExp(raw.experience) ? raw.experience : (original.experience || []);
    const projIdx = rawExp.findIndex((e) =>
      /proyecto[s]?\s+destacados?/i.test(e.role || "") ||
      /proyecto[s]?\s+destacados?/i.test(e.company || "")
    );
    const rawRegularExp = projIdx === -1 ? rawExp : rawExp.slice(0, projIdx);

    const regularExp = DEFAULT_REGULAR_EXPERIENCE.map((defaultEntry, idx) => ({
      ...defaultEntry,
      achievements: rawRegularExp[idx]?.achievements?.length
        ? rawRegularExp[idx].achievements
        : defaultEntry.achievements,
    })).concat(rawRegularExp.slice(DEFAULT_REGULAR_EXPERIENCE.length));

    const experience = [
      ...regularExp,
      { role: "Proyectos Destacados", company: "", startDate: "", endDate: "", achievements: [] },
      ...DEFAULT_PROJECTS,
    ];

    const piBase = raw.personalInfo || original.personalInfo || {};
    const pick   = (a, b) => a?.trim() || b?.trim() || "";
    const personalInfo = {
      name:      pick(piBase.name,      original.personalInfo?.name)      || DEFAULT_PERSONAL_INFO.name,
      email:     pick(piBase.email,     original.personalInfo?.email),
      phone:     pick(piBase.phone,     original.personalInfo?.phone),
      location:  pick(piBase.location,  original.personalInfo?.location)  || DEFAULT_PERSONAL_INFO.location,
      linkedin:  pick(piBase.linkedin,  original.personalInfo?.linkedin)  || DEFAULT_PERSONAL_INFO.linkedin,
      github:    pick(piBase.github,    original.personalInfo?.github)    || DEFAULT_PERSONAL_INFO.github,
      portfolio: pick(piBase.portfolio, original.personalInfo?.portfolio) || DEFAULT_PERSONAL_INFO.portfolio,
      website:   pick(piBase.website,   original.personalInfo?.website),
    };

    const jdKeywords = jdAnalysis?.keywords || [];
    const experienceSorted = experience.map((entry) => ({
      ...entry,
      achievements: this._sortByRelevance(entry.achievements || [], jdKeywords),
    }));
    const skillsSorted = skills.map((sg) => ({
      ...sg,
      items: this._sortByRelevance(sg.items || [], jdKeywords),
    }));

    return {
      personalInfo,
      summary: raw.summary || profileSummary || DEFAULT_SUMMARY,
      experience: experienceSorted,
      skills: skillsSorted,
      education: hasExp(raw.education) ? raw.education : (original.education || []),
      languages: (() => {
        const base = Array.isArray(raw.languages) && raw.languages.length
          ? raw.languages
          : (original.languages?.length ? original.languages : DEFAULT_LANGUAGES);
        const normalized = base.map((l) => l.name ? l : { ...l, name: l.language });
        return normalized.map((l) => {
          if (l.certificateUrl) return l;
          const def = DEFAULT_LANGUAGES.find((d) => d.name.toLowerCase() === (l.name || "").toLowerCase());
          return def?.certificateUrl ? { ...l, certificateUrl: def.certificateUrl } : l;
        });
      })(),
      certifications: DEFAULT_CERTIFICATIONS,
    };
  }

  // ─── Fuzzy + Alias Matching ──────────────────────────────────────────────────

  _fuzzyMatch(keyword, cvWords) {
    for (const word of cvWords) {
      if (word === keyword) return true;
      const minLen = Math.min(keyword.length, word.length);
      if (minLen >= 4 && keyword.slice(0, 4) === word.slice(0, 4)) return true;
      if (minLen >= 3 && (keyword.startsWith(word) || word.startsWith(keyword))) return true;
    }
    return false;
  }

  _aliasMatch(keyword, cvTextNorm, cvWords) {
    const aliases = ALIAS_MAP.get(keyword) || [];
    for (const alias of aliases) {
      if (alias.includes(" ")) {
        if (cvTextNorm.includes(alias)) return true;
      } else {
        if (cvWords.has(alias) || this._fuzzyMatch(alias, cvWords)) return true;
      }
    }
    return false;
  }

  applyKeywordReplacements(text, jdKeywords) {
    if (!text || !jdKeywords?.length) return text;
    const sorted = [...jdKeywords].sort((a, b) => b.length - a.length);
    let result = text;
    for (const keyword of sorted) {
      const kwNorm = this._normalize(keyword);
      result = result.replace(/\b[\w.+-]+\b/g, (match) => {
        const matchNorm = this._normalize(match);
        if (matchNorm === kwNorm) return keyword;
        const minLen = Math.min(kwNorm.length, matchNorm.length);
        if (minLen >= 4 && kwNorm.slice(0, 4) === matchNorm.slice(0, 4)) return keyword;
        if (minLen >= 3 && (kwNorm.startsWith(matchNorm) || matchNorm.startsWith(kwNorm))) return keyword;
        return match;
      });
    }
    return result;
  }

  // ─── ATS Scoring ─────────────────────────────────────────────────────────────

  calculateATSScore(parsedCV, jdAnalysis, rawText = "") {
    const parsedFlat = this._flattenCVToText(parsedCV);
    const cvTextNorm = this._normalize([parsedFlat, rawText].filter(Boolean).join(" "));
    const cvWords    = new Set(cvTextNorm.split(/\s+/).filter((w) => w.length >= 3));

    const allKeywords = [...new Set(
      [...(jdAnalysis.keywords || []), ...(jdAnalysis.requiredSkills || [])]
        .map((k) => this._normalize(k))
        .filter(Boolean)
    )];

    const keywordsFound   = [];
    const keywordsMissing = [];
    const keywordsFuzzy   = [];

    for (const kw of allKeywords) {
      if (cvTextNorm.includes(kw)) {
        keywordsFound.push(kw);
      } else if (this._fuzzyMatch(kw, cvWords)) {
        keywordsFound.push(kw);
        keywordsFuzzy.push(kw);
      } else if (this._aliasMatch(kw, cvTextNorm, cvWords)) {
        keywordsFound.push(kw);
        keywordsFuzzy.push(kw);
      } else {
        keywordsMissing.push(kw);
      }
    }

    const keywordScore = allKeywords.length > 0
      ? (keywordsFound.length / allKeywords.length) * 50
      : 25;

    const requiredSkills = [...new Set(
      (jdAnalysis.requiredSkills || []).map((s) => this._normalize(s)).filter(Boolean)
    )];
    const skillsMatched = [];
    const skillsMissing = [];
    for (const s of requiredSkills) {
      if (cvTextNorm.includes(s) || this._fuzzyMatch(s, cvWords) || this._aliasMatch(s, cvTextNorm, cvWords)) {
        skillsMatched.push(s);
      } else {
        skillsMissing.push(s);
      }
    }

    const skillScore = requiredSkills.length > 0
      ? (skillsMatched.length / requiredSkills.length) * 30
      : 15;

    const hasSkills     = (parsedCV.skills || []).length > 0;
    const hasExperience = (parsedCV.experience || []).length > 0;
    const hasEducation  = (parsedCV.education || []).length > 0;
    const hasSummary    = !!(parsedCV.summary || "").trim();
    const hasContact    = !!(parsedCV.personalInfo?.email || parsedCV.personalInfo?.phone);
    const structureScore =
      (hasSkills ? 6 : 0) + (hasExperience ? 6 : 0) + (hasEducation ? 3 : 0) +
      (hasSummary ? 3 : 0) + (hasContact ? 2 : 0);

    const totalScore = Math.round(keywordScore + skillScore + structureScore);
    const kwCount    = allKeywords.length;
    const confidence = kwCount === 0 ? "none" : kwCount < 5 ? "low" : kwCount < 13 ? "medium" : "high";

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      confidence,
      keywordsFound:   keywordsFound.slice(0, 25),
      keywordsMissing: keywordsMissing.slice(0, 15),
      keywordsFuzzy:   keywordsFuzzy.slice(0, 15),
      skillsMatched:   skillsMatched.slice(0, 12),
      skillsMissing:   skillsMissing.slice(0, 10),
      breakdown: {
        keywords:  Math.round(keywordScore),
        skills:    Math.round(skillScore),
        structure: Math.round(structureScore),
      },
      recommendations: this._generateRecommendations(
        keywordsFound, keywordsMissing, skillsMatched, skillsMissing, parsedCV
      ),
    };
  }

  _flattenCVToText(parsedCV) {
    const parts = [];
    if (parsedCV.summary) parts.push(parsedCV.summary);
    (parsedCV.skills || []).forEach((sg) => parts.push(...(sg.items || [])));
    (parsedCV.experience || []).forEach((exp) => {
      parts.push(exp.role || "", exp.company || "", exp.description || "");
      parts.push(...(exp.achievements || []));
    });
    (parsedCV.certifications || []).forEach((c) => parts.push(c.name || ""));
    return parts.join(" ");
  }

  _generateRecommendations(keywordsFound, keywordsMissing, skillsMatched, skillsMissing, parsedCV) {
    const recs  = [];
    const total = keywordsFound.length + keywordsMissing.length;
    const matchRate = total > 0 ? keywordsFound.length / total : 0;

    if (skillsMissing.length > 0) {
      recs.push(`Agregar estas skills si las tenés: ${skillsMissing.slice(0, 3).join(", ")}`);
    }
    if (keywordsMissing.length > 3) {
      recs.push(`Incorporar en tu CV estos términos donde aplique: ${keywordsMissing.slice(0, 4).join(", ")}`);
    }
    if (!parsedCV.summary) {
      recs.push("Agregar un resumen profesional al inicio del CV con keywords de la oferta");
    }
    if ((parsedCV.experience || []).some((e) => !e.achievements?.length)) {
      recs.push("Agregar bullet points de logros cuantificables en cada posición");
    }
    if ((parsedCV.skills || []).length === 0) {
      recs.push("Agregar una sección de habilidades técnicas organizada por categorías");
    }
    if (matchRate < 0.35 && total > 3) {
      recs.push("Bajo matching con la oferta. Usá el mismo vocabulario técnico que la descripción");
    }
    if (!parsedCV.personalInfo?.linkedin) {
      recs.push("Agregar URL de LinkedIn al encabezado del CV");
    }
    return recs.slice(0, 6);
  }

  // ─── Text sanitization ────────────────────────────────────────────────────────
  //
  // Converts characters outside the Windows-1252 encoding range that jsPDF
  // cannot render with its default Helvetica font. Also strips Markdown artifacts
  // that may leak from LLM output.
  //
  // Root cause of `presentado !' en revisión !' observado` corruption:
  //   The arrow character → (U+2192) is not in Windows-1252/jsPDF Helvetica encoding.
  //   jsPDF silently drops or corrupts it. Fix: convert to ASCII equivalent `->`.

  _sanitizeText(text) {
    if (!text || typeof text !== "string") return text;
    return text
      // Unicode directional arrows — NOT in Windows-1252/jsPDF Helvetica
      .replace(/→/g, "->")
      .replace(/←/g, "<-")
      .replace(/↑/g, "^")
      .replace(/↓/g, "v")
      .replace(/⇒/g, "=>")
      .replace(/⇐/g, "<=")
      // Markdown bold that may leak from LLM output
      .replace(/\*\*([^*\n]+)\*\*/g, "$1")
      // Backslash escape sequences (LLM output artifacts)
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      // Collapse multiple spaces (but preserve single newlines in multi-line content)
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  // Recursively apply _sanitizeText to all string fields in the CV object.
  _sanitizeCV(cv) {
    if (!cv || typeof cv !== "object") return cv;
    const s = (v) => (typeof v === "string" ? this._sanitizeText(v) : v);
    const arr = (a, fn) => (Array.isArray(a) ? a.map(fn) : a);

    return {
      ...cv,
      summary:    s(cv.summary),
      experience: arr(cv.experience, (exp) => ({
        ...exp,
        role:         s(exp.role),
        company:      s(exp.company),
        achievements: arr(exp.achievements, s),
      })),
      skills: arr(cv.skills, (sg) => ({
        ...sg,
        category: s(sg.category),
        items:    arr(sg.items, s),
      })),
      education: arr(cv.education, (edu) => ({
        ...edu,
        degree:      s(edu.degree),
        institution: s(edu.institution),
      })),
      certifications: arr(cv.certifications, (c) => ({
        ...c,
        name:   s(c.name),
        issuer: s(c.issuer),
      })),
      languages: arr(cv.languages, (l) => ({
        ...l,
        name:  s(l.name),
        level: s(l.level),
      })),
    };
  }

  // ─── Bullet validation ────────────────────────────────────────────────────────
  //
  // Filters achievement bullet points:
  //   - Removes bullets with fewer than MIN_WORDS words (fragments)
  //   - Removes exact duplicates within the same entry
  //   - Removes entries that are just URLs or bare numbers
  //
  // Does NOT apply to project header entries (role = "Proyectos Destacados").

  _validateBullets(bullets, context = "") {
    if (!Array.isArray(bullets) || bullets.length === 0) return bullets;
    const MIN_WORDS = 5;
    const seen      = new Set();
    const result    = [];

    for (const rawBullet of bullets) {
      const b = typeof rawBullet === "string" ? rawBullet.trim() : "";
      if (!b) continue;

      // Skip: pure URL
      if (/^https?:\/\/\S+$/.test(b)) {
        console.warn(`[_validateBullets][${context}] Removing URL-only bullet`);
        continue;
      }

      // Skip: too short (fragment)
      const wordCount = b.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_WORDS) {
        console.warn(`[_validateBullets][${context}] Removing short fragment (${wordCount} words): "${b.slice(0, 60)}"`);
        continue;
      }

      // Skip: exact duplicate (case-insensitive, whitespace-normalized)
      const key = b.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) {
        console.warn(`[_validateBullets][${context}] Removing duplicate: "${b.slice(0, 60)}"`);
        continue;
      }

      seen.add(key);
      result.push(b);
    }

    return result;
  }

  // ─── CV Validation ────────────────────────────────────────────────────────────
  //
  // Structural, factual, and content validation of the generated CV.
  // Called before returning from optimizeCV().
  // Returns: { valid, warnings[], fixes[], cv }
  // When auto-fixable issues are found, returns the fixed cv.

  validateGeneratedCV(cv, jdKeywords = []) {
    const warnings = [];
    const fixes    = [];
    let   out      = { ...cv };  // shallow copy — we'll rebuild modified arrays as needed

    // ── STRUCTURAL ──────────────────────────────────────────────────────────────

    // 1. Education + Certifications duplication
    const hasEdu  = (out.education      || []).length > 0;
    const hasCert = (out.certifications || []).length > 0;
    if (hasEdu && hasCert) {
      const eduNames  = (out.education      || []).map((e) => (e.degree  || "").toLowerCase().slice(0, 20));
      const certNames = (out.certifications || []).map((c) => (c.name    || "").toLowerCase().slice(0, 20));
      const overlap   = eduNames.filter((d) => d && certNames.some((n) => n.startsWith(d.slice(0, 10)) || d.startsWith(n.slice(0, 10))));
      if (overlap.length >= 1) {
        warnings.push(`DUPLICATION: education[] and certifications[] share ${overlap.length}+ entries — rendering both creates duplicate "Educación" + "Formación" sections.`);
        // Auto-fix: clear education[] to avoid duplication.
        // certifications[] is preferred because it includes certificate URLs.
        out = { ...out, education: [] };
        fixes.push("education[] cleared (content already in certifications[] which includes certificate URLs)");
      }
    }

    // 2. Empty skill categories
    const emptyCategories = (out.skills || []).filter((sg) => !(sg.items || []).length);
    if (emptyCategories.length > 0) {
      warnings.push(`EMPTY_CATEGORIES: ${emptyCategories.map((sg) => `"${sg.category}"`).join(", ")} have no items`);
      out = { ...out, skills: out.skills.filter((sg) => (sg.items || []).length > 0) };
      fixes.push(`Removed ${emptyCategories.length} empty skill categor${emptyCategories.length === 1 ? "y" : "ies"}`);
    }

    // 3. Duplicate experience/project entries (same role string)
    const roles    = (out.experience || []).map((e) => (e.role || "").toLowerCase().trim());
    const roleSeen = new Set();
    const dupRoles = [];
    for (const r of roles) {
      if (r && roleSeen.has(r)) dupRoles.push(r);
      roleSeen.add(r);
    }
    if (dupRoles.length > 0) {
      warnings.push(`DUPLICATE_ENTRIES: Repeated role/project: ${dupRoles.slice(0, 3).map((r) => `"${r}"`).join(", ")}`);
    }

    // ── CONTENT ─────────────────────────────────────────────────────────────────

    // 4. Summary word count
    const summaryWords = (out.summary || "").split(/\s+/).filter(Boolean).length;
    if (summaryWords < 30) {
      warnings.push(`SUMMARY_TOO_SHORT: ${summaryWords} words (expected 70-120)`);
    } else if (summaryWords > 200) {
      warnings.push(`SUMMARY_TOO_LONG: ${summaryWords} words (expected 70-120)`);
    }

    // 5. Remaining encoding issues in bullets after sanitization
    const allBullets = (out.experience || []).flatMap((e) => e.achievements || []);
    const badEncoding = allBullets.filter((b) => /→|←|↑|↓|\*\*|\\n|\\t/.test(b));
    if (badEncoding.length > 0) {
      warnings.push(`ENCODING_ISSUES: ${badEncoding.length} bullet(s) still contain unsanitized special characters`);
    }

    // 6. Markdown artifacts in summary
    if (/\*\*|^#{1,6}\s|`{1,3}/m.test(out.summary || "")) {
      warnings.push("MARKDOWN_IN_SUMMARY: Summary contains Markdown formatting (**, #, `) — strip before output");
    }

    // ── FACTUAL ─────────────────────────────────────────────────────────────────

    // 7. D-level technologies in main skill sections (not in "Conocimientos en desarrollo")
    const mainSkillItems = (out.skills || [])
      .filter((sg) => !/conocimientos/i.test(sg.category || ""))
      .flatMap((sg) => sg.items || []);
    const dLevelInMain = mainSkillItems.filter((item) => {
      const tech = getTechnologyEvidence(item);
      return tech && tech.category === "D";
    });
    if (dLevelInMain.length > 0) {
      warnings.push(`EVIDENCE_VIOLATION: D-level techs in main skills: ${dLevelInMain.join(", ")}`);
    }

    // 8. Personal info completeness
    const pi = out.personalInfo || {};
    if (!pi.email)   warnings.push("MISSING_FIELD: personalInfo.email is empty");
    if (!pi.name)    warnings.push("MISSING_FIELD: personalInfo.name is empty");
    if (!pi.linkedin) warnings.push("MISSING_FIELD: personalInfo.linkedin is empty");

    // ── ATS ──────────────────────────────────────────────────────────────────────

    // 9. At least one experience entry with achievements
    const hasAchievements = (out.experience || []).some(
      (e) => !/proyecto[s]?\s+destacados?/i.test(e.role || "") && (e.achievements || []).length > 0
    );
    if (!hasAchievements) {
      warnings.push("ATS_ISSUE: No experience entry has achievement bullets — ATS parsers will score low");
    }

    // 10. Skills section exists
    if (!(out.skills || []).some((sg) => (sg.items || []).length > 0)) {
      warnings.push("ATS_ISSUE: Skills section is empty");
    }

    const valid = warnings.filter((w) => !w.startsWith("MISSING_FIELD: personalInfo.linkedin")).length === 0;
    return { valid, warnings, fixes, cv: out };
  }

  // ─── FASE 2: recoverMissingSupportedKeywords ──────────────────────────────────
  //
  // Replaces injectMissingKeywords().
  // Only adds technologies with evidence A or B from the master profile.
  // C and D are never added to any skill category.

  recoverMissingSupportedKeywords(optimizedCV, jdKeywords) {
    if (!jdKeywords?.length) return optimizedCV;

    const skills = (optimizedCV.skills || []).map((sg) => ({ ...sg, items: [...(sg.items || [])] }));

    // Build dedup set (normalized names + aliases)
    const existingNorm = new Set(
      skills.flatMap((sg) =>
        (sg.items || []).flatMap((item) => {
          const norm = this._normalize(item);
          return [norm, ...(ALIAS_MAP.get(norm) || [])];
        })
      )
    );

    // Category type detection (reuse ITEM_SIGNALS)
    const catTypes = skills.map((sg) => {
      const itemsNorm = (sg.items || []).map((i) => this._normalize(i));
      for (const { type, keys } of ITEM_SIGNALS) {
        if (keys.some((k) =>
          itemsNorm.some((item) => item === k || item.startsWith(k.slice(0, 4)) || k.startsWith(item.slice(0, 4)))
        )) return type;
      }
      return null;
    });

    let supplementCat = null;

    for (const kw of jdKeywords) {
      const kwNorm = this._normalize(kw);
      if (kwNorm.split(" ").length > 3) continue;

      // Skip if already present (exact or alias)
      if (existingNorm.has(kwNorm) || (ALIAS_MAP.get(kwNorm) || []).some((a) => existingNorm.has(a))) continue;

      // Skip fuzzy prefix match
      if (kwNorm.length >= 4) {
        const prefix = kwNorm.slice(0, 4);
        if ([...existingNorm].some((e) => e.length >= 4 && (e.startsWith(prefix) || kwNorm.startsWith(e.slice(0, 4))))) continue;
      }

      // Check evidence — ONLY A and B are recoverable
      const tech = getTechnologyEvidence(kw);
      if (!tech || tech.category === "C" || tech.category === "D") continue;

      // Try to place in the matching skill category
      let placed = false;
      for (let i = 0; i < skills.length; i++) {
        const catType = catTypes[i];
        if (!catType) continue;
        const { keys } = ITEM_SIGNALS.find((s) => s.type === catType) || {};
        if (!keys) continue;
        if (keys.some((k) => kwNorm.startsWith(k.slice(0, 4)) || k.startsWith(kwNorm.slice(0, 4)))) {
          skills[i].items.push(this._prettifyKeyword(kw));
          existingNorm.add(kwNorm);
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Add to "Stack adicional" as secondary placement
        if (!supplementCat) {
          supplementCat = skills.find((sg) => /stack\s+adicional/i.test(sg.category));
          if (!supplementCat) {
            supplementCat = { category: "Stack adicional", items: [] };
            skills.push(supplementCat);
          }
        }
        if (!supplementCat.items.includes(this._prettifyKeyword(kw))) {
          supplementCat.items.push(this._prettifyKeyword(kw));
          existingNorm.add(kwNorm);
        }
      }
    }

    return { ...optimizedCV, skills };
  }

  // ─── Legacy: injectMissingKeywords (kept for backward compatibility) ──────────
  //
  // DEPRECATED: This method injects ANY JD keyword without checking evidence.
  // Use recoverMissingSupportedKeywords() instead.

  injectMissingKeywords(optimizedCV, allKeywords) {
    if (!allKeywords?.length) return optimizedCV;

    const skills = (optimizedCV.skills || []).map((sg) => ({ ...sg, items: [...sg.items] }));
    const existingNorm = new Set(
      skills.flatMap((sg) =>
        sg.items.flatMap((item) => {
          const norm = this._normalize(item);
          return [norm, ...(ALIAS_MAP.get(norm) || [])];
        })
      )
    );

    const catTypes = skills.map((sg) => {
      const itemsNorm = (sg.items || []).map((i) => this._normalize(i));
      for (const { type, keys } of ITEM_SIGNALS) {
        if (keys.some((k) => itemsNorm.some((item) => item === k || item.startsWith(k.slice(0, 4)) || k.startsWith(item.slice(0, 4))))) {
          return type;
        }
      }
      return null;
    });

    const unmatched = [];
    for (const kw of allKeywords) {
      const kwNorm = this._normalize(kw);
      if (kwNorm.split(" ").length > 3) continue;
      if (existingNorm.has(kwNorm) || (ALIAS_MAP.get(kwNorm) || []).some((a) => existingNorm.has(a))) continue;
      if (kwNorm.length >= 4) {
        const prefix = kwNorm.slice(0, 4);
        const alreadyThere = [...existingNorm].some(
          (e) => e.length >= 4 && (e.startsWith(prefix) || kwNorm.startsWith(e.slice(0, 4)))
        );
        if (alreadyThere) continue;
      }

      let placed = false;
      for (let i = 0; i < skills.length; i++) {
        const catType = catTypes[i];
        if (!catType) continue;
        const { keys } = ITEM_SIGNALS.find((s) => s.type === catType) || {};
        if (!keys) continue;
        if (keys.some((k) => kwNorm.startsWith(k.slice(0, 4)) || k.startsWith(kwNorm.slice(0, 4)))) {
          skills[i].items.push(this._prettifyKeyword(kw));
          existingNorm.add(kwNorm);
          placed = true;
          break;
        }
      }
      if (!placed) unmatched.push(kw);
    }

    if (unmatched.length > 0) {
      const stackCat = skills.find((sg) => /stack\s+adicional/i.test(sg.category));
      if (stackCat) {
        const prettified = unmatched.map((kw) => this._prettifyKeyword(kw));
        stackCat.items.push(...prettified.filter((p) => !stackCat.items.includes(p)));
      } else {
        skills.push({ category: "Stack adicional", items: unmatched.map((kw) => this._prettifyKeyword(kw)) });
      }
    }

    return { ...optimizedCV, skills };
  }

  _prettifyKeyword(kw) {
    const MAP = {
      javascript: "JavaScript", typescript: "TypeScript", nodejs: "Node.js",
      reactjs: "React", vuejs: "Vue.js", angularjs: "Angular",
      nextjs: "Next.js", nuxtjs: "Nuxt.js", nestjs: "NestJS",
      expressjs: "Express.js", postgresql: "PostgreSQL", mongodb: "MongoDB",
      kubernetes: "Kubernetes", github: "GitHub", gitlab: "GitLab",
      graphql: "GraphQL", html: "HTML", html5: "HTML5", css: "CSS", css3: "CSS3",
      scss: "SCSS", sass: "SASS", sql: "SQL", aws: "AWS", gcp: "GCP",
      php: "PHP", cicd: "CI/CD", oauth: "OAuth", oauth2: "OAuth2",
      redux: "Redux", prisma: "Prisma", mongoose: "Mongoose",
      typeorm: "TypeORM", sequelize: "Sequelize", drizzle: "Drizzle",
      rabbitmq: "RabbitMQ", "github actions": "GitHub Actions",
      "google cloud": "Google Cloud", "rest api": "REST API",
      "react native": "React Native", "testing library": "Testing Library",
      "styled components": "Styled Components",
    };
    const norm = this._normalize(kw);
    if (MAP[norm]) return MAP[norm];
    if (kw.length <= 4 && !kw.includes(" ")) return kw.toUpperCase();
    return kw.charAt(0).toUpperCase() + kw.slice(1);
  }

  // ─── Text Formatter ──────────────────────────────────────────────────────────

  formatOptimizedCVText(optimizedCV) {
    const lines = [];
    const pi    = optimizedCV.personalInfo || {};
    const sep   = "─".repeat(55);

    if (pi.name) { lines.push(pi.name.toUpperCase(), ""); }
    const contactParts = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean);
    if (contactParts.length) { lines.push(contactParts.join("  |  "), ""); }

    if (optimizedCV.summary) {
      lines.push("RESUMEN PROFESIONAL", sep, optimizedCV.summary, "");
    }

    if ((optimizedCV.experience || []).length > 0) {
      lines.push("EXPERIENCIA PROFESIONAL", sep);
      optimizedCV.experience.forEach((exp) => {
        lines.push(`${exp.role || ""}  —  ${exp.company || ""}`);
        const period = [exp.startDate, exp.endDate || "Presente"].filter(Boolean).join(" – ");
        if (period) lines.push(period);
        (exp.achievements || []).forEach((a) => lines.push(`  • ${a}`));
        lines.push("");
      });
    }

    if ((optimizedCV.skills || []).length > 0) {
      lines.push("HABILIDADES TÉCNICAS", sep);
      optimizedCV.skills.forEach((sg) => {
        if (sg.category && (sg.items || []).length > 0) {
          lines.push(`${sg.category}: ${sg.items.join(", ")}`);
        }
      });
      lines.push("");
    }

    if ((optimizedCV.education || []).length > 0) {
      lines.push("EDUCACIÓN", sep);
      optimizedCV.education.forEach((edu) => {
        lines.push(`${edu.degree || ""}  —  ${edu.institution || ""}`);
        const period = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
        if (period) lines.push(period);
        lines.push("");
      });
    }

    if ((optimizedCV.languages || []).length > 0) {
      lines.push("IDIOMAS", sep);
      optimizedCV.languages.forEach((l) => {
        if (l.name) lines.push(`${l.name}: ${l.level || ""}`);
      });
    }

    return lines.join("\n");
  }
}

export const atsOptimizerService = new ATSOptimizerService();
