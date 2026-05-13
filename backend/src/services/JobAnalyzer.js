import { ollamaService } from "./OllamaService.js";

export class JobAnalyzer {
  /**
   * Analyze a job against a profile and return a scored analysis.
   * @param {Object} job - Job document
   * @param {Object} profile - Profile document
   * @returns {Promise<Object>} analysis result
   */
  async analyze(job, profile) {
    const prompt = this._buildAnalysisPrompt(job, profile);
    const result = await ollamaService.generateJSON(prompt);
    return this._normalizeResult(result);
  }

  _buildAnalysisPrompt(job, profile) {
    const profileSummary = this._buildProfileSummary(profile);

    return `Eres un recruiter profesional y career coach. Responde SIEMPRE en español.

PERFIL DEL CANDIDATO:
${profileSummary}

OFERTA LABORAL:
Título: ${job.title}
Empresa: ${job.company}
Ubicación: ${job.location} | Remoto: ${job.remote}
Tecnologías: ${job.tags.join(", ")}
Salario: ${job.salary?.raw || job.salary?.min ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}` : "No especificado"}

Descripción:
${job.description.slice(0, 1500)}

TAREA: Analiza qué tan bien esta oferta encaja con el perfil del candidato.

Devuelve un objeto JSON con esta estructura exacta (todos los textos en español):
{
  "score": <entero 0-100, donde 100 es match perfecto>,
  "matchReasons": [<array de strings: por qué esta oferta encaja con el perfil, máx 5>],
  "missingSkills": [<array de strings: skills requeridas que el candidato no tiene, máx 5>],
  "highlights": [<array de strings: mejores aspectos de la oferta, máx 4>],
  "concerns": [<array de strings: red flags o posibles problemas, máx 4>],
  "summary": "<evaluación general en 2-3 oraciones>",
  "seniority": "<junior|mid|senior|lead|unknown>",
  "estimatedSalary": "<rango salarial estimado como string, o null>"
}

Guía de score: 80-100 = match fuerte, 60-79 = buen match, 40-59 = match parcial, 0-39 = match débil.`;
  }

  _buildProfileSummary(profile) {
    const skills = (profile.skills || [])
      .map((s) => `${s.name} (${s.level}, ${s.years || "?"}yr)`)
      .join(", ");

    const experience = (profile.experience || [])
      .slice(0, 3)
      .map((e) => `${e.role} at ${e.company} (${e.startDate || ""}-${e.endDate || "present"})`)
      .join("; ");

    const prefs = profile.preferences || {};

    return `Name: ${profile.name}
Title: ${profile.title || "Developer"}
Summary: ${profile.summary || ""}
Skills: ${skills || "Not specified"}
Experience: ${experience || "Not specified"}
Looking for: ${(prefs.roles || []).join(", ") || "Developer roles"}
Preferred tech: ${(prefs.technologies || []).join(", ") || "Any"}
Remote only: ${prefs.remoteOnly ? "Yes" : "No"}
Min salary: ${prefs.salaryMin ? `${prefs.salaryMin} ${prefs.currency || "USD"}` : "Flexible"}
${profile.cvText ? `\nCV Summary:\n${profile.cvText.slice(0, 800)}` : ""}`;
  }

  _normalizeResult(raw) {
    return {
      score: Math.min(100, Math.max(0, parseInt(raw.score) || 0)),
      matchReasons: Array.isArray(raw.matchReasons) ? raw.matchReasons.slice(0, 5) : [],
      missingSkills: Array.isArray(raw.missingSkills) ? raw.missingSkills.slice(0, 5) : [],
      highlights: Array.isArray(raw.highlights) ? raw.highlights.slice(0, 4) : [],
      concerns: Array.isArray(raw.concerns) ? raw.concerns.slice(0, 4) : [],
      summary: raw.summary || "",
      seniority: raw.seniority || "unknown",
      estimatedSalary: raw.estimatedSalary || null,
      analyzedAt: new Date(),
    };
  }
}

export const jobAnalyzer = new JobAnalyzer();
