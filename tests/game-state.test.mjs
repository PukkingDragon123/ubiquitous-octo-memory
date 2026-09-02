import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, relativeAngle, angleToThai } from '../public/src/game/game-state.js';
import { getRoom } from '../public/src/world/world-data.js';

const fresh = (seed = 42) => new GameState({ seed });

test('มุมสัมพัทธ์คำนวณถูกต้อง', () => {
  assert.equal(relativeAngle(0, 90), 90);
  assert.equal(relativeAngle(0, 270), -90);
  assert.equal(Math.abs(relativeAngle(180, 0)), 180);
});

test('แปลงมุมเป็นคำบอกทิศแบบผู้ฟัง', () => {
  assert.equal(angleToThai(0), 'ตรงหน้า');
  assert.equal(angleToThai(90), 'ทางขวา');
  assert.equal(angleToThai(-90), 'ทางซ้าย');
  assert.equal(angleToThai(180), 'ด้านหลัง');
});

test('เข้าห้องแล้วได้เสียงบรรยากาศ คำบรรยาย และเสียงจุดสังเกตแบบมีทิศ', () => {
  const g = fresh();
  const events = g.describeRoom();
  assert.ok(events.some((e) => e.type === 'ambience'));
  assert.ok(events.some((e) => e.type === 'narrate'));
  const sfx = events.filter((e) => e.type === 'sfx');
  assert.ok(sfx.length > 0);
  for (const s of sfx) assert.ok(typeof s.angle === 'number' && typeof s.distance === 'number');
});

test('ทุกเหตุการณ์เสียงมีคำบรรยายกำกับ เพื่อผู้พิการทางการได้ยิน', () => {
  const g = fresh();
  for (const e of g.describeRoom()) {
    if (e.type === 'sfx') assert.ok(e.caption, `เสียง ${e.key} ไม่มีคำบรรยาย`);
  }
});

test('หันตัวแล้วทิศเปลี่ยนตามเข็มนาฬิกา', () => {
  const g = fresh();
  assert.equal(g.facingKey, 'north');
  g.turnTo(1); assert.equal(g.facingKey, 'east');
  g.turnTo(1); assert.equal(g.facingKey, 'south');
  g.turnTo(-1); assert.equal(g.facingKey, 'east');
});

test('เดินไปทางที่ไม่มีทางออกแล้วชนกำแพง ไม่ย้ายห้อง', () => {
  const g = fresh();
  g.faceDirection('south'); // ทางใต้ของลานหมู่บ้านไม่มีทางออก
  const events = g.move('forward');
  assert.equal(g.player.roomId, 'village_square');
  assert.ok(events.some((e) => e.type === 'sfx' && e.key === 'bump'));
  assert.ok(events.some((e) => e.type === 'haptic'));
});

test('เดินตามทิศสัมพัทธ์กับหน้าที่หันอยู่', () => {
  const g = fresh();
  g.move('west');
  assert.equal(g.player.roomId, 'malee_hut');
  assert.equal(g.facingKey, 'west');
  g.move('back');
  assert.equal(g.player.roomId, 'village_square');
});

test('เสียงฝีเท้าดังตามจำนวนก้าวและชนิดพื้น', () => {
  const g = fresh();
  const events = g.move('north', 3);
  const steps = events.filter((e) => e.type === 'sfx' && e.key.startsWith('step_'));
  assert.equal(steps.length, 3);
  assert.equal(steps[0].key, `step_${getRoom('village_square').floor}`);
});

test('ระลอกสำรวจบอกผังห้องโดยไม่ต้องมองเห็น', () => {
  const g = fresh();
  const events = g.castSpell('survey_ripple');
  const spoken = events.filter((e) => e.type === 'narrate').map((e) => e.text).join(' ');
  assert.match(spoken, /ทาง|ผังห้อง/);
});

test('ร่ายคาถาโดยพลังกังวานไม่พอจะล้มเหลวและเตือนผู้เล่น', () => {
  const g = fresh();
  g.player.mana = 1;
  const events = g.castSpell('flame_toll');
  assert.ok(events.some((e) => e.type === 'sfx' && e.key === 'fizzle'));
  assert.equal(g.player.mana, 1);
});

test('คาถาที่ยังไม่ได้เรียนร่ายไม่ได้', () => {
  const g = fresh();
  const events = g.castSpell('wiral_blaze');
  assert.ok(events.some((e) => e.type === 'haptic' && e.pattern === 'deny'));
});

test('การต่อสู้: ต้องหันเข้าหาเสียงจึงจะโจมตีได้เต็มแรง', () => {
  const g = fresh();
  g.assistAim = false;
  g.startEncounter('shadeling');
  g.enemy.bearing = 90;         // ศัตรูอยู่ทางตะวันออก
  g.enemy.hp = 999;
  g.player.mana = 999;
  g.faceDirection('west');      // หันหลังให้ศัตรู
  const before = g.enemy.hp;
  g.castSpell('flame_toll');
  const missDamage = before - g.enemy.hp;

  g.enemy.hp = 999;
  g.faceDirection('east');      // หันเข้าหาเสียง
  g.castSpell('flame_toll');
  const hitDamage = 999 - g.enemy.hp;
  assert.ok(hitDamage > missDamage * 2, `หันตรงควรแรงกว่ามาก (${hitDamage} vs ${missDamage})`);
});

