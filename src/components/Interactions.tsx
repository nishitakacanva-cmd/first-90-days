import type { Dispatch } from 'react';
import { DAYS, THREADS, type Day } from '../data/content';
import { AssetImage } from './AssetImage';
import { learnedItems, type Action, type Learn, type State } from '../state';

type P = { s: State; d: Dispatch<Action>; day: Day; live: boolean };

/** Renders the day's own paper mechanism. `live` is false on the copy that is mid-turn (non-interactive). */
export function Interaction(p: P) {
  const ix = p.day.interaction;
  switch (ix.type) {
    case 'letter': return <Letter {...p} />;
    case 'orgchart': return <OrgChart {...p} />;
    case 'slips': return <Slips {...p} />;
    case 'prioritise': return <Prioritise {...p} />;
    case 'draft': return <Draft {...p} />;
    case 'brief': return <Brief {...p} />;
    case 'checklist': return <Checklist {...p} />;
    case 'agenda': return <Agenda {...p} />;
    case 'file': return <FileSlips {...p} />;
    case 'tabs': return <Tabs {...p} />;
    case 'sheets': return <Sheets {...p} />;
    case 'map': return <ExperienceMap {...p} />;
  }
}

const tab = (live: boolean) => (live ? 0 : -1);

/* Day 00 — a tri-folded offer letter that unfolds panel by panel. */
function Letter({ s, d, day, live }: P) {
  if (day.interaction.type !== 'letter') return null;
  const ix = day.interaction; const open = s.letterOpen;
  return (
    <div className={'ix ix-letter' + (open ? ' is-open' : '')}>
      <div className="letter" aria-live="polite">
        <div className="letter__panel letter__panel--1">
          <span className="letter__head">THE STUDIO · OFFER OF EMPLOYMENT</span>
          <p>{ix.letter.salutation}</p>
        </div>
        <div className="letter__panel letter__panel--2" aria-hidden={!open}><p>{ix.letter.body}</p></div>
        <div className="letter__panel letter__panel--3" aria-hidden={!open}><p className="letter__sign">{ix.letter.signoff}</p></div>
        {open && (
          <ul className="letter__margin" aria-label="Pencil notes in the margin">
            {ix.margin.map((m, i) => <li key={i} style={{ animationDelay: `${0.5 + i * 0.35}s` }}>{m}</li>)}
          </ul>
        )}
      </div>
      <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'letter' })} aria-pressed={open}>{open ? 'Fold it back up' : ix.verb}</button>
    </div>
  );
}

/* Day 01 — a formal org chart printed on a flap; lifting it shows the unwritten chart beneath. */
function OrgChart({ s, d, day, live }: P) {
  if (day.interaction.type !== 'orgchart') return null;
  const nodes = day.interaction.nodes;
  const grid = (unwritten: boolean) => (
    <div className="org__grid">
      {!unwritten && (
        /* Connectors in grid units: x = % of width (column centres 15.9 / 50 / 84.1), y = px (rows 46 tall, 22 apart). */
        <svg className="org__lines" viewBox="0 0 100 182" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 46 V57 M15.9 57 H84.1 M15.9 57 V68 M84.1 57 V68 M15.9 114 V125 H50 V136 M15.9 125 V136 M84.1 114 V136" fill="none" stroke="currentColor" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {nodes.map(n => (
        <div key={n.id} className={'org__node' + (n.id === 'you' ? ' is-you' : '')} style={{ gridRow: n.row + 1, gridColumn: n.col + 1 }}>
          <b>{n.name}</b>{unwritten && <span className="hand">{n.unwritten}</span>}
        </div>
      ))}
    </div>
  );
  return (
    <div className={'ix ix-org' + (s.orgFlap ? ' is-lifted' : '')}>
      <div className="org">
        <div className="org__under" aria-hidden={!s.orgFlap}><span className="org__tag">THE UNWRITTEN CHART</span>{grid(true)}</div>
        <div className="org__flap" aria-hidden={s.orgFlap}><span className="org__tag">ORGANISATION CHART · AS ISSUED</span>{grid(false)}<span className="org__lip" aria-hidden="true" /></div>
      </div>
      <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'orgFlap' })} aria-pressed={s.orgFlap}>{s.orgFlap ? 'Lower the flap' : day.interaction.verb}</button>
    </div>
  );
}

