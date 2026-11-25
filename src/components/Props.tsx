import type { CSSProperties, Dispatch } from 'react';
import { asset } from '../data/assets';
import { META, badgeFor, dayAt } from '../data/content';
import type { Action, State } from '../state';
import { AssetImage } from './AssetImage';
import { Beacon, PalTip, Steam, TIP_SIDE } from './Fun';
import type { PropKey } from '../data/content';

/** Desk layout in plate units (the 1376×768 environment). x/y = top-left, s = scale of the PNG, r = rotation°. */
export const LAYOUT = {
  sheets: { k: 'FD_PROP_12_LoosePaperSheets_v01', x: 24, y: 346, s: 0.40, r: -5 },
  pile: { k: 'FD_PAGE_01_CalendarPageTemplate_v01', x: 150, y: 540, s: 0.34, r: 4 },
  envelope: { k: 'FD_PROP_08_Envelope_v01__clean', x: 36, y: 560, s: 0.42, r: -8 },
  sticky: { k: 'FD_PROP_05_StickyNoteStack_v01__clean', x: 196, y: 372, s: 0.42, r: 6 },
  cup: { k: 'FD_PROP_03_PencilCup_v01__clean', x: 1200, y: 14, s: 0.48, r: 0 },
  badge: { k: 'FD_PROP_06_AccessCard_v01__clean', x: 1030, y: 26, s: 0.62, r: -6 },
  clips: { k: 'FD_PROP_07_BinderAndPaperClips_v01__clean', x: 1210, y: 196, s: 0.46, r: 0 },
  sketch: { k: 'FD_PROP_09_SketchbookClosed_v01__clean', x: 1040, y: 214, s: 0.58, r: 4 },
  pencil: { k: 'FD_PROP_04_PenAndPencil_v01__clean', x: 1250, y: 330, s: 0.5, r: 12 },
  ruler: { k: 'FD_PROP_11_TransparentRuler_v01', x: 1020, y: 462, s: 0.5, r: -3 },
  mug: { k: 'FD_PROP_02_CeramicMug_v01__clean', x: 1112, y: 533, s: 0.58, r: 0 }
} as const;
type LKey = keyof typeof LAYOUT;

/** Desk-lamp light pool centre, measured from FD_LIGHT_04 (brightest region of the overlay). */
const LAMP = { x: 484, y: 282 };

function place(key: LKey, light: State['light'], stage: boolean): CSSProperties {
  const L = LAYOUT[key]; const a = asset(L.k);
  const w = a.w * L.s, h = a.h * L.s;
  if (!stage) return {};
  const st: CSSProperties & Record<string, string | number> = { left: L.x, top: L.y, width: w, height: h, ['--r']: `${L.r}deg` };
  if (light === 'lamp') {
    const cx = L.x + w / 2, cy = L.y + h / 2; const dx = cx - LAMP.x, dy = cy - LAMP.y; const m = Math.hypot(dx, dy) || 1;
    const len = Math.min(16, 5 + m / 70);
    st['--sx'] = `${(dx / m * len).toFixed(1)}px`; st['--sy'] = `${(dy / m * len).toFixed(1)}px`;
  }
  return st;
}

type P = { s: State; d: Dispatch<Action>; stage: boolean };

function Prop({ s, d, k, label, chip, onClick, disabled, pressed, stage, extra, cls = '' }: { s: State; d: Dispatch<Action>; k: LKey & PropKey; label: string; chip: string; onClick: () => void; disabled?: boolean; pressed?: boolean; stage: boolean; extra?: React.ReactNode; cls?: string }) {
  return (
    <button type="button" className={`obj prop p-${k} ${cls}` + (pressed ? ' on' : '')} style={place(k, s.light, stage)} onClick={() => { onClick(); d({ t: 'tip', k }); }} disabled={disabled} aria-pressed={pressed} aria-label={label}>
      <AssetImage k={LAYOUT[k].k} alt="" />
      {extra}
      <Beacon show={s.hints && !s.tried[k] && !disabled} />
      <span className="chip">{chip}</span>
    </button>
  );
}

/** Where the pal's tip appears on the stage: beside the object it explains. */
function tipPos(k: PropKey): React.CSSProperties {
  if (k === 'light' || k === 'sound') return { left: 1376 - 372, top: 16 };
  const L = LAYOUT[k as LKey]; const a = asset(L.k); const w = a.w * L.s, h = a.h * L.s;
  const top = Math.max(14, Math.min(768 - 210, L.y + h / 2 - 90));
  return TIP_SIDE[k] === 'r' ? { left: L.x + w + 14, top } : { left: Math.max(14, L.x - 360), top };
}

