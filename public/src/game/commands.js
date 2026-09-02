/**
 * ตัวแปลคำสั่งเสียงภาษาไทย → เจตนา (intent)
 * ออกแบบให้ทนต่อการถอดเสียงผิด และรับได้ทั้งประโยคยาวและคำสั้น
 */

import { bestMatch, loose, normalize, extractNumber, matchScore } from '../core/text.js';
import { SPELLS } from '../world/spells.js';

/** รูปแบบ "จำนวน + ก้าว" ที่ต้องตัดออกก่อนจับคู่คำสั่ง */
const STEP_SUFFIX = /(หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|\d+)\s*ก้าว/g;

/** คำสั่งที่มี "ส่วนขยาย" ต่อท้าย เช่น คุยกับ<ชื่อ> / พาไป<สถานที่> */
export const PREFIX_INTENTS = [
  { key: 'talk', triggers: ['คุยกับ', 'พูดกับ', 'ทักทาย', 'คุยกัน', 'ขอคุยกับ', 'สนทนากับ'] },
  { key: 'guide_to', triggers: ['พาไป', 'พาฉันไป', 'นำทางไป', 'ขอทางไป', 'ไปที่'] },
  { key: 'use_item', triggers: ['ใช้', 'ดื่ม', 'กิน'] },
];

/** คำสั่งทั่วไป */
export const INTENTS = [
  { key: 'move_forward', phrases: ['เดินหน้า', 'เดินไปข้างหน้า', 'ไปข้างหน้า', 'ก้าวไปข้างหน้า', 'เดินตรงไป', 'เดิน'] },
  { key: 'move_back', phrases: ['ถอยหลัง', 'เดินถอยหลัง', 'ถอย', 'ย้อนกลับ'] },
  { key: 'move_left', phrases: ['เดินไปทางซ้าย', 'เดินซ้าย', 'ไปทางซ้าย'] },
  { key: 'move_right', phrases: ['เดินไปทางขวา', 'เดินขวา', 'ไปทางขวา'] },
  { key: 'turn_left', phrases: ['เลี้ยวซ้าย', 'หันซ้าย', 'หันไปทางซ้าย'] },
  { key: 'turn_right', phrases: ['เลี้ยวขวา', 'หันขวา', 'หันไปทางขวา'] },
  { key: 'turn_around', phrases: ['หันหลัง', 'กลับหลังหัน', 'หันกลับ', 'หันหลังกลับ'] },
  { key: 'face_north', phrases: ['หันไปทางเหนือ', 'หันหน้าไปทางเหนือ'] },
  { key: 'face_south', phrases: ['หันไปทางใต้', 'หันหน้าไปทางใต้'] },
  { key: 'face_east', phrases: ['หันไปทางตะวันออก', 'หันหน้าไปทางตะวันออก'] },
  { key: 'face_west', phrases: ['หันไปทางตะวันตก', 'หันหน้าไปทางตะวันตก'] },
  { key: 'face_sound', phrases: ['หันไปทางเสียง', 'หันหาเสียง', 'จับทิศเสียง', 'หันเข้าหาเสียง', 'เสียงมาจากไหน'] },
  { key: 'look', phrases: ['สำรวจ', 'ฟังรอบตัว', 'มีอะไรบ้าง', 'ที่นี่มีอะไร', 'ฟังดู', 'ดูรอบตัว', 'บรรยายอีกครั้ง'] },
  { key: 'status', phrases: ['สถานะ', 'เช็คสถานะ', 'ค่าสถานะ', 'พลังชีวิตเหลือเท่าไหร่', 'เหลือพลังเท่าไหร่', 'ขอดูสถานะ'] },
  { key: 'inventory', phrases: ['ย่าม', 'ดูย่าม', 'มีอะไรในย่าม', 'ของในกระเป๋า', 'สัมภาระ'] },
  { key: 'spell_list', phrases: ['คาถาที่มี', 'รายการคาถา', 'มีคาถาอะไรบ้าง', 'ดูคาถา'] },
  { key: 'pick_up', phrases: ['เก็บของ', 'หยิบของ', 'เก็บขึ้นมา', 'หยิบ'] },
  { key: 'ring_bell', phrases: ['ตีระฆัง', 'ปลุกระฆัง', 'เคาะระฆัง'] },
  { key: 'flee', phrases: ['หนี', 'วิ่งหนี', 'ถอยหนี', 'ขอหนี'] },
  { key: 'where', phrases: ['ฉันอยู่ที่ไหน', 'ที่นี่ที่ไหน', 'อยู่ตรงไหน', 'บอกตำแหน่ง'] },
  { key: 'guide_hint', phrases: ['ไปทางไหนต่อ', 'ทางไหน', 'ต้องทำอะไรต่อ', 'วิสป์ช่วยที', 'ช่วยหน่อย', 'ไปต่อยังไง'] },
  { key: 'help', phrases: ['ช่วยด้วย', 'คำสั่งมีอะไรบ้าง', 'เล่นยังไง', 'วิธีเล่น', 'สอนหน่อย'] },
  { key: 'repeat', phrases: ['พูดอีกครั้ง', 'พูดใหม่', 'ว่าไงนะ', 'ไม่ได้ยิน', 'ทวนอีกที'] },
  { key: 'save', phrases: ['บันทึกเกม', 'เซฟเกม', 'บันทึก'] },
  { key: 'load', phrases: ['โหลดเกม', 'เล่นต่อ', 'โหลดที่บันทึกไว้'] },
  { key: 'restart', phrases: ['เริ่มใหม่', 'เริ่มเกมใหม่', 'ฟื้นคืน'] },
  { key: 'quiet', phrases: ['เงียบ', 'หยุดพูด', 'พอแล้ว'] },
];

