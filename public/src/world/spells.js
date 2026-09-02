/**
 * ระบบคาถาของโลก "วิรัลยา"
 *
 * แนวคิดออริจินัล: เวทมนตร์ในโลกนี้คือ "ศิลป์กังวาน" — เสียงที่เปล่งออกมา
 * ทำให้อากาศ หิน น้ำ และเงา สั่นพ้องจนเปลี่ยนรูป ผู้ร่ายจึงต้อง "ออกเสียง" จริง
 * ทุกชื่อคาถา สิ่งมีชีวิต และสถานที่ในไฟล์นี้ถูกออกแบบขึ้นใหม่ทั้งหมด
 */

/** ธาตุกังวานทั้งหก */
export const ELEMENTS = {
  FLAME: 'เพลิง',
  GALE: 'วายุ',
  SHADE: 'เงา',
  CRYSTAL: 'ผลึก',
  ROOT: 'พสุธา',
  LUMEN: 'รัศมี',
  TONE: 'สุรเสียง',
};

/**
 * @typedef {Object} Spell
 * @property {string} id
 * @property {string} name ชื่อที่ผู้เล่นต้องเปล่งออกมา
 * @property {string[]} phrases คำพ้องที่ระบบรับได้ (เผื่อการถอดเสียงคลาดเคลื่อน)
 * @property {string} element
 * @property {number} cost พลังกังวานที่ใช้
 * @property {'attack'|'heal'|'shield'|'utility'|'control'} kind
 * @property {number} power
 * @property {string} description คำบรรยายสำหรับ Wisp และคำบรรยายภาพ
 * @property {string} sound คีย์เสียง (มีเสียงสังเคราะห์ชั่วคราวจนกว่าจะอัปโหลดไฟล์จริง)
 * @property {string} haptic รูปแบบการสั่น
 */

/** @type {Spell[]} */
export const SPELLS = [
  {
    id: 'flame_toll',
    name: 'เพลิงกังวาน',
    phrases: ['เพลิงกังวาน', 'เพลิงกังวาล', 'ไฟกังวาน', 'เปลวกังวาน'],
    element: ELEMENTS.FLAME,
    cost: 12, kind: 'attack', power: 22,
    description: 'เปล่งเสียงต่ำจนอากาศเสียดสีติดไฟ เป็นวงแหวนเพลิงพุ่งไปข้างหน้า',
    sound: 'spell_flame', haptic: 'burst_heavy',
    unlockedFromStart: true,
  },
  {
    id: 'gale_spiral',
    name: 'สายลมวน',
    phrases: ['สายลมวน', 'ลมวน', 'สายลมหมุน'],
    element: ELEMENTS.GALE,
    cost: 9, kind: 'attack', power: 16,
    description: 'ลมหมุนแคบ ๆ พัดสิ่งที่ลอยอยู่ให้ร่วงลงพื้น',
    sound: 'spell_gale', haptic: 'sweep',
    unlockedFromStart: true,
  },
  {
    id: 'shade_current',
    name: 'ธารเงา',
    phrases: ['ธารเงา', 'สายเงา', 'ทานเงา'],
    element: ELEMENTS.SHADE,
    cost: 14, kind: 'attack', power: 19,
    description: 'ดึงเงาของศัตรูมาเป็นของตน ทำให้เจ็บและคืนพลังกังวานให้ผู้ร่ายเล็กน้อย',
    sound: 'spell_shade', haptic: 'pulse_low',
  },
  {
    id: 'moon_facet',
    name: 'ผลึกจันทร์',
    phrases: ['ผลึกจันทร์', 'ผลึกจัน', 'พลึกจันทร์'],
    element: ELEMENTS.CRYSTAL,
    cost: 10, kind: 'shield', power: 26,
    description: 'ก่อผลึกใสรอบตัว กันความเสียหายหนึ่งครั้งและสะท้อนเสียงให้ฟังทิศทางได้ชัดขึ้น',
    sound: 'spell_crystal', haptic: 'shimmer',
    unlockedFromStart: true,
  },
  {
    id: 'earth_root',
    name: 'รากพิภพ',
    phrases: ['รากพิภพ', 'รากพิพพ', 'รากแผ่นดิน'],
    element: ELEMENTS.ROOT,
    cost: 11, kind: 'control', power: 8,
    description: 'รากหินงอกจากพื้น ตรึงศัตรูไว้สองจังหวะ ทำให้เสียงฝีเท้ามันหยุดนิ่ง',
    sound: 'spell_root', haptic: 'rumble',
  },
  {
    id: 'mending_light',
    name: 'แสงสมาน',
    phrases: ['แสงสมาน', 'แสงสมาญ', 'แสงสมาน'],
    element: ELEMENTS.LUMEN,
    cost: 13, kind: 'heal', power: 30,
    description: 'เสียงร้องอบอุ่นที่เย็บรอยแผลด้วยแสง',
    sound: 'spell_heal', haptic: 'warm_wave',
    unlockedFromStart: true,
  },
  {
    id: 'toll_hammer',
    name: 'ค้อนกังวาน',
    phrases: ['ค้อนกังวาน', 'ค้อนกังวาล', 'ฆ้อนกังวาน'],
    element: ELEMENTS.TONE,
    cost: 14, kind: 'attack', power: 24,
    description: 'เปล่งเสียงหนักแน่นเหมือนค้อนกระทบระฆัง ทุบสิ่งที่แข็งกระด้างให้ร้าว',
    sound: 'spell_hammer', haptic: 'hammer_strike',
  },
  {
    id: 'hush_bind',
    name: 'เสียงสะกด',
    phrases: ['เสียงสะกด', 'เสียงสกด', 'สะกดเสียง'],
    element: ELEMENTS.TONE,
    cost: 15, kind: 'control', power: 12,
    description: 'สะกดคลื่นเสียงของศัตรูให้เงียบ มันจะร่ายเวทไม่ได้หนึ่งจังหวะ',
    sound: 'spell_hush', haptic: 'tap_double',
  },
  {
    id: 'survey_ripple',
    name: 'ระลอกสำรวจ',
    phrases: ['ระลอกสำรวจ', 'ระลอกสำรวด', 'คลื่นสำรวจ'],
    element: ELEMENTS.TONE,
    cost: 6, kind: 'utility', power: 0,
    description: 'ปล่อยระลอกเสียงออกรอบตัว ทำให้ได้ยินผังห้อง ทางออก และสิ่งของที่ซ่อนอยู่',
    sound: 'spell_survey', haptic: 'ping_ring',
    unlockedFromStart: true,
  },
  {
    id: 'wiral_blaze',
    name: 'วิรัลประกาย',
    phrases: ['วิรัลประกาย', 'วิรันประกาย', 'วิรัลประกายณ์'],
    element: ELEMENTS.LUMEN,
    cost: 32, kind: 'attack', power: 48,
    description: 'คาถาสูงสุดของสายกังวาน รวมเสียงทั้งชีวิตของผู้ร่ายเป็นลำแสงเดียว',
    sound: 'spell_ultimate', haptic: 'crescendo',
  },
];

