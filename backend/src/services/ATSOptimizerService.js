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

// ─── FASE 4: Non-technology terms ──────────────────────────────────────────────
//
// The JD keyword extractor (regex + Claude) picks up engineering PRACTICES and
// responsibilities, not just technologies — e.g. TECH_TERMS above includes
// "code review" and "pair programming" so they can be recognized as JD signals
// at all. But a practice is not a skill-list item: "Code Review" sitting next
// to "React" in Skills reads as if it were a tool. These must never be
// recovered into Skills — they can only appear in Experience, and only when
// the master profile already documents that achievement (never synthesized).
// ─── FASE 4: Dedicated section for RECOVERABLE (unverified) keywords ──────────
//
// Per explicit direction: a JD keyword that helps ATS matching but has no
// verified experience behind it should be visible for matching, but NEVER
// blended into the same category list as verified professional/hands-on tech
// (e.g. "Redux" next to "React, TypeScript" in Frontend reads as if Redux were
// equally proven). All RECOVERABLE-level keywords go here instead — one flat,
// clearly-labeled list, same spirit as the "TECHNICAL KEYWORDS" example.
// VERIFIED (A/B, incl. the AWS override) keywords still land in their natural
// per-domain category, same as before.
const RECOVERABLE_CATEGORY = "Tecnologías adicionales";

// Meta-descriptors on TECHNOLOGY_EVIDENCE_MATRIX's `tags` field that classify
// WHAT KIND of thing a technology is, not what domain/context it serves.
// Excluded from the tier-3 "complementary technology" tag-overlap signal in
// _rankVerifiedTechnologies() — two techs sharing "language" or "framework"
// (e.g. Python + PHP) aren't meaningfully related just because of that.
const GENERIC_TECH_TAGS = new Set(["language", "framework", "tools", "methodology"]);

// A CV listing a dozen+ unverified technologies reads as padding, not signal.
// Cap the bucket after sorting by priority (must_have > nice_to_have > secondary)
// so the JD's actual requirements survive the cut, not whatever happened to be
// processed first.
const MAX_RECOVERABLE_ITEMS = 8;

const NON_TECH_TERMS = new Set([
  "code review", "pair programming", "test driven", "sprint planning",
  "stakeholder communication", "architectural discussions", "debugging",
  "mentoring", "quick fix", "technical opinion", "critical judgment",
  "clean architecture", "hexagonal", "solid", "event-driven", "microservices",
  "lean", "agile", "devops",
]);

// Category signal detector — used by both injectMissingKeywords and recoverMissingSupportedKeywords
const ITEM_SIGNALS = [
  { type: "frontend", keys: ["react", "vue", "angular", "svelte", "html", "css", "javascript", "typescript", "nextjs", "nuxtjs", "sass", "scss", "redux", "webpack", "vite", "jquery", "bootstrap", "tailwind", "gatsby", "remix", "astro"] },
  { type: "backend",  keys: ["nodejs", "express", "django", "flask", "rails", "spring", "php", "fastapi", "nestjs", "koa", "graphql", "restful", "python", "golang", "java", "laravel", "aspnet", "dotnet"] },
  { type: "database", keys: ["postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra", "mariadb", "oracle", "sql", "dynamodb", "firebase", "supabase"] },
  { type: "devops",   keys: ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "circleci", "cicd", "linux", "github", "gitlab", "helm", "nginx", "ansible", "argocd", "github actions", "gitlab ci"] },
  { type: "mobile",   keys: ["react native", "flutter", "android", "ios", "swift", "kotlin", "ionic", "expo", "capacitor"] },
];

// ─── FASE 3: Technology → Skills-category classification ──────────────────────
//
// Replaces the old SKILL_TEMPLATES (hand-curated tech pools per job identity).
// That approach silently dropped verified (A/B) technologies whenever a job
// identity's pool forgot to list them (e.g. "python" pool never listed MinIO,
// Socket.io, GitHub...). This map instead classifies EVERY known technology by
// its own nature, independent of job identity. buildAdaptiveSkills() then
// COLLECTs the full evidence-backed set and only varies the *category order*
// (and item order within a category) per job identity — nothing is ever
// silently excluded because it wasn't in a hand-picked list.
//
// Canonical category labels (kept in Spanish to match existing CV copy):
//   "Frontend", "Backend", "Base de datos", "DevOps / Cloud", "Storage",
//   "Seguridad", "Mobile", "AI / ML", "Testing", "Herramientas",
//   "APIs / Integración", "Pagos", "Metodologías",
//   "Stack adicional" (fallback — never a silent drop)
const TECH_CATEGORY_MAP = {
  // Frontend
  javascript: "Frontend", typescript: "Frontend", html5: "Frontend", css3: "Frontend",
  react: "Frontend", nextjs: "Frontend", tailwind: "Frontend", bootstrap: "Frontend",

  // Backend
  php: "Backend", python: "Backend", nodejs: "Backend", expressjs: "Backend",
  django: "Backend", "django rest framework": "Backend", laravel: "Backend",
  nestjs: "Backend", fastapi: "Backend", flask: "Backend",
  websocket: "Backend", socketio: "Backend", sql: "Base de datos",

  // Security / Auth
  jwt: "Seguridad", oauth: "Seguridad", saml: "Seguridad", oidc: "Seguridad",

  // Database
  mongodb: "Base de datos", postgresql: "Base de datos", mysql: "Base de datos",
  sqlite: "Base de datos", redis: "Base de datos", dynamodb: "Base de datos",
  cassandra: "Base de datos", elasticsearch: "Base de datos",
  athena: "Base de datos", trino: "Base de datos", presto: "Base de datos",
  bigquery: "Base de datos", "spark sql": "Base de datos", spark: "Base de datos",

  // DevOps / Cloud
  docker: "DevOps / Cloud", "docker compose": "DevOps / Cloud", git: "DevOps / Cloud",
  github: "DevOps / Cloud", vercel: "DevOps / Cloud",
  nginx: "DevOps / Cloud", cicd: "DevOps / Cloud", aws: "DevOps / Cloud",
  "google cloud": "DevOps / Cloud", azure: "DevOps / Cloud", linux: "DevOps / Cloud",
  kubernetes: "DevOps / Cloud", terraform: "DevOps / Cloud",
  airflow: "DevOps / Cloud", dagster: "DevOps / Cloud",
  prefect: "DevOps / Cloud", "step functions": "DevOps / Cloud",
  bash: "DevOps / Cloud", makefile: "DevOps / Cloud", makefiles: "DevOps / Cloud",

  // Storage / Infrastructure — kept distinct from "DevOps / Cloud": these are
  // concrete storage services, not the broader cloud/infra platform. Also keeps
  // MinIO (S3-compatible, professional evidence) visually separate from AWS
  // itself so the CV never implies "MinIO experience" = "AWS S3 experience".
  minio: "Storage", s3: "Storage", cloudinary: "Storage",

  // Mobile
  "react native": "Mobile", expo: "Mobile",

  // AI / ML
  claude: "AI / ML", ollama: "AI / ML", gemini: "AI / ML", "tensorflowjs": "AI / ML",
  "face-api": "AI / ML", "hugging face": "AI / ML", bedrock: "AI / ML",

  // Testing (no verified evidence today — populated only via keyword recovery)
  jest: "Testing", cypress: "Testing", playwright: "Testing", vitest: "Testing",
  mocha: "Testing", selenium: "Testing", pytest: "Testing",

  // Tools
  postman: "Herramientas", "vs code": "Herramientas", figma: "Herramientas",
  jira: "Herramientas", poetry: "Herramientas", uv: "Herramientas", nx: "Herramientas",

  // APIs / Integration
  "rest api": "APIs / Integración", graphql: "APIs / Integración",

  // Payments
  "mercado pago": "Pagos",

  // Methodologies
  scrum: "Metodologías", kanban: "Metodologías",
};

// Order in which categories are shown, per detected job identity.
// Categories with no items are simply skipped — nothing is padded or invented.
const CATEGORY_ORDER_BY_IDENTITY = {
  fullstack:  ["Frontend", "Backend", "Base de datos", "DevOps / Cloud", "AI / ML", "APIs / Integración", "Seguridad", "Pagos", "Mobile", "Storage", "Testing", "Herramientas", "Metodologías", "Stack adicional"],
  backend:    ["Backend", "Base de datos", "APIs / Integración", "Seguridad", "DevOps / Cloud", "Storage", "Frontend", "Testing", "Herramientas", "Metodologías", "Stack adicional"],
  frontend:   ["Frontend", "APIs / Integración", "Backend", "Base de datos", "Testing", "Herramientas", "Mobile", "Seguridad", "Metodologías", "Stack adicional"],
  react:      ["Frontend", "APIs / Integración", "Backend", "Base de datos", "Testing", "Herramientas", "Mobile", "Seguridad", "Metodologías", "Stack adicional"],
  node:       ["Backend", "Base de datos", "APIs / Integración", "Seguridad", "Frontend", "DevOps / Cloud", "Storage", "Testing", "Herramientas", "Metodologías", "Stack adicional"],
  python:     ["Backend", "Base de datos", "APIs / Integración", "Seguridad", "DevOps / Cloud", "Frontend", "Storage", "Testing", "Herramientas", "Metodologías", "Stack adicional"],
  data:       ["Backend", "Base de datos", "Storage", "Frontend", "DevOps / Cloud", "APIs / Integración", "Seguridad", "Herramientas", "Testing", "Metodologías", "Stack adicional"],
  devops:     ["DevOps / Cloud", "Storage", "Backend", "Base de datos", "Seguridad", "Herramientas", "APIs / Integración", "Testing", "Metodologías", "Stack adicional"],
  cloud:      ["DevOps / Cloud", "Storage", "Backend", "Base de datos", "Seguridad", "Herramientas", "APIs / Integración", "Testing", "Metodologías", "Stack adicional"],
  mobile:     ["Mobile", "Frontend", "Backend", "AI / ML", "Base de datos", "Seguridad", "DevOps / Cloud", "Storage", "Herramientas", "Metodologías", "Stack adicional"],
  ai:         ["AI / ML", "Backend", "APIs / Integración", "Base de datos", "Frontend", "DevOps / Cloud", "Storage", "Seguridad", "Herramientas", "Metodologías", "Stack adicional"],
  automation: ["AI / ML", "Backend", "APIs / Integración", "Base de datos", "Herramientas", "DevOps / Cloud", "Storage", "Frontend", "Seguridad", "Metodologías", "Stack adicional"],
  saas:       ["Backend", "Frontend", "Base de datos", "Pagos", "AI / ML", "DevOps / Cloud", "APIs / Integración", "Seguridad", "Storage", "Herramientas", "Metodologías", "Stack adicional"],
  ecommerce:  ["Frontend", "Backend", "Pagos", "Base de datos", "Seguridad", "DevOps / Cloud", "Herramientas", "Metodologías", "Stack adicional"],
  api:        ["Backend", "APIs / Integración", "Seguridad", "Base de datos", "DevOps / Cloud", "Herramientas", "Frontend", "Testing", "Metodologías", "Stack adicional"],
  realtime:   ["Backend", "APIs / Integración", "Base de datos", "Frontend", "Mobile", "Seguridad", "DevOps / Cloud", "Herramientas", "Metodologías", "Stack adicional"],
};