/* Day 03 — task slips pulled one by one out of the job-description pocket, then sorted by the reader. */
function Slips({ s, d, day, live }: P) {
  if (day.interaction.type !== 'slips') return null;
  const ix = day.interaction; const n = s.slipsPulled; const all = n >= ix.tasks.length;
  const sorted = ix.tasks.every((_, i) => s.slipSort[i]);
  return (
    <div className="ix ix-slips">
      <div className="pocket">
        <span className="pocket__label">JOB DESCRIPTION</span>
        <p className="pocket__jd">{ix.jd}</p>
        <button type="button" className="ix-btn ix-btn--sm" tabIndex={tab(live)} onClick={() => d({ t: 'slipPull' })} disabled={all}>{all ? 'Pocket empty' : `${ix.verb} (${ix.tasks.length - n} left)`}</button>
      </div>
      <ol className="slips" aria-label="This week's tasks">
        {ix.tasks.slice(0, n).map((t, i) => (
          <li key={i} className="slip">
            <span className="slip__t">{t}</span>
            <span className="seg" role="group" aria-label={`Was “${t}” in the job description?`}>
              {ix.categories.map(c => (
                <button key={c} type="button" tabIndex={tab(live)} aria-pressed={s.slipSort[i] === c} onClick={() => d({ t: 'slipSort', i, cat: c })}>{c}</button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      {all && sorted && <p className="ix-after">{ix.after}</p>}
    </div>
  );
}

const STICKY = ['#E9A898', '#D9B45E', '#A9BC97'];
/* Day 07 — three conflicting comments; tap them in the order you'd reply. */
function Prioritise({ s, d, day, live }: P) {
  if (day.interaction.type !== 'prioritise') return null;
  const ix = day.interaction;
  return (
    <div className={'ix ix-prio' + (s.orderDone ? ' is-done' : '')}>
      <p className="ix-hint">{s.orderDone ? 'Your order:' : 'Tap the comments in the order you’d answer them.'}</p>
      <div className="prio">
        {ix.comments.map((c, i) => {
          const pos = s.order.indexOf(c.id);
          return (
            <button key={c.id} type="button" className="sticky" tabIndex={tab(live)} style={{ ['--c' as string]: STICKY[i], ['--r' as string]: `${(i - 1) * 2.2}deg` }}
              aria-label={`${c.who}: ${c.text}${pos >= 0 ? `. Placed ${pos + 1}` : ''}`} onClick={() => d({ t: 'orderPick', id: c.id })} disabled={s.orderDone}>
              <span className="sticky__who">{c.who}</span>
              <span className="sticky__text">{c.text}</span>
              {pos >= 0 && <span className="sticky__num" aria-hidden="true">{pos + 1}</span>}
              {(s.orderDone || s.persp === 'team') && <span className="sticky__after">Looking after {c.looksAfter}</span>}
            </button>
          );
        })}
      </div>
      <div className="ix-row">
        {!s.orderDone && <button type="button" className="ix-btn" tabIndex={tab(live)} disabled={s.order.length < 3} onClick={() => d({ t: 'orderDone' })}>{s.order.length < 3 ? `${day.interaction.verb} (${s.order.length}/3)` : 'Write the reply'}</button>}
        {(s.order.length > 0) && <button type="button" className="ix-btn ix-btn--ghost" tabIndex={tab(live)} onClick={() => d({ t: 'orderReset' })}>Start over</button>}
      </div>
      {s.orderDone && <p className="ix-after">{ix.after}</p>}
    </div>
  );
}

/* Day 14 — an unsent draft: send it, keep it, or rewrite it without the apology. */
function Draft({ s, d, day, live }: P) {
  if (day.interaction.type !== 'draft') return null;
  const ix = day.interaction;
  if (!s.draftOpen) {
    return (
      <div className="ix ix-draft">
        <div className="chat">
          <div className="chat__bar"><b>Drafts (1)</b><span>10:40</span></div>
          <button type="button" className="chat__item" tabIndex={tab(live)} onClick={() => d({ t: 'draftOpen' })}>
            <b>To: {ix.to}</b><span>{ix.draft}…</span><i>Unsent</i>
          </button>
        </div>
        <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'draftOpen' })}>{ix.verb}</button>
      </div>
    );
  }
  const sent = s.draftChoice === 'send';
  return (
    <div className="ix ix-draft is-open">
      <div className="chat">
        <div className="chat__bar"><b>To: {ix.to}</b><span>{sent ? 'Sent' : 'Draft'}</span></div>
        <div className="chat__body">
          {s.draftRewritten ? (<><p className="chat__old"><s>{ix.draft}…</s></p><p className="chat__msg">{ix.rewrite}</p></>) : <p className="chat__msg">{ix.draft}<span className="caret" aria-hidden="true">|</span></p>}
          {s.draftChoice && <p className="chat__outcome" role="status">{ix.options[s.draftChoice]}</p>}
          {sent && live && <AssetImage k="SB_blue-pal-sending" className="flyer" alt="" />}
        </div>
      </div>
      {!sent && (
        <div className="ix-row" role="group" aria-label="What do you do with the draft?">
          <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'draftChoice', c: 'send' })}>Send it</button>
          {!s.draftRewritten && <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'draftChoice', c: 'rewrite' })}>Rewrite it</button>}
          <button type="button" className="ix-btn ix-btn--ghost" tabIndex={tab(live)} onClick={() => d({ t: 'draftChoice', c: 'keep' })}>Keep it in drafts</button>
        </div>
      )}
    </div>
  );
}

