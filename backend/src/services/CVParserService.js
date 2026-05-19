import { createRequire } from "module";
import { ollamaService } from "./OllamaService.js";

const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse");
const mammoth = _require("mammoth");

export class CVParserService {
  async extractText(buffer, mimeType) {
    if (mimeType === "application/pdf") return this._extractFromPDF(buffer);
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) return this._extractFromDOCX(buffer);
    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }

  async _extractFromPDF(buffer) {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  async _extractFromDOCX(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  async parseToStructured(rawText) {
    const prompt = `Eres un parser de CVs profesional. Extrae la información del siguiente CV y devuelve un JSON estructurado.

CV:
${rawText.slice(0, 3000)}

Devuelve SOLO un JSON válido con esta estructura exacta (usa strings vacíos o arrays vacíos si no existe el dato, NO inventes información):
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "",
  "experience": [
    {
      "role": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "achievements": []
    }
  ],
  "skills": [
    { "category": "", "items": [] }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "languages": [
    { "name": "", "level": "" }
  ],
  "certifications": [
    { "name": "", "issuer": "", "date": "" }
  ]
}`;

    let ollamaResult = null;
    try {
      ollamaResult = await ollamaService.generateJSON(prompt);
    } catch {
      // Ollama failed — regex parser will cover everything
    }

    const regexResult = this._regexParse(rawText);
    return this._mergeResults(ollamaResult, regexResult);
  }

  // ─── Merge: prefer Ollama when it has data, fill gaps with regex ─────────────

  _mergeResults(ollama, regex) {
    if (!ollama) return regex;
    const hasItems = (arr) => Array.isArray(arr) && arr.length > 0 &&
      arr.some((item) => Object.values(item).some((v) => v && v !== "" && !(Array.isArray(v) && v.length === 0)));

    return {
      personalInfo: this._mergePersonalInfo(ollama.personalInfo, regex.personalInfo),
      summary: ollama.summary?.trim() || regex.summary || "",
      experience: hasItems(ollama.experience) ? ollama.experience : regex.experience,
      skills: hasItems(ollama.skills) ? ollama.skills : regex.skills,
      education: hasItems(ollama.education) ? ollama.education : regex.education,
      languages: hasItems(ollama.languages) ? ollama.languages : regex.languages,
      certifications: ollama.certifications || [],
    };
  }

  _mergePersonalInfo(ollama = {}, regex = {}) {
    const pick = (a, b) => a?.trim() || b?.trim() || "";
    return {
      name:     pick(ollama.name,     regex.name),
      email:    pick(ollama.email,    regex.email),
      phone:    pick(ollama.phone,    regex.phone),
      location: pick(ollama.location, regex.location),
      linkedin: pick(ollama.linkedin, regex.linkedin),
      github:   pick(ollama.github,   regex.github),
      website:  pick(ollama.website,  regex.website),
    };
  }

  // ─── Regex-based CV parser ───────────────────────────────────────────────────

  _regexParse(rawText) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    return {
      personalInfo: this._extractPersonalInfo(rawText, lines),
      summary:      this._extractSectionText(lines, /^(?:resumen\s*(?:profesional)?|summary|perfil|sobre\s+m[ií])/i),
      experience:   this._extractExperience(lines),
      skills:       this._extractSkills(lines),
      education:    this._extractEducation(lines),
      languages:    this._extractLanguages(lines),
      certifications: [],
    };
  }

  _extractPersonalInfo(rawText, lines) {
    const emailM  = rawText.match(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i);
    const phoneM  = rawText.match(/(?:\+?[\d][\d\s\-()\+.]{5,15}\d)/);
    const liM     = rawText.match(/linkedin\.com\/in\/([\w-]+)/i);
    const ghM     = rawText.match(/github\.com\/([\w-]+)/i);
    const webM    = rawText.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[a-z]{2,}[\w./%-]*/i);

    // Name: first line matching "Firstname Lastname" pattern (2–4 words, starts with capital)
    let name = "";
    for (const line of lines.slice(0, 6)) {
      if (/^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ']+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ']+){1,3}$/.test(line)) {
        name = line;
        break;
      }
    }

    return {
      name,
      email:    emailM  ? emailM[0]                          : "",
      phone:    phoneM  ? phoneM[0].trim()                   : "",
      location: "",
      linkedin: liM     ? `linkedin.com/in/${liM[1]}`        : "",
      github:   ghM     ? `github.com/${ghM[1]}`             : "",
      website:  webM    ? webM[0]                            : "",
    };
  }

  // Returns lines between a section header and the next one
  _getSectionLines(lines, headerPattern) {
    const KNOWN_HEADERS = [
      /^(?:resumen|summary|perfil)/i,
      /^(?:experiencia|experience|historial|trayectoria)/i,
      /^(?:habilidades|skills?|tecnolog|stack|competencias)/i,
      /^(?:educaci[oó]n|education|formaci[oó]n|estudios)/i,
      /^(?:idiomas?|languages?)/i,
      /^(?:certificaciones?|certifications?|cursos?)/i,
    ];

    const start = lines.findIndex((l) => headerPattern.test(l));
    if (start === -1) return [];

    const end = lines.findIndex((l, i) =>
      i > start && KNOWN_HEADERS.some((p) => p.test(l) && !headerPattern.test(l))
    );
    return lines.slice(start + 1, end === -1 ? undefined : end);
  }

  _extractSectionText(lines, headerPattern) {
    return this._getSectionLines(lines, headerPattern).join(" ").trim();
  }

  _extractSkills(lines) {
    // Prefer extracting only from the skills section to avoid picking up
    // "Stack: ..." lines that appear inside experience bullet points
    const sectionLines = this._getSectionLines(lines, /^(?:habilidades|skills?|tecnolog|stack\s+t[eé]cnico|competencias)/i);
    const sourceLines = sectionLines.length >= 2 ? sectionLines : lines;

    const skillMap = new Map();
    for (const line of sourceLines) {
      // Skip bullet-prefixed lines (experience achievements)
      if (/^[•\-\*▪►]\s*/.test(line)) continue;
      const m = line.match(/^([^:\n]{2,40}):\s*(.{4,})$/);
      if (!m) continue;
      const items = m[2]
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 60 && !/^\d+$/.test(s));
      if (items.length < 2) continue;
      const key = m[1].trim().toLowerCase();
      if (skillMap.has(key)) {
        // Merge duplicate categories (e.g. multiple "Stack:" lines)
        const existing = skillMap.get(key);
        existing.items = [...new Set([...existing.items, ...items])];
      } else {
        skillMap.set(key, { category: m[1].trim(), items });
      }
    }
    return [...skillMap.values()];
  }

  _extractExperience(lines) {
    const expLines = this._getSectionLines(lines, /^(?:experiencia|experience|historial|trayectoria)/i);
    if (!expLines.length) return [];

    const experience = [];
    const DATE_RE = /(\d{4})\s*[-–]\s*(\d{4}|[Pp]resente|[Aa]ctual|[Hh]oy)/;
    const BULLET_RE = /^[•\-\*▪►]\s+/;

    let current = null;

    const push = () => {
      if (current && (current.role || current.achievements.length)) experience.push(current);
    };

    for (const line of expLines) {
      const dateM = line.match(DATE_RE);

      if (dateM) {
        // Date line — attach to current entry or start one
        if (!current) current = { role: "", company: "", startDate: "", endDate: "", achievements: [] };
        current.startDate = dateM[1];
        current.endDate = /presente|actual|hoy/i.test(dateM[2]) ? "" : dateM[2];
        continue;
      }

      if (BULLET_RE.test(line)) {
        if (!current) { current = { role: "", company: "", startDate: "", endDate: "", achievements: [] }; }
        current.achievements.push(line.replace(BULLET_RE, "").trim());
        continue;
      }

      // Non-bullet, non-date line — treat as role or company
      // Heuristic: if it starts with a capital and is short → likely a title/company
      if (line.length > 2 && line.length < 100 && /^[A-ZÁÉÍÓÚ]/.test(line)) {
        // Looks like a new entry header
        if (current?.role && current?.company) {
          push();
          current = { role: "", company: "", startDate: "", endDate: "", achievements: [] };
        }
        if (!current) current = { role: "", company: "", startDate: "", endDate: "", achievements: [] };

        if (!current.role) current.role = line;
        else if (!current.company) current.company = line;
      }
    }

    push();
    return experience;
  }

  _extractEducation(lines) {
    const eduLines = this._getSectionLines(lines, /^(?:educaci[oó]n|education|formaci[oó]n|estudios)/i);
    if (!eduLines.length) return [];

    const education = [];
    const DEGREE_RE = /(?:licenciatura|ingenier[íi]a|t[eé]cnico|analista|bachelor|master|maestr[íi]a|doctorado|phd|diplomatura|tecnicatura|profesorado|abogac[íi]a|contabilidad)/i;
    const DATE_RE   = /(\d{4})\s*[-–]\s*(\d{4}|[Pp]resente|[Aa]ctual)?/;

    let current = null;

    for (const line of eduLines) {
      const dateM = line.match(DATE_RE);

      if (DEGREE_RE.test(line)) {
        if (current) education.push(current);
        current = { degree: line, institution: "", startDate: "", endDate: "" };
      } else if (current) {
        if (dateM) {
          current.startDate = dateM[1];
          current.endDate   = dateM[2] || "";
        } else if (!current.institution && line.length > 2) {
          current.institution = line;
        }
      }
    }
    if (current) education.push(current);
    return education;
  }

  _extractLanguages(lines) {
    const langLines = this._getSectionLines(lines, /^(?:idiomas?|languages?)/i);
    if (!langLines.length) return [];

    const languages = [];
    for (const line of langLines) {
      // "Inglés: Avanzado", "English - B2", "Español | Nativo"
      const m = line.match(/^([\wÁÉÍÓÚáéíóúüñÑ]+)\s*[:|\-–]\s*(.+)$/);
      if (m) {
        languages.push({ name: m[1].trim(), level: m[2].trim() });
      } else if (/(?:nativo|native|fluente|fluent|avanzado|advanced|intermedio|intermediate|b[12]|c[12]|a[12])/i.test(line)) {
        const parts = line.split(/[\s|\-–:]+/);
        if (parts.length >= 2) languages.push({ name: parts[0], level: parts.slice(1).join(" ") });
      }
    }
    return languages;
  }
}

export const cvParserService = new CVParserService();
