const { GoogleGenAI } = require('@google/genai');

const MODEL = 'gemini-2.5-flash';

// ── Vertex AI client (initialised once) ──────────────────────────────────────
// Auth: GCP_SERVICE_ACCOUNT_JSON env var holds the full service account JSON
// string. We parse it, create a GoogleAuth credential from it, and pass it
// to the SDK. No files on disk, no GOOGLE_APPLICATION_CREDENTIALS needed.

let _client = null;

function getClient() {
  if (_client) return _client;

  const rawJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!rawJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON is not set');

  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  let serviceAccountKey;
  try {
    serviceAccountKey = JSON.parse(rawJson);
  } catch (e) {
    throw new Error('GCP_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  // project_id is already inside the service account JSON — no separate env var needed
  const project = serviceAccountKey.project_id;
  if (!project) throw new Error('project_id not found in GCP_SERVICE_ACCOUNT_JSON');

  _client = new GoogleGenAI({
    vertexai: true,
    project,
    location,
    googleAuthOptions: {
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    },
  });

  return _client;
}

// ── Category descriptions ─────────────────────────────────────────────────────

const CATEGORY_DESCRIPTIONS = {
  graphic_violence:
    'Depictions of physical harm, gore, or serious injury to humans or animals.',
  hate_symbols:
    'Imagery associated with extremist ideologies or designated terrorist organizations.',
  self_harm:
    'Visual content depicting or glorifying acts of self-inflicted injury.',
  extremist_propaganda:
    'Content that promotes, recruits for, or glorifies violent extremist movements.',
  weapons_contraband:
    'Imagery depicting illegal weapons, drug manufacturing, or trafficking-related content.',
  harassment_humiliation:
    'Imagery intended to degrade, threaten, or publicly humiliate an identifiable individual.',
};

function buildPrompt(enabledCategories) {
  const categoryLines = enabledCategories
    .map((cat) => `- ${cat}: ${CATEGORY_DESCRIPTIONS[cat]}`)
    .join('\n');

  return `You are a strict content moderation AI. Your sole job is to analyze the provided image against the moderation categories listed below and return a structured JSON assessment.

For EACH category, return:
- "result": exactly one of "violation", "clean", or "inconclusive"
  * "violation"    = clear evidence of this type of content
  * "clean"        = no evidence of this type of content
  * "inconclusive" = ambiguous or insufficient evidence to determine
- "confidence": integer 0–100 representing your certainty in the result
  * 90–100 = very high certainty
  * 70–89  = high certainty
  * 50–69  = moderate certainty
  * 0–49   = low certainty
- "reasoning": one concise sentence (max 20 words) explaining your assessment

Categories to evaluate:
${categoryLines}

CRITICAL RULES:
1. Respond ONLY with a valid JSON object. No markdown, no code fences, no explanation outside the JSON.
2. Include ONLY the category keys listed above.
3. Every category must have all three fields: result, confidence, reasoning.
4. Be objective and consistent. Do not assume context not visible in the image.

Required JSON structure:
{
${enabledCategories.map((cat) => `  "${cat}": { "result": "...", "confidence": 0, "reasoning": "..." }`).join(',\n')}
}`;
}

/**
 * Call Gemini 2.5 Flash on Vertex AI with an image buffer.
 * Vertex AI has high RPM quotas — calls are fired directly with no rate limiter.
 *
 * @param {Buffer}   imageBuffer        - Raw image bytes (from multer memoryStorage)
 * @param {string}   mimeType           - e.g. 'image/jpeg'
 * @param {string[]} enabledCategories  - Category slugs currently enabled in policy
 * @returns {Object} Parsed JSON verdict object
 */
async function callGemini(imageBuffer, mimeType, enabledCategories) {
  const client = getClient();
  const prompt = buildPrompt(enabledCategories);

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType,
    },
  };

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [imagePart, { text: prompt }],
      },
    ],
    config: {
      temperature: 0.1,
    },
  });

  const rawText = response.text;
  if (!rawText) throw new Error('Gemini returned an empty response');

  // Strip accidental markdown fences despite instructions
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }

  return parsed;
}

module.exports = { callGemini, CATEGORY_DESCRIPTIONS };
