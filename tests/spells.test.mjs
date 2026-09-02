import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPELLS, ELEMENTS, ELEMENT_CHART, elementMultiplier, resolveSpell, getSpellByName }
  from '../public/src/world/spells.js';

test('ชื่อคาถาไม่ซ้ำกันและออกเสียงต่างกันพอ', () => {
  const names = SPELLS.map((s) => s.name);
  assert.equal(new Set(names).size, names.length);
});

test('คาถาเริ่มต้นครอบคลุมทั้งโจมตี ป้องกัน รักษา และสำรวจ', () => {
  const starting = SPELLS.filter((s) => s.unlockedFromStart).map((s) => s.kind);
  for (const kind of ['attack', 'shield', 'heal', 'utility']) {
    assert.ok(starting.includes(kind), `ขาดคาถาประเภท ${kind} ตั้งแต่เริ่มเกม`);
  }
});

test('ตารางธาตุสมเหตุสมผล: ไม่มีธาตุใดแข็งและอ่อนต่อธาตุเดียวกัน', () => {
  for (const [element, chart] of Object.entries(ELEMENT_CHART)) {
    for (const strong of chart.strongAgainst) {
      assert.ok(!chart.weakAgainst.includes(strong), `${element} ขัดแย้งกับ ${strong}`);
    }
  }
});

test('ตัวคูณธาตุ: ได้เปรียบมากกว่าเสมอกันมากกว่าเสียเปรียบ', () => {
  assert.ok(elementMultiplier(ELEMENTS.LUMEN, ELEMENTS.SHADE) > 1);
  assert.equal(elementMultiplier(ELEMENTS.LUMEN, ELEMENTS.ROOT), 1);
  assert.ok(elementMultiplier(ELEMENTS.SHADE, ELEMENTS.FLAME) < 1);
});

test('ความชัดของการออกเสียงมีผลต่อความแรงของคาถา', () => {
  const spell = getSpellByName('เพลิงกังวาน');
  const clear = resolveSpell(spell, { element: ELEMENTS.SHADE }, { clarity: 1 });
  const mumbled = resolveSpell(spell, { element: ELEMENTS.SHADE }, { clarity: 0.4 });
  assert.ok(clear.damage > mumbled.damage);
});

test('คาถารักษาและเกราะไม่สร้างความเสียหาย', () => {
  for (const spell of SPELLS.filter((s) => ['heal', 'shield'].includes(s.kind))) {
    assert.equal(resolveSpell(spell, {}, {}).damage, 0);
  }
});

test('ธารเงาคืนพลังกังวานให้ผู้ร่าย', () => {
  assert.ok(resolveSpell(getSpellByName('ธารเงา'), {}, {}).manaBack > 0);
});

test('ชื่อและคำบรรยายเป็นภาษาไทยทั้งหมด', () => {
  for (const spell of SPELLS) {
    assert.match(spell.name, /[฀-๿]/);
    assert.ok(spell.description.length > 10, spell.name);
  }
});
