import { useRef, useState, type CSSProperties, type Dispatch } from 'react';
import { DAYS, type Day } from '../data/content';
import { didInteract, learnedItems, type Action, type State } from '../state';

type Props = { s: State; d: Dispatch<Action>; day: Day; live: boolean };
const sizes = {
  '01_FormalNetwork': [1229,1800], '01_HelpNetwork': [1229,1800],
  '03_Pocket': [1263,1800], '03_TaskStack': [1800,1133],
  '07_Poster': [1306,1800], '07_FeedbackPink': [1599,1800], '07_FeedbackYellow': [1481,1800], '07_FeedbackMint': [1571,1800],
  '14_Unsent': [1382,1800], '14_Clarified': [1382,1800],
  '21_VersionFan': [1800,1343], '21_RippleLinks': [1800,1370],
  '45_OpenAgenda': [1800,967], '45_QuestionTabs': [1800,975],
  '60_HeroWork': [1374,1800], '60_Teamwork': [1800,1217], '90_EmptyEvidenceFrame': [1800,1371]
} as const;
type Art = keyof typeof sizes;
export function StoryImage({ name, className = '', style }: { name: Art; className?: string; style?: CSSProperties }) {
  const [w,h] = sizes[name];
  return <img className={'story-art ' + className} src={`${import.meta.env.BASE_URL}assets/story/FD_STORY_${name}.png`} width={w} height={h} alt="" draggable={false} style={style} decoding="async" />;
}
const ti = (live: boolean) => live ? 0 : -1;

export function StoryOrg({s,d,day,live}: Props) {
  if (day.interaction.type !== 'orgchart') return null;
  const nodes=day.interaction.nodes;
  const spots=[[50,28],[32,51],[69,51],[32,75],[69,75]];
  const selected=nodes.find(n=>n.id===s.orgSel);
  return <div className="ix story-org">
    <div className="story-org__map">
      <StoryImage name="01_FormalNetwork" />
      <StoryImage name="01_HelpNetwork" className={'story-org__links '+(s.orgFlap?'is-on':'')} />
      {nodes.slice(0,5).map((n,i)=><button key={n.id} className="story-org__node" style={{left:spots[i][0]+'%',top:spots[i][1]+'%'}} tabIndex={ti(live)} onClick={()=>d({t:'orgSel',id:n.id})} aria-pressed={s.orgSel===n.id}>{n.name}</button>)}
      {s.orgFlap && <><button className="story-org__bubble bubble-a" tabIndex={ti(live)} aria-label="Example: finding the brand files" onClick={()=>d({t:'orgSel',id:'senior'})}>?</button><button className="story-org__bubble bubble-b" tabIndex={ti(live)} aria-label="Example: understanding the client" onClick={()=>d({t:'orgSel',id:'acct'})}>?</button></>}
    </div>
    <div className="story-org__copy">
      <p className="story-caption">{s.orgFlap?'Who helps in practice':'Who reports to whom'}</p>
      <p>{s.orgFlap?'The chart gives you roles. Conversations show you where to go. Tap a role or a speech bubble.':'A title tells you where someone sits. It doesn’t tell you everything they know.'}</p>
      <button className="ix-btn" tabIndex={ti(live)} aria-pressed={s.orgFlap} onClick={()=>d({t:'orgFlap'})}>{s.orgFlap?'Show the formal map':'Reveal the help routes'}</button>
      <button className="story-producer" tabIndex={ti(live)} onClick={()=>d({t:'orgSel',id:'prod'})}>Also on the team: Producer</button>
      <p className="story-response" role="status">{selected?<><b>{selected.name}. </b>{s.orgFlap?selected.unwritten:'Reveal the help routes to see what this person knows.'}</>:'This is a fictional studio. Your workplace may work differently.'}</p>
    </div>
  </div>;
}

