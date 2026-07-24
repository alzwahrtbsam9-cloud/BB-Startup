/**
 * deepseek.service.js
 * ---------------------------------------------------------------------------
 * Handles all communication with the DeepSeek Chat Completions API.
 * Exposes a single function, summarizeEmailText(), which takes raw Arabic
 * text (an email or long article) and returns exactly 4 clear Arabic bullet
 * points as a plain string array.
 * ---------------------------------------------------------------------------
 */

const axios = require('axios');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Builds the instruction sent to the model. We ask for raw JSON only —
 * no markdown fences, no numbering, no commentary — so the response can be
 * parsed directly and deterministically on our side.
 */
function buildSystemPrompt() {
  return [
    'أنت مساعد متخصص في تلخيص النصوص العربية (رسائل بريد إلكتروني أو مقالات طويلة).',
    'مهمتك: قراءة النص المُعطى واستخراج أهم 4 نقاط رئيسية منه فقط، باللغة العربية.',
    'كل نقطة يجب أن تكون جملة واحدة واضحة ومختصرة (لا تتجاوز 25 كلمة).',
    'أجب حصريًا بمصفوفة JSON صالحة تحتوي على 4 عناصر نصية بالضبط، بدون أي نص إضافي',
    'وبدون علامات ```، وبدون ترقيم أو نقاط داخل النص نفسه. مثال على الشكل المطلوب:',
    '["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة", "النقطة الرابعة"]',
  ].join(' ');
}

/**
 * Strips common wrapping artifacts (markdown code fences, stray text before
 * or after the JSON array) that models sometimes add despite instructions.
 */
function extractJsonArray(rawContent) {
  if (typeof rawContent !== 'string') return null;

  let cleaned = rawContent.trim();

  // Remove ```json ... ``` or ``` ... ``` fences if present.
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  // If there's leading/trailing prose around the array, grab the first
  // [ ... ] block specifically.
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleaned = arrayMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fallback normalizer: if the model didn't return valid JSON, try to salvage
 * 4 points from plain text (one per line, stripping bullet/number prefixes).
 */
function fallbackSplitToPoints(rawContent) {
  if (typeof rawContent !== 'string') return [];

  return rawContent
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[\s\-•*\d.\)]+/, '').trim())
    .filter((line) => line.length > 0);
}

/**
 * Normalizes whatever we extracted into exactly 4 clean, non-empty strings.
 */
function normalizeToFourPoints(points) {
  const cleaned = (points || [])
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0);

  if (cleaned.length < 4) {
    throw new Error('DeepSeek response did not contain 4 usable summary points.');
  }

  return cleaned.slice(0, 4);
}

/**
 * Calls DeepSeek's chat completions endpoint and returns exactly 4 Arabic
 * bullet points summarizing the given text.
 *
 * @param {string} emailText - Raw Arabic email/article text to summarize.
 * @returns {Promise<string[]>} Array of exactly 4 summary point strings.
 */
async function summarizeEmailText(emailText) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set. Add it to your .env file.');
  }

  let response;
  try {
    response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: emailText },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
  } catch (err) {
    if (err.response) {
      // DeepSeek responded with an error status.
      const status = err.response.status;
      const message = err.response.data?.error?.message || err.message;
      throw new Error(`DeepSeek API error (${status}): ${message}`);
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('DeepSeek API request timed out.');
    }
    throw new Error(`Failed to reach DeepSeek API: ${err.message}`);
  }

  const rawContent = response.data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('DeepSeek API returned an empty response.');
  }

  let points = extractJsonArray(rawContent);
  if (!points) {
    points = fallbackSplitToPoints(rawContent);
  }

  return normalizeToFourPoints(points);
}

module.exports = { summarizeEmailText };
