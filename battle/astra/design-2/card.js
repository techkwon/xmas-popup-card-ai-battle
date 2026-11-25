import {studio,THREE,group,PI,TAU,ease,lerp,path,layer,oval,rect,frame,text,star,starD,snow,fitMessage,rounded,ringD,sans} from './studio.js';
import {C,cover,mapPage,whaleD,whale,hatD,hat,envelope,postmark} from './prints.js';
const {navy,blue,teal,aqua,ice,cream,coral,rose,gold,ink}=C;
// A 180-degree atlas. A pair of diagonal scores meet at the spine and lift two rigid halves of one engraved whale.
studio({table:'#738c92',tableLight:'#a5b8b8',tableDark:'#4f656f',leak:'#6e98a0',bounce:'#aabdc2'},({scene,cut,place,message,spring})=>{
  const book=group(scene,0,.086,0),left=group(book),right=group(book);
  const card=(par,w,h,d,draw,x=0,y=0,z=0,opts={})=>place(cut(par,w,h,d,draw,opts),x,y,z);
  for(const [leaf,side] of [[left,-1],[right,1]]){
    const page=card(leaf,740,890,rounded(740,890,12),g=>mapPage(g,side),side*3.7,0,4.45,
      {thick:.10,back:side<0?cover:undefined,res:98});page.rotation.x=-PI/2;
  }
  const windings=[];
  function vfold(z,angle,y=.16){
    const a=angle*PI/180,groups=[group(book,0,y,z),group(book,0,y,z)];
    windings.push({z,a,y,groups});return groups;
  }
  const [port,starboard]=vfold(-.25,-19);
  for(const [side,panel] of [[-1,port],[1,starboard]]){
    card(panel,1000,510,whaleD,whale,0,0,0,{half:side,res:96,thick:.045});
  }
  card(port,214,137,hatD,hat,-2.67,3.75,.055,{thick:.031});
  // A scalloped pectoral fin is free to turn about the large gold brad.
  const fin=group(starboard,.72,2.60,.085);
  card(fin,185,124,'M5 12 Q23 -2 44 10 Q75 24 112 47 Q152 69 181 104 Q132 113 96 98 Q49 85 22 55 Q2 35 5 12Z',g=>{
    rect(g,0,0,185,124,teal);path(g,'M10 15 Q68 26 151 86 Q90 51 40 49Z',aqua);
    for(let i=0;i<5;i++)path(g,`M${30+i*8} ${37+i*7} Q${80+i*8} ${74+i*5} ${132+i*6} ${85+i*4}`,null,blue,1.7);
    oval(g,19,23,9,9,gold,navy,1.8);oval(g,17,20,2.6,2.6,cream);
  },.73,-1.01,0);
  // Chocolate-box parcels, stowed on the aft envelope.
  function parcel(x,y,w,h,base,ribbon,ang){
    const n=group(starboard,x,y,-.04);n.rotation.z=ang;
    card(n,w,h,`M0 17 L${w*.24} 17 Q${w*.17} -4 ${w*.39} 6 L${w*.51} 15 Q${w*.79} -6 ${w*.8} 8 L${w*.7} 17 L${w} 17 L${w} ${h} L0 ${h}Z`,g=>{
      rect(g,0,0,w,h,base);frame(g,2,17,w-4,h-19,navy,2);rect(g,w*.43,16,w*.12,h,ribbon);rect(g,0,20,w,7,ribbon);
      for(let j=0;j<7;j++)star(g,8+j*13,35+(j*11)%24,2.8,cream);
      path(g,`M${w*.24} 18 Q${w*.08} -8 ${w*.48} 12 Q${w*.82} -8 ${w*.8} 10 L${w*.52} 22Z`,ribbon,navy,1.1);
    });
  }
  parcel(1.05,3.27,87,72,coral,gold,-.07);parcel(1.72,2.99,69,80,aqua,coral,-.13);
  // An independently moving four-bar hanger holds Santa's mail gondola level.
  const hang=group(port,-2.05,1.82,.052), bars=[];
  for(const x of [-.53,.53]){
    const link=group(hang,x,0,0);bars.push(link);
    card(link,11,85,rounded(11,85,5),g=>{rect(g,0,0,11,85,gold);rect(g,2.2,0,2,85,navy);
      oval(g,5.5,5,3.2,3.2,navy);},0,-.80,0);
  }
  const basket=group(hang);
  const sled='M0 57 L12 47 L28 52 L27 28 L49 25 L60 36 Q61 18 75 14 Q83 0 96 2 L105 11 Q118 14 117 31 L126 47 L160 46 Q177 34 185 43 Q185 68 168 82 Q150 95 115 96 L44 96 Q15 91 0 57Z';
  card(basket,188,100,sled,g=>{
    rect(g,0,0,188,100,coral);
    envelope(g,27,27,33,28,cream);
    path(g,'M66 31 Q67 7 91 6 Q102 3 113 13 L119 24 L110 28 L98 17 L75 35Z',coral,navy,1.3);oval(g,116,24,5,5,cream);
    oval(g,87,34,17,16,'#e8bc96');path(g,'M68 33 Q70 44 80 38 Q85 45 88 38 Q96 44 105 31 Q109 50 89 61 Q72 57 68 45Z',cream,navy,1);
    path(g,'M69 28 Q82 19 101 21 L103 28 Q85 25 69 34Z',cream);oval(g,92,33,1.8,2.1,navy);
    path(g,'M2 56 Q15 61 32 57 L156 56 Q179 55 185 42 Q186 73 160 88 Q119 104 43 94 Q13 87 2 56Z',coral,navy,2.5);
    path(g,'M10 66 Q80 81 169 64',null,cream,5);path(g,'M23 82 Q89 99 153 82',null,gold,3);
    envelope(g,70,59,38,24,cream);oval(g,40,70,3,3,gold);oval(g,144,69,3,3,gold);
  },0,-.46,.041);
  // A tail-mounted postal windmill has three distinctly printed blades on one pin.
  const prop=group(starboard,3.97,2.86,.068), blades=group(prop);
  for(let i=0;i<3;i++){const arm=group(blades);arm.rotation.z=i*TAU/3;
    card(arm,40,64,'M11 61 Q4 48 3 27 Q3 10 13 3 Q27 -2 34 11 Q43 34 20 61Z',g=>{
      rect(g,0,0,40,64,cream);path(g,'M3 22 L32 7 L38 20 L4 38Z',rose);path(g,'M8 44 L32 31 L29 44 L12 55Z',coral);
      path(g,'M14 59 Q13 34 20 13',null,blue,1.6);
    },.025,-.048,0);
  }
  card(prop,25,25,ringD(12.5,12.5,12.4),g=>{oval(g,12.5,12.5,12.3,12.3,gold,navy,2);
    oval(g,12.5,12.5,5.5,5.5,blue,cream,1.5);},0,-.125,.039);
  // Hinged, hanging snow ornaments under the tail, attached by narrow paper strips.
  const mobiles=[];
  for(const [x,y,l,r] of [[2.42,2.34,.74,20],[3.13,2.32,.99,15]]){
    const anchor=group(starboard,x,y,.048);mobiles.push({anchor,motion:spring(t=>ease((t-1.6)/1.5)*.16*Math.sin(2.4*t+x*2),1.55)});
    const R=r*2,H=l*100+r*2;
    const d=`M${r-1.2} 0 L${r+1.2} 0 L${r+1.2} ${l*100+2} L${r+5} ${l*100+12} L${R} ${l*100+r} L${r+5} ${l*100+r+5} L${r} ${H} L${r-5} ${l*100+r+5} L0 ${l*100+r} L${r-5} ${l*100+12} L${r-1.2} ${l*100+2} Z`;
    card(anchor,R,H,d,g=>{rect(g,0,0,R,H,gold);star(g,r,H-r,r,cream);snow(g,r,H-r,r*.65,blue);},0,-H/100,0,{rim:.005});
  }
  // A second, lower V insert carries snowbound coastal pines and a route beacon.
  const [farL,farR]=vfold(-2.45,-12,.13);
  const [coastL,coastR]=vfold(-3.1,-8,.128);
  function mountains(panel,x,w,h,seed) {
    const ridge=`M0 ${h} L0 ${h*.91} L${w*.17} ${h*.67} L${w*.26} ${h*.75} L${w*.56} ${h*.07} L${w*.63} ${h*.2} L${w*.69} ${h*.16} L${w*.89} ${h*.72} L${w} ${h*.90} L${w} ${h}Z`;
    card(panel,w,h,ridge,g=>{
      rect(g,0,0,w,h,seed? '#79aab2':'#648e9e');
      path(g,`M${w*.56} ${h*.07} L${w*.41} ${h*.90} L${w*.59} ${h*.59} L${w*.61} ${h*.82} L${w*.7} ${h*.66} L${w*.9} ${h} L${w} ${h} L${w*.68} ${h*.12}Z`,'#a5c8c3');
      path(g,`M${w*.28} ${h*.65} L${w*.56} ${h*.03} L${w*.64} ${h*.17} L${w*.69} ${h*.12} L${w*.82} ${h*.54} L${w*.69} ${h*.37} L${w*.67} ${h*.48} L${w*.59} ${h*.32} L${w*.53} ${h*.54} L${w*.50} ${h*.45}Z`,cream);
      path(g,`M0 ${h*.93} Q${w*.2} ${h*.79} ${w*.36} ${h*.89} Q${w*.48} ${h*.94} ${w*.65} ${h*.84} Q${w*.85} ${h*.71} ${w} ${h*.92} L${w} ${h} L0 ${h}Z`,ice);
    },x,0,0);
  }
  mountains(coastL,-4.0,418,220,0);mountains(coastR,3.64,532,216,1);
  // The scenery is glued to two continuous snowbanks, each scored at the centre of the atlas.
  for(const [pair,h,shade] of [[[farL,farR],47,'#9ebeb9'],[[coastL,coastR],63,'#accac4']]){
    const width=1360,d=`M0 ${h*.86} Q52 ${h*.27} 142 ${h*.5} Q208 -5 294 ${h*.43} Q365 -2 432 ${h*.56} Q530 ${h*.08} 639 ${h*.55} Q739 ${h*.94} 843 ${h*.43} Q906 0 987 ${h*.48} Q1085 ${h*.86} 1162 ${h*.42} Q1264 3 1360 ${h*.79} L1360 ${h} L0 ${h}Z`;
    for(let i=0;i<2;i++)card(pair[i],width,h,d,g=>{
      rect(g,0,0,width,h,shade);path(g,d,null,cream,7);
      for(let j=0;j<92;j++){let x=j*15,y=h*(.7+.14*Math.sin(j*1.3));path(g,`M${x} ${y} l5 -1`,null,'#749e9b',1);}
    },0,0,-.045,{half:i===0?-1:1,rim:.006});
  }
  // A golden winter sun printed as a postage medallion rises from behind the northern coast.
  card(coastR,14,158,null,g=>rect(g,0,0,14,158,'#a2bfb9'),2.54,0,-.09);
  const moonR=85;
  card(coastR,170,170,ringD(moonR,moonR,moonR),g=>{
    rect(g,0,0,170,170,'#efd49a');oval(g,85,85,77,77,null,'#cfa85f',1.7);oval(g,85,85,72,72,null,'#fff4c8',1.5);
    for(let i=0;i<32;i++){const a=i*TAU/32;path(g,`M${85+57*Math.cos(a)} ${85+57*Math.sin(a)} l${7*Math.cos(a)} ${7*Math.sin(a)}`,null,'#d5b36f',1.5);}
    star(g,85,84,32,'#fcf1c9',8);star(g,85,84,15,'#d4aa68');},2.54,1.53,-.05);
  // The port's post house and timbered annex are a shallow layered skyline on the rear score.
  function cabin(panel,x,w,h,color) {
    const d=`M2 ${h*.43} L${w*.42} ${h*.06} L${w*.67} ${h*.17} L${w*.67} ${h*.05} L${w*.76} ${h*.05} L${w*.76} ${h*.2} L${w-1} ${h*.34} L${w-1} ${h*.41} L${w*.92} ${h*.45} L${w*.92} ${h} L${w*.1} ${h} L${w*.1} ${h*.47}Z`;
    card(panel,w,h,d,g=>{
      rect(g,0,0,w,h,color);
      path(g,`M0 ${h*.40} L${w*.42} 0 L${w} ${h*.32} L${w} ${h*.42} L${w*.46} ${h*.23} L${w*.07} ${h*.53}Z`,navy);
      path(g,`M0 ${h*.4} L${w*.42} ${h*.045} L${w} ${h*.32} L${w} ${h*.37} L${w*.43} ${h*.16} L${w*.1} ${h*.45}Z`,cream);
      for(const a of [.20,.64]){rect(g,w*a,h*.54,w*.16,h*.20,navy);rect(g,w*a+2,h*.54+2,w*.16-4,h*.20-4,gold);rect(g,w*(a+.07),h*.54,1.6,h*.20,navy);}
      rect(g,w*.44,h*.62,w*.12,h*.39,navy);frame(g,w*.44-1,h*.62,w*.12+2,h*.39,cream,1);
      path(g,`M${w*.09} ${h*.94} Q${w*.55} ${h*.90} ${w*.94} ${h*.96}`,null,cream,3.2);
    },x,0,.028);
  }
  cabin(farL,-6.49,99,100,coral);cabin(farL,-4.43,87,80,'#b37557');cabin(farR,6.35,74,74,coral);
  function pineCard(parent,x,w,h,family){
    const d=`M${w*.46} 0 L${w*.75} ${h*.37} L${w*.65} ${h*.37} L${w*.88} ${h*.62} L${w*.74} ${h*.61} L${w} ${h*.83} L${w*.57} ${h*.88} L${w*.57} ${h} L${w*.40} ${h} L${w*.40} ${h*.88} L0 ${h*.84} L${w*.25} ${h*.61} L${w*.12} ${h*.62} L${w*.35} ${h*.37} L${w*.23} ${h*.37}Z`;
    card(parent,w,h,d,g=>{rect(g,0,0,w,h,family);rect(g,w*.40,h*.865,w*.17,h*.14,navy);
      for(const [Y,X] of [[.30,.24],[.53,.13],[.75,.03]]){
        path(g,`M${w*X} ${h*(Y+.06)} L${w*.46} ${h*(Y-.24)} L${w*(1-X)} ${h*(Y+.05)} L${w*.60} ${h*Y} L${w*.49} ${h*(Y+.042)} L${w*.38} ${h*(Y-.033)}Z`,ice);
      }},x,0,0);
  }
  pineCard(farL,-5.92,125,202,teal);pineCard(farL,-5.04,100,138,blue);pineCard(farL,-3.61,82,103,teal);
  pineCard(farR,5.94,114,168,blue);pineCard(farR,4.91,73,121,teal);
  card(farR,110,225,'M10 225 L26 100 L19 98 L19 84 L26 82 L29 49 L18 48 L20 42 L51 16 L52 0 L57 0 L57 18 L90 42 L91 49 L82 50 L84 82 L93 83 L92 98 L81 101 L101 225Z',g=>{
    rect(g,0,0,110,225,cream);path(g,'M15 192 L97 148 L94 123 L19 164Z',coral);
    path(g,'M22 138 L84 105 L80 94 L26 99Z',coral);path(g,'M19 43 L54 15 L93 44 L91 50 L19 50Z',coral,navy,2);
    rect(g,23,50,60,35,navy);for(let i=0;i<3;i++)rect(g,30+i*16,53,11,25,gold);rect(g,18,84,75,12,blue);
    path(g,'M45 224 L46 205 Q55 190 65 204 L65 224Z',navy);
    frame(g,37,134,10,14,navy,2);
  },5.43,0,.01);
  // One folded mail gull rides the tip of a slender rocker anchored in the western pine.
  const gullPin=group(farL,-5.89,1.72,-.075);
  card(gullPin,60,129,'M2 126 Q8 62 48 1 L54 3 Q20 67 9 128Z',g=>{
    rect(g,0,0,60,129,'#9ebbb7');path(g,'M5 125 Q14 62 51 3',null,blue,1.1);
  },.25,-.04,0,{thick:.018,rim:.003});
  card(gullPin,116,65,'M2 25 L36 26 L28 3 Q46 7 71 27 Q84 22 97 28 L112 33 L102 37 Q89 49 62 46 L45 58 L18 62 L31 44 L8 41 L19 34Z',g=>{
    rect(g,0,0,116,65,cream);path(g,'M2 24 L37 28 L63 43 L32 44 L8 41 L19 34Z',aqua);
    path(g,'M28 3 L70 29 L55 33Z','#99b9b6');path(g,'M61 40 L19 62 L40 39Z',ice);
    path(g,'M100 29 L114 33 L101 37Z',gold);oval(g,93,31,2.1,2.1,ink);
    path(g,'M29 37 L58 38 L57 48 L30 49Z',coral);path(g,'M31 38 L43 45 L57 39',null,cream,1.6);
  },.47,1.00,.015);
  const air=spring(t=>.085*Math.sin(t*1.8)*ease((t-1.8)/1.3),1.2);
  // The letter tilts up from the fixed right leaf. Its blue flap and cancellation are printed on the same stock.
  const letter=group(right,3.62,.082,4.05), W=650,H=252;
  card(letter,W,H,rounded(W,H,7),g=>{
    rect(g,0,0,W,H,cream);airStripe(g,W,H);
    frame(g,13,13,W-26,H-26,'#91a9a0',1.3);
    text(g,'성탄 항공 서신',29,34,15,blue,{align:'left',font:sans,bold:true,space:2});
    path(g,'M27 49 L620 49',null,'#a2b3a6',1);
    fitMessage(g,message,29,52,588,180,navy,40);
    g.save();g.translate(589,24);g.rotate(-.08);envelope(g,-17,-9,34,19,ice);g.restore();
  },0,0,0,{res:154,thick:.03});
  function airStripe(g,w,h){
    for(const [x,y] of [[20,0],[w-120,h-8]])for(let i=0;i<7;i++){path(g,`M${x+i*14} ${y} l8 0 l5 8 l-8 0Z`,i%2?blue:coral);}
  }
  const axis=new THREE.Vector3(0,0,1),ux=new THREE.Vector3(),up=new THREE.Vector3(),normal=new THREE.Vector3(),basis=new THREE.Matrix4();
  return t=>{
    const p=ease((t-.56)/2.75),close=PI*(1-p),hc=close*.5,L=left.rotation;
    L.z=-close;left.position.y=.025+.32*(1-p);
    // Both base creases are fixed in their leaves. Their common perpendicular is the centre ridge.
    for(const {a,y,groups} of windings){
      const A=Math.cos(a)*Math.sin(hc),B=Math.sin(a),len=Math.hypot(A,B);
      up.set(-B*Math.sin(hc)/len,-B*Math.cos(hc)/len,A/len);
      for(let i=0;i<2;i++){
        groups[i].position.y=lerp(y,.078,p);
        ux.set(Math.cos(a),0,i===0?-Math.sin(a):Math.sin(a));
        if(i===0)ux.applyAxisAngle(axis,-close);
        normal.crossVectors(ux,up).normalize();basis.makeBasis(ux,up,normal);groups[i].quaternion.setFromRotationMatrix(basis);
      }
    }
    letter.rotation.x=-PI/2+.38*p;
    const tt=Math.max(0,t-1.75),amp=ease(tt/1.2),a=.19*Math.sin(tt*2.17)*amp;
    bars.forEach(b=>b.rotation.z=a);basket.position.set(.80*Math.sin(a),-.80*Math.cos(a),0);
    gullPin.rotation.z=air.x;
    fin.rotation.z=-.07+.19*Math.sin(tt*1.97)*amp;blades.rotation.z=.32+tt*1.63;
    mobiles.forEach(({anchor,motion})=>anchor.rotation.z=motion.x);
    const u=ease((t-.30)/3.25),drift=.46*Math.sin(Math.max(0,t-3.5)*.27);
    return {center:[lerp(3.65,0,u),lerp(.1,1.74,u),lerp(0,-.08,u)],
      eye:[lerp(4.8,1.6,u)+drift,lerp(12.4,12.3,u),lerp(11.0,18.25,u)]};
  };
});
