import { DAYS, PAGE_COUNT, dayAt, type Day, type PropKey } from './data/content';
import type { SfxName } from './sound';

export type Light = 'morning' | 'afternoon' | 'evening' | 'lamp';
export const LIGHTS: { id: Light; label: string; key: string }[] = [
  { id: 'morning', label: 'Morning', key: 'FD_LIGHT_01_MorningLighting_v01' },
  { id: 'afternoon', label: 'Afternoon', key: 'FD_LIGHT_02_AfternoonLighting_v01' },
  { id: 'evening', label: 'Evening', key: 'FD_LIGHT_03_EveningLighting_v01' },
  { id: 'lamp', label: 'Desk lamp', key: 'FD_LIGHT_04_DeskLampLighting_v01' }
];
export type Persp = 'student' | 'team';
export type Panel = null | 'index' | 'evidence' | 'print' | 'note' | 'sketch' | 'help';
export type Learn = 'Learned something' | 'Just did it' | 'Not sure';

export type State = {
  phase: 'desk' | 'finding';
  page: number;
  turning: null | { from: number; to: number; dir: 1 | -1 };
  visited: Record<string, true>;
  persp: Persp;
  light: Light;
  mugMoved: boolean;
  badgeFlipped: boolean;
  panel: Panel;
  marks: Record<string, true>;
  clips: Record<string, true>;
  notes: Record<string, string[]>;
  /* per-day interaction state */
  letterOpen: boolean;
  orgFlap: boolean; orgSel: string | null;
  slipsPulled: number; slipSort: Record<number, string>;
  order: string[]; orderDone: boolean;
  draftOpen: boolean; draftChoice: null | 'send' | 'keep' | 'rewrite'; draftRewritten: boolean;
  brief: number;
  learn: Record<number, Learn>;
  agendaFolds: number;
  filed: Record<number, number>;
  tab: string; keep: string[];
  sheets: number;
  announce: string;
  tip: null | { k: PropKey; n: number };
  tried: Partial<Record<PropKey, true>>;
  sound: boolean;
  burst: number;
};

export const initial: State = {
  phase: 'desk', page: 0, turning: null, visited: {}, persp: 'student', light: 'morning',
  mugMoved: false, badgeFlipped: false, panel: null, marks: {}, clips: {}, notes: {},
  letterOpen: false, orgFlap: false, orgSel: null, slipsPulled: 0, slipSort: {}, order: [], orderDone: false,
  draftOpen: false, draftChoice: null, draftRewritten: false, brief: 0, learn: {}, agendaFolds: 0, filed: {},
  tab: 'idea', keep: [], sheets: 0, announce: '', tip: null, tried: {}, sound: true, burst: 0
};

export type Action =
  | { t: 'turn'; to: number; instant?: boolean }
  | { t: 'turned' }
  | { t: 'persp'; p: Persp }
  | { t: 'light'; l: Light }
  | { t: 'mug' } | { t: 'badge' }
  | { t: 'panel'; p: Panel }
  | { t: 'mark' } | { t: 'clip' }
  | { t: 'addNote'; text: string } | { t: 'delNote'; day: string; i: number }
  | { t: 'letter' }
  | { t: 'orgFlap' } | { t: 'orgSel'; id: string | null }
  | { t: 'slipPull' } | { t: 'slipSort'; i: number; cat: string }
  | { t: 'orderPick'; id: string } | { t: 'orderMove'; id: string; dir: -1 | 1 } | { t: 'orderDone' } | { t: 'orderReset' }
  | { t: 'draftOpen' } | { t: 'draftChoice'; c: 'send' | 'keep' | 'rewrite' }
  | { t: 'brief'; v: number }
  | { t: 'learn'; i: number; v: Learn }
  | { t: 'agenda'; n: number }
  | { t: 'file'; i: number; tray: number }
  | { t: 'tab'; id: string } | { t: 'keep'; item: string }
  | { t: 'sheets'; v: number }
  | { t: 'finding' } | { t: 'backToDesk' } | { t: 'reset' }
  | { t: 'tip'; k: PropKey } | { t: 'tipClose' } | { t: 'sound' };

