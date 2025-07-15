// src/App.js - Simplified JavaScript version of the Radix Tribes App component
import React, { useState, useEffect } from 'react';

// Simple App component without TypeScript or JSX
function App() {
  // Basic state without type annotations
  const [isLoading, setIsLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  
  // Effect to simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle navigation
  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };
  
  // Render loading screen
  if (isLoading) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center bg-slate-900'
    }, 
      React.createElement('h2', {
        className: 'text-2xl text-slate-200 animate-pulse'
      }, 'Loading Wasteland...')
    );
  }
  
  // Render welcome screen
  if (currentScreen === 'welcome') {
    return React.createElement('div', {
      className: 'min-h-screen bg-slate-900 text-slate-200 p-4 flex flex-col items-center justify-center'
    }, [
      React.createElement('h1', {
        className: 'text-4xl font-bold mb-6',
        key: 'title'
      }, 'Welcome to Radix Tribes'),
      
      React.createElement('p', {
        className: 'text-xl mb-8 max-w-2xl text-center',
        key: 'description'
      }, 'A turn-based, hex-map strategy game where you lead survivor factions in a devastated wasteland. Build garrisons, research technologies, and dominate the new world.'),
      
      React.createElement('div', {
        className: 'flex space-x-4',
        key: 'buttons'
      }, [
        React.createElement('button', {
          className: 'bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold',
          onClick: () => handleNavigate('login'),
          key: 'login-btn'
        }, 'Login'),
        
        React.createElement('button', {
          className: 'bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold',
          onClick: () => handleNavigate('register'),
          key: 'register-btn'
        }, 'Register')
      ])
    ]);
  }
  
  // Simple placeholder for other screens
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-900 text-slate-200 p-4 flex flex-col items-center justify-center'
  }, [
    React.createElement('h2', {
      className: 'text-2xl mb-4',
      key: 'screen-title'
    }, `${currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1)} Screen`),
    
    React.createElement('p', {
      className: 'mb-6',
      key: 'screen-info'
    }, 'This is a simplified placeholder. The full functionality is being implemented.'),
    
    React.createElement('button', {
      className: 'bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg',
      onClick: () => handleNavigate('welcome'),
      key: 'back-btn'
    }, 'Back to Welcome')
  ]);
}

export default App;
