const Policy = require('../models/Policy');

// Default policy configuration for all 6 categories.
// These values are only applied if a category document does not already exist.
// Admins can change all of these at runtime via /api/admin/policies/:category.
//
// Rationale for defaults:
//   auto_block   → near-zero legitimate use OR safety-critical (self_harm)
//   flag_review  → context-dependent content that needs human judgment
//
// Thresholds are conservative starting points — admins should tune per use case.

const DEFAULT_POLICIES = [
  {
    category: 'graphic_violence',
    enabled: true,
    confidenceThreshold: 75,
    enforcementBehavior: 'flag_review',
    // News photos, medical imagery — context matters. Human review first.
  },
  {
    category: 'hate_symbols',
    enabled: true,
    confidenceThreshold: 70,
    enforcementBehavior: 'auto_block',
    // Near-zero legitimate use. Block confidently at 70%.
  },
  {
    category: 'self_harm',
    enabled: true,
    confidenceThreshold: 65,
    enforcementBehavior: 'auto_block',
    // Safety-critical. Lower threshold + auto-block. Err on side of caution.
  },
  {
    category: 'extremist_propaganda',
    enabled: true,
    confidenceThreshold: 70,
    enforcementBehavior: 'auto_block',
    // No legitimate use for recruitment/promotion content.
  },
  {
    category: 'weapons_contraband',
    enabled: true,
    confidenceThreshold: 75,
    enforcementBehavior: 'flag_review',
    // Legal firearms exist. Higher threshold + review before blocking.
  },
  {
    category: 'harassment_humiliation',
    enabled: true,
    confidenceThreshold: 70,
    enforcementBehavior: 'flag_review',
    // Context-dependent (satire, journalism). Human judgment preferred.
  },
];

async function seedPolicies() {
  let seeded = 0;
  let skipped = 0;

  for (const policyData of DEFAULT_POLICIES) {
    const existing = await Policy.findOne({ category: policyData.category });
    if (existing) {
      skipped++;
      continue;
    }
    await Policy.create(policyData);
    seeded++;
  }

  if (seeded > 0) {
    console.log(`[Seed] Policies seeded: ${seeded} created, ${skipped} already existed.`);
  } else {
    console.log(`[Seed] Policies already seeded — skipping.`);
  }
}

module.exports = seedPolicies;