const clampPage = (n: number) => Math.max(0, Math.min(PAGE_COUNT - 1, n));
const curId = (s: State) => dayAt(s.page)?.id ?? null;
const pageName = (p: number) => { const d = dayAt(p); return d ? `Day ${d.label}: ${d.headline}` : 'Cover: The First 90 Days'; };

function arrive(s: State, page: number): State {
  const d = dayAt(page);
  return { ...s, page, turning: null, visited: d ? { ...s.visited, [d.id]: true } : s.visited, announce: `Now showing ${pageName(page)}` };
}

export function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'turn': {
      const to = clampPage(a.to);
      if (s.turning || to === s.page || s.phase !== 'desk') return s;
      if (a.instant) return arrive({ ...s, panel: null }, to);
      return { ...s, panel: null, turning: { from: s.page, to, dir: to > s.page ? 1 : -1 }, announce: `Turning to ${pageName(to)}` };
    }
    case 'turned': return s.turning ? arrive(s, s.turning.to) : s;
    case 'persp': return { ...s, persp: a.p, announce: a.p === 'team' ? 'Showing the team’s side' : 'Showing the new designer’s side' };
    case 'light': return { ...s, light: a.l, announce: `Lighting: ${a.l}` };
    case 'mug': return { ...s, mugMoved: !s.mugMoved, announce: s.mugMoved ? 'Mug put back' : 'Mug moved. There’s a note underneath.' };
    case 'badge': return { ...s, badgeFlipped: !s.badgeFlipped, announce: s.badgeFlipped ? 'Badge front' : 'Badge flipped over' };
    case 'panel': return { ...s, panel: a.p };
    case 'mark': {
      const id = curId(s); if (!id) return s;
      const m = { ...s.marks }; const on = !m[id]; if (on) m[id] = true; else delete m[id];
      return { ...s, marks: m, announce: on ? 'Pencil mark added to this day' : 'Pencil mark rubbed out' };
    }
    case 'clip': {
      const id = curId(s); if (!id) return s;
      const c = { ...s.clips }; const on = !c[id]; if (on) c[id] = true; else delete c[id];
      return { ...s, clips: c, announce: on ? 'Page clipped. It is bookmarked in the day index.' : 'Clip removed' };
    }
    case 'addNote': {
      const id = curId(s); const text = a.text.trim().slice(0, 140); if (!id || !text) return { ...s, panel: null };
      return { ...s, panel: null, notes: { ...s.notes, [id]: [...(s.notes[id] ?? []), text] }, announce: 'Sticky note added to this day' };
    }
    case 'delNote': {
      const list = [...(s.notes[a.day] ?? [])]; list.splice(a.i, 1);
      return { ...s, notes: { ...s.notes, [a.day]: list }, announce: 'Sticky note removed' };
    }
    case 'letter': return { ...s, letterOpen: !s.letterOpen, burst: s.letterOpen ? s.burst : s.burst + 1, announce: s.letterOpen ? 'Letter folded' : 'Letter unfolded' };
    case 'orgFlap': return { ...s, orgFlap: !s.orgFlap, orgSel: null, announce: s.orgFlap ? 'Showing the formal chart' : 'Flap lifted: the unwritten chart' };
    case 'orgSel': return { ...s, orgSel: a.id };
    case 'slipPull': {
      const d = DAYS.find(x => x.interaction.type === 'slips')!; const n = d.interaction.type === 'slips' ? d.interaction.tasks.length : 0;
      return s.slipsPulled >= n ? s : { ...s, slipsPulled: s.slipsPulled + 1, announce: 'Task slip pulled out' };
    }
    case 'slipSort': return { ...s, slipSort: { ...s.slipSort, [a.i]: a.cat } };
    case 'orderPick': {
      if (s.orderDone) return s;
      const has = s.order.includes(a.id);
      const order = has ? s.order.filter(x => x !== a.id) : [...s.order, a.id];
      return { ...s, order, announce: has ? 'Removed from the order' : `Placed number ${order.length}` };
    }
    case 'orderMove': {
      const i = s.order.indexOf(a.id); const j = i + a.dir; if (i < 0 || j < 0 || j >= s.order.length || s.orderDone) return s;
      const o = [...s.order]; [o[i], o[j]] = [o[j], o[i]]; return { ...s, order: o };
    }
    case 'orderDone': return s.order.length === 3 ? { ...s, orderDone: true, announce: 'Order set' } : s;
    case 'orderReset': return { ...s, order: [], orderDone: false };
    case 'draftOpen': return { ...s, draftOpen: true, announce: 'Draft opened' };
    case 'draftChoice': return { ...s, draftChoice: a.c, draftRewritten: a.c === 'rewrite' ? true : s.draftRewritten };
    case 'brief': return { ...s, brief: Math.max(0, Math.min(100, a.v)) };
    case 'learn': return { ...s, learn: { ...s.learn, [a.i]: a.v } };
    case 'agenda': return { ...s, agendaFolds: Math.max(0, Math.min(2, a.n)), announce: a.n >= 2 ? 'Agenda fully unfolded' : 'Agenda unfolded' };
    case 'file': return { ...s, filed: { ...s.filed, [a.i]: a.tray } };
    case 'tab': return { ...s, tab: a.id };
    case 'keep': return { ...s, keep: s.keep.includes(a.item) ? s.keep.filter(x => x !== a.item) : [...s.keep, a.item] };
    case 'sheets': return { ...s, sheets: Math.max(0, Math.min(100, a.v)) };
    case 'finding': return { ...s, phase: 'finding', panel: null, turning: null, burst: s.burst + 1, announce: 'The offer was day zero. The understanding came later.' };
    case 'backToDesk': return { ...s, phase: 'desk' };
    case 'reset': return { ...initial, sound: s.sound, announce: 'Calendar reset to the cover' };
    case 'tip': return { ...s, tip: { k: a.k, n: (s.tip?.n ?? 0) + 1 }, tried: { ...s.tried, [a.k]: true } };
    case 'tipClose': return { ...s, tip: null };
    case 'sound': return { ...s, sound: !s.sound, announce: s.sound ? 'Sound off' : 'Sound on' };
  }
}

