/**
 * @fileoverview Application entry point.
 *
 * Initializes the Telegram Mini App SDK (if running inside Telegram),
 * creates the GameEngine, and starts the game.
 *
 * This file is loaded as an ES module via <script type="module">.
 */

import { GameEngine } from './engine/GameEngine.js';

/* ===========================
 *   Initialization
 * =========================== */

/**
 * Bootstrap the game once the DOM is ready.
 */
function init() {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('[Init] Game canvas element not found!');
    return;
  }

  // Step 1: Configure Telegram Mini App (no-op outside Telegram)
  initTelegramSDK();

  // Step 2: Create and start the game engine
  const game = new GameEngine(canvas);

  // Expose for debugging (will be removed in production build)
  window.__game = game;

  console.log('🏰 Heroes Mini — Game initialized successfully!');
  console.log('📱 Tap a highlighted hex to move your hero.');
  console.log('🔄 Press "End Turn" to restore Action Points.');
}

/* ===========================
 *   Telegram SDK Setup
 * =========================== */

/**
 * Initialize the Telegram WebApp SDK.
 * Configures the Mini App appearance and signals readiness.
 *
 * Gracefully does nothing when running outside Telegram
 * (e.g., during local development in a regular browser).
 */
function initTelegramSDK() {
  // Check if Telegram SDK is loaded
  if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
    console.log('[Telegram] SDK not available — running in standalone mode.');
    return;
  }

  const tg = window.Telegram.WebApp;

  // Expand the Mini App to fill the entire screen
  tg.expand();

  // Match header color to our dark game theme
  tg.setHeaderColor('#1a1a2e');

  // Tell Telegram the app is ready to display
  tg.ready();

  console.log('[Telegram] Mini App SDK initialized.');
  console.log('[Telegram] User:', tg.initDataUnsafe?.user?.first_name || 'Unknown');
}

/* ===========================
 *   DOM Ready Gate
 * =========================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded (e.g., deferred module execution)
  init();
}
