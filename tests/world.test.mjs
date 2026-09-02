import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, NPCS, ENEMIES, ITEMS, QUESTS, validateWorld, getRoom, DIRECTIONS }
  from '../public/src/world/world-data.js';
import { SOUND_SPECS } from '../public/src/audio/synth-bank.js';
import { PATTERNS } from '../public/src/haptics/haptics.js';
import { SPELLS } from '../public/src/world/spells.js';

test('แผนที่เชื่อมกันถูกต้องและพิกัดสอดคล้องกับทิศ', () => {
  assert.deepEqual(validateWorld(), []);
});

test('ทุกห้องเดินถึงกันได้จากจุดเริ่มต้น', () => {
  const seen = new Set(['village_square']);
  const queue = ['village_square'];
  while (queue.length) {
    const room = getRoom(queue.shift());
    for (const target of Object.values(room.exits ?? {})) {
      if (!seen.has(target)) { seen.add(target); queue.push(target); }
    }
  }
  assert.equal(seen.size, ROOMS.length, `ห้องที่เดินไปไม่ถึง: ${ROOMS.filter((r) => !seen.has(r.id)).map((r) => r.id)}`);
});

test('ทางออกทุกทางมีทางกลับ', () => {
  for (const room of ROOMS) {
    for (const [dir, targetId] of Object.entries(room.exits ?? {})) {
      const back = Object.entries(getRoom(targetId).exits ?? {}).find(([, id]) => id === room.id);
      assert.ok(back, `${targetId} ไม่มีทางกลับไป ${room.id} (มาจากทิศ ${dir})`);
    }
  }
});

test('ทุกห้องมีเสียงบรรยากาศ คำบรรยายภาพ และชนิดพื้นที่รู้จัก', () => {
  for (const room of ROOMS) {
    assert.ok(SOUND_SPECS[room.ambience], `${room.id} ไม่มีเสียงบรรยากาศ`);
    assert.ok(room.caption, `${room.id} ไม่มีคำบรรยายภาพสำหรับผู้พิการทางการได้ยิน`);
    assert.ok(SOUND_SPECS[`step_${room.floor}`], `${room.id} ไม่มีเสียงฝีเท้าของพื้น ${room.floor}`);
  }
});

test('ศัตรูทุกตัวมีเสียง เสียงฝีเท้า และคำบรรยายภาพ', () => {
  for (const enemy of ENEMIES) {
    assert.ok(SOUND_SPECS[enemy.sound], `${enemy.id} ไม่มีเสียงประจำตัว`);
    assert.ok(SOUND_SPECS[enemy.footstep], `${enemy.id} ไม่มีเสียงฝีเท้า`);
    assert.ok(enemy.caption && enemy.tells.length, `${enemy.id} ไม่มีคำบรรยาย/สัญญาณเตือน`);
  }
});

test('คาถาทุกบทมีเสียงและรูปแบบการสั่นของตัวเอง', () => {
  for (const spell of SPELLS) {
    assert.ok(SOUND_SPECS[spell.sound], `${spell.name} ไม่มีเสียง`);
    assert.ok(PATTERNS[spell.haptic], `${spell.name} ไม่มีรูปแบบการสั่น`);
  }
});

test('รูปแบบการสั่นแต่ละแบบต่างกันพอให้แยกออกด้วยการสัมผัส', () => {
  const seen = new Map();
  for (const [name, pattern] of Object.entries(PATTERNS)) {
    const key = pattern.join(',');
    assert.ok(!seen.has(key), `${name} มีจังหวะสั่นซ้ำกับ ${seen.get(key)}`);
    seen.set(key, name);
  }
});

test('NPC ทุกคนมีบุคลิก ความรู้ และหัวข้อสนทนา', () => {
  for (const npc of NPCS) {
    assert.ok(npc.persona.length > 20, `${npc.id} บุคลิกสั้นเกินไป`);
    assert.ok(npc.knowledge.length >= 2, `${npc.id} มีความรู้น้อยเกินไป`);
    assert.ok(Object.keys(npc.topics).length >= 3, `${npc.id} มีหัวข้อสนทนาน้อยเกินไป`);
  }
});

test('ลำดับภารกิจต่อเนื่องและชี้ไปยังห้องที่มีจริง', () => {
  for (const quest of QUESTS) {
    assert.ok(getRoom(quest.room), `${quest.id} ชี้ไปห้องที่ไม่มีอยู่`);
    if (quest.next) assert.ok(QUESTS.some((q) => q.id === quest.next), `${quest.id} ชี้ไปภารกิจที่ไม่มีอยู่`);
  }
  assert.equal(QUESTS.at(-1).next, null);
});

test('ของทุกชิ้นที่วางในโลกมีนิยาม', () => {
  const known = new Set(ITEMS.map((i) => i.id));
  for (const room of ROOMS) for (const id of room.items ?? []) assert.ok(known.has(id), id);
  for (const enemy of ENEMIES) if (enemy.loot) assert.ok(known.has(enemy.loot), enemy.loot);
});

test('ทิศทั้งสี่มีมุมและคำอ่านไทยครบ', () => {
  for (const [key, dir] of Object.entries(DIRECTIONS)) {
    assert.ok(typeof dir.bearing === 'number' && dir.th, key);
  }
});
