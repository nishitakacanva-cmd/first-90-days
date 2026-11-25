import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { initial, reducer, sfxFor, LIGHTS, type Action } from './state';
import { play } from './sound';
import { Confetti } from './components/Fun';
import { DeskScene } from './scenes/DeskScene';
import { EvidenceDrawer, Finding, IndexPanel, Modal, NoteEditor, PrintPanel, PrintSummary, Sketchbook } from './components/Panels';
import { META, PAGE_COUNT, dayAt } from './data/content';
import { AssetImage } from './components/AssetImage';
import { helpPreferences, saveHelp } from './help';

const BASE_W = 1376, BASE_H = 768, BAR = 52, MIN_STAGE_SCALE = 0.84;

function useReducedMotion() {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [r, setR] = useState(!!q?.matches);
  useEffect(() => { if (!q) return; const f = () => setR(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, [q]);
  return r;
}

export default function App() {
  const [s, raw] = useReducer(reducer, initial, base => {const prefs=helpPreferences(); return {...base, hints:prefs.enabled, tried:prefs.seen};});
  useEffect(() => { saveHelp(s.hints, s.tried); }, [s.hints, s.tried]);
  // Every action goes through here so it can make its sound (when sound is on).
  const sref = useRef(s); sref.current = s;
  const d = useCallback((a: Action) => { const cur = sref.current; if (cur.sound) play(sfxFor(a, cur)); raw(a); }, []);
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [avail, setAvail] = useState(0);
  const [mode, setMode] = useState<'stage' | 'stack'>('stage');

  useLayoutEffect(() => {
    function fit() {
      const w = wrapRef.current?.clientWidth ?? window.innerWidth;
      const h = window.innerHeight - BAR;
      const sc = Math.min(w / BASE_W, h / BASE_H);
      setScale(sc); setAvail(h);
      setMode(sc < MIN_STAGE_SCALE || window.innerWidth < 900 ? 'stack' : 'stage');
    }
    fit();
    const ro = new ResizeObserver(fit); if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  // Keyboard: ←/→ or PgUp/PgDn turn pages, Home/End jump, I index, L light, E evidence.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && s.tip) { d({ t: 'tipClose' }); return; }
      if (s.phase !== 'desk' || s.panel || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [role="tab"], dialog')) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); d({ t: 'turn', to: s.page + 1 }); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); d({ t: 'turn', to: s.page - 1 }); }
      else if (k === 'Home') { e.preventDefault(); d({ t: 'turn', to: 0 }); }
      else if (k === 'End') { e.preventDefault(); d({ t: 'turn', to: PAGE_COUNT - 1 }); }
      else if (k === 'i' || k === 'I') d({ t: 'panel', p: 'index' });
      else if (k === 'e' || k === 'E') d({ t: 'panel', p: 'evidence' });
      else if (k === 'l' || k === 'L') { const i = LIGHTS.findIndex(x => x.id === s.light); d({ t: 'light', l: LIGHTS[(i + 1) % LIGHTS.length].id }); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.phase, s.panel, s.page, s.light, s.tip, d]);

  const day = dayAt(s.page);
  const closePanel = () => d({ t: 'panel', p: null });
  return (
    <div className={'app mode-' + mode + (reduced ? ' rm' : '') + (s.phase === 'finding' ? ' is-finding' : '')}>
      <header className="topbar">
        <div className="topbar__brand"><AssetImage k="SB_sb-mark" className="topbar__mark" alt="Studio Bridge" /><b>The First 90 Days</b><span>{META.attribution}</span></div>
        <p className="topbar__where" aria-live="off"><span className="mono">{day ? `DAY ${day.label}` : 'COVER'}</span><span>{s.page + 1} / {PAGE_COUNT}</span></p>
        <nav className="topbar__nav" aria-label="Calendar controls">
          <button type="button" className="tbtn" onClick={() => d({ t: 'turn', to: s.page - 1 })} disabled={s.page === 0 || !!s.turning} aria-label="Previous page">←</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'turn', to: s.page + 1 })} disabled={s.page === PAGE_COUNT - 1 || !!s.turning} aria-label="Next page">→</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'index' })}>Index</button>
          <label className="tlight"><span>Light</span>
            <select value={s.light} onChange={e => { d({ t: 'light', l: e.target.value as typeof s.light }); d({ t: 'tip', k: 'light' }); }} aria-label="Lighting">
              {LIGHTS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'evidence' })} aria-pressed={s.panel === 'evidence'}>Evidence</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'print' })}>Print</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'hints' })} aria-pressed={s.hints} title="Optional hints appear once per object. Dismissed hints stay hidden.">Hints {s.hints ? 'on' : 'off'}</button>
          <button type="button" className="tbtn tbtn--icon" onClick={() => { raw({ t: 'sound' }); if (!s.sound) play('ding'); }} aria-pressed={s.sound} aria-label={s.sound ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'} title={s.sound ? 'Sound on' : 'Sound off'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />{s.sound ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg>
          </button>
          <button type="button" className="tbtn tbtn--ghost" onClick={() => d({ t: 'reset' })}>Reset</button>
        </nav>
      </header>

      <main className="desk" ref={wrapRef} inert={s.phase !== 'desk'} aria-hidden={s.phase !== 'desk'}>
        <DeskScene s={s} d={d} mode={mode} scale={scale} reduced={reduced} avail={avail} />
      </main>

      {s.panel === 'evidence' && <EvidenceDrawer s={s} d={d} />}
      <Modal open={s.panel === 'index'} onClose={closePanel} label="Day index"><IndexPanel s={s} d={d} /></Modal>
      <Modal open={s.panel === 'note'} onClose={closePanel} label="Write a sticky note"><NoteEditor s={s} d={d} /></Modal>
      <Modal open={s.panel === 'sketch'} onClose={closePanel} label="Sketchbook: notes to self" className="modal--sketch"><Sketchbook s={s} d={d} /></Modal>
      <Modal open={s.panel === 'print'} onClose={closePanel} label="Print the calendar"><PrintPanel d={d} /></Modal>
      {s.phase === 'finding' && <Finding s={s} d={d} />}
      {s.phase === 'finding' && <PrintSummary s={s} />}
      {s.burst > 0 && !reduced && <Confetti key={s.burst} />}
      <p className="sr-only" role="status" aria-live="polite">{s.announce}</p>
    </div>
  );
}
