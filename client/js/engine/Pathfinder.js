/**
 * @fileoverview Pathfinding on a hexagonal grid.
 *
 * Uses Dijkstra's algorithm (not BFS) because terrain types have
 * different movement costs (e.g., grass = 1 AP, forest = 2 AP).
 *
 * Exports:
 *  - findReachableCells() — all cells the hero can reach with current AP
 *  - reconstructPath()    — shortest path from start to a specific target
 *  - cellKey()            — helper to create unique cell identifiers
 */

import { getNeighbors } from '../hex/HexUtils.js';

/**
 * Find every cell reachable from a starting position within an AP budget.
 *
 * Returns a Map where each key is a "col,row" string and each value
 * contains the cell's coordinates, total cost to reach it, and a
 * parent pointer for path reconstruction.
 *
 * @param {import('../hex/HexGrid.js').HexGrid} grid - The hex grid model
 * @param {number} startCol - Hero's current column
 * @param {number} startRow - Hero's current row
 * @param {number} maxAP    - Action points available for movement
 * @returns {Map<string, {col: number, row: number, cost: number, parent: string|null}>}
 */
export function findReachableCells(grid, startCol, startRow, maxAP) {
  const startKey = cellKey(startCol, startRow);

  // Simple array-based priority queue (efficient enough for 10×10 grids).
  // For larger maps, swap in a binary heap.
  const frontier = [{ col: startCol, row: startRow, cost: 0 }];

  // visited: cellKey → { col, row, cost, parent }
  const visited = new Map();
  visited.set(startKey, {
    col: startCol,
    row: startRow,
    cost: 0,
    parent: null,
  });

  while (frontier.length > 0) {
    // Extract the node with the lowest cost (Dijkstra guarantee)
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift();

    // Skip if we already found a cheaper route to this node
    const currentKey = cellKey(current.col, current.row);
    const currentBest = visited.get(currentKey);
    if (currentBest && current.cost > currentBest.cost) {
      continue;
    }

    // Explore all valid neighbors
    const neighbors = getNeighbors(
      current.col,
      current.row,
      grid.cols,
      grid.rows,
    );

    for (const { col, row } of neighbors) {
      const moveCost = grid.getMovementCost(col, row);

      // Skip impassable terrain (water, mountains)
      if (moveCost === Infinity) continue;

      const totalCost = current.cost + moveCost;

      // Skip if total cost exceeds available AP
      if (totalCost > maxAP) continue;

      const key = cellKey(col, row);
      const existing = visited.get(key);

      // Only update if we found a cheaper path
      if (!existing || totalCost < existing.cost) {
        visited.set(key, {
          col,
          row,
          cost: totalCost,
          parent: currentKey,
        });
        frontier.push({ col, row, cost: totalCost });
      }
    }
  }

  return visited;
}

/**
 * Reconstruct the optimal path from the start to a target cell.
 * Follows parent pointers backward from target to start.
 *
 * @param {Map} reachableMap - Map returned by findReachableCells()
 * @param {number} targetCol - Destination column
 * @param {number} targetRow - Destination row
 * @returns {Array<{col: number, row: number}>|null}
 *   Path as an array of {col, row} (excluding start cell), or null if unreachable.
 */
export function reconstructPath(reachableMap, targetCol, targetRow) {
  const targetKey = cellKey(targetCol, targetRow);

  // Target must exist in the reachable set
  if (!reachableMap.has(targetKey)) {
    return null;
  }

  // Walk backward through parent pointers
  const path = [];
  let currentKey = targetKey;

  while (currentKey !== null) {
    const node = reachableMap.get(currentKey);
    if (!node) break;

    path.unshift({ col: node.col, row: node.row });
    currentKey = node.parent;
  }

  // Remove the starting cell (hero is already there)
  if (path.length > 0) {
    path.shift();
  }

  return path;
}

/**
 * Generate a unique string key for a grid position.
 * Used as Map keys throughout the pathfinding system.
 *
 * @param {number} col
 * @param {number} row
 * @returns {string} e.g. "3,7"
 */
export function cellKey(col, row) {
  return `${col},${row}`;
}
