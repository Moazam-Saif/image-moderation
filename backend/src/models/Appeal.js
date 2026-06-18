const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema(
  {
    // The specific image being appealed
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true,
      unique: true, // One appeal per image — enforced at DB level
    },
    // Denormalized for admin queue grouping without extra join
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User's written justification (required to file)
    justification: {
      type: String,
      required: [true, 'Justification is required'],
      minlength: [20, 'Justification must be at least 20 characters'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

    // Set when admin resolves the appeal
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminResponse: {
      type: String,
      default: null,
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Admin queue: pending appeals sorted oldest-first
appealSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Appeal', appealSchema);
