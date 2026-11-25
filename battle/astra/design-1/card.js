import {studio,group,PI,TAU,ease,lerp,path,layer,oval,rect,frame,text,star,starD,snow,sprig,stars,fitMessage,rounded,ringD,sans} from './studio.js';
import {C,cover,sky,arch,archShape,tree,treeShape,soldier,soldierShape,dancer,dancerShape,stageFloor} from './prints.js';
const {wine,red,rouge,gold,pale,ivory,navy,pine,mint,ink}=C;
// A 12.8 × 6.5 cm toy theatre. Parallel uprights return along the stage floor toward the front cover edge.
studio({table:'#b89f83',tableLight:'#d6c4a9',tableDark:'#99816f',leak:'#9c7881',bounce:'#c7a998'},({scene,cut,place,message,spring})=>{
  const book=group(scene,0,.095,0), hinges=[];
  const card=(par,w,h,d,draw,x=0,y=0,z=0,opts={})=>place(cut(par,w,h,d,draw,opts),x,y,z);
  const base=card(book,1280,650,rounded(1280,650,12),stageFloor,0,0,3.25,{thick:.115});
  base.rotation.x=-PI/2;
  const lid=group(book,0,.32,-3.25);
  card(lid,1280,650,rounded(1280,650,12),sky,0,0,0,{back:cover,thick:.085,res:93});
  function upright(x,z,stack,angle=0){
    const h=group(book,x,stack,z);hinges.push({h,stack,angle});return h;
  }
  const archFold=upright(0,-2.75,.235,-.012);
  card(archFold,1220,588,archShape,arch);
  // Pierced snowflakes hang on narrow paper strips from the underside of the arch.
  const pendants=[];
  for(const [x,y,length,rad] of [[-3.64,4.82,.48,20],[-2.92,4.75,.67,15],[3.22,4.72,.52,18],[3.87,4.62,.78,23]]){
    const pin=group(archFold,x,y,.052),L=length*100,H=L+2*rad,W=2*rad;
    const teeth=[];for(let i=0;i<24;i++){
      const angle=-PI/2+i*TAU/24,rr=i%4===0?rad:i%2===0?rad*.69:rad*.33;
      teeth.push([rad+rr*Math.cos(angle),L+rad+rr*Math.sin(angle)]);}
    const outline='M'+(rad-1)+' 0 L'+(rad+1)+' 0 L'+(rad+1)+' '+L+' '+teeth.slice(1).map(([a,b])=>'L'+a+' '+b).join(' ')+' L'+(rad-1)+' '+L+'Z';
    card(pin,W,H,outline,g=>{rect(g,0,0,W,H,pale);snow(g,rad,L+rad,rad*.88,ivory);oval(g,rad,L+rad,3.1,3.1,gold);},0,-H/100,0,{rim:.004,res:113});
    const hinge=spring(t=>ease((t-.6)/2.4)*(.068*Math.sin(t*2.15+x)+.028*Math.sin(t*3.1)),1.5);
    pendants.push({pin,hinge});
  }
  function returnStrip(parent,x,height,depth) {
    // A horizontal linkage joins the top of the upright to the matching point on the moving back wall.
    const g=group(parent,x,height,0), strip=card(g,22,depth*100,null,ctx=>{
      rect(ctx,0,0,22,depth*100,'#ac8266');path(ctx,`M2 0 L2 ${depth*100}`,null,pale,1);});
    strip.rotation.x=-PI/2;return g;
  }
  const archLinks=[-5.86,5.86].map(x=>returnStrip(archFold,x,4.6,.5));
  const fir=upright(0,-2.02,.19,-.045);
  card(fir,340,400,treeShape,tree).scale.set(1.17,1.17,1);
  // The night sky is a pinned, star-punched wheel. Its lower rim disappears behind the tree.
  const wheel=group(lid,.10,3.02,.073), R=211;
  card(wheel,R*2,R*2,ringD(R,R,R),g=>{
    rect(g,0,0,422,422,'#243f53');oval(g,R,R,205,205,null,'#9ca990',1.5);
    oval(g,R,R,189,189,null,'#bdaf83',1);
    for(let i=0;i<60;i++){let a=i*TAU/60;const s=i%5===0?9:3;
      path(g,`M${R+196*Math.cos(a)} ${R+196*Math.sin(a)} l${s*Math.cos(a)} ${s*Math.sin(a)}`,null,pale,1.5);}
    stars(g,112,12,13,397,395,107,[pale,ivory,'#9aafaa']);
    path(g,'M117 87 Q94 125 128 147 Q91 156 74 122 Q62 92 90 72 Q104 63 121 67 Q100 76 97 93Z',pale);
  },0,-R/100,0);
  const actors=[];
  const toy=upright(-2.95,-.79,.14,.015);const toyBody=group(toy);
  toyBody.scale.setScalar(1.12);
  card(toyBody,130,350,soldierShape,soldier);
  // Each arm pivots around the brass shoulder pin, swinging a striped drumstick.
  for(const s of [-1,1]){
    const pivot=group(toyBody,s*.46,2.11,.09);
    const arm=card(pivot,104,90,'M44 8 Q53 0 64 10 L82 33 Q91 45 82 54 L64 66 Q53 70 48 60 L11 45 Q1 47 2 40 Q2 32 11 37 L52 49 L62 43 L43 25 Q36 16 44 8Z',g=>{
      rect(g,0,0,104,90,gold);
      layer(g,'M43 9 Q54 -1 65 12 L82 33 Q91 45 79 55 L67 62 L53 49 L62 42 L44 27 Q37 17 43 9Z',rouge,ink,1.5);
      path(g,'M52 47 L64 60 L59 66 L46 53Z',pale,ink,1);
      path(g,'M5 40 L9 37 L59 51 L57 56Z',gold,ink,1);
      oval(g,7,40,4.5,4,pale,ink,.9);oval(g,53,56,8,8,'#edbd97',ink,1.3);
    },s*.01,-.76,0);arm.scale.x=s;
    card(pivot,15,15,ringD(7.5,7.5,7.4),g=>{oval(g,7.5,7.5,7.5,7.5,gold,ink,1);oval(g,6,5,2,2,pale);},0,-.075,.04);
    actors.push({p:pivot,s});
  }
  card(toyBody,103,86,'M1 10 Q50 -3 102 9 L95 69 Q47 90 6 72Z',g=>{
    rect(g,0,0,103,86,'#c2584e');for(let i=0;i<5;i++)path(g,`M${i*21} 15 l12 47 l10 -48`,null,pale,3.5);
    oval(g,51,12,50,9,pale,ink,1.5);path(g,'M7 67 Q51 83 96 66 L96 72 Q51 89 7 72Z',gold);
  },0,1.03,.15);
  const fairy=upright(2.46,-.75,.12,-.02), puppet=group(fairy);puppet.scale.setScalar(1.12);
  const leg=group(puppet,-.02,1.6,-.047);
  card(leg,165,113,'M2 10 Q11 0 25 7 Q70 29 94 50 L146 76 L155 77 L164 87 L157 93 L140 90 L87 73 Q34 65 7 44Z',g=>{
    rect(g,0,0,165,113,'#e9b193');path(g,'M136 72 Q148 82 153 76 L164 86 L158 94 L136 90Z','#bc6775');
    path(g,'M125 69 l9 14 M119 68 l10 15',null,'#bd6b77',2.7);},.79,-1.01,0);
  card(puppet,200,345,dancerShape,dancer);
  const arm=group(puppet,.27,2.46,.06);
  card(arm,104,85,'M2 69 Q0 60 14 58 L49 48 L74 22 L83 8 Q87 4 88 16 L98 6 Q104 7 97 21 L86 32 L62 64 Q41 77 13 81 Q6 81 2 69Z',g=>{
    rect(g,0,0,104,85,'#f4c4a6');path(g,'M1 64 Q6 54 20 57 L25 72 L13 80 Q4 81 1 72Z','#d77d82');oval(g,12,69,3.5,3.5,gold);
  },.41,-.15,0);
  function gift(parent,x,z,w,h,base,ribbon,tilt){
    const node=upright(x,z,.106,tilt);const d=`M1 18 L${w*.27} 18 Q${w*.1} -3 ${w*.35} 5 L${w*.49} 14 Q${w*.7} -6 ${w*.81} 5 Q${w*.91} 14 ${w*.68} 18 L${w-1} 18 L${w-1} ${h} L1 ${h} Z`;
    card(node,w,h,d,g=>{rect(g,0,0,w,h,base);rect(g,w*.45,18,w*.13,h,ribbon);rect(g,0,20,w,12,ribbon);
      path(g,`M0 32 L${w} 32`,null,ink,1.4);for(let i=0;i<10;i++)star(g,6+(i*19)%(w-12),40+(i*17)%Math.max(10,h-47),2.5,pale);
      path(g,`M${w*.25} 16 Q${w*.17} -6 ${w*.48} 15 Q${w*.77} -9 ${w*.82} 12 L${w*.49} 23Z`,ribbon);});
  }
  gift(book,-1.47,-.6,77,59,'#6d8d73',pale,0);gift(book,-.87,-.42,63,81,red,gold,0);
  gift(book,.23,-.5,91,61,pale,rouge,.02);gift(book,1.05,-.83,62,89,pine,gold,.01);
  // A perforated admission ticket opens on a shallow easel above the front apron.
  const ticket=group(book,0,.102,3.06), W=1136,H=202;
  const notch=`M10 0 L${W-10} 0 Q${W-9} 10 ${W} 11 L${W} 86 Q${W-20} 101 ${W} 116 L${W} 191 Q${W-10} 192 ${W-10} 202 L10 202 Q9 192 0 191 L0 116 Q19 101 0 86 L0 11 Q9 10 10 0Z`;
  card(ticket,W,H,notch,g=>{
    rect(g,0,0,W,H,'#f7e5c1');frame(g,13,11,W-26,H-22,'#9d6458',1.8);frame(g,19,17,W-38,H-34,'#cba875',1.2);
    rect(g,24,22,169,158,wine);frame(g,30,28,157,146,gold,1.4);
    text(g,'성탄 특별 공연',108,53,20,pale,{font:sans,bold:true});
    text(g,'25',107,106,74,ivory);text(g,'십 이 월',107,154,16,pale,{space:2});
    g.save();g.setLineDash([4,6]);path(g,'M209 5 L209 197',null,'#956e5d',1.6);g.restore();
    fitMessage(g,message,237,16,850,170,ink,43);
    for(const x of [219,1117])for(const y of [22,178])star(g,x,y,5,gold);
  },0,0,0,{thick:.032,res:142});
  return t=>{
    const p=ease((t-.55)/2.62), settle=t>3.17?.018*Math.sin((t-3.17)*12)*Math.exp(-(t-3.17)*7):0;
    const lift=p*1.586+settle;lid.rotation.x=PI/2-lift;lid.position.y=lerp(.33,.105,p);
    for(const {h,stack,angle} of hinges){h.rotation.x=PI/2-p*(PI/2-angle)-settle*.69;h.position.y=lerp(stack,.077,p);}
    for(const l of archLinks)l.rotation.x=-archFold.rotation.x;
    ticket.rotation.x=-PI/2+.33*p;
    for(const {pin,hinge} of pendants)pin.rotation.z=hinge.x;
    const clock=Math.max(0,t-1.65),amp=ease(clock/1.3);
    wheel.rotation.z=.075*clock;
    actors.forEach(({p,s})=>p.rotation.z=s*(-.16+.41*Math.sin(clock*4.8+(s>0?PI:0))*amp));
    arm.rotation.z=.30*Math.sin(clock*2.25)*amp;leg.rotation.z=.23+.29*Math.sin(clock*2.25+.6)*amp;
    const cam=ease((t-.32)/3.25),flow=.38*Math.sin(Math.max(t-3.3,0)*.29);
    return {center:[0,lerp(.05,2.48,cam),lerp(0,-.39,cam)],eye:[lerp(1.0,1.08,cam)+flow,lerp(14.0,10.35,cam),lerp(11.5,17.32,cam)]};
  };
});
