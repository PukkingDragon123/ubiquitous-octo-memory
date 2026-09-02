/**
 * คลังเสียงสังเคราะห์ (placeholder)
 *
 * ทุกเสียงในเกมสร้างสดจาก Web Audio API จึงเล่นได้ทันทีโดยไม่ต้องมีไฟล์เสียง
 * เมื่ออัปโหลดไฟล์จริงลง public/audio/ และประกาศไว้ใน manifest.json
 * ตัวโหลดจะใช้ไฟล์จริงแทนคีย์นั้นโดยอัตโนมัติ (ดู audio-engine.js)
 */

/** สเปกเสียงแบบครั้งเดียว */
export const SOUND_SPECS = {
  // ── ฝีเท้าตามชนิดพื้น ──────────────────────────────────────────────
  step_dirt: { kind: 'noise', filter: 'lowpass', freq: 900, q: 1, dur: 0.14, gain: 0.5 },
  step_wood: { kind: 'noise', filter: 'bandpass', freq: 520, q: 2.5, dur: 0.18, gain: 0.55, tail: { kind: 'tone', type: 'sine', freq: 180, dur: 0.12, gain: 0.18 } },
  step_stone: { kind: 'noise', filter: 'highpass', freq: 1400, q: 0.8, dur: 0.1, gain: 0.45 },
  step_leaves: { kind: 'noise', filter: 'highpass', freq: 2600, q: 0.7, dur: 0.26, gain: 0.4 },
  step_moss: { kind: 'noise', filter: 'lowpass', freq: 420, q: 1, dur: 0.2, gain: 0.3 },
  step_gravel: { kind: 'noise', filter: 'bandpass', freq: 1800, q: 1.2, dur: 0.22, gain: 0.5 },
  step_ash: { kind: 'noise', filter: 'lowpass', freq: 700, q: 0.9, dur: 0.3, gain: 0.28 },
  step_soft: { kind: 'noise', filter: 'lowpass', freq: 380, q: 1, dur: 0.24, gain: 0.22 },
  step_heavy: { kind: 'noise', filter: 'lowpass', freq: 260, q: 1.4, dur: 0.3, gain: 0.7 },
  step_grind: { kind: 'noise', filter: 'bandpass', freq: 340, q: 3, dur: 0.5, gain: 0.6 },
  step_flap: { kind: 'noise', filter: 'bandpass', freq: 900, q: 1.5, dur: 0.16, gain: 0.4 },
  step_void: { kind: 'tone', type: 'sine', freq: 70, freqEnd: 46, dur: 0.5, gain: 0.4 },

  // ── คาถา ──────────────────────────────────────────────────────────
  spell_flame: { kind: 'layer', layers: [
    { kind: 'noise', filter: 'bandpass', freq: 700, q: 0.8, dur: 0.9, gain: 0.6, sweepTo: 200 },
    { kind: 'tone', type: 'sawtooth', freq: 160, freqEnd: 55, dur: 0.8, gain: 0.35 },
  ] },
  spell_gale: { kind: 'noise', filter: 'bandpass', freq: 1200, q: 3, dur: 1.0, gain: 0.55, sweepTo: 3600 },
  spell_shade: { kind: 'layer', layers: [
    { kind: 'tone', type: 'triangle', freq: 240, freqEnd: 90, dur: 1.0, gain: 0.35 },
    { kind: 'tone', type: 'sine', freq: 243, freqEnd: 92, dur: 1.0, gain: 0.3 },
  ] },
  spell_crystal: { kind: 'bell', partials: [880, 1320, 2200, 3080], dur: 1.6, gain: 0.4 },
  spell_root: { kind: 'layer', layers: [
    { kind: 'tone', type: 'sine', freq: 60, freqEnd: 42, dur: 1.1, gain: 0.6 },
    { kind: 'noise', filter: 'lowpass', freq: 220, q: 1, dur: 0.9, gain: 0.5 },
  ] },
  spell_heal: { kind: 'chord', freqs: [523.25, 659.25, 783.99], type: 'sine', dur: 1.4, gain: 0.3 },
  spell_hammer: { kind: 'layer', layers: [
    { kind: 'bell', partials: [147, 294, 440], dur: 1.3, gain: 0.4 },
    { kind: 'noise', filter: 'lowpass', freq: 320, q: 1.4, dur: 0.3, gain: 0.5 },
  ] },
  spell_hush: { kind: 'tone', type: 'sine', freq: 1400, freqEnd: 120, dur: 0.8, gain: 0.32 },
  spell_survey: { kind: 'ping', freq: 1500, dur: 1.5, gain: 0.35, echoes: 3 },
  spell_ultimate: { kind: 'chord', freqs: [261.6, 392, 523.25, 784, 1046.5], type: 'triangle', dur: 2.4, gain: 0.4, swell: true },

  // ── ระฆังและภารกิจ ─────────────────────────────────────────────────
  bell_awaken: { kind: 'bell', partials: [220, 523, 880, 1174, 1760], dur: 4.5, gain: 0.5 },
  quest: { kind: 'chord', freqs: [587.33, 880], type: 'sine', dur: 0.7, gain: 0.28 },
  learn: { kind: 'bell', partials: [660, 990, 1320], dur: 1.6, gain: 0.3 },

  // ── ปฏิสัมพันธ์ ────────────────────────────────────────────────────
  turn: { kind: 'noise', filter: 'bandpass', freq: 700, q: 1.5, dur: 0.22, gain: 0.22, sweepTo: 1500 },
  focus: { kind: 'ping', freq: 900, dur: 0.5, gain: 0.25, echoes: 1 },
  bump: { kind: 'layer', layers: [
    { kind: 'tone', type: 'sine', freq: 110, freqEnd: 55, dur: 0.25, gain: 0.5 },
    { kind: 'noise', filter: 'lowpass', freq: 500, q: 1, dur: 0.15, gain: 0.4 },
  ] },
  pickup: { kind: 'bell', partials: [1046, 1568], dur: 0.6, gain: 0.28 },
  drink: { kind: 'noise', filter: 'bandpass', freq: 480, q: 4, dur: 0.6, gain: 0.3 },
  fizzle: { kind: 'noise', filter: 'highpass', freq: 2000, q: 1, dur: 0.4, gain: 0.25, sweepTo: 400 },
  hit: { kind: 'layer', layers: [
    { kind: 'noise', filter: 'bandpass', freq: 1400, q: 1, dur: 0.2, gain: 0.5 },
    { kind: 'tone', type: 'square', freq: 180, freqEnd: 70, dur: 0.22, gain: 0.3 },
  ] },
  miss: { kind: 'noise', filter: 'bandpass', freq: 2400, q: 2, dur: 0.3, gain: 0.3, sweepTo: 900 },
  shield_break: { kind: 'bell', partials: [1600, 2400, 3200], dur: 0.9, gain: 0.35 },
  enemy_attack: { kind: 'layer', layers: [
    { kind: 'tone', type: 'sawtooth', freq: 140, freqEnd: 60, dur: 0.35, gain: 0.4 },
    { kind: 'noise', filter: 'bandpass', freq: 800, q: 1, dur: 0.25, gain: 0.45 },
  ] },
  enemy_down: { kind: 'tone', type: 'sine', freq: 320, freqEnd: 40, dur: 1.2, gain: 0.4 },
  struggle: { kind: 'noise', filter: 'bandpass', freq: 300, q: 3, dur: 0.7, gain: 0.35 },
  flee: { kind: 'noise', filter: 'highpass', freq: 1200, q: 0.8, dur: 0.8, gain: 0.35, sweepTo: 3000 },

  // ── เสียงศัตรู ─────────────────────────────────────────────────────
  enemy_shadeling: { kind: 'tone', type: 'sine', freq: 190, freqEnd: 150, dur: 1.1, gain: 0.3, vibrato: 6 },
  enemy_gnawer: { kind: 'layer', layers: [
    { kind: 'tone', type: 'sawtooth', freq: 90, freqEnd: 70, dur: 1.0, gain: 0.35 },
    { kind: 'noise', filter: 'bandpass', freq: 400, q: 2, dur: 0.8, gain: 0.3 },
  ] },
  enemy_bat: { kind: 'ping', freq: 2600, dur: 0.6, gain: 0.25, echoes: 4 },
  enemy_husk: { kind: 'layer', layers: [
    { kind: 'tone', type: 'square', freq: 62, freqEnd: 48, dur: 1.4, gain: 0.4 },
    { kind: 'noise', filter: 'lowpass', freq: 300, q: 2, dur: 1.2, gain: 0.35 },
  ] },
  enemy_boss: { kind: 'layer', layers: [
    { kind: 'tone', type: 'sine', freq: 44, dur: 2.4, gain: 0.5 },
    { kind: 'tone', type: 'sine', freq: 66.5, dur: 2.4, gain: 0.3 },
    { kind: 'noise', filter: 'lowpass', freq: 180, q: 1, dur: 2.2, gain: 0.3 },
  ] },

  // ── จุดสังเกตในห้อง (เล่นวนเบา ๆ) ─────────────────────────────────
  landmark_bell_hum: { kind: 'loopTone', freqs: [110, 165], gain: 0.12, wobble: 0.15 },
  landmark_bell_dead: { kind: 'loopTone', freqs: [82], gain: 0.08, wobble: 0.05 },
  landmark_water: { kind: 'loopDrip', interval: 1.6, jitter: 0.7, freq: 900, gain: 0.22 },
  landmark_spring: { kind: 'loopNoise', filter: 'bandpass', freq: 1600, q: 1.2, gain: 0.16 },
  landmark_boil: { kind: 'loopNoise', filter: 'lowpass', freq: 700, q: 1, gain: 0.14 },
  landmark_anvil: { kind: 'loopDrip', interval: 1.2, jitter: 0.15, freq: 1800, gain: 0.3, bell: true },
  landmark_fire: { kind: 'loopNoise', filter: 'lowpass', freq: 500, q: 0.8, gain: 0.2 },
  landmark_chime: { kind: 'loopDrip', interval: 3.4, jitter: 1.5, freq: 2100, gain: 0.18, bell: true },
  landmark_shrine: { kind: 'loopTone', freqs: [196, 294], gain: 0.07, wobble: 0.3 },
  landmark_stone_hum: { kind: 'loopTone', freqs: [98], gain: 0.1, wobble: 0.2 },
  landmark_echo: { kind: 'loopDrip', interval: 4.0, jitter: 1.0, freq: 700, gain: 0.16 },
  landmark_wind_hole: { kind: 'loopNoise', filter: 'bandpass', freq: 480, q: 6, gain: 0.2 },
  landmark_void: { kind: 'loopTone', freqs: [38], gain: 0.14, wobble: 0.02 },

  // ── บรรยากาศห้อง ──────────────────────────────────────────────────
  amb_village: { kind: 'loopNoise', filter: 'lowpass', freq: 1100, q: 0.6, gain: 0.1, birds: true },
  amb_hut: { kind: 'loopNoise', filter: 'lowpass', freq: 600, q: 0.7, gain: 0.08 },
  amb_forge: { kind: 'loopNoise', filter: 'lowpass', freq: 800, q: 0.8, gain: 0.12 },
  amb_gate: { kind: 'loopNoise', filter: 'bandpass', freq: 900, q: 0.5, gain: 0.09 },
  amb_forest: { kind: 'loopNoise', filter: 'highpass', freq: 2200, q: 0.5, gain: 0.11 },
  amb_forest_deep: { kind: 'loopNoise', filter: 'highpass', freq: 1800, q: 0.6, gain: 0.13 },
  amb_water: { kind: 'loopNoise', filter: 'bandpass', freq: 1400, q: 0.9, gain: 0.12 },
  amb_cave: { kind: 'loopNoise', filter: 'lowpass', freq: 420, q: 0.7, gain: 0.12 },
  amb_cave_hall: { kind: 'loopTone', freqs: [55, 82.5], gain: 0.1, wobble: 0.1 },
  amb_ruin: { kind: 'loopNoise', filter: 'bandpass', freq: 600, q: 3, gain: 0.13 },
  amb_high_wind: { kind: 'loopNoise', filter: 'bandpass', freq: 1100, q: 1.2, gain: 0.2 },
  amb_void: { kind: 'loopTone', freqs: [41], gain: 0.09, wobble: 0.03 },
  amb_boss: { kind: 'loopTone', freqs: [36.7, 55], gain: 0.13, wobble: 0.06 },
};

