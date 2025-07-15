/**
 * shared/constants.js
 * 
 * Constants shared between frontend and backend for Radix Tribes
 * This file uses CommonJS exports for Node.js compatibility
 */

// Game balance constants
const MAX_STAT_POINTS = 25;
const MIN_STAT_VALUE = 1;

// Starting resources for new tribes
const INITIAL_GLOBAL_RESOURCES = {
  food: 100,
  scrap: 20,
  morale: 50,
};

// Starting garrison values
const INITIAL_GARRISON = {
  troops: 20,
  weapons: 10,
  chiefs: [], // Empty array for chiefs
};

// Security questions for account recovery
const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the model of your first car?",
  "What is the name of your favorite childhood friend?",
];

// Tribe colors (without React components)
const TRIBE_COLORS = [
  '#F56565', // Red
  '#4299E1', // Blue
  '#48BB78', // Green
  '#ED8936', // Orange
  '#9F7AEA', // Purple
  '#ECC94B', // Yellow
  '#38B2AC', // Teal
  '#ED64A6', // Pink
  '#A0AEC0', // Gray
  '#667EEA', // Indigo
  '#F687B3', // Fuchsia
  '#D69E2E', // Brown
  '#319795', // Pine
  '#6B46C1', // Violet
  '#C53030', // Dark Red
  '#059669', // Dark Green
];

// Terrain types (enum equivalent)
const TERRAIN_TYPES = {
  Plains: 'Plains',
  Desert: 'Desert',
  Mountains: 'Mountains',
  Forest: 'Forest',
  Ruins: 'Ruins',
  Wasteland: 'Wasteland',
  Water: 'Water',
  Radiation: 'Radiation',
  Crater: 'Crater',
  Swamp: 'Swamp',
};

// POI types (enum equivalent)
const POI_TYPES = {
  Scrapyard: 'Scrapyard',
  FoodSource: 'Food Source',
  WeaponsCache: 'WeaponsCache',
  ResearchLab: 'Research Lab',
  Settlement: 'Settlement',
  Outpost: 'Outpost',
  Ruins: 'Ruins POI',
  BanditCamp: 'Bandit Camp',
  Mine: 'Mine',
  Vault: 'Vault',
  Battlefield: 'Battlefield',
  Factory: 'Factory',
  Crater: 'Crater POI',
  Radiation: 'Radiation Zone',
};

// Diplomatic status (enum equivalent)
const DIPLOMATIC_STATUS = {
  War: 'War',
  Neutral: 'Neutral',
  Alliance: 'Alliance',
};

// POI symbols for map display
const POI_SYMBOLS = {
  [POI_TYPES.Scrapyard]: 'S',
  [POI_TYPES.FoodSource]: 'F',
  [POI_TYPES.WeaponsCache]: 'W',
  [POI_TYPES.ResearchLab]: 'R',
  [POI_TYPES.Settlement]: 'H',
  [POI_TYPES.Outpost]: 'O',
  [POI_TYPES.Ruins]: 'X',
  [POI_TYPES.BanditCamp]: 'B',
  [POI_TYPES.Mine]: 'M',
  [POI_TYPES.Vault]: 'V',
  [POI_TYPES.Battlefield]: '!',
  [POI_TYPES.Factory]: 'C',
  [POI_TYPES.Crater]: '◎',
  [POI_TYPES.Radiation]: '☣',
};

// Default map settings
const DEFAULT_MAP_SETTINGS = {
  biases: {
    [TERRAIN_TYPES.Plains]: 1,
    [TERRAIN_TYPES.Desert]: 1,
    [TERRAIN_TYPES.Mountains]: 1,
    [TERRAIN_TYPES.Forest]: 1,
    [TERRAIN_TYPES.Ruins]: 0.8,
    [TERRAIN_TYPES.Wasteland]: 1,
    [TERRAIN_TYPES.Water]: 1,
    [TERRAIN_TYPES.Radiation]: 0.5,
    [TERRAIN_TYPES.Crater]: 0.7,
    [TERRAIN_TYPES.Swamp]: 0.9
  }
};

// Export all constants
module.exports = {
  MAX_STAT_POINTS,
  MIN_STAT_VALUE,
  INITIAL_GLOBAL_RESOURCES,
  INITIAL_GARRISON,
  SECURITY_QUESTIONS,
  TRIBE_COLORS,
  TERRAIN_TYPES,
  POI_TYPES,
  DIPLOMATIC_STATUS,
  POI_SYMBOLS,
  DEFAULT_MAP_SETTINGS
};
