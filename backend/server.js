/**
 * server.js
 * ---------------------------------------------------------------------------
 * BB AI Backend — main entry point.
 *
 * Endpoints:
 *   GET  /               -> health check
 *   POST /api/summarize  -> summarizes { emailText } into 4 Arabic bullet points
 * ---------------------------------------------------------------------------
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { summarizeEmailText } = require('./deepseek.service');

const app = express();
const PORT = process.env.PORT || 5000;

const MAX_TEXT_LENGTH = 20000; // guard against excessively large payloads

// --------------------------- Global middleware ---------------------------
app.use(cors()); // enable CORS for all origins
app.use(express.json({ limit: '2mb' }));

// -------------------------------- Routes ---------------------------------

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BB AI Backend is running smoothly! 🚀',
  });
});

// Summarize endpoint
app.post('/api/summarize', async (req, res) => {
  const { emailText } = req.body || {};

  // --- Input validation ---
  if (typeof emailText !== 'string' || emailText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'الحقل "emailText" مطلوب ويجب أن يكون نصًا غير فارغ.',
    });
  }

  if (emailText.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `النص طويل جدًا. الحد الأقصى المسموح به هو ${MAX_TEXT_LENGTH} حرفًا.`,
    });
  }

  try {
    const summary = await summarizeEmailText(emailText.trim());

    return res.status(200).json({
      success: true,
      summary, // array of exactly 4 strings
    });
  } catch (err) {
    console.error('[/api/summarize] Error:', err.message);

    return res.status(502).json({
      success: false,
      message: 'تعذّر إنشاء الملخّص حاليًا. يرجى المحاولة مرة أخرى لاحقًا.',
    });
  }
});

// --------------------------- 404 fallback route ---------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود.',
  });
});

// ----------------------- Centralized error handler -------------------------
// Catches synchronous errors thrown by middleware (e.g. malformed JSON body).
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم.',
  });
});

// --------------------------------- Start ----------------------------------
app.listen(PORT, () => {
  console.log(`✅ BB AI Backend is listening on http://localhost:${PORT}`);
});
