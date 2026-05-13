import axios from "axios";
import { BaseProvider } from "./BaseProvider.js";

const BASE_URL = "https://ar.computrabajo.com";
const DELAY_MS = 400;
const DEFAULT_KEYWORDS = ["programador", "desarrollador", "developer"];

const NOISE_TAGS = new Set([
  "a convenir", "jornada completa", "tiempo completo", "media jornada",
  "otro tipo de contrato", "contrato por tiempo indeterminado", "nuevo", "vista", "postulado",
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(str) {
  return (str || "")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripHtml(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|h[1-6]|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/<[^>]*$/, "")   // dangling open tag at cut boundary
    .replace(/[ \t]+/g, " ")  // collapse horizontal whitespace
    .replace(/( *\n *){3,}/g, "\n\n")
    .trim();
}

function parsePostedAt(text) {
  const t = (text || "").toLowerCase();
  const num = parseInt(t.match(/\d+/)?.[0] || "1", 10);
  const now = Date.now();
  if (t.includes("hora")) return new Date(now - num * 3_600_000);
  if (t.includes("día") || t.includes("dia")) return new Date(now - num * 86_400_000);
  if (t.includes("semana")) return new Date(now - num * 7 * 86_400_000);
  if (t.includes("mes")) return new Date(now - num * 30 * 86_400_000);
  return new Date();
}

export class ComputrabajoProvider extends BaseProvider {
  get name() { return "computrabajo"; }
  get displayName() { return "Computrabajo"; }
  get supportsSearch() { return true; }

  constructor() {
    super();
    this._client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9",
      },
    });
  }

  async fetchJobs(options = {}) {
    const { limit = 50 } = options;
    const keywords = process.env.COMPUTRABAJO_KEYWORDS
      ? process.env.COMPUTRABAJO_KEYWORDS.split(",").map((k) => k.trim()).filter(Boolean)
      : DEFAULT_KEYWORDS;

    const seen = new Set();
    const listings = [];

    for (const keyword of keywords) {
      if (listings.length >= limit) break;
      const slug = keyword.toLowerCase().replace(/\s+/g, "-");

      for (let page = 1; page <= 2; page++) {
        if (listings.length >= limit) break;
        try {
          await sleep(DELAY_MS);
          const path = `/trabajo-de-${slug}${page > 1 ? `?p=${page}` : ""}`;
          const { data: html } = await this._client.get(path);
          const articles = this._parseListings(html);
          for (const art of articles) {
            if (!seen.has(art.id)) {
              seen.add(art.id);
              listings.push(art);
            }
          }
          if (articles.length < 20) break; // last page
        } catch (err) {
          console.warn(`[Computrabajo] Keyword "${keyword}" page ${page}: ${err.message}`);
          break;
        }
      }
    }

    const jobs = [];
    for (const listing of listings.slice(0, limit)) {
      try {
        await sleep(DELAY_MS);
        const detail = await this._fetchDetail(listing.url);
        jobs.push(this.normalizeJob({ ...listing, ...detail }));
      } catch {
        jobs.push(this.normalizeJob(listing));
      }
    }

    return jobs.filter(Boolean);
  }

  _parseListings(html) {
    const results = [];
    const re = /<article[^>]*data-id='([A-F0-9]+)'[\s\S]*?<\/article>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const body = m[0];
      const id = m[1];
      const titleM = body.match(/class="js-o-link[^"]*"[^>]*>([^<]+)/);
      const hrefM = body.match(/class="js-o-link[^"]*" href="([^"#]+)/);
      const companyM = body.match(/offer-grid-article-company-url[^>]*>([^<]+)/);
      const locM = body.match(/class="mr10">([^<]+)/);
      const postedM = body.match(/class="fs13 fc_aux[^"]*">([^<]+)/);
      if (!titleM || !hrefM) continue;
      results.push({
        id,
        title: decodeEntities(titleM[1].trim()),
        url: `${BASE_URL}${hrefM[1].trim()}`,
        company: decodeEntities((companyM?.[1] || "Unknown").trim()),
        location: decodeEntities((locM?.[1] || "Argentina").trim()),
        postedText: (postedM?.[1] || "").replace(/\s+/g, " ").trim(),
      });
    }
    return results;
  }

  async _fetchDetail(url) {
    const { data: html } = await this._client.get(url);

    // Extract the offer section — cut before action buttons / related offers
    let description = "";
    const offerStart = html.indexOf('div-link="oferta"');
    if (offerStart !== -1) {
      const section = html.slice(offerStart);
      // These markers appear right after the actual job content
      const endMarkers = [
        'shortcut-show',        // action buttons row
        'class="opt_dots"',
        'data-href-offer-apply',
        'Ofertas similares',
        'class="bRel"',
        '<footer',
      ];
      let end = section.length;
      for (const marker of endMarkers) {
        const idx = section.indexOf(marker);
        if (idx > 200 && idx < end) end = idx;
      }
      description = stripHtml(decodeEntities(section.slice(0, end)));
      // Remove the "Descripción de la oferta" heading from the text
      description = description.replace(/^[\s\S]*?Descripci[oó]n de la oferta\s*/i, "").trim();
    }

    // Two tag classes: "tag base mb10" (contract/location) and "tag bg_brand_light..." (skills)
    const tags = [];
    const tagRe = /class="tag (?:base mb10|bg_brand_light[^"]*)"[^>]*>([^<]{1,60})</g;
    let tagM;
    while ((tagM = tagRe.exec(html)) !== null) {
      const tag = decodeEntities(tagM[1].trim());
      if (tag && !NOISE_TAGS.has(tag.toLowerCase())) tags.push(tag);
    }

    const remote = tags.some((t) => /^remoto$/i.test(t)) || />\s*Remoto\s*</.test(html);
    const uniqueTags = [...new Set(tags)];

    return { description, tags: uniqueTags, remote };
  }

  normalizeJob(raw) {
    if (!raw?.id) return null;
    return {
      externalId: raw.id,
      source: this.name,
      title: raw.title || "Sin título",
      company: raw.company || "Unknown",
      location: raw.location || "Argentina",
      remote: raw.remote || false,
      description: raw.description || raw.title || "",
      url: raw.url,
      salary: {},
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      postedAt: parsePostedAt(raw.postedText),
    };
  }
}
