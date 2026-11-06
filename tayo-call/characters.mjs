export const CHARACTERS={
 tayo:{id:'tayo',apiVoice:'coral',voiceStyle:'밝고 호기심 많은 꼬마버스 느낌. 살짝 높은 음역, 가볍고 통통 튀는 리듬, 웃음기 있는 다정한 목소리.',scene:'passengers',name:'타요',color:'#08b8e8',voice:'M3',role:'파란 꼬마버스. 밝고 호기심이 많다.',mouth:[57,69,20,6],eyes:[[39,60,10,11],[74,58,9,10]]},
 rogi:{id:'rogi',apiVoice:'verse',voiceStyle:'장난스럽고 활기찬 친구 느낌. 경쾌하고 약간 빠르게, 발견할 때 신나는 억양. 과장된 웃음이나 고함 없이 말한다.',scene:'repair',name:'로기',color:'#68b52a',voice:'M2',role:'초록 꼬마버스. 장난스럽고 활기차다.',mouth:[43,67,31,7],eyes:[[26,58,9,10],[59,57,10,10]]},
 lani:{id:'lani',apiVoice:'shimmer',voiceStyle:'상냥하고 발랄한 친구 느낌. 부드럽고 맑은 음색, 밝게 미소 지으며 말하는 억양.',scene:'delivery',name:'라니',color:'#ffcf17',voice:'F3',role:'노란 꼬마버스. 상냥하고 밝다.',mouth:[56,69,14,5],eyes:[[41,62,10,10],[69,60,9,10]]},
 gani:{id:'gani',apiVoice:'sage',voiceStyle:'차분하고 다정한 친구 느낌. 중간 음역, 편안하고 따뜻하게, 문장 끝을 부드럽게 말한다.',scene:'wash',name:'가니',color:'#eb3033',voice:'M1',role:'빨간 꼬마버스. 차분하고 다정하다.',mouth:[38,62,21,5],eyes:[]},
 frank:{id:'frank',apiVoice:'onyx',voiceStyle:'듬직한 소방차 친구 느낌. 낮고 힘찬 음색, 또렷하고 용기 있게, 어린아이에게 무섭지 않게 다정하게 말한다.',scene:'rescue',name:'프랭크',color:'#e60b19',voice:'M1',role:'빨간 소방차. 책임감 있고 용감하지만 아이에게는 든든하고 다정하다. 불을 끄고 도움을 주는 일을 한다. 무서운 실제 사고 대신 안전한 소방 훈련 놀이를 한다.',mouth:[36,72,16,7],eyes:[[26,64,4,6],[47,64,5,6]],siren:true},
 pat:{id:'pat',apiVoice:'ash',voiceStyle:'씩씩한 경찰차 친구 느낌. 또렷하고 자신 있는 중저음, 경쾌하고 친절하게 말한다.',scene:'traffic',name:'패트',color:'#eff7ff',voice:'M2',role:'파란색과 흰색 경찰차. 교통 안전을 알려주는 다정한 친구.',mouth:[55,66,28,4],eyes:[[38,60,7,7],[71,61,7,7]],siren:true}
};
export function getCharacter(id){return CHARACTERS[id]||CHARACTERS.tayo;}
export function requestedCharacter(text){
 const clean=String(text).normalize('NFC').replace(/[\s.!?~,，。？！“”"']/g,'');
 const candidates=[];
 for(const actor of Object.values(CHARACTERS)){
  const aliases=actor.id==='rogi'?['로기','로키','록이']:actor.id==='frank'?['프랭크','프랭쿠','플랭크','프렝크']:actor.id==='pat'?['패트','패드','페트']:[actor.name];
  for(const alias of aliases){let from=0,index;while((index=clean.indexOf(alias,from))!==-1){candidates.push({actor:actor.id,alias,index});from=index+alias.length;}}
 }
 candidates.sort((a,b)=>a.index-b.index);
 for(let n=candidates.length-1;n>=0;n--){
  const candidate=candidates[n];const tail=clean.slice(candidate.index+candidate.alias.length,candidates[n+1]?.index??clean.length);
  if(/말고|싫|안(?:할|해|하|불러|만나|놀)|싶지않|(?:하지|부르지|만나지|놀지)마/.test(tail))continue;
  if(new RegExp('^(?:난|나는|저는)?'+candidate.alias+'(?:야|요|이요)?$').test(clean))return candidate.actor;
  const requestTail=tail.replace(/^(?:이랑|랑|와|과|하고|에게|한테|를|을|으로|로)/,'').replace(/^(?:(?:도|만|좀|이제|다시|한번|빨리|꼭|같이|함께|지금|제발))+/,'');
  if(/^(?:얘기|애기|이야기|대화|통화|말하|말할|놀자|놀고|놀래|놀아|바꿔|바꾸|변경|불러|불러줘|보고싶|만나)/.test(requestTail)||/^(?:가|이)?보고싶/.test(tail))return candidate.actor;
  if(tail===''&&/말고|대신/.test(clean.slice(0,candidate.index)))return candidate.actor;
 }
 return null;
}
export function characterGreeting(id){return {
 tayo:'안녕! 나 타요야! 정류장에 갈 준비를 하고 있었어. 빵빵!',
 rogi:'안녕! 초록 버스 로기야! 재미있는 장난감 공을 찾았어. 데굴데굴!',
 lani:'안녕! 나 라니야! 친구에게 줄 예쁜 선물 그림을 준비하고 있었어!',
 gani:'안녕! 빨간 버스 가니야! 차고지에서 친구들이랑 소풍 준비를 하고 있었어!',
 frank:'안녕! 나 프랭크야! 빨간 소방차지. 소방 출동 준비를 하고 있었어. 삐뽀삐뽀!',
 pat:'안녕! 경찰차 패트야! 마을 순찰 준비를 하고 있었어. 삐뽀삐뽀!'
}[getCharacter(id).id];}
if(typeof window!=='undefined')window.CharacterCatalog={CHARACTERS,getCharacter,requestedCharacter,characterGreeting};
