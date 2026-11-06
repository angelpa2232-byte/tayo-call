import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestedCharacter,getCharacter} from './characters.mjs';
import {buildMessages} from './conversation.mjs';
test('character request changes identity; mention/question/negation do not',()=>{
 assert.equal(requestedCharacter('프랭크'),'frank');
 assert.equal(requestedCharacter('프랭크랑 얘기하고 싶어'),'frank');
 assert.equal(requestedCharacter('프랭크는 무슨 차야?'),null);
 assert.equal(requestedCharacter('프랭크 말고 타요랑 얘기할래'),'tayo');
 assert.equal(getCharacter('frank').voice,'M1');
 const prompt=buildMessages('프랭크랑 얘기하고 싶어',[],{scene:'rescue',step:0},'child','frank')[0].content;
 assert.ok(prompt.includes('프랭크 역할'));assert.ok(prompt.includes('소방차'));assert.ok(!prompt.includes('너(타요)는 파란'));
});

test('spoken switching accepts child speech and excludes only the rejected character',()=>{
 for(const phrase of ['프랭크랑 얘기하고싶어','프랭크랑 애기하고 싶어','프랭크랑 대화할래','플랭크랑 얘기할래','프렝크로 바꿔줘','타요 말고 프랭크랑 얘기할래','타요 말고 프랭크'])assert.equal(requestedCharacter(phrase),'frank',phrase);
 for(const phrase of ['프랭크랑 얘기 안 할래','프랭크랑 얘기하고 싶지 않아','프랭크는 무슨 차야?'])assert.equal(requestedCharacter(phrase),null,phrase);
 assert.equal(requestedCharacter('라니랑 얘기할래'),'lani');assert.equal(requestedCharacter('패트로 바꿔줘'),'pat');
});

test('Rogi selection accepts spoken variants, polite fillers and object particles',()=>{
 for(const phrase of ['로기랑 얘기하고 싶어','로기랑 좀 얘기하고 싶어','로기하고 이야기할래','로기랑 다시 같이 놀고 싶어','로기를 불러줘','로기한테 말할래','로기로 바꿔줘','로키랑 얘기하고 싶어','록이랑 통화할래','로기','타요 말고 로기'])assert.equal(requestedCharacter(phrase),'rogi',phrase);
 for(const phrase of ['로기는 무슨 색이야?','로기는 어디 있어?','로기가 보고 싶지 않아','로기랑 얘기 안 할래','로기랑 이야기하지 마','로기 말고 타요랑 얘기할래'])assert.notEqual(requestedCharacter(phrase),'rogi',phrase);
 for(const actor of ['타요','로기','라니','가니','프랭크','패트'])assert.ok(requestedCharacter(actor+'를 좀 불러줘'),actor);
});
