import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, loose, similarity, matchScore, bestMatch, numberToThai, extractNumber, infixDistance }
  from '../public/src/core/text.js';

test('normalize: ตัดวรรคตอนและแปลงเลขไทย', () => {
  assert.equal(normalize('  เดินหน้า!  '), 'เดินหน้า');
  assert.equal(normalize('เดิน ๓ ก้าว'), 'เดิน 3 ก้าว');
});

test('loose: ตัดวรรณยุกต์และสระบน-ล่าง', () => {
  assert.equal(loose('เพลิงกังวาน'), loose('เพลิงกังวาน'));
  assert.equal(loose('เพลิ่งกั้งวาน'), loose('เพลิงกังวาน'));
});

test('similarity: ทนต่อการถอดเสียงผิดวรรณยุกต์', () => {
  assert.ok(similarity('เพลิงกังวาน', 'เพลิงกังวาล') > 0.85);
  assert.ok(similarity('เพลิงกังวาน', 'สายลมวน') < 0.5);
});

test('infixDistance: ยอมให้มีคำห้อยหน้า-หลัง', () => {
  assert.equal(infixDistance('กังวาน', 'ขอเพลิงกังวานหน่อย'), 0);
});

test('matchScore: คำสั้นไม่ควรชนะเพราะโผล่กลางประโยคยาว', () => {
  assert.ok(matchScore('วิสป์ มหาเงียบคืออะไร', 'เงียบ') < 0.7);
  assert.equal(matchScore('เดินหน้า', 'เดินหน้า'), 1);
});

test('bestMatch: จับคาถาจากประโยคยาวได้', () => {
  const hit = bestMatch('ขอร่ายคาถาเพลิงกังวาลหน่อย', [
    { key: 'flame', phrases: ['เพลิงกังวาน'] },
    { key: 'gale', phrases: ['สายลมวน'] },
  ]);
  assert.equal(hit.key, 'flame');
});

test('numberToThai: อ่านค่าสถานะเป็นคำไทย', () => {
  assert.equal(numberToThai(0), 'ศูนย์');
  assert.equal(numberToThai(21), 'ยี่สิบเอ็ด');
  assert.equal(numberToThai(147), 'หนึ่งร้อยสี่สิบเจ็ด');
});

test('extractNumber: ดึงจำนวนก้าวจากคำสั่ง', () => {
  assert.equal(extractNumber('เดินสามก้าว'), 3);
  assert.equal(extractNumber('เดิน 5 ก้าว'), 5);
  assert.equal(extractNumber('เดินหน้า'), 1);
});
