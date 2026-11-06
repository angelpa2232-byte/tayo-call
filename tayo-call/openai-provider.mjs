import {getCharacter} from './characters.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
export const apiModel='gpt-5.4-mini';
export class ConnectionError extends Error {}
export function createSettingsStore(file=new URL('runtime/openai-settings.json',import.meta.url)){
 return {async read(){try{const value=JSON.parse(await readFile(file,'utf8'));return {provider:value.provider==='openai'?'openai':'ollama',key:typeof value.key==='string'?value.key:''};}catch{return {provider:'ollama',key:''};}},async write(value){await mkdir(new URL('.',file),{recursive:true});await writeFile(file,JSON.stringify(value),{mode:0o600});}};
}
export function apiError(status){return new ConnectionError(status===401?'API 키가 올바르지 않아요. 새 키를 확인해주세요.':status===429?'API 잔액 또는 사용 한도를 확인해주세요. 잠시 후 다시 시도할 수도 있어요.':status===403||status===404?'이 계정에서 API 모델을 사용할 수 없어요. 프로젝트의 모델 권한을 확인해주세요.':'OpenAI 연결 오류입니다. 인터넷 연결을 확인하고 다시 시도해주세요.');}
export async function verifyKey(key,upstream){const response=await upstream('https://api.openai.com/v1/models/'+apiModel,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});if(!response.ok)throw apiError(response.status);}
export async function openaiReply(messages,key,signal,upstream,options={}){
 const response=await upstream('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},signal,body:JSON.stringify({model:apiModel,input:messages,reasoning:{effort:'none'},text:{verbosity:'low',...(options.schema?{format:{type:'json_schema',name:'child_play',strict:true,schema:options.schema}}:{})},max_output_tokens:options.schema?1400:240,store:false})});
 if(!response.ok)throw apiError(response.status);const data=await response.json();
 const text=(data.output||[]).filter(item=>item.type==='message').flatMap(item=>item.content||[]).filter(item=>item.type==='output_text').map(item=>item.text).join('');
 if(!text)throw new ConnectionError('AI 답변이 비어 있어요. 다시 말해 주세요.');return text;
}

export const speechModel='gpt-4o-mini-tts';
export async function openaiSpeech(data,key,signal,upstream){
 const actor=getCharacter(data.actor);
 const response=await upstream('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},signal,body:JSON.stringify({model:speechModel,input:data.text.slice(0,400),voice:actor.apiVoice,response_format:'wav',speed:1.22,instructions:'자연스러운 한국어로 3세 아이에게 짧고 다정하게 이야기한다. 입력 문장을 그대로 읽고 단어나 웃음소리를 추가하지 않는다. 실제 성우를 모방하지 않는 새로운 AI 놀이 목소리다. '+actor.voiceStyle+' 아이가 알아듣도록 발음은 또렷하게, 문장 사이 쉼은 짧게 한다. 기본 정서는 아주 신나고 장난기 있는 놀이 친구다. 느릿하게 달래거나 차분한 동화 낭독처럼 읽지 말고 짧게 톡톡 튀는 리듬으로 읽는다. 미소가 들리는 생기 있는 목소리로 말한다. 출동, 발견, 성공에서는 음높이와 강세를 자연스럽게 올리고, 슈우·영차·빵빵 같은 효과음은 리듬감 있게 읽는다. 질문 끝은 호기심 있게 살짝 올리고, 문장마다 같은 높낮이를 반복하거나 무표정한 안내 방송처럼 읽지 않는다. 고함이나 과도한 고음은 피한다.'})});
 if(!response.ok)throw apiError(response.status);
 const audio=Buffer.from(await response.arrayBuffer());if(audio.length<44||audio.toString('ascii',0,4)!=='RIFF'||audio.toString('ascii',8,12)!=='WAVE')throw new ConnectionError('OpenAI 음성 파일이 올바르지 않아요. 다시 시도해주세요.');return audio;
}
