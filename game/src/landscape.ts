import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Original scene geometry. The shared PNGs are art references, never fake GLB conversions. */
export function expandLandscape(scene:T.Scene) {
  const root=new T.Group(); root.name='village-expansion'; scene.add(root);
  const materials=new Map<string,T.MeshStandardMaterial>();
  const material=(color:string)=>{
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color,roughness:.86}));
    return materials.get(color)!;
  };
  const add=(geometry:T.BufferGeometry,color:string,x:number,y:number,z:number,parent:T.Object3D=root)=>{
    const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  };
  const cube=(w:number,h:number,d:number,c:string,x:number,y:number,z:number,p=root)=>add(new RoundedBoxGeometry(w,h,d,2,Math.min(.09,w/5,h/5,d/5)),c,x,y,z,p);
  const sphere=(r:number,c:string,x:number,y:number,z:number,sx=1,sy=1,sz=1,p=root)=>{const m=add(new T.SphereGeometry(r,12,9),c,x,y,z,p);m.scale.set(sx,sy,sz);return m;};
  const pole=(r:number,h:number,c:string,x:number,y:number,z:number,p=root)=>add(new T.CylinderGeometry(r,r*1.08,h,10),c,x,y,z,p);
  let seed=9843;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // Fine gravel and grass are drawn once into repeatable textures, rather than thousands of draw calls.
  function groundTexture(base:string,dots:string,size=512) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,size,size);
    for(let i=0;i<9000;i++){ctx.globalAlpha=.1+random()*.14;ctx.fillStyle=dots;ctx.fillRect(random()*size,random()*size,1+random()*2,1+random()*2);}
    const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(18,18);texture.colorSpace=T.SRGBColorSpace;
    return texture;
  }
  const ground=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({map:groundTexture('#a6b77b','#536b42'),roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.045;ground.receiveShadow=true;root.add(ground);
  function road(x:number,z:number,w:number,d:number){const m=cube(w,.035,d,'#dfc89e',x,.003,z);m.castShadow=false;return m;}
  road(0,17,6,30); road(-23,3,40,4);road(23,6,38,4);road(0,-30,60,5);road(-25,-11,4,32);road(25,-9,4,35);
  for(let row=0;row<7;row++)for(let col=0;col<7;col++){
    const tile=cube(.77,.055,.57,['#c7bea3','#d3c7aa','#dbceb1'][(row+col)%3],(col-3)*.9+(row%2)*.35,.05,5+(row-3)*.7);
    tile.rotation.y=(random()-.5)*.09; tile.castShadow=false;
  }
  // A river across the north, with three truly walkable bridge crossings.
  road(0,-22,94,7.5);
  const riverMaterial=new T.MeshStandardMaterial({color:'#64bcb2',roughness:.24,metalness:.12});
  const river=new T.Mesh(new T.PlaneGeometry(94,6),riverMaterial);river.rotation.x=-Math.PI/2;river.position.set(0,.06,-22);river.receiveShadow=true;root.add(river);
  for(let i=0;i<112;i++)for(const side of [-1,1]){
    const x=-46+i*.83;
    sphere(.28+random()*.2,i%4?'#b8b9a0':'#959f86',x,.05,-22+side*(3.3+random()*.25),1,.65,.85);
  }
  const waterMarks=new T.Group();waterMarks.userData.dynamic=true;root.add(waterMarks);
  for(let i=0;i<32;i++){
    const m=new T.Mesh(new T.PlaneGeometry(.5+random()*1.6,.035),new T.MeshBasicMaterial({color:'#d5ecce',transparent:true,opacity:.4}));
    m.rotation.x=-Math.PI/2;m.position.set(-44+random()*88,.075,-24.5+random()*5);waterMarks.add(m);
  }
  function bridge(x:number){
    for(let i=0;i<16;i++){
      const z=-25.4+i*.45,y=.1+Math.sin(i/15*Math.PI)*.7;
      cube(4,.22,.44,i%3?'#cbc4ad':'#d7cdb6',x,y,z);
      for(const side of [-1,1]){
        if(i%3===0){cube(.22,.9,.23,'#aead99',x+side*1.85,y+.55,z);sphere(.2,'#c4c1aa',x+side*1.85,y+1.1,z);}
        cube(.16,.15,.53,'#b3b39c',x+side*1.85,y+.8,z);
      }
    }
  }
  for(const x of [-25,0,25])bridge(x);
  function pine(x:number,z:number,s=1,cherry=false){
    const tree=new T.Group();tree.position.set(x,0,z);tree.scale.setScalar(s);root.add(tree);
    const trunk=pole(.22,3.3,'#806044',0,1.6,0,tree);trunk.rotation.z=.12;
    for(let i=0;i<22;i++){
      const a=i*2.399,r=.4+random()*1.4;
      const leaf=sphere(.72+random()*.45,cherry?['#efb9bf','#f6d2ce','#dd9eae'][i%3]:['#829e57','#92ad64','#637e48'][i%3],Math.cos(a)*r,3+random()*1.7,Math.sin(a)*r,1,.68,1,tree);
      leaf.castShadow=true;
    }
    for(let i=0;i<7;i++){const a=i*.9;const stone=sphere(.26,'#879660',Math.cos(a)*.65,.08,Math.sin(a)*.65,1,.3,.8,tree);stone.castShadow=false;}
  }
  // Rounded thatch strands, grain baskets and paper lattice doors, matching the reference silhouette.
  function cottage(x:number,z:number,rotation=0){
    const house=new T.Group();house.position.set(x,0,z);house.rotation.y=rotation;root.add(house);
    cube(6.6,.3,5.3,'#b8b197',0,.15,0,house);cube(5.8,2.75,4.5,'#efdab1',0,1.7,0,house);
    for(const px of [-2.75,0,2.75])cube(.18,2.8,4.7,'#8d6041',px,1.7,0,house);
    cube(6,.18,4.8,'#936b49',0,.45,0,house);
    for(let side=-1;side<=1;side+=2){
      const roof=sphere(1,'#ceaa5c',0,3.25,side*1.05,3.7,1.15,2.0,house);roof.rotation.x=side*.13;
      for(let i=0;i<38;i++){
        const xx=-3.4+i*.18;
        const straw=add(new T.CapsuleGeometry(.07,2.1,3,5),i%3?'#e1bf72':'#c39a4c',xx,3.55,side*1.3,house);
        straw.rotation.x=side*1.18;
      }
    }
    for(const xx of [-2.2,2.2]){
      cube(1.2,1.55,.1,'#f4e4bc',xx,1.7,2.31,house);
      for(let c=-2;c<=2;c++)cube(.045,1.5,.06,'#936b49',xx+c*.22,1.7,2.4,house);
      for(let y=1.1;y<2.4;y+=.3)cube(1.2,.045,.06,'#936b49',xx,y,2.4,house);
    }
    cube(1.5,2.1,.14,'#9b7049',0,1.47,2.36,house);
    for(let i=-3;i<=3;i++)cube(.035,2,.02,'#b38855',i*.2,1.47,2.45,house);
    cube(2,.18,.75,'#b6b09a',0,.12,2.9,house);
    for(const xx of [-3.2,3.25]){
      sphere(.55,'#d6b472',xx,.6,2.2,1,1.2,1,house);
      for(let ring=0;ring<4;ring++){const r=add(new T.TorusGeometry(.5,.025,4,18),'#a98a55',xx,.3+ring*.2,2.2,house);r.rotation.x=Math.PI/2;}
    }
  }
  cottage(-25,15,-.1);cottage(25,17,.05);cottage(-16,-32,.08);cottage(15,-32,-.06);
  function stall(x:number,z:number,color:string){
    const stall=new T.Group();stall.position.set(x,0,z);root.add(stall);
    cube(4,.24,2,'#9b6d43',0,.95,0,stall);
    for(const px of [-1.8,1.8])for(const pz of [-.7,.7])pole(.075,2.8,'#815c40',px,1.4,pz,stall);
    for(let i=0;i<10;i++){const c=i%2?'#f2dfb2':color;const awning=cube(.41,.08,2.7,c,-1.85+i*.41,2.9,0,stall);awning.rotation.x=.15;cube(.41,.28,.12,c,-1.85+i*.41,2.56,1.25,stall);}
    for(let i=0;i<24;i++)sphere(.13,['#d99d54','#90a765','#d5825c'][i%3],-1.6+(i%8)*.44,1.18+Math.floor(i/8)*.04,-.5+Math.floor(i/8)*.45,1,.9,1,stall);
  }
  stall(-18,3,'#a16d62');stall(-24,3,'#82976a');stall(19,6,'#879ca4');
  // Courtyard objects: actual individual 3D leaves, clay jars and wooden rails.
  function garden(x:number,z:number){
    const bed=new T.Group();bed.position.set(x,0,z);root.add(bed);
    cube(5.6,.14,4.4,'#ae8a5c',0,.05,0,bed);
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const xx=-2.25+col*.9,zz=-1.6+row*.95;
      cube(.7,.06,.7,'#96764c',xx,.15,zz,bed);
      for(let leaf=0;leaf<5;leaf++){
        const a=leaf/5*6.28;
        const l=sphere(.17,row%2?'#92ab64':'#6e9458',xx+Math.cos(a)*.13,.3+leaf*.015,zz+Math.sin(a)*.13,1,.45,1.5,bed);l.rotation.y=-a;
      }
      if(row%2===0)sphere(.09,'#d59c52',xx,.4,zz,1,1.4,1,bed);
    }
    for(const side of [-1,1]){
      for(let i=0;i<8;i++)pole(.055,.85,'#997345',side*3,.42,-2+i*.57,bed);
      for(const y of [.3,.65])cube(.08,.08,4.6,'#ac8250',side*3,y,0,bed);
    }
  }
  garden(-25,24);garden(26,27);
  for(const [x,z] of [[-29,17],[-28,17],[-27,17],[22,20],[23,20],[-19,-29],[-18,-29],[18,-29]]){
    sphere(.42,'#88634c',x,.43,z,1,1.15,1);
    const lip=add(new T.TorusGeometry(.3,.055,6,18),'#70523d',x,.85,z);lip.rotation.x=Math.PI/2;
    pole(.34,.07,'#73573e',x,.94,z);
  }
  for(const [x,z] of [[-3,20],[3,20],[-3,-15],[3,-15],[-28,-18],[28,-18]]){
    cube(.65,.16,.65,'#b9b6a0',x,.08,z);pole(.14,1.5,'#b4b39e',x,.9,z);
    cube(.52,.55,.5,'#c7c4aa',x,1.8,z);cube(.25,.36,.53,'#f0dba4',x,1.8,z);
    const cap=add(new T.ConeGeometry(.5,.4,4),'#a7ac95',x,2.25,z);cap.rotation.y=Math.PI/4;sphere(.12,'#bdbda4',x,2.5,z);
  }
  // A round village well and wooden cart make recognizable landmarks at walking scale.
  const well=new T.Group();well.position.set(-17,0,10);root.add(well);
  for(let row=0;row<3;row++)for(let i=0;i<14;i++){
    const a=i/14*Math.PI*2+row*.12;
    const b=cube(.5,.32,.38,row%2?'#b8b7a1':'#c8c3ab',Math.sin(a)*1.2,.2+row*.3,Math.cos(a)*1.2,well);b.rotation.y=a;
  }
  for(const x of [-1.6,1.6])pole(.12,3.5,'#856345',x,1.75,0,well);
  cube(3.7,.3,2.8,'#bfa06a',0,3.3,0,well);pole(.04,2,'#b8a779',0,2,0,well);
  const cart=new T.Group();cart.position.set(18,0,14);cart.rotation.y=.35;root.add(cart);
  cube(2.7,.16,1.5,'#a1764b',0,.8,0,cart);
  for(const z of [-.8,.8]){const wheel=add(new T.TorusGeometry(.57,.09,6,22),'#73583c',0,.6,z,cart);for(let i=0;i<6;i++){const spoke=cube(1.05,.055,.06,'#916b46',0,.6,z,cart);spoke.rotation.z=i*Math.PI/6;}wheel.castShadow=true;}
  for(const z of [-.65,.65])cube(4,.07,.08,'#a1764b',1,.8,z,cart);
  for(let i=0;i<6;i++)cube(.28,.36,1.55,'#99724d',-1.15+i*.45,1.05,0,cart);
  // Broad forest loop, with views kept clear at the crossings and village entrance.
  for(let i=0;i<65;i++){
    const a=i/65*Math.PI*2,x=Math.sin(a)*39,z=Math.cos(a)*38;
    pine(x,z,.8+random()*.65,i%5===0);
  }
  for(const [x,z] of [[-18,18],[-29,10],[30,11],[-10,24],[13,25],[-31,-12],[31,-12],[-8,-32],[7,-34]])pine(x,z,1.15,true);
  for(let i=0;i<190;i++){
    const a=random()*Math.PI*2,r=29+random()*7,x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(Math.abs(x)<4||Math.abs(z+22)<5||Math.abs(z+30)<3)continue;
    for(let j=0;j<3;j++){
      const xx=x+(random()-.5),zz=z+(random()-.5);
      pole(.018,.3,'#748651',xx,.15,zz);
      for(let petal=0;petal<4;petal++){
        const angle=petal*Math.PI/2;sphere(.07,i%3?'#ebc2bd':'#e7d7a3',xx+Math.cos(angle)*.07,.32,zz+Math.sin(angle)*.07,1,.4,1);
      }
    }
  }
  // Layered mountain silhouettes fill the horizon without pretending the walkable map is infinite.
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2,r=62+random()*13;
    sphere(6+random()*5,i%2?'#9eaf8a':'#b2bd9d',Math.sin(a)*r,1,Math.cos(a)*r,1.6,1.2,1.3);
  }
  return (ms:number)=>waterMarks.children.forEach((m,i)=>{m.position.x+=Math.sin(ms*.0003+i)*.002;});
}

