import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findPath,walkable,distance} from '../src/lib/navigation';
import {parseManifest,resolveClip,validMediaUrl,clipPrompt,type ClipManifest} from '../src/lib/cinematics';
import {normalizeSave,snapshot,useGame} from '../src/lib/store';
test('click paths go around indoor furniture and town buildings',()=>{
  for(const [start,end,indoor]of [[{x:390,y:310},{x:250,y:160},true],[{x:390,y:270},{x:136,y:216},false],[{x:390,y:270},{x:614,y:207},false]] as const){
    const path=findPath(start,end,indoor);assert.ok(path.length>1);for(const p of path)assert.ok(walkable(p,indoor));
    assert.ok(distance(path[path.length-1],end)<30);
    for(let i=1;i<path.length;i++){assert.equal(distance(path[i],path[i-1]),20);const mid={x:(path[i].x+path[i-1].x)/2,y:(path[i].y+path[i-1].y)/2};assert.ok(walkable(mid,indoor));}
  }
});
test('clicks in walls resolve to reachable floor rather than crossing buildings',()=>{
  const path=findPath({x:390,y:270},{x:100,y:100},false);assert.ok(path.length);assert.ok(walkable(path[path.length-1],false));assert.ok(distance(path[path.length-1],{x:100,y:100})>30);
});
test('manifest rejects unsafe schemes, credentials and traversal paths',()=>{
  for(const url of ['javascript:alert(1)','data:video/mp4;base64,a','http://example.com/v.mp4','https://user:password@example.com/v.mp4','/cinematics/../secret.mp4','//example.com/v.mp4'])assert.equal(validMediaUrl(url),false,url);
  assert.equal(validMediaUrl('https://cdn.example.com/v.mp4?token=public'),true);assert.equal(validMediaUrl('/cinematics/objection.webm'),true);
  assert.deepEqual(parseManifest({version:1,clips:{shared:{objection:{url:'javascript:a'}}}}),{version:1,clips:{}});
  assert.deepEqual(parseManifest(null),{version:1,clips:{}});
});
test('per-case video overrides shared video and legacy fallback only covers objection',()=>{
  const local:ClipManifest={version:1,clips:{shared:{objection:{url:'/cinematics/shared.webm'}}}};
  const published:ClipManifest={version:1,clips:{SCENARIO_CRIMINAL:{objection:{url:'/cinematics/criminal.webm'}}}};
  assert.equal(resolveClip('SCENARIO_CRIMINAL','objection',local,published)?.url,'/cinematics/criminal.webm');
  assert.equal(resolveClip('SCENARIO_LABOR','objection',local,published)?.url,'/cinematics/shared.webm');
  assert.equal(resolveClip('SCENARIO_LABOR','victory',local,published,'https://example.com/old.mp4'),undefined);
});
test('legacy trial saves return to investigation with usable law-card defaults',()=>{
  useGame.getState().start(0);const old:Record<string,unknown>={...snapshot(useGame.getState()),phase:'trial'};
  for(const key of ['cards','slots','cleared','lawStep','mistakes'])delete old[key];
  const restored=normalizeSave(old as never);assert.equal(restored.phase,'investigation');assert.deepEqual(restored.cards,[]);assert.deepEqual(restored.slots,{});
});
test('cinematic prompts preserve art direction across scenes',()=>{
  assert.match(clipPrompt('SCENARIO_LABOR','objection'),/pale yellow jacket/);assert.match(clipPrompt('SCENARIO_LABOR','objection'),/points forward/);assert.match(clipPrompt('SCENARIO_CRIMINAL','rebuttal'),/no violence/);
});

