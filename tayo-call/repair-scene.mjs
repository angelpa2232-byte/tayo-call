import {move,appear,spin} from './scene-motion.mjs';
const wheel=(large=false)=>`<g>${large?'':'<g transform="scale(.53 1)">'}<circle r="44" fill="#263342" stroke="#172634" stroke-width="5"/><circle r="29" fill="#9fbdcb"/><circle r="12" fill="#546d83"/><g fill="#eaf5f7">${[0,90,180,270].map(a=>`<circle transform="rotate(${a})" cx="20" r="4"/>`).join('')}</g><path d="M-12-33L12-33" stroke="#8fa5b0" stroke-width="3"/>${large?'':'</g>'}</g>`;
const wrench=`<g><path d="M0 0L45-48" stroke="#5e7b91" stroke-width="13" stroke-linecap="round"/><path d="M38-50L34-69 50-60 64-65 58-44Z" fill="#8fa9ba"/><circle r="10" fill="#adc8d4"/></g>`;
const mechanic=`<g transform="translate(575 440)"><circle cy="-55" r="24" fill="#ffd1ab"/><path d="M-27-65Q0-110 27-65Z" fill="#ffd05b"/><path d="M0-28V40M-18 42L-30 88M18 42L30 88" stroke="#518fb7" stroke-width="27" stroke-linecap="round"/><path d="M-10-15L-70 15" stroke="#518fb7" stroke-width="15"/><circle cx="-70" cy="15" r="9" fill="#ffd1ab"/></g>`;
export function repairProps(step){
 const lifted=step===1||step===2;
 let car=`<defs><mask id="repair-wheel-cut"><rect width="1000" height="650" fill="white"/><ellipse cx="474" cy="516" rx="27" ry="48" fill="black"/></mask></defs><image href="assets/characters/rogi.png" x="120" y="160" width="470" height="470" mask="url(#repair-wheel-cut)"/>`;
 const small=step===0?`<g class="repair-wobble">${wheel()}</g>`:step===1?`<g class="repair-remove" data-motion="wheel-detach">${wheel()}</g>`:step===2?`<g class="repair-install" data-motion="wheel-install">${wheel()}</g>`:spin(wheel(),'wheel-roll');
 car+=`<g transform="translate(474 516)"><ellipse rx="16" ry="29" fill="#50687b"/>${small}</g>`;
 if(lifted)car=`<g class="repair-jack" data-motion="jack-lift">${car}</g>`;
 if(step===3)car=move(car,260,0,'repaired-bus-departs');
 let props=car;
 if(lifted){
  props+='<g data-motion="jack-support"><path d="M390 550L425 510 460 550 425 590Z" fill="none" stroke="#e69f58" stroke-width="10"/><path d="M370 590H480" stroke="#657f90" stroke-width="12"/></g>'+mechanic;
  props+='<path d="M495 483L640 350" stroke="#7ba1b6" stroke-width="3" stroke-dasharray="8 7"/><rect x="650" y="260" width="300" height="285" rx="28" fill="#f5fbff" stroke="#9cc1d4" stroke-width="5"/><text x="800" y="300" text-anchor="middle" fill="#426174" font-size="23">'+(step===1?'헌 타이어를 빼요':'새 타이어를 끼워요')+'</text>';
  const large=step===1?`<g class="repair-remove" data-motion="wheel-detach-closeup">${wheel(true)}</g>`:`<g class="repair-install" data-motion="wheel-install-closeup">${wheel(true)}</g>`;
  props+=`<g transform="translate(775 390) scale(1.5)"><circle r="22" fill="#617f92"/><circle r="9" fill="#d5e8ef"/>${large}<g class="${step===1?'repair-loosen':'repair-tighten'}" data-motion="${step===1?'loosen-bolts':'tighten-bolts'}">${wrench}</g></g>`;
 }else if(step===0)props+=appear('<text x="660" y="360" font-size="30" fill="#a65d4d">어? 바퀴가 덜덜!</text>','notice-flat-tire');
 else props+=appear('<text x="720" y="300" font-size="32" fill="#337c66">수리 끝! 빵빵!</text>','repair-finished');
 return `<g data-play-scene="repair" data-play-stage="${step}">${props}</g>`;
}
