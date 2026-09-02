/**
 * คำสั่งด้วยแป้นพิมพ์ — ทางเลือกเทียบเท่าเสียงทุกคำสั่ง
 *
 * จำเป็นสำหรับ: ผู้ที่ไม่สะดวกใช้เสียง ผู้พิการทางการได้ยินที่อยู่ในที่เงียบไม่ได้
 * ผู้ใช้ screen reader ที่คุ้นแป้นพิมพ์ และการทดสอบเกม
 */

export const KEYMAP = {
  ArrowUp: { intent: 'move_forward', label: 'เดินหน้า' },
  KeyW: { intent: 'move_forward', label: 'เดินหน้า' },
  ArrowDown: { intent: 'move_back', label: 'ถอยหลัง' },
  KeyS: { intent: 'move_back', label: 'ถอยหลัง' },
  ArrowLeft: { intent: 'turn_left', label: 'เลี้ยวซ้าย' },
  KeyA: { intent: 'turn_left', label: 'เลี้ยวซ้าย' },
  ArrowRight: { intent: 'turn_right', label: 'เลี้ยวขวา' },
  KeyD: { intent: 'turn_right', label: 'เลี้ยวขวา' },
  KeyX: { intent: 'turn_around', label: 'หันหลัง' },
  KeyE: { intent: 'look', label: 'สำรวจรอบตัว' },
  KeyQ: { intent: 'status', label: 'อ่านค่าสถานะ' },
  KeyF: { intent: 'face_sound', label: 'หันไปทางเสียง' },
  KeyI: { intent: 'inventory', label: 'ดูย่าม' },
  KeyC: { intent: 'spell_list', label: 'รายการคาถา' },
  KeyG: { intent: 'guide_hint', label: 'ถามวิสป์ว่าไปทางไหนต่อ' },
  KeyT: { intent: 'talk', label: 'คุยกับคนที่อยู่ตรงนี้' },
  KeyB: { intent: 'ring_bell', label: 'ตีระฆัง' },
  KeyP: { intent: 'pick_up', label: 'เก็บของ' },
  KeyU: { intent: 'use_item', label: 'ใช้ของชิ้นแรกในย่าม' },
  KeyR: { intent: 'repeat', label: 'ฟังประโยคล่าสุดอีกครั้ง' },
  KeyH: { intent: 'help', label: 'ขอความช่วยเหลือ' },
  KeyZ: { intent: 'flee', label: 'หนีจากการต่อสู้' },
  Escape: { intent: 'quiet', label: 'หยุดเสียงพูด' },
};

/** ปุ่มตัวเลข 1-9 = ร่ายคาถาลำดับที่ n ที่เรียนแล้ว */
export function spellIndexFromKey(code) {
  const match = /^Digit([1-9])$/.exec(code);
  return match ? Number(match[1]) - 1 : -1;
}

export class KeyboardInput {
  /**
   * @param {(cmd:{intent:string, arg:any, steps:number, source:string})=>void} dispatch
   * @param {{onTalkStart:Function, onTalkEnd:Function, spellsOf:Function}} hooks
   */
  constructor(dispatch, hooks = {}) {
    this.dispatch = dispatch;
    this.hooks = hooks;
    this.pushing = false;
    this.attached = false;
  }

  attach(target = window) {
    if (this.attached) return;
    this.attached = true;
    target.addEventListener('keydown', this.onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.pushing) { this.pushing = true; this.hooks.onTalkStart?.(); }
        return;
      }
      const spellIdx = spellIndexFromKey(e.code);
      if (spellIdx >= 0) {
        e.preventDefault();
        const spells = this.hooks.spellsOf?.() ?? [];
        if (spells[spellIdx]) this.dispatch({ intent: 'cast', arg: spells[spellIdx], steps: 1, source: 'keyboard' });
        return;
      }
      const mapped = KEYMAP[e.code];
      if (!mapped) return;
      e.preventDefault();
      this.dispatch({ intent: mapped.intent, arg: null, steps: e.shiftKey ? 3 : 1, source: 'keyboard' });
    });

    target.addEventListener('keyup', this.onKeyUp = (e) => {
      if (e.code === 'Space' && this.pushing) {
        this.pushing = false;
        this.hooks.onTalkEnd?.();
      }
    });
  }

  detach(target = window) {
    if (!this.attached) return;
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
    this.attached = false;
  }
}

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/** ข้อความช่วยเหลือของแป้นพิมพ์ ใช้ทั้งอ่านออกเสียงและแสดงบนจอ */
export function keyboardHelpText() {
  const lines = ['เว้นวรรคค้างไว้เพื่อพูด', 'ปุ่มลูกศรหรือ W A S D เพื่อเดินและหันตัว', 'ตัวเลข 1 ถึง 9 เพื่อร่ายคาถาตามลำดับ'];
  for (const [code, info] of Object.entries(KEYMAP)) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) continue;
    lines.push(`${code.replace('Key', 'ปุ่ม ').replace('Escape', 'ปุ่ม Esc')} = ${info.label}`);
  }
  return lines.join(' ');
}