/** สร้างบัฟเฟอร์ noise ใช้ซ้ำได้ */
export function createNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** เล่นเสียงครั้งเดียวตามสเปก คืนค่าระยะเวลาโดยประมาณ (วินาที) */
export function playSpec(ctx, spec, destination, opts = {}) {
  if (!spec) return 0;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const vol = opts.volume ?? 1;
  switch (spec.kind) {
    case 'layer':
      return Math.max(...spec.layers.map((l) => playSpec(ctx, l, destination, opts)));
    case 'noise': return playNoise(ctx, spec, destination, t0, vol, opts);
    case 'tone': return playTone(ctx, spec, destination, t0, vol, opts);
    case 'bell': return playBell(ctx, spec, destination, t0, vol);
    case 'chord': return playChord(ctx, spec, destination, t0, vol);
    case 'ping': return playPing(ctx, spec, destination, t0, vol);
    default:
      // สเปกแบบวนลูปถูกเรียกผ่าน startLoop แทน
      return 0;
  }
}

function envelope(ctx, gainNode, t0, dur, peak, attack = 0.005) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function playNoise(ctx, spec, dest, t0, vol, opts = {}) {
  const src = ctx.createBufferSource();
  src.buffer = opts.noiseBuffer ?? createNoiseBuffer(ctx, Math.max(0.5, spec.dur));
  const filter = ctx.createBiquadFilter();
  filter.type = spec.filter ?? 'lowpass';
  filter.frequency.setValueAtTime(spec.freq, t0);
  if (spec.sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, spec.sweepTo), t0 + spec.dur);
  filter.Q.value = spec.q ?? 1;
  const gain = ctx.createGain();
  envelope(ctx, gain, t0, spec.dur, (spec.gain ?? 0.4) * vol, spec.attack ?? 0.005);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t0);
  src.stop(t0 + spec.dur + 0.05);
  return spec.dur;
}

