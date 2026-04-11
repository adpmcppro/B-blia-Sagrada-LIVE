import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence Vite HMR WebSocket errors which are expected in this environment
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0] && typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('[vite] failed to connect to websocket') || 
        msg.includes('WebSocket closed without opened') ||
        msg.includes('WebSocket connection to') && msg.includes('failed')) {
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason && event.reason.message ? event.reason.message : '';
    if (msg.includes('WebSocket') || msg.includes('failed to connect to websocket')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
