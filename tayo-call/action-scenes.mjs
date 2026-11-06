import {illustratedBuilding} from './scene-backdrops.mjs';
import {repairProps} from './repair-scene.mjs';
import {move,appear} from './scene-motion.mjs';
import {everydayProps} from './everyday-scenes.mjs';
const actor=(id,x=110,y=280,w=400,css='')=>`<g class="${css}"><image href="assets/characters/${id}.png" x="${x}" y="${y}" width="${w}" height="${w}"/></g>`;
const cone=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 0L-20 55H20Z" fill="#f69642"/><path d="M-11 28H11M-15 40H15" stroke="white" stroke-width="8"/><rect x="-27" y="53" width="54" height="9" rx="3" fill="#e77732"/></g>`;
const shop=label=>illustratedBuilding(label,'#efa987',650,155,1.08);
const success=`<g class="scene-success" transform="translate(780 130)"><circle r="46" fill="#d2f4db"/><path d="M-22 0L-7 18 26-23" fill="none" stroke="#3faa70" stroke-width="10" stroke-linecap="round"/></g>`;
export function actionProps(view){const {scene,step}=view;
 if(scene==='rescue'){
  let props=shop(step===0?'소방서':'작은 가게')+actor('frank',100,190,430,step===0?'mission-drive':'');
  if(step<3)props+=`<g class="mission-beacon" transform="translate(262 382)"><circle r="25" fill="#ff4c64" opacity=".55"/></g>`;
  if(step===1||step===2)props+=`<g transform="translate(710 227)"><g class="scene-flame ${step===2?'scene-extinguishing':''}"><path d="M0 145Q-65 75 15 0Q18 65 50 20Q125 100 62 145Z" fill="#ff8745"/><path d="M18 145Q0 102 48 60Q45 95 73 120L61 145" fill="#ffe77b"/></g></g>`;
  if(step===1||step===2)props+=appear(cone(615,410),'place-fire-cone');
  if(step===1)props+=move('<path d="M420 420Q490 460 580 410" stroke="#e9b65b" stroke-width="12" fill="none"/>',0,0,'unroll-fire-hose',-90,20);
  if(step===2)props+=`<path d="M414 420Q460 495 560 450L595 410" stroke="#e9b65b" stroke-width="12" fill="none"/><path d="M587 419L610 393" stroke="#536e81" stroke-width="16"/><g class="scene-water"><path d="M607 400Q655 210 758 302" stroke="#d7f6ff" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M607 400Q655 210 758 302" stroke="#66cffa" stroke-width="18" stroke-dasharray="25 16" fill="none" stroke-linecap="round"/><g fill="#8edcff"><circle cx="769" cy="320" r="17"/><circle cx="806" cy="300" r="12"/></g></g>`;
  if(step===3)props+=success+`<g class="scene-cleanup" data-motion="coil-hose-after-fire"><ellipse cx="715" cy="430" rx="90" ry="15" fill="#99d8ec"/><path class="motion-hose-coil" pathLength="100" d="M505 425Q510 375 550 383Q587 393 568 425Q548 450 530 426Q518 406 545 400Q561 400 555 416" fill="none" stroke="#ee9565" stroke-width="9" stroke-linecap="round"/><text x="770" y="460" text-anchor="middle" fill="#315d61" font-size="24">불꽃도 연기도 사라졌어요</text></g>`;
  return props;
 }
 if(scene==='accident'){
  let props=actor('pat',60,230,340,step===0?'mission-drive':'');
  if(step<2){props+=`<g class="scene-stopped-cars">${actor('rogi',560,305,200)}${actor('gani',720,305,200)}</g>`;}if(step===2)props+=actor('gani',720,305,200);
  if(step===1||step===2)props+=appear(cone(480,430)+cone(555,470)+cone(875,465),'place-accident-cones');
  if(step===2)props+=`<g class="scene-tow" data-motion="tow-stopped-bus">${actor('rogi',560,305,200)}<rect x="380" y="425" width="200" height="48" rx="9" fill="#f9c952"/><rect x="380" y="375" width="70" height="65" rx="12" fill="#f9c952"/><rect x="390" y="386" width="40" height="25" fill="#bdeaff"/><circle cx="414" cy="478" r="20" fill="#45566a"/><circle cx="550" cy="478" r="20" fill="#45566a"/><path d="M545 427V348L675 397" fill="none" stroke="#526b81" stroke-width="10"/></g>`;
  if(step===3)props+=success+`<g class="scene-road-clear">${actor('rogi',570,305,210,'mission-drive')}<text x="760" y="285" text-anchor="middle" fill="#315d61" font-size="27">도로 정리 완료! 다시 출발</text></g>`;
  return props;
 }
 if(scene==='repair')return repairProps(step);
 if(scene==='cat'){
  const ladder='<path d="M510 450L745 195M545 450L780 195M550 410L580 410M600 355L630 355M650 300L680 300M700 245L730 245" stroke="#eeac68" stroke-width="10"/>';
  const cat='<path d="M-25 10L-28-30-8-15 15-30 25 10Z" fill="#ffd0a1"/><circle cx="-9" cy="-2" r="3"/><circle cx="10" cy="-2" r="3"/>';
  let props=actor('frank',100,230,370,step===0?'mission-drive':'')+'<path d="M775 450V200" stroke="#ac7f55" stroke-width="34"/><circle cx="775" cy="170" r="90" fill="#83c38e"/>';
  if(step===0)props+=appear('<g transform="translate(780 200)">'+cat+'</g>','notice-cat-in-tree');
  if(step===1)props+='<g class="cat-ladder-grow" data-motion="raise-rescue-ladder">'+ladder+'</g><g transform="translate(780 200)">'+cat+'</g>';
  if(step===2)props+='<g class="cat-ladder-grow" data-motion="extend-rescue-ladder">'+ladder+'</g>'+move('<g transform="translate(780 200)">'+cat+'</g>',-200,240,'bring-cat-down-ladder');
  if(step===3)props+='<g class="cat-ladder-fold" data-motion="fold-rescue-ladder">'+ladder+'</g>'+appear('<g transform="translate(580 440)">'+cat+'</g>','cat-safe-on-ground')+success;
  return props;
 }
 return everydayProps(view);
}
