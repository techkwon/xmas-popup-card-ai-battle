import {PI,TAU,path,layer,rect,frame,oval,text,star,starD,snow,sprig,stars,rng,sans,serif} from './studio.js';
export const C={wine:'#702439',red:'#b64148',rouge:'#cc5456',light:'#eb7b6d',gold:'#dba65a',pale:'#f5d694',ivory:'#fff1d1',navy:'#182e41',pine:'#205952',mint:'#79ab84',ink:'#3c2c39'};
const {wine,red,rouge,light,gold,pale,ivory,navy,pine,mint,ink}=C;
export function cameo(g,x,y,r) {
  oval(g,x,y,r,r,pale,wine,3);oval(g,x,y,r*.88,r*.88,wine,ivory,1.5);
  g.save();g.translate(x-r*.60,y-r*.69);g.scale(r*1.2/100,r*1.2/100);
  path(g,'M17 12 L27 21 L43 3 L54 17 L73 1 L77 19 L92 9 L87 43 L18 43Z',gold,pale,2);
  rect(g,16,37,72,13,navy);rect(g,20,51,64,36,'#ebc298');oval(g,35,62,3,4,ink);oval(g,66,62,3,4,ink);
  path(g,'M50 64 L55 75 L46 75Z','#c27561');
  path(g,'M49 76 Q36 66 18 78 Q27 91 50 80 Q69 94 85 76 Q67 68 53 76Z',ink);
  path(g,'M25 85 Q49 91 78 84 L72 104 L52 116 L30 105Z',ivory);
  rect(g,38,86,28,10,red);for(let k=0;k<5;k++)rect(g,39+k*5.4,86,4,5,ivory);
  g.restore();
}
export function cover(g){
  g.save();g.translate(1280,650);g.rotate(PI);
  rect(g,0,0,1280,650,wine);frame(g,21,21,1238,608,gold,3);frame(g,32,32,1216,586,'#b77958',1.4);
  for(const flip of [0,1]){g.save();if(flip){g.translate(1280,0);g.scale(-1,1);}
    for(const [x,y,a,n] of [[80,560,.25,186],[104,558,.62,142],[72,531,-.11,125],[120,510,.78,102],[63,128,.9,105]])sprig(g,x,y,n,a,[gold,'#b77654',pale]);
    for(let i=0;i<7;i++){oval(g,90+i*12,520-i*5,5,6,'#e49572');}g.restore();}
  for(let i=0;i<62;i++){const a=i*TAU/62;const X=640+153*Math.cos(a),Y=205+135*Math.sin(a);path(g,`M${X} ${Y} l${13*Math.cos(a)} ${13*Math.sin(a)}`,null,gold,1.5);}
  cameo(g,640,199,98);
  for(const s of [-1,1]){sprig(g,640+s*110,267,142,s*.75,[gold,pale]);star(g,640+s*240,212,15,pale);}
  text(g,'호두까기 인형',640,392,94,ivory,{bold:true,space:6});
  text(g,'성 탄  전 야 의  작 은  무 대',640,485,27,pale,{font:sans,space:3});
  path(g,'M452 555 L591 555 M690 555 L828 555',null,gold,1.7);text(g,'12 · 25',640,555,23,pale,{bold:true});g.restore();
}
export function sky(g){
  rect(g,0,0,1280,650,'#193447');frame(g,13,14,1254,622,gold,2);
  stars(g,485,25,24,1230,598,235,['#fae6ac','#d0dfcc','#85a7a7']);
  for(let i=0;i<3;i++){
    const r=rng(88+i*11);let d='M0 650 L0 '+(453+i*34);
    for(let x=0;x<=1320;x+=30+r()*38)d+=' L'+x+' '+(342+i*66+r()*80);
    path(g,d+' L1280 650 Z',['#31566b','#497782','#6b9896'][i]);
  }
  for(let i=0;i<32;i++){const r=rng(300+i),x=i*41+r()*22,y=537+r()*52,h=46+r()*46;
    path(g,`M${x-h*.34} ${y} l${h*.2} -${h*.38} l-${h*.09} 2 l${h*.25} -${h*.65} l${h*.23} ${h*.65} l-${h*.07} -2 l${h*.17} ${h*.38}Z`,i%2?'#447679':'#395f6b');}
  path(g,'M0 561 Q171 510 356 585 Q541 627 734 552 Q920 505 1280 568 L1280 650 L0 650Z','#b1c2b0');
  path(g,'M0 600 Q235 553 430 606 Q689 645 899 583 Q1120 541 1280 598 L1280 650 L0 650Z','#dfdbc0');
}
export function stageFloor(g){
  rect(g,0,0,1280,650,'#ae704e');
  for(let k=0;k<13;k++){const x=k*106;path(g,`M${x} 0 l-45 650`,null,'#8c5042',2);}
  for(let j=0;j<3;j++){const y=54+j*131;path(g,`M0 ${y} Q620 ${y+29} 1280 ${y}`,null,'#bd845a',2);}
  frame(g,15,12,1250,623,pale,3);frame(g,28,24,1224,599,'#6e3d39',1.3);
  rect(g,0,350,1280,300,'#883843');rect(g,0,351,1280,8,gold);rect(g,0,365,1280,2,pale);
  for(let i=0;i<55;i++){const x=i*24;path(g,`M${x} 625 l12 -13 l12 13 l-12 13Z`,i%2?gold:'#c78058');}
}
export const archShape='M0 588 L0 20 Q0 0 22 0 L1200 0 Q1220 0 1220 20 L1220 588 L1078 588 L1078 441 Q1098 362 1082 253 Q1044 153 1010 133 Q925 170 830 119 Q731 163 609 102 Q491 161 385 119 Q290 170 207 133 Q167 181 137 254 Q124 357 142 441 L142 588 Z';
export function arch(g){
  rect(g,0,0,1220,588,wine);
  // Symmetrical pleated velvet wings with individual gold tassels and swag linings.
  for(const m of [0,1]){g.save();if(m){g.translate(1220,0);g.scale(-1,1);}
    path(g,'M0 36 L282 36 Q238 155 94 355 L150 587 L0 587Z',red);
    for(let i=0;i<6;i++){const x=i*44;
      path(g,`M${x} 38 L${x+18} 38 Q${96+i*3} 256 87 354 Q${67+i*8} 280 ${x} 38Z`,[rouge,'#983945','#d26059'][i%3]);
      path(g,`M86 359 Q${49+i*15} 442 ${i*25} 588 L${i*25+9} 588 Q${69+i*12} 433 93 359Z`,i%2?'#722840':'#cc5d58');}
    path(g,'M9 370 Q60 372 127 337 L133 348 Q64 387 9 383Z',gold,pale,1.2);
    path(g,'M123 345 Q155 360 146 393',null,pale,3);
    path(g,'M145 389 Q132 400 134 419 L155 419 Q158 402 145 389Z',gold);oval(g,145,390,4.5,5,pale);
    rect(g,0,0,22,588,'#9a6743');rect(g,5,0,6,588,pale);
    // Stencilled acanthus emblems on the lower curtain panels.
    g.save();g.translate(65,522);
    for(const side of [-1,1]){g.save();g.scale(side,1);
      path(g,'M0 22 Q-2 3 11 -15 Q19 -26 26 -26 Q29 -18 19 -13 Q18 -4 10 0 Q8 10 0 22Z',gold);
      path(g,'M0 9 Q2 -8 0 -24 Q-3 -39 0 -46 Q9 -38 6 -26 Q10 -17 4 -8Z',pale);
      path(g,'M2 22 Q16 7 27 5 Q34 4 38 9 Q29 8 24 16 Q14 15 2 25Z',gold);g.restore();}
    oval(g,0,27,5,5,pale);g.restore();
    rect(g,0,560,140,26,gold);rect(g,4,565,130,6,pale);
    g.restore();}
  for(const [a,b] of [[0,405],[300,905],[815,1220]]){
    const mid=(a+b)/2;
    layer(g,`M${a} 24 L${b} 24 Q${mid+22} 212 ${a} 45Z`,rouge,wine,2);
    path(g,`M${a+2} 46 Q${mid+22} 199 ${b-3} 28`,null,gold,5);
    for(let i=1;i<9;i++){const u=i/9,x=a+(b-a)*u,y=41+67*Math.sin(u*PI);oval(g,x,y,2,4,pale);}
  }
  rect(g,0,0,1220,24,gold);rect(g,1,3,1218,7,pale);
  for(let i=0;i<60;i++){const x=13+i*20;path(g,`M${x} 13 l5 -3 l5 3 l-5 4Z`,'#a06a42');}rect(g,0,20,1220,5,wine);
  layer(g,'M380 17 Q432 21 475 7 L745 7 Q793 21 840 17 L822 54 Q747 48 715 66 L505 66 Q463 48 397 54Z',navy,gold,3);
  text(g,'호두까기 인형',610,36,35,pale,{bold:true,space:3});
  for(const x of [415,805])star(g,x,36,10,gold);
}
export const treeShape='M168 0 L182 28 L208 32 L189 48 L195 65 L208 81 L194 82 Q211 108 236 125 L216 125 Q234 155 258 175 L239 174 Q263 211 287 228 L263 228 Q287 264 311 282 L285 278 Q315 319 338 336 Q250 360 191 360 L191 399 L144 399 L144 358 Q66 361 0 338 Q30 315 53 281 L28 284 Q63 258 77 229 L51 234 Q83 204 99 175 L80 177 Q105 150 123 124 L104 125 Q129 103 144 82 L130 83 L147 63 L151 48 L128 30 L158 28Z';
export function tree(g){
  rect(g,0,0,340,400,pine);rect(g,144,343,47,57,'#91613f');rect(g,153,348,7,52,gold);
  for(const [y,w] of [[65,51],[111,82],[163,110],[218,138],[276,164]]){
    path(g,`M${168-w} ${y+55} Q168 ${y+85} ${168+w} ${y+55} Q${168+w*.72} ${y+72} 168 ${y-31} Q${168-w*.6} ${y+67} ${168-w} ${y+55}Z`,y%2?'#3c7864':'#356d60');
    path(g,`M${168-w*.83} ${y+43} Q168 ${y+95} ${168+w*.91} ${y+27}`,null,'#102f37',5);
    path(g,`M${168-w*.83} ${y+41} Q168 ${y+89} ${168+w*.91} ${y+26}`,null,gold,3);
    const n=Math.floor(w/18);for(let i=0;i<n;i++){const u=(i+.5)/n,x=168+(u-.5)*w*1.54,Y=y+40+20*Math.sin(PI*u);
      oval(g,x,Y+5,4.6,5.5,[pale,'#d76859','#b6c997'][i%3]);}
  }
  const r=rng(215);for(let i=0;i<63;i++){const y=75+r()*260,w=(y-25)*.43,x=168+(r()-.5)*2*w;
    if(i%4===0)star(g,x,y,5,pale);else path(g,`M${x-5} ${y-2} l5 6 l5 -6`,null,'#8aaf82',1.5);}
  layer(g,starD(168,37,35,5,.47),gold,pale,2);path(g,'M168 7 L169 37 L138 27 L160 40Z',ivory);
}
export const soldierShape='M12 348 L16 334 L38 327 L37 252 L29 242 L29 193 L16 207 L4 198 L5 145 Q8 130 30 125 L37 118 Q19 104 24 83 L31 65 L24 15 Q60 -1 99 15 L92 67 L102 86 L98 111 L86 119 L104 128 Q121 130 124 147 L129 190 L119 199 L107 193 L104 241 L95 251 L96 328 Q114 331 117 347 L73 347 L66 252 L60 252 L57 347Z';
export function soldier(g){
  rect(g,0,0,130,350,ink);
  rect(g,32,235,66,68,'#dfc58d');rect(g,54,240,7,67,gold);rect(g,81,240,5,67,gold);
  for(const x of [31,71]){rect(g,x,296,29,39,navy);rect(g,x,299,29,5,gold);path(g,`M${x} 327 l24 0 l12 15 l-45 0Z`,ink);}
  layer(g,'M31 127 L96 127 L108 155 L105 239 Q76 258 64 239 Q45 255 26 239 L28 157Z',red,ink,2);
  path(g,'M55 130 L72 130 L80 237 L53 236Z',navy);rect(g,27,217,79,11,ink);frame(g,58,217,17,11,gold,2.5);
  for(let j=0;j<4;j++){const y=147+j*17;path(g,`M38 ${y} Q62 ${y+19} 92 ${y-1}`,null,pale,2.8);
    for(const x of [38,92])oval(g,x,y,3.9,3.9,gold,ink,.6);}
  for(const x of [19,108]){oval(g,x,137,16,8,gold);for(let i=0;i<5;i++)rect(g,x-13+i*5,139,2.8,9,pale);}
  oval(g,61,88,35,35,'#efc29a');oval(g,28,96,8,11,ivory);oval(g,95,96,8,11,ivory);
  for(const x of [43,78]){path(g,`M${x-6} 81 l12 -2`,null,ink,2.4);oval(g,x,88,2.8,4,ink);}
  path(g,'M60 87 L69 101 L59 103Z','#cf886f');
  path(g,'M63 105 Q49 93 34 102 Q38 113 61 111 Q74 119 91 101 Q77 95 63 105Z',ink);
  path(g,'M38 110 Q60 119 86 111 L77 131 L63 138 L43 127Z',ivory);
  rect(g,51,111,23,9,wine);for(let i=0;i<4;i++)rect(g,52+i*5.4,111,4.1,4.1,ivory);
  path(g,'M24 13 Q59 0 100 14 L91 69 L32 69Z',navy,gold,2);
  for(const x of [34,89])rect(g,x,15,3.8,45,gold);rect(g,30,55,65,9,gold);
  star(g,62,36,15,pale,6);oval(g,62,36,4.2,4.2,red);
}
export const dancerShape='M73 330 L82 312 L90 236 L66 199 L16 196 L3 187 L17 174 L69 137 L75 110 L62 107 L27 80 L11 51 Q5 36 12 31 L22 46 L38 68 L69 86 L85 83 L86 72 Q65 61 73 42 Q76 27 91 25 Q88 9 98 5 Q109 3 115 13 L125 18 L121 29 Q140 42 130 59 L139 63 L130 69 L124 72 L118 85 L134 94 L138 116 L127 139 L167 156 L198 174 L181 187 L144 191 L120 196 L108 239 L100 311 L104 328 L96 343 L83 344Z';
export function dancer(g){
  rect(g,0,0,200,345,'#f0be9c');
  layer(g,'M65 88 L86 84 L104 101 L120 84 Q142 90 137 110 L126 140 L86 151 L67 136 L78 110Z','#b65b6b',wine,2);
  path(g,'M82 90 Q100 120 120 94 L106 135 L94 137Z','#f4bdaf');
  path(g,'M69 136 Q103 152 128 137 Q158 146 198 174 Q115 211 4 188 Q35 157 69 136Z','#eaa38e',wine,2);
  for(let i=0;i<9;i++){const x=10+i*22;path(g,`M${83+i*4} 144 Q${x+14} 171 ${x} ${185-5*Math.cos(i*.7)} L${x+9} ${187-5*Math.cos(i*.7)}Z`,i%2?'#ce7e79':'#f8c7ac');}
  path(g,'M8 186 Q105 205 194 175',null,pale,4);
  for(let i=0;i<12;i++)oval(g,18+i*15,185+5*Math.sin(i*.41)-i*.7,2.5,2.6,ivory);
  path(g,'M78 41 Q76 19 102 25 Q129 16 133 47 Q120 48 112 35 Q96 51 80 52Z','#6c4145');
  oval(g,105,19,14,12,'#75484b');layer(g,'M83 35 L77 17 L90 22 L96 7 L106 20 L118 8 L118 28Z',gold,pale,1.3);
  path(g,'M115 54 Q121 59 126 52',null,ink,1.8);oval(g,115,63,4,2,'#dd927b');
  path(g,'M117 74 Q113 85 105 85',null,'#bf7d69',1.6);
  path(g,'M83 306 L103 298 M85 295 L101 305 M88 287 L102 295',null,'#c66f76',3);
  path(g,'M82 309 Q90 321 101 311 L104 328 L96 343 L83 344 L74 331Z','#c87781',wine,1.4);
  for(let i=0;i<6;i++)oval(g,80+i*6,92+5*Math.sin(i*.6),2.5,2.5,pale);
}