export function StorySlips({s,d,day,live}:Props) {
  const [chosen,setChosen]=useState<number|null>(null);
  if(day.interaction.type!=='slips') return null;
  const ix=day.interaction,n=s.slipsPulled,i=Math.min(chosen??Math.max(0,n-1),Math.max(0,n-1));
  const sorted=Object.keys(s.slipSort).length, unlisted=Object.values(s.slipSort).filter(c=>c!=='Listed').length;
  return <div className="ix story-slips">
    <div className="story-slips__stage">
      <div className="story-pocket"><StoryImage name="03_Pocket" /><div className="story-pocket__text"><b>Job description</b><p>Print + digital work</p><p>Brand projects</p><p>Support the team</p></div></div>
      <div className="story-pulls">
        <StoryImage name="03_TaskStack" className="story-taskfan" style={{opacity:.2+n/8,clipPath:`inset(0 ${100-n/6*100}% 0 0)`}} />
        {n===0?<p className="story-empty">A short job description.<br />A much longer week.<br /><b>Pull the first slip.</b></p>:<div className="story-task" key={i}>
          <span className="story-caption">Task {i+1} of {n}</span><p>{ix.tasks[i]}</p>
          <div className="seg" role="group" aria-label={`Was “${ix.tasks[i]}” in the job description?`}>{ix.categories.map(c=><button key={c} tabIndex={ti(live)} aria-pressed={s.slipSort[i]===c} onClick={()=>d({t:'slipSort',i,cat:c})}>{c}</button>)}</div>
        </div>}
      </div>
    </div>
    <details className="story-jd"><summary>Read the full job description</summary><p>{ix.jd}</p></details>
    <div className="ix-row ix-row--between"><button className="ix-btn" tabIndex={ti(live)} disabled={n>=6} onClick={()=>{setChosen(null);d({t:'slipPull'});}}>{n>=6?'All six slips pulled':`${ix.verb} (${6-n} left)`}</button><div className="story-slipnav" role="group" aria-label="Review pulled tasks">{ix.tasks.slice(0,n).map((t,k)=><button key={k} tabIndex={ti(live)} title={t} aria-label={`Task ${k+1}: ${t}`} aria-pressed={i===k} onClick={()=>setChosen(k)}>{k+1}{s.slipSort[k]?' ✓':''}</button>)}</div></div>
    {sorted>=3 && <p className="story-synthesis" role="status">Your sort: <b>{unlisted} of {sorted}</b> tasks sit outside the explicit wording. “Support the team” leaves room for interpretation.</p>}
    {sorted===6 && <p className="ix-after">{ix.after}</p>}
  </div>;
}

export function StoryComments({s,d,day,live}:Props) {
  const [focus,setFocus]=useState<number|null>(null);
  const moved=useRef(false);
  const [drag,setDrag]=useState<{i:number;x:number;y:number;dx:number;dy:number}|null>(null);
  if(day.interaction.type!=='prioritise') return null;
  const ix=day.interaction;
  const notes:Art[]=['07_FeedbackPink','07_FeedbackYellow','07_FeedbackMint'];
  const regions=[{left:'16%',top:'22%',width:'65%',height:'28%'},{left:'14%',top:'59%',width:'73%',height:'14%'},{left:'48%',top:'37%',width:'25%',height:'21%'}];
  return <div className="ix story-comments">
    <p className="ix-hint">Tap a note to choose your reply order. Move or focus it to inspect the same proof.</p>
    <div className="story-comments__stage">
      <div className="story-proof"><StoryImage name="07_Poster" />{focus!==null&&<span className="story-proof__focus" style={regions[focus]} />}<span className="story-caption">One shared proof</span></div>
      {ix.comments.map((c,i)=>{const pos=s.order.indexOf(c.id);return <button key={c.id} className={'story-review review-'+i+(focus===i?' is-active':'')} tabIndex={ti(live)} aria-label={`${c.who}: ${c.text}${pos>=0?`. Reply ${pos+1}`:''}`} aria-pressed={pos>=0}
        style={drag?.i===i?{translate:`${drag.dx}px ${drag.dy}px`,zIndex:5}:undefined}
        onFocus={()=>setFocus(i)} onPointerEnter={()=>setFocus(i)}
        onPointerDown={e=>{moved.current=false;e.currentTarget.setPointerCapture(e.pointerId);setFocus(i);setDrag({i,x:e.clientX,y:e.clientY,dx:0,dy:0});}}
        onPointerMove={e=>setDrag(old=>{if(old?.i!==i)return old;const dx=e.clientX-old.x,dy=e.clientY-old.y;if(Math.abs(dx)+Math.abs(dy)>8)moved.current=true;return {...old,dx:Math.max(-50,Math.min(50,dx)),dy:Math.max(-35,Math.min(35,dy))};})}
        onPointerUp={()=>{if(drag && Math.abs(drag.dx)+Math.abs(drag.dy)>8){setDrag(null);return;}setDrag(null);}}
        onPointerCancel={()=>setDrag(null)}
        onClick={e=>{if(e.detail===0||!moved.current)d({t:'orderPick',id:c.id});}}>
        <StoryImage name={notes[i]} /><span className="story-review__text"><b>{c.who}</b><span>{c.text}</span></span>{pos>=0&&<i className="story-review__num">{pos+1}</i>}{s.persp==='team'&&<small className="story-review__after">Looking after {c.looksAfter}</small>}
      </button>;})}
    </div>
    {!!s.order.length&&<ol className="story-order" aria-label="Your reply order">{s.order.map((id,k)=>{const c=ix.comments.find(x=>x.id===id)!;return <li key={id}><span>{k+1}. {c.who}</span>{!s.orderDone&&<><button tabIndex={ti(live)} disabled={k===0} aria-label={`Move ${c.who} earlier`} onClick={()=>d({t:'orderMove',id,dir:-1})}>←</button><button tabIndex={ti(live)} disabled={k===s.order.length-1} aria-label={`Move ${c.who} later`} onClick={()=>d({t:'orderMove',id,dir:1})}>→</button></>}</li>;})}</ol>}
    <div className="ix-row">{!s.orderDone&&<button className="ix-btn" tabIndex={ti(live)} disabled={s.order.length<3} onClick={()=>d({t:'orderDone'})}>Write the reply ({s.order.length}/3)</button>}{!!s.order.length&&<button className="ix-btn ix-btn--ghost" tabIndex={ti(live)} onClick={()=>d({t:'orderReset'})}>Start over</button>}</div>
    {s.orderDone&&<p className="story-synthesis" role="status">You led with {ix.comments.find(c=>c.id===s.order[0])?.looksAfter}. That sets the first priority; the other two concerns still need a shared decision. {ix.after}</p>}
  </div>;
}

