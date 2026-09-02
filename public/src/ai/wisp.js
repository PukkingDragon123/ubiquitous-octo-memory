/**
 * "วิสป์" (Wisp) — ภูตนำทางประจำตัวผู้เล่น
 *
 * หน้าที่: บอกทาง อ่านค่าสถานะ อธิบายสิ่งรอบตัว และตอบคำถามเกี่ยวกับโลก
 * ทำงานได้เต็มรูปแบบโดยไม่ต้องต่ออินเทอร์เน็ต และจะใช้ LLM เสริมเมื่อผู้เล่นตั้งค่าไว้
 */

import { bestMatch, numberToThai } from '../core/text.js';
import { DIRECTIONS, ROOMS, getRoom, getQuest, getNpc, getEnemy } from '../world/world-data.js';
import { SPELLS } from '../world/spells.js';
import { angleToThai, relativeAngle } from '../game/game-state.js';

/** ชุดความรู้ของวิสป์ — ใช้ตอบคำถามอิสระเมื่อไม่มี LLM */
export const WISP_KNOWLEDGE = [
  {
    key: 'maha_ngiap',
    phrases: ['มหาเงียบคืออะไร', 'มหาเงียบ', 'ศัตรูตัวสุดท้าย', 'บอส'],
    answer: 'มหาเงียบคือสิ่งที่ก่อตัวในที่ที่ไม่เคยมีใครส่งเสียงไปถึง มันกลืนเสียงเพราะไม่เคยมีเสียงเป็นของตัวเอง มันอยู่เหนือสุดของแผนที่ หลังประตูแห่งความเงียบ',
  },
  {
    key: 'bells',
    phrases: ['ระฆังคืออะไร', 'ระฆัง', 'ระฆังสามใบ', 'ทำไมต้องตีระฆัง'],
    answer: 'ระฆังสามใบคือเสาหลักของเสียงในวิรัลยา ใบแรกอยู่ในห้องโถงกังวานกลางถ้ำ ใบที่สองอยู่บนยอดหอระฆังร้าง ใบที่สามอยู่กับมหาเงียบเอง ปลุกให้ครบแล้วโลกจะมีเสียงอีกครั้ง',
  },
  {
    key: 'magic',
    phrases: ['เวทมนตร์ทำงานยังไง', 'คาถาทำงานยังไง', 'ศิลป์กังวานคืออะไร', 'เวทมนตร์'],
    answer: 'เวทในโลกนี้เรียกว่าศิลป์กังวาน เสียงที่เจ้าเปล่งออกมาทำให้อากาศและหินสั่นพ้องจนเปลี่ยนรูป ยิ่งออกเสียงชัดและมั่นคง คาถายิ่งแรง เพราะงั้นพูดชื่อคาถาให้เต็มเสียงนะ',
  },
  {
    key: 'wisp_self',
    phrases: ['วิสป์คือใคร', 'เธอคือใคร', 'เจ้าคือใคร', 'วิสป์'],
    answer: 'ข้าคือวิสป์ ภูตแสงที่เกิดจากเสียงหัวเราะครั้งแรกของเจ้า ข้าอยู่ข้างหูซ้ายเสมอ หน้าที่ข้าคือทำให้เจ้าไม่หลงทางและไม่หลงลืมว่าเจ้าฟังเก่งแค่ไหน',
  },
  {
    key: 'element',
    phrases: ['ธาตุ', 'ธาตุไหนแรง', 'ธาตุอะไรบ้าง', 'จุดอ่อนศัตรู'],
    answer: 'ธาตุมีหกสาย เพลิง วายุ เงา ผลึก พสุธา และรัศมี เงาไร้เสียงกลัวรัศมี อสูรกลืนเสียงกลัวเพลิง ค้างคาวกระดิ่งกลัววายุ ส่วนซากหินคำรามกลัวเสียงสะกด',
  },
  {
    key: 'controls',
    phrases: ['เล่นยังไง', 'ควบคุมยังไง', 'พูดอะไรได้บ้าง', 'คำสั่ง'],
    answer: 'พูดว่า เดินหน้า เลี้ยวซ้าย เลี้ยวขวา หันหลัง เพื่อเคลื่อนที่ พูดว่า สำรวจ เพื่อฟังรอบตัว พูดว่า สถานะ เพื่อฟังค่าพลัง และพูดชื่อคาถาตรง ๆ เพื่อร่ายเวท',
  },
  {
    key: 'village',
    phrases: ['หมู่บ้านกังวาน', 'หมู่บ้าน', 'ที่นี่คือที่ไหน'],
    answer: 'หมู่บ้านกังวานคือบ้านของเจ้า เป็นหมู่บ้านสุดท้ายที่ระฆังยังตั้งอยู่ ยายมาลีอยู่ทางตะวันตก นายกังวาลอยู่ทางตะวันออก และประตูเหนือคือทางออกสู่ป่าเสียงกระซิบ',
  },
  {
    key: 'death',
    phrases: ['ตายแล้วเป็นยังไง', 'ถ้าแพ้', 'ตาย'],
    answer: 'ถ้าเจ้าล้ม ข้าจะพาเจ้ากลับมาที่ลานระฆัง ไม่มีการลบความคืบหน้า แค่พูดว่า เริ่มใหม่ แล้วเราไปต่อกัน',
  },
];

