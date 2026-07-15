import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ProfileProvider } from './context/ProfileContext';
import { RemindersProvider } from './context/RemindersContext';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <AccessibilityProvider>
      <ProfileProvider>
        <RemindersProvider>
          <App />
        </RemindersProvider>
      </ProfileProvider>
    </AccessibilityProvider>
  </StrictMode>,
);
