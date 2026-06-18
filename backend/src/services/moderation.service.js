const { callGemini } = require('./gemini.service');
const { CATEGORIES } = require('../models/Policy');

/**
 * OUTCOME PRIORITY: BLOCKED > FLAGGED > APPROVED
 *
 * Rules per category (applied after Gemini responds):
 *   - category.enabled == false          → result = inconclusive, skip entirely
 *   - gemini result == 'clean'           → no effect on verdict
 *   - gemini result == 'inconclusive'    → no effect on verdict
 *   - confidence < threshold             → treat as inconclusive, no effect
 *   - result == 'violation' AND
 *     confidence >= threshold AND
 *     behavior == 'auto_block'           → outcome = BLOCKED (stops further escalation)
 *   - result == 'violation' AND
 *     confidence >= threshold AND
 *     behavior == 'flag_review'          → outcome = at least FLAGGED
 */

const OUTCOME = {
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  BLOCKED: 'blocked',
};

/**
 * Given a list of active policy documents and Gemini's raw category results,
 * apply threshold rules and determine the final verdict.
 *
 * @param {Array}  policies       - Array of Policy documents from DB
 * @param {Object} geminiResults  - Raw JSON from callGemini() (only enabled cats)
 * @returns {{ outcome: string, categoryResults: Array }}
 */
function applyPolicies(policies, geminiResults) {
  let outcome = OUTCOME.APPROVED;
  const categoryResults = [];

  for (const policy of policies) {
    const { category, enabled, confidenceThreshold, enforcementBehavior } = policy;

    // Category disabled — skip, mark inconclusive
    if (!enabled) {
      categoryResults.push({
        category,
        result: 'inconclusive',
        confidence: 0,
        reasoning: 'Category is disabled by administrator.',
      });
      continue;
    }

    const geminiCat = geminiResults[category];

    // Gemini didn't return this category (shouldn't happen, but be defensive)
    if (!geminiCat) {
      categoryResults.push({
        category,
        result: 'inconclusive',
        confidence: 0,
        reasoning: 'No result returned by AI for this category.',
      });
      continue;
    }

    const { result, confidence, reasoning } = geminiCat;

    // Not a violation — push as-is, no verdict impact
    if (result !== 'violation') {
      categoryResults.push({ category, result, confidence, reasoning });
      continue;
    }

    // Violation but confidence below threshold — inconclusive, no verdict impact
    if (confidence < confidenceThreshold) {
      categoryResults.push({
        category,
        result: 'inconclusive',
        confidence,
        reasoning: `${reasoning} (Confidence ${confidence}% below threshold of ${confidenceThreshold}%)`,
      });
      continue;
    }

    // Violation at or above threshold — apply enforcement behavior
    categoryResults.push({ category, result: 'violation', confidence, reasoning });

    if (enforcementBehavior === 'auto_block') {
      outcome = OUTCOME.BLOCKED; // BLOCKED wins, no need to escalate further
    } else if (enforcementBehavior === 'flag_review') {
      // Only escalate to FLAGGED if not already BLOCKED
      if (outcome !== OUTCOME.BLOCKED) {
        outcome = OUTCOME.FLAGGED;
      }
    }
  }

  return { outcome, categoryResults };
}

/**
 * Full moderation pipeline for a single image.
 *
 * @param {Buffer}  imageBuffer - Raw file buffer from multer
 * @param {string}  mimeType    - e.g. 'image/jpeg'
 * @param {Array}   policies    - All Policy documents (enabled + disabled)
 * @returns {{ outcome, categoryResults }}
 */
async function moderateImage(imageBuffer, mimeType, policies) {
  // Only send enabled categories to Gemini — saves tokens on the free tier
  const enabledCategories = policies
    .filter((p) => p.enabled)
    .map((p) => p.category);

  // If somehow all categories are disabled, auto-approve
  if (enabledCategories.length === 0) {
    return {
      outcome: OUTCOME.APPROVED,
      categoryResults: CATEGORIES.map((cat) => ({
        category: cat,
        result: 'inconclusive',
        confidence: 0,
        reasoning: 'All categories are disabled.',
      })),
    };
  }

  // Call Gemini — one request covers all enabled categories
  const geminiResults = await callGemini(imageBuffer, mimeType, enabledCategories);

  // Apply threshold rules and determine verdict
  const { outcome, categoryResults } = applyPolicies(policies, geminiResults);

  return { outcome, categoryResults };
}

module.exports = { moderateImage };
