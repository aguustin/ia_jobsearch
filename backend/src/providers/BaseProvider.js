export class BaseProvider {
  get name() {
    throw new Error("Provider must implement 'name' getter");
  }

  get displayName() {
    return this.name;
  }

  get supportsSearch() {
    return false;
  }

  /**
   * Fetch raw jobs from the source.
   * @param {Object} options - { keywords, location, limit }
   * @returns {Promise<NormalizedJob[]>}
   */
  async fetchJobs(options = {}) {
    throw new Error("Provider must implement fetchJobs()");
  }

  /**
   * Convert a raw source-specific job object to the standard format.
   * @param {Object} raw
   * @returns {NormalizedJob}
   */
  normalizeJob(raw) {
    throw new Error("Provider must implement normalizeJob()");
  }

  /**
   * @typedef {Object} NormalizedJob
   * @property {string} externalId
   * @property {string} source
   * @property {string} title
   * @property {string} company
   * @property {string} location
   * @property {boolean} remote
   * @property {string} description
   * @property {string} url
   * @property {{ min?: number, max?: number, currency?: string, raw?: string }} salary
   * @property {string[]} tags
   * @property {Date} postedAt
   */
}