// ─── FASE 3: Evidence overrides ─────────────────────────────────────────────
//
// masterProfile.js remains the untouched source of truth. This override exists
// ONLY for skills-placement and requirement-matching decisions in THIS service,
// per explicit product direction: AWS may be shown as a normal, includable
// technology (correctly bucketed under "DevOps / Cloud") instead of being
// hidden the way category-C ("learning") technologies normally are.
// It does NOT unlock achievement/experience generation — achievements are
// always sourced verbatim from MASTER_PROFILE.experience/.projects, never
// synthesized from this override, so "no production AWS experience" still holds.
const EVIDENCE_OVERRIDES = { aws: "B" };

// getTechnologyEvidence() (masterProfile.js) only matches a tech's own
// `normalized`/`name` fields — it doesn't know about ALIAS_MAP. That means a
// JD shorthand like "express" (alias of "Express.js", which IS verified A-tier)
// would come back null and get misclassified as RECOVERABLE. Fall back to
// alias resolution before giving up, so evidence lookups agree with the
// alias-aware dedup already used elsewhere (recoverMissingKeywords, ATS score).
function getEffectiveEvidence(techName) {
  let tech = getTechnologyEvidence(techName);
  if (!tech && techName) {
    const norm = techName.toLowerCase().replace(/[.\-_]/g, "").replace(/\s+/g, " ").trim();
    for (const alias of (ALIAS_MAP.get(norm) || [])) {
      tech = getTechnologyEvidence(alias);
      if (tech) break;
    }
  }
  if (!tech) return null;
  const override = EVIDENCE_OVERRIDES[tech.normalized];
  return override ? { ...tech, category: override, _overridden: true } : tech;
}

