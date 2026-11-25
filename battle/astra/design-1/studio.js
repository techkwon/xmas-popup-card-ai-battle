import * as THREE from 'three';
import { makeCard, paperTextures, paperLights, enableSoftShadows, PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';
import { rng, paperSheet } from 'papercraft/lib/paperkit-2d.js';
import { getMessage, loadMessageFont, wrapLines, mountMessageUI } from '../../kit/message.js';

export { THREE, rng };
export const PI = Math.PI, TAU = 2 * PI, hand = '"Nanum Pen Script","Apple SD Gothic Neo",sans-serif',
  serif = '"AppleMyungjo","Batang",serif', sans = '"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
export const clamp = x => Math.min(1, Math.max(0,x));
export const ease = x => { x=clamp(x); return x*x*x*(10+x*(6*x-15)); };
export const lerp = (a,b,u) => a+(b-a)*u;
export function group(parent,x=0,y=0,z=0) {
  const obj=new THREE.Group(); parent.add(obj); obj.position.set(x,y,z); return obj;
}
export function path(g,d,fill,stroke=null,width=1) {
  const p=typeof d==='string'?new Path2D(d):d;
  if(fill){g.fillStyle=fill;g.fill(p);}
  if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke(p);}
}
export function layer(g,d,fill,stroke='#442f36',width=1.5) {
  g.save(); g.translate(1.4,2.5);path(g,d,'rgba(47,27,39,.27)');g.restore();path(g,d,fill,stroke,width);
}
export function oval(g,x,y,rx,ry,fill,stroke=null,width=1) {
  const p=new Path2D();p.ellipse(x,y,rx,ry,0,0,TAU);path(g,p,fill,stroke,width);
}
export function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
export function frame(g,x,y,w,h,c,l=1){g.strokeStyle=c;g.lineWidth=l;g.strokeRect(x,y,w,h);}
export function text(g,s,x,y,size,color,opts={}) {
  g.save();g.font=(opts.bold?'bold ':'')+size+'px '+(opts.font||serif);
  g.fillStyle=color;g.textAlign=opts.align||'center';g.textBaseline='middle';
  if(opts.space) g.letterSpacing=opts.space+'px';g.fillText(s,x,y);g.restore();
}
export function starD(x,y,r,n=4,inner=.34,angle=-PI/2) {
  return Array.from({length:n*2},(_,i)=>{const a=angle+i*PI/n,R=i%2?r*inner:r;return (i?'L':'M')+(x+R*Math.cos(a))+' '+(y+R*Math.sin(a));}).join(' ')+'Z';
}
export function star(g,x,y,r,c,n=4){path(g,starD(x,y,r,n),c);}
export function snow(g,x,y,r,c) {
  g.save();g.translate(x,y);for(let j=0;j<6;j++){g.rotate(PI/3);path(g,`M0 0 L0 ${-r} M0 ${-r*.51} L${r*.26} ${-r*.76} M0 ${-r*.51} L${-r*.26} ${-r*.76}`,null,c,Math.max(r*.10,1.1));}g.restore();
}
export function sprig(g,x,y,len,angle,colors) {
  g.save();g.translate(x,y);g.rotate(angle);g.scale(len/100,len/100);
  path(g,'M0 0 Q7 -38 0 -100',null,colors[0],2);
  for(let i=0;i<9;i++){
    const y=-i*10-7, wide=24-i*1.9;
    for(const s of [-1,1])path(g,`M2 ${y+6} Q${s*wide*.83} ${y+1} ${s*wide} ${y-15} Q${s*wide*.30} ${y-10} 2 ${y+6}Z`,colors[(i+Number(s>0))%colors.length]);}
  g.restore();
}
export function stars(g,seed,x,y,w,h,count,palette){
  const r=rng(seed);for(let i=0;i<count;i++){const xx=x+r()*w,yy=y+r()*h,a=r(),c=palette[i%palette.length];
    if(a>.77) snow(g,xx,yy,3+r()*6,c);else if(a>.57)star(g,xx,yy,3+r()*4,c);else oval(g,xx,yy,.9+r()*1.6,1.2+r(),c);}
}
export function fitMessage(g,m,x,y,w,h,color,top=42) {
  // Measure the complete message before picking a size so unspaced Korean wraps without loss.
  let fs=top,lines,lead;
  for(;fs>6;fs-=.5){
    g.font=fs+'px '+hand;lines=wrapLines(g,m.msg,w,256);lead=fs*1.04;
    if((lines.length+1.94)*lead<=h)break;
  }
  const block=(lines.length+1.94)*lead, start=y+(h-block)*.5+.43*lead;
  function name(s,at,align){
    let n=fs*.92; g.font=n+'px '+hand;
    while(g.measureText(s).width>w&&n>6){n-=.5;g.font=n+'px '+hand;}
    text(g,s,align==='left'?x:x+w,at,n,color,{font:hand,align});
  }
  name(m.to,start,'left');
  lines.forEach((s,i)=>text(g,s,x,start+(1.02+i)*lead,fs,color,{font:hand,align:'left'}));
  name(m.from,start+(lines.length+1.03)*lead,'right');
}
export const rectangle=(w,h)=>`M0 0 L${w} 0 L${w} ${h} L0 ${h} Z`;
export const rounded=(w,h,r)=>`M${r} 0 L${w-r} 0 Q${w} 0 ${w} ${r} L${w} ${h-r} Q${w} ${h} ${w-r} ${h} L${r} ${h} Q0 ${h} 0 ${h-r} L0 ${r} Q0 0 ${r} 0 Z`;
export function ringD(cx,cy,r,n=96){return Array.from({length:n},(_,i)=>(i?'L':'M')+(cx+r*Math.cos(i*TAU/n))+' '+(cy+r*Math.sin(i*TAU/n))).join(' ')+' Z';}
// Cut the same Bézier outline that the print uses. The input drawing board is in 1/100 world units, y down.
export function contour(d,w,h) {
  const t=d.match(/[MLQCZ]|-?(?:\d*\.\d+|\d+)/g),s=new THREE.Shape();let i=0;
  const x=()=>Number(t[i++])/100-w/200,y=()=>h/100-Number(t[i++])/100;
  while(i<t.length){switch(t[i++]){case'M':s.moveTo(x(),y());break;case'L':s.lineTo(x(),y());break;
    case'Q':s.quadraticCurveTo(x(),y(),x(),y());break;case'C':s.bezierCurveTo(x(),y(),x(),y(),x(),y());break;case'Z':s.closePath();break;}}
  const pts=s.getPoints(12).map(v=>[v.x,v.y]);
  return pts.filter((p,j)=>j===0||Math.hypot(p[0]-pts[j-1][0],p[1]-pts[j-1][1])>1e-7)
    .filter((p,j)=>j===0||Math.hypot(p[0]-pts[0][0],p[1]-pts[0][1])>1e-7);
}

