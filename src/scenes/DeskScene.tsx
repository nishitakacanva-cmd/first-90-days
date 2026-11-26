import type { Dispatch } from 'react';
import { AssetImage } from '../components/AssetImage';
import { Calendar } from '../components/Calendar';
import { DeskProps } from '../components/Props';
import { Motes } from '../components/Fun';
import { asset } from '../data/assets';
import { META, PAL, dayAt } from '../data/content';
import { WhyNote } from '../components/Page';
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
  const why = dayAt(s.page);
  if (mode === 'stage') {
    return (
      <div className="stage-wrap" style={{ height: Math.max(768 * scale, avail) }}>
        <div className="stage-wrap__blur" aria-hidden="true" style={{ backgroundImage: `url(${env})` }} />
        <LightOverlays s={s} />
        <div className={'stage light-' + s.light} style={{ transform: `scale(${scale})`, top: Math.max(0, (avail - 768 * scale) / 2) }}>
          <AssetImage k="FD_ENV_01_OverheadDesk_v01" className="stage__env" alt="" label="Overhead oak desk" />
          <DeskProps s={s} d={d} stage />
          <Calendar s={s} d={d} reduced={reduced} withBoard />
          {!reduced && <Motes light={s.light} />}
          {s.hints && Object.keys(s.tried).length === 0 && <p className="deskhint"><AssetImage k="SB_blue-pal-pointing" alt="" />{PAL.intro}</p>}
          {why && <div className="whyslot"><WhyNote key={why.id} s={s} day={why} live={!s.turning} /></div>}
          <span className="stage__attr">{META.attribution.toUpperCase()} · ILLUSTRATED SYNTHESIS · NOT A REAL DIARY</span>
        </div>
      </div>
    );
  }
  return (
    <div className={'stack light-' + s.light} style={{ backgroundImage: `url(${env})` }}>
      <LightOverlays s={s} />
      {s.hints && Object.keys(s.tried).length === 0 && <p className="deskhint"><AssetImage k="SB_blue-pal-pointing" alt="" />{PAL.intro}</p>}
      <section className="stack__cal" aria-label="The calendar"><Calendar s={s} d={d} reduced={reduced} withBoard={false} /></section>
      {why && <div className="whyslot"><WhyNote key={why.id} s={s} day={why} live={!s.turning} /></div>}
      <section className="stack__desk" aria-label="On the desk">
        <h2 className="stack__h">On the desk</h2>
        <div className="stack__props"><DeskProps s={s} d={d} stage={false} /></div>
      </section>
      <p className="stack__attr">{META.attribution} · illustrated synthesis · not a real diary</p>
    </div>
  );
}
