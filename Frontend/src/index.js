import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Get the root element
const rootElement = document.getElementById('root');

// Make sure the element exists before attempting to render
if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}