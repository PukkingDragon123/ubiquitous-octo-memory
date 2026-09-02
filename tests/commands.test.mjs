import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, remainderAfter, resolveName, isQuestion, INTENTS } from '../public/src/game/commands.js';
import { SPELLS } from '../public/src/world/spells.js';

const cases = [
  ['เดินหน้า', 'move_forward'],
  ['เดินไปข้างหน้า', 'move_forward'],
  ['เดินสามก้าว', 'move_forward'],
  ['ถอยหลังสองก้าว', 'move_back'],
  ['เลี้ยวซ้าย', 'turn_left'],
  ['เลี้ยวขวา', 'turn_right'],
  ['หันหลัง', 'turn_around'],
  ['หันไปทางเสียง', 'face_sound'],
  ['สำรวจ', 'look'],
  ['สถานะ', 'status'],
  ['พลังชีวิตเหลือเท่าไหร่', 'status'],
  ['มีอะไรในย่าม', 'inventory'],
  ['ตีระฆัง', 'ring_bell'],
  ['หนี', 'flee'],
  ['ฉันอยู่ที่ไหน', 'where'],
  ['ไปทางไหนต่อ', 'guide_hint'],
  ['บันทึกเกม', 'save'],
];

for (const [utterance, expected] of cases) {
  test(`คำสั่ง "${utterance}" → ${expected}`, () => {
    assert.equal(parseCommand(utterance).intent, expected);
  });
}

test('จำนวนก้าวถูกอ่านออกมาถูกต้อง', () => {
  assert.equal(parseCommand('เดินสามก้าว').steps, 3);
  assert.equal(parseCommand('ถอยหลังสองก้าว').steps, 2);
});

test('พูดชื่อคาถาแล้วต้องร่ายคาถานั้น', () => {
  for (const spell of SPELLS) {
    const cmd = parseCommand(spell.name, { knownSpells: SPELLS.map((s) => s.id) });
    assert.equal(cmd.intent, 'cast', `${spell.name} ไม่ถูกตีความเป็นคาถา`);
    assert.equal(cmd.spellId, spell.id);
  }
});

test('คาถาที่ยังไม่ได้เรียนไม่ถูกจับคู่', () => {
  const cmd = parseCommand('วิรัลประกาย', { knownSpells: ['flame_toll'] });
  assert.notEqual(cmd.intent, 'cast');
});

test('การถอดเสียงผิดวรรณยุกต์ยังร่ายคาถาได้', () => {
  assert.equal(parseCommand('เพลิงกังวาล').spellId, 'flame_toll');
  assert.equal(parseCommand('ขอร่ายแสงสมานหน่อย').spellId, 'mending_light');
});

test('คำสั่งที่มีส่วนขยายแยกชื่อออกมาได้', () => {
  assert.deepEqual(
    { i: parseCommand('คุยกับยายมาลี').intent, a: parseCommand('คุยกับยายมาลี').arg },
    { i: 'talk', a: 'ยายมาลี' },
  );
  assert.equal(parseCommand('พาไปถ้ำสะท้อน').arg, 'ถ้ำสะท้อน');
  assert.equal(parseCommand('ใช้ขวดน้ำกังวาน').arg, 'ขวดน้ำกังวาน');
});

test('คำถามอิสระถูกส่งให้วิสป์', () => {
  assert.equal(parseCommand('วิสป์ มหาเงียบคืออะไร').intent, 'ask_wisp');
  assert.equal(parseCommand('ทำไมระฆังถึงเงียบ').intent, 'ask_wisp');
  assert.ok(isQuestion('มหาเงียบคืออะไร'));
});

test('remainderAfter ตัดคำนำได้ถูกตำแหน่ง', () => {
  assert.equal(remainderAfter('คุยกับปิ่น', 'คุยกับ'), 'ปิ่น');
  assert.equal(remainderAfter('ใช้ขวดน้ำกังวาน', 'ใช้'), 'ขวดน้ำกังวาน');
});

test('resolveName จับชื่อแบบไม่ต้องตรงเป๊ะ', () => {
  const npcs = [{ id: 'malee', name: 'ยายมาลี' }, { id: 'pin', name: 'ปิ่น' }];
  assert.equal(resolveName('มาลี', npcs).id, 'malee');
});

test('ทุกเจตนามีวลีอย่างน้อยหนึ่งวลี', () => {
  for (const intent of INTENTS) assert.ok(intent.phrases.length > 0, intent.key);
});
