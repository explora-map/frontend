// main.jsx
// React entry point. Imports global CSS before mounting the app
// so that CSS custom properties are available to all components.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/styles/global.css';
import './assets/styles/auth.css';
import './assets/styles/dashboard.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);