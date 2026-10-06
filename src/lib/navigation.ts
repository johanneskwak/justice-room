export type Point = { x: number; y: number };
export type Block = readonly [number, number, number, number];
export const townBlocks: Block[] = [[52,45,164,151],[231,77,92,111],[502,27,227,159],[60,331,190,109],[517,335,176,105]];
export const roomBlocks: Block[] = [[285,160,205,98],[530,220,95,86]];
export const entrances = [{x:136,y:216,room:0},{x:605,y:316,room:1},{x:614,y:207,room:2}];
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
export function walkable(p:Point,indoor:boolean) {
  return p.x>=20&&p.x<=780&&p.y>=(indoor?160:20)&&p.y<=400&&
    !(indoor?roomBlocks:townBlocks).some(([x,y,w,h])=>p.x>x-8&&p.x<x+w+8&&p.y>y-12&&p.y<y+h);
}
// A small 20px tile graph keeps clicks behind furniture from crossing collisions.
export function findPath(start:Point,target:Point,indoor:boolean):Point[] {
  const cells:Point[]=[];
  for(let y=indoor?160:20;y<=400;y+=20)for(let x=20;x<=780;x+=20)if(walkable({x,y},indoor))cells.push({x,y});
  const nearest=(p:Point)=>cells.reduce((best,c)=>distance(c,p)<distance(best,p)?c:best,cells[0]);
  const origin=nearest(start),end=nearest(target),key=(p:Point)=>`${p.x},${p.y}`;
  const open=[origin],seen=new Set([key(origin)]),previous=new Map<string,Point>();
  const valid=new Set(cells.map(key));
  for(let i=0;i<open.length;i++){
    const p=open[i];
    if(key(p)===key(end)){const path:Point[]=[];let curr=p;while(key(curr)!==key(origin)){path.unshift(curr);curr=previous.get(key(curr))!;}return [origin,...path];}
    for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const n={x:p.x+dx,y:p.y+dy};if(!valid.has(key(n))||seen.has(key(n)))continue;seen.add(key(n));previous.set(key(n),p);open.push(n);}
  }
  return [];
}
