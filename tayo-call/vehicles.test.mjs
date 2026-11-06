import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VEHICLES,vehicleById,vehiclesIn,vehicleNarration} from './vehicles-data.mjs';
import {vehicleSvg} from './vehicles-art.mjs';
import {VehicleLibrary} from './vehicles.mjs';

test('20 distinct vehicles have short explanations and relevant land, air or water settings',()=>{
 assert.equal(VEHICLES.length,20);assert.equal(new Set(VEHICLES.map(v=>v.id)).size,20);
 assert.equal(vehiclesIn('land').length,13);assert.equal(vehiclesIn('air').length,3);assert.equal(vehiclesIn('water').length,4);
 assert.ok(vehiclesIn('land','car').every(v=>!['train','excavator'].includes(v.id)));
 assert.equal(vehiclesIn('land','rail')[0].id,'train');
 for(const v of VEHICLES){
  assert.equal(v.facts.length,3);
  for(let step=0;step<3;step++){
   assert.ok(v.facts[step].length<125,v.id+' short narration');
   assert.ok(vehicleNarration(v.id,step).includes(v.facts[step]));
   const svg=vehicleSvg(v.id,{step,animate:true});
   assert.ok(svg.includes(`data-setting="${v.setting}"`));assert.ok(svg.includes('vehicle-animated'));
   assert.doesNotMatch(svg,/undefined|NaN|\$\{/);
   assert.ok(!svg.includes('url(#veh-'),'Gradient references are unique per vehicle');
  }
 }
 assert.equal(vehicleById('excavator').alias,'포크레인');
 assert.equal(vehicleById('airplane').setting,'airport');assert.equal(vehicleById('submarine').setting,'underwater');
 assert.match(vehicleSvg('dump',{step:1}),/vehicle-dump-bed.*--tip:-24deg/);
 assert.match(vehicleSvg('excavator'),/vehicle-excavator-arm/);assert.match(vehicleSvg('helicopter'),/vehicle-rotor/);
 assert.match(vehicleSvg('mixer'),/vehicle-mixer/);assert.equal(vehicleSvg('unknown'),'');
});

test('picture menu, categories, all three explanations, replay, motion and return need no AI or device permission',()=>{
 const panel={hidden:true},content={innerHTML:''};const spoken=[];let entered=0,left=0;
 const library=new VehicleLibrary({document:{getElementById:id=>id==='vehicle-library-panel'?panel:content},onEnter:()=>entered++,onLeave:()=>left++,onSpeak:text=>spoken.push(text)});
 const click=(action,value)=>panel.onclick({target:{closest:()=>({disabled:false,dataset:{vehicleAction:action,value}})}});
 library.open();assert.equal(entered,1);assert.equal(panel.hidden,false);assert.match(content.innerHTML,/승용차/);
 click('kind','work');assert.ok(!content.innerHTML.includes('data-vehicle="car"'));assert.match(content.innerHTML,/덤프트럭/);
 click('group','air');assert.ok(!content.innerHTML.includes('data-vehicle="dump"'));assert.match(content.innerHTML,/헬리콥터/);
 for(const v of VEHICLES){
  library.open(v.id);
  for(let n=0;n<3;n++){click('fact',String(n));assert.equal(library.step,n);assert.ok(content.innerHTML.includes(v.facts[n]));assert.equal(spoken.at(-1),vehicleNarration(v.id,n));}
  click('repeat');assert.equal(spoken.at(-1),vehicleNarration(v.id,2));
  click('motion');assert.match(content.innerHTML,/vehicle-animated/);assert.equal(library.step,2);
  click('next');assert.ok(vehicleById(library.vehicleId));
  click('previous');assert.equal(library.vehicleId,v.id);
 }
 click('group','water');click('show','submarine');assert.match(content.innerHTML,/underwater/);
 click('menu');assert.match(content.innerHTML,/돛단배/);assert.equal(library.vehicleId,null);
 click('close');assert.equal(left,1);assert.equal(panel.hidden,true);assert.equal(content.innerHTML,'');
 library.close(false);assert.equal(left,1);assert.equal(entered,1);
});
