const express = require('express');
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const Policy = require('../../models/Policy');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

// ── GET /api/admin/policies ───────────────────────────────────────────────────
// Returns all 6 policy documents, sorted by category name.

router.get('/', async (req, res) => {
  try {
    const policies = await Policy.find({})
      .sort({ category: 1 })
      .populate('updatedBy', 'email')
      .lean();

    return res.json({ policies });
  } catch (err) {
    console.error('[Admin/Policies] GET error:', err);
    return res.status(500).json({ message: 'Failed to fetch policies' });
  }
});

// ── PATCH /api/admin/policies/:category ───────────────────────────────────────
// Partial update of one category's policy.
// Body: any combination of { enabled, confidenceThreshold, enforcementBehavior }
// Changes apply to future submissions only — past verdicts are unaffected.

router.patch('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { enabled, confidenceThreshold, enforcementBehavior } = req.body;

    // Build update object from only the fields provided
    const updates = { updatedBy: req.user._id };

    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'enabled must be a boolean' });
      }
      updates.enabled = enabled;
    }

    if (confidenceThreshold !== undefined) {
      const threshold = Number(confidenceThreshold);
      if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
        return res.status(400).json({
          message: 'confidenceThreshold must be an integer between 0 and 100',
        });
      }
      updates.confidenceThreshold = threshold;
    }

    if (enforcementBehavior !== undefined) {
      if (!['auto_block', 'flag_review'].includes(enforcementBehavior)) {
        return res.status(400).json({
          message: "enforcementBehavior must be 'auto_block' or 'flag_review'",
        });
      }
      updates.enforcementBehavior = enforcementBehavior;
    }

    if (Object.keys(updates).length === 1) {
      // Only updatedBy was set — nothing meaningful to update
      return res.status(400).json({ message: 'No valid fields provided to update' });
    }

    const policy = await Policy.findOneAndUpdate(
      { category },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('updatedBy', 'email');

    if (!policy) {
      return res.status(404).json({ message: `Policy category '${category}' not found` });
    }

    return res.json({ policy });
  } catch (err) {
    console.error('[Admin/Policies] PATCH error:', err);
    return res.status(500).json({ message: 'Failed to update policy' });
  }
});

module.exports = router;
