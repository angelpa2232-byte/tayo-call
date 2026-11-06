import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export async function stopProjectRuntime(){
 await new Promise((resolve,reject)=>{
  const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('stop-local-runtime.ps1',import.meta.url))],{windowsHide:true,stdio:'ignore'});
  const timer=setTimeout(()=>{child.kill();reject(new Error('Runtime cleanup timed out'));},10000);
  child.once('error',()=>{clearTimeout(timer);reject(new Error('Runtime cleanup failed'));});
  child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('Runtime cleanup failed'));});
 });
}