// Technologies with no master-profile record that are neverthless recognizably
// close to something with A/B evidence. Used by buildRequirementMatrix() to
// classify as TRANSFERABLE instead of a flat UNVERIFIED/GAP.
const TRANSFERABLE_MAP = {
  fastapi: ["django rest framework", "django", "python"],
  flask:   ["django", "python"],
  dynamodb: ["mongodb"],
  bash:    ["linux"],
  makefile: ["linux"],
  makefiles: ["linux"],
  celery:  ["node.js"],
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
  data:       ["base de datos", "datos", "postgresql", "mongodb", "mysql", "consulta", "rendimiento", "almacenamiento", "minio", "s3", "compresión", "versionado", "documentos"],
  devops:     ["docker", "contenericé", "contenerizé", "configuré", "despliegue", "infraestructura", "almacenamiento", "minio", "seguro"],
  cloud:      ["minio", "s3", "almacenamiento", "urls firmadas", "storage", "compresión"],
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

  // ─── FASE 3: Shared skill-category classifier ────────────────────────────────
  //
  // Used by both buildAdaptiveSkills() (collecting from the master profile) and
  // recoverMissingKeywords() (placing JD keywords not yet in the CV). Keeping
  // this in one place is what guarantees a technology lands in the same
  // category whether it came from the profile or from keyword recovery.

  // ─── FASE 5: Shared priority-tier classifier ───────────────────────────────────
  //
  // Combines with evidence level (VERIFIED/RECOVERABLE/UNSUPPORTED, see
  // classifyKeywordForRecovery) to drive placement decisions: must_have +
  // verified deserves top billing; secondary + recoverable is the first thing
  // to drop when a section runs out of room. Reused by classifyKeywordForRecovery(),
  // recoverMissingKeywords() (sorting the "Tecnologías adicionales" bucket), and
  // buildAdaptiveExperience() (weighting which achievement bullets surface).

  _priorityTierFor(keyword, jdAnalysis) {
    if (!jdAnalysis) return "secondary";
    const norm = this._normalize(keyword);
    // BUG FIX: multi-word technology names (e.g. matrix name "React Native",
    // which _normalize() keeps AS "react native" — spaces are collapsed, not
    // stripped) don't match a common no-space JD phrasing like "ReactNative"/
    // "React-Native" (_normalize() -> "reactnative"), even though ALIAS_GROUPS
    // already declares them the same technology. That silently misclassified
    // an explicit MUST HAVE "React Native" as "secondary" priority, letting it
    // get pruned by the Skills content budget while single-word siblings like
    // "React"/"Expo" (unaffected by this space-vs-no-space mismatch) survived
    // normally. Consult the same ALIAS_MAP used elsewhere (getEffectiveEvidence,
    // recoverMissingKeywords) before falling back to containment/ratio.
    const normAliases = ALIAS_MAP.get(norm) || [];
    const hits = (list) => (list || []).some((k) => {
      const kn = this._normalize(k);
      if (kn === norm) return true;
      if (normAliases.includes(kn) || (ALIAS_MAP.get(kn) || []).includes(norm)) return true;
      // Guard containment matching against short strings (e.g. "Go" ⊂ "Django")
      // — below 3 chars a substring hit is coincidence, not relatedness.
      if (Math.min(kn.length, norm.length) < 3) return false;
      if (!(kn.includes(norm) || norm.includes(kn))) return false;
      // Length-ratio guard: "git" ⊂ "github" (ratio .5) and "react" ⊂
      // "react native" (.45 normalized) are DIFFERENT, unrelated technologies
      // that only happen to share letters — GitHub isn't "more Git", React
      // Native isn't "more React". A bare substring check treated them as
      // direct matches, wrongly promoting them to must/nice-have. Requiring
      // the shorter string to cover most of the longer one keeps true near-
      // duplicates (singular/plural, "postgres"/"postgresql", ratio ≥.8) while
      // rejecting distinct products that merely share a prefix. Legitimate
      // same-family variants that fall below the ratio (e.g. "docker" vs.
      // "docker compose", .43) still surface — just via tier-3 category-
      // sibling matching in _rankVerifiedTechnologies() instead of as a false
      // direct match, which is the more honest classification anyway.
      const ratio = Math.min(kn.length, norm.length) / Math.max(kn.length, norm.length);
      return ratio >= 0.6;
    });
    if (hits(jdAnalysis.requiredSkills))   return "must_have";
    if (hits(jdAnalysis.niceToHaveSkills)) return "nice_to_have";
    return "secondary";
  }

  _classifySkillCategory(normalizedName) {
    if (TECH_CATEGORY_MAP[normalizedName]) return TECH_CATEGORY_MAP[normalizedName];
    const FALLBACK = { frontend: "Frontend", backend: "Backend", database: "Base de datos", devops: "DevOps / Cloud", mobile: "Mobile" };
    for (const { type, keys } of ITEM_SIGNALS) {
      if (keys.includes(normalizedName)) return FALLBACK[type] || "Stack adicional";
    }
    return "Stack adicional";
  }

  // ─── FASE 7: Verified-technology ranking + content budget ─────────────────────
  //
  // Replaces "collect every A/B technology, always" with a ranked, budgeted
  // selection — the CV should read as specialized for THIS job, not as a full
  // inventory of the master profile (which stays intact and complete;  only the
  // GENERATED CV is pruned). Ranking tiers, in priority order:
  //
  //   TIER 1 — MUST HAVE + VERIFIED         (always included)
  //   TIER 2 — NICE TO HAVE + VERIFIED      (always included)
  //   TIER 3 — CORE STACK / complementary   (included up to the content budget)
  //            verified tech that's either:
  //              a) a fellow member of MASTER_PROFILE.positioning.coreStack,
  //                 when the JD matched at least one coreStack technology, or
  //              b) in the same Skills category, or shares an evidence-matrix
  //                 `tag`, with something already in tier 1/2/3
  //   TIER 6 — everything else VERIFIED     (included only if budget remains)
  //
  // Deliberately conservative: (a) and (b) both reuse data the matrix already
  // has (positioning.coreStack, TECH_CATEGORY_MAP, the `tags` field — present
  // on every TECHNOLOGY_EVIDENCE_MATRIX entry but unused until now) instead of
  // inventing a new technology-relationship graph.

  _rankVerifiedTechnologies(jdAnalysis, jobIdentity) {
    const allVerified = TECHNOLOGY_EVIDENCE_MATRIX
      .map((t) => ({ tech: t, effective: getEffectiveEvidence(t.name) }))
      .filter(({ effective }) => effective && (effective.category === "A" || effective.category === "B"));

    const tier1 = [];
    const tier2 = [];
    const rest  = [];
    for (const entry of allVerified) {
      const priority = this._priorityTierFor(entry.tech.name, jdAnalysis);
      if (priority === "must_have") tier1.push(entry);
      else if (priority === "nice_to_have") tier2.push(entry);
      else rest.push(entry);
    }

    // Tier 3a — core-stack cohesion: if the JD matched anything from the
    // candidate's declared core stack, treat the rest of that core stack as
    // relevant too (e.g. a React-only JD still reasonably shows Node.js,
    // because full-stack JS is genuinely the candidate's core stack — not an
    // invented relationship, it's already declared as such in the profile).
    const coreStack = MASTER_PROFILE.positioning?.coreStack || [];
    const coreStackNorm = new Set(coreStack.map((n) => this._normalize(n)));
    const matchedTier12 = [...tier1, ...tier2];
    const coreStackTriggered = matchedTier12.some((e) => coreStackNorm.has(e.tech.normalized));

    const tier3 = [];
    const stillRest = [];
    if (coreStackTriggered) {
      for (const entry of rest) {
        if (coreStackNorm.has(entry.tech.normalized)) tier3.push(entry);
        else stillRest.push(entry);
      }
    } else {
      stillRest.push(...rest);
    }

    // Tier 3b — same category or shared `tags` with anything already in tier 1/2/3a.
    // GENERIC_TECH_TAGS are excluded from the tag-overlap signal: "language" or
    // "framework" describes WHAT KIND of thing a tech is, not what domain it's
    // used in, so it's too broad to imply relatedness (e.g. Python and PHP are
    // both tagged "language" but aren't complementary — that would happily
    // pull in an unrelated stack just because two techs share a meta-tag).
    const interest = [...matchedTier12, ...tier3];
    const interestCategories = new Set(interest.map((e) => this._classifySkillCategory(e.tech.normalized)));
    const interestTags = new Set(
      interest.flatMap((e) => e.tech.tags || []).filter((tag) => !GENERIC_TECH_TAGS.has(tag))
    );

    const tier6 = [];
    for (const entry of stillRest) {
      const category = this._classifySkillCategory(entry.tech.normalized);
      const tagOverlap = (entry.tech.tags || []).some((tag) => interestTags.has(tag));
      if (interestCategories.has(category) || tagOverlap) tier3.push(entry);
      else tier6.push(entry);
    }

    // Tier 3/6 are budget-limited by the caller (slice to N) — without a
    // relevance order first, that cutoff would just keep whatever happens to
    // sit first in the matrix's definition order (e.g. the Languages section
    // at the top), not what's actually relevant to THIS job identity. Sort by
    // how prominent each tech's category is for the detected identity, then
    // by evidence (A before B) as a tiebreaker.
    const categoryOrder = CATEGORY_ORDER_BY_IDENTITY[jobIdentity?.primary] || CATEGORY_ORDER_BY_IDENTITY.fullstack;
    const categoryRank = (entry) => {
      const idx = categoryOrder.indexOf(this._classifySkillCategory(entry.tech.normalized));
      return idx === -1 ? categoryOrder.length : idx;
    };
    const EVIDENCE_RANK = { A: 0, B: 1 };
    const byRelevance = (a, b) => {
      const catDiff = categoryRank(a) - categoryRank(b);
      if (catDiff !== 0) return catDiff;
      return (EVIDENCE_RANK[a.effective.category] ?? 2) - (EVIDENCE_RANK[b.effective.category] ?? 2);
    };
    tier3.sort(byRelevance);
    tier6.sort(byRelevance);

    return { tier1, tier2, tier3, tier6 };
  }

  // Content budget: how many TIER 3 (complementary) and TIER 6 (everything
  // else verified, no relation signal at all) technologies the generated CV
  // can afford, based on how many MUST/NICE HAVE requirements already matched
  // VERIFIED. Returned as TWO separate budgets, not one combined number:
  // tier 3 is still evidence-connected to what the JD actually asked for
  // (core-stack cohesion or a shared category/tag with a real match), so it's
  // reasonable to show more of it when the JD is sparse. Tier 6 has NO such
  // connection — it exists only so a very thin JD doesn't leave a category
  // empty, not to backfill an unrelated stack (e.g. a pure AWS/Docker/Git
  // DevOps JD showing the entire PHP/Python/Django backend lineup just
  // because "Backend" ranks high in that identity's category order and the
  // budget had room). Tier 6 therefore stays capped low regardless of how
  // sparse the JD is.
  _computeComplementaryBudget(tier1Count, tier2Count) {
    const relevant = tier1Count + tier2Count;
    if (relevant >= 10) return { tier3Budget: 6,  tier6Budget: 2 };
    if (relevant >= 5)  return { tier3Budget: 11, tier6Budget: 3 };
    if (relevant >= 1)  return { tier3Budget: 16, tier6Budget: 4 };
    return { tier3Budget: 18, tier6Budget: 6 }; // JD matched nothing verified
  }

  // ─── FASE 6: Duplicate-skill detector ──────────────────────────────────────────
  //
  // Flags a technology listed under more than one Skills category (alias-aware,
  // e.g. "React" + "ReactJS" would count as the same tech). buildAdaptiveSkills()
  // and recoverMissingKeywords() already dedupe as they build the CV, so this
  // should normally return []; it's a safety net exposed via calculateATSScore()
  // so keyword stuffing/regressions are visible instead of silent.

  _detectDuplicateSkills(skills) {
    const seen = new Map(); // canonical normalized key -> [{category, item}]
    const duplicates = [];
    for (const sg of skills || []) {
      for (const item of (sg.items || [])) {
        const norm = this._normalize(item);
        const aliasKeys = [norm, ...(ALIAS_MAP.get(norm) || [])];
        const existingKey = aliasKeys.find((k) => seen.has(k));
        const key = existingKey || norm;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key).push({ category: sg.category, item });
      }
    }
    for (const [, occurrences] of seen) {
      if (occurrences.length > 1) {
        duplicates.push({
          technology: occurrences[0].item,
          occurrences: occurrences.map((o) => `${o.item} (${o.category})`),
        });
      }
    }
    return duplicates;
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
      data: {
        roleKws:   [
          "data engineer", "data engineering", "analytics engineer",
          "data platform", "data pipeline",
        ],
        techSigs:  [
          "etl", "elt", "data lake", "data warehouse", "athena", "trino", "presto",
          "bigquery", "spark", "sparksql", "airflow", "dagster", "prefect",
          "step functions", "dag", "orchestration", "large datasets",
          "performance-sensitive", "sql", "postgresql", "advanced sql",
        ],
        weight:    1.15,
      },
      devops: {
        roleKws:   [
          "devops engineer", "devops developer", "infrastructure engineer",
          "platform engineer", "site reliability", "sre",
        ],
        techSigs:  [
          "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
          "cicd", "ci cd", "helm", "argocd", "prometheus", "grafana",
        ],
        weight:    1.1,
      },
      cloud: {
        roleKws:   ["cloud engineer", "cloud developer", "cloud architect"],
        techSigs:  [
          "aws", "gcp", "azure", "lambda", "ec2", "s3", "rds", "cloudfront",
          "serverless", "cloud run", "cloud functions",
        ],
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
      const tech = getEffectiveEvidence(kw);
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

  // ─── FASE 7: Adaptive Skill Categories (RANK → BUDGET → CLASSIFY → DEDUPLICATE → SORT) ─
  //
  // Was "collect every A/B technology, always" (see git history / TECH_CATEGORY_MAP
  // comment for the tech-loss bug that fixed). Now: the GENERATED CV is a ranked,
  // budgeted selection — masterProfile.js itself is untouched and remains the
  // complete inventory; only what gets rendered into this specific CV is pruned.
  //
  //   RANK      — every A/B technology into tier 1 (must-have match) / tier 2
  //               (nice-to-have match) / tier 3 (core-stack or category/tag
  //               complementary) / tier 6 (everything else) — see
  //               _rankVerifiedTechnologies(). Tier 1/2 are ALWAYS kept in full;
  //               a keyword match must never be dropped for space.
  //   BUDGET    — tier 3/6 compete for a JD-size-adaptive budget (see
  //               _computeComplementaryBudget()): a keyword-dense JD gets a
  //               focused CV, a sparse JD can show more of the verified stack.
  //   CLASSIFY  — each technology goes to its natural category via TECH_CATEGORY_MAP
  //               (unchanged). C-tier tech the JD actually asks for still goes to
  //               RECOVERABLE_CATEGORY, never blended into a natural category.
  //   DEDUPLICATE / SORT — unchanged: alias-aware, categories ordered per job
  //               identity, items within a category ordered by tier then evidence.

  buildAdaptiveSkills(jobIdentity, jdKeywords, jdAnalysis) {
    const jdNorms   = (jdKeywords || []).map((k) => this._normalize(k));
    const mustNorms = (jdAnalysis?.requiredSkills   || []).map((k) => this._normalize(k));
    const niceNorms = (jdAnalysis?.niceToHaveSkills || []).map((k) => this._normalize(k));

    const jdScoreFor = (normName) => {
      const hits = (list) => list.some((kw) => normName === kw || normName.includes(kw) || kw.includes(normName) ||
        (normName.length >= 4 && kw.length >= 4 && normName.slice(0, 4) === kw.slice(0, 4)));
      if (hits(mustNorms)) return 3;
      if (hits(niceNorms)) return 2;
      if (hits(jdNorms))   return 1;
      return 0;
    };

    const categoryFor = (tech) => this._classifySkillCategory(tech.normalized);

    // ── RANK + BUDGET (verified A/B) ────────────────────────────────────────
    const { tier1, tier2, tier3, tier6 } = this._rankVerifiedTechnologies(jdAnalysis, jobIdentity);
    const { tier3Budget, tier6Budget } = this._computeComplementaryBudget(tier1.length, tier2.length);

    // Per-category SOFT cap: a single category (e.g. Backend, when the JD's
    // must-haves happen to cluster there) shouldn't be allowed to consume the
    // entire budget while other relevant categories get nothing. Caps are
    // soft — MUST/NICE HAVE (tier 1/2) always bypass them entirely; only
    // tier 3/6 candidates are capped. If a category hits its cap but budget
    // remains (other categories ran out of candidates), the second pass
    // below fills the leftover from whoever's left, uncapped.
    const SOFT_CATEGORY_CAP = {
      "Frontend": 7, "Backend": 6, "Base de datos": 4, "DevOps / Cloud": 5,
      "Storage": 3, "Seguridad": 3, "Mobile": 3, "AI / ML": 4, "Testing": 3,
      "Herramientas": 4, "APIs / Integración": 3, "Pagos": 2, "Metodologías": 2,
    };
    const DEFAULT_CATEGORY_CAP = 5;
    const categoryCount = new Map();
    for (const e of [...tier1, ...tier2]) {
      const c = categoryFor(e.tech);
      categoryCount.set(c, (categoryCount.get(c) || 0) + 1);
    }

    // Distributes `list` into `out` respecting the shared per-category soft
    // cap and its own budget limit. tier3 and tier6 are distributed as two
    // separate calls (own budgets) but share `categoryCount`, so tier6 sees
    // however much room tier3 already used in each category.
    const distribute = (list, tierNum, budgetLimit) => {
      const deferred = [];
      let used = 0;
      for (const entry of list) {
        if (used >= budgetLimit) break;
        const category = categoryFor(entry.tech);
        const cap = SOFT_CATEGORY_CAP[category] ?? DEFAULT_CATEGORY_CAP;
        const count = categoryCount.get(category) || 0;
        if (count < cap) {
          out.push({ ...entry, _tier: tierNum });
          categoryCount.set(category, count + 1);
          used++;
        } else {
          deferred.push(entry);
        }
      }
      for (const entry of deferred) {
        if (used >= budgetLimit) break;
        out.push({ ...entry, _tier: tierNum });
        used++;
      }
    };
    const out = [];
    distribute(tier3, 3, tier3Budget);
    distribute(tier6, 6, tier6Budget);
    const budgeted = out;

    const collected = [
      ...tier1.map((e) => ({ name: e.tech.name, normalized: e.tech.normalized, evidence: e.effective.category, category: categoryFor(e.tech), tier: 1 })),
      ...tier2.map((e) => ({ name: e.tech.name, normalized: e.tech.normalized, evidence: e.effective.category, category: categoryFor(e.tech), tier: 2 })),
      ...budgeted.map((e) => ({ name: e.tech.name, normalized: e.tech.normalized, evidence: e.effective.category, category: categoryFor(e.tech), tier: e._tier })),
    ];

    // ── C-tier JD-relevant tech → RECOVERABLE_CATEGORY (unchanged from before) ──
    for (const tech of TECHNOLOGY_EVIDENCE_MATRIX) {
      const effective = getEffectiveEvidence(tech.name);
      if (effective.category === "C" && jdScoreFor(tech.normalized)) {
        // Learning-tier tech (e.g. Redis, GraphQL — anything NOT promoted by
        // EVIDENCE_OVERRIDES, since AWS is already effectively "B" by the time
        // it gets here) only appears when the JD actually calls for it, and
        // ALWAYS in RECOVERABLE_CATEGORY — never blended into its natural
        // category next to verified (A/B) tech. Placing "Redis" next to
        // "PostgreSQL, MongoDB" under "Base de datos" would visually claim
        // equal evidence for both, which is exactly what this phase forbids.
        collected.push({ name: tech.name, normalized: tech.normalized, evidence: "C", category: RECOVERABLE_CATEGORY, tier: 4 });
      }
    }

    // ── CLASSIFY + DEDUPLICATE ──────────────────────────────────────────────
    const byCategory = new Map(); // category -> Map(normalized -> item)
    for (const item of collected) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, new Map());
      byCategory.get(item.category).set(item.normalized, item);
    }

    // ── SORT ─────────────────────────────────────────────────────────────────
    const EVIDENCE_SCORE = { A: 3, B: 2, C: 1 };
    const order = CATEGORY_ORDER_BY_IDENTITY[jobIdentity.primary]
      || CATEGORY_ORDER_BY_IDENTITY.fullstack;
    const extraCategories = [...byCategory.keys()].filter((c) => !order.includes(c));
    const fullOrder = [...order, ...extraCategories];

    const categories = fullOrder
      .map((category) => {
        const items = byCategory.get(category);
        if (!items) return null;
        const sorted = [...items.values()]
          .sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            const jdA = jdScoreFor(a.normalized);
            const jdB = jdScoreFor(b.normalized);
            if (jdB !== jdA) return jdB - jdA;
            return (EVIDENCE_SCORE[b.evidence] || 0) - (EVIDENCE_SCORE[a.evidence] || 0);
          })
          .map((i) => i.name);
        return { category, items: sorted };
      })
      .filter(Boolean);

    return categories;
  }

  // ─── FASE 3: Requirement Matrix ──────────────────────────────────────────────
  //
  // Classifies each JD requirement against the master profile into one of:
  //   DIRECT_MATCH   — exact tech name match with A (professional) or B (hands-on) evidence
  //   PARTIAL_MATCH  — fuzzy/alias match with A or B evidence (name isn't an exact hit)
  //   TRANSFERABLE   — no matrix record, but a related A/B technology exists (TRANSFERABLE_MAP)
  //   LEARNING       — matrix record with C evidence (currently learning / familiarity)
  //   GAP            — matrix record with D evidence (assessed, insufficient evidence)
  //   UNVERIFIED     — no matrix record and nothing transferable found
  //
  // This is decision-support metadata for generation (project/experience/skill
  // ordering). It is NEVER used to fabricate achievements, and it is not
  // rendered in the CV itself — only exposed via architecture.requirementMatrix.

  buildRequirementMatrix(jdAnalysis) {
    const items = [...new Set([
      ...(jdAnalysis.requiredSkills || []).map((k) => ({ text: k, priority: "must-have" })),
      ...(jdAnalysis.niceToHaveSkills || []).map((k) => ({ text: k, priority: "nice-to-have" })),
    ].map((o) => JSON.stringify(o)))].map((s) => JSON.parse(s));

    // Add any remaining keywords not already covered, as unprioritized requirements
    const covered = new Set(items.map((i) => this._normalize(i.text)));
    for (const kw of (jdAnalysis.keywords || [])) {
      const norm = this._normalize(kw);
      if (!covered.has(norm)) { items.push({ text: kw, priority: "keyword" }); covered.add(norm); }
    }

    return items.map(({ text, priority }) => {
      const norm = this._normalize(text);
      const exactTech = getEffectiveEvidence(text);

      if (exactTech) {
        const isExactName = this._normalize(exactTech.name) === norm;
        if (exactTech.category === "A" || exactTech.category === "B") {
          return {
            requirement: text, priority,
            status: isExactName ? "DIRECT_MATCH" : "PARTIAL_MATCH",
            subtype: exactTech.category === "A" ? "PROFESSIONAL" : "HANDS_ON",
            matchedTech: exactTech.name,
          };
        }
        if (exactTech.category === "C") {
          return { requirement: text, priority, status: "LEARNING", matchedTech: exactTech.name };
        }
        // D — known to the profile, assessed as insufficient evidence
        return { requirement: text, priority, status: "GAP", matchedTech: exactTech.name };
      }

      // No direct record — check transferable adjacency
      const transferCandidates = TRANSFERABLE_MAP[norm] || [];
      for (const candidateName of transferCandidates) {
        const candidate = getEffectiveEvidence(candidateName);
        if (candidate && (candidate.category === "A" || candidate.category === "B")) {
          return {
            requirement: text, priority, status: "TRANSFERABLE",
            matchedTech: candidate.name,
            note: `No direct evidence for "${text}", but related experience with ${candidate.name}`,
          };
        }
      }

      return { requirement: text, priority, status: "UNVERIFIED", matchedTech: null };
    });
  }

  // Groups a requirement matrix into the gapAnalysis shape used internally
  // (architecture.gapAnalysis). Not rendered in the CV — decision-support only.
  buildGapAnalysis(requirementMatrix) {
    const g = {
      directMatches: [], partialMatches: [], transferableSkills: [],
      learningMatches: [], gaps: [], unverified: [],
    };
    for (const r of requirementMatrix) {
      if (r.status === "DIRECT_MATCH") g.directMatches.push(r);
      else if (r.status === "PARTIAL_MATCH") g.partialMatches.push(r);
      else if (r.status === "TRANSFERABLE") g.transferableSkills.push(r);
      else if (r.status === "LEARNING") g.learningMatches.push(r);
      else if (r.status === "GAP") g.gaps.push(r);
      else g.unverified.push(r);
    }
    return g;
  }

  // ─── FASE 2: Adaptive Experience ─────────────────────────────────────────────
  //
  // Selects and ranks achievement bullets from MASTER_PROFILE.experience
  // based on job type. Applies bullet limits per entry.

  buildAdaptiveExperience(jobIdentity, jdKeywords, jdAnalysis) {
    const { primary, secondary } = jobIdentity;
    const allTypes  = [primary, ...secondary];
    const jdNorms   = (jdKeywords || []).map((k) => k.toLowerCase());
    const mustNorms = (jdAnalysis?.requiredSkills   || []).map((k) => k.toLowerCase());
    const niceNorms = (jdAnalysis?.niceToHaveSkills || []).map((k) => k.toLowerCase());

    // Pool of relevance keywords from all detected job types
    const relevantKws = [...new Set(
      allTypes.flatMap((t) => TYPE_ACHIEVEMENT_KEYWORDS[t] || [])
    )];

    // Bullets mentioning a MUST HAVE requirement should surface before ones
    // that only match a nice-to-have or a generic extracted keyword — same
    // must_have > nice_to_have > secondary priority used for Skills/Projects.
    const scoreAch = (text) => {
      const low = text.toLowerCase();
      let s = 0;
      for (const kw of relevantKws) if (low.includes(kw)) s += 2;
      for (const kw of mustNorms)   if (low.includes(kw)) s += 5;
      for (const kw of niceNorms)   if (low.includes(kw)) s += 3;
      for (const kw of jdNorms)     if (low.includes(kw)) s += 1;
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

  buildAdaptiveProjects(jobIdentity, jdKeywords, maxCount, jdAnalysis) {
    const { primary, secondary } = jobIdentity;

    const PROJECT_COUNT = {
      fullstack: 5, backend: 4, frontend: 4, react: 4,
      node: 4, python: 4, ai: 4, mobile: 3,
      automation: 4, saas: 4, ecommerce: 3, api: 4, realtime: 3,
      data: 4, devops: 3, cloud: 3,
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

    // Score by tech overlap with JD keywords — must-have requirements weigh more
    // than nice-to-haves, which weigh more than generic extracted keywords.
    const jdNorms   = (jdKeywords || []).map((k) => this._normalize(k));
    const mustNorms = (jdAnalysis?.requiredSkills   || []).map((k) => this._normalize(k));
    const niceNorms = (jdAnalysis?.niceToHaveSkills || []).map((k) => this._normalize(k));
    // Whole-word match — a plain substring check would count "sql" as a hit
    // inside "postgresql", inflating scores for unrelated projects.
    const wordHit = (text, kw) => {
      if (!kw) return false;
      const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${esc}\\b`, "i").test(text);
    };

    // Preserves selectProjects()'s own strength/prioritize/deprioritize order
    // as a small tiebreaker below ("relevancia respecto al tipo de puesto") —
    // otherwise it's fully discarded the moment the keyword re-sort runs.
    const originalRank = new Map(selected.map((p, i) => [p.id, i]));

    const jdScore = (project) => {
      // BUG FIX: JD keywords are normalized (dots/dashes stripped — "Node.js"
      // -> "nodejs"), but the project's own text was only .toLowerCase()'d.
      // "node.js" in a technologies array never matched JD keyword "nodejs"
      // because the literal dot breaks \b word-boundary matching — silently
      // zeroing out matches for every dotted tech name (Node.js, Express.js,
      // Next.js...). That's why a project genuinely built with React + Node.js
      // + Express.js could score at or below an unrelated one. Normalizing
      // both sides the same way fixes it.
      const text = this._normalize(
        [project.name, project.description, ...project.technologies, ...project.achievements].join(" ")
      );
      let score = 0;
      for (const kw of jdNorms)   if (wordHit(text, kw)) score += 1;
      for (const kw of niceNorms) if (wordHit(text, kw)) score += 1;
      for (const kw of mustNorms) if (wordHit(text, kw)) score += 2;

      // Mild penalty ONLY when the project's own declared tech stack is almost
      // entirely unrelated to this JD — never for "mostly relevant + a couple
      // of extras" (e.g. React + Node + MongoDB + Socket.io for a React +
      // Node + PostgreSQL JD keeps a high relevant ratio and is NOT penalized
      // just for having Socket.io too).
      const techNorms = (project.technologies || []).map((t) => this._normalize(t));
      const relevantTechCount = techNorms.filter((t) =>
        [...mustNorms, ...niceNorms].some((kw) => wordHit(t, kw))
      ).length;
      if (techNorms.length >= 4 && relevantTechCount / techNorms.length < 0.15) score -= 1;

      // Small role-type tiebreaker (deliberately worth less than a single
      // keyword match) — never overrides real keyword relevance, only breaks
      // ties between otherwise-similar projects.
      const rank = originalRank.get(project.id);
      if (rank !== undefined) score += (selected.length - rank) * 0.1;

      return score;
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

  // ─── FASE 3: Title Variant Selection ─────────────────────────────────────────
  //
  // Uses MASTER_PROFILE.positioning.titleVariants (existed but was never wired
  // into generation). Falls back to the candidate's real mainTitle — never
  // invents a title outside the variants the profile already defines.

  _selectTitleVariant(jobIdentity) {
    const { primary, secondary } = jobIdentity;
    const positioning = MASTER_PROFILE.positioning || {};
    const variants = positioning.titleVariants || {};
    if (variants[primary]) return variants[primary];
    for (const type of secondary) {
      if (variants[type]) return variants[type];
    }
    return positioning.mainTitle || variants.fullstack || "Full Stack Developer";
  }

  // ─── FASE 2: Adaptive Summary Generation ─────────────────────────────────────
  //
  // Calls Claude Haiku to write a concise summary adapted to the job type.
  // Falls back to the pre-written summaryVariant from masterProfile if Claude fails.

  async _generateAdaptiveSummary(jobDescription, jdAnalysis, jobIdentity, baseSummary) {
    // Explicit 3-tier keyword strategy for the Summary — reuses the same
    // evidence+priority source of truth as everywhere else (classifyKeywordForRecovery
    // / _priorityTierFor), plus a READ-ONLY call into _rankVerifiedTechnologies()
    // (Skills' own complementary-tech ranking, untouched/unmodified here) instead
    // of dumping the candidate's whole declared core stack:
    //
    //   HIGH   — must-have requirement, VERIFIED evidence. Always try to include.
    //   MEDIUM — nice-to-have requirement, VERIFIED evidence. Include if space allows.
    //   LOW    — VERIFIED technology that's a genuine complement to HIGH/MEDIUM
    //            (same tier-3 signal Skills uses: core-stack cohesion or a shared
    //            category/tag with an actual match) — not the whole profile, so
    //            Python/Django/IA etc. no longer show up in a Node.js-only summary
    //            just because they're part of the candidate's overall stack.
    const jdDecisions = (jdAnalysis.keywords || [])
      .map((kw) => this.classifyKeywordForRecovery(kw, jdAnalysis))
      .filter((d) => d.level === "VERIFIED" && d.matchedTech);

    const highTechs = [...new Set(
      jdDecisions.filter((d) => d.priority === "must_have").map((d) => d.matchedTech)
    )];
    const mediumTechs = [...new Set(
      jdDecisions.filter((d) => d.priority === "nice_to_have").map((d) => d.matchedTech)
        .filter((t) => !highTechs.includes(t))
    )];

    const { tier3 } = this._rankVerifiedTechnologies(jdAnalysis, jobIdentity);
    let lowTechs = tier3
      .map((e) => e.tech.name)
      .filter((t) => !highTechs.includes(t) && !mediumTechs.includes(t))
      .slice(0, 6);
    if (highTechs.length === 0 && mediumTechs.length === 0 && lowTechs.length === 0) {
      // Nothing in the JD matched the profile at all (very generic/short JD) —
      // fall back to the candidate's declared core stack so there's still
      // something concrete and verified to write about, per CASO D.
      lowTechs = (MASTER_PROFILE.positioning?.coreStack || []).slice(0, 6);
    }

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

SKILLS REQUERIDAS POR EL PUESTO (contexto informativo — no todas están necesariamente en las listas de abajo): ${requiredStr}

HIGH PRIORITY — must-have de la oferta con evidencia VERIFICADA en el perfil (mencionar SIEMPRE que sea posible, con más énfasis):
${highTechs.join(", ") || "(ninguna coincidencia directa — usar el stack principal del perfil)"}

MEDIUM PRIORITY — nice-to-have de la oferta con evidencia VERIFICADA (mencionar si hay espacio, después de HIGH PRIORITY):
${mediumTechs.join(", ") || "(ninguna)"}

LOW PRIORITY — tecnologías VERIFICADAS del perfil, complementarias y directamente relacionadas con las anteriores (mencionar como mucho 1-2, solo si suman valor real; NO es obligatorio usarlas):
${lowTechs.join(", ") || "(ninguna)"}

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
- Longitud objetivo: 75-110 palabras (similar a la longitud actual — no generar un párrafo más largo).
- Orden de prioridad estricto: HIGH PRIORITY primero (mencionar todas las que razonablemente entren), después MEDIUM PRIORITY si queda espacio, y como mucho 1-2 de LOW PRIORITY — nunca al revés, y nunca a costa de omitir algo de HIGH PRIORITY.
- El resumen debe responder "¿por qué este candidato encaja con ESTE puesto?", no ser un inventario de todo lo que sabe.
- NO mencionar tecnologías fuera de las tres listas de arriba.
- NO mencionar ni implicar experiencia con tecnologías que no estén en esas listas (aunque aparezcan en la descripción del puesto).
- NO repitas la misma tecnología más de una vez en el resumen.
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

  // ─── Section Order Metadata ───────────────────────────────────────────────────
  //
  // KNOWN LIMITATION: the CV schema embeds Projects INSIDE the `experience`
  // array (the "Proyectos Destacados" header entry + following items) rather
  // than as its own top-level section — see optimizeCV() step 6. That means
  // "Skills before Projects" (wanted for backend/python/data/devops/api roles)
  // vs. "Projects before Skills" (frontend/fullstack) can't be represented by
  // reordering top-level keys without splitting experience/projects into
  // separate arrays, which is a bigger schema change than this pass should
  // make (would also require frontend/PDF updates). Restructuring that split
  // is a reasonable follow-up if this metadata gets wired to rendering.
  //
  // This method still varies what CAN be safely reordered today; it remains
  // inert until the frontend/PDF actually read architecture.sectionOrder
  // (documented in optimizeCV()'s architecture block).
  _getSectionOrder(jobIdentity) {
    const { primary } = jobIdentity;
    // Certification-heavy/technical-formation identities: surface Formación
    // (certifications, which double as course history) ahead of Languages.
    const certsFirst = new Set(["mobile", "react", "python", "data", "devops", "cloud", "ai"]);
    return certsFirst.has(primary)
      ? ["summary", "experience", "skills", "education", "certifications", "languages"]
      : ["summary", "experience", "skills", "education", "languages", "certifications"];
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

      // ── 2. Classify JD keywords + build requirement matrix / gap analysis ─────
      const keywordClassification = this.classifyKeywords(jdAnalysis.keywords || []);
      const requirementMatrix     = this.buildRequirementMatrix(jdAnalysis);
      const gapAnalysis           = this.buildGapAnalysis(requirementMatrix);

      // ── 3. Build adaptive components from masterProfile ───────────────────────
      const adaptiveExperience = this.buildAdaptiveExperience(jobIdentity, jdAnalysis.keywords, jdAnalysis);
      const adaptiveProjects   = this.buildAdaptiveProjects(jobIdentity, jdAnalysis.keywords, undefined, jdAnalysis);
      const adaptiveSkills     = this.buildAdaptiveSkills(jobIdentity, jdAnalysis.keywords, jdAnalysis);

      // Diagnostic snapshot of the content-budget decision behind adaptiveSkills
      // (cheap, pure — recomputing here avoids changing buildAdaptiveSkills()'s
      // return contract just to expose internals no one else needs).
      const { tier1, tier2, tier3, tier6 } = this._rankVerifiedTechnologies(jdAnalysis, jobIdentity);
      const { tier3Budget, tier6Budget } = this._computeComplementaryBudget(tier1.length, tier2.length);
      const skillsBudget = {
        mustHaveVerified:      tier1.length,
        niceToHaveVerified:    tier2.length,
        complementaryBudget:   { tier3Budget, tier6Budget },
        complementaryAvailable: { tier3: tier3.length, tier6: tier6.length },
        complementaryIncluded:  Math.min(tier3Budget, tier3.length) + Math.min(tier6Budget, tier6.length),
        prunedFromCV: Math.max(0, tier3.length - tier3Budget) + Math.max(0, tier6.length - tier6Budget),
      };

      // ── 4. Generate adapted summary + select title variant ───────────────────
      const baseSummary = this._selectSummaryVariant(jobIdentity);
      const summary     = await this._generateAdaptiveSummary(
        jobDescription, jdAnalysis, jobIdentity, baseSummary
      );
      const title = this._selectTitleVariant(jobIdentity);

      // ── 5. Assemble personal info (masterProfile as authority) ─────────────────
      // Preserve phone from the uploaded CV if available (not stored in masterProfile)
      const uploadedPhone = parsedCV?.personalInfo?.phone || "";
      const personalInfo  = {
        ...MASTER_PROFILE.personalInfo,
        title,
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
          // Decision-support only — NOT rendered in the CV/PDF. See buildRequirementMatrix().
          requirementMatrix,
          gapAnalysis,
          // Diagnostic only — NOT rendered. Shows how buildAdaptiveSkills()'s
          // content budget decided what to include/prune for this CV.
          skillsBudget,
        },
      };

      // ── 10. Validate structure and content ────────────────────────────────────
      const { cv: validatedCV, warnings } = this.validateGeneratedCV(rawCV, jdAnalysis.keywords || [], jdAnalysis);
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

    // NICE TO HAVE matching — mirrors requiredSkills matching above, but never
    // fed into `score`: nice-to-haves are a bonus signal, not a requirement.
    const niceToHaveSkills = [...new Set(
      (jdAnalysis.niceToHaveSkills || []).map((s) => this._normalize(s)).filter(Boolean)
    )];
    const niceMatched = [];
    const niceMissing = [];
    for (const s of niceToHaveSkills) {
      if (cvTextNorm.includes(s) || this._fuzzyMatch(s, cvWords) || this._aliasMatch(s, cvTextNorm, cvWords)) {
        niceMatched.push(s);
      } else {
        niceMissing.push(s);
      }
    }

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

    // Evidence-tier transparency: a 100% keyword match padded entirely with
    // RECOVERABLE (no-evidence) technologies is NOT the same quality signal as
    // one built on VERIFIED experience. This never changes `score` itself —
    // it's additive context so the CV isn't judged as "artificially perfect".
    // Arrays (not just counts) so callers can see WHICH keywords fall where —
    // "why does this CV have this score", not just "how many".
    const evidenceBreakdown = { verified: [], recoverable: [], unsupported: [] };
    for (const kw of keywordsFound) {
      const level = this.classifyKeywordForRecovery(kw, jdAnalysis).level;
      if (level === "VERIFIED") evidenceBreakdown.verified.push(kw);
      else if (level === "RECOVERABLE") evidenceBreakdown.recoverable.push(kw);
      else evidenceBreakdown.unsupported.push(kw);
    }

    // Placement quality: what fraction of the matched keywords are backed by
    // real evidence vs. bare technology mentions. Two CVs can both "match 90%
    // of keywords" and be very different in trustworthiness — this says which.
    const totalMatched = evidenceBreakdown.verified.length + evidenceBreakdown.recoverable.length + evidenceBreakdown.unsupported.length;
    const verifiedRatio = totalMatched > 0 ? evidenceBreakdown.verified.length / totalMatched : 0;
    const placementQuality = {
      verifiedRatio: Math.round(verifiedRatio * 100) / 100,
      label: totalMatched === 0 ? "sin datos" : verifiedRatio >= 0.7 ? "fuerte" : verifiedRatio >= 0.4 ? "moderada" : "débil",
      verifiedPlacement: evidenceBreakdown.verified.length,
      recoverablePlacement: evidenceBreakdown.recoverable.length,
    };

    // Duplicate detection — a technology listed under more than one Skills
    // category (alias-aware). Should normally be empty; buildAdaptiveSkills()/
    // recoverMissingKeywords() already dedupe, this is a safety-net signal.
    const duplicateKeywords = this._detectDuplicateSkills(parsedCV.skills || []);

    // Content focus — how much of what's shown in Skills is a direct MUST/NICE
    // HAVE keyword match vs. complementary/generic verified tech. Diagnostic
    // only; does not affect `score`. NOTE: a high non-match ratio isn't
    // necessarily "noise" — tier-3 complementary tech (see
    // _rankVerifiedTechnologies) is an intentional, evidence-based inclusion,
    // not padding. This says "how keyword-dense is Skills", not "how much junk".
    const skillItems = (parsedCV.skills || [])
      .filter((sg) => sg.category !== RECOVERABLE_CATEGORY)
      .flatMap((sg) => sg.items || []);
    const directMatches = skillItems.filter((i) => this._priorityTierFor(i, jdAnalysis) !== "secondary");
    const contentFocus = {
      selectedTechnologies: skillItems.length,
      directKeywordMatches: directMatches.length,
      directMatchRatio: skillItems.length > 0
        ? Math.round((directMatches.length / skillItems.length) * 100) / 100
        : 0,
    };

    // Relevance density — reuses _rankVerifiedTechnologies() (no jobIdentity:
    // membership doesn't depend on category display order) to see which
    // VERIFIED complementary/secondary technologies made it into the CV vs.
    // which were pruned by the content budget. Diagnostic only.
    const { tier3: rdTier3, tier6: rdTier6 } = this._rankVerifiedTechnologies(jdAnalysis);
    const presentNorms = new Set(skillItems.map((i) => this._normalize(i)));
    const complementaryPool = [...rdTier3, ...rdTier6];
    const relevanceDensity = {
      mustHaveRelevant: (jdAnalysis.requiredSkills || [])
        .filter((k) => this.calculateKeywordRelevance(k, jdAnalysis).score > 0),
      niceToHaveRelevant: (jdAnalysis.niceToHaveSkills || [])
        .filter((k) => this.calculateKeywordRelevance(k, jdAnalysis).score > 0),
      complementary: complementaryPool
        .filter((e) => presentNorms.has(e.tech.normalized)).map((e) => e.tech.name),
      omittedLowRelevance: complementaryPool
        .filter((e) => !presentNorms.has(e.tech.normalized)).map((e) => e.tech.name),
      relevantKeywordCount: 0,
      omittedKeywordCount: 0,
    };
    relevanceDensity.relevantKeywordCount =
      relevanceDensity.mustHaveRelevant.length + relevanceDensity.niceToHaveRelevant.length + relevanceDensity.complementary.length;
    relevanceDensity.omittedKeywordCount = relevanceDensity.omittedLowRelevance.length;

    // Section relevance — how many MUST/NICE HAVE keywords appear in each
    // section's actual text. Simple presence count (not a new scoring
    // system); diagnostic only, per explicit "only if simple" request.
    const relevantKwSet = [...requiredSkills, ...niceToHaveSkills];
    const countRelevantIn = (text) => {
      const norm = this._normalize(text || "");
      return relevantKwSet.filter((kw) => norm.includes(kw)).length;
    };
    const expArr = parsedCV.experience || [];
    const projIdx = expArr.findIndex((e) =>
      /proyecto[s]?\s+destacados?/i.test(e.role || "") || /proyecto[s]?\s+destacados?/i.test(e.company || "")
    );
    const regularExpArr = projIdx === -1 ? expArr : expArr.slice(0, projIdx);
    const projectExpArr = projIdx === -1 ? [] : expArr.slice(projIdx + 1);
    const sectionRelevance = {
      summary:    countRelevantIn(parsedCV.summary || ""),
      experience: countRelevantIn(regularExpArr.flatMap((e) => e.achievements || []).join(" ")),
      projects:   countRelevantIn(projectExpArr.flatMap((e) => e.achievements || []).join(" ")),
      skills:     countRelevantIn(skillItems.join(" ")),
    };

    // ─── Contextual coverage (diagnostic only — no placement decisions here) ──
    //
    // Per-PRIORITY-keyword (must_have/nice_to_have — see _priorityTierFor),
    // which sections already mention it. This does NOT select, reorder, or
    // rewrite anything: Experience/Projects bullets are pre-written text from
    // MASTER_PROFILE (buildAdaptiveExperience/buildAdaptiveProjects already
    // rank them by JD relevance), Skills/Summary are built by their own
    // untouched logic — this only *reports* where that existing selection
    // already produced contextual reinforcement vs. a keyword that only ever
    // shows up once, in Skills.
    //
    // RECOVERABLE/UNSUPPORTED keywords are included too, but only to make the
    // no-fabrication guarantee visible: their sections.experience/.projects
    // must always read false (nothing ever writes a recoverable tech into an
    // achievement) — if a test ever sees `true` there, that's a real bug.
    const summaryTextNorm    = this._normalize(parsedCV.summary || "");
    const experienceTextNorm = this._normalize(regularExpArr.flatMap((e) => e.achievements || []).join(" "));
    const projectsTextNorm   = this._normalize(projectExpArr.flatMap((e) => e.achievements || []).join(" "));
    // NOTE: uses ALL skill items, including RECOVERABLE_CATEGORY ("Tecnologías
    // adicionales") — unlike `skillItems` above (used by contentFocus, which
    // deliberately excludes it to measure natural-category placement quality).
    // A keyword recovered into "Tecnologías adicionales" is still visibly
    // present in the CV's Skills section, so it must count as covered here.
    const allSkillItems     = (parsedCV.skills || []).flatMap((sg) => sg.items || []);
    const skillsTextNorm    = this._normalize(allSkillItems.join(" "));

    const priorityDecisions = [...new Set([...(jdAnalysis.requiredSkills || []), ...(jdAnalysis.niceToHaveSkills || [])])]
      .map((kw) => this.classifyKeywordForRecovery(kw, jdAnalysis))
      .filter((d) => d.priority === "must_have" || d.priority === "nice_to_have");

    const perKeyword = {};
    for (const d of priorityDecisions) {
      const key = d.matchedTech || d.keyword;
      if (perKeyword[key]) continue; // two JD phrasings resolving to the same tech — keep first (must_have wins, required is spread first)
      const nameNorm = this._normalize(d.matchedTech || d.keyword);
      const sections = {
        summary:    summaryTextNorm.includes(nameNorm),
        experience: experienceTextNorm.includes(nameNorm),
        projects:   projectsTextNorm.includes(nameNorm),
        skills:     skillsTextNorm.includes(nameNorm),
      };
      perKeyword[key] = {
        priority: d.priority,
        level: d.level,
        sections,
        sectionsCovered: Object.values(sections).filter(Boolean).length,
      };
    }

    // Rollups scoped to VERIFIED priority keywords only — coverage of a
    // RECOVERABLE keyword beyond Skills isn't a meaningful "reinforce it more"
    // signal, since Experience/Projects must never claim it.
    const verifiedKeys = Object.keys(perKeyword).filter((k) => perKeyword[k].level === "VERIFIED");
    const withContextualEvidence = verifiedKeys.filter((k) =>
      perKeyword[k].sections.summary || perKeyword[k].sections.experience || perKeyword[k].sections.projects
    ).length;
    const skillsOnly  = verifiedKeys.filter((k) => perKeyword[k].sectionsCovered === 1 && perKeyword[k].sections.skills).length;
    const notPresent  = verifiedKeys.filter((k) => perKeyword[k].sectionsCovered === 0).length;

    const contextualCoverage = {
      perKeyword,
      priorityKeywordCoverage: {
        total: verifiedKeys.length,
        withContextualEvidence, // appears in Summary/Experience/Projects, not just listed in Skills
        skillsOnly,
        notPresent,
        ratio: verifiedKeys.length > 0 ? Math.round((withContextualEvidence / verifiedKeys.length) * 100) / 100 : 0,
      },
      sectionCoverage: {
        summary:    verifiedKeys.filter((k) => perKeyword[k].sections.summary).length,
        experience: verifiedKeys.filter((k) => perKeyword[k].sections.experience).length,
        projects:   verifiedKeys.filter((k) => perKeyword[k].sections.projects).length,
        skills:     verifiedKeys.filter((k) => perKeyword[k].sections.skills).length,
      },
    };

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
      // Additive — existing consumers reading score/breakdown/keywordsFound/
      // skillsMatched/skillsMissing etc. are unaffected by the fields below.
      mustHave:   { matched: skillsMatched, missing: skillsMissing },
      niceToHave: { matched: niceMatched,   missing: niceMissing },
      evidenceBreakdown,
      placementQuality,
      duplicateKeywords,
      contentFocus,
      relevanceDensity,
      sectionRelevance,
      contextualCoverage,
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
      // Markdown-escaped punctuation leaking into URLs/text, e.g. "https\://x"
      // or "mailto\:" — a Markdown renderer escapes these characters so they
      // aren't parsed as syntax; once flattened to plain text the backslash
      // just corrupts the URL. Strip the escaping backslash, keep the character.
      .replace(/\\([:/_*[\]().!-])/g, "$1")
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
      personalInfo: cv.personalInfo && {
        ...cv.personalInfo,
        name:      s(cv.personalInfo.name),
        title:     s(cv.personalInfo.title),
        location:  s(cv.personalInfo.location),
        linkedin:  s(cv.personalInfo.linkedin),
        github:    s(cv.personalInfo.github),
        portfolio: s(cv.personalInfo.portfolio),
        website:   s(cv.personalInfo.website),
      },
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
        url:    s(c.url),
      })),
      languages: arr(cv.languages, (l) => ({
        ...l,
        name:           s(l.name),
        level:          s(l.level),
        certificateUrl: s(l.certificateUrl),
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

  validateGeneratedCV(cv, jdKeywords = [], jdAnalysis = null) {
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

    // 7. D-level technologies presented as verified skills (outside the
    // dedicated RECOVERABLE_CATEGORY, where unverified tech is expected and
    // clearly labeled — see recoverMissingKeywords()).
    const mainSkillItems = (out.skills || [])
      .filter((sg) => !/conocimientos/i.test(sg.category || "") && sg.category !== RECOVERABLE_CATEGORY)
      .flatMap((sg) => sg.items || []);
    const dLevelInMain = mainSkillItems.filter((item) => {
      const tech = getTechnologyEvidence(item);
      return tech && tech.category === "D";
    });
    if (dLevelInMain.length > 0) {
      warnings.push(`EVIDENCE_VIOLATION: D-level techs in main skills: ${dLevelInMain.join(", ")}`);
    }

    // 7b. Skills integrity — a MUST HAVE / NICE TO HAVE requirement with VERIFIED
    // evidence must never be missing from skills[]. (Previously this checked
    // the FULL A/B set — but buildAdaptiveSkills() now deliberately prunes
    // non-JD-relevant verified tech from the generated CV per content-budget
    // design, so "not every A/B tech is present" is expected, not a bug.
    // What must NEVER happen is losing an actual keyword match — tier 1/2 in
    // _rankVerifiedTechnologies() are supposed to be unconditional.)
    if (jdAnalysis) {
      const outSkillNorms = new Set(
        (out.skills || []).flatMap((sg) => sg.items || []).map((i) => this._normalize(i))
      );
      const expectedMatched = TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => {
        const eff = getEffectiveEvidence(t.name);
        if (!eff || (eff.category !== "A" && eff.category !== "B")) return false;
        const priority = this._priorityTierFor(t.name, jdAnalysis);
        return priority === "must_have" || priority === "nice_to_have";
      });
      // Compare using this._normalize(t.name) (NOT t.normalized) — the matrix's
      // hand-authored "normalized" field isn't always identical to what
      // _normalize() computes (e.g. "REST APIs" is authored as "rest api"),
      // while outSkillNorms is built with _normalize() on the rendered item text.
      const missingFromSkills = expectedMatched
        .filter((t) => !outSkillNorms.has(this._normalize(t.name)))
        .map((t) => t.name);
      if (missingFromSkills.length > 0) {
        warnings.push(`SKILLS_INTEGRITY: JD-matched verified technologies missing from skills[]: ${missingFromSkills.join(", ")}`);
      }
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

  // ─── FASE 3: recoverMissingKeywords (unified) ─────────────────────────────────
  //
  // Merges recoverMissingSupportedKeywords() and the legacy injectMissingKeywords()
  // into one function, per explicit direction: keyword recovery must keep working
  // for keywords the master profile can't verify — the goal is "flag for manual
  // review", not "silently reject". At the same time, recovered items are never
  // used to fabricate achievements; they only ever land in Skills.
  //
  // Placement/confidence by evidence tier (see classifyKeywordForRecovery()):
  //   VERIFIED (A/B, incl. the AWS override) — inserted into its natural
  //          category (Frontend/Backend/...), same as everything else there.
  //   RECOVERABLE (C-tier like Redis/GraphQL, D-tier like FastAPI, or simply
  //          unknown to the matrix, e.g. Athena/Poetry) — inserted into the
  //          dedicated RECOVERABLE_CATEGORY ("Tecnologías adicionales") instead
  //          of the natural category, so it never reads as equally-proven next
  //          to verified tech. Never omitted outright — the user reviews/removes
  //          manually — UNLESS it's a non-technology practice/soft-skill term
  //          (NON_TECH_TERMS), which is discarded rather than shown as a skill.
  //
  // FASE 5: within RECOVERABLE_CATEGORY, items are sorted must_have >
  // nice_to_have > secondary (via the optional `jdAnalysis` param) and capped
  // at MAX_RECOVERABLE_ITEMS — a long uncurated list of unverified tech reads
  // as keyword stuffing and hurts credibility more than it helps ATS matching.

  // ─── FASE 4/5: recoverKeyword decision function ────────────────────────────────
  //
  // Single source of truth for "what do we do with this JD keyword": three
  // evidence levels — VERIFIED (master profile A/B, can be used as an experience
  // claim in Summary/Experience/Projects), RECOVERABLE (helps ATS matching but
  // must NEVER be phrased as a claim of experience — technologyMention, not
  // experienceClaim), UNSUPPORTED (not a technology at all — a responsibility
  // or soft-skill term like "code review" — discarded rather than forced into
  // Skills). This directly implements "keyword ≠ experience claim".
  //
  // `jdAnalysis` (optional) additionally tags a `priority` — must_have /
  // nice_to_have / secondary — used to rank keywords within the same evidence
  // level (e.g. a must-have RECOVERABLE tech outranks a secondary one when the
  // "Tecnologías adicionales" bucket has to be capped — see recoverMissingKeywords()).

  classifyKeywordForRecovery(keyword, jdAnalysis = null) {
    const kwNorm = this._normalize(keyword);
    const priority = this._priorityTierFor(keyword, jdAnalysis);

    if (NON_TECH_TERMS.has(kwNorm)) {
      return {
        keyword, normalizedKeyword: kwNorm, source: "job_description", priority,
        level: "UNSUPPORTED", evidenceLevel: null,
        canClaimExperience: false, canIncludeForATS: false,
        preferredCategory: null, wording: "Práctica/responsabilidad, no una tecnología — no se agrega a Skills.",
        matchedTech: null,
      };
    }

    const tech = getEffectiveEvidence(keyword);

    if (tech && (tech.category === "A" || tech.category === "B")) {
      return {
        keyword, normalizedKeyword: kwNorm, source: "job_description", priority,
        level: "VERIFIED", evidenceLevel: tech.category,
        canClaimExperience: true, canIncludeForATS: true,
        preferredCategory: this._classifySkillCategory(tech.normalized),
        wording: tech.wording, matchedTech: tech.name,
      };
    }

    if (tech && (tech.category === "C" || tech.category === "D")) {
      return {
        keyword, normalizedKeyword: kwNorm, source: "job_description", priority,
        level: "RECOVERABLE", evidenceLevel: tech.category,
        canClaimExperience: false, canIncludeForATS: true,
        preferredCategory: this._classifySkillCategory(tech.normalized),
        wording: tech.wording, matchedTech: tech.name,
      };
    }

    // No master-profile record at all — still ATS-recoverable as a bare
    // technology mention (never as an experience claim), per explicit
    // direction: don't drop a keyword just because it isn't verified.
    return {
      keyword, normalizedKeyword: kwNorm, source: "job_description", priority,
      level: "RECOVERABLE", evidenceLevel: null,
      canClaimExperience: false, canIncludeForATS: true,
      preferredCategory: this._classifySkillCategory(kwNorm),
      wording: "Mencionada en la oferta — sin evidencia confirmada en el perfil.",
      matchedTech: null,
    };
  }

  // ─── FASE 8: calculateKeywordRelevance ─────────────────────────────────────────
  //
  // Single deterministic relevance score for "should this keyword/technology
  // appear in the adapted CV, and how much weight should it get". Reuses
  // classifyKeywordForRecovery() (evidence + must/nice/secondary priority) as
  // its source of truth rather than re-deriving evidence/priority logic —
  // this is a scoring layer on top of it, not a parallel classifier.
  //
  // `context` (optional) lets a caller nudge the score with situational info
  // it already has and this function doesn't:
  //   context.isComplementary — true if the caller has independently determined
  //     this is a same-category/tag/core-stack complement (see
  //     _rankVerifiedTechnologies()) rather than a direct JD match.
  //   context.section — "summary" | "experience" | "projects" | "skills",
  //     informational only; doesn't change the score, just echoed back so a
  //     caller can log/inspect *where* a relevance decision applies.
  //
  // Score bands (0-100, informational — nothing downstream currently gates on
  // an exact threshold, callers compare relative scores):
  //   100  must-have, verified            70  nice-have, verified
  //    55  must-have, recoverable         35  nice-have, recoverable
  //    45  complementary, verified        20  secondary, verified
  //    15  secondary, recoverable          0  unsupported (never included)

  calculateKeywordRelevance(keyword, jdAnalysis, context = {}) {
    const decision = this.classifyKeywordForRecovery(keyword, jdAnalysis);
    let score = 0;

    if (decision.level === "VERIFIED") {
      if (decision.priority === "must_have") score = 100;
      else if (decision.priority === "nice_to_have") score = 70;
      else score = context.isComplementary ? 45 : 20;
    } else if (decision.level === "RECOVERABLE") {
      if (decision.priority === "must_have") score = 55;
      else if (decision.priority === "nice_to_have") score = 35;
      else score = 15;
    }
    // UNSUPPORTED stays 0 — never worth including (see NON_TECH_TERMS).

    return {
      keyword,
      normalizedKeyword: decision.normalizedKeyword,
      level: decision.level,
      priority: decision.priority,
      matchedTech: decision.matchedTech,
      category: decision.preferredCategory,
      isComplementary: !!context.isComplementary,
      section: context.section || null,
      score,
      // A quick, non-exhaustive omission signal for callers doing budget
      // decisions: below this, a technology is adding more noise than signal.
      worthIncluding: score >= 15,
    };
  }

  recoverMissingKeywords(optimizedCV, jdKeywords, jdAnalysis = null) {
    if (!jdKeywords?.length) return optimizedCV;

    const skills = (optimizedCV.skills || []).map((sg) => ({ ...sg, items: [...(sg.items || [])] }));
    const categoryIndex = new Map(skills.map((sg, i) => [sg.category, i]));

    const existingNorm = new Set(
      skills.flatMap((sg) =>
        (sg.items || []).flatMap((item) => {
          const norm = this._normalize(item);
          return [norm, ...(ALIAS_MAP.get(norm) || [])];
        })
      )
    );

    const summary = { verified: [], recoverable: [], discarded: [] };

    for (const kw of jdKeywords) {
      const kwNorm = this._normalize(kw);
      if (!kwNorm || kwNorm.split(" ").length > 3) continue;

      // Skip if already present (exact or alias match)
      if (existingNorm.has(kwNorm) || (ALIAS_MAP.get(kwNorm) || []).some((a) => existingNorm.has(a))) continue;
      // BUG FIX: this used to be a bare 4-char shared-prefix check (e.g. "git"
      // vs "github", or "reactnative" vs "react" — both share a 4-char prefix
      // but are different technologies), which wrongly treated a genuinely
      // distinct JD keyword as "already present" and silently dropped it —
      // e.g. "ReactNative"/"React-Native" (normalizes to "reactnative", no
      // space) got skipped as a false duplicate of an already-listed "React"
      // ("reac" prefix match), so React Native could never be recovered even
      // when it was legitimately missing. Same containment + length-ratio
      // guard already used in _priorityTierFor() for the identical reason.
      if (kwNorm.length >= 3) {
        const isNearDuplicate = [...existingNorm].some((e) => {
          if (e.length < 3 || !(e.includes(kwNorm) || kwNorm.includes(e))) return false;
          const ratio = Math.min(e.length, kwNorm.length) / Math.max(e.length, kwNorm.length);
          return ratio >= 0.6;
        });
        if (isNearDuplicate) continue;
      }

      const decision = this.classifyKeywordForRecovery(kw, jdAnalysis);

      if (!decision.canIncludeForATS) {
        summary.discarded.push(kw);
        continue;
      }

      // VERIFIED keywords go to their natural category (Frontend/Backend/...).
      // Everything else (RECOVERABLE) goes to one dedicated, clearly-labeled
      // bucket so it never reads as equally-proven next to verified tech.
      const category = decision.level === "VERIFIED" ? decision.preferredCategory : RECOVERABLE_CATEGORY;
      const label = this._prettifyKeyword(kw);

      let idx = categoryIndex.get(category);
      if (idx === undefined) {
        skills.push({ category, items: [] });
        idx = skills.length - 1;
        categoryIndex.set(category, idx);
      }
      if (!skills[idx].items.some((i) => this._normalize(i) === kwNorm)) {
        skills[idx].items.push(label);
        existingNorm.add(kwNorm);
      }
      (decision.level === "VERIFIED" ? summary.verified : summary.recoverable).push(kw);
    }

    // Sort + cap RECOVERABLE_CATEGORY: must_have first, then nice_to_have, then
    // secondary. A CV with a dozen unverified technologies listed reads as
    // padding, not signal — keep only the ones most worth the reviewer's trust.
    // Priority is (re)computed per item rather than tracked during the loop
    // above, because this category can already contain C-tier tech placed by
    // buildAdaptiveSkills() (e.g. Redis, JD-relevant but not evidence-A/B) —
    // items this function never itself "recovered".
    const recIdx = categoryIndex.get(RECOVERABLE_CATEGORY);
    if (recIdx !== undefined && skills[recIdx].items.length > 0) {
      const TIER_ORDER = { must_have: 0, nice_to_have: 1, secondary: 2 };
      const sorted = [...skills[recIdx].items].sort((a, b) => {
        const pa = TIER_ORDER[this._priorityTierFor(a, jdAnalysis)] ?? 2;
        const pb = TIER_ORDER[this._priorityTierFor(b, jdAnalysis)] ?? 2;
        return pa - pb;
      });
      skills[recIdx] = { ...skills[recIdx], items: sorted.slice(0, MAX_RECOVERABLE_ITEMS) };
    }

    // Additive metadata — safe for existing consumers (they only read skills[]).
    return { ...optimizedCV, skills, keywordRecoverySummary: summary };
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
      jest: "Jest", vite: "Vite", vitest: "Vitest", fastapi: "FastAPI",
      flask: "Flask", nginx: "Nginx", jira: "Jira", figma: "Figma",
      airflow: "Airflow", dagster: "Dagster", prefect: "Prefect",
      bigquery: "BigQuery", trino: "Trino", presto: "Presto",
      langchain: "LangChain", nx: "Nx", uv: "UV",
      "aws bedrock": "AWS Bedrock", llm: "LLM", ai: "AI",
      kafka: "Kafka", terraform: "Terraform", "ci/cd": "CI/CD",
    };
    const norm = this._normalize(kw);
    if (MAP[norm]) return MAP[norm];
    // Alias fallback: a JD phrasing like "RESTful APIs" or "Node" won't hit
    // MAP directly, but its alias group (already used for evidence lookup and
    // dedup elsewhere) does — reuse it here instead of falling through to a
    // raw capitalize, which would render "Restful apis" instead of "REST API".
    for (const alias of (ALIAS_MAP.get(norm) || [])) {
      if (MAP[alias]) return MAP[alias];
    }
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
