import { io, Socket } from 'socket.io-client';

/**
 * Environment detection
 */
export const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
export const isProduction = !isDevelopment;

/**
 * API and Socket Configuration
 */
interface ConfigSettings {
  apiBaseUrl: string;
  socketUrl: string;
  socketOptions: {
    transports: string[];
    reconnection: boolean;
    reconnectionAttempts: number;
    reconnectionDelay: number;
    timeout: number;
    autoConnect: boolean;
  };
}

// Default configuration for development environment
const developmentConfig: ConfigSettings = {
  apiBaseUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000',
  socketOptions: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    autoConnect: true,
  },
};

// Configuration for production environment
const productionConfig: ConfigSettings = {
  // Use environment variable if available, otherwise default to relative path
  apiBaseUrl: import.meta.env.VITE_API_URL || window.location.origin,
  socketUrl: import.meta.env.VITE_SOCKET_URL || window.location.origin,
  socketOptions: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 30000,
    autoConnect: true,
  },
};

// Select the appropriate config based on environment
export const config: ConfigSettings = isDevelopment ? developmentConfig : productionConfig;

/**
 * Socket connection management
 */
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(config.socketUrl, config.socketOptions);
    
    // Set up global socket event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });
  }
  
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Connection status monitoring
 */
export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

export const getConnectionStatus = (): string => {
  if (!socket) return CONNECTION_STATES.DISCONNECTED;
  
  switch (socket.connected) {
    case true:
      return CONNECTION_STATES.CONNECTED;
    case false:
      return socket.connecting ? CONNECTION_STATES.CONNECTING : CONNECTION_STATES.DISCONNECTED;
    default:
      return CONNECTION_STATES.DISCONNECTED;
  }
};

/**
 * API helpers
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}${formattedEndpoint}`;
};

/**
 * Environment information
 */
export const getEnvironmentInfo = (): { environment: string; apiUrl: string; socketUrl: string } => {
  return {
    environment: isDevelopment ? 'development' : 'production',
    apiUrl: config.apiBaseUrl,
    socketUrl: config.socketUrl,
  };
};
