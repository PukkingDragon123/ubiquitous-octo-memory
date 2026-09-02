/**
 * ระบบเสียงฝีเท้า
 * แยกเสียงตามชนิดพื้น สลับซ้าย-ขวาเพื่อให้รู้สึกถึงจังหวะการเดินจริง
 * และเป็นสัญญาณให้ผู้เล่นรู้ว่า "คำสั่งเดินถูกรับแล้ว"
 */

export class FootstepPlayer {
  /** @param {import('./audio-engine.js').AudioEngine} engine */
  constructor(engine) {
    this.engine = engine;
    this.leftFoot = true;
    this.gap = 340; // มิลลิวินาที
  }

  /** เดินหนึ่งก้าว — เสียงจะเยื้องซ้าย/ขวาสลับกันเล็กน้อย */
  step(floor = 'dirt', opts = {}) {
    const key = `step_${floor}`;
    const angle = this.leftFoot ? -18 : 18;
    this.leftFoot = !this.leftFoot;
    this.engine.play(key, { angle, distance: 0.35, volume: opts.volume ?? 0.9 });
  }

  /** เดินหลายก้าวเป็นจังหวะ คืน Promise เมื่อเดินครบ */
  async walk(floor, steps = 1, onStep) {
    for (let i = 0; i < steps; i++) {
      this.step(floor);
      onStep?.(i);
      if (i < steps - 1) await delay(this.gap);
    }
  }

  /** เสียงฝีเท้าของสิ่งอื่นในฉาก (ศัตรู/NPC) มีทิศทางและระยะของตัวเอง */
  otherStep(key, angle, distance) {
    this.engine.play(key, { angle, distance, volume: 1 });
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
