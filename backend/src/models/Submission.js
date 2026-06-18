const mongoose = require('mongoose');

// A submission is one upload request from a user — a grouping container.
// The actual verdicts live on the Image documents.

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Overall status of this submission batch
    // 'processing' while AI is still running, 'completed' when all images are done
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    imageCount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

// Compound index for user's submission history sorted by date
submissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
