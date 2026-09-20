/**
 * @fileoverview Hex math utilities for pointy-top hexagonal grids.
 *
 * Coordinate system: "odd-r" offset layout.
 *  - Odd rows are shifted right by half a hex width.
 *  - Internally converts to cube coordinates for accurate math.
 *
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

const SQRT3 = Math.sqrt(3);

/* ===========================
 *   Coordinate Conversions
 * =========================== */

/**
 * Convert offset coordinates (col, row) to cube coordinates (q, r, s).
 * Cube coordinates satisfy the invariant: q + r + s = 0.
 *
 * @param {number} col - Column in offset grid
 * @param {number} row - Row in offset grid
 * @returns {{q: number, r: number, s: number}} Cube coordinates
 */
export function offsetToCube(col, row) {
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  const s = -q - r;
  return { q, r, s };
}

/**
 * Convert cube coordinates (q, r, s) back to offset coordinates.
 *
 * @param {number} q - Cube q-axis
 * @param {number} r - Cube r-axis
 * @param {number} _s - Cube s-axis (unused, derived from q+r)
 * @returns {{col: number, row: number}} Offset coordinates
 */
export function cubeToOffset(q, r, _s) {
  const col = q + (r - (r & 1)) / 2;
  const row = r;
  return { col, row };
}

/* ===========================
 *   Pixel <-> Hex Conversions
 * =========================== */

/**
 * Calculate the pixel center of a hex at given offset coordinates.
 *
 * @param {number} col     - Column (offset)
 * @param {number} row     - Row (offset)
 * @param {number} size    - Hex size (distance from center to vertex)
 * @param {number} originX - Pixel x-origin of the grid
 * @param {number} originY - Pixel y-origin of the grid
 * @returns {{x: number, y: number}} Pixel center position
 */
export function hexToPixel(col, row, size, originX, originY) {
  const x = originX + size * SQRT3 * (col + 0.5 * (row & 1));
  const y = originY + size * 1.5 * row;
  return { x, y };
}

/**
 * Convert a pixel position to the nearest hex offset coordinates.
 * Uses fractional axial conversion followed by cube rounding.
 *
 * @param {number} px      - Pixel x
 * @param {number} py      - Pixel y
 * @param {number} size    - Hex size
 * @param {number} originX - Grid x-origin
 * @param {number} originY - Grid y-origin
 * @returns {{col: number, row: number}} Nearest hex in offset coordinates
 */
export function pixelToHex(px, py, size, originX, originY) {
  // Translate to grid-local coordinates
  const x = px - originX;
  const y = py - originY;

  // Convert to fractional axial coordinates (pointy-top formula)
  const fq = (SQRT3 / 3 * x - 1 / 3 * y) / size;
  const fr = (2 / 3 * y) / size;

  // Round fractional cube coords to nearest hex
  return cubeRound(fq, fr, -fq - fr);
}

/**
 * Round fractional cube coordinates to the nearest integer hex.
 * Adjusts the component with the largest rounding error to maintain q+r+s=0.
 *
 * @param {number} fq - Fractional q
 * @param {number} fr - Fractional r
 * @param {number} fs - Fractional s
 * @returns {{col: number, row: number}} Rounded hex in offset coordinates
 */
function cubeRound(fq, fr, fs) {
  let q = Math.round(fq);
  let r = Math.round(fr);
  let s = Math.round(fs);

  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);

  // Fix the component with the largest rounding delta
  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return cubeToOffset(q, r, s);
}

/* ===========================
 *   Neighbors & Distance
 * =========================== */

/**
 * Direction offsets for odd-r pointy-top layout.
 * Index 0 = even rows, index 1 = odd rows.
 * Each inner array contains [deltaCol, deltaRow] for 6 directions.
 */
const NEIGHBOR_DIRS = [
  // Even rows (row % 2 === 0)
  [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]],
  // Odd rows (row % 2 === 1)
  [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]],
];

/**
 * Get all valid neighbor positions of a hex cell.
 * Filters out cells that fall outside the grid boundaries.
 *
 * @param {number} col     - Cell column
 * @param {number} row     - Cell row
 * @param {number} maxCols - Grid width (columns)
 * @param {number} maxRows - Grid height (rows)
 * @returns {Array<{col: number, row: number}>} Valid neighbor positions
 */
export function getNeighbors(col, row, maxCols, maxRows) {
  const parity = row & 1; // 0 for even, 1 for odd
  const dirs = NEIGHBOR_DIRS[parity];
  const neighbors = [];

  for (const [dc, dr] of dirs) {
    const nc = col + dc;
    const nr = row + dr;

    if (nc >= 0 && nc < maxCols && nr >= 0 && nr < maxRows) {
      neighbors.push({ col: nc, row: nr });
    }
  }

  return neighbors;
}

/**
 * Calculate the hex distance (in steps) between two cells.
 * Uses cube coordinate Manhattan distance / 2.
 *
 * @param {number} col1 - First cell column
 * @param {number} row1 - First cell row
 * @param {number} col2 - Second cell column
 * @param {number} row2 - Second cell row
 * @returns {number} Distance in hex steps
 */
export function hexDistance(col1, row1, col2, row2) {
  const a = offsetToCube(col1, row1);
  const b = offsetToCube(col2, row2);
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s),
  );
}

/* ===========================
 *   Rendering Helpers
 * =========================== */

/**
 * Create a Path2D outline for a pointy-top hexagon.
 * Vertices start at -30° and proceed in 60° increments.
 *
 * @param {number} cx   - Center x pixel
 * @param {number} cy   - Center y pixel
 * @param {number} size - Hex size (center-to-vertex)
 * @returns {Path2D} Closed hexagon path
 */
export function createHexPath(cx, cy, size) {
  const path = new Path2D();

  for (let i = 0; i < 6; i++) {
    // Pointy-top: first vertex at -30° (i.e. "1 o'clock" position)
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    const vx = cx + size * Math.cos(angleRad);
    const vy = cy + size * Math.sin(angleRad);

    if (i === 0) {
      path.moveTo(vx, vy);
    } else {
      path.lineTo(vx, vy);
    }
  }

  path.closePath();
  return path;
}

/**
 * Calculate the optimal hex size that fits the grid within available space.
 * Accounts for the staggered offset of odd rows.
 *
 * @param {number} cols        - Number of columns
 * @param {number} rows        - Number of rows
 * @param {number} availWidth  - Available horizontal pixels
 * @param {number} availHeight - Available vertical pixels
 * @returns {number} Hex size (floored to integer for crisp rendering)
 */
export function calculateHexSize(cols, rows, availWidth, availHeight) {
  // Pointy-top grid dimensions:
  //   width  ≈ sqrt(3) * size * (cols + 0.5)   [+0.5 for odd-row stagger]
  //   height ≈ size * (1.5 * rows + 0.5)
  const sizeByWidth  = availWidth  / (SQRT3 * (cols + 0.5));
  const sizeByHeight = availHeight / (1.5 * rows + 0.5);

  return Math.floor(Math.min(sizeByWidth, sizeByHeight));
}
