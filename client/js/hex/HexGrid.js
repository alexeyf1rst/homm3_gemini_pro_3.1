/**
 * @fileoverview Hex grid data model.
 * Manages terrain, objects (monsters, resources, artifacts, towns), and fog of war.
 */

import {
  GRID_COLS, GRID_ROWS,
  TERRAIN, TERRAIN_WEIGHTS,
  RESOURCE_TYPES, MONSTER_TYPES, MAP_OBJECTS, ARTIFACT_TYPES,
  SPAWN_RATES
} from '../config/constants.js';
import { randomPick, randomInt } from '../utils/helpers.js';
import { hexDistance } from './HexUtils.js';

export class HexGrid {
  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.cells = [];
    this._generate();
  }

  _generate() {
    this._generateTerrain();
    this._placeObjects();
    this._placeTownAndGrail();
  }

  _generateTerrain() {
    const terrainEntries = Object.values(TERRAIN);
    const cumulative = [];
    let runningSum = 0;

    for (const t of terrainEntries) {
      runningSum += TERRAIN_WEIGHTS[t.id] || 0;
      cumulative.push({ terrain: t, threshold: runningSum });
    }

    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const terrain = this._pickTerrain(cumulative, runningSum);
        this.cells[row][col] = {
          col, row,
          terrain,
          visible: false,
          explored: false,
          object: null,
        };
      }
    }
    // Hero starting cell is always grass
    this.cells[0][0].terrain = TERRAIN.GRASS;
  }

  _pickTerrain(cumulative, totalWeight) {
    const roll = Math.random() * totalWeight;
    for (const { terrain, threshold } of cumulative) {
      if (roll <= threshold) return terrain;
    }
    return TERRAIN.GRASS;
  }

  _placeObjects() {
    const mThresh = SPAWN_RATES.monster;
    const cThresh = mThresh + SPAWN_RATES.chest;
    const rThresh = cThresh + SPAWN_RATES.resource;
    const aThresh = rThresh + SPAWN_RATES.artifact;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        if (cell.terrain.cost === 0) continue;
        if (row <= 1 && col <= 1) continue; // safe zone near start

        const roll = Math.random();
        if (roll < mThresh) {
          cell.object = { ...randomPick(MONSTER_TYPES) };
        } else if (roll < cThresh) {
          cell.object = { ...MAP_OBJECTS.TREASURE_CHEST };
        } else if (roll < rThresh) {
          cell.object = { ...randomPick(RESOURCE_TYPES) };
        } else if (roll < aThresh) {
          cell.object = { ...randomPick(ARTIFACT_TYPES) };
        }
      }
    }
  }

  _placeTownAndGrail() {
    // Town in the middle
    let townCol = Math.floor(this.cols / 2);
    let townRow = Math.floor(this.rows / 2);
    if (this.cells[townRow][townCol].terrain.cost === 0) {
      this.cells[townRow][townCol].terrain = TERRAIN.GRASS;
    }
    this.cells[townRow][townCol].object = { ...MAP_OBJECTS.TOWN };

    // Grail far away
    let gCol = this.cols - 1;
    let gRow = this.rows - 1;
    if (this.cells[gRow][gCol].terrain.cost === 0) {
      this.cells[gRow][gCol].terrain = TERRAIN.GRASS;
    }
    this.cells[gRow][gCol].object = { ...MAP_OBJECTS.GRAIL };
    
    // Surround Grail with a dragon
    if (gCol - 1 >= 0) this.cells[gRow][gCol - 1].object = { ...MAP_OBJECTS.DRAGON };
    if (gRow - 1 >= 0) this.cells[gRow - 1][gCol].object = { ...MAP_OBJECTS.DRAGON };
  }

  /* ==== Fog of War ==== */

  updateVisibility(heroCol, heroRow, radius) {
    // Reset all visible flags
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c].visible = false;
      }
    }

    // Set visible within radius, mark explored
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (hexDistance(heroCol, heroRow, c, r) <= radius) {
          this.cells[r][c].visible = true;
          this.cells[r][c].explored = true;
        }
      }
    }
  }

  /* ==== Accessors ==== */

  getCell(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.cells[row][col];
  }

  isPassable(col, row) {
    const cell = this.getCell(col, row);
    return cell !== null && cell.terrain.cost > 0;
  }

  getMovementCost(col, row) {
    const cell = this.getCell(col, row);
    if (!cell || cell.terrain.cost === 0) return Infinity;
    return cell.terrain.cost;
  }

  removeObject(col, row) {
    const cell = this.getCell(col, row);
    if (cell) cell.object = null;
  }

  countObjects(type) {
    let count = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.cells[row][col].object?.type === type) count++;
      }
    }
    return count;
  }

  toJSON() {
    return {
      cols: this.cols, rows: this.rows,
      cells: this.cells.map(row => row.map(cell => ({
        terrainId: cell.terrain.id,
        visible: cell.visible,
        explored: cell.explored,
        object: cell.object ? { ...cell.object } : null,
      }))),
    };
  }
}
