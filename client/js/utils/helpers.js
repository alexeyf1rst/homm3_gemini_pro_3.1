/**
 * @fileoverview Shared utility functions used across modules.
 */

/**
 * Generate a random integer in [min, max] (inclusive on both ends).
 *
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Select one item from an array using weighted random distribution.
 * Each item must have a numeric `weight` property.
 *
 * @param {Array<{weight: number}>} items
 * @returns {object} Selected item
 */
export function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1]; // Fallback
}

/**
 * Pick a uniformly random element from an array.
 *
 * @param {Array} arr
 * @returns {*}
 */
export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
