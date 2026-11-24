export type Position = { x:number; z:number };
export type Obstacle = { x:number; z:number; width:number; depth:number };
export const WORLD_LIMIT=42;
export const BRIDGE_X=[-25,0,25];
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
  if(p.z>-25.2&&p.z<-18.8&&!BRIDGE_X.some(x=>Math.abs(p.x-x)<1.55))return false;
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
