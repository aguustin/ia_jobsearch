import { ollamaService } from "./OllamaService.js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
import { DEFAULT_PERSONAL_INFO, DEFAULT_CERTIFICATIONS, DEFAULT_PROJECTS, DEFAULT_SUMMARY, DEFAULT_SKILL_CATEGORIES, DEFAULT_REGULAR_EXPERIENCE, DEFAULT_LANGUAGES } from "../config/userDefaults.js";

// ─── Tech keyword dictionary (covers multilingual JDs with EN tech terms) ───
const TECH_TERMS = [
  // Languages
  "python", "javascript", "typescript", "java", "golang", "go", "rust", "ruby",
  "php", "kotlin", "swift", "dart", "scala", "elixir", "perl", "lua",
  "bash", "powershell", "shell", "sql", "plsql", "tsql", "cobol", "groovy",
  "c++", "c#", "objective-c",
  // Frontend — frameworks & libraries
  "react", "reactjs", "vue", "vuejs", "angular", "angularjs", "svelte",
  "nextjs", "nuxtjs", "gatsby", "remix", "astro", "jquery", "bootstrap", "tailwind",
  "webpack", "vite", "babel", "rollup", "parcel", "esbuild",
  // Frontend — styling
  "sass", "scss", "less", "css", "css3", "html", "html5",
  "styled components", "emotion", "chakra", "shadcn",
  // Frontend — state management
  "redux", "zustand", "mobx", "rxjs", "recoil", "jotai", "react query", "tanstack",
  // Frontend — tooling & testing
  "storybook", "jest", "vitest", "cypress", "playwright", "testing library",
  "mocha", "chai", "jasmine", "selenium", "puppeteer",
  // Backend
  "nodejs", "express", "expressjs", "fastapi", "django", "flask", "rails",
  "spring", "springboot", "laravel", "symfony", "nestjs", "koa", "fastify",
  "hono", "gin", "fiber", "actix", "asp.net", "aspnet", "bun", "deno",
  // Auth
  "oauth", "oauth2", "passport", "auth0", "keycloak", "jwt", "saml", "openid",
  // ORMs & database clients
  "prisma", "sequelize", "mongoose", "typeorm", "drizzle", "sqlalchemy",
  // Mobile
  "android", "ios", "flutter", "xamarin", "ionic", "capacitor",
  "react native", "reactnative", "cordova", "phonegap", "android studio", "expo",
  // Cloud
  "aws", "gcp", "azure", "heroku", "vercel", "netlify", "cloudflare",
  "google cloud", "google cloud platform",
  "lambda", "ec2", "s3", "rds", "cloudfront", "route53",
  "gke", "aks", "ecs", "fargate", "cloud run", "cloud functions",
  // DevOps / Infra
  "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef",
  "jenkins", "gitlab", "github", "bitbucket", "circleci", "travis",
  "github actions", "gitlab ci", "helm", "argocd", "grafana", "prometheus",
  "nginx", "apache", "linux", "ubuntu", "debian", "centos", "rhel",
  "vault", "pulumi",
  // Databases
  "postgresql", "postgres", "mysql", "mariadb", "mongodb", "redis",
  "elasticsearch", "cassandra", "dynamodb", "sqlite", "oracle", "mssql",
  "neo4j", "firebase", "supabase", "clickhouse", "influxdb", "minio",
  // Message brokers
  "rabbitmq", "kafka", "celery", "bull", "sqs", "pubsub",
  // Architecture / Concepts
  "microservices", "serverless", "restful", "rest api", "graphql", "grpc",
  "websocket", "event-driven", "clean architecture", "hexagonal", "solid",
  "ddd", "tdd", "bdd", "cicd",
  // Methodologies
  "agile", "scrum", "kanban", "lean", "devops",
  "pair programming", "code review", "test driven",
  // Data / AI
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "spark", "airflow", "mlops",
];

// Multi-word terms need exact substring check
const MULTIWORD_TERMS = TECH_TERMS.filter((t) => t.includes(" "));
const SINGLEWORD_TERMS = TECH_TERMS.filter((t) => !t.includes(" "));

// Whitelist of all-caps sequences that are genuine tech skills.
// Anything NOT here (SEO, PPC, UI, UX, CI, CD, MERN, LSA, etc.) is excluded.
const TECH_CAPS = new Set([
  "JWT", "SQL", "SDK", "CLI", "SSR", "SSG", "CSR", "CDN", "SPA", "MVC",
  "OOP", "ORM", "DDD", "TDD", "BDD", "CRUD", "JSON", "XML", "YAML", "DOM",
  "HTTP", "HTTPS", "GRPC", "PWA", "SSH", "FTP", "SFTP",
  "VPN", "VPC", "IAM", "S3", "EC2", "RDS", "SNS", "SQS", "ECS", "EKS",
  "GKE", "AKS", "RBAC", "CORS", "XSS", "CSRF", "WASM", "JVM",
  "SAML", "OIDC", "PHP", "CSS", "HTML", "SASS", "SCSS", "LESS",
]);

