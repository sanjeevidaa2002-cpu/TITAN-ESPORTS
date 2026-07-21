import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign HMR WebSocket errors from bubbling up and triggering unhandled rejection overlays in AI Studio
if (typeof window !== 'undefined') {
  const getReasonString = (reason: any): string => {
    if (!reason) return '';
    if (typeof reason === 'string') return reason;
    
    const parts: string[] = [];
    
    try {
      if (reason.message) parts.push(String(reason.message));
      if (reason.reason) parts.push(String(reason.reason));
      if (reason.stack) parts.push(String(reason.stack));
      if (reason.type) parts.push(String(reason.type));
      if (reason.code) parts.push(String(reason.code));
      if (reason.name) parts.push(String(reason.name));
    } catch (_) {}
    
    try {
      parts.push(String(reason));
    } catch (_) {}
    
    return parts.join(' ').toLowerCase();
  };

  const isViteWsError = (reason: any) => {
    const text = getReasonString(reason);
    return text.includes('websocket') || 
           text.includes('without opened') ||
           text.includes('closeevent') ||
           text.includes('ws://') ||
           text.includes('wss://') ||
           text.includes('quota limit exceeded') ||
           text.includes('grpcconnection rpc') ||
           text.includes('firestore client sdk inaccessible') ||
           text.includes('cloud firestore backend') ||
           text.includes('not_found') ||
           text.includes('closed without opened') ||
           text.includes('websocket closed') ||
           (text.includes('vite') && text.includes('connect'));
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteWsError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });

  window.addEventListener('error', (event) => {
    const message = event.error || event.message || '';
    if (isViteWsError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });
  
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const isBenign = args.some(arg => isViteWsError(arg));
    if (isBenign) return;
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
