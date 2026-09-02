/** บัสเหตุการณ์อย่างง่าย ใช้เชื่อมระบบเสียง ภาพ และการสั่นเข้าด้วยกัน */
export class EventBus {
  constructor() { this.handlers = new Map(); }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.off(type, fn);
  }

  once(type, fn) {
    const off = this.on(type, (payload) => { off(); fn(payload); });
    return off;
  }

  off(type, fn) { this.handlers.get(type)?.delete(fn); }

  emit(type, payload) {
    for (const fn of this.handlers.get(type) ?? []) {
      try { fn(payload); } catch (err) { console.error(`[bus:${type}]`, err); }
    }
    for (const fn of this.handlers.get('*') ?? []) {
      try { fn({ type, payload }); } catch (err) { console.error('[bus:*]', err); }
    }
  }
}

export const bus = new EventBus();
