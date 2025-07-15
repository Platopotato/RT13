// Use CommonJS require for better compatibility with Node.js in Docker
const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Import shared constants
const {
  SECURITY_QUESTIONS,
  TRIBE_COLORS,
  INITIAL_GLOBAL_RESOURCES,
  INITIAL_GARRISON,
  DEFAULT_MAP_SETTINGS,
  TERRAIN_TYPES,
  DIPLOMATIC_STATUS
} = require('./shared/constants.js');

// --- LOGGING SETUP ---
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error(`Failed to create log directory: ${err.message}`);
  // Continue without logging to files
}

// Custom logger with timestamps
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error && error.stack) {
      console.error(`[${timestamp}] [STACK] ${error.stack}`);
    }
  },
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`);
    }
  }
};

// --- SERVER SETUP ---
const app = express();

/* -------------------------------------------------
 * CORS
 * ------------------------------------------------- */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : '*',
        credentials: true,
    }),
);

/* -------------------------------------------------
 * HTTP & Socket.IO
 * ------------------------------------------------- */
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins.length ? allowedOrigins : '*',
        methods: ['GET', 'POST'],
    },
});

// Use Node.js built-in __dirname (no need for fileURLToPath in CommonJS)
// This is crucial for platforms like Render.com with persistent disks.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = process.env.DATABASE_FILE || path.join(DATA_DIR, 'game-data.json');
const BACKUP_FILE = process.env.BACKUP_FILE || path.join(DATA_DIR, 'game-data.backup.json');

// Ensure the data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory: ${DATA_DIR}`);
  }
} catch (err) {
  logger.error(`Failed to create data directory: ${DATA_DIR}`, err);
  // Continue with in-memory only, but warn
  logger.warn('Running with in-memory data only. Data will not persist between restarts!');
}

// --- GAME LOGIC IMPLEMENTATIONS ---
// Simple implementations for required game functions

// Parse hex coordinates from a string like "050.050"
const parseHexCoords = (hexString) => {
  try {
    const [q, r] = hexString.split('.').map(Number);
    return { q, r };
  } catch (err) {
    logger.error(`Failed to parse hex coordinates: ${hexString}`, err);
    return { q: 0, r: 0 }; // Default fallback
  }
};

// Get hexes in range from a center point
const getHexesInRange = (center, range) => {
  try {
    const results = [];
    for (let q = center.q - range; q <= center.q + range; q++) {
      for (let r = center.r - range; r <= center.r + range; r++) {
        if (Math.abs(q - center.q) + Math.abs(r - center.r) <= range * 2) {
          results.push(`${q.toString().padStart(3, '0')}.${r.toString().padStart(3, '0')}`);
        }
      }
    }
    return results;
  } catch (err) {
    logger.error(`Failed to get hexes in range from ${JSON.stringify(center)}, range ${range}`, err);
    return []; // Return empty array as fallback
  }
};

// Generate map data
const generateMapData = (radius, seed, settings) => {
  try {
    logger.info(`Generating map with radius ${radius}, seed ${seed}`);
    
    // Simple map generation for server
    const map = [];
    const startingLocations = [];
    
    // Generate a simple grid of hexes
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        if (Math.abs(q) + Math.abs(r) <= radius * 1.5) {
          // Create a hex with random terrain
          const terrainTypes = Object.values(TERRAIN_TYPES);
          const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
          
          map.push({
            q,
            r,
            terrain
          });
          
          // Add some starting locations near the center
          if (Math.abs(q) < radius/3 && Math.abs(r) < radius/3 && Math.random() > 0.8) {
            startingLocations.push(`${q.toString().padStart(3, '0')}.${r.toString().padStart(3, '0')}`);
          }
        }
      }
    }
    
    // Ensure we have at least 5 starting locations
    while (startingLocations.length < 5) {
      const q = Math.floor(Math.random() * (radius/2)) * (Math.random() > 0.5 ? 1 : -1);
      const r = Math.floor(Math.random() * (radius/2)) * (Math.random() > 0.5 ? 1 : -1);
      const loc = `${q.toString().padStart(3, '0')}.${r.toString().padStart(3, '0')}`;
      if (!startingLocations.includes(loc)) {
        startingLocations.push(loc);
      }
    }
    
    logger.debug(`Map generated with ${map.length} hexes and ${startingLocations.length} starting locations`);
    return { map, startingLocations };
  } catch (err) {
    logger.error(`Failed to generate map data`, err);
    // Return minimal valid data as fallback
    return { 
      map: [{ q: 0, r: 0, terrain: TERRAIN_TYPES.Plains }], 
      startingLocations: ['000.000'] 
    };
  }
};

