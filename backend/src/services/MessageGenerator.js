import { ollamaService } from "./OllamaService.js";

export class MessageGenerator {
  async generate(job, profile, options = {}) {
    const { tone = "professional", language = "spanish", maxLength = 300 } = options;

    // Sequential — Ollama handles one request at a time
    const message = await this._generateMessage(job, profile, { tone, language, maxLength });
    const cvAdaptations = await this._generateCVAdaptations(job, profile);

    return { message, cvAdaptations };
  }

  async _generateMessage(job, profile, { tone, language, maxLength }) {
    const skills = (profile.skills || []).slice(0, 6).map((s) => s.name).join(", ");
    const recentExp = (profile.experience || []).slice(0, 1).map((e) => `${e.role} en ${e.company}`).join(", ");
    const matchPoints = (job.analysis?.matchReasons || []).slice(0, 2).join("; ");

    const prompt = `Write a ${tone} job application message in ${language} for ${profile.name}.

Position: ${job.title} at ${job.company}
Candidate skills: ${skills}
Experience: ${recentExp}
${matchPoints ? `Key match: ${matchPoints}` : ""}
${profile.linkedinUrl ? `LinkedIn: ${profile.linkedinUrl}` : ""}
${profile.portfolioUrl ? `Portfolio: ${profile.portfolioUrl}` : ""}

Requirements:
- Maximum ${maxLength} words
- Mention 2 specific matching skills
- Name the company
- End with a clear call to action
- Natural tone, not generic
- Do NOT say "I am writing to express my interest"

Write ONLY the message body. No subject, no JSON, no explanation.`;

    return ollamaService.generate(prompt, { temperature: 0.65, maxTokens: 800 });
  }

  async _generateCVAdaptations(job, profile) {
    const skills = (profile.skills || []).slice(0, 8).map((s) => s.name).join(", ");

    const prompt = `Give 4 specific CV tailoring tips for this application.

Job: ${job.title} at ${job.company}
Required tech: ${job.tags.slice(0, 8).join(", ")}
Candidate skills: ${skills}

Return a numbered list (1. 2. 3. 4.) of concrete, actionable tips.
No JSON, no explanation, just the list.`;

    return ollamaService.generate(prompt, { temperature: 0.4, maxTokens: 400 });
  }
}

export const messageGenerator = new MessageGenerator();
