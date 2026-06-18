const express = require('express');
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const Appeal = require('../../models/Appeal');
const Image = require('../../models/Image');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

// ── GET /api/admin/appeals ────────────────────────────────────────────────────
// Paginated appeal queue.
// Query: ?status=pending|accepted|rejected  (default: pending)
//        &page=  &limit=

router.get('/', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const [appeals, total] = await Promise.all([
      Appeal.find(filter)
        .sort({ createdAt: 1 }) // oldest first — work through the queue in order
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'email createdAt')
        .populate('imageId', 'originalFilename outcome storageUrl categoryResults verdictAt')
        .lean(),
      Appeal.countDocuments(filter),
    ]);

    return res.json({
      appeals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[Admin/Appeals] GET queue error:', err);
    return res.status(500).json({ message: 'Failed to fetch appeals queue' });
  }
});

// ── GET /api/admin/appeals/:id ────────────────────────────────────────────────
// Full appeal detail for admin review.

router.get('/:id', async (req, res) => {
  try {
    const appeal = await Appeal.findById(req.params.id)
      .populate('userId', 'email createdAt')
      .populate('adminId', 'email')
      .populate({
        path: 'imageId',
        populate: { path: 'policySnapshotId', select: 'snapshot createdAt' },
      })
      .lean();

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    return res.json({ appeal });
  } catch (err) {
    console.error('[Admin/Appeals] GET detail error:', err);
    return res.status(500).json({ message: 'Failed to fetch appeal' });
  }
});

// ── PATCH /api/admin/appeals/:id ──────────────────────────────────────────────
// Resolve an appeal: accept or reject.
// Body: { decision: 'accepted' | 'rejected', adminResponse?: string }
//
// On acceptance → image outcome is overridden to 'approved' and
//                 image.appealStatus synced to 'accepted'.
// On rejection  → verdict stands, image.appealStatus synced to 'rejected'.

router.patch('/:id', async (req, res) => {
  try {
    const { decision, adminResponse } = req.body;

    if (!decision || !['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'accepted' or 'rejected'" });
    }

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    if (appeal.status !== 'pending') {
      return res.status(409).json({
        message: `Appeal is already ${appeal.status} and cannot be resolved again`,
      });
    }

    // Update the appeal document
    appeal.status = decision;
    appeal.adminId = req.user._id;
    appeal.adminResponse = adminResponse || null;
    appeal.resolvedAt = new Date();
    await appeal.save();

    // Sync appeal status back onto the Image document
    const imageUpdate = { appealStatus: decision };

    if (decision === 'accepted') {
      // Override the verdict to approved
      imageUpdate.outcome = 'approved';
      imageUpdate.overriddenBy = req.user._id;
      imageUpdate.overriddenAt = new Date();
      imageUpdate.overrideNote = `Appeal accepted by admin. ${adminResponse || ''}`.trim();
    }

    await Image.findByIdAndUpdate(appeal.imageId, imageUpdate);

    return res.json({ appeal });
  } catch (err) {
    console.error('[Admin/Appeals] PATCH error:', err);
    return res.status(500).json({ message: 'Failed to resolve appeal' });
  }
});

module.exports = router;
