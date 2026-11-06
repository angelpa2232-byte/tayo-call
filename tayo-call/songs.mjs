// Official channel videos. Songs stream in the YouTube player; no media is copied.
export const SONGS=Object.freeze({
  tayo:{id:'tayo',title:'꼬마버스 타요 주제곡',videoId:'NQRVyY5m3nM',channel:'Tayo the Little Bus'},
  poli:{id:'poli',title:'로보카폴리 주제곡 · 여름 버전',videoId:'3WmTrdytPso',channel:'로보카폴리 TV'}
});
export function requestedSong(text,offered=false){
  const value=String(text||'').replace(/\s/g,'');
  if(/싫|안불|안부를|안들|안듣|안할|지마|않|말고|그만|나중|끄|꺼/.test(value))return null;
  if(/노래|주제곡|주제가|음악/.test(value)&&/틀|듣|들|불|부르|부를|하자|해줘|노래$|주제곡$|주제가$|음악$/.test(value))return /폴리|로이|엠버|헬리/.test(value)?'poli':'tayo';
  return offered&&/^(응|웅|어|네|넹|좋아|그래|하자|불러|틀어줘|들려줘)[!?.~]*$/.test(value)?'tayo':null;
}
export function musicTurn(text,kind,state,offered=false){
  const song=kind==='child'&&requestedSong(text,offered);
  if(song)return {reply:`좋아! ${song==='poli'?'폴리':'우리 타요 친구들'} 노래를 들어 보자. 손뼉도 짝짝!`,story:{...state,musicOffer:false},music:song};
  if(kind==='idle'&&state.mode==='chat'&&state.lead%12===5)return {reply:'이번엔 우리 같이 노래 부를까? 타요 노래를 틀어 줄게! 듣고 싶으면 응 해 줘.',story:{...state,musicOffer:true},musicOffer:true};
  return null;
}
if(typeof window!=='undefined')window.SongCatalog={SONGS};
