import { ollamaService } from "./OllamaService.js";
import { DEFAULT_PERSONAL_INFO, DEFAULT_CERTIFICATIONS } from "../config/userDefaults.js";

// ─── Tech keyword dictionary (covers multilingual JDs with EN tech terms) ───
const TECH_TERMS = [
  // Languages
  "python", "javascript", "typescript", "java", "golang", "go", "rust", "ruby",
  "php", "kotlin", "swift", "dart", "scala", "elixir", "perl", "lua",
  "bash", "powershell", "shell", "sql", "plsql", "tsql", "cobol", "groovy",
  "c++", "c#", "objective-c",
  // Frontend
  "react", "reactjs", "vue", "vuejs", "angular", "angularjs", "svelte",
  "nextjs", "nuxtjs", "gatsby", "jquery", "bootstrap", "tailwind",
  "webpack", "vite", "babel", "sass", "less", "css", "html",
  // Backend
  "nodejs", "express", "expressjs", "fastapi", "django", "flask", "rails",
  "spring", "springboot", "laravel", "symfony", "nestjs", "koa", "fastify",
  "gin", "fiber", "actix", "asp.net", "aspnet",
  // Mobile
  "android", "ios", "flutter", "xamarin", "ionic", "capacitor",
  "react native", "reactnative", "cordova", "phonegap", "android studio",
  // Cloud
  "aws", "gcp", "azure", "heroku", "vercel", "netlify", "cloudflare",
  "lambda", "ec2", "s3", "gke", "aks", "ecs", "fargate",
  // DevOps / Infra
  "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef",
  "jenkins", "gitlab", "github", "bitbucket", "circleci", "travis",
  "github actions", "helm", "grafana", "prometheus", "nginx", "apache",
  "linux", "ubuntu", "debian", "centos", "rhel",
  // Databases
  "postgresql", "postgres", "mysql", "mariadb", "mongodb", "redis",
  "elasticsearch", "cassandra", "dynamodb", "sqlite", "oracle", "mssql",
  "neo4j", "firebase", "supabase", "clickhouse", "influxdb",
  // Architecture / Concepts
  "microservices", "serverless", "restful", "rest api", "graphql", "grpc",
  "websocket", "event-driven", "clean architecture", "hexagonal", "solid",
  "ddd", "tdd", "bdd",
  // Methodologies
  "agile", "scrum", "kanban", "lean", "devops", "cicd", "ci/cd",
  "pair programming", "code review", "test driven",
  // Data / AI
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "spark", "kafka", "airflow", "mlops",
];

