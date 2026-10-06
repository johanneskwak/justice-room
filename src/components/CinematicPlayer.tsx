'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Play,SkipForward} from '@phosphor-icons/react';
import Dialog from './Dialog';
import {type Clip,type Moment,momentLabels} from '@/lib/cinematics';
export type CinematicScene={moment:Moment;clip?:Clip;subtitle:string};
export default function CinematicPlayer({scenes,onClose,muted}:{scenes:CinematicScene[];onClose:()=>void;muted:boolean}){
  const [index,setIndex]=useState(0),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(false),[blocked,setBlocked]=useState(false);
  const video=useRef<HTMLVideoElement>(null),scene=scenes[index];
  useEffect(()=>{setFailed(false);setPlaying(false);setBlocked(false);},[index]);
  useEffect(()=>{
    if(!scene.clip)return;
    const id=setTimeout(()=>{if(!video.current||video.current.readyState<2)setFailed(true);},8000);
    return()=>clearTimeout(id);
  },[index,scene.clip]);
  const next=()=>{if(index+1<scenes.length)setIndex(index+1);else onClose();};
  return <Dialog title={`시네마틱 · ${momentLabels[scene.moment]}`} onClose={onClose}>
    <div className={`cinematic-player ${scene.moment}`}>
      {scene.clip&&!failed?<><video key={scene.clip.url} ref={video} src={scene.clip.url} poster={scene.clip.poster} preload="metadata" autoPlay playsInline controls muted={muted} onCanPlay={()=>video.current?.play().catch(()=>setBlocked(true))} onPlaying={()=>{setPlaying(true);setBlocked(false);}} onEnded={next} onError={()=>setFailed(true)} aria-label={momentLabels[scene.moment]}/>{!playing&&!blocked&&<span className="media-loading">장면 불러오는 중…</span>}{blocked&&<button className="video-play primary" onClick={()=>video.current?.play().catch(()=>setFailed(true))}><Play/> 영상 재생</button>}</>:
      <div className={`pixel-cinema ${scene.moment}`}><div className="cinema-rays"/><div className="cinema-actor"><div className="pixel-head"/><span className="pointing-arm"/>{scene.moment==='rebuttal'&&<i className="sweat-drop"/>}</div><strong>{momentLabels[scene.moment]}</strong><small>{failed?'영상을 재생할 수 없어 도트 연출로 전환했습니다.':'PIXEL CINEMATIC'}</small></div>}
      <div className="cinematic-subtitle">{scene.subtitle}</div>
    </div>
    <div className="cinematic-controls"><span>{String(index+1).padStart(2,'0')} / {String(scenes.length).padStart(2,'0')}</span><button className="secondary" onClick={onClose}><SkipForward/> 연출 건너뛰기</button><button className="primary" onClick={next}>{index+1<scenes.length?'다음 장면':'계속하기'} <ArrowRight/></button></div>
  </Dialog>;
}
