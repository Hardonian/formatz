import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '',
          style: {
            background: 'rgb(var(--card))',
            color: 'rgb(var(--card-foreground))',
            border: '1px solid rgb(var(--border))',
          },
          success: {
            iconTheme: {
              primary: 'rgb(var(--primary))',
              secondary: 'rgb(var(--primary-foreground))',
            },
          },
          error: {
            iconTheme: {
              primary: 'rgb(var(--destructive))',
              secondary: 'rgb(var(--destructive-foreground))',
            },
          },
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
