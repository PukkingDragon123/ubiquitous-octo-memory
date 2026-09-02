/**
 * เพลงประกอบชั่วคราว (procedural)
 *
 * ใช้แทนเพลงจริงไปก่อน เมื่ออัปโหลดไฟล์เพลงและประกาศไว้ใน manifest.json
 * (คีย์ music_explore / music_combat / music_boss) ระบบจะเล่นไฟล์จริงแทนทันที
 */

const SCALES = {
  explore: [220, 246.94, 293.66, 329.63, 392, 440, 587.33],       // เพนทาโทนิกอบอุ่น
  tense: [196, 233.08, 261.63, 311.13, 349.23, 415.3],            // โทนอึดอัด
  boss: [130.81, 155.56, 174.61, 207.65, 233.08],                 // โทนต่ำ หนัก
};

export class MusicDirector {
  /** @param {import('./audio-engine.js').AudioEngine} engine */
  constructor(engine) {
    this.engine = engine;
    this.mood = null;
    this.timer = null;
    this.nodes = [];
    this.enabled = true;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.stop();
    else if (this.mood) this.play(this.mood);
  }

  /** @param {'explore'|'tense'|'boss'} mood */
  play(mood) {
    if (!this.engine.ready || !this.enabled) { this.mood = mood; return; }
    if (this.mood === mood && this.timer) return;
    this.stop();
    this.mood = mood;

    // ไฟล์เพลงจริง (ถ้าอัปโหลดแล้ว) ชนะเสียงสังเคราะห์เสมอ
    const key = `music_${mood}`;
    if (this.engine.buffers.has(key)) {
      this.engine.startLoopKey('__music', key, { bus: 'music', distance: 1 });
      return;
    }

    const ctx = this.engine.ctx;
    const bus = this.engine.buses.music;
    const scale = SCALES[mood] ?? SCALES.explore;
    const tempo = mood === 'boss' ? 1.1 : mood === 'tense' ? 0.85 : 1.6;

    // เสียงโดรนพื้นหลัง
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = scale[0] / 2;
    droneGain.gain.value = 0.0001;
    droneGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 2);
    drone.connect(droneGain).connect(bus);
    drone.start();
    this.nodes.push(drone, droneGain);

    let step = 0;
    const tick = () => {
      const freq = scale[(step * 3 + Math.floor(Math.random() * 2)) % scale.length];
      this.pluck(ctx, bus, freq, mood === 'boss' ? 2.2 : 1.4);
      if (step % 4 === 0) this.pluck(ctx, bus, freq / 2, 2.6, 0.5);
      step++;
      this.timer = setTimeout(tick, tempo * 1000);
    };
    tick();
  }

  pluck(ctx, dest, freq, dur, volumeScale = 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.05 * volumeScale, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
  }

  stop() {
    clearTimeout(this.timer);
    this.timer = null;
    this.engine.stopLoop('__music');
    for (const node of this.nodes) {
      try { node.stop?.(); } catch { /* หยุดไปแล้ว */ }
      try { node.disconnect(); } catch { /* ปิดไปแล้ว */ }
    }
    this.nodes = [];
  }
}
