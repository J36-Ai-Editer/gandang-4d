import test from 'node:test';
import assert from 'node:assert/strict';
import {canWalk,findRoute,riverCenter,riverHalfWidth,terrainHeight,GROVE_TREES} from './world3d.ts';
test('3D village blocks buildings, water and boundary while keeping plaza open',()=>{
  assert.equal(canWalk({x:0,z:4}),true);
  for(const p of [{x:-7,z:-4},{x:8,z:6},{x:7,z:-5},{x:65,z:0},{x:NaN,z:0}])assert.equal(canWalk(p),false);
});
test('expanded districts are reachable and river crossings stay on bridges',()=>{
  assert.equal(canWalk({x:30,z:30}),true);
  assert.equal(canWalk({x:10,z:riverCenter(10)}),false);
  assert.equal(canWalk({x:0,z:-22}),true);
  assert.equal(canWalk({x:-25,z:15}),false);
  const route=findRoute({x:0,z:5},{x:4,z:-31});
  assert.ok(route.length>50);
  assert.ok(route.every(canWalk));
  assert.ok(route.filter(p=>Math.abs(p.z-riverCenter(p.x))<riverHalfWidth(p.x)+.2).every(p=>Math.abs(p.x)<1.55));
});
test('orchard terrain is continuous and trees cannot be walked through',()=>{
  assert.equal(terrainHeight(0,5),0);
  assert.ok(terrainHeight(43,36)>4);
  for(let x=-63;x<63;x+=1)assert.ok(Math.abs(terrainHeight(x,36)-terrainHeight(x+.5,36))<.6);
  assert.ok(GROVE_TREES.length>40);
  for(const t of GROVE_TREES)assert.equal(canWalk(t),false);
  assert.ok(Math.abs(riverCenter(-25)-riverCenter(25))>3);
  assert.ok(findRoute({x:0,z:5},{x:43,z:36}).length>80);
});
test('click route goes around a solid hanok footprint',()=>{
  const route=findRoute({x:-7,z:3},{x:-7,z:-9});
  assert.ok(route.length>10);assert.ok(route.every(canWalk));
  assert.deepEqual(route.at(-1),{x:-7,z:-9});
  assert.deepEqual(findRoute({x:0,z:0},{x:7,z:-5}),[]);
});
