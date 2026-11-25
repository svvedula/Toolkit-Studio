import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import './styles/app.css';
import App from './App';
import { loadStore } from './lib/store';

loadStore();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
