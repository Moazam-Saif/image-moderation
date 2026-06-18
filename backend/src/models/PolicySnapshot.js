const mongoose = require('mongoose');

// Immutable snapshot of ALL policy documents at the time of a submission.
// Stored so historical verdicts remain explainable even after policies change.

const snapshotEntrySchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    enabled: { type: Boolean, required: true },
    confidenceThreshold: { type: Number, required: true },
    enforcementBehavior: { type: String, required: true },
  },
  { _id: false } // subdocument, no separate _id needed
);

const policySnapshotSchema = new mongoose.Schema(
  {
    snapshot: {
      type: [snapshotEntrySchema],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // snapshots never update
  }
);

module.exports = mongoose.model('PolicySnapshot', policySnapshotSchema);
