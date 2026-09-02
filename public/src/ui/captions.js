/**
 * คำบรรยาย (Captions)
 *
 * สำหรับผู้พิการทางการได้ยิน: ทุกสิ่งที่ "ได้ยิน" ในเกมต้องอ่านได้ด้วยตา
 * ทั้งบทพูด เสียงประกอบ ทิศทางของเสียง และรูปแบบการสั่น
 */

const ICONS = {
  speech: '💬', sound: '🔊', haptic: '📳', system: 'ℹ️',
  combat: '⚔️', quest: '⭐', ambience: '🌿',
};

export class Captions {
  constructor(root) {
    this.root = root;
    this.max = 60;
    this.showSounds = true;
    this.entries = [];
  }

  /** บทพูด (ผู้บรรยาย/วิสป์/NPC) */
  speech({ text, speaker, voice, priority }) {
    this.push({ kind: 'speech', icon: ICONS.speech, speaker: speaker ?? 'ผู้บรรยาย', text, cls: `voice-${voice ?? 'narrator'}`, priority });
  }

  /** เสียงประกอบพร้อมทิศทาง เช่น "เสียงฝีเท้าเข้าใกล้ — ทางซ้าย ห่าง 3 ก้าว" */
  sound({ caption, angle, distance }) {
    if (!this.showSounds || !caption) return;
    const dir = angle === undefined || angle === null ? '' : ` — ${arrowFor(angle)} ${directionWord(angle)}`;
    const dist = distance && distance > 1.2 ? ` ห่างราว ${Math.round(distance)} ก้าว` : '';
    this.push({ kind: 'sound', icon: ICONS.sound, speaker: 'เสียง', text: `${caption}${dir}${dist}` });
  }

  /** รูปแบบการสั่น — แสดงเป็นข้อความและแถบจังหวะ */
  haptic({ pattern, steps }) {
    const bar = steps.map((ms, i) => (i % 2 === 0 ? '█'.repeat(Math.min(8, Math.ceil(ms / 40)) || 1) : ' '.repeat(Math.min(4, Math.ceil(ms / 60))))).join('');
    this.push({ kind: 'haptic', icon: ICONS.haptic, speaker: 'สั่น', text: `${pattern} ${bar}` });
  }

  system(text, kind = 'system') {
    this.push({ kind, icon: ICONS[kind] ?? ICONS.system, speaker: 'ระบบ', text });
  }

  push(entry) {
    this.entries.push(entry);
    if (this.entries.length > this.max) this.entries.shift();
    if (!this.root) return;
    const li = document.createElement('li');
    li.className = `caption caption-${entry.kind} ${entry.cls ?? ''}`;
    if (entry.priority === 'high') li.classList.add('caption-urgent');
    li.innerHTML = `<span class="caption-icon" aria-hidden="true">${entry.icon}</span>` +
      `<span class="caption-speaker">${escapeHtml(entry.speaker)}</span>` +
      `<span class="caption-text">${escapeHtml(entry.text)}</span>`;
    this.root.appendChild(li);
    while (this.root.children.length > this.max) this.root.removeChild(this.root.firstChild);
    this.root.parentElement?.scrollTo({ top: this.root.parentElement.scrollHeight, behavior: 'smooth' });
  }

  clear() {
    this.entries = [];
    if (this.root) this.root.innerHTML = '';
  }

  setShowSounds(on) { this.showSounds = on; }
}

/** ลูกศรบอกทิศของเสียงสำหรับผู้ที่ไม่ได้ยิน */
export function arrowFor(angle) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return '⬆️';
  if (a < 67.5) return '↗️';
  if (a < 112.5) return '➡️';
  if (a < 157.5) return '↘️';
  if (a < 202.5) return '⬇️';
  if (a < 247.5) return '↙️';
  if (a < 292.5) return '⬅️';
  return '↖️';
}

export function directionWord(angle) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'ตรงหน้า';
  if (a < 67.5) return 'เฉียงขวาหน้า';
  if (a < 112.5) return 'ทางขวา';
  if (a < 157.5) return 'เฉียงขวาหลัง';
  if (a < 202.5) return 'ด้านหลัง';
  if (a < 247.5) return 'เฉียงซ้ายหลัง';
  if (a < 292.5) return 'ทางซ้าย';
  return 'เฉียงซ้ายหน้า';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
