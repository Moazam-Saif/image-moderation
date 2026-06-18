const express = require('express');
const auth = require('../middleware/auth');
const Image = require('../models/Image');

const router = express.Router();

router.use(auth);

// ── GET /api/images/:id ───────────────────────────────────────────────────────
// Single image verdict + appeal status.
// Users can only fetch their own images.

router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('appealId')
      .populate('policySnapshotId', 'snapshot createdAt')
      .populate('overriddenBy', 'email')
      .lean();

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    return res.json({ image });
  } catch (err) {
    console.error('[Images] GET error:', err);
    return res.status(500).json({ message: 'Failed to fetch image' });
  }
});

module.exports = router;
