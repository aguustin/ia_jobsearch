import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";
import { config } from "../config/index.js";

const CATEGORIES = ["programming", "data-science-analytics", "machine-learning-ai", "sysadmin-devops-qa", "mobile-developer"];

export class GetOnBrdProvider extends BaseProvider {
  get name() { return "getonbrd"; }
  get displayName() { return "GetOnBrd"; }

  async fetchJobs(options = {}) {
    const { limit = 40 } = options;
    const allJobs = [];

    for (const cat of CATEGORIES) {
      try {
        const { data } = await axios.get(
          `${config.getonbrd.apiUrl}/categories/${cat}/jobs`,
          {
            params: { per_page: 20, page: 1, "expand[]": "company" },
            timeout: 15000,
            headers: { "Content-Type": "application/json" },
          }
        );

        const items = data?.data || data || [];
        const jobs = items.map((j) => this.normalizeJob(j)).filter(Boolean);
        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`[GetOnBrd] Failed to fetch ${cat}: ${err.message}`);
      }
    }

    return allJobs.slice(0, limit);
  }

  normalizeJob(raw) {
    const attrs = raw.attributes || raw;
    const id = raw.id || attrs.id;
    if (!id) return null;

    return {
      externalId: String(id),
      source: this.name,
      title: attrs.title || "Unknown",
      company: attrs.company?.data?.attributes?.name || attrs.company_name || "Unknown",
      location: attrs.remote_modality ? "Remote" : (attrs.country || "Unknown"),
      remote: attrs.remote_modality === "fully_remote" || attrs.remote === true,
      description: this._stripHtml(attrs.description || attrs.functions || ""),
      url: attrs.url || `https://www.getonbrd.com/jobs/${id}`,
      salary: {
        min: attrs.min_salary,
        max: attrs.max_salary,
        currency: attrs.currency || "USD",
        raw: attrs.salary_description,
      },
      tags: attrs.tags?.map((t) => t.name || t) || [],
      postedAt: attrs.published_at ? new Date(attrs.published_at) : new Date(),
    };
  }

  _stripHtml(html) {
    return (html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .trim();
  }
}
