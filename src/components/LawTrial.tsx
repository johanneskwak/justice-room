'use client';
import {useEffect,useState} from 'react';
import {Scales,Check,ArrowRight,Warning,BookOpen,Gavel} from '@phosphor-icons/react';
import {useGame,Feedback} from '@/lib/store';
import {scenarios} from '@/lib/scenarios';
import {statutes,lawCaseOf,LawCase} from '@/lib/lawcases';
import World from './World';


function Result({fb}:{fb:Feedback|null}){if(!fb)return null;return <div className={`law-feedback ${fb.ok?'ok':'bad'}`} role="status">{fb.ok?<Check size={18} weight="bold"/>:<Warning size={18} weight="bold"/>}<p>{fb.message}{!fb.ok&&<small> −1 TURN</small>}</p></div>;}

function Quiz({lc,step,onFeedback}:{lc:LawCase;step:number;onFeedback:(f:Feedback)=>void}){
  const s=useGame(),quiz=lc.quizzes.find(q=>q.step===step)!;
  return <div className="law-card"><span className="law-tag">STEP {step===4?5:step+1} · {quiz.title}</span><h2>{quiz.question}</h2>
    <div className="law-options">{quiz.options.map(o=>{const st=statutes[o.id];return <button key={o.id} className="law-option" onClick={()=>onFeedback(s.answerQuiz(o.id))}><strong>{o.label}</strong>{step===0&&st&&<><em>{st.law} {st.article}</em><span>{st.text}</span></>}</button>;})}</div></div>;
}

function Elements({lc,onFeedback}:{lc:LawCase;onFeedback:(f:Feedback)=>void}){
  const s=useGame(),sc=scenarios[s.scenario],[pick,setPick]=useState<Record<string,string>>({});
  const title=(id:string)=>sc.clues.find(c=>c.id===id)?.title??id;
  return <div className="law-card"><span className="law-tag">STEP 3 · 요건 입증</span><h2>{lc.elementsTitle}</h2>
    <p className="law-sub">증거 가방의 자료 중 요건에 맞는 것을 골라 제시합니다. 틀리면 1턴이 소모됩니다.</p>
    <ol className="law-elements">{lc.elements.map((el,i)=>{const done=s.slots[el.id],partial=done&&el.ok[done]==='partial';
      return <li key={el.id} className={done?(partial?'partial':'done'):''}><div className="law-el-head"><b>{i+1}</b><div><strong>{el.name}</strong><small>{el.kind==='case'?'판례·통설상 요건':'조문에 근거'} · {el.basis}</small></div></div><p>{el.desc}</p>
        {done?<div className="law-filled"><Check size={15} weight="bold"/> {title(done)} <em>{partial?'정황 · 추가 수사 필요':'입증'}</em></div>
        :<div className="law-pick"><select aria-label={`${el.name}에 제시할 증거`} value={pick[el.id]??''} onChange={e=>setPick({...pick,[el.id]:e.target.value})}><option value="">증거 선택</option>{s.inventory.map(id=><option key={id} value={id}>{title(id)}</option>)}</select><button className="secondary" disabled={!pick[el.id]} onClick={()=>onFeedback(s.placeElement(el.id,pick[el.id]))}>제시</button></div>}</li>;})}</ol></div>;
}

function Cross({lc,onFeedback,onObjection}:{lc:LawCase;onFeedback:(f:Feedback)=>void;onObjection:()=>void}){
  const s=useGame(),sc=scenarios[s.scenario],[ev,setEv]=useState(''),[st,setSt]=useState(''),c=lc.cross[s.statement];
  useEffect(()=>{setEv('');setSt('');},[s.statement,s.pressed]);
  const title=(id:string)=>sc.clues.find(c=>c.id===id)?.title??id;
  return <div className="law-card"><span className="law-tag">STEP 4 · 심문 · 증거 + 조문으로 반박</span>
    <div className="law-progress">{lc.cross.map((_,i)=><span key={i} className={s.cleared.includes(i)?'done':i===s.statement?'now':''}>{s.cleared.includes(i)?<Check size={12} weight="bold"/>:i+1}</span>)}</div>
    <blockquote key={s.statement} className="testimony-enter">“{sc.statements[s.statement]}”</blockquote>
    <div className="law-actions"><button className="secondary" disabled={s.pressed} onClick={s.press}>잠깐! 추궁하기 <small>−1 TURN</small></button><button className="secondary" onClick={s.nextStatement}>다음 진술 <ArrowRight/></button></div>
    {s.pressed?<>
      <p className="law-press">{sc.press[s.statement]}</p><p className="law-hint"><BookOpen size={15}/> 힌트: {c.hint}</p>
      <div className="law-present"><label>증거<select value={ev} onChange={e=>setEv(e.target.value)}><option value="">증거 선택</option>{s.inventory.map(id=><option key={id} value={id}>{title(id)}</option>)}</select></label>
        <label>근거 조문<select value={st} onChange={e=>setSt(e.target.value)}><option value="">조문 선택</option>{s.cards.map(id=><option key={id} value={id}>{statutes[id].law} {statutes[id].article} · {statutes[id].title}</option>)}</select></label>
        <button className="primary" disabled={!ev||!st} onClick={()=>{const r=s.presentLaw(ev,st);onFeedback(r);if(r.ok)onObjection();}}><Gavel size={18}/> 이의 있습니다! <small>틀리면 −1 TURN</small></button></div></>
      :<p className="law-press muted">먼저 “추궁하기”로 진술의 허점을 확인하세요.</p>}</div>;
}

export default function LawTrial({onObjection}:{onObjection:()=>void}){
  const s=useGame(),sc=scenarios[s.scenario],lc=lawCaseOf(sc.code),[fb,setFb]=useState<Feedback|null>(null),stepNames=lc.stepNames;
  const go=(f:Feedback)=>{setFb(f);};
  const pressure=Math.round(s.cleared.length/lc.cross.length*100);
  return <section className="law-panel"><div className="panel-top"><div><span className="live-dot"/><strong>{sc.venue}</strong><span className="location-tag">LAW PUZZLE</span></div><span className="scene-time">조문 {s.cards.length}장 보유</span></div>
    <ol className="law-steps" aria-label="진행 단계">{stepNames.map((n,i)=><li key={n} className={i<s.lawStep?'done':i===s.lawStep?'now':''}><span>{i<s.lawStep?<Check size={12} weight="bold"/>:i+1}</span>{n}</li>)}</ol>
    <div className={`law-banner ${fb&&!fb.ok?'trial-mistake':''}`}><World room={-1} scenario={s.scenario} mode="trial" reaction={s.cleared.length>0?'shaken':'calm'} onInteract={()=>{}}/><span className="law-banner-badge"><Scales size={16}/> {stepNames[s.lawStep]}</span></div>
    <div className="battle-hud"><div><span>HARU · 나의 입증</span><strong>{s.cleared.length} / {lc.cross.length}<small> 모순 확인</small></strong></div><div className="pressure-meter"><i style={{width:`${pressure}%`}}/></div><div><span>상대방의 진술</span><strong>{pressure===100?'모순 확인 완료':pressure>0?'진술이 흔들리고 있다':'아직 반박되지 않았다'}</strong></div></div><div className="law-body">{s.lawStep===0||s.lawStep===1||s.lawStep===4?<Quiz key={s.lawStep} lc={lc} step={s.lawStep} onFeedback={go}/>:s.lawStep===2?<Elements lc={lc} onFeedback={go}/>:<Cross lc={lc} onFeedback={go} onObjection={onObjection}/>}
      <Result fb={fb}/></div></section>;
}