// Process global turn
const processGlobalTurn = (state) => {
  try {
    logger.info(`Processing turn ${state.turn}`);
    
    // Simple turn processing logic
    const newState = { ...state };
    
    // Increment turn counter
    newState.turn += 1;
    
    // Reset tribe turn submissions
    newState.tribes = newState.tribes.map(tribe => ({
      ...tribe,
      turnSubmitted: false,
      lastTurnResults: tribe.actions || [],
      actions: []
    }));
    
    // Process basic resources for each tribe
    newState.tribes.forEach(tribe => {
      // Add some basic food each turn
      if (tribe.globalResources) {
        tribe.globalResources.food += 5;
        tribe.globalResources.scrap += 2;
      }
    });
    
    // Clear expired diplomatic proposals
    if (newState.diplomaticProposals) {
      newState.diplomaticProposals = newState.diplomaticProposals.filter(
        proposal => proposal.expiresOnTurn >= newState.turn
      );
    }
    
    logger.debug(`Turn ${newState.turn} processing complete`);
    return newState;
  } catch (err) {
    logger.error(`Failed to process global turn`, err);
    // Return original state to avoid corruption
    return state;
  }
};

// Generate AI tribe
const generateAITribe = (startLocation, existingNames) => {
  try {
    const aiTribeNames = [
      "Ravagers", "Scrap Hounds", "Dust Devils", "Iron Fists",
      "Rust Raiders", "Wasteland Wolves", "Toxic Avengers", "Shadow Walkers"
    ];
    
    // Find a name that's not already taken
    let tribeName;
    do {
      tribeName = aiTribeNames[Math.floor(Math.random() * aiTribeNames.length)];
    } while (existingNames.includes(tribeName));
    
    // Generate a random color
    const color = TRIBE_COLORS[Math.floor(Math.random() * TRIBE_COLORS.length)];
    
    return {
      id: `ai-tribe-${Date.now()}`,
      playerId: `ai-${Date.now()}`,
      isAI: true,
      aiType: 'Wanderer',
      playerName: 'AI',
      tribeName,
      icon: 'skull',
      color,
      stats: {
        charisma: 5,
        intelligence: 5,
        leadership: 5,
        strength: 5
      },
      globalResources: { ...INITIAL_GLOBAL_RESOURCES },
      garrisons: { 
        [startLocation]: { ...INITIAL_GARRISON } 
      },
      location: startLocation,
      turnSubmitted: false,
      actions: [],
      lastTurnResults: [],
      exploredHexes: getHexesInRange(parseHexCoords(startLocation), 2),
      rationLevel: 'Normal',
      completedTechs: [],
      assets: [],
      currentResearch: null,
      journeyResponses: [],
      diplomacy: {}
    };
  } catch (err) {
    logger.error(`Failed to generate AI tribe at ${startLocation}`, err);
    // Return a minimal valid tribe as fallback
    return {
      id: `ai-tribe-${Date.now()}`,
      playerId: `ai-${Date.now()}`,
      isAI: true,
      aiType: 'Wanderer',
      playerName: 'AI',
      tribeName: 'Error Tribe',
      icon: 'skull',
      color: '#FF0000',
      stats: { charisma: 5, intelligence: 5, leadership: 5, strength: 5 },
      globalResources: { ...INITIAL_GLOBAL_RESOURCES },
      garrisons: { ['000.000']: { ...INITIAL_GARRISON } },
      location: '000.000',
      turnSubmitted: false,
      actions: [],
      lastTurnResults: [],
      exploredHexes: [],
      rationLevel: 'Normal',
      completedTechs: [],
      assets: [],
      currentResearch: null,
      journeyResponses: [],
      diplomacy: {}
    };
  }
};

