import { Router } from "express";
import { Job } from "../../models/Job.js";
import { Profile } from "../../models/Profile.js";

const router = Router();

// GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const [profile, tagsAgg, scoreAgg, weeklyAgg, sourceAgg, companyAgg, totals] =
      await Promise.all([
        Profile.findOne().select("skills").lean(),

        // Top technologies from job tags
        Job.aggregate([
          { $unwind: "$tags" },
          { $group: { _id: { $toLower: "$tags" }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),

        // Score distribution in 5 buckets
        Job.aggregate([
          { $match: { "analysis.score": { $exists: true, $ne: null } } },
          {
            $bucket: {
              groupBy: "$analysis.score",
              boundaries: [0, 21, 41, 61, 81, 101],
              default: "other",
              output: { count: { $sum: 1 } },
            },
          },
        ]),

        // Weekly job fetch trend (last 10 weeks)
        Job.aggregate([
          {
            $group: {
              _id: { $dateTrunc: { date: "$fetchedAt", unit: "week" } },
              total: { $sum: 1 },
              analyzed: {
                $sum: { $cond: [{ $ifNull: ["$analysis.score", false] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 10 },
        ]),

        // Jobs and avg score by source
        Job.aggregate([
          {
            $group: {
              _id: "$source",
              count: { $sum: 1 },
              avgScore: { $avg: "$analysis.score" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Top companies by avg score (min 1 job)
        Job.aggregate([
          { $match: { "analysis.score": { $exists: true }, company: { $ne: "Unknown" } } },
          {
            $group: {
              _id: "$company",
              count: { $sum: 1 },
              avgScore: { $avg: "$analysis.score" },
              maxScore: { $max: "$analysis.score" },
            },
          },
          { $sort: { avgScore: -1, count: -1 } },
          { $limit: 8 },
        ]),

        // Summary counts
        Job.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              analyzed: { $sum: { $cond: [{ $ifNull: ["$analysis.score", false] }, 1, 0] } },
              avgScore: { $avg: "$analysis.score" },
              shortlisted: { $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] } },
            },
          },
        ]),
      ]);

    // Cross-reference tags with profile skills
    const profileSkills = new Set(
      (profile?.skills || []).map((s) => s.name.toLowerCase().trim())
    );

    const topSkills = tagsAgg.map((t) => ({
      name: t._id,
      count: t.count,
      inProfile: profileSkills.has(t._id.toLowerCase()),
    }));

    const BUCKET_LABELS = { 0: "0-20", 21: "21-40", 41: "41-60", 61: "61-80", 81: "81-100" };
    const scoreDistribution = scoreAgg
      .filter((b) => b._id !== "other")
      .map((b) => ({ range: BUCKET_LABELS[b._id] ?? String(b._id), count: b.count }));

    const weeklyTrend = weeklyAgg
      .reverse()
      .map((w) => ({
        week: w._id
          ? new Date(w._id).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
          : "?",
        total: w.total,
        analyzed: w.analyzed,
      }));

    const summary = totals[0] ?? { total: 0, analyzed: 0, avgScore: 0, shortlisted: 0 };
    const gapCount = topSkills.filter((s) => !s.inProfile && s.count >= 3).length;

    res.json({
      topSkills: topSkills.slice(0, 15),
      skillsGap: topSkills.filter((s) => !s.inProfile).slice(0, 10),
      scoreDistribution,
      weeklyTrend,
      bySource: sourceAgg.map((s) => ({
        source: s._id,
        count: s.count,
        avgScore: Math.round(s.avgScore ?? 0),
      })),
      topCompanies: companyAgg.map((c) => ({
        company: c._id,
        count: c.count,
        avgScore: Math.round(c.avgScore ?? 0),
        maxScore: c.maxScore,
      })),
      summary: {
        total: summary.total,
        analyzed: summary.analyzed,
        avgScore: Math.round((summary.avgScore ?? 0) * 10) / 10,
        shortlisted: summary.shortlisted,
        gapCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
