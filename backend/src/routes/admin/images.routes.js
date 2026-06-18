const express = require('express');
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const Image = require('../../models/Image');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

// ── PATCH /api/admin/images/:id/verdict ───────────────────────────────────────
// Direct manual verdict override — bypasses appeal workflow entirely.
// Used when an admin spots an error without a user filing an appeal.
// Body: { outcome: 'approved' | 'blocked', note?: string }

router.patch('/:id/verdict', async (req, res) => {
  try {
    const { outcome, note } = req.body;

    if (!outcome || !['approved', 'blocked'].includes(outcome)) {
      return res.status(400).json({ message: "outcome must be 'approved' or 'blocked'" });
    }

    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    image.outcome = outcome;
    image.overriddenBy = req.user._id;
    image.overriddenAt = new Date();
    image.overrideNote = note || null;
    await image.save();

    await image.populate('overriddenBy', 'email');

    return res.json({ image });
  } catch (err) {
    console.error('[Admin/Images] Verdict override error:', err);
    return res.status(500).json({ message: 'Failed to override verdict' });
  }
});

// ── GET /api/admin/images ─────────────────────────────────────────────────────
// Admin-level image list — all users, all outcomes, full filters.
// Query: ?outcome=  &category=  &userId=  &from=  &to=  &page=  &limit=

router.get('/', async (req, res) => {
  try {
    const { outcome, category, userId, from, to, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (outcome && ['approved', 'flagged', 'blocked', 'pending'].includes(outcome)) {
      filter.outcome = outcome;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (category) {
      filter['categoryResults'] = { $elemMatch: { category, result: 'violation' } };
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [images, total] = await Promise.all([
      Image.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'email')
        .populate('submissionId', 'createdAt')
        .lean(),
      Image.countDocuments(filter),
    ]);

    return res.json({
      images,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[Admin/Images] GET list error:', err);
    return res.status(500).json({ message: 'Failed to fetch images' });
  }
});

module.exports = router;