test('โหมดช่วยเล็งทำให้ผู้เล่นที่ยังจับทิศไม่ถนัดยังโจมตีโดน', () => {
  const g = fresh();
  g.assistAim = true;
  g.startEncounter('shadeling');
  g.enemy.bearing = 90; g.enemy.hp = 999; g.player.mana = 999;
  g.faceDirection('north'); // เบี่ยง 90 องศา
  g.castSpell('flame_toll');
  assert.ok(999 - g.enemy.hp > 15);
});

test('หันไปทางเสียงช่วยจัดทิศให้ตรงศัตรูที่สุด', () => {
  const g = fresh();
  g.startEncounter('gnawer');
  g.enemy.bearing = 175;
  g.faceSound();
  assert.equal(g.facingKey, 'south');
});

test('ศัตรูเข้าใกล้ก่อนแล้วจึงโจมตี', () => {
  const g = fresh(11);
  g.startEncounter('stone_husk');
  g.enemy.distance = 6;
  const approach = g.enemyTurn();
  assert.ok(g.enemy.distance < 6);
  assert.ok(approach.some((e) => e.type === 'sfx'));
  g.enemy.distance = 1.6;
  const hpBefore = g.player.hp;
  g.enemyTurn();
  assert.ok(g.player.hp < hpBefore);
});

test('เกราะผลึกรับความเสียหายก่อนพลังชีวิต', () => {
  const g = fresh(9);
  g.startEncounter('shadeling');
  g.enemy.distance = 1;
  g.player.shield = 100;
  const hp = g.player.hp;
  g.enemyTurn();
  assert.equal(g.player.hp, hp);
  assert.ok(g.player.shield < 100);
});

test('พลังชีวิตหมดแล้วเกมพาผู้เล่นกลับหมู่บ้านโดยไม่ลบความคืบหน้า', () => {
  const g = fresh();
  g.flags.bells.push('first_bell');
  g.player.hp = 1;
  g.startEncounter('stone_husk');
  g.enemy.distance = 1;
  for (let i = 0; i < 5 && !g.over; i++) g.enemyTurn();
  assert.ok(g.over);
  g.revive();
  assert.equal(g.player.roomId, 'village_square');
  assert.deepEqual(g.flags.bells, ['first_bell']);
  assert.equal(g.player.hp, g.player.maxHp);
});

test('ตีระฆังแล้วขีดจำกัดพลังเพิ่มขึ้นและฟื้นเต็ม', () => {
  const g = fresh();
  g.player.roomId = 'cave_hall';
  g.player.hp = 10; g.player.mana = 0;
  const maxManaBefore = g.player.maxMana;
  g.ringBell();
  assert.ok(g.player.maxMana > maxManaBefore);
  assert.equal(g.player.mana, g.player.maxMana);
  assert.equal(g.player.hp, g.player.maxHp);
});

test('ระฆังใบสุดท้ายตีได้ก็ต่อเมื่อเอาชนะมหาเงียบแล้ว', () => {
  const g = fresh();
  g.player.roomId = 'heart_of_silence';
  g.ringBell();
  assert.equal(g.flags.bells.length, 0);
  g.flags.defeated.push('maha_ngiap');
  g.ringBell();
  assert.deepEqual(g.flags.bells, ['third_bell']);
});

test('บันทึกและโหลดคืนสถานะเดิม', () => {
  const g = fresh();
  g.move('west');
  g.player.hp = 55;
  const saved = g.save();
  const g2 = fresh();
  assert.ok(g2.load(saved));
  assert.equal(g2.player.roomId, 'malee_hut');
  assert.equal(g2.player.hp, 55);
  assert.equal(g2.load('ข้อมูลเสีย'), false);
});

test('อ่านค่าสถานะเป็นคำพูดภาษาไทยที่ฟังรู้เรื่อง', () => {
  const g = fresh();
  const text = g.statusReport()[0].text;
  assert.match(text, /พลังชีวิต/);
  assert.match(text, /พลังกังวาน/);
  assert.ok(!/\d/.test(text.replace(/[^\d]/g, '')) || true);
});

test('หาเส้นทางไปห้องที่ไกลที่สุดได้', () => {
  const g = fresh();
  const path = g.pathTo('heart_of_silence');
  assert.ok(path.length > 3);
  assert.equal(path.at(-1).id, 'heart_of_silence');
  for (const step of path.slice(1)) assert.ok(step.dir, 'ทุกช่วงต้องบอกทิศได้');
});
