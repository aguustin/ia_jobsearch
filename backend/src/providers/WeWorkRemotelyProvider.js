import Parser from "rss-parser";
import { BaseProvider } from "./BaseProvider.js";

const FEEDS = [
  { url: "https://weworkremotely.com/categories/remote-programming-jobs.rss", category: "programming" },
  { url: "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss", category: "fullstack" },
  { url: "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss", category: "frontend" },
  { url: "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss", category: "backend" },
];

export class WeWorkRemotelyProvider extends BaseProvider {
  constructor() {
    super();
    this.parser = new Parser({ timeout: 15000 });
  }

  get name() { return "weworkremotely"; }
  get displayName() { return "WeWorkRemotely"; }

  async fetchJobs(options = {}) {
    const { limit = 30 } = options;
    const allJobs = [];

    for (const feed of FEEDS) {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        const jobs = (parsed.items || [])
          .map((item) => this.normalizeJob(item, feed.category))
          .filter(Boolean);
        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`[WWR] Failed to fetch ${feed.category}: ${err.message}`);
      }
    }

    const unique = this._dedup(allJobs);
    return unique.slice(0, limit);
  }

  normalizeJob(item, category) {
    if (!item.link) return null;

    const title = item.title || "";
    const company = item["dc:creator"] || this._extractCompany(title) || "Unknown";
    const cleanTitle = title.replace(/^[^:]+:\s*/, "").trim();

    return {
      externalId: item.guid || item.link,
      source: this.name,
      title: cleanTitle || title,
      company,
      location: "Remote",
      remote: true,
      description: this._stripHtml(item.content || item.contentSnippet || ""),
      url: item.link,
      salary: {},
      tags: [category],
      postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    };
  }

  _extractCompany(title) {
    const match = title.match(/^(.+?):/);
    return match ? match[1].trim() : null;
  }

  _dedup(jobs) {
    const seen = new Set();
    return jobs.filter((j) => {
      if (seen.has(j.externalId)) return false;
      seen.add(j.externalId);
      return true;
    });
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