/**
 * แปลข้อความเป็นคำสั่ง
 * @param {string} raw ข้อความจากการรู้จำเสียงหรือช่องพิมพ์
 * @param {{knownSpells?: string[]}} ctx
 * @returns {{intent:string, arg:string|null, steps:number, score:number, spellId?:string, raw:string}}
 */
export function parseCommand(raw, ctx = {}) {
  const text = normalize(raw);
  if (!text) return { intent: 'noop', arg: null, steps: 1, score: 0, raw };
  // ตัดส่วน "สามก้าว" ออกก่อนจับคู่ เพื่อให้ "เดินสามก้าว" ยังเจอคำสั่ง "เดิน"
  const matchText = text.replace(STEP_SUFFIX, ' ').replace(/\s+/g, ' ').trim() || text;

  // 1) คาถา — ตรวจก่อนเพราะเป็นชื่อเฉพาะที่ชัดเจน
  const spellCandidates = SPELLS
    .filter((s) => !ctx.knownSpells || ctx.knownSpells.includes(s.id))
    .map((s) => ({ key: s.id, phrases: s.phrases }));
  const spellHit = bestMatch(matchText, spellCandidates, 0.8);

  // 2) คำสั่งทั่วไป
  const intentHit = bestMatch(matchText, INTENTS, 0.74);

  if (spellHit && (!intentHit || spellHit.score >= intentHit.score)) {
    return { intent: 'cast', arg: spellHit.key, spellId: spellHit.key, steps: 1, score: spellHit.score, raw };
  }

  // 3) คำสั่งทั่วไปที่ตรงมาก ชนะคำสั่งแบบมีส่วนขยาย
  if (intentHit && intentHit.score >= 0.9) {
    return {
      intent: intentHit.key, arg: null,
      steps: intentHit.key.startsWith('move_') ? extractNumber(text, 1) : 1,
      score: intentHit.score, raw,
    };
  }

  // 4) คำสั่งที่มีส่วนขยาย เช่น คุยกับ<ชื่อ> / พาไป<สถานที่>
  for (const prefix of PREFIX_INTENTS) {
    for (const trigger of prefix.triggers) {
      if (loose(text).indexOf(loose(trigger)) < 0) continue;
      const arg = remainderAfter(text, trigger);
      if (!arg && prefix.key !== 'talk') continue;
      return { intent: prefix.key, arg: arg || null, steps: 1, score: 0.9, raw };
    }
  }

  // 5) คำถามอิสระ — ถ้ามีคำถามและคำสั่งไม่ชัด ให้วิสป์ตอบ
  if (isQuestion(text) && (!intentHit || intentHit.score < 0.9)) {
    return { intent: 'ask_wisp', arg: text, steps: 1, score: 0.5, raw };
  }

  if (intentHit) {
    return {
      intent: intentHit.key,
      arg: null,
      steps: intentHit.key.startsWith('move_') ? extractNumber(text, 1) : 1,
      score: intentHit.score,
      raw,
    };
  }

  // 6) ไม่เข้าเงื่อนไขใด → ส่งให้ Wisp ตอบเป็นคำถาม
  return { intent: 'ask_wisp', arg: text, steps: 1, score: 0.3, raw };
}