// Generate AI actions
const generateAIActions = (tribe, allTribes, mapData) => {
  try {
    // Simple AI that just generates random actions
    return [];
  } catch (err) {
    logger.error(`Failed to generate AI actions for tribe ${tribe.id}`, err);
    return []; // Return empty array as fallback
  }
};

// Stub for chief data
const ALL_CHIEFS = [
  {
    name: "Warlord Kain",
    description: "A fierce leader known for tactical brilliance",
    key_image_url: "",
    stats: { charisma: 3, intelligence: 5, leadership: 7, strength: 6 }
  },
  {
    name: "Scout Lyra",
    description: "Master of stealth and reconnaissance",
    key_image_url: "",
    stats: { charisma: 4, intelligence: 6, leadership: 3, strength: 4 }
  }
];

// Stub for asset data
const getAsset = (assetName) => {
  try {
    const assets = {
      "Ancient Codex": { description: "Knowledge from the old world" },
      "Fusion Cell": { description: "Powerful energy source" },
      "Satellite Uplink": { description: "Communication device" }
    };
    return assets[assetName];
  } catch (err) {
    logger.error(`Failed to get asset: ${assetName}`, err);
    return null; // Return null as fallback
  }
};

// --- DATABASE (FILE-BASED) ---
let gameState;
let users;
let isShuttingDown = false; // Flag to prevent multiple shutdown attempts
let saveInProgress = false; // Flag to prevent concurrent saves

const getDefaultMapSettings = () => DEFAULT_MAP_SETTINGS;

const getDefaultGameState = () => {
  try {
    const mapSeed = Date.now();
    const mapSettings = getDefaultMapSettings();
    const { map, startingLocations } = generateMapData(40, mapSeed, mapSettings);
    return {
      mapData: map, 
      tribes: [], 
      turn: 1, 
      startingLocations,
      chiefRequests: [], 
      assetRequests: [], 
      journeys: [], 
      diplomaticProposals: [],
      history: [], 
      mapSeed, 
      mapSettings,
    };
  } catch (err) {
    logger.error(`Failed to create default game state`, err);
    // Return minimal valid state as fallback
    return {
      mapData: [{ q: 0, r: 0, terrain: TERRAIN_TYPES.Plains }],
      tribes: [],
      turn: 1,
      startingLocations: ['000.000'],
      chiefRequests: [],
      assetRequests: [],
      journeys: [],
      diplomaticProposals: [],
      history: [],
      mapSeed: Date.now(),
      mapSettings: DEFAULT_MAP_SETTINGS
    };
  }
};

const mockHash = (data) => `hashed_${data}_salted_v1`;

// Atomic file write to prevent corruption
const writeFileSafely = (filePath, data) => {
  const tempPath = `${filePath}.tmp`;
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, data, 'utf8');
    // Rename temp file to target file (atomic operation)
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    logger.error(`Failed to write file safely to ${filePath}`, err);
    // Clean up temp file if it exists
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupErr) {
      logger.error(`Failed to clean up temp file ${tempPath}`, cleanupErr);
    }
    return false;
  }
};

