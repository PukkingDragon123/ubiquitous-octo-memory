/**
 * ตัวเชื่อมกับโมเดลภาษา (ถ้าผู้เล่นตั้งค่าไว้)
 *
 * ค่าเริ่มต้นคือ "ปิด" — เกมทั้งเกมเล่นจบได้ด้วยสมองในเครื่อง (rule-based)
 * ถ้าเปิดใช้งาน จะยิงไปยัง endpoint ที่ผู้เล่นกรอกเอง (แนะนำให้ตั้งพร็อกซีของตัวเอง)
 *
 * ห้ามฝังคีย์ API ไว้ในซอร์สโค้ด — เก็บไว้ใน localStorage ของเครื่องผู้เล่นเท่านั้น
 */

export class AiClient {
  /**
   * @param {{endpoint?:string, apiKey?:string, model?:string, timeoutMs?:number}} config
   */
  constructor(config = {}) {
    this.endpoint = config.endpoint || null;
    this.apiKey = config.apiKey || null;
    this.model = config.model || 'claude-sonnet-5';
    this.timeoutMs = config.timeoutMs ?? 6000;
    this.enabled = Boolean(this.endpoint);
  }

  configure(config = {}) {
    Object.assign(this, config);
    this.enabled = Boolean(this.endpoint);
  }

  /**
   * ขอข้อความจากโมเดล — คืน null เมื่อใช้ไม่ได้ เพื่อให้ผู้เรียกถอยไปใช้สมองในเครื่อง
   * @param {{system:string, prompt:string, maxTokens?:number}} req
   * @returns {Promise<string|null>}
   */
  async complete({ system, prompt, maxTokens = 220 }) {
    if (!this.enabled) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return extractText(data);
    } catch {
      return null; // เน็ตล่ม/หมดเวลา → ใช้สมองในเครื่องแทนอย่างเงียบ ๆ
    } finally {
      clearTimeout(timer);
    }
  }
}

/** รองรับรูปแบบผลลัพธ์ที่พบบ่อยจากพร็อกซีหลายแบบ */
export function extractText(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.text === 'string') return data.text;
  if (Array.isArray(data.content)) {
    const joined = data.content.filter((b) => b?.type === 'text').map((b) => b.text).join('\n').trim();
    return joined || null;
  }
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  return null;
}
