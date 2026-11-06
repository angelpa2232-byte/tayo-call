class TayoCharacter {
 constructor(){
  this.wrapper=document.getElementById('tayo-character-wrapper');
  this.wrapper.innerHTML='<div class="character-stage"><img id="actor-picture" draggable="false"><div class="actor-mouth"><span></span></div><div class="actor-eyes"></div><div class="actor-siren"></div><div class="actor-shadow"></div></div>';
  this.stage=this.wrapper.querySelector('.character-stage');this.image=this.wrapper.querySelector('img');this.mouth=this.wrapper.querySelector('.actor-mouth');this.eyes=this.wrapper.querySelector('.actor-eyes');
  this.setCharacter('tayo');this.blinkTimer=setInterval(()=>{this.stage.classList.add('blink');this.blinkEnd=setTimeout(()=>this.stage?.classList.remove('blink'),110);},4300);
 }
 setCharacter(id){
  const actor=window.CharacterCatalog.getCharacter(id);this.actor=actor;this.image.src=`assets/characters/${actor.id}.png`;this.image.alt=actor.name;
  this.stage.style.setProperty('--actor-color',actor.color);this.stage.dataset.actor=actor.id;
  const [x,y,w,h]=actor.mouth;Object.assign(this.mouth.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});
  this.eyes.innerHTML=actor.eyes.map(([x,y,w,h])=>`<span style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></span>`).join('');
  this.stage.classList.toggle('has-siren',!!actor.siren);this.stage.classList.remove('arriving');void this.stage.offsetWidth;this.stage.classList.add('arriving');this.setMouthState('smile');
 }
 setMouthState(state){this.mouth.dataset.shape=state;this.stage.classList.toggle('speaking',state!=='smile');}
 startTalking(){clearInterval(this.talkingInterval);let i=0;this.talkingInterval=setInterval(()=>this.setMouthState(['open','o','open','smile'][i++%4]),150);}
 stopTalking(){clearInterval(this.talkingInterval);this.setMouthState('smile');}
 honkHorn(){this.stage.classList.add('honk');this.honkTimer=setTimeout(()=>this.stage?.classList.remove('honk'),700);}
 react(text){
  this.stage.classList.remove('rolling','thinking','excited');
  if(/출발|출동|가자|달려|나들이/.test(text))this.stage.classList.add('rolling');
  else if(/고장|멈췄|어디|생각/.test(text))this.stage.classList.add('thinking');
  else if(/좋아|빵빵|힘내|반짝/.test(text))this.stage.classList.add('excited');
 }
 destroy(){clearInterval(this.blinkTimer);clearInterval(this.talkingInterval);clearTimeout(this.blinkEnd);clearTimeout(this.honkTimer);}
}
window.TayoCharacter=TayoCharacter;
