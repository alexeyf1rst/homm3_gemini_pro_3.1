/**
 * @fileoverview Game constants and configuration.
 * Central source of truth for ALL tunable game parameters.
 */

/* ===========================
 *   Grid
 * =========================== */
export const GRID_COLS = 10;
export const GRID_ROWS = 10;

/* ===========================
 *   Hero Base Stats
 * =========================== */
export const HERO_MAX_AP        = 6;
export const HERO_START_COL     = 0;
export const HERO_START_ROW     = 0;
export const HERO_MAX_HP        = 100;
export const HERO_BASE_ATTACK   = 10;
export const HERO_BASE_DEFENSE  = 5;

/* ===========================
 *   Fog of War
 * =========================== */
export const HERO_VISION_RADIUS = 3;
export const FOG_HIDDEN_COLOR   = '#0b0b18';
export const FOG_EXPLORED_COLOR = 'rgba(11, 11, 24, 0.52)';

/* ===========================
 *   XP & Leveling
 * =========================== */
/** Cumulative XP required for each level (index = level) */
export const XP_TABLE = [0, 0, 50, 120, 200, 300, 420, 560, 720, 900, 1100];

/** Stat boosts granted per level-up */
export const LEVEL_UP_BONUSES = { attack: 2, defense: 1, maxHP: 10 };
// +1 maxAP every 3 levels (handled in code)

/* ===========================
 *   Energy (Monetization)
 * =========================== */
export const MAX_ENERGY              = 100;
export const ENERGY_PER_TURN         = 5;
export const ENERGY_REGEN_INTERVAL_MS = 5 * 60 * 1000;
export const ENERGY_REGEN_AMOUNT     = 1;

/* ===========================
 *   Terrain
 * =========================== */
export const TERRAIN = {
  GRASS:    { id: 0, name: 'grass',    cost: 1, color: '#5a9e3a', label: '' },
  FOREST:   { id: 1, name: 'forest',   cost: 2, color: '#1e5631', label: '🌲' },
  WATER:    { id: 2, name: 'water',    cost: 0, color: '#2471a3', label: '〰' },
  MOUNTAIN: { id: 3, name: 'mountain', cost: 0, color: '#6b5b47', label: '▲' },
  ROAD:     { id: 4, name: 'road',     cost: 1, color: '#b8a47c', label: '' },
};

export const TERRAIN_WEIGHTS = {
  [TERRAIN.GRASS.id]:    0.48,
  [TERRAIN.FOREST.id]:   0.20,
  [TERRAIN.WATER.id]:    0.13,
  [TERRAIN.MOUNTAIN.id]: 0.11,
  [TERRAIN.ROAD.id]:     0.08,
};

/* ===========================
 *   Map Objects
 * =========================== */
export const MAP_OBJECTS = {
  /* Resources */
  GOLD_PILE:   { id: 'gold_pile',   type: 'resource', resource: 'gold', amount: [10, 50], icon: '💰' },
  WOOD_PILE:   { id: 'wood_pile',   type: 'resource', resource: 'wood', amount: [5, 20],  icon: '🪵' },
  ORE_DEPOSIT: { id: 'ore_deposit', type: 'resource', resource: 'ore',  amount: [3, 15],  icon: '⛏️' },
  GEM_DEPOSIT: { id: 'gem_deposit', type: 'resource', resource: 'gems', amount: [1, 5],   icon: '💎' },
  /* Chests */
  TREASURE_CHEST: { id: 'chest', type: 'chest', icon: '📦' },
  /* Monsters (xp field = reward for killing) */
  GOBLIN:   { id: 'goblin',   type: 'monster', name: 'Гоблин',  attack: 5,  defense: 2, xp: 15,  icon: '👺', loot: { gold: [5, 25] } },
  WOLF:     { id: 'wolf',     type: 'monster', name: 'Волк',    attack: 8,  defense: 3, xp: 25,  icon: '🐺', loot: { gold: [10, 35] } },
  SKELETON: { id: 'skeleton', type: 'monster', name: 'Скелет',  attack: 12, defense: 5, xp: 40,  icon: '💀', loot: { gold: [20, 60], gems: [1, 3] } },
  DRAGON:   { id: 'dragon',   type: 'monster', name: 'Дракон',  attack: 18, defense: 8, xp: 80,  icon: '🐉', loot: { gold: [50, 120], gems: [3, 8] } },
  /* Town */
  TOWN: { id: 'town', type: 'town', name: 'Город', icon: '🏰' },
  /* Holy Grail — win condition */
  GRAIL: { id: 'grail', type: 'grail', name: 'Святой Грааль', icon: '🏆' },
};