function playTone(ctx, spec, dest, t0, vol) {
  const osc = ctx.createOscillator();
  osc.type = spec.type ?? 'sine';
  osc.frequency.setValueAtTime(spec.freq, t0);
  if (spec.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.freqEnd), t0 + spec.dur);
  const gain = ctx.createGain();
  envelope(ctx, gain, t0, spec.dur, (spec.gain ?? 0.3) * vol, spec.attack ?? 0.01);
  osc.connect(gain).connect(dest);
  if (spec.vibrato) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = spec.vibrato;
    lfoGain.gain.value = spec.freq * 0.04;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(t0); lfo.stop(t0 + spec.dur);
  }
  osc.start(t0);
  osc.stop(t0 + spec.dur + 0.05);
  return spec.dur;
}

function playBell(ctx, spec, dest, t0, vol) {
  spec.partials.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const dur = spec.dur * (1 - i * 0.13);
    envelope(ctx, gain, t0, Math.max(0.2, dur), (spec.gain ?? 0.3) * vol / (i + 1.2), 0.004);
    osc.connect(gain).connect(dest);
    osc.start(t0);
    osc.stop(t0 + spec.dur + 0.1);
  });
  return spec.dur;
}

function playChord(ctx, spec, dest, t0, vol) {
  spec.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = spec.type ?? 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const attack = spec.swell ? 0.35 + i * 0.08 : 0.02;
    envelope(ctx, gain, t0 + i * 0.05, spec.dur, (spec.gain ?? 0.25) * vol / (i * 0.4 + 1), attack);
    osc.connect(gain).connect(dest);
    osc.start(t0);
    osc.stop(t0 + spec.dur + 0.2);
  });
  return spec.dur;
}

