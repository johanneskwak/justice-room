import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {scenarios,objectRoom} from './scenarios';
import {cardIds,elementIds,lawCases,LawCase} from './lawcases';
export type Phase='prologue'|'investigation'|'trial'|'won'|'lost';
// lawStep(조문 사건 전용): 0 죄명 특정 · 1 고소 접수 · 2 요건 입증 · 3 심문 · 4 이의신청
export type Save={scenario:number;phase:Phase;room:number;turns:number;money:number;inventory:string[];solved:string[];admissibility:number;credibility:number;pressed:boolean;statement:number;log:string[];consulted:boolean;cards:string[];slots:Record<string,string>;cleared:number[];lawStep:number;mistakes:number};
export type Feedback={ok:boolean;message:string};
const initial=(scenario=0):Save=>({scenario,phase:'prologue',room:-1,turns:24,money:300000,inventory:[],solved:[],admissibility:100,credibility:10,pressed:false,statement:0,log:['사건 수첩을 열었습니다. 기록에서 진실을 찾아보세요.'],consulted:false,cards:[],slots:{},cleared:[],lawStep:0,mistakes:0});
type Store=Save&{start:(n:number)=>void;begin:()=>void;move:(room:number)=>void;solve:(id:string,key?:string,form?:string[])=>boolean;craft:(a:string,b:string)=>boolean;consult:()=>void;enterTrial:()=>void;press:()=>void;nextStatement:()=>void;restore:(s:Save)=>void;
answerQuiz:(optionId:string)=>Feedback;placeElement:(elementId:string,evidenceId:string)=>Feedback;presentLaw:(evidenceId:string,statuteId:string)=>Feedback};
const active=(s:Save)=>s.turns>0&&s.phase==='investigation';
const spend=(s:Save,msg:string):Partial<Save>=>({turns:Math.max(0,s.turns-1),phase:s.turns<=1?'lost':s.phase,log:[msg,...s.log].slice(0,20)});
const lawOf=(s:Save)=>lawCases[scenarios[s.scenario].code];
const union=(a:string[],b:string[])=>[...new Set([...a,...b])];
const canAct=(s:Save)=>s.turns>0&&s.phase==='trial';
export const useGame=create<Store>()(persist((set,get)=>{
// 조문 사건에서 틀리면 1턴이 소모되고 실수 횟수가 쌓입니다. 최종 등급(S~C)은 실수 횟수로 매깁니다.
const fail=(s:Save,message:string,extra:Partial<Save>={}):Feedback=>{set({...spend(s,message),mistakes:s.mistakes+1,...extra});return {ok:false,message};};
const illegal=(s:Save,lc:LawCase):Feedback=>fail(s,lc.illegalMessage??'사용할 수 없는 증거입니다.',{admissibility:Math.max(0,s.admissibility-25),credibility:Math.max(0,s.credibility-10)});
return {...initial(),start:n=>set(initial(n)),begin:()=>set({phase:'investigation'}),
move:room=>{const s=get();if(active(s)&&room!==s.room&&room>=-1&&room<2)set({room,...spend(s,room<0?'마을로 돌아왔습니다.':`${scenarios[s.scenario].rooms[room]}에 도착했습니다.`)});},
solve:(id,key='',form=[])=>{const s=get(),sc=scenarios[s.scenario],o=sc.objects.find(o=>o.id===id);if(!active(s)||!o||s.solved.includes(id)||s.room<0)return false;
const index=sc.objects.indexOf(o);if(objectRoom(sc,index)!==s.room)return false;
const ok=o.type==='INSPECT'||o.type==='PASSCODE'&&key.trim()===o.key||o.type==='ITEM_USE'&&key===o.key&&s.inventory.includes(key)&&form.length===3&&form[0]==='굿즈 판매점'&&form[1]==='김하루'&&form[2]==='계약 취소 및 대금 반환';
if(!ok){set(spend(s,'퍼즐이 맞지 않습니다. 단서와 입력 내용을 다시 확인하세요.'));return false;}
const msg=o.clue?`증거 획득: ${sc.clues.find(c=>c.id===o.clue)?.title}`:o.cards?`법전 카드 ${o.cards.length}장을 얻었습니다.`:o.hint;
set({...spend(s,msg),solved:[...s.solved,id],inventory:o.clue?union(s.inventory,[o.clue]):s.inventory,cards:o.cards?union(s.cards,o.cards):s.cards,credibility:Math.min(100,s.credibility+(o.clue&&o.clue!=='u'?20:0))});return true;},
craft:(a,b)=>{const s=get(),sc=scenarios[s.scenario];if(!active(s)||s.inventory.includes('c'))return false;if(a===b||!s.inventory.includes(a)||!s.inventory.includes(b))return false;if(!sc.recipe.slice(0,2).every(x=>[a,b].includes(x))){set(spend(s,'두 자료 사이에 연결점을 찾지 못했습니다.'));return false;}set({...spend(s,'증거 연결 완료! 원본을 포함한 제출 자료집을 완성했습니다.'),inventory:[...s.inventory,'c'],credibility:Math.min(100,s.credibility+35)});return true;},
consult:()=>{const s=get(),sc=scenarios[s.scenario],cost=sc.cost;if(!active(s)||s.consulted||s.money<cost)return;set({...spend(s,sc.advice),money:s.money-cost,consulted:true,credibility:Math.min(100,s.credibility+10)});},
enterTrial:()=>{const s=get();if(!active(s)||!s.inventory.includes('c'))return;
const lc=lawOf(s);if(!lc.required.every(i=>s.inventory.includes(i))||!s.cards.includes(lc.keyCard))return;
set({phase:'trial',pressed:false,statement:0,lawStep:0,cards:union(s.cards,lc.counterCards),log:[lc.startLog,...s.log].slice(0,20)});},
press:()=>{const s=get();if(s.phase!=='trial'||s.turns<1||s.pressed)return;if(s.lawStep!==3||s.cleared.includes(s.statement))return;set({...spend(s,scenarios[s.scenario].press[s.statement]),pressed:true});},
nextStatement:()=>{const s=get();if(s.phase!=='trial')return;const n=lawOf(s).cross.length;let next=(s.statement+1)%n;for(let i=0;i<n&&s.cleared.includes(next);i++)next=(next+1)%n;set({statement:next,pressed:false});},
restore:s=>{if(isSave(s))set(normalizeSave(s));},
answerQuiz:optionId=>{const s=get(),lc=lawOf(s),quiz=lc?.quizzes.find(q=>q.step===s.lawStep);if(!canAct(s)||!quiz)return {ok:false,message:'지금은 답할 수 없습니다.'};
const o=quiz.options.find(o=>o.id===optionId);if(!o)return {ok:false,message:'선택지를 찾을 수 없습니다.'};
if(!o.correct)return fail(s,`${o.label} — ${o.explain}`);
if(s.lawStep===4){set({phase:'won',log:['모든 절차를 마쳤습니다. 결과를 확인하세요.',...s.log].slice(0,20)});return {ok:true,message:o.explain};}
set({lawStep:s.lawStep+1,log:[`${quiz.title} 통과`,...s.log].slice(0,20),credibility:Math.min(100,s.credibility+10)});return {ok:true,message:o.explain};},
placeElement:(elementId,evidenceId)=>{const s=get(),lc=lawOf(s),el=lc?.elements.find(e=>e.id===elementId);if(!lc||!canAct(s)||s.lawStep!==2||!el||s.slots[elementId]||!s.inventory.includes(evidenceId))return {ok:false,message:'지금은 제시할 수 없습니다.'};
if(lc.illegalId&&evidenceId===lc.illegalId)return illegal(s,lc);
if(!el.ok[evidenceId])return fail(s,el.reject[evidenceId]??el.fallback);
const slots={...s.slots,[elementId]:evidenceId},done=lc.elements.every(e=>slots[e.id]);
set({slots,lawStep:done?3:2,pressed:false,statement:0,credibility:Math.min(100,s.credibility+10),log:[`요건 입증: ${el.name}`,...s.log].slice(0,20)});
return {ok:true,message:el.success[evidenceId]};},
presentLaw:(evidenceId,statuteId)=>{const s=get(),lc=lawOf(s),c=lc?.cross[s.statement];if(!lc||!canAct(s)||s.lawStep!==3||!c||!s.pressed||s.cleared.includes(s.statement)||!s.inventory.includes(evidenceId)||!s.cards.includes(statuteId))return {ok:false,message:'먼저 진술을 추궁하세요. (추궁 후 증거와 조문을 고를 수 있습니다.)'};
if(lc.illegalId&&evidenceId===lc.illegalId)return illegal(s,lc);
if(evidenceId!==c.evidence)return fail(s,c.wrongEvidence,{credibility:Math.max(0,s.credibility-10)});
if(statuteId!==c.statute)return fail(s,c.wrongStatute[statuteId]??c.generic,{credibility:Math.max(0,s.credibility-10)});
const cleared=[...s.cleared,s.statement],all=cleared.length===lc.cross.length,next=lc.cross.map((_,i)=>i).find(i=>!cleared.includes(i))??0;
set({cleared,pressed:false,statement:next,lawStep:all?4:3,cards:all?union(s.cards,lc.epilogueCards):s.cards,credibility:Math.min(100,s.credibility+15),log:['모순을 입증했습니다.',...s.log].slice(0,20)});
return {ok:true,message:c.success};}};
},{name:'justice-room-save-v1',version:1,partialize:s=>snapshot(s),merge:(persisted,current)=>isSave(persisted)?{...current,...normalizeSave(persisted)}:current}));
export function snapshot(s:Save):Save {return {scenario:s.scenario,phase:s.phase,room:s.room,turns:s.turns,money:s.money,inventory:s.inventory,solved:s.solved,admissibility:s.admissibility,credibility:s.credibility,pressed:s.pressed,statement:s.statement,log:s.log,consulted:s.consulted,cards:s.cards,slots:s.slots,cleared:s.cleared,lawStep:s.lawStep,mistakes:s.mistakes};}
const objectIds=['calendar','terminal','phone','bank','box','codex','tip','family','allowance','chat','terms','roster','text','record','scene','bill','stats','impact','aid'],clueIds=['a','b','c','d','e','f','g','u'];
export function isSave(s:unknown):s is Save{if(!s||typeof s!=='object')return false;const x=s as Save;
const slotsOk=x.slots===undefined||!!x.slots&&typeof x.slots==='object'&&!Array.isArray(x.slots)&&Object.entries(x.slots).every(([k,v])=>elementIds.includes(k)&&clueIds.includes(v));
const clearedOk=x.cleared===undefined||Array.isArray(x.cleared)&&x.cleared.every(i=>[0,1,2].includes(i));
const cardsOk=x.cards===undefined||Array.isArray(x.cards)&&x.cards.every(i=>cardIds.includes(i));
const stepOk=x.lawStep===undefined||Number.isInteger(x.lawStep)&&x.lawStep>=0&&x.lawStep<=4;
const mistakesOk=x.mistakes===undefined||Number.isInteger(x.mistakes)&&x.mistakes>=0&&x.mistakes<=999;
return Number.isInteger(x.scenario)&&x.scenario>=0&&x.scenario<5&&['prologue','investigation','trial','won','lost'].includes(x.phase)&&Number.isInteger(x.room)&&x.room>=-1&&x.room<2&&Number.isInteger(x.turns)&&x.turns>=0&&x.turns<=24&&Number.isFinite(x.money)&&x.money>=0&&x.money<=300000&&['admissibility','credibility'].every(k=>Number.isFinite(x[k as keyof Save])&&Number(x[k as keyof Save])>=0&&Number(x[k as keyof Save])<=100)&&Array.isArray(x.inventory)&&x.inventory.every(i=>clueIds.includes(i))&&Array.isArray(x.solved)&&x.solved.every(i=>objectIds.includes(i))&&Array.isArray(x.log)&&x.log.length<=20&&x.log.every(i=>typeof i==='string')&&typeof x.consulted==='boolean'&&typeof x.pressed==='boolean'&&[0,1,2].includes(x.statement)&&slotsOk&&clearedOk&&cardsOk&&stepOk&&mistakesOk;}

export function normalizeSave(saved:Save):Save {
 const normalized={...initial(saved.scenario),...saved};
 // Legacy saves may have entered a trial before the law-card system existed.
 if(saved.cards===undefined&&normalized.phase==='trial'){normalized.phase='investigation';normalized.lawStep=0;normalized.pressed=false;}
 return normalized;
}