export class WispBrain {
  /** @param {import('./ai-client.js').AiClient|null} aiClient */
  constructor(aiClient = null) {
    this.ai = aiClient;
    this.lastAdvice = '';
  }

  /** คำทักทายเปิดเกม */
  intro() {
    return 'ข้าคือวิสป์ ภูตแสงข้างหูซ้ายของเจ้า ตั้งแต่นี้ไปข้าจะบอกทางให้เอง ' +
      'พูดคำสั่งออกมาได้เลย ถ้าไม่รู้จะเริ่มยังไง พูดว่า "ช่วยด้วย" หรือ "ไปทางไหนต่อ"';
  }

  /** สรุปว่าควรทำอะไรต่อ พร้อมเส้นทางแบบเลี้ยวซ้าย-ขวา */
  hint(state) {
    const quest = getQuest(state.quest);
    if (!quest) return 'การเดินทางจบแล้ว เจ้าคืนเสียงให้วิรัลยาได้สำเร็จ';
    if (state.inCombat) {
      const angle = relativeAngle(state.facingDir.bearing, state.enemy.bearing);
      return `ตอนนี้สู้อยู่ ${state.enemy.name}อยู่${angleToThai(angle)} หันไปทางนั้นแล้วพูดชื่อคาถา`;
    }
    const target = quest.room;
    if (state.player.roomId === target) return `${quest.goal} — เจ้าอยู่ที่นี่แล้ว ลองพูดว่า "สำรวจ" ดูสิ`;
    const route = this.routeText(state, target);
    return `${quest.goal} ${route}`;
  }

  /** แปลงเส้นทางเป็นคำบอกทางที่ฟังแล้วเดินตามได้ */
  routeText(state, destId) {
    const path = state.pathTo(destId);
    if (!path || path.length < 2) return 'ข้าหาทางไปที่นั่นไม่เจอ';
    const first = path[1];
    const facing = state.facingDir.bearing;
    const dir = DIRECTIONS[first.dir];
    const angle = relativeAngle(facing, dir.bearing);
    const steps = path.length - 1;
    const turn = Math.abs(angle) < 1 ? 'เดินหน้าได้เลย'
      : angle > 0 && angle < 180 ? 'เลี้ยวขวาก่อน'
      : angle < 0 && angle > -180 ? 'เลี้ยวซ้ายก่อน'
      : 'หันหลังกลับก่อน';
    return `จากตรงนี้ ${turn} แล้วมุ่งไปทาง${dir.th} สู่${getRoom(first.id).name} รวมทั้งหมด ${numberToThai(steps)} ช่วงทาง`;
  }

  /** นำทางไปยังสถานที่ที่ผู้เล่นเอ่ยชื่อ */
  guideTo(state, spokenPlace) {
    const hit = bestMatch(spokenPlace, ROOMS.map((r) => ({ key: r.id, phrases: [r.name, r.name.replace(/^(ลาน|ห้องโถง|ประตู|ยอด|ฐาน|ปาก|ชาย|แอ่ง|โรงหล่อ|กระท่อม|ใจกลาง)/, '')] })), 0.55);
    if (!hit) return `ข้าไม่รู้จักที่ที่ชื่อว่า ${spokenPlace} ลองพูดชื่อเต็ม เช่น ถ้ำสะท้อน หรือ หอระฆังร้าง`;
    const room = getRoom(hit.key);
    if (!state.flags.visited.includes(room.id) && !this.isReachableKnown(state, room.id)) {
      return `ข้ารู้ว่า${room.name}มีอยู่ แต่เจ้ายังไม่เคยไป ข้าจะพาไปเท่าที่รู้ ${this.routeText(state, room.id)}`;
    }
    if (state.player.roomId === room.id) return `เจ้ายืนอยู่ที่${room.name}แล้ว`;
    return this.routeText(state, room.id);
  }

  isReachableKnown(state, roomId) { return Boolean(state.pathTo(roomId)); }

  /** อ่านค่าสถานะแบบสั้น ใช้ตอนผู้เล่นถามกลางฉากต่อสู้ */
  quickStatus(state) {
    const p = state.player;
    return `ชีวิต ${numberToThai(p.hp)} กังวาน ${numberToThai(p.mana)}`;
  }

