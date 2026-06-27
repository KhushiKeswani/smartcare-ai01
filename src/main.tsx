import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence MetaMask/extension connection errors often thrown inside preview iframes
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('MetaMask') || 
      msg.includes('metamask') || 
      msg.includes('wallet') || 
      msg.includes('extension') ||
      msg.includes('injection')
    ) {
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = (typeof reason === 'string' ? reason : reason.message || '').toLowerCase();
      if (
        msg.includes('metamask') || 
        msg.includes('wallet') || 
        msg.includes('extension') ||
        msg.includes('rpc')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

