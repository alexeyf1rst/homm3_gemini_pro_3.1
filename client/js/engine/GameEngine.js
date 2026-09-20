/**
 * @fileoverview Main GameEngine managing movement, combat, fog of war, town, and state logic.
 */

import { HexGrid } from '../hex/HexGrid.js';
import { HexRenderer } from '../hex/HexRenderer.js';
import { Hero } from '../entities/Hero.js';
import { EnergySystem } from '../systems/EnergySystem.js';
import { InputHandler } from './InputHandler.js';
import { findReachableCells, reconstructPath, cellKey } from './Pathfinder.js';
import { CHEST_LOOT_TABLE, TOWN_HEAL_COST } from '../config/constants.js';
import { randomInt, weightedRandom, capitalize } from '../utils/helpers.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new HexRenderer(canvas, null); // Will set later
    
    this.energy = new EnergySystem();
    this.notifications = [];
    this.isAnimating = false;
    
    this._initGame();

    this.input = new InputHandler(canvas, this.renderer, (sx, sy, col, row) => this._onClick(sx, sy, col, row));
    this.energy.startRegen();

    window.addEventListener('resize', () => {
      this.renderer.onResize();
      this._render();
    });

    this._render();
  }

  _initGame() {
    this.grid = new HexGrid();
    this.renderer.grid = this.grid;
    this.hero = new Hero();
    
    this.turn = 1;
    this.reachableCells = new Map();
    this.currentPath = [];
    
    this.grid.updateVisibility(this.hero.col, this.hero.row, this.hero.visionRadius);
    this._updateReachable();
  }

  /* ==== Inputs ==== */
  _onClick(sx, sy, col, row) {
    const r = this.renderer;
    const state = r.screenState;

    if (state === 'start') {
      if (r.isStartClick(sx, sy)) {
        r.screenState = 'game';
        this._render();
      }
      return;
    }
    
    if (state === 'win' || state === 'gameover') {
      if (r.isRestartClick(sx, sy)) {
        this._initGame();
        r.screenState = 'game';
        this._render();
      }
      return;
    }

    if (state === 'town') {
      if (r.isStartClick(sx, sy)) {
        r.screenState = 'game'; // close town
        this._render();
      } else if (r.isTownHealClick(sx, sy)) {
        if (this.hero.hp >= this.hero.maxHP) {
          this._addNotification('Герой уже здоров!', 'info');
        } else if (this.hero.resources.gold >= TOWN_HEAL_COST) {
          this.hero.resources.gold -= TOWN_HEAL_COST;
          this.hero.healFull();
          this._addNotification('Здоровье восстановлено!', 'loot');
        } else {
          this._addNotification('Недостаточно золота!', 'combat-lose');
        }
      }
      return;
    }

    if (state === 'game') {
      if (r.isEndTurnClick(sx, sy)) {
        this._onEndTurn();
        return;
      }
      this._onHexClick(col, row);
    }
  }

  _onHexClick(col, row) {
    if (this.isAnimating) return;
    const key = cellKey(col, row);
    if (!this.reachableCells.has(key)) return;
    if (col === this.hero.col && row === this.hero.row) return;

    const path = reconstructPath(this.reachableCells, col, row);
    if (!path || path.length === 0) return;

    this._animateMovement(path);
  }

  _onEndTurn() {
    if (this.isAnimating) return;
    if (!this.energy.hasEnoughForTurn()) {
      this._addNotification('Мало энергии! 🔋', 'combat-lose');
      return;
    }
    this.energy.consumeForTurn();
    this.hero.resetAP();
    this.hero.heal(2);
    this.turn++;
    this._updateReachable();
    this._render();
  }

  /* ==== Movement & Logic ==== */
  async _animateMovement(path) {
    this.isAnimating = true;
    this.currentPath = [...path];
    this._render();

    let apSpent = 0;

    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      const stepCost = this.grid.getMovementCost(step.col, step.row);
      await this._delay(100);

      this.hero.col = step.col;
      this.hero.row = step.row;
      apSpent += stepCost;
      this.currentPath = path.slice(i + 1);
      
      // Update fog of war
      this.grid.updateVisibility(this.hero.col, this.hero.row, this.hero.visionRadius);
      this._render();

      const cell = this.grid.getCell(step.col, step.row);
      if (cell?.object) {
        if (cell.object.type === 'monster') {
          await this._fightMonster(cell);
          break;
        } else if (cell.object.type === 'town') {
          this.renderer.screenState = 'town';
          break;
        } else if (cell.object.type === 'grail') {
          this.renderer.screenState = 'win';
          break;
        } else {
          this._handlePickup(cell);
          this._render();
        }
      }
    }

    this.hero.currentAP -= apSpent;
    this.currentPath = [];
    this._updateReachable();
    
    if (this.hero.hp <= 0) {
      this.renderer.screenState = 'gameover';
    }

    this.isAnimating = false;
    this._render();
  }

  _handlePickup(cell) {
    const obj = cell.object;
    if (obj.type === 'resource') {
      const amt = randomInt(obj.amount[0], obj.amount[1]);
      this.hero.addResource(obj.resource, amt);
      this._addNotification(`+${amt} ${obj.resource}`, 'loot');
    } else if (obj.type === 'chest') {
      const loot = weightedRandom(CHEST_LOOT_TABLE);
      const amt = randomInt(loot.amount[0], loot.amount[1]);
      if (loot.type === 'energy') this.energy.addEnergy(amt);
      else if (loot.type === 'ap') this.hero.currentAP += amt;
      else this.hero.addResource(loot.type, amt);
      this._addNotification(`📦 +${amt} ${loot.type}`, 'loot');
    } else if (obj.type === 'artifact') {
      this.hero.equipArtifact(obj);
      this._addNotification(`📿 Найден артефакт: ${obj.name}!`, 'loot');
    }
    this.grid.removeObject(cell.col, cell.row);
  }

  async _fightMonster(cell) {
    const monster = cell.object;
    this._addNotification(`⚔️ ${monster.name} атакует!`, 'info');
    this._render();
    await this._delay(600);

    const hRoll = this.hero.attack + randomInt(1, 6);
    const mRoll = monster.attack + randomInt(1, 6);

    if (hRoll >= mRoll) {
      const dmg = this.hero.takeDamage(Math.max(1, Math.floor(monster.attack / 2) - this.hero.defense));
      this.hero.monstersKilled++;
      
      const levels = this.hero.gainXP(monster.xp);
      if (levels > 0) this._addNotification(`УРОВЕНЬ ПОВЫШЕН! (${this.hero.level})`, 'level');

      for (const [res, range] of Object.entries(monster.loot || {})) {
        const amt = randomInt(range[0], range[1]);
        this.hero.addResource(res, amt);
      }
      this.grid.removeObject(cell.col, cell.row);
      this._addNotification(`🏆 Победа! +${monster.xp} XP (-${dmg} HP)`, 'combat-win');
    } else {
      const dmg = this.hero.takeDamage(Math.max(1, monster.attack - this.hero.defense));
      this._addNotification(`💀 Поражение! -${dmg} HP`, 'combat-lose');
    }
    this._render();
    await this._delay(400);
  }

  /* ==== Helpers ==== */
  _updateReachable() {
    this.reachableCells = findReachableCells(this.grid, this.hero.col, this.hero.row, this.hero.currentAP);
  }

  _addNotification(text, type = 'info') {
    const id = Date.now() + Math.random();
    this.notifications.push({ id, text, type, createdAt: Date.now() });
    this._render();
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this._render();
    }, 2500);
  }

  _render() {
    const reachableArray = [];
    for (const [_key, node] of this.reachableCells) {
      if (node.col !== this.hero.col || node.row !== this.hero.row) {
        reachableArray.push({ col: node.col, row: node.row });
      }
    }
    this.renderer.render({
      hero: this.hero,
      energy: this.energy,
      turn: this.turn,
      reachableCells: reachableArray,
      currentPath: this.currentPath,
      notifications: this.notifications,
    });
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
  destroy() { this.energy.stopRegen(); this.input.destroy(); }
}
