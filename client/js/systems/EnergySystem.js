/**
 * @fileoverview Energy system — core monetization mechanic.
 *
 * Energy is consumed each time the player ends a turn.
 * It regenerates slowly over time (even while offline).
 * Players can purchase instant refills via Telegram Stars.
 *
 * This module runs client-side for responsive UI.
 * The server independently validates energy to prevent cheating (Sprint 2).
 */

import {
  MAX_ENERGY,
  ENERGY_PER_TURN,
  ENERGY_REGEN_INTERVAL_MS,
  ENERGY_REGEN_AMOUNT,
} from '../config/constants.js';

export class EnergySystem {
  /**
   * @param {number} current - Starting energy level
   * @param {number} max     - Maximum energy capacity
   */
  constructor(current = MAX_ENERGY, max = MAX_ENERGY) {
    /** Current energy points */
    this.current = current;

    /** Maximum capacity (can be upgraded via premium) */
    this.max = max;

    /** AP cost per "End Turn" action */
    this.costPerTurn = ENERGY_PER_TURN;

    /** Timestamp of the last regeneration tick */
    this._lastRegenTime = Date.now();

    /** setInterval ID for the regen timer */
    this._regenInterval = null;
  }

  /* ===========================
   *   Regeneration
   * =========================== */

  /**
   * Start the automatic energy regeneration timer.
   * Adds ENERGY_REGEN_AMOUNT every ENERGY_REGEN_INTERVAL_MS.
   */
  startRegen() {
    if (this._regenInterval) return; // Already running

    this._lastRegenTime = Date.now();
    this._regenInterval = setInterval(() => {
      this._tickRegen();
    }, ENERGY_REGEN_INTERVAL_MS);
  }

  /**
   * Stop the regeneration timer (e.g., when the game is paused).
   */
  stopRegen() {
    if (this._regenInterval) {
      clearInterval(this._regenInterval);
      this._regenInterval = null;
    }
  }

  /**
   * Execute one regeneration tick.
   * @private
   */
  _tickRegen() {
    if (this.current < this.max) {
      this.current = Math.min(this.current + ENERGY_REGEN_AMOUNT, this.max);
      this._lastRegenTime = Date.now();
    }
  }

  /* ===========================
   *   Consumption
   * =========================== */

  /**
   * Attempt to consume energy for an "End Turn" action.
   *
   * @returns {boolean} True if energy was consumed successfully
   */
  consumeForTurn() {
    if (this.current < this.costPerTurn) {
      return false; // Insufficient energy → prompt purchase
    }
    this.current -= this.costPerTurn;
    return true;
  }

  /**
   * Check if the player has enough energy for a turn.
   *
   * @returns {boolean}
   */
  hasEnoughForTurn() {
    return this.current >= this.costPerTurn;
  }

  /* ===========================
   *   Rewards & Purchases
   * =========================== */

  /**
   * Add energy from an external source (purchase, referral reward, daily bonus).
   *
   * @param {number} amount - Energy to add (capped at max)
   */
  addEnergy(amount) {
    this.current = Math.min(this.current + amount, this.max);
  }

  /**
   * Calculate milliseconds until the next regen tick.
   * Useful for displaying a countdown timer in the UI.
   *
   * @returns {number} ms until next regen (0 if energy is full)
   */
  getTimeUntilNextRegen() {
    if (this.current >= this.max) return 0;
    const elapsed = Date.now() - this._lastRegenTime;
    return Math.max(0, ENERGY_REGEN_INTERVAL_MS - elapsed);
  }

  /* ===========================
   *   Serialization
   * =========================== */

  /**
   * Serialize for saving to server or localStorage.
   *
   * @returns {object} JSON-safe energy state
   */
  toJSON() {
    return {
      current: this.current,
      max: this.max,
      lastRegenTime: this._lastRegenTime,
    };
  }

  /**
   * Restore from saved data, automatically applying any offline regen.
   * If the player was away for N regen intervals, their energy increases
   * by N * ENERGY_REGEN_AMOUNT (capped at max).
   *
   * @param {object} data - Previously serialized state
   * @returns {EnergySystem} Restored instance with offline regen applied
   */
  static fromJSON(data) {
    const system = new EnergySystem(data.current, data.max);

    // Calculate how many regen ticks occurred while offline
    const elapsedMs = Date.now() - data.lastRegenTime;
    const offlineTicks = Math.floor(elapsedMs / ENERGY_REGEN_INTERVAL_MS);

    if (offlineTicks > 0) {
      system.current = Math.min(
        system.current + offlineTicks * ENERGY_REGEN_AMOUNT,
        system.max,
      );
    }

    return system;
  }
}
