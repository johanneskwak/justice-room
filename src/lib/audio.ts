let audio:AudioContext|undefined,timer:ReturnType<typeof setInterval>|undefined,enabled=false;
let theme:'explore'|'trial'='explore';
function tone(frequency:number,start:number,duration:number,volume=.025,type:OscillatorType='square'){
  if(!audio||!enabled)return;
  const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+start;
  o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+duration+.01);
}
export function setSoundTheme(value:'explore'|'trial'){theme=value;}
export function sound(on:boolean){
  if(timer)clearInterval(timer);enabled=on;
  if(!on){void audio?.suspend();return;}
  try{audio??=new AudioContext();void audio.resume();let i=0;timer=setInterval(()=>{
    const notes=theme==='trial'?[164.81,196,164.81,233.08,220,196,174.61,146.83]:[261.63,329.63,392,523.25,392,329.63,293.66,349.23];
    tone(notes[i++%notes.length],0,.16,.012,'triangle');
  },280);}catch{enabled=false;}
}
export function sfx(kind:'discover'|'craft'|'objection'|'wrong'|'step'|'victory'){
  const notes={discover:[523,659,784],craft:[392,523,659,1047],objection:[196,392,784,1047],wrong:[220,164,110],step:[349,440],victory:[523,659,784,1047,784,1047]}[kind];
  notes.forEach((n,i)=>tone(n,i*.09,.16,kind==='objection'?.045:.025));
}
