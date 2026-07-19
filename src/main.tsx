import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign HMR WebSocket errors from bubbling up and triggering unhandled rejection overlays in AI Studio
if (typeof window !== 'undefined') {
  const isViteWsError = (msg: string) => {
    const lowerMsg = String(msg).toLowerCase();
    return lowerMsg.includes('websocket') || 
           lowerMsg.includes('without opened') ||
           (lowerMsg.includes('vite') && lowerMsg.includes('connect'));
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (isViteWsError(reasonStr)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const message = String(event.message || event.error?.message || event.error || '');
    if (isViteWsError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (isViteWsError(msg)) return;
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