export async function studio(theme,build) {
  const start=performance.now(), q=new URLSearchParams(location.search), cap=q.has('capture');
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true,preserveDrawingBuffer:true,alpha:false});
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(27,1,.1,140);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.BasicShadowMap;
  renderer.setClearColor(theme.table);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const size=q.get('size')?.match(/^(\d+)x(\d+)$/);
  const view={w:0,h:0,fovY:camera.fov};
  function resize(){view.w=size?+size[1]:innerWidth;view.h=size?+size[2]:innerHeight;
    renderer.setPixelRatio(size?1:Math.min(devicePixelRatio,2));renderer.setSize(view.w,view.h);
    camera.aspect=view.w/view.h;camera.updateProjectionMatrix();}
  resize();
  const message=getMessage();await loadMessageFont();
  await Promise.race([document.fonts.load('48px "Nanum Pen Script"',Object.values(message).join('')).catch(()=>{}), new Promise(r=>setTimeout(r,1700))]);
  const paper=paperTextures(renderer,{color:'#fffdf6',size:256,fibres:.7,normalStrength:.5,unitsPerTile:3,mottle:.024});
  paper.sheet=paperSheet({size:384,seed:712,color:'#fffdf8',tooth:.025,grain:.023,fibres:.7,mottle:.023});
  PAPER_LIGHT.leak.value.set(theme.leak);PAPER_LIGHT.trans.value=.065;
  const lights=paperLights(scene,{key:'#fff6e9',keyIntensity:2.42,keyDir:[-.6,1.2,.65],fill:'#f5f5ff',fillIntensity:.68,sky:'#fffaf0',ground:theme.bounce,skyIntensity:.64,shadowExtent:12,distance:35,mapSize:2048});
  lights.key.shadow.normalBias=.009;
  enableSoftShadows(lights.key,{softness:.17,maxPenumbra:.64,minPenumbra:.018,blockerSamples:8,filterSamples:14});
  // A single sheet of stained, finely grained wood. The light pool stays on the tabletop as the camera moves.
  const tablePaper=document.createElement('canvas');tablePaper.width=tablePaper.height=1536;
  const g=tablePaper.getContext('2d'), wood=rng(197), mid=768;
  const field=g.createRadialGradient(640,800,16,mid,mid,940);
  field.addColorStop(0,theme.tableLight);field.addColorStop(.45,theme.table);field.addColorStop(1,theme.tableDark);
  g.fillStyle=field;g.fillRect(0,0,1536,1536);
  g.save();g.translate(mid,mid);g.rotate(-.14);
  for(let i=0;i<1900;i++){
    const x=-1150+wood()*2150,y=-1100+wood()*2200,l=14+wood()**2*410,amp=wood()*2.7;
    g.strokeStyle=i%5?'rgba(46,37,31,.048)':'rgba(255,248,212,.10)';g.lineWidth=.35+wood()*1.1;
    g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+l*.25,y+amp,x+l*.69,y-amp,x+l,y+.8);g.stroke();
  }g.restore();
  const tex=new THREE.CanvasTexture(tablePaper);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const desk=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshLambertMaterial({map:tex}));
  tex.repeat.setScalar(160/44);tex.offset.setScalar((1-160/44)/2);
  desk.rotation.x=-PI/2;desk.receiveShadow=true;scene.add(desk);
  let pieces=0;const boards=[];
  function cut(parent,w,h,outline,draw,opts={}) {
    const points=contour(outline||rectangle(w,h),w,h);
    const paint=fn=>P=>P.draw(g=>{g.translate(-w/200,h/100);g.scale(.01,-.01);fn(g);});
    const mesh=makeCard(points,{paper,paint:paint(draw),back:typeof opts.back==='function'?paint(opts.back):'mirror',
      backRes:1,thickness:opts.thick??.032,edgeWidth:opts.rim??.012,folds:[],contact:null,tone:0,
      pxPerUnit:opts.res||83,seed:++pieces,holes:opts.holes?.map(d=>contour(d,w,h))});
    if(typeof opts.back!=='function'){
      const front=mesh.material[0].map,back=mesh.material[2].map;
      back.repeat.copy(front.repeat);back.offset.copy(front.offset);
    }
    for(const m of mesh.material)if(m.normalScale)m.normalScale.setScalar(.14);
    parent.add(mesh);
    mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
    boards.push({mesh,corners:[[b.min.x,b.min.y],[b.min.x,b.max.y],[b.max.x,b.min.y],[b.max.x,b.max.y]]});return mesh;
  }
  function place(mesh,x,y,z){mesh.position.set(x,y,z);return mesh;}
  // A narrow paper hinge reacts to the drive with a damped torsional spring.
  const springs=[];
  function spring(drive,frequency,damping=.78) {
    const s={drive,w:TAU*frequency,damping,x:drive(0),v:0};springs.push(s);return s;
  }
  const model=build({scene,cut,place,message,view,camera,spring});
  function draw(t){
    const pose=model(t);
    const scale=Math.max(1,(16/9)/camera.aspect);
    const [cx,cy,cz]=pose.center, [ex,ey,ez]=pose.eye;
    camera.position.set(cx+(ex-cx)*scale,cy+(ey-cy)*scale,cz+(ez-cz)*scale);camera.lookAt(cx,cy,cz);
    // Guard both the tall mid-opening pose and the open spread at every aspect ratio.
    camera.updateMatrixWorld();scene.updateMatrixWorld();
    const tan=Math.tan(camera.fov*PI/360),point=new THREE.Vector3(),m=new THREE.Matrix4();let pull=0;
    for(const {mesh,corners} of boards){m.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);
      for(const [x,y] of corners){point.set(x,y,0).applyMatrix4(m);
        pull=Math.max(pull,point.z+Math.abs(point.x)/(tan*camera.aspect*.94),point.z+Math.abs(point.y)/(tan*.905));}}
    camera.translateZ(pull);renderer.render(scene,camera);
  }
  const hz=120;let tick=0,acc=0,live=!cap,last=0;
  function advance(sec){if(!Number.isFinite(sec)||sec<0)return;acc+=sec*hz;
    while(acc>=1-1e-9){tick++;acc-=1;
      for(const s of springs){s.v+=(s.w*s.w*(s.drive(tick/hz)-s.x)-2*s.damping*s.w*s.v)/hz;s.x+=s.v/hz;}
    }if(Math.abs(acc)<1e-9)acc=0;
    draw((tick+acc)/hz);}
  function restart(){tick=0;acc=0;for(const s of springs){s.x=s.drive(0);s.v=0;}draw(0);last=performance.now();}
  function step(sec){live=false;advance(sec);return (tick+acc)/hz;}
  restart();mountMessageUI();
  window.__papercraft={ready:true,buildMs:Math.round(performance.now()-start),pieces,restart,step,frame:view};
  if(!cap){renderer.domElement.addEventListener('click',()=>{restart();live=true;});
    renderer.setAnimationLoop(now=>{if(live)advance(Math.max(0,Math.min(.05,(now-last)/1000)));last=now;});}
  if(!size)window.addEventListener('resize',()=>{resize();draw((tick+acc)/hz);});
}
