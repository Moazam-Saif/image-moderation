const express = require('express');
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const Image = require('../../models/Image');
const Appeal = require('../../models/Appeal');
const Submission = require('../../models/Submission');
const User = require('../../models/User');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

// ── GET /api/admin/analytics/overview ────────────────────────────────────────
// Platform-wide totals: submissions, verdict distribution, appeal summary.

router.get('/overview', async (req, res) => {
  try {
    const [verdictCounts, appealCounts, totalSubmissions, totalUsers] = await Promise.all([
      // Verdict distribution across all images
      Image.aggregate([
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),

      // Appeal breakdown
      Appeal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Submission.countDocuments({}),
      User.countDocuments({ role: 'user' }),
    ]);

    // Reshape into flat objects for easy frontend consumption
    const verdicts = { approved: 0, flagged: 0, blocked: 0, pending: 0 };
    verdictCounts.forEach(({ _id, count }) => { if (_id) verdicts[_id] = count; });

    const appeals = { pending: 0, accepted: 0, rejected: 0 };
    appealCounts.forEach(({ _id, count }) => { if (_id) appeals[_id] = count; });

    const totalAppeals = appeals.pending + appeals.accepted + appeals.rejected;
    const resolvedAppeals = appeals.accepted + appeals.rejected;
    const resolutionRate = totalAppeals > 0
      ? Math.round((resolvedAppeals / totalAppeals) * 100)
      : 0;

    const totalImages = verdicts.approved + verdicts.flagged + verdicts.blocked + verdicts.pending;

    return res.json({
      totalSubmissions,
      totalImages,
      totalUsers,
      verdicts,
      appeals: {
        ...appeals,
        total: totalAppeals,
        resolved: resolvedAppeals,
        resolutionRate,
      },
    });
  } catch (err) {
    console.error('[Admin/Analytics] Overview error:', err);
    return res.status(500).json({ message: 'Failed to fetch analytics overview' });
  }
});

// ── GET /api/admin/analytics/volume ──────────────────────────────────────────
// Submission count over time for line chart.
// Query: ?from=ISO_DATE  &to=ISO_DATE  &granularity=day|week|month  (default: day)

router.get('/volume', async (req, res) => {
  try {
    const { granularity = 'day' } = req.query;

    const from = req.query.from ? new Date(req.query.from) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })();
    const to = req.query.to ? new Date(req.query.to) : new Date();

    // Map granularity to MongoDB date truncation format
    const dateFormats = {
      day:   { year: '$year', month: '$month', day: '$dayOfMonth' },
      week:  { year: '$year', week: '$week' },
      month: { year: '$year', month: '$month' },
    };
    const groupFormat = dateFormats[granularity] || dateFormats.day;

    const pipeline = [
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: granularity === 'month' ? '%Y-%m' : granularity === 'week' ? '%Y-%V' : '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ];

    const data = await Submission.aggregate(pipeline);

    return res.json({ granularity, from, to, data });
  } catch (err) {
    console.error('[Admin/Analytics] Volume error:', err);
    return res.status(500).json({ message: 'Failed to fetch volume data' });
  }
});

// ── GET /api/admin/analytics/categories ──────────────────────────────────────
// Per-category violation counts across all images.

router.get('/categories', async (req, res) => {
  try {
    const data = await Image.aggregate([
      // Unwind the categoryResults array so each entry becomes a document
      { $unwind: '$categoryResults' },
      // Only count actual violations (not clean or inconclusive)
      { $match: { 'categoryResults.result': 'violation' } },
      {
        $group: {
          _id: '$categoryResults.category',
          violationCount: { $sum: 1 },
          avgConfidence: { $avg: '$categoryResults.confidence' },
        },
      },
      { $sort: { violationCount: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          violationCount: 1,
          avgConfidence: { $round: ['$avgConfidence', 1] },
        },
      },
    ]);

    return res.json({ data });
  } catch (err) {
    console.error('[Admin/Analytics] Categories error:', err);
    return res.status(500).json({ message: 'Failed to fetch category analytics' });
  }
});

// ── GET /api/admin/analytics/appeals ─────────────────────────────────────────
// Appeal volume, resolution rate, outcome breakdown.

router.get('/appeals', async (req, res) => {
  try {
    const [statusBreakdown, resolutionTimes] = await Promise.all([
      Appeal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Average time to resolve (only resolved appeals)
      Appeal.aggregate([
        { $match: { status: { $in: ['accepted', 'rejected'] }, resolvedAt: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgHoursToResolve: {
              $avg: {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60, // ms → hours
                ],
              },
            },
          },
        },
      ]),
    ]);

    const counts = { pending: 0, accepted: 0, rejected: 0 };
    statusBreakdown.forEach(({ _id, count }) => { if (_id) counts[_id] = count; });

    const total = counts.pending + counts.accepted + counts.rejected;
    const resolved = counts.accepted + counts.rejected;
    const avgHours = resolutionTimes[0]?.avgHoursToResolve
      ? Math.round(resolutionTimes[0].avgHoursToResolve * 10) / 10
      : null;

    return res.json({
      total,
      resolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionHours: avgHours,
      breakdown: counts,
    });
  } catch (err) {
    console.error('[Admin/Analytics] Appeals error:', err);
    return res.status(500).json({ message: 'Failed to fetch appeal analytics' });
  }
});

// ── GET /api/admin/analytics/users ───────────────────────────────────────────
// Ranked user list by submission count or violation count.
// Query: ?rankBy=submissions|violations  &limit=10

router.get('/users', async (req, res) => {
  try {
    const { rankBy = 'submissions', limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    let pipeline;

    if (rankBy === 'violations') {
      // Count images per user where outcome is flagged or blocked
      pipeline = [
        { $match: { outcome: { $in: ['flagged', 'blocked'] } } },
        { $group: { _id: '$userId', violationCount: { $sum: 1 } } },
        { $sort: { violationCount: -1 } },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            email: '$user.email',
            count: '$violationCount',
          },
        },
      ];
      const data = await Image.aggregate(pipeline);
      return res.json({ rankBy, data });
    } else {
      // Count submissions per user
      pipeline = [
        { $group: { _id: '$userId', submissionCount: { $sum: 1 } } },
        { $sort: { submissionCount: -1 } },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            email: '$user.email',
            count: '$submissionCount',
          },
        },
      ];
      const data = await Submission.aggregate(pipeline);
      return res.json({ rankBy, data });
    }
  } catch (err) {
    console.error('[Admin/Analytics] Users error:', err);
    return res.status(500).json({ message: 'Failed to fetch user analytics' });
  }
});

module.exports = router;