export function StoryDraft({s,d,day,live}:Props) {
  if(day.interaction.type!=='draft')return null;
  const ix=day.interaction,changed=s.draftRewritten||s.draftChoice==='send';
  return <div className="ix story-draft"><div className="story-message">
    <StoryImage name="14_Unsent" className={changed?'is-hidden':''} /><StoryImage name="14_Clarified" className={'story-message__new '+(changed?'is-on':'')} />
    <div className="story-message__text"><b>To: {ix.to}</b><span className="story-caption">{s.draftChoice==='send'?'Sent':'Unsent draft'}</span><p>{s.draftRewritten?ix.rewrite:ix.draft+'…'}</p></div>
  </div><div className="story-draft__actions">
    {!s.draftOpen?<><p>The export is waiting. So is the question.</p><button className="ix-btn" tabIndex={ti(live)} onClick={()=>d({t:'draftOpen'})}>{ix.verb}</button></>:<>
      <p>What do you do with it?</p><div className="ix-row"><button className="ix-btn" tabIndex={ti(live)} onClick={()=>d({t:'draftChoice',c:'send'})}>Send it</button><button className="ix-btn" tabIndex={ti(live)} onClick={()=>d({t:'draftChoice',c:'rewrite'})}>Rewrite it</button><button className="ix-btn ix-btn--ghost" tabIndex={ti(live)} onClick={()=>d({t:'draftChoice',c:'keep'})}>Keep it in drafts</button></div>
      {s.draftChoice&&<p className="story-response" role="status">{ix.options[s.draftChoice]}</p>}
    </>}
    <p className="ix-hint">An authored example. The response depends on the workplace.</p>
  </div></div>;
}

export function StoryRipple({value}:{value:number}) {
  return <div className={'story-ripple '+(value>=50?'is-revised':'')}><div className="story-ripple__art"><StoryImage name="21_VersionFan"/><StoryImage name="21_RippleLinks" className="story-ripple__links" style={{opacity:value/100}} /></div><div className="story-ripple__labels">{['Social proof','Phone format','Banner','Production plan'].map((t,i)=><span key={t} className={value>i*20+20?'is-affected':''}>{t}</span>)}</div><p className="ix-hint">{value>=50?'Same project. More versions. The deadline stays Friday.':'The Day 07 proof now has several formats. Slide to see what changes.'}</p></div>;
}

export function StoryAgenda({s,d,day,live}:Props) {
  if(day.interaction.type!=='agenda')return null;
  const ix=day.interaction,f=s.agendaFolds,learned=learnedItems(s);
  return <div className={'ix story-agenda f'+f}>
    <div className="story-agenda__paper"><StoryImage name="45_OpenAgenda"/><div className="story-agenda__panels">
      <section><b>What I learned</b>{learned.length?<ul className="story-learnings">{learned.map(t=><li key={t}>{t}</li>)}</ul>:<p>{ix.empty}</p>}{!learned.length&&<button className="story-link" tabIndex={ti(live)} onClick={()=>d({t:'turn',to:7})}>Return to Day 30</button>}</section>
      <section className={f>=1?'is-unfolded':''} aria-hidden={f<1}><b>What’s unclear</b><p>{ix.items[1].d}</p><b>Feedback, both ways</b><p>One thing to keep. One to change.</p></section>
      <section className={f>=2?'is-unfolded':''} aria-hidden={f<2}><b>The team asks</b><p>What support would help you own one piece of work before Day 90?</p><p>Bring a specific example of what’s going well.</p></section>
    </div></div>
    <div className="ix-row ix-row--between"><span className="story-caption">{ix.title} · both sides bring something</span><button className="ix-btn" tabIndex={ti(live)} onClick={()=>d({t:'agenda',n:f>=2?0:f+1})}>{f===0?ix.verb:f===1?'Unfold the last fold':'Fold it away'}</button></div>
    {f>=2&&<div className="story-questions"><StoryImage name="45_QuestionTabs"/><p>Keep doing?<br/>Change next?<br/>Support needed?</p></div>}
  </div>;
}

