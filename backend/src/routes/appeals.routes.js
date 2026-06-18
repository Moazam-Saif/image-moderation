const express = require('express');
const auth = require('../middleware/auth');
const Appeal = require('../models/Appeal');
const Image = require('../models/Image');

const router = express.Router();

router.use(auth);

// ── POST /api/appeals ─────────────────────────────────────────────────────────
// File an appeal against a flagged or blocked image.
// Rules:
//   - Image must belong to the current user
//   - Image outcome must be 'flagged' or 'blocked'
//   - No existing appeal on this image (unique index on imageId)
//   - Justification required (min 20 chars — enforced by model)

router.post('/', async (req, res) => {
  try {
    const { imageId, justification } = req.body;

    if (!imageId || !justification) {
      return res.status(400).json({ message: 'imageId and justification are required' });
    }

    // Verify image exists and belongs to this user
    const image = await Image.findOne({ _id: imageId, userId: req.user._id });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Only flagged or blocked images can be appealed
    if (!['flagged', 'blocked'].includes(image.outcome)) {
      return res.status(400).json({
        message: `Cannot appeal an image with outcome '${image.outcome}'. Only flagged or blocked images are eligible.`,
      });
    }

    // Block duplicate appeals (also enforced by unique index on Appeal.imageId)
    if (image.appealId) {
      return res.status(409).json({
        message: 'An appeal has already been filed for this image',
      });
    }

    // Create the appeal
    const appeal = await Appeal.create({
      imageId: image._id,
      submissionId: image.submissionId,
      userId: req.user._id,
      justification,
      status: 'pending',
    });

    // Denormalize appeal state onto the image for fast list queries
    await Image.findByIdAndUpdate(image._id, {
      appealId: appeal._id,
      appealStatus: 'pending',
    });

    return res.status(201).json({ appeal });
  } catch (err) {
    // Duplicate key = second appeal attempt that slipped past the check
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An appeal already exists for this image' });
    }
    console.error('[Appeals] POST error:', err);
    return res.status(500).json({ message: 'Failed to file appeal' });
  }
});

// ── GET /api/appeals/my ───────────────────────────────────────────────────────
// All appeals filed by the current user, newest first.
// NOTE: This route must be defined BEFORE /:id to avoid 'my' being treated as an id.

router.get('/my', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const [appeals, total] = await Promise.all([
      Appeal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('imageId', 'originalFilename outcome storageUrl categoryResults')
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
    console.error('[Appeals] GET my error:', err);
    return res.status(500).json({ message: 'Failed to fetch appeals' });
  }
});

// ── GET /api/appeals/:id ──────────────────────────────────────────────────────
// Single appeal detail — user can only view their own.

router.get('/:id', async (req, res) => {
  try {
    const appeal = await Appeal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('imageId', 'originalFilename outcome storageUrl categoryResults verdictAt')
      .populate('adminId', 'email')
      .lean();

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    return res.json({ appeal });
  } catch (err) {
    console.error('[Appeals] GET detail error:', err);
    return res.status(500).json({ message: 'Failed to fetch appeal' });
  }
});

module.exports = router;
