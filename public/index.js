// This is a fallback entry point in case TypeScript transpilation fails
import React from 'react';
import { createRoot } from 'react-dom/client';

// Simple App component
const App = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Attempt to dynamically load the real App
    import('../App.tsx')
      .then(module => {
        const RealApp = module.default;
        const rootElement = document.getElementById('root');
        if (rootElement) {
          createRoot(rootElement).render(<RealApp />);
        }
      })
      .catch(error => {
        console.error('Failed to load App:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold text-amber-400">Loading Radix Tribes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4">
      <div className="max-w-md mx-auto bg-slate-800 rounded-lg shadow-xl p-6 mt-20">
        <h1 className="text-2xl font-bold text-center mb-6">Radix Tribes</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input 
              type="text"
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password"
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
              placeholder="Enter password"
            />
          </div>
          <button 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Log In
          </button>
          <div className="text-center mt-4">
            <a href="#" className="text-amber-400 hover:text-amber-300 text-sm">
              Create an account
            </a>
            <span className="text-gray-500 mx-2">|</span>
            <a href="#" className="text-amber-400 hover:text-amber-300 text-sm">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Render the fallback App
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
