import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WispBrain, WISP_KNOWLEDGE, WISP_SYSTEM_PROMPT } from '../public/src/ai/wisp.js';
import { NpcBrain, isFarewell, npcSystemPrompt } from '../public/src/ai/npc-brain.js';
import { AiClient, extractText } from '../public/src/ai/ai-client.js';
import { GameState } from '../public/src/game/game-state.js';
import { getNpc } from '../public/src/world/world-data.js';

const fresh = () => new GameState({ seed: 77 });

test('วิสป์แนะนำตัวและบอกวิธีขอความช่วยเหลือ', () => {
  const wisp = new WispBrain();
  assert.match(wisp.intro(), /วิสป์/);
  assert.match(wisp.intro(), /ช่วยด้วย|ไปทางไหน/);
});

test('วิสป์บอกทางเป็นการเลี้ยวซ้าย-ขวาและจำนวนช่วงทาง', () => {
  const g = fresh();
  const wisp = new WispBrain();
  const route = wisp.routeText(g, 'malee_hut');
  assert.match(route, /เลี้ยวซ้าย|เลี้ยวขวา|เดินหน้า|หันหลัง/);
  assert.match(route, /กระท่อมยายมาลี/);
});

test('วิสป์นำทางไปสถานที่ที่ผู้เล่นเอ่ยชื่อแบบย่อได้', () => {
  const g = fresh();
  const wisp = new WispBrain();
  assert.match(wisp.guideTo(g, 'ถ้ำสะท้อน'), /ทาง|เดิน/);
  assert.match(wisp.guideTo(g, 'สถานที่ที่ไม่มีอยู่จริง'), /ไม่รู้จัก/);
});

test('วิสป์รู้ว่าต้องทำอะไรต่อในแต่ละภารกิจ', () => {
  const g = fresh();
  const wisp = new WispBrain();
  assert.match(wisp.hint(g), /ยายมาลี/);
  g.flags.talkedTo.push('malee');
  g.checkQuestProgress();
  assert.match(wisp.hint(g), /ระฆัง|ถ้ำ/);
});

test('วิสป์เตือนทิศศัตรูเมื่ออยู่ในการต่อสู้', () => {
  const g = fresh();
  g.startEncounter('shadeling');
  g.enemy.bearing = 90;
  g.faceDirection('north');
  assert.match(new WispBrain().hint(g), /ทางขวา/);
});

test('วิสป์ตอบคำถามเรื่องโลกได้โดยไม่ต้องต่ออินเทอร์เน็ต', () => {
  const g = fresh();
  const wisp = new WispBrain();
  assert.match(wisp.localAnswer('มหาเงียบคืออะไร', g), /มหาเงียบ/);
  assert.match(wisp.localAnswer('ระฆังคืออะไร', g), /ระฆัง/);
  assert.match(wisp.localAnswer('เพลิงกังวานคือคาถาอะไร', g), /เพลิงกังวาน/);
  assert.match(wisp.localAnswer('เงาไร้เสียงคืออะไร', g), /เงา/);
});

test('คำถามที่ไม่รู้จักถูกตอบด้วยคำแนะนำภารกิจแทนการเงียบ', () => {
  const g = fresh();
  const answer = new WispBrain().localAnswer('ราคาทองวันนี้เท่าไหร่', g);
  assert.ok(answer.length > 10);
});

test('คำสั่งระบบของวิสป์ห้ามใช้มาร์กดาวน์และต้องเป็นภาษาไทย', () => {
  assert.match(WISP_SYSTEM_PROMPT, /ห้ามใช้ตาราง|มาร์กดาวน์/);
  assert.match(WISP_SYSTEM_PROMPT, /ผู้พิการทางสายตา/);
});

test('ฐานความรู้ของวิสป์ไม่มีรายการว่าง', () => {
  for (const entry of WISP_KNOWLEDGE) {
    assert.ok(entry.phrases.length && entry.answer.length > 20, entry.key);
  }
});

test('NPC ทักทายด้วยประโยคของตัวเองและจำได้ว่าเคยคุยแล้ว', () => {
  const brain = new NpcBrain();
  const first = brain.greet('malee').text;
  assert.match(first, /ยายมาลี/);
  const second = brain.greet('malee').text;
  assert.notEqual(first, second);
});

test('NPC ตอบตามหัวข้อที่ตัวเองรู้', async () => {
  const brain = new NpcBrain();
  const reply = await brain.reply('kangwan', 'ค้างคาวบนหอสู้ยังไง');
  assert.match(reply.text, /ลม|ค้างคาว/);
});

test('อารินสอนคาถาสูงสุดเมื่อผู้เล่นถามถึง', async () => {
  const brain = new NpcBrain();
  const reply = await brain.reply('arin', 'วิรัลประกายคืออะไร');
  assert.ok(reply.effects.includes('teach:wiral_blaze'));
});

test('บอกลาแล้วบทสนทนาจบ', async () => {
  const brain = new NpcBrain();
  assert.ok(isFarewell('ลาก่อน'));
  const reply = await brain.reply('pin', 'ลาก่อน');
  assert.ok(reply.effects.includes('end'));
});

test('คำสั่งระบบของ NPC ห้ามหลุดบทบาทและห้ามอ้างงานผู้อื่น', () => {
  const prompt = npcSystemPrompt(getNpc('arin'));
  assert.match(prompt, /ห้ามหลุดบทบาท/);
  assert.match(prompt, /ห้ามอ้างถึงตัวละครหรือเวทมนตร์จากงานของผู้อื่น/);
});

test('ไม่ตั้งค่า AI ไว้ → ตัวเชื่อมปิดอยู่และคืน null อย่างเงียบ ๆ', async () => {
  const client = new AiClient();
  assert.equal(client.enabled, false);
  assert.equal(await client.complete({ system: 'x', prompt: 'y' }), null);
});

test('อ่านคำตอบได้จากรูปแบบผลลัพธ์หลายแบบ', () => {
  assert.equal(extractText({ content: [{ type: 'text', text: 'สวัสดี' }] }), 'สวัสดี');
  assert.equal(extractText({ choices: [{ message: { content: 'สวัสดี' } }] }), 'สวัสดี');
  assert.equal(extractText(null), null);
});

test('วิสป์ใช้คำตอบจากโมเดลเมื่อเชื่อมต่อได้ และถอยมาใช้สมองในเครื่องเมื่อพัง', async () => {
  const g = fresh();
  const client = new AiClient({ endpoint: 'https://example.invalid/messages' });
  client.complete = async () => 'คำตอบจากโมเดล';
  assert.equal(await new WispBrain(client).answer('อะไรก็ได้', g), 'คำตอบจากโมเดล');

  const broken = new AiClient({ endpoint: 'https://example.invalid/messages' });
  broken.complete = async () => null;
  const fallback = await new WispBrain(broken).answer('มหาเงียบคืออะไร', g);
  assert.match(fallback, /มหาเงียบ/);
});
