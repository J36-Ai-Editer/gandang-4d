export type Position = { x:number; z:number };
export type Obstacle = { x:number; z:number; width:number; depth:number };
export const WORLD_LIMIT=64;
export const BRIDGE_X=[-25,0,25];
export function riverCenter(x:number):number{return -22+3.6*Math.sin(x*.08)+1.2*Math.sin(x*.19);}
export function riverHalfWidth(x:number):number{return 3+.55*Math.sin(x*.1)+.28*Math.sin(x*.27);}
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
/** Flat village courts blend continuously into walkable rolling hills and a low river channel. */
export function terrainHeight(x:number,z:number):number {
  const outskirts=smooth(0,1,Math.max((Math.abs(x)-30)/18,(Math.abs(z)-33)/16));
  const hill=(cx:number,cz:number,h:number,r:number)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
  const height=hill(-47,16,5.6,18)+hill(43,36,7,21)+hill(18,-48,5,17)+hill(-38,-46,4.5,19);
  return outskirts*height*smooth(riverHalfWidth(x)+.7,riverHalfWidth(x)+10,Math.abs(z-riverCenter(x)));
}
export const GROVE_TREES:Array<{x:number;z:number;scale:number;peach:boolean}>=[];
let groveSeed=7235;
const groveRand=()=>{groveSeed=(groveSeed*1664525+1013904223)>>>0;return groveSeed/4294967296;};
for(const [cx,cz] of [[-47,8],[-38,35],[-16,50],[22,47],[48,25],[49,-7],[35,-45],[-22,-46],[-50,-39]]){
  for(let i=0;i<11;i++){
    const a=groveRand()*Math.PI*2,r=3+groveRand()*8,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(Math.abs(z-riverCenter(x))<5||GROVE_TREES.some(t=>Math.hypot(t.x-x,t.z-z)<2.5))continue;
    GROVE_TREES.push({x,z,scale:.8+groveRand()*.6,peach:i%4!==0});
  }
}
export const BUILDINGS:Obstacle[] = [
  {x:-7,z:-4,width:7,depth:5},
  {x:8,z:6,width:5.5,depth:4},
  {x:-5,z:-14,width:6,depth:4},
];
export const EXPANSION_BUILDINGS:Obstacle[]=[
  {x:-25,z:15,width:6.6,depth:5.3},{x:25,z:17,width:6.6,depth:5.3},
  {x:-16,z:-32,width:6.6,depth:5.3},{x:15,z:-32,width:6.6,depth:5.3},
  {x:-18,z:3,width:4,depth:2},{x:-24,z:3,width:4,depth:2},{x:19,z:6,width:4,depth:2},
  {x:-17,z:10,width:3,depth:3},{x:18,z:14,width:3,depth:2},
];
export function canWalk(p:Position):boolean {
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>WORLD_LIMIT||Math.abs(p.z)>WORLD_LIMIT)return false;
  if(Math.abs(p.z-riverCenter(p.x))<riverHalfWidth(p.x)+.2&&!BRIDGE_X.some(x=>Math.abs(p.x-x)<1.55))return false;
  if(Math.hypot(p.x+48,p.z+34)<4.5)return false;
  if(GROVE_TREES.some(t=>Math.hypot(t.x-p.x,t.z-p.z)<.65))return false;
  if(((p.x-7)/5.4)**2+((p.z+5)/4.5)**2<1)return false;
  if([...BUILDINGS,...EXPANSION_BUILDINGS].some(b=>Math.abs(p.x-b.x)<b.width/2+.4&&Math.abs(p.z-b.z)<b.depth/2+.4))return false;
  return ![{x:-12,z:3},{x:-10,z:11},{x:12,z:-11},{x:13,z:11}].some(t=>Math.hypot(p.x-t.x,p.z-t.z)<.9);
}
export function findRoute(from:Position,to:Position):Position[] {
  if(!canWalk(from)||!canWalk(to))return [];
  const step=.5, key=(p:Position)=>`${p.x},${p.z}`;
  const start={x:Math.round(from.x/step),z:Math.round(from.z/step)};
  const goal={x:Math.round(to.x/step),z:Math.round(to.z/step)};
  if(!canWalk({x:goal.x*step,z:goal.z*step}))return [];
  const queue=[start],parent=new Map<string,Position|null>([[key(start),null]]);
  for(let i=0;i<queue.length;i++){
    const current=queue[i];
    if(key(current)===key(goal)){
      const result:Position[]=[to];let p:Position|null=current;
      while(p){result.push({x:p.x*step,z:p.z*step});p=parent.get(key(p))??null;}
      result.reverse();result.shift();return result;
    }
    for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const next={x:current.x+x,z:current.z+z};
      if(parent.has(key(next))||!canWalk({x:next.x*step,z:next.z*step}))continue;
      parent.set(key(next),current);queue.push(next);
    }
  }
  return [];
}
