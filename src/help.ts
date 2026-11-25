import type { PropKey } from './data/content';

const KEY = 'first-90-days-help-v1';
export function helpPreferences(): { enabled: boolean; seen: Partial<Record<PropKey, true>> } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { enabled: saved.enabled === true, seen: saved.seen || {} };
  } catch { return { enabled: false, seen: {} }; }
}
export function saveHelp(enabled: boolean, seen: Partial<Record<PropKey, true>>) {
  try { localStorage.setItem(KEY, JSON.stringify({ enabled, seen })); } catch { /* optional preference */ }
}
