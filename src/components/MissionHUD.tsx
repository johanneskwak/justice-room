'use client';
import {Compass,Check,Link,Scales,MapPin} from '@phosphor-icons/react';
import {useGame} from '@/lib/store';
import {scenarios,objectRoom} from '@/lib/scenarios';
import {lawCaseOf} from '@/lib/lawcases';
export default function MissionHUD(){
  const s=useGame(),sc=scenarios[s.scenario],lc=lawCaseOf(sc.code);
  if(s.phase!=='investigation')return null;
  const local=sc.objects.filter((o,i)=>objectRoom(sc,i)===s.room),found=local.filter(o=>s.solved.includes(o.id)).length;
  const need=lc.gather.filter(id=>!s.inventory.includes(id)),book=!s.cards.includes(lc.keyCard),crafted=s.inventory.includes('c');
  const next=need.length?`${sc.clues.find(c=>c.id===need[0])?.title} 찾기`:book?'법률 핸드북에서 조문 카드 얻기':!crafted?'두 원본을 연결해 자료집 완성하기':'증거 준비 완료 · 사건 접수하기';
  return <section className="mission-hud"><div className="mission-marker"><Compass size={22}/></div><div className="mission-copy"><span>ACTIVE QUEST <b>0{s.scenario+1}</b></span><strong>{next}</strong><small>{s.room<0?'지도에서 장소를 선택하거나 바닥을 클릭해 걸어가세요.':`${sc.rooms[s.room]} · 조사 ${found}/${local.length} · 걸음에는 턴이 들지 않습니다.`}</small></div><div className="quest-pips" aria-label="조사 진행"><span className={!need.length?'done':''}><MapPin size={15}/></span><i/><span className={crafted?'done':''}><Link size={15}/></span><i/><span className={!need.length&&!book&&crafted?'done':''}><Scales size={15}/></span></div>{s.room>=0&&found===local.length&&<Check size={18} className="mission-done"/>}</section>;
}
