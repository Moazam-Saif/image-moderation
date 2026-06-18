const express = require('express');
const path = require('path');
const fs = require('fs');

const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { moderateImage } = require('../services/moderation.service');

const Policy = require('../models/Policy');
const PolicySnapshot = require('../models/PolicySnapshot');
const Submission = require('../models/Submission');
const Image = require('../models/Image');

const router = express.Router();

// All submission routes require authentication
router.use(auth);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Save uploaded buffer to local disk under /uploads (simple local storage).
// In production this would be replaced by Cloudinary / S3 upload.
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function saveFileToDisk(buffer, originalname, mimetype) {
  const ext = originalname.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  // Return a URL-style path the frontend can use to fetch the image
  return `/uploads/${filename}`;
}

// ── POST /api/submissions ─────────────────────────────────────────────────────
// Accept one or more images, screen each independently, save verdicts.
// Body: multipart/form-data, field name: "images"

router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // 1. Load all active policies and snapshot them atomically
    const policies = await Policy.find({}).lean();
    if (policies.length === 0) {
      return res.status(500).json({ message: 'No moderation policies configured' });
    }

    const snapshot = await PolicySnapshot.create({
      snapshot: policies.map((p) => ({
        category: p.category,
        enabled: p.enabled,
        confidenceThreshold: p.confidenceThreshold,
        enforcementBehavior: p.enforcementBehavior,
      })),
    });

    // 2. Create the submission envelope
    const submission = await Submission.create({
      userId: req.user._id,
      status: 'processing',
      imageCount: req.files.length,
    });

    // 3. Screen each image independently
    const imageResults = [];

    for (const file of req.files) {
      let outcome = 'pending';
      let categoryResults = [];
      let errorOccurred = false;

      try {
        const result = await moderateImage(file.buffer, file.mimetype, policies);
        outcome = result.outcome;
        categoryResults = result.categoryResults;
      } catch (err) {
        console.error(`[Moderation] Error screening ${file.originalname}:`, err.message);
        // Don't fail the whole submission — mark this image as failed gracefully
        outcome = 'flagged'; // conservative fallback: flag for human review
        categoryResults = [];
        errorOccurred = true;
      }

      // Save file to disk after screening (don't store blocked content if you prefer —
      // currently storing all for admin review purposes)
      const storageUrl = saveFileToDisk(file.buffer, file.originalname, file.mimetype);

      const imageDoc = await Image.create({
        submissionId: submission._id,
        userId: req.user._id,
        originalFilename: file.originalname,
        storageUrl,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        outcome,
        policySnapshotId: snapshot._id,
        categoryResults,
        verdictAt: new Date(),
        ...(errorOccurred && {
          overrideNote: 'AI screening error — flagged for manual review',
        }),
      });

      imageResults.push(imageDoc);
    }

    // 4. Mark submission complete
    await Submission.findByIdAndUpdate(submission._id, { status: 'completed' });

    return res.status(201).json({
      submission: { ...submission.toObject(), status: 'completed' },
      images: imageResults,
    });
  } catch (err) {
    console.error('[Submissions] POST error:', err);
    return res.status(500).json({ message: 'Submission failed' });
  }
});

// ── GET /api/submissions ──────────────────────────────────────────────────────
// Paginated list of the current user's submissions.
// Query params: outcome, category, from (date), to (date), page, limit

router.get('/', async (req, res) => {
  try {
    const {
      outcome,
      category,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build image filter
    const imageFilter = { userId: req.user._id };

    if (outcome && ['approved', 'flagged', 'blocked'].includes(outcome)) {
      imageFilter.outcome = outcome;
    }

    if (category) {
      // Filter images where at least one categoryResult for this category is a violation
      imageFilter['categoryResults'] = {
        $elemMatch: { category, result: 'violation' },
      };
    }

    if (from || to) {
      imageFilter.createdAt = {};
      if (from) imageFilter.createdAt.$gte = new Date(from);
      if (to) imageFilter.createdAt.$lte = new Date(to);
    }

    // Get all matching images, grouped by submission
    // We return submissions as the top-level entity, with their images nested
    const [images, totalImages] = await Promise.all([
      Image.find(imageFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('submissionId', 'createdAt status imageCount')
        .lean(),
      Image.countDocuments(imageFilter),
    ]);

    return res.json({
      images,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalImages,
        pages: Math.ceil(totalImages / limitNum),
      },
    });
  } catch (err) {
    console.error('[Submissions] GET list error:', err);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// ── GET /api/submissions/:id ──────────────────────────────────────────────────
// Full submission detail — all images with complete verdict breakdowns

router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user._id, // users can only view their own
    }).lean();

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const images = await Image.find({ submissionId: submission._id })
      .populate('appealId')
      .populate('policySnapshotId', 'snapshot createdAt')
      .lean();

    return res.json({ submission, images });
  } catch (err) {
    console.error('[Submissions] GET detail error:', err);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
});

module.exports = router;
