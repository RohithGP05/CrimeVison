import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Dynamic production API gateway redirect interceptor
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  const API_URL = import.meta.env.VITE_API_URL || '';
  if (typeof url === 'string' && url.startsWith('http://localhost:5000')) {
    if (API_URL) {
      url = url.replace('http://localhost:5000', API_URL);
    }
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
