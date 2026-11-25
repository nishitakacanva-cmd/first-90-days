import { useState, type Dispatch } from 'react';
import { COVER, DAYS, META, PAGE_COUNT, PAL, THREADS, dayAt, type Art, type Day } from '../data/content';
import { didInteract, type Action, type State } from '../state';
import { AssetImage } from './AssetImage';
import { Interaction } from './Interactions';

/** Punched binding holes, positioned to match the holes in FD_PROP_01 (board x 36…435 at 1.3×, measured). */
export const HOLE_X = [36, 59, 81, 104, 127, 150, 172, 196, 219, 243, 267, 291, 315, 339, 363, 387, 411, 435].map(x => (x - 9) / 454 * 100);

function Holes() {
  return <div className="holes" aria-hidden="true">{HOLE_X.map((x, i) => <i key={i} style={{ left: x + '%' }} />)}</div>;
}

/** A small SVG binder clip that grips the page edge when the page is clipped. */
function BinderClip() {
  return (
    <svg className="pclip" viewBox="0 0 60 70" aria-hidden="true">
      <path d="M14 8 Q30 -6 46 8" fill="none" stroke="#9a9a96" strokeWidth="3" />
      <path d="M18 8 L22 30 M42 8 L38 30" stroke="#b8b8b2" strokeWidth="3" fill="none" />
      <path d="M8 30 H52 L48 64 H12 Z" fill="#1d1c1a" />
      <path d="M12 34 H48" stroke="#3a3936" strokeWidth="2" />
    </svg>
  );
}