// ─── Alias groups — each array = equivalent terms (all pre-normalized) ────────
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

// Build lookup: normalized term → array of normalized aliases
const ALIAS_MAP = new Map();
for (const group of ALIAS_GROUPS) {
  for (const term of group) {
    ALIAS_MAP.set(term, group.filter((t) => t !== term));
  }
}

export class ATSOptimizerService {
  // ─── Regex-based keyword extraction ────────────────────────────────────────

  _extractKeywordsRegex(text) {
    const found = new Set();
    const lower = this._normalize(text);

    // 1. Dictionary single-word terms (word-boundary match on normalized text)
    for (const term of SINGLEWORD_TERMS) {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (pattern.test(lower)) found.add(term);
    }

    // 2. Multi-word terms (substring match after normalization)
    for (const term of MULTIWORD_TERMS) {
      if (lower.includes(term)) found.add(term);
    }

    // 3. Known tech acronyms only — whitelist prevents SEO, PPC, UI, UX, CI, CD, etc.
    const capsMatches = text.match(/\b[A-Z]{2,10}\b/g) || [];
    capsMatches.forEach((m) => {
      if (TECH_CAPS.has(m)) found.add(m.toLowerCase());
    });

    // 4. CamelCase tech terms: VueJS, NodeJS, TypeScript, ReactNative, NestJS…
    const camelMatches = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]*)+\b/g) || [];
    camelMatches.forEach((m) => found.add(this._normalize(m)));

    // 5. Dotted framework names: Node.js, Vue.js, React.js, Next.js…
    const dottedMatches = text.match(/\b[A-Za-z]+\.[Jj][Ss]\b/g) || [];
    dottedMatches.forEach((m) => found.add(this._normalize(m)));

    // 6. CI/CD — must detect before normalization strips the slash into "ci cd"
    if (/\bCI[\s/\-]?CD\b/i.test(text)) found.add("cicd");

    return [...found].filter((k) => k.length > 1);
  }

  // Normalize: lowercase, / and \ become spaces (preserves word boundaries for "Cordova/Phonegap"),
  // dots/hyphens/underscores removed to merge "Node.js" → "nodejs", "ci-cd" → "cicd"
  _normalize(text) {
    return text
      .toLowerCase()
      .replace(/[/\\]/g, " ")
      .replace(/[.\-_]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Sorts an array of strings so items that match more JD keywords come first.
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

  // Extracts the job role/title from a job description using regex patterns (no AI needed).
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

    // Merge AI output with regex extraction
    const mergedKeywords = [...new Set([
      ...(aiResult.keywords || []).map((k) => this._normalize(k)),
      ...(aiResult.requiredSkills || []).map((k) => this._normalize(k)),
      ...(aiResult.niceToHaveSkills || []).map((k) => this._normalize(k)),
      ...regexKeywords,
    ])].filter(Boolean);

    const mergedRequired = [...new Set([
      ...(aiResult.requiredSkills || []).map((k) => this._normalize(k)),
      // If AI returned nothing, promote regex keywords as required
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

    // Call 1: all text fields except achievements (small payload)
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

    // Call 2..N: one Ollama call per experience entry (achievements can be long)
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

  // ─── CV Optimization ─────────────────────────────────────────────────────────

  async optimizeCV(rawCVText, parsedCV, jobDescription, jdAnalysis, profileSummary = "") {
    const keywordsStr = (jdAnalysis.keywords || []).slice(0, 20).join(", ");
    const requiredStr = (jdAnalysis.requiredSkills || []).slice(0, 12).join(", ");

    const prompt = `Eres un experto en optimización de CVs para sistemas ATS. Reescribe el CV para maximizar el matching con la oferta, SIN inventar experiencia ni tecnologías.

REGLAS CRÍTICAS:
- NUNCA inventar experiencia, cargos, empresas, tecnologías ni logros inexistentes
- SÍ mejorar la redacción y el impacto de los bullet points existentes
- SÍ incorporar keywords ATS donde sean verdaderas y aplicables al contexto real
- SÍ reordenar skills para destacar las más relevantes primero
- SÍ mejorar el summary para reflejar el fit con la posición usando keywords reales
- SÍ cuantificar logros cuando el CV original tenga datos numéricos

CV ORIGINAL:
${rawCVText.slice(0, 2000)}

DESCRIPCIÓN DE LA POSICIÓN (extracto):
${jobDescription.slice(0, 800)}

KEYWORDS ATS PRIORITARIAS: ${keywordsStr}
SKILLS REQUERIDAS: ${requiredStr}

Devuelve SOLO un JSON válido con esta estructura:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "<summary optimizado para ATS, 3-4 oraciones, incluye keywords reales y relevantes>",
  "experience": [
    {
      "role": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "achievements": ["<bullet point mejorado con impacto cuantificable y keywords>"]
    }
  ],
  "skills": [
    { "category": "<categoría>", "items": ["<skills más relevantes primero>"] }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "languages": [{ "name": "", "level": "" }]
}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      return this._normalizeOptimizedCV(result, parsedCV, rawCVText, profileSummary, jdAnalysis);
    } catch {
      return this._normalizeOptimizedCV({}, parsedCV, rawCVText, profileSummary, jdAnalysis);
    }
  }

  // Parses "Category: item1, item2, item3" lines from raw CV text as a fallback skill extractor.
  // Limits to the skills section when detectable, skips bullet lines, and deduplicates categories.
  _extractSkillsFromText(rawText) {
    const allLines = rawText.split("\n").map((l) => l.trim());

    // Try to find the skills section boundaries
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
      if (/^[•\-\*▪►]\s*/.test(line)) continue; // skip experience bullets
      const m = line.match(/^([^:\n]{2,40}):\s*(.{4,})$/);
      if (!m) continue;
      const items = m[2]
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
      if (items.length < 2) continue;
      const key = m[1].trim().toLowerCase();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        existing.items = [...new Set([...existing.items, ...items])];
      } else {
        skillMap.set(key, { category: m[1].trim(), items });
      }
    }
    return [...skillMap.values()];
  }

  _normalizeOptimizedCV(raw, original, rawText = "", profileSummary = "", jdAnalysis = null) {
    const hasSkills = (arr) => Array.isArray(arr) && arr.some((sg) => sg.items?.length > 0);
    const hasExp    = (arr) => Array.isArray(arr) && arr.length > 0;

    // Remove descriptive phrases from parsed skill items (e.g. "Control de versiones con Git").
    // A real skill keyword has ≤ 4 words and ≤ 50 chars; longer strings are bullets, not skills.
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

    // Always start from defaults so all categories are present, then merge AI items in
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

    // Strip any AI-generated projects section and always inject defaults
    const rawExp = hasExp(raw.experience) ? raw.experience : (original.experience || []);
    const projIdx = rawExp.findIndex((e) =>
      /proyecto[s]?\s+destacados?/i.test(e.role || "") ||
      /proyecto[s]?\s+destacados?/i.test(e.company || "")
    );
    const rawRegularExp = projIdx === -1 ? rawExp : rawExp.slice(0, projIdx);

    // Always use canonical role/company/dates from defaults; merge Ollama achievements when available
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

    // Merge personal info: Ollama → original parsed → hardcoded user defaults
    const piBase = raw.personalInfo || original.personalInfo || {};
    const pick   = (a, b) => a?.trim() || b?.trim() || "";
    const personalInfo = {
      name:     pick(piBase.name,     original.personalInfo?.name) || DEFAULT_PERSONAL_INFO.name,
      email:    pick(piBase.email,    original.personalInfo?.email),
      phone:    pick(piBase.phone,    original.personalInfo?.phone),
      location: pick(piBase.location, original.personalInfo?.location) || DEFAULT_PERSONAL_INFO.location,
      linkedin: pick(piBase.linkedin, original.personalInfo?.linkedin) || DEFAULT_PERSONAL_INFO.linkedin,
      github:    pick(piBase.github,    original.personalInfo?.github)    || DEFAULT_PERSONAL_INFO.github,
      portfolio: pick(piBase.portfolio, original.personalInfo?.portfolio) || DEFAULT_PERSONAL_INFO.portfolio,
      website:   pick(piBase.website,   original.personalInfo?.website),
    };

    const jdKeywords = jdAnalysis?.keywords || [];

    // Sort achievement bullets within each experience entry so the most JD-relevant ones appear first
    const experienceSorted = experience.map((entry) => ({
      ...entry,
      achievements: this._sortByRelevance(entry.achievements || [], jdKeywords),
    }));

    // Sort skill items within each category so JD-matching skills appear first
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
        // Normalize: some entries use 'language' field instead of 'name' (Profile schema)
        const normalized = base.map((l) => l.name ? l : { ...l, name: l.language });
        // Merge default certificateUrl for each entry that matches a default
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

  // Returns true if keyword fuzzy-matches any word in the CV word set.
  // Strategies (in order):
  //   1. Exact match (already handled by caller)
  //   2. First 4 chars match when both strings are ≥ 4 chars  (react ↔ reactjs)
  //   3. One is a prefix of the other when shorter string is ≥ 3 chars (vue ↔ vuejs)
  _fuzzyMatch(keyword, cvWords) {
    for (const word of cvWords) {
      if (word === keyword) return true;
      const minLen = Math.min(keyword.length, word.length);
      if (minLen >= 4 && keyword.slice(0, 4) === word.slice(0, 4)) return true;
      if (minLen >= 3 && (keyword.startsWith(word) || word.startsWith(keyword))) return true;
    }
    return false;
  }

  // Returns true if any known alias of `keyword` appears in the CV (exact/fuzzy).
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

  // Replaces fuzzy-matching CV words with the exact JD keyword in the text output.
  // Longest keywords are processed first to avoid partial replacements.
  applyKeywordReplacements(text, jdKeywords) {
    if (!text || !jdKeywords?.length) return text;
    const sorted = [...jdKeywords].sort((a, b) => b.length - a.length);
    let result = text;
    for (const keyword of sorted) {
      const kwNorm = this._normalize(keyword);
      result = result.replace(/\b[\w.+-]+\b/g, (match) => {
        const matchNorm = this._normalize(match);
        if (matchNorm === kwNorm) return keyword; // exact → use canonical JD form
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
    // Combine structured parse + raw text so keywords are found even if Ollama parsing was incomplete
    const cvTextNorm = this._normalize([parsedFlat, rawText].filter(Boolean).join(" "));
    // Individual words for fuzzy prefix matching
    const cvWords = new Set(cvTextNorm.split(/\s+/).filter((w) => w.length >= 3));

    const allKeywords = [...new Set(
      [...(jdAnalysis.keywords || []), ...(jdAnalysis.requiredSkills || [])]
        .map((k) => this._normalize(k))
        .filter(Boolean)
    )];

    const keywordsFound = [];
    const keywordsMissing = [];
    const keywordsFuzzy = []; // matched by similarity, not exact

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

    // Keywords: 50 pts
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

    // Skills: 30 pts
    const skillScore = requiredSkills.length > 0
      ? (skillsMatched.length / requiredSkills.length) * 30
      : 15;

    // Structure: 20 pts
    const hasSkills = (parsedCV.skills || []).length > 0;
    const hasExperience = (parsedCV.experience || []).length > 0;
    const hasEducation = (parsedCV.education || []).length > 0;
    const hasSummary = !!(parsedCV.summary || "").trim();
    const hasContact = !!(parsedCV.personalInfo?.email || parsedCV.personalInfo?.phone);
    const structureScore =
      (hasSkills ? 6 : 0) +
      (hasExperience ? 6 : 0) +
      (hasEducation ? 3 : 0) +
      (hasSummary ? 3 : 0) +
      (hasContact ? 2 : 0);

    const totalScore = Math.round(keywordScore + skillScore + structureScore);

    const kwCount = allKeywords.length;
    const confidence = kwCount === 0 ? "none" : kwCount < 5 ? "low" : kwCount < 13 ? "medium" : "high";

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      confidence,
      keywordsFound: keywordsFound.slice(0, 25),
      keywordsMissing: keywordsMissing.slice(0, 15),
      keywordsFuzzy: keywordsFuzzy.slice(0, 15),
      skillsMatched: skillsMatched.slice(0, 12),
      skillsMissing: skillsMissing.slice(0, 10),
      breakdown: {
        keywords: Math.round(keywordScore),
        skills: Math.round(skillScore),
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
    const recs = [];
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

  // ─── Missing keyword injection ───────────────────────────────────────────────

  // Distributes missing JD keywords into existing skill categories where possible,
  // and creates a "Stack adicional" group for anything that doesn't fit.
  injectMissingKeywords(optimizedCV, allKeywords) {
    if (!allKeywords?.length) return optimizedCV;

    const skills = (optimizedCV.skills || []).map((sg) => ({ ...sg, items: [...sg.items] }));

    // Build dedup set using consistent normalization + expand with aliases so
    // "github" already present blocks "github actions" from being injected again.
    const existingNorm = new Set(
      skills.flatMap((sg) =>
        sg.items.flatMap((item) => {
          const norm = this._normalize(item);
          return [norm, ...(ALIAS_MAP.get(norm) || [])];
        })
      )
    );

    // Detect category type from its ITEMS (not its name — user CVs have Spanish names).
    const ITEM_SIGNALS = [
      { type: "frontend", keys: ["react", "vue", "angular", "svelte", "html", "css", "javascript", "typescript", "nextjs", "nuxtjs", "sass", "scss", "redux", "webpack", "vite", "jquery", "bootstrap", "tailwind", "gatsby", "remix", "astro"] },
      { type: "backend",  keys: ["nodejs", "express", "django", "flask", "rails", "spring", "php", "fastapi", "nestjs", "koa", "graphql", "restful", "python", "golang", "java", "laravel", "aspnet", "dotnet"] },
      { type: "database", keys: ["postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra", "mariadb", "oracle", "sql", "dynamodb", "firebase", "supabase"] },
      { type: "devops",   keys: ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "circleci", "cicd", "linux", "github", "gitlab", "helm", "nginx", "ansible", "argocd", "github actions", "gitlab ci"] },
      { type: "mobile",   keys: ["react native", "flutter", "android", "ios", "swift", "kotlin", "ionic", "expo", "capacitor"] },
    ];

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
      const kwAliases = ALIAS_MAP.get(kwNorm) || [];

      // Skip descriptive phrases (4+ words are sentences, not technology keywords)
      if (kwNorm.split(" ").length > 3) continue;

      // Skip if already present (exact, alias, or first-4-chars prefix match)
      if (existingNorm.has(kwNorm) || kwAliases.some((a) => existingNorm.has(a))) continue;
      if (kwNorm.length >= 4) {
        const prefix = kwNorm.slice(0, 4);
        const alreadyThere = [...existingNorm].some(
          (e) => e.length >= 4 && (e.startsWith(prefix) || kwNorm.startsWith(e.slice(0, 4)))
        );
        if (alreadyThere) continue;
      }

      // Try to place in a matching category (detected by items, not name)
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
    // Short acronyms (≤4 chars, no spaces) → all caps
    if (kw.length <= 4 && !kw.includes(" ")) return kw.toUpperCase();
    return kw.charAt(0).toUpperCase() + kw.slice(1);
  }

  // ─── Text Formatter ──────────────────────────────────────────────────────────

  formatOptimizedCVText(optimizedCV) {
    const lines = [];
    const pi = optimizedCV.personalInfo || {};
    const sep = "─".repeat(55);

    if (pi.name) {
      lines.push(pi.name.toUpperCase());
      lines.push("");
    }

    const contactParts = [pi.email, pi.phone, pi.location, pi.linkedin, pi.github].filter(Boolean);
    if (contactParts.length) {
      lines.push(contactParts.join("  |  "));
      lines.push("");
    }

    if (optimizedCV.summary) {
      lines.push("RESUMEN PROFESIONAL");
      lines.push(sep);
      lines.push(optimizedCV.summary);
      lines.push("");
    }

    if ((optimizedCV.experience || []).length > 0) {
      lines.push("EXPERIENCIA PROFESIONAL");
      lines.push(sep);
      optimizedCV.experience.forEach((exp) => {
        lines.push(`${exp.role || ""}  —  ${exp.company || ""}`);
        const period = [exp.startDate, exp.endDate || "Presente"].filter(Boolean).join(" – ");
        if (period) lines.push(period);
        (exp.achievements || []).forEach((a) => lines.push(`  • ${a}`));
        lines.push("");
      });
    }

    if ((optimizedCV.skills || []).length > 0) {
      lines.push("HABILIDADES TÉCNICAS");
      lines.push(sep);
      optimizedCV.skills.forEach((sg) => {
        if (sg.category && (sg.items || []).length > 0) {
          lines.push(`${sg.category}: ${sg.items.join(", ")}`);
        }
      });
      lines.push("");
    }

    if ((optimizedCV.education || []).length > 0) {
      lines.push("EDUCACIÓN");
      lines.push(sep);
      optimizedCV.education.forEach((edu) => {
        lines.push(`${edu.degree || ""}  —  ${edu.institution || ""}`);
        const period = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
        if (period) lines.push(period);
        lines.push("");
      });
    }

    if ((optimizedCV.languages || []).length > 0) {
      lines.push("IDIOMAS");
      lines.push(sep);
      optimizedCV.languages.forEach((l) => {
        if (l.name) lines.push(`${l.name}: ${l.level || ""}`);
      });
    }

    return lines.join("\n");
  }
}

export const atsOptimizerService = new ATSOptimizerService();