// Debounced save to prevent excessive writes
let saveTimeout = null;
const debouncedSave = (immediate = false) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  if (immediate) {
    saveData();
    return;
  }
  
  saveTimeout = setTimeout(() => {
    saveData();
    saveTimeout = null;
  }, 2000); // Debounce for 2 seconds
};

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      try {
        logger.info(`Loading game data from ${DATA_FILE}`);
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(rawData);
        
        // Validate data structure
        if (!data.gameState || !data.users) {
          throw new Error('Invalid data structure in game data file');
        }
        
        gameState = data.gameState;
        users = data.users;
        logger.info(`Game data loaded successfully: ${users.length} users, ${gameState.tribes.length} tribes`);
      } catch (err) {
        logger.error(`Failed to load existing data file, checking for backup`, err);
        
        // Try to load from backup
        if (fs.existsSync(BACKUP_FILE)) {
          try {
            const backupData = fs.readFileSync(BACKUP_FILE, 'utf-8');
            const parsedBackup = JSON.parse(backupData);
            gameState = parsedBackup.gameState;
            users = parsedBackup.users;
            logger.info(`Loaded from backup file successfully`);
          } catch (backupErr) {
            logger.error(`Failed to load from backup, starting fresh`, backupErr);
            gameState = getDefaultGameState();
            users = [];
          }
        } else {
          logger.warn(`No backup file found, starting fresh`);
          gameState = getDefaultGameState();
          users = [];
        }
      }
    } else {
      logger.info(`No existing game data found, initializing with defaults`);
      gameState = getDefaultGameState();
      users = [{ 
        id: 'user-admin', 
        username: 'Admin', 
        passwordHash: mockHash('snoopy'), 
        role: 'admin', 
        securityQuestion: SECURITY_QUESTIONS[0], 
        securityAnswerHash: mockHash('snoopy') 
      }];
      
      // Save initial data
      debouncedSave(true);
    }
  } catch (err) {
    logger.error(`Unexpected error in loadData()`, err);
    // Fallback to defaults
    gameState = getDefaultGameState();
    users = [{ 
      id: 'user-admin', 
      username: 'Admin', 
      passwordHash: mockHash('snoopy'), 
      role: 'admin', 
      securityQuestion: SECURITY_QUESTIONS[0], 
      securityAnswerHash: mockHash('snoopy') 
    }];
  }
};

const saveData = () => {
  // Skip saving during shutdown to prevent nodemon restart
  if (isShuttingDown) {
    logger.debug('Skipping save during shutdown');
    return;
  }
  
  // Prevent concurrent saves
  if (saveInProgress) {
    logger.debug('Save already in progress, skipping');
    return;
  }
  
  saveInProgress = true;
  
  try {
    const data = { gameState, users };
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create backup of current file if it exists
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.copyFileSync(DATA_FILE, BACKUP_FILE);
        logger.debug(`Backup created at ${BACKUP_FILE}`);
      } catch (backupErr) {
        logger.error(`Failed to create backup file`, backupErr);
        // Continue with save even if backup fails
      }
    }
    
    // Write new data atomically
    const success = writeFileSafely(DATA_FILE, jsonData);
    if (success) {
      logger.debug(`Game data saved successfully to ${DATA_FILE}`);
    } else {
      logger.error(`Failed to save game data to ${DATA_FILE}`);
    }
  } catch (err) {
    logger.error(`Error in saveData()`, err);
  } finally {
    saveInProgress = false;
  }
};

// Initial load
try {
  loadData();
} catch (err) {
  logger.error(`Failed to load initial data`, err);
  process.exit(1); // Exit if we can't load initial data
}

