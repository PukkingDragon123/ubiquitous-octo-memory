/**
 * สมองของ NPC — บทสนทนามีบุคลิก จำได้ว่าคุยอะไรไปแล้ว
 * ใช้กฎในเครื่องเป็นหลัก และเสริมด้วย LLM เมื่อผู้เล่นตั้งค่าไว้
 */

import { bestMatch, matchScore } from '../core/text.js';
import { getNpc } from '../world/world-data.js';

export class NpcBrain {
  constructor(aiClient = null) {
    this.ai = aiClient;
    this.memory = new Map(); // npcId → ประวัติการคุย
  }

  history(npcId) {
    if (!this.memory.has(npcId)) this.memory.set(npcId, []);
    return this.memory.get(npcId);
  }

  /** ประโยคเปิดเมื่อเริ่มคุย */
  greet(npcId) {
    const npc = getNpc(npcId);
    if (!npc) return null;
    const log = this.history(npcId);
    const text = log.length ? `${npc.name}: ว่าไงอีก มีอะไรจะถามอีกไหม` : `${npc.name}: ${npc.greeting}`;
    log.push({ role: 'npc', text });
    return { npc, text, voice: npc.voice };
  }

  /**
   * ตอบคำพูดของผู้เล่น
   * @returns {Promise<{text:string, npc:object, effects:string[]}>}
   */
  async reply(npcId, playerText, contextLine = '') {
    const npc = getNpc(npcId);
    if (!npc) return { text: 'ไม่มีใครอยู่ตรงนี้', npc: null, effects: [] };
    const log = this.history(npcId);
    log.push({ role: 'player', text: playerText });

    const local = this.localReply(npc, playerText);
    let text = local.text;

    if (this.ai?.enabled) {
      const remote = await this.ai.complete({
        system: npcSystemPrompt(npc),
        prompt: [
          `บริบท: ${contextLine}`,
          `สิ่งที่ตัวละครรู้: ${npc.knowledge.join(' / ')}`,
          `บทสนทนาก่อนหน้า: ${log.slice(-6).map((m) => `${m.role === 'player' ? 'ผู้เล่น' : npc.name}: ${m.text}`).join('\n')}`,
          `ผู้เล่นพูดว่า: ${playerText}`,
          'ตอบเป็นคำพูดของตัวละครเท่านั้น ไม่เกินสองประโยค',
        ].join('\n'),
        maxTokens: 160,
      });
      if (remote) text = remote.trim();
    }

    log.push({ role: 'npc', text });
    return { text, npc, effects: local.effects };
  }

  /** ตอบด้วยกฎในเครื่อง — ใช้เสมอเมื่อไม่มี LLM */
  localReply(npc, playerText) {
    const effects = [];
    const topicEntries = Object.entries(npc.topics ?? {}).map(([pattern, answer]) => ({
      key: pattern,
      phrases: pattern.split('|'),
      answer,
    }));
    const hit = bestMatch(playerText, topicEntries, 0.55);
    if (hit) {
      const entry = topicEntries.find((t) => t.key === hit.key);
      if (npc.teaches && /วิรัล|คาถาสูงสุด/.test(hit.phrase)) effects.push(`teach:${npc.teaches}`);
      return { text: entry.answer, effects };
    }
    if (isFarewell(playerText)) return { text: npc.farewell, effects: ['end'] };
    if (npc.gives?.length) effects.push(`give:${npc.gives[0]}`);
    const fallback = npc.knowledge[Math.floor(Math.random() * npc.knowledge.length)];
    return { text: `${fallback}`, effects };
  }

  forget(npcId) { this.memory.delete(npcId); }
}

const FAREWELLS = ['ลาก่อน', 'ไปก่อนนะ', 'บาย', 'ขอบคุณ', 'พอแล้ว', 'จบการสนทนา', 'ไปละ'];

export function isFarewell(text) {
  return FAREWELLS.some((f) => matchScore(text, f) > 0.72);
}

export function npcSystemPrompt(npc) {
  return [
    `คุณกำลังสวมบทเป็น "${npc.name}" ตัวละครในเกมเสียงภาษาไทย "วิรัลยา: เสียงสะท้อน"`,
    `บทบาท: ${npc.role}`,
    `บุคลิก: ${npc.persona}`,
    'ผู้เล่นเป็นผู้พิการทางสายตาและฟังคำตอบผ่านการอ่านออกเสียง ดังนั้น:',
    '- พูดเป็นภาษาไทยธรรมชาติ สั้น ไม่เกินสองประโยค ห้ามใช้มาร์กดาวน์หรืออีโมจิ',
    '- บรรยายสิ่งที่ได้ยิน ได้กลิ่น หรือสัมผัส แทนการบรรยายภาพล้วน ๆ',
    '- ห้ามหลุดบทบาท ห้ามพูดถึงว่าตัวเองเป็นเอไอ',
    '- ห้ามอ้างถึงตัวละครหรือเวทมนตร์จากงานของผู้อื่น ใช้เฉพาะสิ่งที่มีในโลกวิรัลยา',
  ].join('\n');
}
