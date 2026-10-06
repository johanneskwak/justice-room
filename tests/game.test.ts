import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarios,objectRoom} from '../src/lib/scenarios';
import {useGame,isSave,snapshot} from '../src/lib/store';
import {statutes,lawCases,lawCaseOf,grade} from '../src/lib/lawcases';
const g=()=>useGame.getState();
const formAnswer=['굿즈 판매점','김하루','계약 취소 및 대금 반환'];
// 사건별 정답 경로. 증거 id → 요건은 데이터(lawcases)의 ok 표에서 읽습니다.
const routes:Record<number,{pw:Record<string,string>}>={0:{pw:{terminal:'0815'}},1:{pw:{terminal:'2130'}},2:{pw:{terminal:'1420'}},3:{pw:{}},4:{pw:{terminal:'최소침해'}}};
const answer=(code:string,step:number)=>lawCaseOf(code).quizzes.find(q=>q.step===step)!.options.find(o=>o.correct)!.id;
const wrongOption=(code:string,step:number)=>lawCaseOf(code).quizzes.find(q=>q.step===step)!.options.find(o=>!o.correct)!.id;
const elementRoute=(code:string)=>Object.fromEntries(lawCaseOf(code).elements.map(e=>[e.id,Object.keys(e.ok)[0]]));
const collectAll=(n:number)=>{const sc=scenarios[n];g().start(n);g().begin();const order=[0,1];for(const room of order){g().move(room);sc.objects.forEach((o,i)=>{if(objectRoom(sc,i)===room&&o.id!=='tip'&&o.type!=='ITEM_USE'&&!g().solved.includes(o.id))assert.equal(g().solve(o.id,routes[n].pw[o.id]),true,o.id);});
if(room===1)sc.objects.forEach((o,i)=>{if(objectRoom(sc,i)===room&&o.type==='ITEM_USE')assert.equal(g().solve(o.id,o.key,formAnswer),true,o.id);});}};
const toTrial=(n:number)=>{collectAll(n);assert.equal(g().craft('a','b'),true);g().enterTrial();assert.equal(g().phase,'trial');};

for(const n of [0,1,2,3,4]){const sc=scenarios[n],lc=lawCaseOf(sc.code);
test(`${sc.code}: statute puzzle runs from the first quiz to the last and finishes with grade S`,()=>{
toTrial(n);assert.deepEqual(lc.counterCards.filter(c=>g().cards.includes(c)).sort(),[...lc.counterCards].sort());
assert.equal(g().answerQuiz(answer(sc.code,0)).ok,true);assert.equal(g().answerQuiz(answer(sc.code,1)).ok,true);assert.equal(g().lawStep,2);
const route=elementRoute(sc.code);for(const el of lc.elements)assert.equal(g().placeElement(el.id,route[el.id]).ok,true,el.id);
assert.equal(g().lawStep,3);
for(let i=0;i<lc.cross.length;i++){const c=lc.cross[i];assert.equal(g().statement,i);assert.equal(g().presentLaw(c.evidence,c.statute).ok,false);g().press();assert.equal(g().presentLaw(c.evidence,c.statute).ok,true);}
assert.equal(g().lawStep,4);for(const c of lc.epilogueCards)assert.ok(g().cards.includes(c));
assert.equal(g().answerQuiz(answer(sc.code,4)).ok,true);assert.equal(g().phase,'won');assert.equal(g().mistakes,0);assert.equal(grade(g().mistakes),'S');assert.ok(isSave(snapshot(g())));
});
test(`${sc.code}: wrong quiz answers, wrong evidence and wrong statutes each cost a turn and a mistake`,()=>{
toTrial(n);const t0=g().turns;const r=g().answerQuiz(wrongOption(sc.code,0));assert.equal(r.ok,false);assert.ok(r.message.length>20);assert.equal(g().turns,t0-1);assert.equal(g().mistakes,1);assert.equal(g().lawStep,0);
g().answerQuiz(answer(sc.code,0));g().answerQuiz(answer(sc.code,1));
const first=lc.elements[0],okEv=Object.keys(first.ok)[0],badEv=Object.keys(first.reject)[0];
assert.equal(g().placeElement(first.id,badEv).ok,false);assert.equal(g().slots[first.id],undefined);assert.equal(g().placeElement(first.id,okEv).ok,true);
const route=elementRoute(sc.code);for(const el of lc.elements.slice(1))g().placeElement(el.id,route[el.id]);assert.equal(g().lawStep,3);
g().press();const m=g().mistakes,c0=lc.cross[0],wrongStatute=Object.keys(c0.wrongStatute)[0];
assert.equal(g().presentLaw(c0.evidence,wrongStatute).ok,false);assert.equal(g().mistakes,m+1);assert.equal(g().cleared.length,0);
const wrongEv=g().inventory.find(i=>i!==c0.evidence&&i!==lc.illegalId)!;assert.equal(g().presentLaw(wrongEv,c0.statute).ok,false);assert.equal(g().presentLaw(c0.evidence,c0.statute).ok,true);
});
test(`${sc.code}: cannot enter the trial before the evidence and the law book are collected`,()=>{
g().start(n);g().begin();
const need=(clue:string)=>sc.objects.findIndex(o=>o.clue===clue);
for(const clue of ['a','b']){const i=need(clue),o=sc.objects[i];g().move(objectRoom(sc,i));assert.equal(g().solve(o.id,o.type==='PASSCODE'?routes[n].pw[o.id]:o.key,formAnswer),true,o.id);}
g().craft('a','b');assert.ok(g().inventory.includes('c'));g().enterTrial();assert.equal(g().phase,'investigation');
});}

