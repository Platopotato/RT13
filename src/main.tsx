import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

// Find the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a root using TypeScript type assertion
const root = createRoot(rootElement);

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
