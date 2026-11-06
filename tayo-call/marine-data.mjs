export const MARINE_GROUPS={all:'모두 보기',mammals:'고래와 바다 포유류',fish:'물고기 친구',soft:'말랑말랑 친구',shore:'바닥·바닷가 친구'};
const animal=(id,name,group,habitat,aliases,facts,look)=>({id,name,group,habitat,aliases:[name,...aliases],facts,look});
export const MARINE_ANIMALS=[
 animal('dolphin','돌고래','mammals','open',['돌고레'],['돌고래는 바다에 사는 포유류야. 물고기처럼 생겼지만 우리처럼 공기를 마셔!','머리 위의 숨구멍으로 숨을 쉬어. 수면 위로 올라와서 공기를 마시지!','꼬리를 위아래로 움직여 헤엄쳐. 소리를 내고 돌아오는 메아리로 주변을 살펴보기도 해!'],'등의 지느러미와 머리 위 숨구멍을 찾아봐!'),
 animal('whale','고래','mammals','open',['흰수염고래','대왕고래','고레'],['그림 속 고래는 아주 큰 흰수염고래야. 바다에 살지만 물고기가 아니라 포유류야!','물 위로 올라와 숨구멍으로 공기를 마셔. 입으로 바닷물을 마시며 숨을 쉬는 게 아니야!','입 안의 수염판으로 작은 먹이를 걸러 먹어. 작은 크릴을 아주 많이 먹지!'],'몸 아래의 길쭉한 줄무늬를 찾아볼까?'),
 animal('orca','범고래','mammals','open',['범고레'],['범고래는 검정과 하양 무늬가 눈에 띄어! 돌고래 무리 중에서 가장 큰 친구야.','물고기가 아니라 포유류라서 수면으로 올라와 공기를 마셔!','가족과 함께 무리 지어 살기도 해. 등에 솟은 지느러미와 눈 뒤의 하얀 무늬를 찾아봐!'],'눈 뒤의 하얀 무늬는 어디에 있을까?'),
 animal('shark','상어','fish','open',['상어야'],['상어는 바다에 사는 물고기야. 지느러미로 균형을 잡고 꼬리를 움직여 헤엄쳐!','머리 양쪽의 아가미로 물속에서 숨을 쉬어. 몸 옆의 줄처럼 생긴 틈을 찾아봐!','상어의 뼈대는 단단한 뼈 대신 연골로 되어 있어. 우리 코끝처럼 말랑한 종류의 뼈대야!'],'등 위의 뾰족한 지느러미를 찾아봐!'),
 animal('clownfish','흰동가리','fish','reef',['니모','클라운피시','흰동가리물고기'],['흰동가리는 주황 몸에 하얀 줄무늬가 있는 작은 물고기야!','말미잘 곁에서 사는 흰동가리가 있어. 말미잘의 촉수 사이를 집처럼 이용하지!','작은 지느러미와 꼬리를 움직여 헤엄쳐. 산호초에 여러 친구와 함께 살아!'],'주황 몸의 하얀 줄은 몇 개 보일까?'),
 animal('blue-tang','블루탱','fish','reef',['도리','파란물고기','블루탱물고기'],['블루탱은 파란 몸과 노란 꼬리가 눈에 띄는 물고기야!','몸이 옆으로 납작하고 산호초 주변에서 살아. 검정 무늬도 찾아봐!','해조류 같은 먹이를 먹으며 자라. 지느러미를 움직여 산호 사이를 헤엄쳐!'],'파란 몸에서 노란 꼬리를 찾아봐!'),
 animal('seahorse','해마','fish','kelp',['해마야'],['해마는 머리가 작은 말처럼 보이는 물고기야! 몸을 세운 자세로 헤엄쳐.','꼬리를 해초에 감고 매달릴 수 있어. 작게 움직이는 등지느러미로 헤엄쳐!','해마는 아빠의 배 주머니 안에서 아기들이 자라. 작은 아기 해마가 태어나지!'],'돌돌 말린 꼬리를 찾아볼까?'),
 animal('ray','가오리','fish','sand',['가오리야','만타가오리'],['가오리는 몸이 넓고 납작한 물고기야. 날개 같은 가슴지느러미가 있어!','넓은 지느러미를 펄럭이며 헤엄쳐. 바다를 나는 것처럼 보이지!','눈은 몸의 위쪽에, 입은 아래쪽에 있어. 모래 바닥 가까이 다니는 가오리도 있어!'],'몸 뒤의 길쭉한 꼬리를 찾아봐!'),
 animal('puffer','복어','fish','reef',['복어야'],['복어는 둥근 몸과 작은 지느러미가 있는 물고기야!','위험을 느끼면 물을 들이마셔 몸을 더 크게 부풀리기도 해. 공처럼 보이지!','작은 지느러미를 움직여 헤엄쳐. 그림 속 동그란 몸과 작은 입을 찾아봐!'],'몸이 부풀면 어떤 모양이 될까?'),
 animal('octopus','문어','soft','sand',['무너','문어야'],['문어는 말랑한 몸에 팔이 여덟 개 달린 바다 동물이야!','팔 안쪽의 빨판으로 물건을 잡을 수 있어. 팔을 뻗어 바닥을 기어 다니기도 해!','몸의 색과 무늬를 바꾸어 주변에 숨을 수 있어. 바위 틈처럼 작은 곳에 들어가기도 하지!'],'팔 안쪽에 동글동글한 빨판이 보여?'),
 animal('squid','오징어','soft','open',['오징어야','오징어어'],['오징어는 길쭉한 몸과 지느러미가 있는 바다 동물이야!','팔 여덟 개와 더 긴 촉수 두 개가 있어. 긴 촉수는 먹이를 잡을 때 도움을 줘!','몸 안에 모은 물을 뿜어 몸을 움직일 수 있어. 지느러미로 방향도 조절해!'],'다른 팔보다 긴 촉수 두 개를 찾아봐!'),
 animal('jellyfish','해파리','soft','open',['해파리야','해팔이'],['해파리는 우산 같은 몸과 길게 늘어진 촉수가 있는 동물이야!','말랑한 몸을 오므렸다 펴며 물속에서 움직여. 바닷물의 흐름을 타기도 해!','몸에 물이 아주 많아 투명하게 보이는 해파리도 있어. 진짜 해파리는 만지지 않고 눈으로 구경해!'],'우산 같은 몸 아래에 무엇이 달려 있을까?'),
 animal('turtle','바다거북','shore','reef',['바다거북이','바다거부기','바다구북','거북이','거북'],['바다거북은 바다에서 살아가는 파충류야. 등에는 단단한 등딱지가 있어!','넓은 앞지느러미를 저어 헤엄쳐. 물 위로 올라와 공기를 마셔!','엄마 바다거북은 모래 해변에 알을 낳아. 아기 거북은 알에서 깨어나 바다로 가!'],'등딱지의 무늬는 어떤 모양으로 나뉘어 있을까?'),
 animal('penguin','펭귄','shore','coast',['팽귄','펭긴'],['펭귄은 날지는 못하지만 헤엄을 잘 치는 새야! 바다에서 먹이를 찾아.','날개를 지느러미처럼 움직여 물속을 헤엄쳐. 발에도 물갈퀴가 있어!','땅에서는 두 발로 뒤뚱뒤뚱 걸어. 바다와 땅을 오가며 살아가지!'],'짧은 날개와 물갈퀴 발을 찾아봐!'),
 animal('seal','물범','mammals','coast',['물범이','물뻠'],['물범은 바다에서 헤엄치며 살고, 땅에 올라와 쉬는 포유류야!','지느러미 같은 발이 있어. 물속을 헤엄치고 몸을 움직이는 데 써!','눈 옆에 작은 귓구멍이 있지만 밖으로 튀어나온 귓바퀴는 없어. 볼에는 긴 수염이 나 있어!'],'얼굴 옆에 난 수염을 찾아봐!'),
 animal('walrus','바다코끼리','mammals','polar',['바다코끼리야'],['바다코끼리는 긴 어금니와 수염이 눈에 띄는 바다 포유류야!','입 주변의 수염으로 바닥의 먹이를 찾는 데 도움을 받아. 조개 같은 먹이를 먹어!','차가운 바다에서 살고 얼음이나 땅에 올라와 쉬기도 해. 지느러미 같은 발로 헤엄쳐!'],'길게 내려오는 어금니는 몇 개 보일까?'),
 animal('otter','해달','mammals','kelp',['바다수달','해달이'],['해달은 바다에 사는 포유류야. 아주 촘촘한 털이 몸을 따뜻하게 지켜 줘!','등을 물에 대고 둥둥 떠 있을 수 있어. 배 위에 먹이를 올려 먹기도 하지!','바다의 큰 해조류 사이에서 지내기도 해. 해조류에 몸을 감아 떠내려가지 않게 할 때도 있어!'],'배를 위로 향하고 둥둥 떠 있는 모습을 봐!'),
 animal('crab','게','shore','sand',['꽃게','대게','게야','게를'],['게는 단단한 껍데기와 집게발이 있는 바다 동물이야!','집게발로 먹이를 집거나 몸을 지킬 수 있어. 여러 다리로 바닥을 걸어 다녀!','몸이 자라면 예전 껍데기를 벗고 새 껍데기가 단단해져. 이런 일을 탈피라고 해!'],'집게처럼 생긴 앞발을 찾아봐!'),
 animal('starfish','불가사리','shore','sand',['불가살이','별물고기','불가사리야'],['불가사리는 별처럼 생겼지만 물고기는 아닌 바다 동물이야!','팔이 다섯 개인 불가사리가 많아. 그림 속 친구도 다섯 개의 팔이 있네!','몸 아래의 아주 작은 관발로 천천히 움직여. 팔이 떨어져도 다시 자라는 종류가 있어!'],'별 모양의 팔을 하나씩 찾아봐!'),
 animal('shrimp','새우','shore','sand',['새우야','새오'],['새우는 긴 더듬이와 마디가 있는 몸을 가진 동물이야!','여러 다리로 바닥을 걷거나 헤엄칠 수 있어. 긴 더듬이로 주변을 살펴봐!','꼬리 쪽을 재빨리 굽혀 뒤로 움직일 때도 있어. 투명하거나 알록달록한 새우도 있어!'],'머리 앞의 길쭉한 더듬이를 찾아봐!')
];
export const marineById=id=>MARINE_ANIMALS.find(a=>a.id===id);
export const marineIn=(group='all')=>MARINE_ANIMALS.filter(a=>group==='all'||a.group===group);
export const marineNarration=(id,step=0)=>{const a=marineById(id);return a?a.name+'! '+a.facts[Math.max(0,Math.min(2,Math.floor(Number(step)||0)))]:'';};
const normalize=text=>String(text||'').replace(/\s|[.,!?~。？！]/g,'').toLowerCase();
export function requestedMarine(text){
 const normalized=normalize(text);if(!normalized)return null;
 const hits=[];
 for(const animal of MARINE_ANIMALS)for(const alias of animal.aliases){
  const key=normalize(alias);if(animal.id==='crab'&&key.startsWith('게')&&!/^(?:나는|난|나|그럼|이번엔|큰|작은|귀여운)?게(?:야|를|가|도|랑|보여|보고|알려|설명|어떻게|$)/.test(normalized))continue;let at=normalized.indexOf(key);
  while(at>=0){
   const after=normalized.slice(at+key.length);
   if(!(key==='게'&&!/^(?:야|를|가|도|랑|보여|보고|알려|설명|어떻게|$)/.test(after))&&!/^(?:(?:은|는|이|가|도|랑|를|을))?(?:말고|말구|말고는|아니|싫|안봐|안볼)/.test(after))hits.push({id:animal.id,key,at});
   at=normalized.indexOf(key,at+key.length);
  }
 }
 // Prefer the more specific name at an overlapping location (돌고래 vs 고래).
 const specific=hits.filter(h=>!hits.some(o=>o!==h&&o.key.length>h.key.length&&o.at<=h.at&&o.at+o.key.length>=h.at+h.key.length));
 specific.sort((a,b)=>a.at-b.at||b.key.length-a.key.length);
 return specific[0]?.id||null;
}
export const MARINE_REFERENCES=[
 {name:'NOAA · 돌고래와 고래',url:'https://www.fisheries.noaa.gov/dolphins-porpoises'},
 {name:'Monterey Bay Aquarium · 바다 동물',url:'https://www.montereybayaquarium.org/animals'},
 {name:'Smithsonian Ocean · 물범과 바다코끼리',url:'https://ocean.si.edu/ocean-life/marine-mammals/seals-sea-lions-and-walruses'}
];
