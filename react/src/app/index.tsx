import 'bootstrap/dist/css/bootstrap.css';
import ReactDOM from 'react-dom/client';
import '@chrisgawbill/aero-md3-core/core.css';
import '@/styles/index.css';
import '@/styles/theme.css';
import '@/styles/components.css';
import App from '@/app/App';
import { ListOfTeamsDataProvider } from '@/features/teams/hooks/ListOfTeamsContext';
import { ThemeProvider } from '@/lib/ThemeContext';

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
