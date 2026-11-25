import {PI,TAU,path,layer,rect,frame,oval,text,star,starD,snow,sprig,stars,rng,sans,serif} from './studio.js';
export const C={navy:'#183e52',blue:'#266078',teal:'#348794',aqua:'#82c8bf',ice:'#c6e0d6',cream:'#fff0cc',coral:'#d45c4c',rose:'#ed8c74',gold:'#e4bd71',ink:'#243e4a'};
const {navy,blue,teal,aqua,ice,cream,coral,rose,gold,ink}=C;
export function airBorder(g,w,h,n=15) {
  g.save();g.beginPath();g.rect(0,0,w,h);g.clip();
  for(let k=-h;k<w+h;k+=n*4){
    for(const [d,c] of [[0,coral],[2*n,blue]])path(g,`M${k+d} 0 l${n} 0 l${h*.51} ${h} l${-n} 0Z`,c);}
  g.restore();
}
function miniWhale(g,x,y,scale,body=teal){
  g.save();g.translate(x,y);g.scale(scale,scale);
  path(g,'M-103 -8 Q-98 -45 -35 -42 Q18 -44 56 -16 Q79 -3 88 -10 Q93 -30 115 -33 Q114 -13 106 -4 Q125 -7 136 1 Q119 17 96 11 Q74 26 41 24 Q-20 57 -72 29 Q-106 15 -103 -8Z',body);
  path(g,'M-93 7 Q-54 31 -5 17 Q-39 45 -76 25Z',cream);
  path(g,'M-12 8 Q10 29 40 27 Q28 10 14 6Z',navy);oval(g,-70,-4,3.5,4,navy);
  g.restore();
}
export function postmark(g,x,y,r,color) {
  oval(g,x,y,r,r,null,color,2.2);oval(g,x,y,r-5,r-5,null,color,1);
  text(g,'북극 우체국',x,y-r*.50,r*.27,color,{font:sans,bold:true});text(g,'12.25',x,y+1,r*.49,color,{bold:true});
  path(g,`M${x-r*.73} ${y+r*.26} l${r*1.46} 0`,null,color,1.2);star(g,x,y+r*.52,r*.12,color,5);
}
export function cover(g){
  rect(g,0,0,740,890,blue);frame(g,18,18,704,854,aqua,3);frame(g,28,28,684,834,gold,1.2);
  for(const s of [0,1]){g.save();if(s)g.translate(740,0),g.scale(-1,1);
    for(let k=0;k<14;k++)path(g,`M35 ${71+k*55} l10 -14 l0 13 l-10 14Z`,k%2?aqua:coral);
    g.restore();}
  stars(g,125,58,35,625,480,89,[aqua,cream,gold]);
  text(g,'크리스마스 항공우편',370,83,23,cream,{font:sans,bold:true,space:5});
  oval(g,370,318,202,198,navy,aqua,3);oval(g,370,318,188,184,null,gold,1.8);
  for(let i=0;i<72;i++){const a=i*TAU/72,x=370+194*Math.cos(a),y=318+190*Math.sin(a);
    path(g,`M${x} ${y} l${(i%6?3:7)*Math.cos(a)} ${(i%6?3:7)*Math.sin(a)}`,null,i%6?aqua:cream,1.4);}
  stars(g,829,232,194,272,218,44,[aqua,cream]);miniWhale(g,364,314,1.31,aqua);
  layer(g,'M270 269 Q282 198 325 210 Q343 221 333 246 Q323 231 311 233 L312 269Z',coral,cream,1.6);
  path(g,'M265 268 Q285 254 315 260 L317 270 Q286 269 265 280Z',cream);oval(g,334,247,9,9,cream);
  for(let i=0;i<3;i++)path(g,`M262 ${393+i*9} Q310 ${379+i*9} 351 ${393+i*9} T445 ${393+i*9}`,null,aqua,1.8);
  text(g,'고래 우편선',370,594,78,cream,{bold:true,space:4});
  text(g,'별빛을 따라 배달하는 성탄 편지',370,671,24,ice,{font:sans,space:2});
  path(g,'M129 730 L611 730',null,gold,1.8);text(g,'북 극  우 체 국',370,776,23,gold,{font:sans,bold:true,space:3});
  for(const x of [221,519])star(g,x,776,9,cream);
}
export function mapPage(g,side){
  const W=740,H=890, off=side>0?740:0;
  rect(g,0,0,W,H,cream);airBorder(g,W,H,17);rect(g,14,14,W-28,H-28,'#b7d5cd');
  g.save();g.beginPath();g.rect(19,19,W-38,H-38);g.clip();g.translate(-off,0);
  // Bathymetric outlines and the graticule remain continuous across the gutter.
  const coast='M-210 -150 L1600 -150 L1600 246 Q1450 240 1414 206 Q1371 174 1322 207 Q1283 214 1264 167 Q1213 108 1178 143 Q1132 191 1076 165 Q1048 151 1014 198 Q949 235 921 185 Q864 127 812 164 Q764 199 744 264 Q702 315 669 283 Q645 227 582 248 Q519 262 498 211 Q471 157 413 201 Q352 246 308 221 Q258 204 252 253 Q233 300 174 291 Q129 282 111 339 Q97 403 24 400 L-210 434Z';
  for(const [dy,c] of [[38,'#83b8b6'],[25,'#a4cbc1'],[10,'#8ebdb3'],[0,'#e6e4c7']]){g.save();g.translate(0,dy);path(g,coast,c,'#93b7aa',1);g.restore();}
  const shore='M-40 571 Q93 522 169 561 Q219 587 286 577 Q352 564 394 613 Q464 665 541 650 Q620 635 672 704 Q720 765 798 774 Q849 800 876 915 L-40 915Z';
  path(g,shore,'#e3e3c7','#8eb8ab',2);
  for(let i=0;i<18;i++){const y=26+i*52;path(g,`M0 ${y} Q740 ${y+54} 1480 ${y}`,null,'rgba(62,119,124,.26)',1);}
  for(let i=0;i<28;i++){const x=i*60;path(g,`M${x} 0 Q${x+(x-740)*.12} 445 ${x+(x-740)*.18} 890`,null,'rgba(62,119,124,.26)',1);}
  const r=rng(41);for(let i=0;i<190;i++){const x=r()*1450,y=25+r()*805;
    if(y>310&&y<560){path(g,`M${x} ${y} q4 5 8 0 q4 5 8 0`,null,'#82b1ab',1.5);}
    else if(y<126&&i%2){path(g,`M${x} ${y} l7 -10 l7 10Z`,null,'#8fae9b',1.4);}}
  g.setLineDash([8,6]);path(g,'M114 678 C290 490 467 642 554 481 S818 341 963 444 S1203 526 1389 213',null,coral,2.5);g.setLineDash([]);
  for(const [x,y] of [[114,678],[551,487],[955,443],[1389,213]]){
    oval(g,x,y,6,6,cream,coral,2);oval(g,x,y,2,2,coral);}
  g.restore();frame(g,20,20,W-40,H-40,blue,1.5);
  const margin=side>0?0:W-24;
  const fold=g.createLinearGradient(margin,0,margin+24,0);
  fold.addColorStop(side>0?0:1,'#8eaaa3');fold.addColorStop(side>0?1:0,'#c0d3be');
  rect(g,margin,0,24,H,fold);const seam=side>0?19:W-19;path(g,`M${seam} 18 L${seam} 872`,null,'#809d99',1.7);
  if(side<0){
    const X=139,Y=673,R=73;
    oval(g,X,Y,R,R,null,blue,2);oval(g,X,Y,R-8,R-8,null,teal,1);
    for(let i=0;i<16;i++){const a=i*PI/8;path(g,`M${X+R*Math.cos(a)} ${Y+R*Math.sin(a)} l${Math.cos(a)*-7} ${Math.sin(a)*-7}`,null,blue,2);}
    for(let i=0;i<8;i++){g.save();g.translate(X,Y);g.rotate(i*PI/4);
      path(g,`M0 0 L-9 -9 L0 ${i%2?-37:-63}Z`,navy);path(g,`M0 0 L9 -9 L0 ${i%2?-37:-63}Z`,i%2?aqua:coral);g.restore();}
    oval(g,X,Y,7,7,cream,navy,1.5);text(g,'북',X,Y-90,16,blue,{bold:true});
    text(g,'북극 고래 우편선',429,686,39,navy,{bold:true});
    text(g,'성탄절 특별 비행',426,737,21,blue,{font:sans,space:4});
    path(g,'M267 776 L574 776',null,teal,1.3);
    text(g,'12. 24',83,842,18,blue);text(g,'항 로 도',660,842,16,blue,{font:sans});
  }else{
    postmark(g,625,128,64,teal);text(g,'별빛 해협',552,385,18,blue,{font:sans,space:3});}
}
// One continuous engraving crosses the whale's book fold at the centre strap.
// Its support is cut as a column of wind, down to a stamped cloud at the score.
export const whaleD='M8 226 C7 187 43 145 117 126 C154 117 193 113 233 117 C325 101 456 117 552 145 C636 171 715 215 782 227 C822 233 856 225 877 199 C875 164 896 133 945 121 C946 151 936 176 923 186 C948 174 979 181 998 199 C962 230 929 235 897 227 C871 265 834 282 776 289 C708 303 632 323 549 344 Q533 383 548 416 Q557 446 584 449 Q601 431 628 445 Q644 454 645 472 Q669 467 682 494 L682 510 L358 510 Q361 480 384 482 Q389 458 413 461 Q434 441 460 456 Q479 441 476 412 L468 359 C369 377 254 376 160 351 C74 329 6 290 8 226 Z';
export function whale(g){
  rect(g,0,0,1000,510,teal);
  path(g,'M350 507 Q364 477 388 485 Q399 454 425 466 Q443 449 461 459 Q486 438 474 407 L462 340 L550 333 Q525 393 545 432 Q553 450 584 453 Q607 425 636 453 L649 473 Q681 470 689 506 L689 514 L352 514Z','#b7d7cd',blue,2);
  path(g,'M480 355 Q521 380 492 416 Q473 449 499 473 Q460 454 463 484 Q446 468 428 491 M534 376 Q516 422 544 446 Q565 468 545 482 M578 479 Q594 455 620 474',null,'#75aeb0',2.2);
  path(g,'M11 208 Q97 104 269 121 Q450 107 600 167 Q779 245 851 219 Q773 275 622 232 Q455 171 281 175 Q105 167 11 236Z','#459aa1');
  path(g,'M11 243 Q80 243 135 277 Q222 317 368 310 Q508 305 604 287 Q506 371 337 378 Q100 380 9 279Z','#e0d9ad',navy,2);
  for(let i=0;i<22;i++){const x=16+i*23;path(g,`M${x} ${249+65*Math.sin(i*.094)} Q${x+12} 363 ${x+62} 382`,null,'#98a78e',2);}
  path(g,'M15 239 Q71 249 106 227 Q116 220 113 216',null,navy,4);
  oval(g,122,210,13,14,navy);oval(g,118.8,205,3.7,4,cream);
  path(g,'M108 185 Q121 176 134 185',null,navy,2.7);oval(g,144,230,16,6,'#cd9484');
  for(let i=0;i<5;i++)oval(g,170+i*11,226+4*Math.sin(i),2.2,2.2,ice);
  // Lithographed ribs on the dirigible envelope, with a tucked paper highlight.
  for(const [x,y] of [[230,119],[339,113],[489,132],[633,175],[739,209]]){
    path(g,`M${x} ${y} Q${x-36} ${y+91} ${x-14} ${x<540?308:285}`,null,'#287080',2);
    path(g,`M${x+3} ${y+2} Q${x-30} ${y+90} ${x-11} ${x<540?308:285}`,null,'#73aeb0',1.5);}
  for(const x of [270,486]){
    layer(g,`M${x} 113 Q${x-23} 232 ${x+5} 360 L${x+19} 358 Q${x-5} 226 ${x+17} 115Z`,'#d8ab65',navy,1.5);
    frame(g,x-4,206,22,36,navy,3);rect(g,x-1,219,17,4,cream);}
  const r=rng(88);for(let i=0;i<87;i++){const x=175+r()*600,y=157+r()*122;
    if((x>285&&x<469)||(x>529&&x<637)){if(i%5===0)star(g,x,y,4+r()*3,cream);else oval(g,x,y,1.5,1.5,aqua);}}
  for(let i=0;i<3;i++){const x=331+i*48,y=226+i*2;oval(g,x,y,16,16,gold,navy,2);oval(g,x,y,11,11,navy,cream,1.2);path(g,`M${x-7} ${y+2} l9 -9`,null,aqua,2);}
  path(g,'M842 229 Q895 221 928 147 M893 218 Q934 194 975 198',null,aqua,3.4);
  path(g,'M578 265 Q611 250 656 259 Q633 279 590 283Z',aqua);
  text(g,'우 편',590,222,21,cream,{font:sans,bold:true,space:3});
  path(g,'M170 151 Q231 181 308 152 Q376 191 453 151 Q510 196 580 169 Q636 216 703 202',null,navy,2.2);
  for(const [x,y] of [[201,163],[235,169],[275,163],[332,163],[375,173],[419,164],[476,164],[515,181],[549,178],[605,184],[645,202],[682,205]]){
    rect(g,x-1,y,2,6,navy);oval(g,x,y+8,3.8,5.3,x%2?gold:rose);}
}
export const hatD='M1 121 Q6 91 34 85 Q78 17 137 7 Q189 -1 203 35 Q211 51 204 69 Q211 85 196 91 Q183 98 174 82 Q163 74 174 62 Q180 43 167 39 Q147 37 123 74 L113 92 Q125 98 117 115 Q73 109 10 133Z';
export function hat(g){
  rect(g,0,0,214,137,coral);
  path(g,'M29 93 Q79 19 144 7 Q97 24 78 67 L66 92Z',rose);
  path(g,'M95 87 Q136 29 166 31 Q193 31 177 65 Q162 74 174 85 L196 90 Q213 73 202 61 Q204 41 193 24 Q168 -8 133 4Z','#b34e48');
  path(g,'M5 105 Q60 77 113 88 Q125 95 117 115 Q63 111 8 134 Q-1 126 5 105Z',cream,navy,2);
  for(let i=0;i<11;i++)path(g,`M${13+i*10} ${116-17*Math.sin(i*.15)} l3 -8`,null,'#c5b797',1.2);
  oval(g,189,77,17,16,cream,navy,1.4);
}
export function envelope(g,x,y,w,h,base=cream){
  rect(g,x,y,w,h,base);frame(g,x,y,w,h,navy,1.7);path(g,`M${x} ${y} l${w*.5} ${h*.65} l${w*.5} -${h*.65} M${x} ${y+h} l${w*.34} -${h*.55} M${x+w} ${y+h} l-${w*.35} -${h*.55}`,null,navy,1.6);
  oval(g,x+w*.5,y+h*.6,w*.055,w*.055,coral);
}
