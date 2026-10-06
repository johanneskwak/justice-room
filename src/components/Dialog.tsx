'use client';
import {useEffect,useRef} from 'react';
import {X} from '@phosphor-icons/react';
export default function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
  const ref=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const prev=document.activeElement as HTMLElement;ref.current?.focus();
    const handler=(e:KeyboardEvent)=>{
      const dialogs=document.querySelectorAll('[role="dialog"]');if(dialogs[dialogs.length-1]!==ref.current)return;
      if(e.key==='Escape'){e.preventDefault();close.current();}
      if(e.key!=='Tab')return;
      const els=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],video[controls]');
      if(!els?.length){e.preventDefault();return;}
      const first=els[0],last=els[els.length-1];
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);prev?.focus();};
  },[]);
  return <div className="scrim" onClick={onClose}><div className="dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={e=>e.stopPropagation()}><div className="dialog-head"><span>{title}</span><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={22}/></button></div>{children}</div></div>;
}
