import { Router } from "express";
import { Profile } from "../../models/Profile.js";

const router = Router();

// GET /api/profile
router.get("/", async (req, res) => {
  try {
    const profile = await Profile.findOne().sort({ updatedAt: -1 });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile - upsert
router.put("/", async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      {},
      req.body,
      { upsert: true, new: true, runValidators: true, sort: { updatedAt: -1 } }
    );
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/profile - partial update
router.patch("/", async (req, res) => {
  try {
    let profile = await Profile.findOne().sort({ updatedAt: -1 });
    if (!profile) {
      profile = await Profile.create(req.body);
    } else {
      Object.assign(profile, req.body);
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
