/**
 * เอนจินเสียง 3 มิติ
 *
 * - ใช้ PannerNode แบบ HRTF เพื่อให้ผู้เล่นแยกทิศทางด้วยหูฟังได้จริง
 * - เสียงทุกคีย์มี "เสียงสังเคราะห์ชั่วคราว" อยู่แล้ว เล่นได้ทันทีโดยไม่ต้องมีไฟล์
 * - ถ้าพบไฟล์จริงใน public/audio/manifest.json จะใช้ไฟล์นั้นแทนโดยอัตโนมัติ
 */

import { SOUND_SPECS, playSpec, startLoop, createNoiseBuffer } from './synth-bank.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buses = {};
    this.buffers = new Map();     // คีย์ → AudioBuffer จากไฟล์จริง
    this.manifest = {};
    this.loops = new Map();       // คีย์ → handle ของเสียงวนลูป
    this.ambienceKey = null;
    this.ready = false;
    this.volumes = { master: 0.9, sfx: 1, music: 0.5, voice: 1, ambience: 0.8 };
  }

  /** ต้องเรียกจากการกดปุ่ม/แตะครั้งแรกเสมอ (นโยบายเสียงอัตโนมัติของเบราว์เซอร์) */
  async init() {
    if (this.ready) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const master = this.ctx.createGain();
    master.gain.value = this.volumes.master;
    master.connect(this.ctx.destination);

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    compressor.connect(master);

    this.buses.master = master;
    for (const name of ['sfx', 'music', 'voice', 'ambience']) {
      const g = this.ctx.createGain();
      g.gain.value = this.volumes[name];
      g.connect(compressor);
      this.buses[name] = g;
    }

    // ผู้ฟังยืนที่จุดกำเนิด หันหน้าไปแกน -Z ตามมาตรฐาน Web Audio
    const l = this.ctx.listener;
    if (l.forwardX) {
      l.forwardX.value = 0; l.forwardY.value = 0; l.forwardZ.value = -1;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else if (l.setOrientation) {
      l.setOrientation(0, 0, -1, 0, 1, 0);
    }

    this.noiseBuffer = createNoiseBuffer(this.ctx, 3);
    this.ready = true;
    await this.loadManifest();
  }

  /** โหลดรายการไฟล์เสียงจริง (ถ้ามี) — ไม่มีก็ใช้เสียงสังเคราะห์ต่อไป */
  async loadManifest(url = 'audio/manifest.json') {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      this.manifest = data.sounds ?? {};
      const entries = Object.entries(this.manifest).filter(([, path]) => path);
      await Promise.all(entries.map(([key, path]) => this.loadBuffer(key, `audio/${path}`)));
      if (entries.length) console.info(`[audio] โหลดไฟล์เสียงจริงแล้ว ${this.buffers.size} คีย์`);
    } catch {
      // ไม่มี manifest ก็ไม่เป็นไร — เสียงสังเคราะห์ทำงานแทนได้ทั้งหมด
    }
  }

  async loadBuffer(key, url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const arr = await res.arrayBuffer();
      this.buffers.set(key, await this.ctx.decodeAudioData(arr));
      return true;
    } catch {
      return false; // ไฟล์เสีย/ไม่มี → ถอยไปใช้เสียงสังเคราะห์
    }
  }

  setVolume(bus, value) {
    this.volumes[bus] = value;
    if (bus === 'master') this.buses.master && (this.buses.master.gain.value = value);
    else if (this.buses[bus]) this.buses[bus].gain.value = value;
  }

  /**
   * สร้างโหนดวางตำแหน่งเสียงสามมิติ
   * @param {number} angle องศาสัมพัทธ์กับหน้าผู้เล่น (0 = ตรงหน้า, บวก = ขวา)
   * @param {number} distance ระยะเป็น "ก้าว"
   */
  createPanner(angle = 0, distance = 1) {
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 30;
    panner.rolloffFactor = 0.8;
    const rad = (angle * Math.PI) / 180;
    const d = Math.max(0.2, distance);
    // ขวา = +x, หน้า = -z (ตามระบบพิกัดของ Web Audio)
    panner.positionX ? panner.positionX.value = Math.sin(rad) * d : null;
    panner.positionY ? panner.positionY.value = 0 : null;
    panner.positionZ ? panner.positionZ.value = -Math.cos(rad) * d : null;
    if (!panner.positionX && panner.setPosition) panner.setPosition(Math.sin(rad) * d, 0, -Math.cos(rad) * d);
    return panner;
  }

  /**
   * เล่นเสียงหนึ่งครั้ง
   * @param {string} key
   * @param {{angle?:number, distance?:number, bus?:string, volume?:number}} opts
   */
  play(key, opts = {}) {
    if (!this.ready) return 0;
    const bus = this.buses[opts.bus ?? 'sfx'] ?? this.buses.sfx;
    const panner = this.createPanner(opts.angle ?? 0, opts.distance ?? 1);
    panner.connect(bus);

    const buffer = this.buffers.get(key);
    if (buffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = opts.volume ?? 1;
      src.connect(gain).connect(panner);
      src.start();
      src.onended = () => { try { panner.disconnect(); } catch { /* ปิดไปแล้ว */ } };
      return buffer.duration;
    }

    const spec = SOUND_SPECS[key];
    if (!spec) { console.warn(`[audio] ไม่พบเสียงคีย์ ${key}`); return 0; }
    const dur = playSpec(this.ctx, spec, panner, { volume: opts.volume ?? 1, noiseBuffer: this.noiseBuffer });
    setTimeout(() => { try { panner.disconnect(); } catch { /* ปิดไปแล้ว */ } }, (dur + 1) * 1000);
    return dur;
  }

  /** เริ่มเสียงบรรยากาศของห้อง (หยุดของเดิมให้อัตโนมัติ) */
  setAmbience(key) {
    if (this.ambienceKey === key) return;
    this.stopLoop('__ambience');
    this.ambienceKey = key;
    if (!key || !this.ready) return;
    this.startLoopKey('__ambience', key, { bus: 'ambience', angle: 0, distance: 1.2 });
  }

  /** เสียงวนลูปแบบมีตำแหน่ง เช่น เสียงน้ำหยดทางซ้าย */
  startLoopKey(id, key, opts = {}) {
    if (!this.ready) return;
    this.stopLoop(id);
    const bus = this.buses[opts.bus ?? 'sfx'] ?? this.buses.sfx;
    const panner = this.createPanner(opts.angle ?? 0, opts.distance ?? 2);
    panner.connect(bus);
    const spec = SOUND_SPECS[key];
    const buffer = this.buffers.get(key);
    if (buffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer; src.loop = true;
      src.connect(panner); src.start();
      this.loops.set(id, { stop: () => { try { src.stop(); } catch { /* หยุดไปแล้ว */ } try { panner.disconnect(); } catch { /* ปิดไปแล้ว */ } } });
      return;
    }
    if (!spec) return;
    const handle = startLoop(this.ctx, spec, panner, { volume: opts.volume ?? 1 });
    this.loops.set(id, { stop: () => { handle.stop(); try { panner.disconnect(); } catch { /* ปิดไปแล้ว */ } } });
  }

  stopLoop(id) {
    const handle = this.loops.get(id);
    if (handle) { handle.stop(); this.loops.delete(id); }
  }

  stopAllLoops() {
    for (const id of [...this.loops.keys()]) this.stopLoop(id);
    this.ambienceKey = null;
  }

  /** ปรับตำแหน่งเสียงวนลูปที่มีอยู่ (เช่น ศัตรูเคลื่อนที่) */
  hasLoop(id) { return this.loops.has(id); }

  /** คีย์ที่ยังใช้เสียงสังเคราะห์อยู่ — ใช้แสดงในหน้าตั้งค่า */
  placeholderKeys() {
    return Object.keys(SOUND_SPECS).filter((k) => !this.buffers.has(k));
  }
}