/** ตารางความได้เปรียบของธาตุ (ตัวคูณความเสียหาย) */
export const ELEMENT_CHART = {
  [ELEMENTS.FLAME]: { strongAgainst: [ELEMENTS.ROOT, ELEMENTS.SHADE], weakAgainst: [ELEMENTS.CRYSTAL] },
  [ELEMENTS.GALE]: { strongAgainst: [ELEMENTS.FLAME, ELEMENTS.TONE], weakAgainst: [ELEMENTS.ROOT] },
  [ELEMENTS.SHADE]: { strongAgainst: [ELEMENTS.LUMEN, ELEMENTS.CRYSTAL], weakAgainst: [ELEMENTS.FLAME] },
  [ELEMENTS.CRYSTAL]: { strongAgainst: [ELEMENTS.GALE, ELEMENTS.FLAME], weakAgainst: [ELEMENTS.SHADE] },
  [ELEMENTS.ROOT]: { strongAgainst: [ELEMENTS.GALE], weakAgainst: [ELEMENTS.FLAME] },
  [ELEMENTS.LUMEN]: { strongAgainst: [ELEMENTS.SHADE], weakAgainst: [ELEMENTS.TONE] },
  [ELEMENTS.TONE]: { strongAgainst: [ELEMENTS.CRYSTAL], weakAgainst: [ELEMENTS.GALE] },
};

export function getSpell(id) {
  return SPELLS.find((s) => s.id === id) ?? null;
}

export function getSpellByName(name) {
  const target = String(name).trim();
  return SPELLS.find((s) => s.name === target) ?? null;
}

/** ตัวคูณความเสียหายเมื่อธาตุคาถาปะทะธาตุของศัตรู */
export function elementMultiplier(spellElement, targetElement) {
  const chart = ELEMENT_CHART[spellElement];
  if (!chart || !targetElement) return 1;
  if (chart.strongAgainst.includes(targetElement)) return 1.6;
  if (chart.weakAgainst.includes(targetElement)) return 0.55;
  return 1;
}

/**
 * คำนวณผลของการร่ายคาถาหนึ่งครั้ง
 * @param {Spell} spell
 * @param {{element?:string, defense?:number}} target
 * @param {{focus?:number, clarity?:number}} caster focus = ความแม่นของการออกเสียง (0..1)
 */
export function resolveSpell(spell, target = {}, caster = {}) {
  const clarity = clamp(caster.clarity ?? 1, 0.35, 1.15);
  const mult = elementMultiplier(spell.element, target.element);
  const defense = target.defense ?? 0;
  const raw = spell.power * mult * clarity;
  const damage = spell.kind === 'attack' ? Math.max(1, Math.round(raw - defense)) : 0;
  return {
    damage,
    multiplier: mult,
    effective: mult > 1 ? 'ได้เปรียบ' : mult < 1 ? 'เสียเปรียบ' : 'เสมอกัน',
    heal: spell.kind === 'heal' ? Math.round(spell.power * clarity) : 0,
    shield: spell.kind === 'shield' ? Math.round(spell.power * clarity) : 0,
    control: spell.kind === 'control' ? Math.max(1, Math.round(spell.power / 6)) : 0,
    manaBack: spell.id === 'shade_current' ? Math.round(spell.power * 0.25) : 0,
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
