import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Entry Point
 * 
 * Initializes the React application by mounting the root component into the DOM.
 * Utilizes Concurrent Mode (React 18+) and enforces StrictMode for identifying 
 * potential side effects during development.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Initialization Failed: Root element not found in the DOM.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);