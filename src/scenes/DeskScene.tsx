import type { Dispatch } from 'react';
import { AssetImage } from '../components/AssetImage';
import { Calendar } from '../components/Calendar';
import { DeskProps } from '../components/Props';
import { asset } from '../data/assets';
import { META } from '../data/content';
import { LIGHTS, type Action, type State } from '../state';

type Props = { s: State; d: Dispatch<Action>; mode: 'stage' | 'stack'; scale: number; reduced: boolean; avail?: number };

function LightOverlays({ s }: { s: State }) {
  return (
    <div className="lights" aria-hidden="true">
      {LIGHTS.map(l => <AssetImage key={l.id} k={l.key} className={'light' + (s.light === l.id ? ' is-on' : '')} alt="" label="" />)}
    </div>
  );
}

/** Desktop: the overhead oak desk (1376×768 plate) with the calendar and every prop composited live, lighting
 *  overlay on top. Narrow screens: the same calendar page and props, flowed as readable panels. */
export function DeskScene({ s, d, mode, scale, reduced, avail = 0 }: Props) {
  const env = asset('FD_ENV_01_OverheadDesk_v01').path;
  if (mode === 'stage') {
    return (
      <div className="stage-wrap" style={{ height: Math.max(768 * scale, avail) }}>
        <div className="stage-wrap__blur" aria-hidden="true" style={{ backgroundImage: `url(${env})` }} />
        <div className={'stage light-' + s.light} style={{ transform: `scale(${scale})`, top: Math.max(0, (avail - 768 * scale) / 2) }}>
          <AssetImage k="FD_ENV_01_OverheadDesk_v01" className="stage__env" alt="" label="Overhead oak desk" />
          <DeskProps s={s} d={d} stage />
          <Calendar s={s} d={d} reduced={reduced} withBoard />
          <LightOverlays s={s} />
          <span className="stage__attr">{META.attribution.toUpperCase()} · ILLUSTRATED SYNTHESIS · NOT A REAL DIARY</span>
        </div>
      </div>
    );
  }
  return (
    <div className={'stack light-' + s.light} style={{ backgroundImage: `url(${env})` }}>
      <LightOverlays s={s} />
      <section className="stack__cal" aria-label="The calendar"><Calendar s={s} d={d} reduced={reduced} withBoard={false} /></section>
      <section className="stack__desk" aria-label="On the desk">
        <h2 className="stack__h">On the desk</h2>
        <div className="stack__props"><DeskProps s={s} d={d} stage={false} /></div>
      </section>
      <p className="stack__attr">{META.attribution} · illustrated synthesis · not a real diary</p>
    </div>
  );
}