test('criminal: tip file is a temptation — taking it is allowed, using it costs admissibility',()=>{
toTrial(0);useGame.setState({inventory:[...g().inventory,'u']});g().answerQuiz(answer('SCENARIO_CRIMINAL',0));g().answerQuiz(answer('SCENARIO_CRIMINAL',1));
const r=g().placeElement('intent','u');assert.equal(r.ok,false);assert.equal(g().admissibility,75);assert.match(r.message,/제14조/);assert.match(r.message,/308조의2/);assert.equal(g().slots.intent,undefined);
});
test('contract: the 환불 불가 약관 photo is a decoy that fills no requirement',()=>{
toTrial(3);g().answerQuiz(answer('SCENARIO_CIVIL_CONTRACT',0));g().answerQuiz(answer('SCENARIO_CIVIL_CONTRACT',1));
for(const el of lawCases.SCENARIO_CIVIL_CONTRACT.elements){assert.equal(el.ok.g,undefined);assert.ok(el.reject.g);}
assert.equal(g().placeElement('minor','g').ok,false);assert.equal(g().admissibility,100);assert.equal(g().mistakes,1);
});
test('every statute referenced by game data exists with text and a source link',()=>{
for(const lc of Object.values(lawCases)){for(const c of lc.cross){assert.ok(statutes[c.statute],c.statute);for(const id of Object.keys(c.wrongStatute))assert.ok(statutes[id],id);}
for(const id of [lc.keyCard,...lc.counterCards,...lc.epilogueCards])assert.ok(statutes[id],id);
for(const q of lc.quizzes)for(const o of q.options)if(q.step===0)assert.ok(statutes[o.id],o.id);
const codex=scenarios.find(s=>s.code===lc.code)!.objects.find(o=>o.cards)!;for(const id of codex.cards!)assert.ok(statutes[id],id);assert.ok(codex.cards!.includes(lc.keyCard));
for(const c of lc.cross)assert.ok(codex.cards!.includes(c.statute)||lc.counterCards.includes(c.statute)||lc.epilogueCards.includes(c.statute),`${c.statute} is reachable`);}
for(const s of Object.values(statutes)){assert.ok(s.text.length>5&&s.plain.length>5&&s.url.startsWith('https://law.go.kr/'));}
});
test('wrong password uses one turn; last action ends game; terminal state freezes actions',()=>{g().start(0);g().begin();g().move(0);const t=g().turns;assert.equal(g().solve('terminal','0000'),false);assert.equal(g().turns,t-1);useGame.setState({turns:1});g().solve('terminal','0000');assert.equal(g().turns,0);assert.equal(g().phase,'lost');g().move(1);g().consult();g().craft('a','b');assert.equal(g().turns,0);assert.equal(g().money,300000);});
test('consultation charges only once and restart clears state',()=>{g().start(1);g().begin();g().consult();assert.equal(g().money,260000);g().consult();assert.equal(g().money,260000);g().start(0);assert.equal(g().money,300000);assert.equal(g().turns,24);assert.deepEqual(g().inventory,[]);assert.deepEqual(g().cards,[]);});
test('item-use puzzle requires source clue and all correct form fields',()=>{g().start(3);g().begin();g().move(1);assert.equal(g().solve('terminal','a',formAnswer),false);g().move(0);g().solve('calendar');g().move(1);assert.equal(g().solve('terminal','a',['우체국','김하루','계약 취소 및 대금 반환']),false);assert.equal(g().solve('terminal','a',formAnswer),true);});
test('cloud save validation rejects invalid states and accepts saves from before the statute update',()=>{g().start(0);assert.equal(isSave(null),false);assert.equal(isSave({...snapshot(g()),scenario:99}),false);assert.equal(isSave({...snapshot(g()),inventory:['fake']}),false);assert.equal(isSave({...snapshot(g()),turns:-1}),false);assert.equal(isSave({...snapshot(g()),cards:['FAKE']}),false);assert.equal(isSave({...snapshot(g()),slots:{deceit:'zz'}}),false);assert.equal(isSave({...snapshot(g()),inventory:['f','g'],cards:['M5'],slots:{minor:'d'}}),true);
const old:Record<string,unknown>={...snapshot(g())};for(const k of ['cards','slots','cleared','lawStep','mistakes'])delete old[k];assert.equal(isSave(old),true);g().restore(old as never);assert.deepEqual(g().cards,[]);assert.equal(g().lawStep,0);});
test('labor: secret recording of the boss is rejected, and the policy of 3-month filing is taught before the trial ends',()=>{
toTrial(1);useGame.setState({inventory:[...g().inventory,'u']});assert.equal(g().answerQuiz(answer('SCENARIO_LABOR',0)).ok,true);
const r=g().answerQuiz(answer('SCENARIO_LABOR',1));assert.match(r.message,/3개월/);assert.match(r.message,/제28조/);
const bad=g().placeElement('worker','u');assert.equal(bad.ok,false);assert.equal(g().admissibility,75);assert.match(bad.message,/제14조/);
});
test('tort: the secret SNS login is rejected under the information-network law, and 과실상계 is reached through the 제763조 bridge',()=>{
toTrial(2);useGame.setState({inventory:[...g().inventory,'u']});g().answerQuiz(answer('SCENARIO_CIVIL_TORT',0));g().answerQuiz(answer('SCENARIO_CIVIL_TORT',1));
const bad=g().placeElement('fault','u');assert.equal(bad.ok,false);assert.equal(g().admissibility,75);assert.match(bad.message,/제49조/);
const lc=lawCaseOf('SCENARIO_CIVIL_TORT');assert.equal(lc.cross[2].statute,'M396');assert.ok(lc.cross[2].wrongStatute.M763);assert.match(statutes.M763.text,/제396조/);
});