/** Batch static meshes while retaining interactive actors, particles and their transforms. */
export function batchStaticLandscape(scene:T.Scene) {
  scene.updateMatrixWorld(true);
  type Batch={material:T.Material;geometries:T.BufferGeometry[];meshes:T.Mesh[];cast:boolean;receive:boolean};
  const groups=new Map<string,Batch>();
  scene.traverse(object=>{
    if(!(object instanceof T.Mesh)||Array.isArray(object.material))return;
    for(let p:T.Object3D|null=object;p;p=p.parent)if(p.userData.dynamic)return;
    const key=object.material.uuid+object.castShadow+object.receiveShadow;
    const group:Batch=groups.get(key)??{material:object.material,geometries:[],meshes:[],cast:object.castShadow,receive:object.receiveShadow};
    const g=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();g.applyMatrix4(object.matrixWorld);
    if(!g.getAttribute('normal'))g.computeVertexNormals();
    if(!g.getAttribute('uv'))g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));
    for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);
    group.geometries.push(g);group.meshes.push(object);groups.set(key,group);
  });
  for(const group of groups.values()){
    const geometry=mergeGeometries(group.geometries,false);if(!geometry)continue;
    const mesh=new T.Mesh(geometry,group.material);mesh.castShadow=group.cast;mesh.receiveShadow=group.receive;scene.add(mesh);
    group.meshes.forEach(m=>m.removeFromParent());group.geometries.forEach(g=>g.dispose());
  }
}
