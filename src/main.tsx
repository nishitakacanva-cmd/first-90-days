import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/archivo/latin-400.css';
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo-narrow/latin-700.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import '@fontsource/kalam/latin-400.css';
import './styles.css';
import './story.css';
import App from './App';
import { asset } from './data/assets';
import { COVER } from './data/content';

// Fetch the desk and cover artwork before the first calendar render.
for (const key of ['FD_ENV_01_OverheadDesk_v01', COVER.art.char, COVER.art.sticker, 'FD_PROP_01_RingBoundCalendarBase_v01__board']) {
  const link = document.createElement('link');
  link.rel = 'preload'; link.as = 'image'; link.href = asset(key).path;
  link.fetchPriority = 'high'; document.head.appendChild(link);
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
