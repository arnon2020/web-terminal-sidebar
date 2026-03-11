import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('app');
const root = createRoot(container);

// Wrap App with ErrorBoundary to catch runtime errors
root.render(
  <ErrorBoundary showErrorDetails={process.env.NODE_ENV === 'development'}>
    <App />
  </ErrorBoundary>
);