// Multi-word terms need exact substring check
const MULTIWORD_TERMS = TECH_TERMS.filter((t) => t.includes(" "));
const SINGLEWORD_TERMS = TECH_TERMS.filter((t) => !t.includes(" "));

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
  ["cicd", "ci cd", "continuous integration", "continuous delivery"],
  ["rest api", "restful", "rest"],
  ["graphql", "gql"],
  ["amazon web services", "aws"],
  ["google cloud platform", "gcp"],
  ["microsoft azure", "azure"],
  ["github actions", "gha"],
  ["react native", "reactnative"],
  ["android studio", "android"],
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

    // 1. Dictionary single-word terms
    for (const term of SINGLEWORD_TERMS) {
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (pattern.test(lower)) found.add(term);
    }

    // 2. Multi-word terms (substring match after normalization)
    for (const term of MULTIWORD_TERMS) {
      if (lower.includes(term)) found.add(term);
    }

    // 3. All-caps abbreviations not in dict: API, REST, HTTP, SDK, CLI…
    const capsMatches = text.match(/\b[A-Z]{2,10}\b/g) || [];
    capsMatches.forEach((m) => {
      if (!["THE", "AND", "FOR", "FROM", "WITH", "ARE", "YOU", "NOT", "ALL", "THIS", "THAT"].includes(m)) {
        found.add(m.toLowerCase());
      }
    });

    // 4. CamelCase tech terms: VueJS, NodeJS, GoLang, TypeScript, ReactNative
    const camelMatches = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]*)+\b/g) || [];
    camelMatches.forEach((m) => found.add(this._normalize(m)));

    // 5. Dotted framework names: Node.js, Vue.js, React.js
    const dottedMatches = text.match(/\b[A-Za-z]+\.[Jj][Ss]\b/g) || [];
    dottedMatches.forEach((m) => found.add(this._normalize(m)));

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

    let ollamaResult = {};
    try {
      ollamaResult = await ollamaService.generateJSON(prompt);
    } catch {
      // Ollama failed: regex extraction alone is enough
    }

    // Merge Ollama output with regex extraction
    const mergedKeywords = [...new Set([
      ...(ollamaResult.keywords || []).map((k) => this._normalize(k)),
      ...(ollamaResult.requiredSkills || []).map((k) => this._normalize(k)),
      ...(ollamaResult.niceToHaveSkills || []).map((k) => this._normalize(k)),
      ...regexKeywords,
    ])].filter(Boolean);

    const mergedRequired = [...new Set([
      ...(ollamaResult.requiredSkills || []).map((k) => this._normalize(k)),
      // If Ollama returned nothing, promote regex keywords as required
      ...(!(ollamaResult.requiredSkills?.length) ? regexKeywords.slice(0, 8) : []),
    ])].filter(Boolean);

    return {
      requiredSkills: mergedRequired,
      niceToHaveSkills: (ollamaResult.niceToHaveSkills || []).map((k) => this._normalize(k)),
      keywords: mergedKeywords,
      experienceLevel: ollamaResult.experienceLevel || "unknown",
      industry: ollamaResult.industry || "",
      role: ollamaResult.role || "",
      softSkills: ollamaResult.softSkills || [],
      _regexKeywords: regexKeywords,
    };
  }

  // ─── CV Optimization ─────────────────────────────────────────────────────────

  async optimizeCV(rawCVText, parsedCV, jobDescription, jdAnalysis) {
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
      const result = await ollamaService.generateJSON(prompt, { maxTokens: 3000 });
      return this._normalizeOptimizedCV(result, parsedCV, rawCVText);
    } catch {
      return this._normalizeOptimizedCV({}, parsedCV, rawCVText);
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

  _normalizeOptimizedCV(raw, original, rawText = "") {
    const hasSkills = (arr) => Array.isArray(arr) && arr.some((sg) => sg.items?.length > 0);
    const hasExp    = (arr) => Array.isArray(arr) && arr.length > 0;

    const skills = hasSkills(raw.skills)
      ? raw.skills
      : hasSkills(original.skills)
        ? original.skills
        : this._extractSkillsFromText(rawText);

    const experience = hasExp(raw.experience) ? raw.experience : (original.experience || []);

    // Merge personal info: Ollama → original parsed → hardcoded user defaults
    const piBase = raw.personalInfo || original.personalInfo || {};
    const pick   = (a, b) => a?.trim() || b?.trim() || "";
    const personalInfo = {
      name:     pick(piBase.name,     original.personalInfo?.name),
      email:    pick(piBase.email,    original.personalInfo?.email),
      phone:    pick(piBase.phone,    original.personalInfo?.phone),
      location: pick(piBase.location, original.personalInfo?.location) || DEFAULT_PERSONAL_INFO.location,
      linkedin: pick(piBase.linkedin, original.personalInfo?.linkedin) || DEFAULT_PERSONAL_INFO.linkedin,
      github:   pick(piBase.github,   original.personalInfo?.github)   || DEFAULT_PERSONAL_INFO.github,
      website:  pick(piBase.website,  original.personalInfo?.website),
    };

    return {
      personalInfo,
      summary: raw.summary || original.summary || "",
      experience,
      skills,
      education: hasExp(raw.education) ? raw.education : (original.education || []),
      languages: Array.isArray(raw.languages) ? raw.languages : (original.languages || []),
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
  injectMissingKeywords(optimizedCV, missingKeywords) {
    if (!missingKeywords?.length) return optimizedCV;

    const skills = (optimizedCV.skills || []).map((sg) => ({ ...sg, items: [...sg.items] }));

    // Signals for auto-categorization
    const SIGNALS = [
      { signals: ["frontend", "client", "ui", "web"],           keys: ["react", "vue", "angular", "html", "css", "javascript", "typescript", "svelte", "next", "nuxt", "bootstrap", "tailwind", "jquery", "webpack", "vite"] },
      { signals: ["backend", "server", "api"],                  keys: ["node", "express", "python", "django", "flask", "java", "spring", "php", "ruby", "rails", "golang", "go", "nestjs", "fastapi", "laravel", "aspnet", "dotnet"] },
      { signals: ["base", "dato", "database", "db"],            keys: ["postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra", "dynamodb", "mariadb", "oracle", "sql"] },
      { signals: ["devops", "cloud", "infra", "deploy", "ci"],  keys: ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "ansible", "cicd", "helm", "linux", "github", "gitlab"] },
      { signals: ["mobile", "movil", "móvil"],                  keys: ["react native", "flutter", "android", "ios", "swift", "kotlin", "ionic"] },
    ];

    const unmatched = [];

    for (const kw of missingKeywords) {
      const kwNorm = kw.toLowerCase().replace(/[.\-_]/g, "");
      let placed = false;

      for (const sg of skills) {
        const catNorm = (sg.category || "").toLowerCase();
        for (const { signals, keys } of SIGNALS) {
          if (!signals.some((s) => catNorm.includes(s))) continue;
          if (!keys.some((k) => kwNorm.startsWith(k.slice(0, 4)) || k.startsWith(kwNorm.slice(0, 4)))) continue;
          if (!sg.items.some((item) => item.toLowerCase().replace(/[.\-_]/g, "") === kwNorm)) {
            sg.items.push(this._prettifyKeyword(kw));
          }
          placed = true;
          break;
        }
        if (placed) break;
      }
      if (!placed) unmatched.push(kw);
    }

    if (unmatched.length > 0) {
      skills.push({ category: "Stack adicional", items: unmatched.map((kw) => this._prettifyKeyword(kw)) });
    }

    return { ...optimizedCV, skills };
  }

  _prettifyKeyword(kw) {
    const MAP = {
      javascript: "JavaScript", typescript: "TypeScript", nodejs: "Node.js",
      reactjs: "ReactJS", vuejs: "VueJS", angularjs: "AngularJS",
      postgresql: "PostgreSQL", mongodb: "MongoDB", kubernetes: "Kubernetes",
      github: "GitHub", gitlab: "GitLab", graphql: "GraphQL",
      html: "HTML", css: "CSS", sql: "SQL", aws: "AWS", gcp: "GCP",
      php: "PHP", api: "API", rest: "REST", cicd: "CI/CD",
    };
    const norm = kw.toLowerCase().replace(/[.\-_]/g, "");
    if (MAP[norm]) return MAP[norm];
    return kw.length <= 4 ? kw.toUpperCase() : kw.charAt(0).toUpperCase() + kw.slice(1);
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