/** Items from Day 30 the reader marked as learning — carried onto the Day 45 agenda. */
export function learnedItems(s: State): string[] {
  const d = DAYS.find(x => x.interaction.type === 'checklist');
  if (!d || d.interaction.type !== 'checklist') return [];
  const items = d.interaction.items;
  return items.filter((_, i) => s.learn[i] === 'Learned something');
}

/** Has the visitor used this day's own mechanism yet? Drives the "why it matters" note. */
export function didInteract(s: State, d: Day): boolean {
  switch (d.interaction.type) {
    case 'letter': return s.letterOpen;
    case 'orgchart': return s.orgFlap;
    case 'slips': return s.slipsPulled > 0;
    case 'prioritise': return s.orderDone;
    case 'draft': return !!s.draftChoice;
    case 'brief': return s.brief >= 50;
    case 'checklist': return Object.keys(s.learn).length > 0;
    case 'agenda': return s.agendaFolds > 0;
    case 'file': return Object.keys(s.filed).length > 0;
    case 'tabs': return s.keep.length > 0 || s.tab !== 'idea';
    case 'sheets': return s.sheets >= 60;
    case 'map': return true;
  }
}

/** The sound each action makes (null = silent). */
export function sfxFor(a: Action, s: State): SfxName | null {
  switch (a.t) {
    case 'turn': return s.turning || s.phase !== 'desk' ? null : 'flip';
    case 'letter': case 'orgFlap': case 'agenda': return 'rustle';
    case 'mug': return 'slide';
    case 'badge': return 'whoosh';
    case 'mark': return 'scribble';
    case 'clip': return 'snap';
    case 'addNote': return a.text.trim() ? 'pop' : null;
    case 'delNote': return 'tick';
    case 'slipPull': return 'slide';
    case 'slipSort': case 'orderMove': case 'tab': return 'tick';
    case 'orderPick': case 'keep': return 'pop';
    case 'orderDone': return 'ding';
    case 'draftOpen': return 'click';
    case 'draftChoice': return a.c === 'send' ? 'whoosh' : 'scribble';
    case 'learn': return 'flip';
    case 'file': return 'thud';
    case 'light': return 'click';
    case 'panel': return a.p ? 'click' : null;
    case 'finding': return 'chime';
    case 'reset': return 'whoosh';
    default: return null;
  }
}
