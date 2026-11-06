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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
        <App />
    </Provider>
  </StrictMode>,
)
