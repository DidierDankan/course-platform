import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted theme fonts (brutal: Space Grotesk + JetBrains Mono, cinematic: Manrope).
// Browsers only download a font file once some text actually uses it.
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from './store';

// After a deploy, a tab opened before it still asks for the old page files, which no longer exist, so opening a page
// fails. Vite reports that as vite:preloadError: reload once to get the new version. The timestamp guard stops a loop
// when the file is really missing (the RouteErrorBoundary then shows its "Reload the page" message instead).
const RELOAD_KEY = 'lumen-chunk-reload-at';
const RELOAD_GUARD_MS = 10_000;
window.addEventListener('vite:preloadError', (event) => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last < RELOAD_GUARD_MS) return; // just reloaded for this: let the error boundary handle it
  event.preventDefault(); // we handle it: don't rethrow
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
        <App />
    </Provider>
  </StrictMode>,
)