function playPing(ctx, spec, dest, t0, vol) {
  const echoes = spec.echoes ?? 2;
  for (let i = 0; i <= echoes; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = spec.freq * (1 - i * 0.06);
    const gain = ctx.createGain();
    envelope(ctx, gain, t0 + i * 0.16, 0.35, (spec.gain ?? 0.3) * vol * Math.pow(0.55, i), 0.004);
    osc.connect(gain).connect(dest);
    osc.start(t0 + i * 0.16);
    osc.stop(t0 + i * 0.16 + 0.4);
  }
  return spec.dur ?? 1;
}

/**
 * เริ่มเสียงวนลูป (บรรยากาศ/จุดสังเกต) — คืน handle สำหรับหยุด
 */
export function startLoop(ctx, spec, dest, opts = {}) {
  if (!spec) return { stop() {} };
  const vol = opts.volume ?? 1;
  const nodes = [];
  const timers = [];

  if (spec.kind === 'loopNoise') {
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = spec.filter ?? 'lowpass';
    filter.frequency.value = spec.freq ?? 800;
    filter.Q.value = spec.q ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, (spec.gain ?? 0.1) * vol), ctx.currentTime + 1.2);
    // ลมหายใจของบรรยากาศ ทำให้ไม่นิ่งจนน่าเบื่อ
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08 + Math.random() * 0.12;
    lfoGain.gain.value = (spec.gain ?? 0.1) * 0.35 * vol;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    src.connect(filter).connect(gain).connect(dest);
    src.start();
    nodes.push(src, lfo, gain);
    if (spec.birds) timers.push(scheduleRandom(ctx, () => playSpec(ctx, { kind: 'ping', freq: 2400 + Math.random() * 900, dur: 0.4, gain: 0.06 * vol, echoes: 1 }, dest), 4, 9));
  } else if (spec.kind === 'loopTone') {
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, (spec.gain ?? 0.1) * vol), ctx.currentTime + 1.5);
    gain.connect(dest);
    for (const freq of spec.freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = spec.wobble ?? 0.1;
      lfoGain.gain.value = freq * 0.01;
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain);
      osc.start(); lfo.start();
      nodes.push(osc, lfo);
    }
    nodes.push(gain);
  } else if (spec.kind === 'loopDrip') {
    const fire = () => {
      if (spec.bell) playSpec(ctx, { kind: 'bell', partials: [spec.freq, spec.freq * 1.5], dur: 0.9, gain: spec.gain }, dest, { volume: vol });
      else playSpec(ctx, { kind: 'ping', freq: spec.freq, dur: 0.5, gain: spec.gain, echoes: 1 }, dest, { volume: vol });
    };
    timers.push(scheduleRandom(ctx, fire, spec.interval, spec.interval + (spec.jitter ?? 0.5)));
  }

  return {
    stop() {
      for (const t of timers) clearTimeout(t.id);
      for (const node of nodes) {
        try { node.stop?.(); } catch { /* หยุดไปแล้ว */ }
        try { node.disconnect(); } catch { /* ตัดการเชื่อมต่อไปแล้ว */ }
      }
    },
  };
}

/** ตั้งเวลาเรียกซ้ำแบบสุ่มช่วง (คืน handle ที่ยกเลิกได้) */
function scheduleRandom(ctx, fn, min, max) {
  const handle = { id: null };
  const next = () => {
    const delay = (min + Math.random() * (max - min)) * 1000;
    handle.id = setTimeout(() => { fn(); next(); }, delay);
  };
  next();
  return handle;
}
