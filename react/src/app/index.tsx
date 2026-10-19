import ReactDOM from 'react-dom/client';
import '@chrisgawbill/aero-md3-core/core.css';
import '@/styles/index.css';
import '@/styles/theme.css';
import '@/styles/components.css';
import App from '@/app/App';
import '@/lib/installPrompt';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { registerServiceWorker } from '@/features/after-action-reports/utils/pushNotifications';
import { AfterActionReportsProvider } from '@/features/after-action-reports/hooks/AfterActionReportsContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

/**
 * Root-level providers must not depend on routing or selected season state.
 * Season-aware providers are mounted inside HashRouter in App.tsx.
 */
root.render(
  <ThemeProvider>
    <AuthProvider>
      <AfterActionReportsProvider>
        <App />
      </AfterActionReportsProvider>
    </AuthProvider>
  </ThemeProvider>,
);

// Installability and Web Push; failure only logs and the site works without it.
window.addEventListener('load', () => {
  registerServiceWorker();
});
