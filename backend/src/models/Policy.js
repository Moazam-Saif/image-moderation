const mongoose = require('mongoose');

const CATEGORIES = [
  'graphic_violence',
  'hate_symbols',
  'self_harm',
  'extremist_propaganda',
  'weapons_contraband',
  'harassment_humiliation',
];

const policySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    // Integer 0-100. Detections below this are treated as inconclusive.
    confidenceThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    enforcementBehavior: {
      type: String,
      enum: ['auto_block', 'flag_review'],
      required: true,
    },
    // Audit: which admin last changed this policy
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = set by system seed
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Policy', policySchema);
module.exports.CATEGORIES = CATEGORIES;