/* ===========================
 *   Artifacts (rare, permanent stat boosts)
 * =========================== */
export const ARTIFACT_TYPES = [
  { id: 'sword_fire',   type: 'artifact', name: 'Огненный Меч',     icon: '⚔️',  bonuses: { attack: 4 } },
  { id: 'shield_valor', type: 'artifact', name: 'Щит Доблести',     icon: '🛡️', bonuses: { defense: 3 } },
  { id: 'amulet_life',  type: 'artifact', name: 'Амулет Жизни',     icon: '📿',  bonuses: { maxHP: 25 } },
  { id: 'boots_speed',  type: 'artifact', name: 'Сапоги Скорости',  icon: '👢',  bonuses: { maxAP: 2 } },
  { id: 'ring_power',   type: 'artifact', name: 'Кольцо Силы',      icon: '💍',  bonuses: { attack: 2, defense: 2 } },
  { id: 'crown_wisdom', type: 'artifact', name: 'Корона Мудрости',  icon: '👑',  bonuses: { attack: 1, defense: 1, maxHP: 15 } },
];

/** Lists for weighted-random selection */
export const RESOURCE_TYPES = [
  MAP_OBJECTS.GOLD_PILE, MAP_OBJECTS.GOLD_PILE,
  MAP_OBJECTS.WOOD_PILE, MAP_OBJECTS.ORE_DEPOSIT, MAP_OBJECTS.GEM_DEPOSIT,
];
export const MONSTER_TYPES = [
  MAP_OBJECTS.GOBLIN, MAP_OBJECTS.GOBLIN, MAP_OBJECTS.GOBLIN,
  MAP_OBJECTS.WOLF, MAP_OBJECTS.WOLF,
  MAP_OBJECTS.SKELETON,
];

/** Spawn probability per passable cell (cumulative roll) */
export const SPAWN_RATES = {
  monster:  0.10,
  chest:    0.04,
  resource: 0.14,
  artifact: 0.02,
};

/** Town healing cost in gold */
export const TOWN_HEAL_COST = 20;

/** Chest weighted loot table */
export const CHEST_LOOT_TABLE = [
  { type: 'gold',   amount: [20, 100], weight: 35, icon: '💰' },
  { type: 'wood',   amount: [10, 40],  weight: 15, icon: '🪵' },
  { type: 'ore',    amount: [5, 25],   weight: 15, icon: '⛏️' },
  { type: 'gems',   amount: [1, 5],    weight: 10, icon: '💎' },
  { type: 'energy', amount: [10, 30],  weight: 15, icon: '🔋' },
  { type: 'ap',     amount: [2, 4],    weight: 10, icon: '⚡' },
];

/* ===========================
 *   HMM3-Inspired Color Palette
 * =========================== */
export const COLORS = {
  HEX_BORDER:          '#2e2e2e',
  HIGHLIGHT_REACHABLE: 'rgba(100, 180, 255, 0.30)',
  HIGHLIGHT_PATH:      'rgba(255, 220, 50, 0.45)',
  HERO_FILL:           '#c0392b',
  HERO_STROKE:         '#1a1a2e',
  UI_BG:               '#0d0d1a',
  UI_PANEL:            'rgba(30, 20, 12, 0.92)',
  UI_TEXT:              '#f0e6d3',
  UI_TEXT_DIM:          '#9a9080',
  UI_ACCENT:           '#d4a843',
  UI_BUTTON:           '#1a3a1a',
  UI_BUTTON_BORDER:    '#d4a843',
  HP_BAR_BG:           '#2a2a2a',
  HP_BAR_FILL:         '#c0392b',
  HP_BAR_SAFE:         '#27ae60',
  XP_BAR_BG:           '#2a2a2a',
  XP_BAR_FILL:         '#8e44ad',
  NOTIF_LOOT:          'rgba(39, 174, 96, 0.92)',
  NOTIF_COMBAT_WIN:    'rgba(212, 168, 67, 0.92)',
  NOTIF_COMBAT_LOSE:   'rgba(192, 57, 43, 0.92)',
  NOTIF_LEVEL:         'rgba(142, 68, 173, 0.92)',
  NOTIF_INFO:          'rgba(80, 80, 100, 0.92)',
  TITLE_GOLD:          '#d4a843',
  TITLE_SHADOW:        '#1a0e00',
};

/* ===========================
 *   Layout
 * =========================== */
export const CANVAS_PADDING    = 10;
export const HUD_TOP_HEIGHT    = 74;
export const HUD_BOTTOM_HEIGHT = 60;
