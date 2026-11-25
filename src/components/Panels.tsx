import { useEffect, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { DAYS, DISCLAIMERS, FINDING, META, SOURCES, THREADS, THREAD_KEYS, dayAt, type SourceKey, type ThreadKey } from '../data/content';
import { learnedItems, type Action, type State } from '../state';
import { AssetImage } from './AssetImage';
import { ExperienceMap } from './Interactions';

export function Modal({ open, onClose, label, className = '', children }: { open: boolean; onClose: () => void; label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={ref} className={'modal ' + className} aria-label={label} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
      {open && children}
    </dialog>
  );
}
const X = ({ onClick }: { onClick: () => void }) => <button type="button" className="xbtn" onClick={onClick} aria-label="Close">×</button>;

/* ---------- Day index (the torn-off page pile) ---------- */
export function IndexPanel({ s, d }: { s: State; d: Dispatch<Action> }) {
  const close = () => d({ t: 'panel', p: null });
  return (
    <div className="sheet sheet--index">
      <X onClick={close} />
      <h2>Day index</h2>
      <p className="muted">Twelve turning points between the offer and Day 90. ✓ opened · ◯ pencil-marked · ▮ clipped.</p>
      <ol className="dindex">
        <li><button type="button" className={s.page === 0 ? 'is-here' : ''} onClick={() => d({ t: 'turn', to: 0 })}><span className="mono">COVER</span><b>{META.title}</b></button></li>
        {DAYS.map((x, i) => (
          <li key={x.id}>
            <button type="button" className={s.page === i + 1 ? 'is-here' : ''} onClick={() => d({ t: 'turn', to: i + 1 })} aria-current={s.page === i + 1 ? 'page' : undefined}>
              <span className="mono">DAY {x.label}</span>
              <b>{x.headline}</b>
              <span className="dindex__meta">
                <span className="threads">{x.threads.map(k => <i key={k} style={{ ['--tc' as string]: THREADS[k].color }}>{THREADS[k].short}</i>)}</span>
                <span className="dindex__st" aria-label={[s.visited[x.id] && 'opened', s.marks[x.id] && 'pencil-marked', s.clips[x.id] && 'clipped', s.notes[x.id]?.length && `${s.notes[x.id].length} note(s)`].filter(Boolean).join(', ') || 'not opened'}>
                  {s.visited[x.id] ? '✓' : ''}{s.marks[x.id] ? ' ◯' : ''}{s.clips[x.id] ? ' ▮' : ''}{s.notes[x.id]?.length ? ` ✎${s.notes[x.id].length}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Side evidence drawer ---------- */
export function EvidenceDrawer({ s, d }: { s: State; d: Dispatch<Action> }) {
  const day = dayAt(s.page);
  const keys: SourceKey[] = day ? day.sources : ['sb', 'bauer2010', 'deloitte2025'];
  return (
    <aside className="drawer" aria-label="Evidence drawer">
      <X onClick={() => d({ t: 'panel', p: null })} />
      <span className="drawer__tab">RESEARCH NOTES</span>
      <h2>{day ? `Day ${day.label}: what this page rests on` : 'What this calendar rests on'}</h2>
      {day && <p className="drawer__basis">{day.basis}</p>}
      <h3>Sources</h3>
      <ul className="srcs">
        {keys.map(k => { const x = SOURCES[k]; return (
          <li key={k}><b>{x.title}</b> <span className="muted">— {x.publisher}</span><p>{x.note}</p>{x.url && <a href={x.url} target="_blank" rel="noreferrer">Open source ↗</a>}</li>
        ); })}
      </ul>
      <h3>Read this before quoting the calendar</h3>
      <ul className="disc">{DISCLAIMERS.map(t => <li key={t}>{t}</li>)}</ul>
    </aside>
  );
}

/* ---------- Sticky note editor ---------- */
export function NoteEditor({ s, d }: { s: State; d: Dispatch<Action> }) {
  const [v, setV] = useState('');
  const day = dayAt(s.page);
  return (
    <form className="sheet sheet--note" onSubmit={e => { e.preventDefault(); d({ t: 'addNote', text: v }); }}>
      <X onClick={() => d({ t: 'panel', p: null })} />
      <h2>A note on Day {day?.label}</h2>
      <label className="notepad">
        <span className="sr-only">Your note (up to 140 characters)</span>
        <textarea autoFocus maxLength={140} rows={4} value={v} onChange={e => setV(e.target.value)} placeholder="What would you want to remember about this day?" />
      </label>
      <p className="muted">{140 - v.length} characters left. Notes stay in this tab only and clear on reset or close.</p>
      <div className="ix-row"><button type="submit" className="ix-btn ix-btn--go" disabled={!v.trim()}>Stick it on the page</button><button type="button" className="ix-btn ix-btn--ghost" onClick={() => d({ t: 'panel', p: null })}>Cancel</button></div>
    </form>
  );
}

/* ---------- Sketchbook: notes to self ---------- */
export function Sketchbook({ s, d }: { s: State; d: Dispatch<Action> }) {
  const seen = DAYS.filter(x => s.visited[x.id]);
  const own = DAYS.flatMap(x => (s.notes[x.id] ?? []).map(n => ({ day: x.label, n })));
  return (
    <div className="sketchbook">
      <X onClick={() => d({ t: 'panel', p: null })} />
      <AssetImage k="FD_PROP_10_SketchbookOpen_v01__clean" className="sketchbook__img" alt="" label="Open sketchbook" />
      <div className="sketchbook__l">
        <h2 className="hand">Notes to self</h2>
        {seen.length ? <ul className="hand">{seen.map(x => <li key={x.id}><b>D{x.label}</b> {x.slip}</li>)}</ul> : <p className="hand muted">Empty so far. Turn the calendar and the pages will leave something here.</p>}
      </div>
      <div className="sketchbook__r">
        <h2 className="hand">Mine</h2>
        {own.length ? <ul className="hand">{own.map((x, i) => <li key={i}><b>D{x.day}</b> {x.n}</li>)}</ul> : <p className="hand muted">Your sticky notes will be copied here.</p>}
        {s.keep.length > 0 && <p className="hand"><b>Keeping:</b> {s.keep.join(', ')}</p>}
      </div>
    </div>
  );
}

/* ---------- Print panel ---------- */
export const PDFS = [
  { f: 'print/TheFirst90Days_A3_PrintReady.pdf', label: 'A3 calendar · 14 pages', size: '297 × 420 mm trim, 3 mm bleed, crop marks' },
  { f: 'print/TheFirst90Days_A2_PrintReady.pdf', label: 'A2 wall calendar · 14 pages', size: '420 × 594 mm trim, 3 mm bleed, crop marks' },
  { f: 'print/TheFirst90Days_ProductionNotes.pdf', label: 'Production & binding notes · 1 page', size: 'A4' }
];
export function PrintPanel({ d }: { d: Dispatch<Action> }) {
  return (
    <div className="sheet sheet--print">
      <X onClick={() => d({ t: 'panel', p: null })} />
      <h2>Print the calendar</h2>
      <p>The printed calendar is typeset separately as vector PDF (fonts embedded, no photographs), so it stays sharp at A3 and A2. It includes a fill-in prompt on every day.</p>
      <ul className="pdfs">{PDFS.map(p => <li key={p.f}><a className="ix-btn" href={p.f} download>{p.label} ↓</a><span className="muted">{p.size}</span></li>)}</ul>
      <h3>Binding</h3>
      <ul className="disc">
        <li>Top-edge Wire-O (twin loop) with a calendar hanger: suggested 3:1 pitch for A3, 2:1 for A2. Holes centred about 6 mm (A3) / 8 mm (A2) below the trim edge. Confirm with your binder.</li>
        <li>Nothing but the page background sits in the top 15 mm (A3) / 21 mm (A2) binding zone.</li>
        <li>Suggested stock: 250–300 gsm uncoated, printed single-sided; 2 mm greyboard back.</li>
        <li>Colour is set in CMYK without an ICC output intent. Ask your printer for a hard proof first.</li>
      </ul>
      <button type="button" className="ix-btn ix-btn--ghost" onClick={() => { d({ t: 'panel', p: null }); window.setTimeout(() => window.print(), 50); }}>Print just this page from the browser</button>
    </div>
  );
}

/* ---------- Finding ---------- */
function threadLines(s: State, k: ThreadKey): { day: string; text: string; seen: boolean }[] {
  return DAYS.filter(x => x.threads.includes(k) && x.interaction.type !== 'map').map(x => ({ day: x.label, text: x.slip, seen: !!s.visited[x.id] }));
}
export function summaryText(s: State): string {
  const out: string[] = [META.title, FINDING.headline, ''];
  for (const k of THREAD_KEYS) {
    out.push(THREADS[k].label.toUpperCase());
    for (const l of threadLines(s, k)) out.push(`  Day ${l.day}: ${l.seen ? l.text : '(' + FINDING.notOpened.toLowerCase() + ')'}`);
    if (k === 'self') {
      const L = learnedItems(s); if (L.length) out.push('  Learned from (Day 30): ' + L.join('; '));
      if (s.keep.length) out.push('  Keeping (Day 75): ' + s.keep.join('; '));
    }
    out.push('');
  }
  const notes = DAYS.flatMap(x => (s.notes[x.id] ?? []).map(n => `  Day ${x.label}: ${n}`));
  if (notes.length) { out.push('MY NOTES', ...notes, ''); }
  out.push(FINDING.close, '', META.researchNote, META.composite, META.attribution);
  return out.join('\n');
}

export function Finding({ s, d }: { s: State; d: Dispatch<Action> }) {
  const [msg, setMsg] = useState('');
  const L = learnedItems(s);
  const copy = async () => {
    const t = summaryText(s);
    try { await navigator.clipboard.writeText(t); setMsg('Copied to the clipboard.'); }
    catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); setMsg(ok ? 'Copied to the clipboard.' : 'Copy was blocked here. Use Save instead.'); }
  };
  const save = () => {
    const url = URL.createObjectURL(new Blob([summaryText(s)], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'the-first-90-days.txt'; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(window.self !== window.top ? 'Saved — if nothing downloaded, this preview blocks downloads; use Copy.' : 'Saved as the-first-90-days.txt.');
  };
  return (
    <div className="finding" role="dialog" aria-modal="true" aria-labelledby="finding-h">
      <div className="finding__card">
        <div className="finding__top">
          <div className="finding__lead">
            <AssetImage k="SB_pink-pal-celebrate" className="finding__pal" alt="" />
            <span className="attribution">{META.attribution}</span>
            <h1 id="finding-h">{FINDING.headline}</h1>
            <p className="finding__intro">{FINDING.intro}</p>
          </div>
          <div className="finding__map">
            <h2>YOUR 90 DAYS · {DAYS.filter(x => s.visited[x.id]).length} OF {DAYS.length} PAGES OPENED</h2>
            <ExperienceMap s={s} d={d} live={false} compact />
            <p>Each square is a day. Outlined squares are the twelve turning points; dots show their threads.</p>
          </div>
        </div>
        <div className="finding__threads">
          {THREAD_KEYS.map(k => (
            <section key={k} style={{ ['--tc' as string]: THREADS[k].color }}>
              <h2>{THREADS[k].label}</h2>
              <ul>{threadLines(s, k).map(l => <li key={l.day} className={l.seen ? '' : 'is-unseen'}><span className="mono">D{l.day}</span> {l.seen ? l.text : FINDING.notOpened}</li>)}</ul>
              {k === 'self' && L.length > 0 && <p className="finding__yours"><b>Learned from:</b> {L.join(' · ')}</p>}
              {k === 'self' && s.keep.length > 0 && <p className="finding__yours"><b>Keeping:</b> {s.keep.join(' · ')}</p>}
            </section>
          ))}
        </div>
        <p className="finding__close">{FINDING.close}</p>
        <div className="ix-row ix-row--center">
          <button type="button" className="ix-btn" onClick={copy}>Copy summary</button>
          <button type="button" className="ix-btn" onClick={save}>Save .txt</button>
          <button type="button" className="ix-btn" onClick={() => window.print()}>Print summary</button>
          <button type="button" className="ix-btn ix-btn--ghost" onClick={() => d({ t: 'backToDesk' })} autoFocus>Back to the calendar</button>
          <button type="button" className="ix-btn ix-btn--ghost" onClick={() => d({ t: 'reset' })}>Start again</button>
        </div>
        <p className="finding__msg" role="status">{msg}</p>
        <p className="finding__fine">{META.researchNote} {META.composite} Nothing is scored.</p>
      </div>
    </div>
  );
}

/** Print-only copy of the summary (shown by the print stylesheet when the finding is open). */
export function PrintSummary({ s }: { s: State }) {
  return <pre className="print-summary" aria-hidden="true">{summaryText(s)}</pre>;
}
