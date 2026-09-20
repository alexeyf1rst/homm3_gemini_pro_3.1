/**
 * @fileoverview Hero entity — position, combat, resources, progression.
 */

import {
  HERO_MAX_AP, HERO_START_COL, HERO_START_ROW,
  HERO_MAX_HP, HERO_BASE_ATTACK, HERO_BASE_DEFENSE,
  HERO_VISION_RADIUS, XP_TABLE, LEVEL_UP_BONUSES,
} from '../config/constants.js';

export class Hero {
  constructor(col = HERO_START_COL, row = HERO_START_ROW, maxAP = HERO_MAX_AP) {
    /* Position */
    this.col = col;
    this.row = row;

    /* Action Points */
    this.maxAP     = maxAP;
    this.currentAP = maxAP;

    /* Hit Points */
    this.maxHP = HERO_MAX_HP;
    this.hp    = HERO_MAX_HP;

    /* Combat */
    this.attack  = HERO_BASE_ATTACK;
    this.defense = HERO_BASE_DEFENSE;

    /* Progression */
    this.level = 1;
    this.xp    = 0;

    /* Stats / counters */
    this.monstersKilled    = 0;
    this.artifactsCollected = 0;

    /* Equipped artifacts (for display) */
    this.equippedArtifacts = [];

    /* Vision (fog of war) */
    this.visionRadius = HERO_VISION_RADIUS;

    /* Resources */
    this.resources = { gold: 0, wood: 0, ore: 0, gems: 0 };

    /* Army (Sprint 2+) */
    this.army = [];
  }

  /* ==== Movement ==== */

  moveTo(col, row, cost) {
    if (cost > this.currentAP) return false;
    this.col = col;
    this.row = row;
    this.currentAP -= cost;
    return true;
  }

  canAfford(cost) { return this.currentAP >= cost; }
  resetAP()       { this.currentAP = this.maxAP; }

  /* ==== Combat ==== */

  /**
   * Apply damage. Hero cannot drop below 1 HP.
   * @returns {number} actual damage taken
   */
  takeDamage(amount) {
    const actual = Math.max(1, amount);
    this.hp = Math.max(1, this.hp - actual);
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }

  healFull() {
    this.hp = this.maxHP;
  }

  isAlive()       { return this.hp > 0; }
  getHPFraction() { return this.hp / this.maxHP; }

  /* ==== XP & Leveling ==== */

  /**
   * Award XP and check for level-ups.
   * @returns {number} number of levels gained (0 if none)
   */
  gainXP(amount) {
    this.xp += amount;
    let levelsGained = 0;

    while (this.level < XP_TABLE.length - 1 && this.xp >= XP_TABLE[this.level + 1]) {
      this.level++;
      levelsGained++;
      this._applyLevelBonus();
    }

    return levelsGained;
  }

  /**
   * Apply stat bonuses for one level-up.
   * @private
   */
  _applyLevelBonus() {
    this.attack  += LEVEL_UP_BONUSES.attack;
    this.defense += LEVEL_UP_BONUSES.defense;
    this.maxHP   += LEVEL_UP_BONUSES.maxHP;
    this.hp      += LEVEL_UP_BONUSES.maxHP; // heal the bonus amount

    // +1 max AP every 3 levels
    if (this.level % 3 === 0) {
      this.maxAP += 1;
    }
  }

  /** XP progress toward next level as 0..1 fraction */
  getXPFraction() {
    if (this.level >= XP_TABLE.length - 1) return 1; // max level
    const current = this.xp - XP_TABLE[this.level];
    const needed  = XP_TABLE[this.level + 1] - XP_TABLE[this.level];
    return needed > 0 ? current / needed : 1;
  }

  /* ==== Artifacts ==== */

  /**
   * Equip an artifact: permanently boost stats.
   * @param {object} artifact - { name, icon, bonuses: { attack?, defense?, maxHP?, maxAP? } }
   */
  equipArtifact(artifact) {
    this.equippedArtifacts.push(artifact);
    this.artifactsCollected++;

    const b = artifact.bonuses;
    if (b.attack)  this.attack  += b.attack;
    if (b.defense) this.defense += b.defense;
    if (b.maxHP)   { this.maxHP += b.maxHP; this.hp += b.maxHP; }
    if (b.maxAP)   { this.maxAP += b.maxAP; this.currentAP += b.maxAP; }
  }

  /* ==== Resources ==== */

  addResource(type, amount) {
    if (type in this.resources) this.resources[type] += amount;
  }

  /* ==== Serialization ==== */

  toJSON() {
    return {
      col: this.col, row: this.row,
      currentAP: this.currentAP, maxAP: this.maxAP,
      hp: this.hp, maxHP: this.maxHP,
      attack: this.attack, defense: this.defense,
      level: this.level, xp: this.xp,
      monstersKilled: this.monstersKilled,
      artifactsCollected: this.artifactsCollected,
      equippedArtifacts: this.equippedArtifacts.map(a => ({ ...a })),
      resources: { ...this.resources },
    };
  }
}