  /** อธิบายสิ่งรอบตัวแบบเน้นการฟัง */
  describe(state) {
    const room = state.room;
    const exits = state.exitList().map((e) => `${e.relativeTh}ไป${e.targetName}`);
    const lms = state.landmarkList().map((l) => `${l.name}อยู่${l.relativeTh}`);
    const npcs = state.npcsHere().map((n) => n.name);
    const parts = [`${room.name} ${room.intro}`];
    if (lms.length) parts.push(`รอบตัว: ${lms.join(' ')}`);
    if (npcs.length) parts.push(`มี ${npcs.join(' และ ')} อยู่ที่นี่`);
    if (exits.length) parts.push(`ทางออก: ${exits.join(' ')}`);
    return parts.join(' ');
  }

  /**
   * ตอบคำถามอิสระ — ลอง LLM ก่อน ถ้าไม่มีหรือพลาด ใช้ฐานความรู้ในเครื่อง
   * @returns {Promise<string>}
   */
  async answer(question, state) {
    const local = this.localAnswer(question, state);
    if (this.ai?.enabled) {
      const remote = await this.ai.complete({
        system: WISP_SYSTEM_PROMPT,
        prompt: `บริบทเกมตอนนี้: ${this.contextLine(state)}\nคำถามของผู้เล่น: ${question}\nตอบสั้น ๆ ไม่เกินสามประโยค เป็นภาษาไทย`,
      });
      if (remote) return remote.trim();
    }
    return local;
  }

  /** คำตอบจากฐานความรู้ในเครื่อง (ใช้ได้เสมอ ไม่ต้องต่อเน็ต) */
  localAnswer(question, state) {
    // ชื่อเฉพาะมาก่อนเสมอ ผู้เล่นถามถึงคาถา/สิ่งมีชีวิต/คนที่เจอมากกว่าถามเชิงระบบ
    const spellHit = bestMatch(question, SPELLS.map((s) => ({ key: s.id, phrases: s.phrases })), 0.62);
    if (spellHit) {
      const spell = SPELLS.find((s) => s.id === spellHit.key);
      return `${spell.name} เป็นคาถาสาย${spell.element} ใช้พลังกังวาน ${numberToThai(spell.cost)} — ${spell.description}`;
    }

    const enemyHit = bestMatch(question, ['shadeling', 'gnawer', 'bell_bat', 'stone_husk', 'maha_ngiap']
      .map((id) => ({ key: id, phrases: [getEnemy(id).name] })), 0.62);
    if (enemyHit) {
      const e = getEnemy(enemyHit.key);
      return `${e.name}: ${e.description}`;
    }

    const npcHit = bestMatch(question, ['malee', 'kangwan', 'pin', 'arin']
      .map((id) => ({ key: id, phrases: [getNpc(id).name] })), 0.62);
    if (npcHit) {
      const n = getNpc(npcHit.key);
      return `${n.name} เป็น${n.role} ${n.knowledge[0]}`;
    }

    const hit = bestMatch(question, WISP_KNOWLEDGE, 0.6);
    if (hit) return WISP_KNOWLEDGE.find((k) => k.key === hit.key).answer;

    return `ข้ายังไม่รู้เรื่องนั้นดีพอ แต่ตอนนี้ ${this.hint(state)}`;
  }

  contextLine(state) {
    const q = getQuest(state.quest);
    return [
      `ผู้เล่นอยู่ที่ ${state.room.name}`,
      `หันหน้าไปทาง ${state.facingDir.th}`,
      `พลังชีวิต ${state.player.hp} พลังกังวาน ${state.player.mana}`,
      state.inCombat ? `กำลังสู้กับ ${state.enemy.name}` : 'ไม่ได้อยู่ในการต่อสู้',
      q ? `ภารกิจปัจจุบัน ${q.title}: ${q.goal}` : 'จบเนื้อเรื่องแล้ว',
    ].join(' | ');
  }
}

export const WISP_SYSTEM_PROMPT = [
  'คุณคือ "วิสป์" ภูตแสงนำทางในเกมเสียงภาษาไทยชื่อ "วิรัลยา: เสียงสะท้อน"',
  'ผู้เล่นเป็นผู้พิการทางสายตา เล่นด้วยเสียงล้วน ดังนั้น:',
  '- ตอบเป็นภาษาไทยพูดได้ลื่นเมื่ออ่านออกเสียง ห้ามใช้ตาราง สัญลักษณ์ อีโมจิ หรือมาร์กดาวน์',
  '- ตอบสั้น กระชับ ไม่เกินสามประโยค',
  '- บอกทิศทางแบบผู้ฟังเสมอ เช่น ทางซ้าย ตรงหน้า ด้านหลัง และบอกจำนวนก้าว',
  '- น้ำเสียงอบอุ่น เป็นเพื่อนร่วมทาง ไม่สงสาร ไม่ทำให้ผู้เล่นรู้สึกด้อย',
  '- อยู่ในโลกวิรัลยาเท่านั้น ห้ามอ้างอิงงานของผู้อื่น และห้ามแต่งกฎเกมใหม่ที่ขัดกับบริบทที่ให้มา',
].join('\n');
