import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {scenarios} from './scenarios';
export const moments=['prologue','objection','rebuttal','victory'] as const;
export type Moment=typeof moments[number];
export type Clip={url:string;poster?:string;jobId?:string;provider?:'higgsfield'|'custom'};
export type ClipManifest={version:1;clips:Record<string,Partial<Record<Moment,Clip>>>};
export const momentLabels:Record<Moment,string>={prologue:'사건 프롤로그',objection:'이의 있습니다!',rebuttal:'상대방의 균열',victory:'사건 에필로그'};
export function validMediaUrl(value:unknown):value is string {
  if(typeof value!=='string'||value.length>2048)return false;
  if(/^\/cinematics\/[a-zA-Z0-9_./-]+\.(mp4|webm|png|jpg|jpeg|webp)$/.test(value)&&!value.includes('..'))return true;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}
}
export function parseManifest(input:unknown):ClipManifest {
  const result:ClipManifest={version:1,clips:{}};
  if(!input||typeof input!=='object')return result;
  const source=input as Partial<ClipManifest>;
  if(source.version!==1||!source.clips||typeof source.clips!=='object')return result;
  for(const code of ['shared',...scenarios.map(s=>s.code)]){
    const slots=source.clips[code];if(!slots||typeof slots!=='object')continue;
    for(const moment of moments){const clip=slots[moment];if(!clip||!validMediaUrl(clip.url))continue;
      (result.clips[code]??={})[moment]={url:clip.url,...(validMediaUrl(clip.poster)?{poster:clip.poster}:{}),...(typeof clip.jobId==='string'?{jobId:clip.jobId}:{}),provider:clip.provider==='higgsfield'?'higgsfield':'custom'};
    }
  }
  return result;
}
export function resolveClip(code:string,moment:Moment,local:ClipManifest,published:ClipManifest,legacy?:string):Clip|undefined {
  return local.clips[code]?.[moment]??published.clips[code]?.[moment]??local.clips.shared?.[moment]??published.clips.shared?.[moment]??(moment==='objection'&&validMediaUrl(legacy)?{url:legacy,provider:'custom'}:undefined);
}
type MediaStore={manifest:ClipManifest;setClip:(code:string,moment:Moment,url:string)=>void};
export const useMedia=create<MediaStore>()(persist((set)=>({manifest:{version:1,clips:{}},setClip:(code,moment,url)=>set(s=>{
  const manifest=parseManifest(s.manifest);const slots={...manifest.clips[code]};
  if(url)slots[moment]={url,provider:'higgsfield'};else delete slots[moment];
  return {manifest:parseManifest({version:1,clips:{...manifest.clips,[code]:slots}})};
})}),{name:'justice-room-cinematics-v1',partialize:s=>({manifest:s.manifest}),merge:(saved,current)=>({...current,manifest:parseManifest((saved as {manifest?:unknown}|undefined)?.manifest)})}));
export function clipPrompt(code:string,moment:Moment){
  const sc=scenarios.find(s=>s.code===code)??scenarios[0];
  const shot={prologue:sc.prologue[1],objection:'The student confidently points forward to present evidence, quick camera push in, then hold the pose.',rebuttal:'The opposing adult is startled by contradictory evidence, sweats, looks down at the document, no violence or humiliation.',victory:'The student steps out into a hopeful evening town, holds a case folder close, relieved but thoughtful expression.'}[moment];
  return `Original 16-bit pixel art narrative RPG, 16:9, 5 seconds. Consistent Korean teen protagonist: short dark hair, pale yellow jacket, navy trousers. Muted teal, moss green and warm ivory palette, crisp pixel grid. ${shot} One clear readable action, no text, no logos, no copyrighted characters. Scene context: ${sc.subtitle}.`;
}