// --- API (SOCKET.IO) ---
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  const emitGameState = () => {
    try {
      io.emit('gamestate_updated', gameState);
    } catch (err) {
      logger.error(`Failed to emit game state`, err);
    }
  };
  
  const emitUsers = () => {
    try {
      io.emit('users_updated', users.map(({ passwordHash, securityAnswerHash, ...rest }) => rest));
    } catch (err) {
      logger.error(`Failed to emit users`, err);
    }
  };

  socket.on('get_initial_state', () => {
    try {
      socket.emit('initial_state', {
        gameState,
        users: users.map(({ passwordHash, securityAnswerHash, ...rest }) => rest)
      });
    } catch (err) {
      logger.error(`Failed to send initial state to client ${socket.id}`, err);
      socket.emit('error', { message: 'Failed to load game state' });
    }
  });

  // Auth
  socket.on('login', ({ username, password }) => {
    try {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.passwordHash === mockHash(password)) {
        const { passwordHash, securityAnswerHash, ...userToSend } = user;
        socket.emit('login_success', userToSend);
        logger.info(`User logged in: ${username}`);
      } else {
        socket.emit('login_fail', 'Invalid username or password.');
        logger.info(`Failed login attempt for username: ${username}`);
      }
    } catch (err) {
      logger.error(`Error during login for ${username}`, err);
      socket.emit('login_fail', 'An error occurred during login.');
    }
  });

  socket.on('register', (data) => {
    try {
      if (!data || !data.username || !data.password) {
        return socket.emit('register_fail', 'Invalid registration data.');
      }
      
      if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase())) {
        return socket.emit('register_fail', 'Username is already taken.');
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        username: data.username,
        passwordHash: mockHash(data.password),
        role: 'player',
        securityQuestion: data.securityQuestion || SECURITY_QUESTIONS[0],
        securityAnswerHash: mockHash((data.securityAnswer || '').toLowerCase().trim()),
      };
      
      users.push(newUser);
      debouncedSave();
      
      const { passwordHash, securityAnswerHash, ...userToSend } = newUser;
      socket.emit('login_success', userToSend); // Auto-login
      emitUsers();
      
      logger.info(`New user registered: ${data.username}`);
    } catch (err) {
      logger.error(`Error during registration for ${data?.username || 'unknown'}`, err);
      socket.emit('register_fail', 'An error occurred during registration.');
    }
  });
  
  // Simple password recovery stubs
  socket.on('get_security_question', (username) => {
    try {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      socket.emit('security_question', user ? user.securityQuestion : null);
    } catch (err) {
      logger.error(`Error getting security question for ${username}`, err);
      socket.emit('security_question', null);
    }
  });
  
  socket.on('verify_security_answer', ({username, answer}) => {
    try {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      const isCorrect = user ? user.securityAnswerHash === mockHash((answer || '').toLowerCase().trim()) : false;
      socket.emit('answer_verified', isCorrect);
    } catch (err) {
      logger.error(`Error verifying security answer for ${username}`, err);
      socket.emit('answer_verified', false);
    }
  });
  
  socket.on('reset_password', ({username, newPassword}) => {
    try {
      const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (userIndex !== -1) {
        users[userIndex].passwordHash = mockHash(newPassword);
        debouncedSave();
        socket.emit('reset_password_success', 'Password reset successfully! You can now log in.');
        logger.info(`Password reset for user: ${username}`);
      } else {
        socket.emit('reset_password_fail', 'User not found.');
        logger.warn(`Password reset attempted for non-existent user: ${username}`);
      }
    } catch (err) {
      logger.error(`Error resetting password for ${username}`, err);
      socket.emit('reset_password_fail', 'An error occurred.');
    }
  });

  // Game Actions
  socket.on('create_tribe', (newTribeData) => {
    try {
      const occupiedLocations = new Set(gameState.tribes.map(t => t.location));
      const availableStart = gameState.startingLocations.find(loc => !occupiedLocations.has(loc));
      if (!availableStart) {
        socket.emit('alert', "No available starting locations.");
        return;
      }

      const startCoords = parseHexCoords(availableStart);
      const initialExplored = getHexesInRange(startCoords, 2);

      const newTribe = {
        ...newTribeData,
        id: `tribe-${Date.now()}`,
        location: availableStart,
        globalResources: INITIAL_GLOBAL_RESOURCES,
        garrisons: { [availableStart]: { ...INITIAL_GARRISON } },
        actions: [],
        turnSubmitted: false,
        lastTurnResults: [],
        exploredHexes: initialExplored,
        rationLevel: 'Normal',
        completedTechs: [],
        assets: [],
        currentResearch: null,
        journeyResponses: [],
        diplomacy: {},
      };
      
      gameState.tribes.forEach(existingTribe => {
        const initialStatus = existingTribe.isAI ? DIPLOMATIC_STATUS.War : DIPLOMATIC_STATUS.Neutral;
        newTribe.diplomacy[existingTribe.id] = { status: initialStatus };
        existingTribe.diplomacy[newTribe.id] = { status: initialStatus };
      });

      gameState.tribes.push(newTribe);
      debouncedSave();
      emitGameState();
      
      logger.info(`New tribe created: ${newTribe.tribeName} at ${newTribe.location}`);
    } catch (err) {
      logger.error(`Error creating tribe`, err);
      socket.emit('alert', "Failed to create tribe. Please try again.");
    }
  });

  socket.on('submit_turn', ({ tribeId, plannedActions, journeyResponses }) => {
    try {
      const tribe = gameState.tribes.find(t => t.id === tribeId);
      if (tribe) {
        tribe.actions = plannedActions;
        tribe.turnSubmitted = true;
        tribe.journeyResponses = journeyResponses;
        debouncedSave();
        emitGameState();
        logger.info(`Turn submitted for tribe: ${tribe.tribeName}`);
      } else {
        logger.warn(`Turn submission attempted for non-existent tribe: ${tribeId}`);
      }
    } catch (err) {
      logger.error(`Error submitting turn for tribe ${tribeId}`, err);
      socket.emit('alert', "Failed to submit turn. Please try again.");
    }
  });

  socket.on('process_turn', () => {
    try {
      // Add AI actions
      gameState.tribes.forEach(tribe => {
        if (tribe.isAI && !tribe.turnSubmitted) {
          tribe.actions = generateAIActions(tribe, gameState.tribes, gameState.mapData);
          tribe.turnSubmitted = true;
        }
      });
      
      gameState = processGlobalTurn(gameState);
      debouncedSave(true); // Save immediately after turn processing
      emitGameState();
      
      logger.info(`Turn ${gameState.turn} processed`);
    } catch (err) {
      logger.error(`Error processing turn`, err);
      socket.emit('alert', "Failed to process turn. Please try again.");
    }
  });
  
  // All other actions follow this pattern: find data, update, save, broadcast.
  const createGenericHandler = (updateLogic) => (payload) => {
    try {
      updateLogic(gameState, users, payload);
      debouncedSave();
      emitGameState();
      emitUsers();
    } catch (err) {
      logger.error(`Error in generic handler for ${updateLogic.name || 'unknown action'}`, err);
      socket.emit('alert', "An error occurred. Please try again.");
    }
  };

  const actionHandlers = {
    'update_tribe': (state, users, updatedTribe) => { 
      state.tribes = state.tribes.map(t => t.id === updatedTribe.id ? updatedTribe : t);
      logger.debug(`Tribe updated: ${updatedTribe.tribeName}`);
    },
    'remove_player': (state, users, userId) => { 
      state.tribes = state.tribes.filter(t => t.playerId !== userId);
      users = users.filter(u => u.id !== userId);
      logger.info(`Player removed: ${userId}`);
    },
    'start_new_game': (state) => {
      state.tribes = []; 
      state.chiefRequests = []; 
      state.assetRequests = [];
      state.journeys = []; 
      state.turn = 1; 
      state.diplomaticProposals = []; 
      state.history = [];
      logger.info(`New game started`);
    },
    'load_backup': (state, users, backup) => { 
      gameState = backup.gameState; 
      users = backup.users;
      logger.info(`Backup loaded: ${users.length} users, ${gameState.tribes.length} tribes`);
    },
    'update_map': (state, users, {newMapData, newStartingLocations}) => {
      state.mapData = newMapData;
      state.startingLocations = newStartingLocations;
      logger.info(`Map updated: ${newMapData.length} hexes, ${newStartingLocations.length} starting locations`);
    },
    'request_chief': (state, users, payload) => { 
      state.chiefRequests.push({ id: `req-${Date.now()}`, ...payload, status: 'pending' });
      logger.info(`Chief requested for tribe ${payload.tribeId}: ${payload.chiefName}`);
    },
    'approve_chief': (state, users, reqId) => {
      const req = state.chiefRequests.find(r => r.id === reqId);
      if(req) {
        req.status = 'approved';
        const tribe = state.tribes.find(t => t.id === req.tribeId);
        const chiefData = ALL_CHIEFS.find(c => c.name === req.chiefName);
        if(tribe && chiefData) {
          if (!tribe.garrisons[tribe.location]) {
            tribe.garrisons[tribe.location] = { ...INITIAL_GARRISON };
          }
          if (!tribe.garrisons[tribe.location].chiefs) {
            tribe.garrisons[tribe.location].chiefs = [];
          }
          tribe.garrisons[tribe.location].chiefs.push(chiefData);
          logger.info(`Chief approved: ${req.chiefName} for tribe ${tribe.tribeName}`);
        } else {
          logger.warn(`Failed to add chief: tribe or chief data not found`);
        }
      }
    },
    'deny_chief': (state, users, reqId) => { 
      const req = state.chiefRequests.find(r => r.id === reqId); 
      if(req) {
        req.status = 'denied';
        logger.info(`Chief request denied: ${reqId}`);
      }
    },
    'request_asset': (state, users, payload) => { 
      state.assetRequests.push({ id: `asset-req-${Date.now()}`, ...payload, status: 'pending' });
      logger.info(`Asset requested for tribe ${payload.tribeId}: ${payload.assetName}`);
    },
    'approve_asset': (state, users, reqId) => {
      const req = state.assetRequests.find(r => r.id === reqId);
      if(req) {
        req.status = 'approved';
        const tribe = state.tribes.find(t => t.id === req.tribeId);
        if(tribe && getAsset(req.assetName)) {
          if (!tribe.assets) {
            tribe.assets = [];
          }
          tribe.assets.push(req.assetName);
          logger.info(`Asset approved: ${req.assetName} for tribe ${tribe.tribeName}`);
        } else {
          logger.warn(`Failed to add asset: tribe or asset data not found`);
        }
      }
    },
    'deny_asset': (state, users, reqId) => { 
      const req = state.assetRequests.find(r => r.id === reqId); 
      if(req) {
        req.status = 'denied';
        logger.info(`Asset request denied: ${reqId}`);
      }
    },
    'add_ai_tribe': (state) => {
      const occupied = new Set(state.tribes.map(t => t.location));
      const start = state.startingLocations.find(loc => !occupied.has(loc));
      if (start) {
        const aiTribe = generateAITribe(start, state.tribes.map(t => t.tribeName));
        state.tribes.forEach(t => {
          aiTribe.diplomacy[t.id] = { status: DIPLOMATIC_STATUS.War };
          t.diplomacy[aiTribe.id] = { status: DIPLOMATIC_STATUS.War };
        });
        state.tribes.push(aiTribe);
        logger.info(`AI tribe added: ${aiTribe.tribeName} at ${aiTribe.location}`);
      } else {
        logger.warn(`Failed to add AI tribe: no available starting locations`);
      }
    },
    'propose_alliance': (state, users, { fromTribeId, toTribeId }) => {
      const fromTribe = state.tribes.find(t => t.id === fromTribeId);
      if(fromTribe) {
        state.diplomaticProposals.push({ 
          id: `proposal-${Date.now()}`, 
          fromTribeId, 
          toTribeId, 
          statusChangeTo: DIPLOMATIC_STATUS.Alliance, 
          expiresOnTurn: state.turn + 3, 
          fromTribeName: fromTribe.tribeName 
        });
        logger.info(`Alliance proposed: from ${fromTribe.tribeName} to tribe ${toTribeId}`);
      }
    },
    'sue_for_peace': (state, users, { fromTribeId, toTribeId, reparations }) => {
      const fromTribe = state.tribes.find(t => t.id === fromTribeId);
      if(fromTribe) {
        state.diplomaticProposals.push({ 
          id: `proposal-${Date.now()}`, 
          fromTribeId, 
          toTribeId, 
          statusChangeTo: DIPLOMATIC_STATUS.Neutral, 
          expiresOnTurn: state.turn + 3, 
          fromTribeName: fromTribe.tribeName, 
          reparations 
        });
        logger.info(`Peace proposal: from ${fromTribe.tribeName} to tribe ${toTribeId}`);
      }
    },
    'declare_war': (state, users, { fromTribeId, toTribeId }) => {
      const fromTribe = state.tribes.find(t => t.id === fromTribeId);
      const toTribe = state.tribes.find(t => t.id === toTribeId);
      if(fromTribe && toTribe) {
        fromTribe.diplomacy[toTribeId] = { status: DIPLOMATIC_STATUS.War };
        toTribe.diplomacy[fromTribeId] = { status: DIPLOMATIC_STATUS.War };
        logger.info(`War declared: ${fromTribe.tribeName} against ${toTribe.tribeName}`);
      }
    },
    'accept_proposal': (state, users, proposalId) => {
      const proposal = state.diplomaticProposals.find(p => p.id === proposalId);
      if (!proposal) return;
      const fromTribe = state.tribes.find(t => t.id === proposal.fromTribeId);
      const toTribe = state.tribes.find(t => t.id === proposal.toTribeId);
      if (!fromTribe || !toTribe) return;
      
      // Simplified logic for acceptance
      fromTribe.diplomacy[toTribe.id] = { status: proposal.statusChangeTo };
      toTribe.diplomacy[fromTribe.id] = { status: proposal.statusChangeTo };
      state.diplomaticProposals = state.diplomaticProposals.filter(p => p.id !== proposalId);
      logger.info(`Proposal accepted: ${proposal.id} from ${fromTribe.tribeName} to ${toTribe.tribeName}`);
    },
    'reject_proposal': (state, users, proposalId) => {
      state.diplomaticProposals = state.diplomaticProposals.filter(p => p.id !== proposalId);
      logger.info(`Proposal rejected: ${proposalId}`);
    }
  };
  
  for (const [action, handler] of Object.entries(actionHandlers)) {
    socket.on(action, createGenericHandler(handler));
  }

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// --- STATIC FILE SERVING ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START SERVER ---
const PORT = parseInt(process.env.PORT, 10) || 3000;

