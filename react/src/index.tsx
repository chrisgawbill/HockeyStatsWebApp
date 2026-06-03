import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import ReactDOM from 'react-dom/client';
import './index.css';
import './style/components.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import { ListOfTeamsDataProvider } from './Data/Context/ListOfTeamsContext';
import { ThemeProvider } from './Data/Context/ThemeContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

/**
 * Root-level providers must not depend on routing or selected season state.
 * Season-aware providers are mounted inside HashRouter in App.tsx.
 */
root.render(
  <ThemeProvider>
    <ListOfTeamsDataProvider>
      <App />
    </ListOfTeamsDataProvider>
  </ThemeProvider>,
);

reportWebVitals();
