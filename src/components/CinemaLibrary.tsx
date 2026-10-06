'use client';
import {useState} from 'react';
import {FilmSlate,Play,Copy,DownloadSimple,Check} from '@phosphor-icons/react';
import {scenarios} from '@/lib/scenarios';
import {type ClipManifest,type Moment,moments,momentLabels,useMedia,validMediaUrl,resolveClip,clipPrompt} from '@/lib/cinematics';
import Dialog from './Dialog';
import CinematicPlayer from './CinematicPlayer';
function ClipEditor({code,moment,published}:{code:string;moment:Moment;published:ClipManifest}){
  const {manifest,setClip}=useMedia(),[url,setUrl]=useState(manifest.clips[code]?.[moment]?.url??''),[message,setMessage]=useState(''),[preview,setPreview]=useState(false),[prompt,setPrompt]=useState(false);
  const current=resolveClip(code,moment,manifest,published,process.env.NEXT_PUBLIC_OBJECTION_VIDEO_URL);
  return <article className="clip-editor"><header><span><FilmSlate size={18}/>{momentLabels[moment]}</span><small className={current?'connected':''}>{current?'영상 연결됨':'도트 연출'}</small></header>
    <label className="field-label">Higgsfield 결과 영상 주소<input placeholder="https://…/video.mp4" aria-label={`${momentLabels[moment]} 영상 주소`} value={url} onChange={e=>setUrl(e.target.value)}/></label>
    <div className="clip-actions"><button className="secondary" onClick={()=>{const v=url.trim();if(v&&!validMediaUrl(v)){setMessage('공개 HTTPS 주소 또는 /cinematics/ 안의 영상 경로를 입력하세요.');return;}setClip(code,moment,v);setMessage(v?'이 기기에 적용했습니다.':'개별 설정을 지웠습니다. 공통 영상 또는 기본 연출을 사용합니다.');}}><Check/> 적용</button><button className="secondary" onClick={()=>setPreview(true)}><Play/> 미리보기</button><button className="clip-prompt-toggle" onClick={()=>setPrompt(!prompt)}>생성 프롬프트</button></div>
    {message&&<p className="clip-message" role="status">{message}</p>}
    {prompt&&<div className="prompt-box"><p>{clipPrompt(code,moment)}</p><button className="secondary" onClick={()=>navigator.clipboard.writeText(clipPrompt(code,moment)).then(()=>setMessage('프롬프트를 복사했습니다.')).catch(()=>setMessage('복사할 수 없습니다. 위 텍스트를 선택해 복사하세요.'))}><Copy/> 복사</button></div>}
    {preview&&<CinematicPlayer scenes={[{moment,clip:current,subtitle:'연출 미리보기 · 게임 진행에는 영향을 주지 않습니다.'}]} muted onClose={()=>setPreview(false)}/>}
  </article>;
}
export default function CinemaLibrary({initialCode,published,onClose}:{initialCode:string;published:ClipManifest;onClose:()=>void}){
  const [code,setCode]=useState(initialCode),[exportMessage,setExportMessage]=useState(''),manifest=useMedia(s=>s.manifest);
  const download=()=>{const clips={...published.clips};for(const [key,value]of Object.entries(manifest.clips))clips[key]={...clips[key],...value};const blob=new Blob([JSON.stringify({version:1,clips},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='manifest.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setExportMessage('다운로드한 설정을 프로젝트의 public/cinematics/manifest.json에 반영하면 모든 플레이어에게 적용됩니다.');};
  return <Dialog title="연출 보관함 · HIGGSFIELD" onClose={onClose}><div className="cinema-library-intro"><FilmSlate size={30}/><h2>나의 사건에 장면을 더하세요.</h2><p>완성된 영상 주소를 연결하면 프롤로그, 반박, 에필로그에서 재생됩니다. 영상이 없어도 도트 연출로 계속 플레이할 수 있습니다.</p></div>
    <label className="field-label">적용할 사건<select value={code} onChange={e=>setCode(e.target.value)}><option value="shared">전체 사건 공통</option>{scenarios.map((s,i)=><option key={s.code} value={s.code}>0{i+1} · {s.subtitle}</option>)}</select></label>
    <div className="clip-list">{moments.map(moment=><ClipEditor key={`${code}-${moment}`} code={code} moment={moment} published={published}/>)}</div>
    <p className="muted">개별 사건의 영상이 공통 영상보다 먼저 적용됩니다. 이 화면은 완료된 영상을 연결하며 생성 요청이나 과금을 하지 않습니다. 비밀 API 키를 입력하지 마세요.</p>
    <button className="secondary full" onClick={download}><DownloadSimple/> 연출 설정 내보내기</button>{exportMessage&&<p className="muted" role="status">{exportMessage}</p>}
  </Dialog>;
}
