/**
 * รับคำสั่งเสียงภาษาไทยผ่านไมโครโฟน (Web Speech API)
 *
 * รองรับสองโหมด:
 *  - push: กดปุ่มค้างแล้วพูด (ค่าเริ่มต้น — แม่นกว่าและไม่รบกวนเวลาคุยกับคนอื่น)
 *  - always: ฟังตลอดเวลา เหมาะกับผู้เล่นที่ใช้มือลำบาก
 *
 * ค่าความมั่นใจของการรู้จำเสียงถูกส่งต่อไปเป็น "ความชัดของการเปล่งคาถา"
 */

export class SpeechInput {
  constructor(handlers = {}) {
    const Recognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    this.supported = Boolean(Recognition);
    this.Recognition = Recognition;
    this.recognition = null;
    this.mode = 'push';
    this.listening = false;
    this.wantListening = false;
    this.lang = 'th-TH';
    this.handlers = {
      onResult: () => {}, onInterim: () => {}, onStart: () => {},
      onEnd: () => {}, onError: () => {}, ...handlers,
    };
  }

  init() {
    if (!this.supported) {
      this.handlers.onError({
        code: 'unsupported',
        message: 'เบราว์เซอร์นี้ยังไม่รองรับการรับเสียง แนะนำให้ใช้ Chrome หรือ Edge — ระหว่างนี้เล่นด้วยแป้นพิมพ์หรือช่องพิมพ์คำสั่งได้',
      });
      return false;
    }
    const rec = new this.Recognition();
    rec.lang = this.lang;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = this.mode === 'always';

    rec.onstart = () => { this.listening = true; this.handlers.onStart(); };
    rec.onend = () => {
      this.listening = false;
      this.handlers.onEnd();
      // โหมดฟังตลอดเวลา: เบราว์เซอร์ตัดการฟังเป็นระยะ ต้องต่อให้เอง
      if (this.wantListening && this.mode === 'always') setTimeout(() => this.start(), 250);
    };
    rec.onerror = (event) => {
      const map = {
        'not-allowed': 'ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน กรุณากดอนุญาตในแถบที่อยู่ของเบราว์เซอร์',
        'audio-capture': 'ไม่พบไมโครโฟน ลองเสียบหูฟังหรือไมค์แล้วลองใหม่',
        'no-speech': 'ไม่ได้ยินเสียงพูด ลองพูดอีกครั้ง',
        network: 'การรู้จำเสียงต้องใช้อินเทอร์เน็ต ตอนนี้เชื่อมต่อไม่ได้',
      };
      this.handlers.onError({ code: event.error, message: map[event.error] ?? `เกิดข้อผิดพลาด: ${event.error}` });
    };
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        const payload = {
          transcript: alt.transcript.trim(),
          confidence: typeof alt.confidence === 'number' && alt.confidence > 0 ? alt.confidence : 0.85,
          alternatives: Array.from(result).map((a) => a.transcript.trim()),
          isFinal: result.isFinal,
        };
        if (result.isFinal) this.handlers.onResult(payload);
        else this.handlers.onInterim(payload);
      }
    };

    this.recognition = rec;
    return true;
  }

  setMode(mode) {
    this.mode = mode === 'always' ? 'always' : 'push';
    if (this.recognition) this.recognition.continuous = this.mode === 'always';
    if (this.mode === 'always') this.start();
    else this.stop();
  }

  start() {
    if (!this.recognition || this.listening) return;
    this.wantListening = true;
    try { this.recognition.start(); } catch { /* เรียกซ้ำระหว่างกำลังเริ่ม */ }
  }

  stop() {
    this.wantListening = false;
    if (!this.recognition || !this.listening) return;
    try { this.recognition.stop(); } catch { /* หยุดไปแล้ว */ }
  }

  /** ใช้กับปุ่มกดค้างเพื่อพูด */
  pushToTalkStart() { if (this.mode === 'push') this.start(); }
  pushToTalkEnd() { if (this.mode === 'push') this.stop(); }
}
