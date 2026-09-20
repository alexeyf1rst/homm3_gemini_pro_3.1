/**
 * @fileoverview Express server for HMM3 Telegram Mini App.
 *
 * Sprint 1 responsibilities:
 *  - Serve static client files (HTML, CSS, JS)
 *  - Provide stub API endpoints for future features
 *
 * Sprint 2+ will add:
 *  - Telegram initData authentication
 *  - PostgreSQL connection (via pg or Prisma)
 *  - Server-side energy validation
 *  - Referral code generation and processing
 *  - Telegram Payments (Stars) webhook handling
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===========================
 *   Middleware
 * =========================== */

app.use(express.json());

// Serve static files from the client/ directory
app.use(express.static(path.join(__dirname, '..', 'client')));

/* ===========================
 *   Health Check
 * =========================== */

/**
 * GET /api/health
 * Returns server status. Used for uptime monitoring.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
 *   Authentication (Sprint 2)
 * =========================== */

/**
 * POST /api/auth
 * Validate Telegram WebApp initData and create/return user session.
 *
 * TODO Sprint 2:
 *  - Parse initData from request body
 *  - Validate HMAC-SHA256 signature using bot token
 *  - Upsert user in database
 *  - Return JWT or session token
 */
app.post('/api/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth endpoint — implementation pending (Sprint 2)',
  });
});

/* ===========================
 *   Game State (Sprint 2)
 * =========================== */

/**
 * GET /api/game/state
 * Load the player's saved game state from the database.
 */
app.get('/api/game/state', (_req, res) => {
  res.json({ success: true, state: null });
});

/**
 * POST /api/game/state
 * Persist the player's current game state.
 */
app.post('/api/game/state', (_req, res) => {
  res.json({ success: true });
});

/* ===========================
 *   Energy System (Sprint 2)
 * =========================== */

/**
 * GET /api/energy
 * Return the player's current energy, with offline regen calculated server-side.
 */
app.get('/api/energy', (_req, res) => {
  res.json({ current: 100, max: 100, nextRegenMs: 0 });
});

/* ===========================
 *   Referral System (Sprint 3)
 * =========================== */

/**
 * POST /api/referral/generate
 * Generate a unique referral code for the authenticated player.
 */
app.post('/api/referral/generate', (_req, res) => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  res.json({ code, deepLink: `https://t.me/YourBotName?start=ref_${code}` });
});

/**
 * POST /api/referral/claim
 * Process a referral: credit the inviter with bonus resources.
 */
app.post('/api/referral/claim', (_req, res) => {
  res.json({
    success: true,
    reward: { type: 'gold', amount: 100 },
  });
});

/* ===========================
 *   Start Server
 * =========================== */

app.listen(PORT, () => {
  console.log(`🏰 HMM3 Server running at http://localhost:${PORT}`);
  console.log(`📱 Open in mobile browser or Telegram to play.`);
});
