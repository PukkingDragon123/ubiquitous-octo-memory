/**
 * ระบบสั่น
 *
 * ทำหน้าที่สองอย่าง:
 * 1) เพิ่มการรับรู้ให้ผู้พิการทางสายตา (ทิศทาง จังหวะเดิน การโดนโจมตี)
 * 2) เป็น "ช่องทางหลัก" แทนเสียงสำหรับผู้พิการทางการได้ยิน
 *
 * รูปแบบเป็นอาร์เรย์มิลลิวินาที [สั่น, หยุด, สั่น, ...] ตามสเปก Vibration API
 * ถ้าอุปกรณ์ไม่รองรับ จะส่งออกเป็นสัญญาณภาพแทน (ดู ui/hud.js)
 */

export const PATTERNS = {
  step: [18],
  bump: [90, 40, 90],
  turn_left: [25, 30, 12],
  turn_right: [12, 30, 25],
  danger: [140, 70, 140],
  approach: [45, 120, 45],
  hit: [70],
  crit: [40, 30, 40, 30, 120],
  hurt: [180],
  hurt_heavy: [260, 80, 180],
  low_hp: [90, 90, 90, 90, 90, 90],
  deny: [30, 60, 30],
  pickup: [25, 25, 25],
  quest: [40, 40, 40, 40, 120],
  bell: [300, 120, 300, 120, 500],
  victory: [120, 80, 120, 80, 400],
  victory_small: [60, 40, 120],
  game_over: [500, 200, 500],
  boss_appear: [400, 120, 200, 120, 400],
  boss_phase: [250, 100, 250],
  warn: [60, 40, 60],
  // รูปแบบประจำคาถา — ผู้เล่นจำได้ว่าคาถาไหนถูกร่ายโดยไม่ต้องฟัง
  burst_heavy: [200, 50, 90],
  sweep: [40, 20, 40, 20, 40, 20, 90],
  pulse_low: [150, 100, 150],
  shimmer: [20, 30, 20, 30, 20, 30, 20],
  rumble: [400],
  warm_wave: [60, 60, 120, 60, 200],
  tap_double: [40, 60, 40],
  hammer_strike: [120, 40, 200],
  ping_ring: [25, 40, 25, 40, 25],
  crescendo: [50, 30, 100, 30, 150, 30, 300],
};

export class Haptics {
  /** @param {(payload:object)=>void} onVisual ตัวรับสัญญาณภาพแทนการสั่น */
  constructor(onVisual = () => {}) {
    this.enabled = true;
    this.intensity = 1.0;
    this.onVisual = onVisual;
    this.supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    this.gamepadIndex = null;
  }

  /** เล่นรูปแบบการสั่นตามชื่อ */
  play(patternName) {
    const pattern = PATTERNS[patternName];
    if (!pattern) return false;
    // ส่งสัญญาณภาพเสมอ เพื่อให้ผู้ที่ไม่ได้ยินและอุปกรณ์ที่สั่นไม่ได้ยังรับรู้ได้
    this.onVisual({ pattern: patternName, steps: pattern, total: pattern.reduce((a, b) => a + b, 0) });
    if (!this.enabled) return false;
    const scaled = pattern.map((ms, i) => (i % 2 === 0 ? Math.round(ms * this.intensity) : ms));
    let done = false;
    if (this.supported) { try { done = navigator.vibrate(scaled); } catch { done = false; } }
    this.rumbleGamepad(scaled);
    return done;
  }

  /** สั่นผ่านจอยเกม ถ้ามีเสียบอยู่ */
  rumbleGamepad(pattern) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      const actuator = pad?.vibrationActuator;
      if (!actuator?.playEffect) continue;
      const duration = Math.min(1000, pattern.reduce((a, b) => a + b, 0));
      actuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: Math.min(1, 0.6 * this.intensity),
        weakMagnitude: Math.min(1, 0.4 * this.intensity),
      }).catch(() => { /* จอยบางรุ่นไม่รองรับ */ });
      break;
    }
  }

  /** สั่นบอกทิศ: ซ้าย = จังหวะสั้น-ยาว, ขวา = ยาว-สั้น, หน้า = สั้นเดียว, หลัง = สามจังหวะ */
  direction(angle) {
    const a = ((angle % 360) + 360) % 360;
    if (a < 45 || a >= 315) return this.play('step');
    if (a < 135) return this.play('turn_right');
    if (a < 225) return this.play('bump');
    return this.play('turn_left');
  }

  setEnabled(on) { this.enabled = on; if (!on && this.supported) navigator.vibrate(0); }
  setIntensity(v) { this.intensity = Math.min(2, Math.max(0, v)); }
  stop() { if (this.supported) navigator.vibrate(0); }
}