/** Crisp millimetre ticks for the acetate ruler slider (drawn, not a stretched photo). */
function RulerTicks() {
  const ticks = Array.from({ length: 101 }, (_, i) => i);
  return (
    <svg viewBox="0 0 1000 34" preserveAspectRatio="none" aria-hidden="true">
      {ticks.map(i => <line key={i} x1={5 + i * 9.9} x2={5 + i * 9.9} y1={0} y2={i % 10 === 0 ? 13 : i % 5 === 0 ? 9 : 5} stroke="#3e5258" strokeWidth={i % 10 === 0 ? 1.4 : 0.9} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

/* Day 21 — the revised brief on acetate, wiped across the original with a ruler-shaped slider. */
function Brief({ s, d, day, live }: P) {
  if (day.interaction.type !== 'brief') return null;
  const ix = day.interaction; const v = s.brief;
  const sheet = (which: 'a' | 'b') => (
    <table className="brief__t">
      <caption>{which === 'a' ? 'BRIEF · v1' : 'BRIEF · v2 (REVISED)'}</caption>
      <tbody>{ix.rows.map(r => <tr key={r.k} className={which === 'b' && r.changed ? 'chg' : ''}><th scope="row">{r.k}</th><td><span>{which === 'a' ? r.a : r.b}</span></td></tr>)}</tbody>
    </table>
  );
  return (
    <div className="ix ix-brief">
      <div className="brief">
        <div className="brief__sheet brief__sheet--a" aria-hidden={v >= 50}>{sheet('a')}</div>
        <div className="brief__sheet brief__sheet--b" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }} aria-hidden={v < 50}>{sheet('b')}</div>
        <span className="brief__edge" style={{ left: `${v}%` }} aria-hidden="true" />
      </div>
      <label className="ruler-range">
        <RulerTicks />
        <span className="sr-only">{ix.verb}</span>
        <input type="range" min={0} max={100} step={1} value={v} tabIndex={tab(live)} onChange={e => d({ t: 'brief', v: +e.target.value })} aria-valuetext={v < 50 ? 'Showing the original brief' : 'Showing the revised brief'} />
      </label>
      <div className="ix-row ix-row--between">
        <span className="ix-hint">{v < 50 ? 'Slide the revised version across.' : 'The ripple:'}</span>
        <button type="button" className="ix-btn ix-btn--ghost ix-btn--sm" tabIndex={tab(live)} onClick={() => d({ t: 'brief', v: v < 50 ? 100 : 0 })}>{v < 50 ? 'Show revised' : 'Show original'}</button>
      </div>
      {v >= 50 && <span className="ripples" aria-hidden="true"><i /><i /><i /></span>}
      <ul className={'ripple' + (v >= 50 ? ' is-on' : '')} aria-hidden={v < 50}>{ix.ripple.map(r => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

/* Day 30 — a checklist of things done; turn each card to say whether it taught you something. */
function Checklist({ s, d, day, live }: P) {
  if (day.interaction.type !== 'checklist') return null;
  const ix = day.interaction; const states = ix.states as Learn[];
  const next = (cur?: Learn): Learn => states[(cur ? states.indexOf(cur) + 1 : 0) % states.length];
  return (
    <div className="ix ix-check">
      <p className="ix-hint">{ix.verb}: learned something, just did it, or not sure.</p>
      <ul className="cards">
        {ix.items.map((it, i) => {
          const st = s.learn[i];
          return (
            <li key={i}>
              <button type="button" className={'turncard' + (st ? ' is-turned' : '')} data-state={st ?? ''} tabIndex={tab(live)} onClick={() => d({ t: 'learn', i, v: next(st) })} aria-label={`${it}. ${st ? 'Marked: ' + st : 'Not marked'}. Activate to change.`}>
                <span className="turncard__face" key={st ?? 'none'}>
                  <span className="turncard__t">{it}</span>
                  <span className="turncard__s">{st ?? 'Turn ↻'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="ix-after ix-after--quiet">{ix.after}</p>
    </div>
  );
}

/* Day 45 — a folded agenda; two folds open it. Item 4 is filled from Day 30. */
function Agenda({ s, d, day, live }: P) {
  if (day.interaction.type !== 'agenda') return null;
  const ix = day.interaction; const f = s.agendaFolds; const learned = learnedItems(s);
  const item = (k: number) => {
    const it = ix.items[k];
    return (
      <li key={k}><b>{it.h}</b>
        {it.fromDay30 ? (learned.length ? <span className="hand">{learned.join(' · ')}</span> : <span className="muted">{ix.empty}</span>) : <span>{it.d}</span>}
      </li>
    );
  };
  return (
    <div className={'ix ix-agenda f' + f}>
      <div className="agenda-paper">
        <div className="agenda-paper__p agenda-paper__p--1"><span className="agenda-paper__title">{ix.title}</span><ol start={1}>{item(0)}</ol></div>
        <div className="agenda-paper__p agenda-paper__p--2" aria-hidden={f < 1}><ol start={2}>{item(1)}{item(2)}</ol></div>
        <div className="agenda-paper__p agenda-paper__p--3" aria-hidden={f < 2}><ol start={4}>{item(3)}{item(4)}</ol></div>
      </div>
      <button type="button" className="ix-btn" tabIndex={tab(live)} onClick={() => d({ t: 'agenda', n: f >= 2 ? 0 : f + 1 })}>{f === 0 ? ix.verb : f === 1 ? 'Unfold the last fold' : 'Fold it away'}</button>
    </div>
  );
}

/* Day 60 — file each slip into a tray: what a portfolio shows, and what the team remembers. */
function FileSlips({ s, d, day, live }: P) {
  if (day.interaction.type !== 'file') return null;
  const ix = day.interaction;
  const loose = ix.items.map((t, i) => ({ t, i })).filter(x => s.filed[x.i] === undefined);
  return (
    <div className="ix ix-file">
      <ul className="loose" aria-label="Slips to file">
        {loose.map(x => (
          <li key={x.i} className="slip">
            <span className="slip__t">{x.t}</span>
            <span className="seg" role="group" aria-label={`File “${x.t}”`}>
              {ix.trays.map((tr, k) => <button key={tr} type="button" tabIndex={tab(live)} onClick={() => d({ t: 'file', i: x.i, tray: k })}>{k === 0 ? 'Portfolio' : 'Team'}</button>)}
            </span>
          </li>
        ))}
        {!loose.length && <li className="ix-after">{ix.after}</li>}
      </ul>
      <div className="trays">
        {ix.trays.map((tr, k) => {
          const inTray = ix.items.map((t, i) => ({ t, i })).filter(x => s.filed[x.i] === k);
          return (
            <section key={tr} className={'tray tray--' + k} aria-label={`${tr} tray`}>
              <h4>{tr} <i>{inTray.length}</i></h4>
              <ul>{inTray.map(x => <li key={x.i}><button type="button" tabIndex={tab(live)} onClick={() => d({ t: 'file', i: x.i, tray: k === 0 ? 1 : 0 })} title="Move to the other tray">{x.t}</button></li>)}</ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* Day 75 — acetate overlays with index tabs: the idea, the work, and what you'd keep. */
function Tabs({ s, d, day, live }: P) {
  if (day.interaction.type !== 'tabs') return null;
  const tabs = day.interaction.tabs;
  return (
    <div className="ix ix-tabs">
      <div className="acetates" style={{ ['--n' as string]: tabs.length }}>
        <div role="tablist" aria-label="Overlays" className="acetates__tabs">
          {tabs.map((t, k) => (
            <button key={t.id} role="tab" type="button" id={'tab-' + t.id} aria-selected={s.tab === t.id} aria-controls={'sheet-' + t.id} tabIndex={live && s.tab === t.id ? 0 : -1}
              style={{ ['--k' as string]: k }} className={'acetates__tab tab-' + t.id} onClick={() => d({ t: 'tab', id: t.id })}
              onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const j = (k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; d({ t: 'tab', id: tabs[j].id }); (document.getElementById('tab-' + tabs[j].id) as HTMLElement | null)?.focus(); } }}>
              {t.label}{t.id === 'keep' && s.keep.length ? ` (${s.keep.length})` : ''}
            </button>
          ))}
        </div>
        {tabs.map((t, k) => (
          <div key={t.id} role="tabpanel" id={'sheet-' + t.id} aria-labelledby={'tab-' + t.id}
            className={'acetate sheet-' + t.id + (s.tab === t.id ? ' is-front' : '')} style={{ ['--k' as string]: k }} aria-hidden={s.tab !== t.id}>
            {t.id === 'keep' ? (
              s.keep.length ? <ul className="chips">{s.keep.map(x => <li key={x}><button type="button" tabIndex={live && s.tab === t.id ? 0 : -1} className="chip is-on" onClick={() => d({ t: 'keep', item: x })}>{x} ×</button></li>)}</ul>
                : <p className="muted">Nothing kept yet. Open the other two tabs and keep what still matters to you.</p>
            ) : (
              <ul className="chips">{t.items.map(x => <li key={x}><button type="button" tabIndex={live && s.tab === t.id ? 0 : -1} className={'chip' + (s.keep.includes(x) ? ' is-on' : '')} aria-pressed={s.keep.includes(x)} onClick={() => d({ t: 'keep', item: x })}>{s.keep.includes(x) ? '✓ ' : '+ '}{x}</button></li>)}</ul>
            )}
          </div>
        ))}
      </div>
      <p className="ix-hint">{day.interaction.verb}. Tap an item to keep it.</p>
    </div>
  );
}

/* Day 85 — two sheets that slide together; the overlap says what both sides learned. */
function Sheets({ s, d, day, live }: P) {
  if (day.interaction.type !== 'sheets') return null;
  const ix = day.interaction; const v = s.sheets; const k = v / 100;
  return (
    <div className={'ix ix-sheets' + (v >= 60 ? ' is-overlap' : '')}>
      <div className="two">
        <section className="two__a" style={{ left: `${k * 6}%` }}><h4>{ix.a.title}</h4><ul>{ix.a.items.map(x => <li key={x}>{x}</li>)}</ul></section>
        <section className="two__b" style={{ left: `${50 - k * 6}%` }}><h4>{ix.b.title}</h4><ul>{ix.b.items.map(x => <li key={x}>{x}</li>)}</ul></section>
        <p className="two__overlap" aria-hidden={v < 60}>{ix.overlap}</p>
      </div>
      <div className="ix-row">
        <label className="mini-range"><span className="sr-only">{ix.verb}</span><input type="range" min={0} max={100} value={v} tabIndex={tab(live)} onChange={e => d({ t: 'sheets', v: +e.target.value })} aria-valuetext={v >= 60 ? 'Overlapping' : 'Apart'} /></label>
        <button type="button" className="ix-btn ix-btn--sm" tabIndex={tab(live)} onClick={() => d({ t: 'sheets', v: v >= 60 ? 0 : 100 })}>{v >= 60 ? 'Slide apart' : ix.verb}</button>
      </div>
    </div>
  );
}

/* Day 90 — the completed experience map: 91 squares, days 0–90, 13 weeks of 7. */
export function ExperienceMap({ s, d, live, compact = false }: Partial<P> & { s: State; d: Dispatch<Action>; live: boolean; compact?: boolean }) {
  const byN = new Map(DAYS.map((x, i) => [x.n, { day: x, page: i + 1 }]));
  const cells = Array.from({ length: 91 }, (_, n) => n);
  return (
    <div className={'ix ix-map' + (compact ? ' is-compact' : '')}>
      <div className="xmap" role="list" aria-label="Experience map, days 0 to 90">
        {cells.map(n => {
          const hit = byN.get(n);
          const delay = { animationDelay: `${n * 14}ms` };
          if (!hit) return <span key={n} role="listitem" className="xmap__c" style={delay} aria-label={`Day ${n}`}><i>{n}</i></span>;
          const id = hit.day.id; const seen = !!s.visited[id];
          const cls = 'xmap__c is-turn' + (seen ? ' is-seen' : '') + (s.marks[id] ? ' is-marked' : '') + (s.clips[id] ? ' is-clipped' : '');
          if (compact) return <span key={n} role="listitem" className={cls} aria-label={`Day ${hit.day.label}${seen ? ', opened' : ', not opened'}${s.marks[id] ? ', pencil-marked' : ''}`}><i>{n}</i><span className="xmap__dots" aria-hidden="true">{hit.day.threads.map(t => <b key={t} style={{ background: THREADS[t].color }} />)}</span></span>;
          return (
            <button key={n} role="listitem" type="button" style={delay} tabIndex={tab(live)} className={'xmap__c is-turn' + (seen ? ' is-seen' : '') + (s.marks[id] ? ' is-marked' : '') + (s.clips[id] ? ' is-clipped' : '')}
              onClick={() => d({ t: 'turn', to: hit.page })} aria-label={`Day ${hit.day.label}: ${hit.day.headline}${seen ? ', opened' : ', not opened'}${s.marks[id] ? ', pencil-marked' : ''}${s.clips[id] ? ', clipped' : ''}. Turn to this day.`}>
              <i>{n}</i>
              <span className="xmap__dots" aria-hidden="true">{hit.day.threads.map(t => <b key={t} style={{ background: THREADS[t].color }} />)}</span>
              {(s.notes[id]?.length ?? 0) > 0 && <span className="xmap__note" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {!compact && (
        <div className="xmap__legend">
          {(['role', 'team', 'self'] as const).map(t => <span key={t}><b style={{ background: THREADS[t].color }} />{THREADS[t].label}</span>)}
          <span><b className="lg-mark" />Pencil mark</span>
        </div>
      )}
      {!compact && <button type="button" className="ix-btn ix-btn--go" tabIndex={tab(live)} onClick={() => d({ t: 'finding' })}>{DAYS[DAYS.length - 1].interaction.type === 'map' ? (DAYS[DAYS.length - 1].interaction as { cta: string }).cta : 'Continue'} →</button>}
    </div>
  );
}
