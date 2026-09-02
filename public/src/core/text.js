/**
 * เครื่องมือจัดการข้อความภาษาไทย
 * จุดประสงค์หลัก: ทำให้คำสั่งเสียงที่ถอดมาไม่ตรงเป๊ะ ยังใช้งานได้
 */

/** สระ/วรรณยุกต์ที่ไม่มีความกว้าง — ตัดทิ้งเพื่อเทียบแบบ "ไม่สนวรรณยุกต์" */
const COMBINING = /[ัิ-ฺ็-๎]/g;
const THAI_DIGITS = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };

/** ตัดช่องว่าง เครื่องหมายวรรคตอน และแปลงเลขไทยเป็นอารบิก */
export function normalize(text = '') {
  return String(text)
    .normalize('NFC')
    .replace(/[๐-๙]/g, (d) => THAI_DIGITS[d])
    .toLowerCase()
    .replace(/[.,!?;:"'`~()\[\]{}<>—–\-_/\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** รูปแบบ "หลวม" สำหรับเทียบคำ: ตัดวรรณยุกต์ สระบน-ล่าง และช่องว่างทั้งหมด */
export function loose(text = '') {
  return normalize(text).replace(COMBINING, '').replace(/\s/g, '');
}

/** ระยะแก้ไข (Levenshtein) แบบใช้หน่วยความจำสองแถว */
export function editDistance(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** ความคล้าย 0..1 โดยเทียบในรูปแบบหลวม (ทนต่อการถอดเสียงผิดวรรณยุกต์) */
export function similarity(a, b) {
  const x = loose(a); const y = loose(b);
  if (!x && !y) return 1;
  const dist = editDistance(x, y);
  return 1 - dist / Math.max(x.length, y.length, 1);
}

/**
 * ระยะแก้ไขแบบ "ฝังกลาง": ยอมให้ประโยคมีคำอื่นห้อยหน้า-หลังได้ฟรี
 * ใช้จับคำสั่งที่ผู้เล่นพูดยาว เช่น "ขอร่ายคาถาเพลิงกังวานหน่อย"
 */
export function infixDistance(target = '', haystack = '') {
  if (!target.length) return 0;
  if (!haystack.length) return target.length;
  let prev = new Array(haystack.length + 1).fill(0); // ตัดส่วนหน้าได้ฟรี
  let curr = new Array(haystack.length + 1);
  for (let i = 1; i <= target.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= haystack.length; j++) {
      const cost = target[i - 1] === haystack[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return Math.min(...prev); // ตัดส่วนท้ายได้ฟรี
}

/** คะแนนความเข้ากันของวลีเป้าหมายกับสิ่งที่ผู้เล่นพูด (0..1) */
export function matchScore(spoken, target) {
  const needle = loose(spoken); const hay = loose(target);
  if (!needle || !hay) return 0;
  if (needle === hay) return 1;
  // คำเป้าหมายสั้นมาก ๆ ไม่ควรชนะเพราะบังเอิญไปโผล่กลางประโยคยาว
  const lengthPenalty = hay.length <= 5 && needle.length > hay.length * 2
    ? Math.min(1, (hay.length * 2) / needle.length)
    : 1;
  if (hay.length >= 2 && needle.includes(hay)) return 0.97 * lengthPenalty;
  // ผู้เล่นพูดชื่อแบบย่อ เช่น "มาลี" แทน "ยายมาลี"
  if (needle.length >= 3 && hay.includes(needle)) return 0.75 + 0.25 * (needle.length / hay.length);
  if (needle.length > hay.length && hay.length >= 3) {
    const partial = 1 - infixDistance(hay, needle) / hay.length;
    return Math.min(0.95, Math.max(partial, similarity(needle, hay))) * lengthPenalty;
  }
  return similarity(needle, hay);
}

/**
 * หาตัวเลือกที่ใกล้เคียงที่สุดจากรายการ
 * @param {string} input ข้อความที่ผู้เล่นพูด
 * @param {Array<{key:string, phrases:string[]}>} candidates
 * @param {number} threshold ความคล้ายขั้นต่ำ (0..1)
 */
export function bestMatch(input, candidates, threshold = 0.72) {
  const needle = loose(input);
  if (!needle) return null;
  let best = null;
  for (const cand of candidates) {
    for (const phrase of cand.phrases ?? []) {
      const score = matchScore(needle, phrase);
      if (!best || score > best.score) best = { key: cand.key, phrase, score, item: cand };
    }
  }
  return best && best.score >= threshold ? best : null;
}

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ'];

/** แปลงเลขเป็นคำอ่านไทย (รองรับ 0–999 พอสำหรับค่าสถานะในเกม) */
export function numberToThai(n) {
  n = Math.round(Number(n) || 0);
  if (n < 0) return 'ลบ' + numberToThai(-n);
  if (n <= 10) return THAI_NUMBERS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10); const ones = n % 10;
    const tensWord = tens === 1 ? 'สิบ' : tens === 2 ? 'ยี่สิบ' : THAI_NUMBERS[tens] + 'สิบ';
    const onesWord = ones === 0 ? '' : ones === 1 ? 'เอ็ด' : THAI_NUMBERS[ones];
    return tensWord + onesWord;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100); const rest = n % 100;
    return THAI_NUMBERS[hundreds] + 'ร้อย' + (rest ? numberToThai(rest) : '');
  }
  return String(n);
}

/** ดึงตัวเลขจากประโยคภาษาไทย เช่น "เดินสามก้าว" → 3 */
export function extractNumber(text, fallback = 1) {
  const norm = normalize(text);
  const digits = norm.match(/\d+/);
  if (digits) return Number(digits[0]);
  const words = [
    ['สิบ', 10], ['เก้า', 9], ['แปด', 8], ['เจ็ด', 7], ['หก', 6],
    ['ห้า', 5], ['สี่', 4], ['สาม', 3], ['สอง', 2], ['หนึ่ง', 1],
  ];
  for (const [word, value] of words) if (norm.includes(word)) return value;
  return fallback;
}

/** ตัดคำที่จับได้ออกจากประโยค เพื่อดูส่วนที่เหลือ (เช่น ชื่อ NPC หลังคำว่า "คุยกับ") */
export function stripPhrase(text, phrase) {
  const norm = normalize(text);
  const idx = loose(norm).indexOf(loose(phrase));
  if (idx < 0) return norm;
  return norm.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ').replace(/\s+/g, ' ').trim();
}
