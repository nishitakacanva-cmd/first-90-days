import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { initial, reducer, LIGHTS } from './state';
import { DeskScene } from './scenes/DeskScene';
import { EvidenceDrawer, Finding, IndexPanel, Modal, NoteEditor, PrintPanel, PrintSummary, Sketchbook } from './components/Panels';
import { META, PAGE_COUNT, dayAt } from './data/content';

const BASE_W = 1376, BASE_H = 768, BAR = 52, MIN_STAGE_SCALE = 0.84;

function useReducedMotion() {
  const q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [r, setR] = useState(!!q?.matches);
  useEffect(() => { if (!q) return; const f = () => setR(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, [q]);
  return r;
}

export default function App() {
  const [s, d] = useReducer(reducer, initial);
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
  }, [s.phase, s.panel, s.page, s.light]);

  const day = dayAt(s.page);
  const closePanel = () => d({ t: 'panel', p: null });
  return (
    <div className={'app mode-' + mode + (reduced ? ' rm' : '') + (s.phase === 'finding' ? ' is-finding' : '')}>
      <header className="topbar">
        <div className="topbar__brand"><b>The First 90 Days</b><span>{META.attribution}</span></div>
        <p className="topbar__where" aria-live="off"><span className="mono">{day ? `DAY ${day.label}` : 'COVER'}</span><span>{s.page + 1} / {PAGE_COUNT}</span></p>
        <nav className="topbar__nav" aria-label="Calendar controls">
          <button type="button" className="tbtn" onClick={() => d({ t: 'turn', to: s.page - 1 })} disabled={s.page === 0 || !!s.turning} aria-label="Previous page">←</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'turn', to: s.page + 1 })} disabled={s.page === PAGE_COUNT - 1 || !!s.turning} aria-label="Next page">→</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'index' })}>Index</button>
          <label className="tlight"><span>Light</span>
            <select value={s.light} onChange={e => d({ t: 'light', l: e.target.value as typeof s.light })} aria-label="Lighting">
              {LIGHTS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'evidence' })} aria-pressed={s.panel === 'evidence'}>Evidence</button>
          <button type="button" className="tbtn" onClick={() => d({ t: 'panel', p: 'print' })}>Print</button>
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
      <p className="sr-only" role="status" aria-live="polite">{s.announce}</p>
    </div>
  );
}