const QUESTION_WORDS = ['อะไร', 'ทำไม', 'ยังไง', 'อย่างไร', 'ที่ไหน', 'ใคร', 'เมื่อไหร่', 'เท่าไหร่', 'ไหม', 'หรือเปล่า', 'คือ'];

/** ประโยคนี้เป็นคำถามหรือไม่ */
export function isQuestion(text) {
  const norm = normalize(text);
  return QUESTION_WORDS.some((w) => norm.includes(w));
}

const LEADING_MARKS = /^[ัิ-ฺ็-๎\s]+/;

/** ตัดข้อความหลังคำนำ เช่น "คุยกับยายมาลี" → "ยายมาลี" */
export function remainderAfter(text, trigger) {
  const lt = loose(trigger);
  if (!lt) return '';
  let acc = ''; let cut = -1;
  for (let i = 0; i < text.length; i++) {
    acc += loose(text[i]);
    if (acc.endsWith(lt)) { cut = i + 1; break; }
  }
  if (cut < 0) return '';
  return text.slice(cut).replace(LEADING_MARKS, '').trim();
}

/** หา NPC/สถานที่จากชื่อที่พูดแบบไม่ต้องตรงเป๊ะ */
export function resolveName(spoken, candidates, threshold = 0.6) {
  if (!spoken) return null;
  let best = null;
  for (const c of candidates) {
    const score = Math.max(...[c.name, ...(c.aliases ?? [])].map((n) => matchScore(spoken, n)));
    if (!best || score > best.score) best = { item: c, score };
  }
  return best && best.score >= threshold ? best.item : null;
}

/** ข้อความช่วยเหลือ — ใช้ทั้งเสียงและคำบรรยายภาพ */
export const HELP_TEXT = [
  'คำสั่งเดิน: เดินหน้า ถอยหลัง เลี้ยวซ้าย เลี้ยวขวา หันหลัง หรือ เดินสามก้าว',
  'คำสั่งฟัง: สำรวจ ฟังรอบตัว หันไปทางเสียง',
  'คำสั่งข้อมูล: สถานะ ย่าม ดูคาถา ฉันอยู่ที่ไหน ไปทางไหนต่อ',
  'ปฏิสัมพันธ์: คุยกับยายมาลี เก็บของ ใช้ขวดน้ำกังวาน ตีระฆัง หนี',
  'ร่ายคาถา: พูดชื่อคาถาออกมาตรง ๆ เช่น เพลิงกังวาน สายลมวน แสงสมาน ผลึกจันทร์ ระลอกสำรวจ',
  'พูดคำถามอิสระกับวิสป์ได้ เช่น "วิสป์ มหาเงียบคืออะไร"',
].join(' ');