/** Hand-drawn pencil ring around the day number. */
function PencilRing() {
  return (
    <svg className="pring" viewBox="0 0 120 90" aria-hidden="true">
      <path d="M18 52 C10 22 52 6 86 12 C118 18 116 62 84 76 C52 90 12 78 14 46 C16 30 34 18 52 16" fill="none" stroke="#4b4740" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

type PP = { s: State; d: Dispatch<Action>; page: number; live: boolean };

/** Studio Bridge illustration printed on the page: a character and a sticker, popping in when the page arrives. */
function PageArt({ art, cls = '' }: { art: Art; cls?: string }) {
  return (
    <div className={'part ' + cls} aria-hidden="true">
      <AssetImage k={art.sticker} className="part__st" alt="" />
      <AssetImage k={art.char} className="part__ch" alt="" />
    </div>
  );
}

/** The day's explanation opens only when requested and never automatically reopens. */
export function WhyNote({ s, day, live }: { s: State; day: Day; live: boolean }) {
  const done = live && didInteract(s, day);
  const [open, setOpen] = useState(false);
  if (!done) return null;
  return open ? (
    <div className="whynote" role="status">
      <AssetImage k="SB_pink-pal-thinking" className="whynote__pal" alt="" />
      <p><b>{PAL.whyLabel}</b>{day.why}</p>
      <button type="button" className="whynote__x" onClick={() => setOpen(false)} aria-label="Hide why it matters">×</button>
    </div>
  ) : (
    <button type="button" className="whybtn" onClick={() => setOpen(true)} aria-label={`Why it matters: ${day.why}`}>
      <AssetImage k="SB_pink-pal-thinking" alt="" /><span>Why it matters</span>
    </button>
  );
}

export function CalendarPage({ s, d, page, live }: PP) {
  const day = dayAt(page);
  const t = live ? 0 : -1;
  const nav = (
    <div className="pnav">
      {page > 0 && <button type="button" className="pnav__prev" tabIndex={t} onClick={() => d({ t: 'turn', to: page - 1 })} aria-label="Turn back a page">← {page === 1 ? 'Cover' : 'Back'}</button>}
      {page < PAGE_COUNT - 1 && (
        <button type="button" className="pnav__next" tabIndex={t} onClick={() => d({ t: 'turn', to: page + 1 })} aria-label={`Turn the page to Day ${DAYS[page].label}`}>
          <span>Day {DAYS[page].label}</span><b aria-hidden="true" />
        </button>
      )}
    </div>
  );
  if (!day) {
    return (
      <article className="cpage cpage--cover" aria-label="Cover: The First 90 Days">
        <Holes />
        <PageArt art={COVER.art} cls="part--cover" />
        <AssetImage k="SB_sb-badge" className="cover__sb" alt="Studio Bridge: design, learn, work" />
        <div className="cpage__in">
          <header className="cpage__top"><span>{META.attribution.toUpperCase()}</span><span>DAY 00 — 90</span></header>
          <h1 className="cover__title">THE FIRST<br /><span className="cover__hl">90 DAYS</span></h1>
          <p className="cover__sub">{META.subtitle}</p>
          <div className="cover__grid" aria-hidden="true">{Array.from({ length: 91 }, (_, i) => { const hit = DAYS.find(x => x.n === i); return <i key={i} className={hit ? 'on' : ''} style={hit ? { background: THREADS[hit.threads[0]].color, animationDelay: (i * 18) + 'ms' } : undefined} />; })}</div>
          <p className="cover__note"><b>Research note.</b> {META.researchNote}</p>
          <ul className="cover__how">{COVER.how.map(h => <li key={h}>{h}</li>)}</ul>
          <button type="button" className="ix-btn ix-btn--go cover__cta" tabIndex={t} onClick={() => d({ t: 'turn', to: 1 })}>{COVER.cta} →</button>
        </div>
        {nav}
      </article>
    );
  }
  const notes = s.notes[day.id] ?? [];
  return (
    <article className={'cpage cpage--day has-art ix-' + day.interaction.type} aria-label={`Day ${day.label}: ${day.headline}`} data-day={day.id} style={{ ['--tc' as string]: THREADS[day.threads[0]].color }}>
      <Holes />
      <span className="tape" aria-hidden="true" />
      <PageArt art={day.art} cls={'part--' + day.id} />
      {s.clips[day.id] && <BinderClip />}
      <div className="cpage__in">
        <header className="cpage__top"><span>THE FIRST 90 DAYS</span><span className="mono">DAY {day.label}</span></header>
        <div className="cpage__head">
          <div className="cpage__num" aria-hidden="true"><span>{day.label}</span>{s.marks[day.id] && <PencilRing />}</div>
          <div className="cpage__titles">
            <p className="cpage__theme" style={{ color: THREADS[day.threads[0]].color }}>{day.theme.toUpperCase()}</p>
            <h2 className="cpage__h">{day.headline}</h2>
          </div>
        </div>
        <div className="cpage__body">
          <div className="persp" role="group" aria-label="Whose side of the day">
            <button type="button" tabIndex={t} aria-pressed={s.persp === 'student'} onClick={() => d({ t: 'persp', p: 'student' })}>New designer</button>
            <button type="button" tabIndex={t} aria-pressed={s.persp === 'team'} onClick={() => d({ t: 'persp', p: 'team' })}>The team</button>
          </div>
          <p className="cpage__text" aria-live={live ? 'polite' : undefined}>{s.persp === 'team' ? day.team : day.student}</p>
        </div>
        <div className="cpage__ix">
          <Interaction s={s} d={d} day={day} live={live} />
        </div>
        <footer className="cpage__foot">
          <span className="threads">{day.threads.map(k => <i key={k} style={{ ['--tc' as string]: THREADS[k].color }}>{THREADS[k].short}</i>)}</span>
          <span className="cpage__fine">Illustrative composite · not a real participant’s diary</span>
        </footer>
      </div>
      {notes.length > 0 && (
        <ul className="pnotes" aria-label="Your sticky notes on this day">
          {notes.map((n, i) => (
            <li key={i} style={{ ['--i' as string]: i }}>
              <span className="hand">{n}</span>
              <button type="button" tabIndex={t} onClick={() => d({ t: 'delNote', day: day.id, i })} aria-label={`Remove note: ${n}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {nav}
    </article>
  );
}