try {
  if (process.env.NODE_ENV === 'production') {
    // Trust proxy in production (Heroku / Render etc.)
    app.set('trust proxy', 1);
  }

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
} catch (err) {
  logger.error(`Error starting server`, err);
  process.exit(1);
}

/* -------------------------------------------------
 * Graceful shutdown
 * ------------------------------------------------- */
const gracefulShutdown = (signal) => {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }
  
  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  try {
    // Save data one last time
    if (!saveInProgress) {
      try {
        saveData();
      } catch (saveErr) {
        logger.error(`Error saving data during shutdown`, saveErr);
      }
    }
    
    // Close server connections
    io.close(() => {
      server.close(() => {
        logger.info('Closed out remaining connections.');
        
        // In development with nodemon, exit with code 0 to prevent restart
        if (process.env.NODE_ENV === 'development') {
          logger.info('Development environment detected, exiting cleanly to prevent nodemon restart.');
          process.exit(0);
        } else {
          process.exit(0);
        }
      });
    });
    
    // Force-exit if still alive after 5s (reduced from 10s)
    setTimeout(() => {
      logger.warn('Forced exit after timeout');
      process.exit(0); // Exit with success code to prevent nodemon restart
    }, 5000).unref();
  } catch (err) {
    logger.error(`Error during shutdown`, err);
    process.exit(0); // Exit with success code to prevent nodemon restart
  }
};

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err);
  
  // In development, don't exit to prevent nodemon restart loop
  if (process.env.NODE_ENV === 'development') {
    logger.warn('Development environment detected, not exiting on uncaught exception to prevent nodemon restart loop');
  } else {
    gracefulShutdown('uncaughtException');
  }
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason instanceof Error ? reason.message : reason}`, reason);
  
  // In development, don't exit to prevent nodemon restart loop
  if (process.env.NODE_ENV === 'development') {
    logger.warn('Development environment detected, not exiting on unhandled rejection to prevent nodemon restart loop');
  } else {
    gracefulShutdown('unhandledRejection');
  }
});
