const mongoose = require('mongoose');

// One document per image. This is where verdicts live.
// Each image is screened independently and can have its own outcome, appeal, and override.

const categoryResultSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    // 'violation'    → confidence met or exceeded threshold
    // 'clean'        → AI found no issue in this category
    // 'inconclusive' → confidence below threshold OR category was disabled
    result: {
      type: String,
      enum: ['violation', 'clean', 'inconclusive'],
      required: true,
    },
    confidence: { type: Number, min: 0, max: 100, required: true },
    reasoning: { type: String, required: true },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true,
    },
    // Denormalized for fast user-history queries without joining Submission
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // File metadata
    originalFilename: { type: String, required: true },
    storageUrl: { type: String, required: true },      // Cloudinary secure_url
    cloudinaryPublicId: { type: String, required: true }, // needed to delete/manage the asset later
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },

    // Verdict
    // 'pending'  → AI not finished yet
    // 'approved' → no category triggered
    // 'flagged'  → one or more flag_review categories triggered
    // 'blocked'  → one or more auto_block categories triggered
    outcome: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'blocked'],
      default: 'pending',
    },
    // Reference to the policy state active at screening time
    policySnapshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicySnapshot',
      default: null,
    },
    // Full per-category breakdown from Gemini
    categoryResults: {
      type: [categoryResultSchema],
      default: [],
    },
    verdictAt: { type: Date, default: null },

    /* Set when Gemini fails to return a valid result — signals to the user
     that the outcome is a safe fallback, not a real AI verdict.*/
    processingError: { type: Boolean, default: false },

    /* Appeal state — denormalized here to avoid joins on list views
     One appeal max per image (enforced by unique index on Appeal.imageId)*/
    appealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appeal',
      default: null,
    },
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'rejected'],
      default: 'none',
    },

    // Manual admin override (separate from appeal resolution)
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    overriddenAt: { type: Date, default: null },
    overrideNote: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound indexes for filtered user history queries
imageSchema.index({ userId: 1, outcome: 1 });
imageSchema.index({ userId: 1, createdAt: -1 });

// Index for analytics: violations per category
imageSchema.index({ 'categoryResults.category': 1 });

// Index for admin analytics: all images sorted by date
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
