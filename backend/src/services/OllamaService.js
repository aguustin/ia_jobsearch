import axios from "axios";
import { config } from "../config/index.js";

class OllamaService {
  constructor() {
    this.client = axios.create({
      baseURL: config.ollama.baseUrl,
      timeout: 180000,
    });
  }

  async generate(prompt, options = {}) {
    const { data } = await this.client.post("/api/generate", {
      model: options.model || config.ollama.model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens ?? 4096,
        num_ctx: 4096,
      },
    });
    return data.response;
  }

  async generateJSON(prompt, options = {}) {
    const { data } = await this.client.post("/api/generate", {
      model: options.model || config.ollama.model,
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.1,
        num_predict: options.maxTokens ?? 2048,
        num_ctx: options.numCtx ?? 4096,
      },
    });
    return this._parseJSON(data.response);
  }

  async isAvailable() {
    try {
      await this.client.get("/api/tags", { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async listModels() {
    const { data } = await this.client.get("/api/tags");
    return data.models || [];
  }

  _parseJSON(raw) {
    const text = raw.trim();

    // Try direct parse first
    try { return JSON.parse(text); } catch {}

    // Strip markdown code blocks
    const stripped = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    try { return JSON.parse(stripped); } catch {}

    // Extract first JSON object or array
    const match = stripped.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }

    throw new Error(`Could not parse AI response as JSON: ${text.slice(0, 200)}`);
  }
}

export const ollamaService = new OllamaService();
