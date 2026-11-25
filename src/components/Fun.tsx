import { useEffect, useMemo, type CSSProperties, type Dispatch } from 'react';
import { PAL, PROPS, type PropKey } from '../data/content';
import type { Action, State } from '../state';
import { AssetImage } from './AssetImage';

const BRAND = ['#FF3DA6', '#2558FF', '#FFE833', '#37DEC0', '#FFFFFF'];

/** A one-shot confetti burst in Studio Bridge colours (Day 00 letter, the finding). */
export function Confetti() {
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    i, x: 20 + Math.random() * 60, dx: (Math.random() - 0.5) * 70, rot: Math.random() * 720 - 360,
    delay: Math.random() * 0.25, dur: 1.6 + Math.random() * 1.1, c: BRAND[i % BRAND.length], w: 6 + Math.random() * 7, round: Math.random() < 0.3
  })), []);
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map(b => <i key={b.i} style={{ left: b.x + '%', background: b.c, width: b.w, height: b.round ? b.w : b.w * 0.45, borderRadius: b.round ? '50%' : 1,
        ['--dx' as string]: b.dx + 'vw', ['--rot' as string]: b.rot + 'deg', animationDelay: b.delay + 's', animationDuration: b.dur + 's' } as CSSProperties} />)}
    </div>
  );
}

/** Rising steam over the mug. */
export function Steam() {
  return (
    <svg className="steam" viewBox="0 0 60 70" aria-hidden="true">
      {[0, 1, 2].map(i => <path key={i} className={'steam__w steam__w--' + i} d={`M${18 + i * 12} 66 C${10 + i * 12} 52 ${28 + i * 12} 44 ${18 + i * 12} 30 C${10 + i * 12} 18 ${26 + i * 12} 12 ${20 + i * 12} 2`} />)}
    </svg>
  );
}

/** Dust motes drifting through daylight (morning and afternoon only). */
export function Motes({ light }: { light: State['light'] }) {
  const ms = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ i, x: Math.random() * 100, y: 10 + Math.random() * 80, s: 2 + Math.random() * 3, d: 9 + Math.random() * 10, del: -Math.random() * 12 })), []);
  if (light !== 'morning' && light !== 'afternoon') return null;
  return <div className="motes" aria-hidden="true">{ms.map(m => <i key={m.i} style={{ left: m.x + '%', top: m.y + '%', width: m.s, height: m.s, animationDuration: m.d + 's', animationDelay: m.del + 's' }} />)}</div>;
}

/** Optional, once-per-object explanation. Seen objects stay quiet across visits. */
export function PalTip({ s, d, style, stage }: { s: State; d: Dispatch<Action>; style?: CSSProperties; stage: boolean }) {
  const tip = s.tip;
  useEffect(() => {
    if (!tip) return;
    const id = window.setTimeout(() => d({ t: 'tipClose' }), 9000);
    return () => window.clearTimeout(id);
  }, [tip, d]);
  if (!tip) return null;
  const p = PROPS[tip.k];
  return (
    <div className={'paltip' + (stage ? ' paltip--stage' : ' paltip--toast')} style={style} role="status" aria-live="polite" key={tip.n}>
      <AssetImage k="SB_blue-pal-pointing" className="paltip__pal" alt="" />
      <div className="paltip__body">
        <span className="paltip__lbl">{PAL.tipLabel} · {p.title.toUpperCase()}</span>
        <p className="paltip__what">{p.what}</p>
        <span className="paltip__lbl paltip__lbl--why">{PAL.whyLabel}</span>
        <p className="paltip__why">{p.why}</p>
      </div>
      <button type="button" className="paltip__x" onClick={() => d({ t: 'tipClose' })} aria-label="Close the tip">×</button>
    </div>
  );
}

/** A small pulsing dot on desk objects the visitor hasn't tried yet. */
export function Beacon({ show }: { show: boolean }) { return show ? <span className="beacon" aria-hidden="true" /> : null; }

export const TIP_SIDE: Partial<Record<PropKey, 'l' | 'r'>> = { sheets: 'r', pile: 'r', envelope: 'r', sticky: 'r' };
