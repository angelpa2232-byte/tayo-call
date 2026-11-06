import {dinosaurArt} from './scene-backdrops.mjs';
import {move,appear,spin,sway,wave} from './scene-motion.mjs';
const vehicle=(id,x=100,y=240,w=350,css='')=>`<g class="${css}"><image href="assets/characters/${id}.png" x="${x}" y="${y}" width="${w}" height="${w}"/></g>`;
const person=(x,y,size=1)=>`<g transform="translate(${x} ${y}) scale(${size})"><circle cy="-50" r="18" fill="#ffd1aa"/><circle cx="-6" cy="-53" r="2"/><circle cx="6" cy="-53" r="2"/><path d="M-6-42Q0-36 7-42" stroke="#965d52" stroke-width="2" fill="none"/><path d="M0-30V20M-20-10H20M0 20L-15 45M0 20L15 45" stroke="#a388d4" stroke-width="12" stroke-linecap="round"/></g>`;
const tree=`<path d="M790 450V210" stroke="#b4875a" stroke-width="28"/><circle cx="790" cy="180" r="80" fill="#80c28a"/>`;
const box=(x,y)=>`<g transform="translate(${x} ${y})"><rect width="105" height="80" rx="8" fill="#b999df"/><path d="M52 0V80M0 22H105" stroke="#ffe291" stroke-width="10"/></g>`;
const ball=(x,y)=>`<g class="play-ball" transform="translate(${x} ${y})"><circle r="30" fill="#ffcc67"/><path d="M-27-8Q0 10 27-8M0-30Q20 0 0 30" stroke="#de7b6e" stroke-width="5" fill="none"/></g>`;
const sign=(text)=>`<rect x="680" y="160" width="235" height="75" rx="12" fill="#fff0ae"/><text x="798" y="207" text-anchor="middle" font-size="26" fill="#3a5968">${text}</text><path d="M795 235V420" stroke="#a28b72" stroke-width="12"/>`;
const park=`${tree}<path d="M650 370L720 465H650Z" fill="#ffcf78" stroke="#d99b5a" stroke-width="8"/>`;
const check=`<g class="scene-success" transform="translate(850 120)"><circle r="38" fill="#d2f4db"/><path d="M-18 0L-5 14 21-18" stroke="#409c72" stroke-width="8" fill="none" stroke-linecap="round"/></g>`;
const cone=x=>`<path d="M${x} 410L${x-18} 465H${x+18}Z" fill="#ed9851"/><path d="M${x-10} 439H${x+10}" stroke="white" stroke-width="9"/>`;
export function everydayProps(view){const {scene,step,actor='tayo',variant}=view;
 const supported=['passengers','outing','ball','rain','hide','picnic','delivery','lost','night','equipment','training','traffic','wash','detour','mud','balloon','cleanup','branches','crosswalk'];
 if(!supported.includes(scene))return null;
 const bus=vehicle(actor,100,240,350);
 const driving=step===0||step===2&&['passengers','rain','delivery','lost','detour','traffic'].includes(scene)||step===3&&['wash','traffic','crosswalk','mud'].includes(scene);
 let props=scene==='mud'&&step===2?'':driving?move(bus,step===0?0:150,0,'bus-drive',step===0?-220:0):bus;
 if(scene==='passengers'){
  props+=step<2?sign('버스 정류장'):park;
  const door='<rect x="355" y="355" width="38" height="85" rx="5" fill="#304b61" stroke="#97d9ed" stroke-width="4"/>';
  if(step===0)props+=wave(person(670,410)+person(770,410,.8),'passengers-wait');
  if(step===1)props+=appear(door,'door-open')+move(person(650,440,.8),-285,0,'passengers-board')+move(person(750,440,.8),-350,0,'second-passenger-boards',0,0,.6);
  if(step===2)props+=move('<g fill="#f4a7bd"><circle cx="650" cy="390" r="18"/><circle cx="790" cy="400" r="18"/><circle cx="925" cy="380" r="18"/></g>',-250,0,'flowers-pass-window');
  if(step===3)props+=appear(door,'door-open')+move(person(390,440,.8),330,0,'passengers-exit')+move(person(410,440,.8),430,0,'second-passenger-exits',0,0,.6);
 }
 if(scene==='outing'){
  props+=sign('공룡 모형 공원');if(step>0)props+=dinosaurArt(545,260,.8)+dinosaurArt(795,310,.54,'trex');
  if(step===1)props+=move('<circle cx="730" cy="315" r="60" fill="none" stroke="#ffe28b" stroke-width="6"/>',100,-20,'inspect-dinosaur-model');
  if(step>=2)for(let n=0;n<3;n++)props+=appear(`<ellipse cx="${620+n*60}" cy="${455+n%2*25}" rx="12" ry="20" fill="#759e78"/>`,'discover-footprint-'+n,n*.8);
  if(step===3)props+=wave(person(790,435,.8),'wave-to-dinosaur');
 }
 if(scene==='ball'){
  props+=step===3?wave(person(845,405),'owner-thanks'):person(845,405);
  if(step===0)props+=move(spin(ball(810,440),'ball-roll'),-240,0,'ball-rolls-to-bus');
  if(step===1)props+=sway(ball(570,440),'inspect-ball-pattern')+wave(person(845,405),'owner-waits');
  if(step===2)props+=move(spin(ball(570,440),'ball-roll'),240,0,'return-ball-to-owner');
  if(step===3)props+=wave(ball(810,430),'owner-catches-ball');
 }
 if(scene==='rain'){
  props+=sign('비 오는 정류장');if(step<3)props+='<g class="play-rain" stroke="#62b4e3" stroke-width="7"><path d="M590 100L580 140M670 140L660 180M750 90L740 130M870 120L860 160"/></g>';if(step<2)props+=wave(person(680,400),'wait-with-umbrella')+'<path d="M620 345Q680 265 740 345Z" fill="#ffe17b"/><path d="M680 345V400" stroke="#b18a50" stroke-width="5"/>';
  if(step===3)props+=appear('<path d="M580 240Q740 20 920 240" fill="none" stroke="#f9a0a0" stroke-width="22"/><path d="M590 250Q740 55 910 250" fill="none" stroke="#f9d980" stroke-width="20"/><path d="M600 260Q740 90 900 260" fill="none" stroke="#8fcf9b" stroke-width="18"/>','rainbow-appears');
 }
 if(scene==='hide'){
  props+=tree;
  if(step===3)props+=move(vehicle('lani',650,270,240),-95,0,'lani-revealed')+move('<rect x="650" y="310" width="170" height="140" rx="8" fill="#d9b182"/>',180,0,'box-slides-aside');
  else{props+='<rect x="650" y="310" width="170" height="140" rx="8" fill="#d9b182"/>';
   if(step===1)props+=move('<circle cx="580" cy="380" r="55" fill="#fff6b944" stroke="#ffdf88" stroke-width="4"/>',220,0,'search-behind-box');
   if(step===2)props+=sway('<circle cx="810" cy="435" r="22" fill="#ffc62e" stroke="#526374" stroke-width="7"/>','hidden-wheel-moves');
  }
 }
 if(scene==='picnic'){
  props+=park;if(variant==='flowers'){props+=sway('<g stroke="#72a96f" stroke-width="7"><path d="M590 450V360M860 450V360"/></g><g fill="#f391ab"><circle cx="590" cy="350" r="25"/><circle cx="860" cy="350" r="25"/></g>','flowers-sway');if(step===2)props+=move(`<g class="play-butterfly" transform="translate(${step===2?730:870} 280)"><ellipse cx="-12" rx="15" ry="20" fill="#e5adf2"/><ellipse cx="12" rx="15" ry="20" fill="#efc470"/><path d="M0-20V20" stroke="#705a80" stroke-width="5"/></g>`,120,-30,'butterfly-flies');if(step===3)props+=move('<rect x="500" y="330" width="95" height="70" rx="8" fill="#fff5d4"/><circle cx="545" cy="355" r="15" fill="#f391ab"/>',100,0,'show-flower-picture');}
  else if(step===2)props+='<path d="M560 420H890L920 470H540Z" fill="#eaa0b2"/>'+move(spin(ball(660,425),'picnic-ball-spin'),130,0,'picnic-ball-roll')+'<path d="M770 385L815 395 860 385V430L815 440 770 430Z" fill="#fff5cf" stroke="#9bc1d5" stroke-width="4"/>';
  else if(step===0)props+=move(box(560,390),-170,0,'picnic-invitation-arrives');
  else if(step===1)props+=wave(vehicle(actor==='rogi'?'tayo':'rogi',650,240,240),'picnic-friend-waits');
  else props+=box(750,390)+move(ball(620,325),175,90,'pack-ball-in-basket')+move('<rect x="600" y="280" width="60" height="40" fill="#fff1b7"/>',175,110,'pack-book-in-basket',0,0,.5);
 }
 if(scene==='delivery'){
  props+=sign('친구의 차고지');
  if(step===0)props+=move(box(600,360),-230,0,'load-parcel');
  if(step===1){props+=box(570,390);const contents=variant==='snack'?'<circle cx="600" cy="325" r="20" fill="#ef7772"/><path d="M635 310Q650 350 680 310Q660 360 635 310Z" fill="#ffe074"/>':'<circle cx="600" cy="325" r="20" fill="#ef98b5"/><rect x="635" y="302" width="35" height="40" fill="#fff2bc"/>';props+=move(contents,0,75,'fill-gift-parcel');}
  if(step===2)props+=move(box(450,360),150,0,'deliver-parcel-to-garage');
  if(step===3)props+=vehicle(actor==='gani'?'lani':'gani',720,225,220)+move(box(500,350),220,30,'hand-parcel-to-friend');
 }
 if(scene==='lost'){
  if(variant==='directions'){props+=step<3?sign('공원 →'):park;props+=step===2?move(person(660,430,.8),180,0,'walk-to-park'):step===3?wave(person(880,430,.8),'thank-for-directions'):wave(person([610,660][step],430,.8),'ask-for-directions');}
  else{props+='<rect x="690" y="330" width="145" height="105" fill="#d9b182"/>';if(step===1)props+=move('<circle cx="635" cy="350" r="30" stroke="#6a96bd" stroke-width="7" fill="#d7f6ff88"/><path d="M612 375L585 402" stroke="#6a96bd" stroke-width="10"/>',130,0,'search-with-magnifier');if(step>=2)props+=appear(`<g transform="translate(${step===3?870:830} 380)"><circle cy="-25" r="20" fill="#ffc99a"/><path d="M0 0V30M-20 10H20" stroke="#e58eae" stroke-width="16"/></g>`,'doll-found');if(step===3)props+=wave(person(875,420),'hug-found-doll');}
 }
 if(scene==='night'&&step===3)props+=move('<rect x="500" y="320" width="115" height="85" rx="10" fill="#fff3c3"/><path d="M555 330L565 352 590 355 570 370 575 393 555 380 533 393 538 370 520 355 545 352Z" fill="#e6b55d"/>',120,0,'show-star-picture');
 if(scene==='night'){props+=appear('<circle cx="770" cy="180" r="55" fill="#fff0b3"/>','moon-light');for(let n=0;n<(step>=2?7:3);n++)props+=`<path class="play-star" d="M${560+n*47} ${110+(n%3)*65}l6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" fill="#ffe5a1"/>`;}
 if(scene==='equipment'){
  props+=sign('소방 장비실');const helmet='<path d="M610 330Q660 240 710 330Z" fill="#ffd56e"/><path d="M600 330H720" stroke="#c48e42" stroke-width="12"/>';
  const hose='<circle cx="820" cy="350" r="48" fill="none" stroke="#ee9870" stroke-width="16"/><circle cx="820" cy="350" r="25" fill="none" stroke="#ee9870" stroke-width="11"/>';
  if(step===0)props+=move('<rect x="600" y="280" width="300" height="170" fill="#97b9ca"/>',240,0,'equipment-door-opens');
  if(step===1)props+=appear(helmet,'show-helmet')+appear(hose,'show-hose',.6);
  if(step===2)props+=move(helmet,-110,-50,'try-safety-helmet')+sway(hose,'show-hose-function');
  if(step===3)props+=move(helmet,0,50,'put-helmet-away')+move(hose,0,50,'put-hose-away');
 }
 if(scene==='training'){
  const hose='<path d="M400 420Q480 460 580 410L650 375" fill="none" stroke="#e8ac67" stroke-width="12"/>';
  if(step===1)props+=move(hose,0,0,'unroll-training-hose',-150,10);
  if(step===3)props+=spin('<circle cx="560" cy="410" r="32" fill="none" stroke="#e8ac67" stroke-width="12"/>','coil-training-hose');
  props+=sign('물 표적 훈련');props+='<g class="'+(step===2?'play-target':'')+'"><circle cx="720" cy="355" r="50" fill="#ed7b75"/><circle cx="720" cy="355" r="25" fill="#fff0bd"/><circle cx="870" cy="355" r="50" fill="#79b6df"/></g>';if(step===2)props+='<g data-motion="water-sprays-target" class="scene-water"><path d="M400 420Q540 250 720 355" stroke="#74d6f5" stroke-width="20" fill="none" stroke-dasharray="20 12"/></g>';
 }
 if(scene==='traffic'||scene==='crosswalk'){
  const carGreen=scene==='traffic'?step>=2:step===3;
  props+=`<g data-car-signal="${carGreen?'green':'red'}"><rect x="810" y="190" width="80" height="195" rx="20" fill="#496479"/><circle cx="850" cy="235" r="24" fill="${carGreen?'#643f49':'#ef7772'}"/><circle cx="850" cy="330" r="24" fill="${carGreen?'#69ce8d':'#315e4c'}"/><path d="M850 385V465" stroke="#496479" stroke-width="15"/><g fill="#fff"><rect x="550" y="490" width="30" height="130"/><rect x="600" y="490" width="30" height="130"/><rect x="650" y="490" width="30" height="130"/></g></g>`;
  if(scene==='crosswalk')props+=`<g data-motion="${step===2?'adult-and-child-cross':'wait-for-green-signal'}" class="${step===2?'play-crossing':'motion-wave'}">${person(step===3?760:560,step===2?480:440)}${person(step===3?810:610,step===2?480:440,.65)}</g>`;else if(step===1)props+=move(person(600,480,.8),120,0,'pedestrian-crosses');
 }
 if(scene==='wash'){
  props+=sign('세차장');if(step===0)props+='<g fill="#b99a7c"><circle cx="290" cy="420" r="12"/><circle cx="330" cy="440" r="10"/></g>';
  if(step===1||step===2)props+='<g data-motion="'+(step===2?'rinse-bubbles-away':'foam-grows')+'" class="scene-bubbles '+(step===2?'repair-rinse':'')+'" fill="#def7ffbb" stroke="#fff" stroke-width="3"><circle cx="250" cy="360" r="35"/><circle cx="335" cy="390" r="30"/><circle cx="290" cy="460" r="25"/></g>';
  if(step===2)props+='<g data-motion="water-sprays-target" class="scene-water"><path d="M600 200Q480 240 325 370" stroke="#7bd4ef" stroke-width="20" fill="none" stroke-dasharray="20 12"/></g>';
 }
 if(scene==='detour'&&step===1)props+=sway('<path d="M650 270H800L770 250M800 270L770 290" fill="none" stroke="#fff2a4" stroke-width="15"/>','notice-detour-arrow');
 if(scene==='detour')props+=sign(step===3?'공원 도착':'우회 →')+(step===3?park:cone(600)+cone(690)+'<rect x="555" y="345" width="180" height="70" rx="10" fill="#f6c46d"/><text x="645" y="390" text-anchor="middle" fill="#6d5c47" font-size="24">공사 중</text>')+(step===2?'<path d="M440 500Q480 590 600 590H900" stroke="#fff2af" stroke-width="15" stroke-dasharray="20 15" fill="none"/>':'');
 if(scene==='mud'){
  props+='<ellipse cx="355" cy="505" rx="140" ry="25" fill="#a6886b"/>';
  if(step===0)props+=spin('<circle cx="360" cy="500" r="25" fill="#394a55" stroke="#d4ad71" stroke-width="8" stroke-dasharray="12 10"/>','wheel-spins-in-mud');
  if(step===1)props+=move('<path d="M225 500L465 470" stroke="#d9b878" stroke-width="16"/>',0,0,'place-board-under-wheel',80,-60);
  if(step===2)props+='<path d="M225 500L465 470" stroke="#d9b878" stroke-width="16"/>'+move(vehicle(actor,100,240,350),260,-25,'climb-out-on-board');
 }
 if(scene==='balloon'){
  props+=tree;const balloon='<ellipse rx="28" ry="36" fill="#ffda71"/><path d="M0 36Q20 70 0 110" stroke="#a79470" stroke-width="3" fill="none"/>';
  const positioned=`<g transform="translate(810 170)">${balloon}</g>`;
  if(step===2)props+=move(positioned,-110,180,'lower-balloon-with-grabber');
  else props+=sway(`<g transform="translate(${step===3?700:810} ${step===3?350:170})">${balloon}</g>`,'balloon-flutters');
  if(step>0)props+=person(660,445);
  if(step===1)props+=move('<path d="M680 400L790 220" stroke="#839db0" stroke-width="7"/>',0,0,'raise-adult-grabber',-100,100);
  if(step===2)props+=move('<path d="M680 400L790 220" stroke="#839db0" stroke-width="7"/>',-70,100,'lower-grabber');
 }
 if(scene==='cleanup'){
  props+=park;const bins='<rect x="580" y="365" width="65" height="80" rx="8" fill="#82b9df"/><rect x="665" y="365" width="65" height="80" rx="8" fill="#eab775"/>';
  if(step>0)props+=step===1?appear(bins,'place-recycling-bins'):bins;
  if(step<3){const paper='<rect x="760" y="440" width="32" height="20" transform="rotate(15 760 440)" fill="#fff1c1"/>';const cup='<path d="M830 420H860L854 452H836Z" fill="#fff1c1"/>';
   props+=step===2?move(paper,-160,-70,'sort-paper-into-bin')+move(cup,-155,-55,'sort-cup-into-bin',0,0,.7)+move('<path d="M780 430L850 360M785 425L810 440" stroke="#7d9bae" stroke-width="8"/>',-155,-55,'pick-up-with-tongs'):paper+cup;
  }else props+=move(person(660,350,.65),65,85,'child-slides-down');
 }
 if(scene==='branches'&&step===1)props+=move(cone(520)+cone(900),0,0,'place-branch-cones',0,-80);
 if(scene==='branches'&&step===3)props+=move(vehicle('tayo',650,240,280),130,0,'cars-pass-cleared-road');
 if(scene==='branches')props+=tree+(step<3?`<g data-motion="${step===2?'move-branch-off-road':'branch-on-road'}" class="${step===2?'play-move-branch':''}"><path d="M600 455L860 400M680 437L670 395M780 415L800 365" stroke="#b38b62" stroke-width="18" stroke-linecap="round"/></g>`:'')+(step===1||step===2?cone(520)+cone(900):'');
 if(step===3)props+=appear(check,'play-complete');
 return `<g data-play-scene="${scene}" data-play-stage="${step}">${props}</g>`;
}
