import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Lazy-load the root <App /> component so Vite bundles it
 * and the browser never sees raw `.tsx` source.  Wrapping the
 * lazy component in <Suspense> guarantees we don’t render until
 * the module is fully transpiled/loaded.
 */
const App = React.lazy(() => import('../App'));

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
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl font-bold text-amber-400">
            Loading Radix Tribes…
          </div>
        </div>
      }
    >
      <App />
    </React.Suspense>
  </React.StrictMode>
);
