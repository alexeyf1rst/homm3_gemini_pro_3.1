/**
 * @fileoverview Canvas renderer with HMM3-inspired UI, fog of war, and screens.
 */

import {
  COLORS, CANVAS_PADDING, HUD_TOP_HEIGHT, HUD_BOTTOM_HEIGHT, FOG_HIDDEN_COLOR, FOG_EXPLORED_COLOR
} from '../config/constants.js';
import { hexToPixel, createHexPath, calculateHexSize } from './HexUtils.js';

export class HexRenderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    
    this._endTurnBtn = null;
    this._townBtn = null;
    this._startBtn = null;
    this._restartBtn = null;
    this.screenState = 'start'; // start, game, town, win, gameover

    this._resize();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const availW = displayWidth - CANVAS_PADDING * 2;
    const availH = displayHeight - HUD_TOP_HEIGHT - HUD_BOTTOM_HEIGHT - CANVAS_PADDING * 2;
    this.hexSize = calculateHexSize(this.grid.cols, this.grid.rows, availW, availH);

    const SQRT3 = Math.sqrt(3);
    const gridPixelW = SQRT3 * this.hexSize * (this.grid.cols + 0.5);
    const gridPixelH = this.hexSize * (1.5 * this.grid.rows + 0.5);

    this.originX = (displayWidth - gridPixelW) / 2 + SQRT3 * this.hexSize * 0.5;
    this.originY = HUD_TOP_HEIGHT + (availH - gridPixelH) / 2 + this.hexSize;

    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
  }

  onResize() { this._resize(); }

  getHexCenter(col, row) {
    return hexToPixel(col, row, this.hexSize, this.originX, this.originY);
  }

  /* ==== Main Render ==== */
  render(gs) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    
    if (this.screenState === 'start') {
      this._drawStartScreen();
      return;
    }

    if (this.screenState === 'win' || this.screenState === 'gameover') {
      this._drawEndScreen(gs);
      return;
    }

    if (this.screenState === 'town') {
      this._drawTownScreen(gs);
      return;
    }

    // GAME STATE
    this._drawTerrain();
    this._drawObjects();
    this._drawFog();

    if (gs.reachableCells?.length > 0) this._drawHighlights(gs.reachableCells, COLORS.HIGHLIGHT_REACHABLE);
    if (gs.currentPath?.length > 0) this._drawHighlights(gs.currentPath, COLORS.HIGHLIGHT_PATH);

    if (gs.hero) this._drawHero(gs.hero);
    this._drawHUD(gs);

    if (gs.notifications?.length > 0) {
      this._drawNotifications(gs.notifications);
    }
  }

  /* ==== Drawing Map ==== */
  _drawTerrain() {
    const ctx = this.ctx;
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const cell = this.grid.getCell(col, row);
        if (!cell.explored) continue; // Don't draw unseen terrain

        const { x, y } = this.getHexCenter(col, row);
        const path = createHexPath(x, y, this.hexSize);

        ctx.fillStyle = cell.terrain.color;
        ctx.fill(path);
        ctx.strokeStyle = COLORS.HEX_BORDER;
        ctx.lineWidth = 1;
        ctx.stroke(path);

        if (cell.terrain.name !== 'grass') {
          const fs = Math.max(8, Math.floor(this.hexSize * 0.4));
          ctx.font = `${fs}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.4;
          ctx.fillText(cell.terrain.label, x, y);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  _drawObjects() {
    const ctx = this.ctx;
    const iconSize = Math.max(12, Math.floor(this.hexSize * 0.7));

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const cell = this.grid.getCell(col, row);
        if (!cell.visible || !cell.object) continue;

        const { x, y } = this.getHexCenter(col, row);
        ctx.font = `${iconSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.object.icon, x, y);

        if (cell.object.type === 'monster') {
          const badgeR = Math.max(4, this.hexSize * 0.15);
          const badgeX = x + this.hexSize * 0.35;
          const badgeY = y - this.hexSize * 0.35;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = '#e63946';
          ctx.fill();
        }
      }
    }
  }

  _drawFog() {
    const ctx = this.ctx;
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const cell = this.grid.getCell(col, row);
        if (cell.visible) continue;
        
        const { x, y } = this.getHexCenter(col, row);
        const path = createHexPath(x, y, this.hexSize);
        ctx.fillStyle = cell.explored ? FOG_EXPLORED_COLOR : FOG_HIDDEN_COLOR;
        ctx.fill(path);
      }
    }
  }

  _drawHighlights(cells, color) {
    const ctx = this.ctx;
    for (const { col, row } of cells) {
      const { x, y } = this.getHexCenter(col, row);
      const path = createHexPath(x, y, this.hexSize);
      ctx.fillStyle = color;
      ctx.fill(path);
    }
  }

  _drawHero(hero) {
    const ctx = this.ctx;
    const { x, y } = this.getHexCenter(hero.col, hero.row);
    const radius = this.hexSize * 0.42;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.HERO_FILL;
    ctx.fill();
    ctx.strokeStyle = COLORS.HERO_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(radius * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', x, y + 1);
  }

  /* ==== UI Screens ==== */

  _drawStartScreen() {
    const ctx = this.ctx;
    const w = this.displayWidth, h = this.displayHeight;

    ctx.fillStyle = COLORS.TITLE_GOLD;
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEROES MINI', w/2, h/2 - 60);

    const btnW = 160, btnH = 50;
    this._startBtn = { x: (w-btnW)/2, y: h/2, w: btnW, h: btnH };
    
    ctx.fillStyle = COLORS.UI_BUTTON;
    ctx.fillRect(this._startBtn.x, this._startBtn.y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(this._startBtn.x, this._startBtn.y, btnW, btnH);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Начать Игру', w/2, h/2 + 25);
  }

  _drawEndScreen(gs) {
    const ctx = this.ctx;
    const w = this.displayWidth, h = this.displayHeight;

    const won = this.screenState === 'win';
    ctx.fillStyle = won ? COLORS.TITLE_GOLD : COLORS.HP_BAR_FILL;
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'ГРААЛЬ НАЙДЕН!' : 'ПОРАЖЕНИЕ', w/2, h/2 - 80);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '16px sans-serif';
    ctx.fillText(`Уровень: ${gs.hero.level}`, w/2, h/2 - 30);
    ctx.fillText(`Монстров убито: ${gs.hero.monstersKilled}`, w/2, h/2 - 10);
    ctx.fillText(`Артефактов: ${gs.hero.artifactsCollected}`, w/2, h/2 + 10);

    const btnW = 160, btnH = 50;
    this._restartBtn = { x: (w-btnW)/2, y: h/2 + 40, w: btnW, h: btnH };
    
    ctx.fillStyle = COLORS.UI_BUTTON;
    ctx.fillRect(this._restartBtn.x, this._restartBtn.y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(this._restartBtn.x, this._restartBtn.y, btnW, btnH);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Заново', w/2, h/2 + 65);
  }

  _drawTownScreen(gs) {
    const ctx = this.ctx;
    const w = this.displayWidth, h = this.displayHeight;

    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.TITLE_GOLD;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ГОРОД 🏰', w/2, 80);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '16px sans-serif';
    ctx.fillText(`Ваше золото: ${gs.hero.resources.gold}`, w/2, 130);
    
    // Town actions (heal)
    const btnW = 220, btnH = 50;
    this._townBtn = { x: (w-btnW)/2, y: 170, w: btnW, h: btnH };
    
    ctx.fillStyle = COLORS.UI_BUTTON;
    ctx.fillRect(this._townBtn.x, this._townBtn.y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(this._townBtn.x, this._townBtn.y, btnW, btnH);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.fillText(`Вылечить героя (20 💰)`, w/2, 195);
    
    // Close button
    this._startBtn = { x: (w-120)/2, y: h - 100, w: 120, h: 40 }; // reuse startBtn as close for town
    ctx.fillStyle = COLORS.UI_BUTTON;
    ctx.fillRect(this._startBtn.x, this._startBtn.y, 120, 40);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(this._startBtn.x, this._startBtn.y, 120, 40);
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.fillText('Уйти', w/2, h - 80 + 5);
  }

  /* ==== HUD ==== */
  _drawHUD(gs) {
    const ctx = this.ctx;
    const w = this.displayWidth, h = this.displayHeight;
    const hero = gs.hero;

    /* Top Bar */
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, 0, w, HUD_TOP_HEIGHT);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(0, 0, w, HUD_TOP_HEIGHT);

    // Row 1: HP & Level
    const hpY = 16;
    const barW = 80;
    
    // HP
    ctx.fillStyle = COLORS.HP_BAR_BG;
    ctx.fillRect(10, hpY - 5, barW, 10);
    const hpF = hero.getHPFraction();
    ctx.fillStyle = hpF > 0.3 ? COLORS.HP_BAR_SAFE : COLORS.HP_BAR_FILL;
    ctx.fillRect(10, hpY - 5, barW * hpF, 10);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`❤️ ${hero.hp}/${hero.maxHP}`, 10 + barW + 5, hpY + 4);
    
    // Level & XP
    ctx.textAlign = 'right';
    ctx.fillText(`Lvl ${hero.level} ⚔️${hero.attack} 🛡️${hero.defense}`, w - 10, hpY + 4);
    
    // XP Bar
    const xpY = 32;
    ctx.fillStyle = COLORS.XP_BAR_BG;
    ctx.fillRect(10, xpY - 2, w - 20, 4);
    ctx.fillStyle = COLORS.XP_BAR_FILL;
    ctx.fillRect(10, xpY - 2, (w - 20) * hero.getXPFraction(), 4);

    // Row 2: Resources
    const res = hero.resources;
    ctx.textAlign = 'left';
    ctx.fillText(`💰${res.gold} 🪵${res.wood} ⛏️${res.ore} 💎${res.gems}  ⚡${hero.currentAP}/${hero.maxAP}`, 10, 52);

    /* Bottom Bar */
    const barY = h - HUD_BOTTOM_HEIGHT;
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, barY, w, HUD_BOTTOM_HEIGHT);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(0, barY, w, HUD_BOTTOM_HEIGHT);

    const btnW = 140, btnH = 38;
    this._endTurnBtn = { x: (w - btnW)/2, y: barY + (HUD_BOTTOM_HEIGHT - btnH)/2, w: btnW, h: btnH };
    
    ctx.fillStyle = COLORS.UI_BUTTON;
    ctx.fillRect(this._endTurnBtn.x, this._endTurnBtn.y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BUTTON_BORDER;
    ctx.strokeRect(this._endTurnBtn.x, this._endTurnBtn.y, btnW, btnH);
    
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('End Turn', this._endTurnBtn.x + btnW/2, this._endTurnBtn.y + btnH/2 + 2);
  }

  _drawNotifications(notifications) {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const now = Date.now();
    let offsetY = HUD_TOP_HEIGHT + 10;

    for (const notif of notifications) {
      const age = now - notif.createdAt;
      const alpha = age > 2000 ? Math.max(0, 1 - (age - 2000)/500) : 1;
      ctx.globalAlpha = alpha;
      
      let bgColor = COLORS.NOTIF_INFO;
      if (notif.type === 'loot') bgColor = COLORS.NOTIF_LOOT;
      if (notif.type === 'combat-win') bgColor = COLORS.NOTIF_COMBAT_WIN;
      if (notif.type === 'combat-lose') bgColor = COLORS.NOTIF_COMBAT_LOSE;
      if (notif.type === 'level') bgColor = COLORS.NOTIF_LEVEL;

      ctx.font = 'bold 13px sans-serif';
      const textW = ctx.measureText(notif.text).width;
      const boxW = textW + 24;
      const boxX = (w - boxW)/2;
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(boxX, offsetY, boxW, 32);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(notif.text, w/2, offsetY + 16 + 2);
      
      ctx.globalAlpha = 1;
      offsetY += 36;
    }
  }

  /* ==== Hit Testing ==== */
  isEndTurnClick(x, y) { return this._inRect(x, y, this._endTurnBtn) && this.screenState === 'game'; }
  isStartClick(x, y)   { return this._inRect(x, y, this._startBtn) && (this.screenState === 'start' || this.screenState === 'town'); }
  isRestartClick(x, y) { return this._inRect(x, y, this._restartBtn) && (this.screenState === 'win' || this.screenState === 'gameover'); }
  isTownHealClick(x, y) { return this._inRect(x, y, this._townBtn) && this.screenState === 'town'; }

  _inRect(x, y, r) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
}
