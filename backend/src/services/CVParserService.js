import { createRequire } from "module";
import { ollamaService } from "./OllamaService.js";

const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse");
const mammoth = _require("mammoth");

export class CVParserService {
  async extractText(buffer, mimeType) {
    if (mimeType === "application/pdf") {
      return this._extractFromPDF(buffer);
    }
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      return this._extractFromDOCX(buffer);
    }
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

    try {
      return await ollamaService.generateJSON(prompt);
    } catch {
      return { personalInfo: {}, summary: "", experience: [], skills: [], education: [], languages: [], certifications: [] };
    }
  }
}

export const cvParserService = new CVParserService();
