import { useEffect, useRef, type Dispatch } from 'react';
import type { Action, State } from '../state';
import { AssetImage } from './AssetImage';
import { CalendarPage, HOLE_X } from './Page';

export const TURN_MS = 820;
export const TURN_MS_REDUCED = 200;

/** Twin-wire loops drawn in SVG over each punched hole (the asset's cut-out rings were broken). */
function Rings({ phase }: { phase: string }) {
  return (
    <div className={'rings ' + phase} aria-hidden="true">
      {HOLE_X.map((x, i) => (
        <svg key={i} className="ring" style={{ left: x + '%', ['--i' as string]: i }} viewBox="0 0 16 46">
          <path d="M4 40 V9 C4 3 6.5 1.5 8 1.5 C9.5 1.5 12 3 12 9 V40" fill="none" stroke="#141312" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M5.6 40 V10 C5.6 5.5 7 4 8 4 C9 4 10.4 5.5 10.4 10 V40" fill="none" stroke="#5d5a55" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}

type Props = { s: State; d: Dispatch<Action>; reduced: boolean; withBoard: boolean };

/** The ring-bound calendar: the photographic board underneath, live typeset pages on top, SVG rings in front.
 *  A turn renders the outgoing (or incoming) page as a non-interactive copy rotating about the ring line. */
export function Calendar({ s, d, reduced, withBoard }: Props) {
  const tr = s.turning;
  useEffect(() => {
    if (!tr) return;
    const id = window.setTimeout(() => d({ t: 'turned' }), reduced ? TURN_MS_REDUCED : TURN_MS);
    return () => window.clearTimeout(id);
  }, [tr, reduced, d]);

  const start = useRef<{ x: number; y: number; ok: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const el = e.target as HTMLElement;
    start.current = { x: e.clientX, y: e.clientY, ok: !el.closest('button, input, label, a, textarea, [role="tab"]') };
  };
  const onUp = (e: React.PointerEvent) => {
    const st = start.current; start.current = null;
    if (!st || !st.ok || s.turning) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 60) return;
    const fwd = Math.abs(dy) > Math.abs(dx) ? dy < 0 : dx < 0;
    d({ t: 'turn', to: s.page + (fwd ? 1 : -1) });
  };

  const under = tr ? (tr.dir === 1 ? tr.to : tr.from) : s.page;
  const over = tr ? (tr.dir === 1 ? tr.from : tr.to) : null;
  return (
    <div className={'calendar' + (withBoard ? ' calendar--board' : '') + (tr ? ' is-turning' : '')}>
      {withBoard && <AssetImage k="FD_PROP_01_RingBoundCalendarBase_v01__board" className="calendar__board" alt="" label="Ring-bound calendar board" />}
      <div className="calendar__pages" onPointerDown={onDown} onPointerUp={onUp}>
        <span className="calendar__edge" aria-hidden="true" />
        <div className="pageslot" key={'u' + under} inert={!!tr}>
          <CalendarPage s={s} d={d} page={under} live={!tr} />
        </div>
        {tr && over !== null && (
          <div className={'pageslot pageslot--turn ' + (tr.dir === 1 ? 'turn-out' : 'turn-in') + (reduced ? ' rm-fade' : '')} key={'o' + over} inert aria-hidden="true">
            <CalendarPage s={s} d={d} page={over} live={false} />
            <span className="pageslot__back" />
          </div>
        )}
      </div>
      <Rings phase={tr ? 'settle' : 'still'} />
    </div>
  );
}
