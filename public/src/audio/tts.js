/**
 * ระบบอ่านออกเสียงภาษาไทย (Text-to-Speech)
 *
 * ใช้ SpeechSynthesis ของเบราว์เซอร์ เลือกเสียงภาษาไทยอัตโนมัติ
 * มีคิวและระดับความสำคัญ: ข้อความสำคัญ (เช่น ศัตรูโจมตี) แทรกคิวได้ทันที
 * ทุกข้อความจะถูกส่งออกเป็นคำบรรยายพร้อมกันเสมอ เพื่อผู้พิการทางการได้ยิน
 */

export const VOICE_PROFILES = {
  narrator: { rate: 1.0, pitch: 1.0, volume: 1.0, label: 'ผู้บรรยาย' },
  wisp: { rate: 1.08, pitch: 1.45, volume: 1.0, label: 'วิสป์' },
  malee: { rate: 0.92, pitch: 1.25, volume: 1.0, label: 'ยายมาลี' },
  kangwan: { rate: 1.0, pitch: 0.75, volume: 1.0, label: 'นายกังวาล' },
  pin: { rate: 1.12, pitch: 1.5, volume: 1.0, label: 'ปิ่น' },
  arin: { rate: 0.85, pitch: 0.95, volume: 0.95, label: 'อาริน' },
  maha_ngiap: { rate: 0.8, pitch: 0.5, volume: 1.0, label: 'มหาเงียบ' },
};

export class ThaiTTS {
  /** @param {(payload:object)=>void} onCaption ตัวรับคำบรรยายทุกประโยค */
  constructor(onCaption = () => {}) {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.onCaption = onCaption;
    this.voice = null;
    this.queue = [];
    this.speaking = false;
    this.enabled = true;
    this.globalRate = 1.0;
    this.globalVolume = 1.0;
    this.available = Boolean(this.synth);
    this.hasThaiVoice = false;
    this.lastSpoken = '';
  }

  /** เลือกเสียงภาษาไทยที่ดีที่สุดที่เครื่องมี */
  async init() {
    if (!this.synth) return false;
    const voices = await this.loadVoices();
    const thai = voices.filter((v) => /^th(-|_)?/i.test(v.lang) || /thai/i.test(v.name));
    this.voice = thai[0] ?? voices.find((v) => /^en/i.test(v.lang)) ?? voices[0] ?? null;
    this.hasThaiVoice = thai.length > 0;
    return this.hasThaiVoice;
  }

  loadVoices() {
    return new Promise((resolve) => {
      const existing = this.synth.getVoices();
      if (existing.length) return resolve(existing);
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(this.synth.getVoices()); } };
      this.synth.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 1200); // บางเบราว์เซอร์ไม่ยิง event นี้
    });
  }

  /**
   * พูดข้อความ
   * @param {string} text
   * @param {{voice?:string, priority?:'low'|'normal'|'high', caption?:string}} opts
   */
  speak(text, opts = {}) {
    if (!text) return;
    const profileKey = opts.voice ?? 'narrator';
    const profile = VOICE_PROFILES[profileKey] ?? VOICE_PROFILES.narrator;
    const entry = { text, profileKey, profile, priority: opts.priority ?? 'normal', caption: opts.caption ?? text };

    // คำบรรยายต้องขึ้นทันที ไม่ต้องรอคิวเสียง
    this.onCaption({ text: entry.caption, speaker: profile.label, voice: profileKey, priority: entry.priority });

    if (!this.enabled || !this.synth) return;

    if (entry.priority === 'high') {
      this.queue.unshift(entry);
      if (this.speaking) this.synth.cancel(); // แทรกทันทีเมื่อเป็นเรื่องเร่งด่วน
      this.speaking = false;
    } else {
      this.queue.push(entry);
    }
    this.pump();
  }

  pump() {
    if (this.speaking || !this.queue.length || !this.synth) return;
    const entry = this.queue.shift();
    const utter = new SpeechSynthesisUtterance(entry.text);
    if (this.voice) utter.voice = this.voice;
    utter.lang = this.hasThaiVoice ? (this.voice?.lang ?? 'th-TH') : 'th-TH';
    utter.rate = clamp(entry.profile.rate * this.globalRate, 0.5, 2.5);
    utter.pitch = clamp(entry.profile.pitch, 0, 2);
    utter.volume = clamp(entry.profile.volume * this.globalVolume, 0, 1);
    utter.onend = () => { this.speaking = false; this.pump(); };
    utter.onerror = () => { this.speaking = false; this.pump(); };
    this.speaking = true;
    this.lastSpoken = entry.text;
    this.synth.speak(utter);
  }

  /** หยุดพูดทั้งหมด (คำสั่ง "เงียบ") */
  stop() {
    this.queue = [];
    this.speaking = false;
    this.synth?.cancel();
  }

  /** พูดข้อความล่าสุดซ้ำ (คำสั่ง "พูดอีกครั้ง") */
  repeat() {
    if (this.lastSpoken) this.speak(this.lastSpoken, { priority: 'high' });
  }

  setRate(rate) { this.globalRate = clamp(rate, 0.5, 2.0); }
  setVolume(v) { this.globalVolume = clamp(v, 0, 1); }
  setEnabled(on) { this.enabled = on; if (!on) this.stop(); }
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