export function DeskProps({ s, d, stage }: P) {
  const day = dayAt(s.page); const onDay = !!day;
  const b = badgeFor(day?.n ?? 0);
  const need = onDay ? '' : ' (turn to a day first)';
  return (
    <>
      {stage && <span className="obj p-cup deco" style={place('cup', s.light, true)} aria-hidden="true"><AssetImage k={LAYOUT.cup.k} alt="" /></span>}
      <Prop s={s} d={d} stage={stage} k="sheets" chip="RESEARCH NOTES" label="Research notes: open the evidence drawer for this page" onClick={() => d({ t: 'panel', p: 'evidence' })} pressed={s.panel === 'evidence'} />
      <Prop s={s} d={d} stage={stage} k="pile" chip="DAY INDEX" label="Torn-off pages: open the day index" onClick={() => d({ t: 'panel', p: 'index' })}
        extra={<span className="pile__label" aria-hidden="true">INDEX</span>} />
      <Prop s={s} d={d} stage={stage} k="envelope" chip="DAY 00 LETTER" label={s.page === 1 ? (s.letterOpen ? 'Envelope: fold the offer letter back up' : 'Envelope: unfold the offer letter') : 'Envelope: turn to Day 00 and the offer letter'}
        onClick={() => (s.page === 1 ? d({ t: 'letter' }) : d({ t: 'turn', to: 1 }))} />
      <Prop s={s} d={d} stage={stage} k="sticky" chip="ADD A NOTE" label={'Sticky notes: write a note on this day' + need} disabled={!onDay} onClick={() => d({ t: 'panel', p: 'note' })} />
      <BadgeProp s={s} d={d} stage={stage} front={b.front} gets={b.gets} still={b.still} dayLabel={day?.label ?? '—'} />
      <Prop s={s} d={d} stage={stage} k="clips" chip={day && s.clips[day.id] ? 'UNCLIP PAGE' : 'CLIP THIS PAGE'} pressed={!!(day && s.clips[day.id])} label={(day && s.clips[day.id] ? 'Binder clips: remove the clip from this page' : 'Binder clips: clip this page to bookmark it') + need} disabled={!onDay} onClick={() => d({ t: 'clip' })} />
      <Prop s={s} d={d} stage={stage} k="sketch" chip="NOTES TO SELF" label="Sketchbook: open your notes to self" pressed={s.panel === 'sketch'} onClick={() => d({ t: 'panel', p: 'sketch' })} />
      <Prop s={s} d={d} stage={stage} k="pencil" chip={day && s.marks[day.id] ? 'RUB OUT MARK' : 'PENCIL MARK'} pressed={!!(day && s.marks[day.id])} label={(day && s.marks[day.id] ? 'Pencil: rub out the mark on this day' : 'Pencil: circle this day on the calendar') + need} disabled={!onDay} onClick={() => d({ t: 'mark' })} />
      <Prop s={s} d={d} stage={stage} k="ruler" chip="OLD / NEW BRIEF" label={s.page === 6 ? 'Transparent ruler: lay the revised brief over the original' : 'Transparent ruler: turn to Day 21 and the revised brief'}
        onClick={() => (s.page === 6 ? d({ t: 'brief', v: s.brief >= 50 ? 0 : 100 }) : d({ t: 'turn', to: 6 }))} />
      <MugProp s={s} d={d} stage={stage} />
      {s.tip && <PalTip s={s} d={d} stage={stage} style={stage ? tipPos(s.tip.k) : undefined} />}
    </>
  );
}

function BadgeProp({ s, d, stage, front, gets, still, dayLabel }: P & { front: string; gets: string; still: string; dayLabel: string }) {
  return (
    <>
    <button type="button" className={'obj prop p-badge' + (s.badgeFlipped ? ' is-flipped' : '')} style={place('badge', s.light, stage)} onClick={() => { d({ t: 'badge' }); d({ t: 'tip', k: 'badge' }); }} aria-pressed={s.badgeFlipped}
      aria-label={s.badgeFlipped ? `Access badge, back: Gets you into ${gets}. Still finding: ${still}. Activate to flip back.` : `Access badge: ${META.studio}, ${META.role}, ${front}, day ${dayLabel}. Activate to flip it over.`}>
      <span className="badge3d">
        <span className="badge3d__face badge3d__front">
          <AssetImage k={LAYOUT.badge.k} alt="" />
          <span className="badge__txt" aria-hidden="true"><b>{META.studio}</b><span>{META.role}</span><i>{front} · DAY {dayLabel}</i></span>
        </span>
        <span className="badge3d__face badge3d__back">
          <AssetImage k={LAYOUT.badge.k} alt="" />
          <span className="badge__back" aria-hidden="true"><small>GETS YOU INTO</small><b>{gets}</b><small>STILL FINDING</small><b>{still}</b></span>
        </span>
      </span>
      <Beacon show={s.hints && !s.tried.badge} />
      <span className="chip">{s.badgeFlipped ? 'FLIP BACK' : 'FLIP BADGE'}</span>
    </button>
    {s.badgeFlipped && !stage && <p className="badgenote" aria-hidden="true"><small>BADGE · GETS YOU INTO</small>{gets}<small>STILL FINDING</small>{still}</p>}
    </>
  );
}

function MugProp({ s, d, stage }: P) {
  const day = dayAt(s.page);
  const q = day ? day.mug : 'What will I actually do on Monday?';
  return (
    <>
      {s.mugMoved && (
        <p className="mugnote" role="note" aria-label="Note found under the mug">
          <span className="hand">Ask:</span> <span className="hand">{q}</span>
        </p>
      )}
      <button type="button" className={'obj prop p-mug' + (s.mugMoved ? ' moved' : '')} style={place('mug', s.light, stage)} onClick={() => { d({ t: 'mug' }); d({ t: 'tip', k: 'mug' }); }} aria-pressed={s.mugMoved}
        aria-label={s.mugMoved ? 'Put the mug back' : 'Move the mug: there is something written underneath'}>
        <AssetImage k={LAYOUT.mug.k} alt="" />
        {stage && <Steam />}
        <Beacon show={s.hints && !s.tried.mug} />
        <span className="chip">{s.mugMoved ? 'PUT MUG BACK' : 'MOVE MUG'}</span>
      </button>
    </>
  );
}
