import raw from './content.json';

/** Typed view of content.json — the single editable content source shared by the app and the print-PDF builder. */
export type ThreadKey = 'role' | 'team' | 'self';
export type SourceKey = 'sb' | 'bauer2010' | 'deloitte2025';

export type Interaction =
  | { type: 'letter'; verb: string; letter: { salutation: string; body: string; signoff: string }; margin: string[] }
  | { type: 'orgchart'; verb: string; nodes: { id: string; name: string; row: number; col: number; unwritten: string }[] }
  | { type: 'slips'; verb: string; jd: string; categories: string[]; tasks: string[]; after: string }
  | { type: 'prioritise'; verb: string; comments: { id: string; who: string; text: string; looksAfter: string }[]; after: string }
  | { type: 'draft'; verb: string; to: string; draft: string; rewrite: string; options: { send: string; keep: string; rewrite: string } }
  | { type: 'brief'; verb: string; rows: { k: string; a: string; b: string; changed: boolean }[]; ripple: string[] }
  | { type: 'checklist'; verb: string; items: string[]; states: string[]; after: string }
  | { type: 'agenda'; verb: string; title: string; items: { h: string; d: string; fromDay30?: boolean }[]; empty: string }
  | { type: 'file'; verb: string; trays: string[]; items: string[]; after: string }
  | { type: 'tabs'; verb: string; tabs: { id: string; label: string; items: string[] }[] }
  | { type: 'sheets'; verb: string; a: { title: string; items: string[] }; b: { title: string; items: string[] }; overlap: string }
  | { type: 'map'; verb: string; cta: string };

export type Day = {
  id: string; n: number; label: string; headline: string; theme: string; threads: ThreadKey[];
  student: string; team: string; slip: string; mug: string; sources: SourceKey[]; basis: string;
  interaction: Interaction; print: { prompt: string; lines: number };
};
export type Source = { title: string; publisher: string; url?: string; note: string };

const C = raw as unknown as {
  meta: Record<'title' | 'subtitle' | 'researchNote' | 'attribution' | 'composite' | 'notLongitudinal' | 'studio' | 'role', string>;
  threads: Record<ThreadKey, { label: string; short: string; color: string; cmyk: number[] }>;
  cover: { how: string[]; cta: string };
  days: Day[];
  badge: { upTo: number; front: string; gets: string; still: string }[];
  finding: { headline: string; intro: string; notOpened: string; close: string };
  sources: Record<SourceKey, Source>;
  disclaimers: string[];
};

export const META = C.meta;
export const THREADS = C.threads;
export const THREAD_KEYS: ThreadKey[] = ['role', 'team', 'self'];
export const COVER = C.cover;
export const DAYS = C.days;
export const BADGE = C.badge;
export const FINDING = C.finding;
export const SOURCES = C.sources;
export const DISCLAIMERS = C.disclaimers;
/** Page 0 is the cover; pages 1..12 are the twelve days. */
export const PAGE_COUNT = DAYS.length + 1;
export const dayAt = (page: number): Day | null => (page >= 1 && page <= DAYS.length ? DAYS[page - 1] : null);
export const badgeFor = (dayN: number) => BADGE.find(b => dayN <= b.upTo) ?? BADGE[BADGE.length - 1];
