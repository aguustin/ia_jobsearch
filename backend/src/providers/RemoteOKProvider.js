import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";

export class RemoteOKProvider extends BaseProvider {
  get name() { return "remoteok"; }
  get displayName() { return "RemoteOK"; }
  get supportsSearch() { return true; }

  async fetchJobs(options = {}) {
    const { limit = 50 } = options;

    const { data } = await axios.get("https://remoteok.com/api", {
      headers: { "User-Agent": "ia-job-search/1.0 (personal use)" },
      timeout: 15000,
    });

    // First element is a legal notice object, skip it
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs
      .slice(0, limit)
      .map((j) => this.normalizeJob(j))
      .filter(Boolean);
  }

  normalizeJob(raw) {
    if (!raw.id || !raw.url) return null;

    return {
      externalId: String(raw.id),
      source: this.name,
      title: raw.position || raw.title || "Unknown",
      company: raw.company || "Unknown",
      location: raw.location || "Remote",
      remote: true,
      description: this._stripHtml(raw.description || ""),
      url: raw.url,
      salary: this._parseSalary(raw.salary),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      postedAt: raw.date ? new Date(raw.date * 1000) : new Date(),
    };
  }

  _parseSalary(salaryStr) {
    if (!salaryStr) return {};
    const nums = String(salaryStr).match(/\d+/g)?.map(Number) || [];
    return {
      min: nums[0],
      max: nums[1] || nums[0],
      currency: "USD",
      raw: salaryStr,
    };
  }

  _stripHtml(html) {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .trim();
  }
}
