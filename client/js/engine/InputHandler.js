/**
 * @fileoverview Input handler — unified click/tap routing.
 * Sends raw screen coords + hex coords to a single callback.
 * GameEngine decides what to do based on game state.
 */

import { pixelToHex } from '../hex/HexUtils.js';

export class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../hex/HexRenderer.js').HexRenderer} renderer
   * @param {function(number,number,number,number):void} onClick
   *   Callback: (screenX, screenY, hexCol, hexRow)
   */
  constructor(canvas, renderer, onClick) {
    this.canvas   = canvas;
    this.renderer = renderer;
    this.onClick  = onClick;
    this._bindEvents();
  }

  /** @private */
  _bindEvents() {
    // Touch (mobile primary)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this._handle(t.clientX, t.clientY);
    }, { passive: false });

    // Mouse (desktop)
    this.canvas.addEventListener('click', (e) => {
      this._handle(e.clientX, e.clientY);
    });
  }

  /** @private */
  _handle(sx, sy) {
    const { col, row } = pixelToHex(
      sx, sy,
      this.renderer.hexSize,
      this.renderer.originX,
      this.renderer.originY,
    );
    this.onClick(sx, sy, col, row);
  }

  destroy() { /* cleanup if needed */ }
}
