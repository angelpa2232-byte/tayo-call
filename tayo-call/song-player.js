(()=>{
  let apiPromise;
  function loadApi(){
    if(window.YT?.Player)return Promise.resolve(window.YT);
    if(apiPromise)return apiPromise;
    apiPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const timeout=setTimeout(()=>{apiPromise=null;script.remove();reject(new Error('노래 연결이 늦어지고 있어요. 인터넷을 확인하고 다시 눌러 주세요.'));},15000);
      window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve(window.YT);};
      script.src='https://www.youtube.com/iframe_api';script.async=true;
      script.onerror=()=>{clearTimeout(timeout);apiPromise=null;script.remove();reject(new Error('노래를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));};
      document.head.append(script);
    });
    return apiPromise;
  }
  window.SongPlayer=class{
    constructor(){
      this.panel=document.getElementById('song-panel');this.host=document.getElementById('song-host');this.message=document.getElementById('song-message');this.token=0;
      document.getElementById('btn-song-close').onclick=()=>this.complete('skip');
      for(const id of ['tayo','poli'])document.getElementById('btn-song-'+id).onclick=()=>this.play(id,this.onEnd);
      document.getElementById('btn-song-play').onclick=()=>this.player?.playVideo();
    }
    stop(){this.token++;this.player?.destroy();this.player=null;this.host.replaceChildren();this.panel.hidden=true;this.onEnd=null;}
    complete(reason){const callback=this.onEnd;this.stop();callback?.(reason);}
    async play(id,onEnd){
      const song=window.SongCatalog?.SONGS[id];if(!song)return;
      this.stop();const token=this.token;this.onEnd=onEnd;this.panel.hidden=false;
      document.getElementById('song-title').textContent=song.title;
      this.message.textContent='노래 준비 중… 재생이 안 되면 영상의 ▶ 버튼을 눌러 주세요.';
      const link=document.getElementById('song-source');link.href='https://www.youtube.com/watch?v='+song.videoId;link.textContent=song.channel+' 공식 영상';
      try{
        const YT=await loadApi();if(token!==this.token)return;
        const mount=document.createElement('div');this.host.append(mount);
        this.player=new YT.Player(mount,{width:'100%',height:'100%',videoId:song.videoId,host:'https://www.youtube-nocookie.com',playerVars:{autoplay:1,playsinline:1,rel:0,origin:window.location.origin},events:{
          onReady:e=>{if(token===this.token)e.target.playVideo();},
          onStateChange:e=>{if(token!==this.token)return;if(e.data===YT.PlayerState.ENDED)this.complete('ended');else if(e.data===YT.PlayerState.PLAYING)this.message.textContent='손뼉 짝짝! 노래가 끝나면 다시 이야기해요.';},
          onAutoplayBlocked:()=>{if(token===this.token)this.message.textContent='▶ 노래 재생을 눌러 주세요.';},
          onError:()=>{if(token===this.token)this.message.textContent='이 영상은 여기서 재생할 수 없어요. 다른 노래를 고르거나 놀이로 돌아가 주세요.';}
        }});
      }catch(error){if(token===this.token)this.message.textContent=error.message;}
    }
  };
})();