export function StoryFiles({s,d,day,live}:Props) {
  if(day.interaction.type!=='file')return null;
  const ix=day.interaction,loose=ix.items.map((t,i)=>({t,i})).filter(x=>s.filed[x.i]===undefined),next=loose[0];
  const uses=['A campaign ready to share','Consistent files for everyone','Decisions the team can find','A print error avoided','Someone else can get started','A clear next step'];
  return <div className="ix story-files">
    <div className="story-files__zones">{ix.trays.map((t,k)=><section key={t}><h4>{t}</h4><StoryImage name={k===0?'60_HeroWork':'60_Teamwork'}/><ul>{ix.items.map((label,i)=>s.filed[i]===k?<li key={i}><button tabIndex={ti(live)} title="Move to the other side" onClick={()=>d({t:'file',i,tray:k===0?1:0})}>{label} ↔</button>{k===1&&<small>{uses[i]}</small>}</li>:null)}</ul></section>)}</div>
    {next?<div className="story-filechoice" key={next.i}><p>{next.t}</p><div className="seg" role="group" aria-label={`File “${next.t}”`}>{ix.trays.map((t,k)=><button key={t} tabIndex={ti(live)} onClick={()=>d({t:'file',i:next.i,tray:k})}>{t}</button>)}</div><span className="ix-hint">{6-loose.length}/6 filed · you can move any filed item</span></div>:<p className="story-synthesis">{ix.after} Both sides hold useful evidence.</p>}
  </div>;
}

const keeps:{id:string;art:Art;label:string;unclear:string}[]=[
  {id:'d00',art:'03_Pocket',label:'The offer',unclear:'The offer gave a start date. It did not describe every task.'},
  {id:'d03',art:'03_TaskStack',label:'The task slips',unclear:'What belongs in the role still needs a conversation.'},
  {id:'d07',art:'07_Poster',label:'The shared proof',unclear:'Three concerns still need a shared priority.'},
  {id:'d14',art:'14_Clarified',label:'The question',unclear:'Asking makes the uncertainty visible. The response depends on the team.'},
  {id:'d21',art:'21_VersionFan',label:'The revised brief',unclear:'More deliverables do not create more time.'},
  {id:'d45',art:'45_OpenAgenda',label:'The check-in',unclear:'A useful agenda still needs follow-through from both sides.'},
  {id:'d60',art:'60_Teamwork',label:'The working traces',unclear:'Useful contributions may still be absent from a portfolio.'}
];
const shortNames:Record<string,string>={d00:'Offer',d03:'Tasks',d07:'Proof',d14:'Question',d21:'Brief',d45:'Check-in',d60:'Teamwork'};
export function EvidenceCollage({s,live=true}:{s:State;live?:boolean}) {
  const [sel,setSel]=useState<string|null>(null);
  const encountered=keeps.filter(k=>{const day=DAYS.find(x=>x.id===k.id)!;return didInteract(s,day);});
  const chosen=encountered.find(x=>x.id===sel);
  return <section className="story-collage" aria-label="Your desk evidence collage">
    <div className="story-collage__frame"><StoryImage name="90_EmptyEvidenceFrame"/><div className="story-collage__items">
      {encountered.length?encountered.map(k=><button key={k.id} tabIndex={ti(live)} onClick={()=>setSel(sel===k.id?null:k.id)} aria-pressed={sel===k.id} aria-label={`Reflect on ${k.label}`}>{k.id==='d00'?<span className="story-mini-letter">Dear new joiner,<br/>Welcome aboard.<br/>The Studio</span>:<StoryImage name={k.id==='d14'&&!s.draftRewritten&&s.draftChoice!=='send'?'14_Unsent':k.art}/>}<span>{shortNames[k.id]}</span></button>):<p>The desk is still clear.<br/>Try a day’s interaction and its working trace will appear here.</p>}
    </div></div>
    {chosen?<div className="story-collage__reflection" role="status"><b>What changed</b><p>{DAYS.find(x=>x.id===chosen.id)?.slip}</p><b>What remains unclear</b><p>{chosen.unclear}</p><button className="story-link" tabIndex={ti(live)} onClick={()=>setSel(null)}>Close reflection</button></div>:<p className="ix-hint">Only the objects you worked with appear here. Tap one to reflect. Nothing is scored.</p>}
  </section>;
}
