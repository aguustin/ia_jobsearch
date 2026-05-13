import { ollamaService } from "./OllamaService.js";

export class InterviewPrepGenerator {
  async generate(job, profile) {
    const skills = (profile.skills || []).slice(0, 8).map((s) => s.name).join(", ");
    const tags = (job.tags || []).slice(0, 8).join(", ");
    const missing = (job.analysis?.missingSkills || []).join(", ");

    const prompt = `Eres un entrevistador técnico senior. Generá preguntas de entrevista específicas para esta postulación. Responde SIEMPRE en español.

PUESTO: ${job.title} en ${job.company}
TECNOLOGÍAS: ${tags}
DESCRIPCIÓN (extracto): ${(job.description || "").slice(0, 800)}
SKILLS DEL CANDIDATO: ${skills}
${missing ? `GAPS DEL CANDIDATO: ${missing}` : ""}

Devuelve un objeto JSON con esta estructura exacta:
{
  "questions": [
    {
      "category": "technical",
      "question": "texto de la pregunta aquí",
      "hint": "puntos clave a cubrir en la respuesta"
    }
  ]
}

Incluye exactamente:
- 4 preguntas técnicas (específicas al stack y los gaps del candidato)
- 3 preguntas de comportamiento (formato STAR, relevantes para el nivel de seniority)
- 2 preguntas para hacerle al entrevistador sobre el puesto o la empresa

Total: 9 preguntas. Que sean específicas para este puesto, no genéricas.`;

    const result = await ollamaService.generateJSON(prompt);
    return this._normalize(result);
  }

  _normalize(raw) {
    const questions = Array.isArray(raw?.questions) ? raw.questions : [];
    return questions
      .filter((q) => q.question && q.category)
      .map((q) => ({
        category: ["technical", "behavioral", "company"].includes(q.category)
          ? q.category
          : "technical",
        question: String(q.question).trim(),
        hint: String(q.hint || "").trim(),
        practiced: false,
      }));
  }
}

export const interviewPrepGenerator = new InterviewPrepGenerator();
