// src/main.js - Main entry point for Radix Tribes application
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Import the App component

// Find the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

// Create a root
const root = createRoot(rootElement);

// Render the App component
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App, null)
  )
);

// Log application start
console.log('Radix Tribes application initialized');
