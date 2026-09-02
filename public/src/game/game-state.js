/**
 * เอนจินหลักของเกม — ไม่มีการเรียก API ของเบราว์เซอร์เลย
 * ทุกคำสั่งคืนค่าเป็น "เหตุการณ์" (events) ให้ชั้นนำเสนอ (เสียง/คำบรรยาย/การสั่น) ไปใช้ต่อ
 * ทำให้ทดสอบด้วย node --test ได้ทั้งหมด
 */

import { createRng } from '../core/rng.js';
import { numberToThai } from '../core/text.js';
import {
  DIRECTIONS, DIRECTION_ORDER, getRoom, getNpc, getEnemy, getItem, getQuest, QUESTS, ROOMS,
} from '../world/world-data.js';
import { SPELLS, getSpell, resolveSpell } from '../world/spells.js';

/** มุมสัมพัทธ์ (-180..180) จากทิศที่หันอยู่ ไปยังมุมเป้าหมาย */
export function relativeAngle(facingBearing, targetBearing) {
  let diff = ((targetBearing - facingBearing) % 360 + 540) % 360 - 180;
  return diff;
}

/** แปลงมุมสัมพัทธ์เป็นคำบอกทิศภาษาไทยแบบผู้ฟัง */
export function angleToThai(angle) {
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

const STARTING_SPELLS = SPELLS.filter((s) => s.unlockedFromStart).map((s) => s.id);

export class GameState {
  constructor(options = {}) {
    this.rng = createRng(options.seed ?? 20260902);
    this.assistAim = options.assistAim ?? true; // โหมดช่วยเล็ง: เปิดไว้เป็นค่าเริ่มต้นเพื่อการเข้าถึง
    this.reset();
  }

  reset() {
    this.player = {
      name: 'ผู้ฟัง',
      hp: 100, maxHp: 100,
      mana: 60, maxMana: 60,
      shield: 0,
      roomId: 'village_square',
      facing: 0, // ดัชนีใน DIRECTION_ORDER
      inventory: ['echo_flask'],
      spells: [...STARTING_SPELLS],
      steps: 0,
    };
    this.quest = QUESTS[0].id;
    this.flags = { bells: [], talkedTo: [], defeated: [], visited: ['village_square'] };
    this.enemy = null;
    this.lastRoomId = null;
    this.turn = 0;
    this.over = false;
    this.won = false;
  }

  // ───────────────────────────── ข้อมูลสถานะ ─────────────────────────────

  get room() { return getRoom(this.player.roomId); }
  get facingKey() { return DIRECTION_ORDER[this.player.facing]; }
  get facingDir() { return DIRECTIONS[this.facingKey]; }
  get inCombat() { return this.enemy !== null && this.enemy.hp > 0; }

  snapshot() {
    return {
      player: { ...this.player },
      room: { id: this.room.id, name: this.room.name },
      facing: { key: this.facingKey, th: this.facingDir.th },
      quest: this.quest,
      enemy: this.enemy ? { ...this.enemy } : null,
      flags: JSON.parse(JSON.stringify(this.flags)),
      over: this.over, won: this.won,
    };
  }

  save() { return JSON.stringify({ player: this.player, quest: this.quest, flags: this.flags, turn: this.turn }); }

  load(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data?.player?.roomId || !getRoom(data.player.roomId)) return false;
      this.player = { ...this.player, ...data.player };
      this.quest = data.quest ?? this.quest;
      this.flags = { ...this.flags, ...(data.flags ?? {}) };
      this.turn = data.turn ?? 0;
      this.enemy = null; this.over = false; this.won = false;
      return true;
    } catch { return false; }
  }

  // ───────────────────────────── ตัวช่วยสร้างเหตุการณ์ ─────────────────────────────

  ev(type, payload = {}) { return { type, ...payload }; }

  /** พลังกังวานฟื้นตัวเองเมื่อผู้เล่นยังส่งเสียงอยู่ */
  regen(amount) {
    const before = this.player.mana;
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + amount);
    return this.player.mana - before;
  }

  narrate(text, opts = {}) {
    return this.ev('narrate', { text, voice: opts.voice ?? 'narrator', caption: opts.caption ?? text, priority: opts.priority ?? 'normal' });
  }

  wisp(text, opts = {}) { return this.narrate(text, { ...opts, voice: 'wisp' }); }

  sfx(key, opts = {}) {
    return this.ev('sfx', { key, angle: opts.angle ?? 0, distance: opts.distance ?? 1, caption: opts.caption ?? null, loop: !!opts.loop });
  }

  haptic(pattern) { return this.ev('haptic', { pattern }); }
  hud() { return this.ev('hud', { state: this.snapshot() }); }

  // ───────────────────────────── การรับรู้สภาพแวดล้อม ─────────────────────────────

  /** รายการทางออกพร้อมทิศสัมพัทธ์กับตัวผู้เล่น */
  exitList() {
    const room = this.room;
    const facingBearing = this.facingDir.bearing;
    return Object.entries(room.exits ?? {}).map(([dir, targetId]) => {
      const d = DIRECTIONS[dir];
      const angle = relativeAngle(facingBearing, d.bearing);
      return {
        dir, targetId,
        targetName: getRoom(targetId)?.name ?? targetId,
        absoluteTh: d.th,
        relativeTh: angleToThai(angle),
        angle,
        visited: this.flags.visited.includes(targetId),
      };
    });
  }

  /** จุดสังเกตในห้องพร้อมมุม/ระยะ สำหรับเสียงสามมิติ */
  landmarkList() {
    const facingBearing = this.facingDir.bearing;
    return (this.room.landmarks ?? []).map((lm) => {
      const [x, y] = lm.offset;
      const bearing = (Math.atan2(x, y) * 180) / Math.PI;
      const distance = Math.max(1, Math.hypot(x, y));
      const angle = relativeAngle(facingBearing, bearing);
      return { ...lm, angle, distance, relativeTh: angleToThai(angle) };
    });
  }

  /** เข้าห้องใหม่: บรรยาย เสียงบรรยากาศ จุดสังเกต และโอกาสเจอศัตรู */
  describeRoom(full = true) {
    const room = this.room;
    const events = [
      this.ev('ambience', { key: room.ambience, caption: room.caption }),
      this.ev('room', { id: room.id, name: room.name, floor: room.floor }),
    ];
    if (full) events.push(this.narrate(`${room.name}. ${room.intro}`, { caption: `${room.name} — ${room.caption}` }));

    for (const lm of this.landmarkList()) {
      events.push(this.sfx(lm.sound, { angle: lm.angle, distance: lm.distance, caption: `${lm.name} อยู่${lm.relativeTh}` }));
    }
    const exits = this.exitList();
    if (exits.length) {
      const text = exits.map((e) => `${e.relativeTh}ไป${e.targetName}`).join(' ');
      events.push(this.wisp(`ทางออก: ${text}`, { caption: `ทางออก: ${text}` }));
    }
    for (const npcId of room.npcs ?? []) {
      const npc = getNpc(npcId);
      if (npc) events.push(this.wisp(`มี${npc.name}อยู่ที่นี่ พูดว่า "คุยกับ${npc.name}" เพื่อเริ่มสนทนา`));
    }
    for (const itemId of room.items ?? []) {
      if (!this.player.inventory.includes(itemId) && !this.flags[`picked_${itemId}`]) {
        const item = getItem(itemId);
        events.push(this.wisp(`ได้ยินเสียงสั่นของ${item.name}อยู่ใกล้ ๆ พูดว่า "เก็บของ" เพื่อหยิบ`));
      }
    }
    events.push(this.hud());
    return events;
  }

  // ───────────────────────────── การเคลื่อนที่ ─────────────────────────────

  turnTo(delta) {
    const before = this.facingDir.th;
    this.player.facing = (this.player.facing + delta + 4) % 4;
    const dir = this.facingDir;
    const events = [
      this.sfx('turn', { angle: delta > 0 ? 90 : -90, distance: 0.4, caption: 'หันตัว' }),
      this.haptic(delta > 0 ? 'turn_right' : 'turn_left'),
      this.wisp(`หันไปทาง${dir.th}แล้ว`, { caption: `หันหน้าไปทาง${dir.th} (เดิม${before})` }),
      this.hud(),
    ];
    if (this.inCombat) events.push(...this.enemyBearingHint());
    return events;
  }

  faceDirection(dirKey) {
    const idx = DIRECTION_ORDER.indexOf(dirKey);
    if (idx < 0) return [this.wisp('ไม่รู้จักทิศนั้น')];
    this.player.facing = idx;
    return [this.wisp(`หันไปทาง${DIRECTIONS[dirKey].th}แล้ว`), this.hud()];
  }

  /** หันเข้าหาเสียงศัตรู — ตัวช่วยการเข้าถึงสำหรับผู้เล่นที่ยังจับทิศเสียงไม่ถนัด */
  faceSound() {
    if (!this.inCombat) return [this.wisp('ตอนนี้ไม่มีเสียงศัตรูให้หันหา')];
    let best = 0; let bestDiff = 999;
    for (let i = 0; i < 4; i++) {
      const diff = Math.abs(relativeAngle(DIRECTIONS[DIRECTION_ORDER[i]].bearing, this.enemy.bearing));
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    this.player.facing = best;
    return [
      this.sfx('focus', { distance: 0.5, caption: 'จับทิศเสียง' }),
      this.wisp(`หันเข้าหาเสียงแล้ว มันอยู่ทาง${this.facingDir.th}`),
      ...this.enemyBearingHint(),
      this.hud(),
    ];
  }

  /** เดินไปตามทิศสัมพัทธ์: 'forward' | 'back' | 'left' | 'right' หรือทิศจริง */
  move(target, steps = 1) {
    if (this.inCombat && target !== 'flee') {
      return [this.wisp('กำลังต่อสู้อยู่ ถ้าจะถอย พูดว่า "หนี"', { priority: 'high' }), this.haptic('warn')];
    }
    const relMap = { forward: 0, right: 1, back: 2, left: 3 };
    let dirKey;
    if (target in relMap) dirKey = DIRECTION_ORDER[(this.player.facing + relMap[target]) % 4];
    else if (DIRECTION_ORDER.includes(target)) dirKey = target;
    else return [this.wisp('ไม่เข้าใจทิศที่ต้องการไป')];

    const destId = this.room.exits?.[dirKey];
    if (!destId) {
      return [
        this.sfx('bump', { distance: 0.3, caption: 'ชนกำแพง' }),
        this.haptic('bump'),
        this.wisp(`ทาง${DIRECTIONS[dirKey].th}เป็นกำแพง ลองทิศอื่นดู`, { priority: 'high' }),
      ];
    }

    const events = [];
    const floor = this.room.floor;
    const walked = Math.max(1, Math.min(steps, 5));
    for (let i = 0; i < walked; i++) {
      events.push(this.sfx(`step_${floor}`, { distance: 0.2, caption: 'เสียงฝีเท้า' }));
      events.push(this.haptic('step'));
    }
    this.player.steps += walked;
    this.regen(2);
    this.lastRoomId = this.player.roomId;
    this.player.roomId = destId;
    if (!this.flags.visited.includes(destId)) this.flags.visited.push(destId);
    if (DIRECTION_ORDER.indexOf(dirKey) !== this.player.facing) this.player.facing = DIRECTION_ORDER.indexOf(dirKey);

    events.push(...this.describeRoom());
    events.push(...this.maybeEncounter());
    events.push(...this.checkQuestProgress());
    return events;
  }

  flee() {
    if (!this.inCombat) return [this.wisp('ตอนนี้ไม่มีอะไรให้หนี')];
    const escaped = this.rng.chance(0.6);
    if (!escaped) {
      const events = [this.wisp('หนีไม่ทัน! มันขวางทางอยู่', { priority: 'high' }), this.haptic('warn')];
      events.push(...this.enemyTurn());
      return events;
    }
    const back = this.lastRoomId ?? this.room.exits?.south ?? this.player.roomId;
    this.enemy = null;
    this.player.roomId = back;
    return [
      this.sfx('flee', { caption: 'วิ่งหนี' }), this.haptic('sweep'),
      this.wisp('หนีออกมาได้แล้ว หายใจลึก ๆ ก่อน'),
      ...this.describeRoom(),
    ];
  }

  // ───────────────────────────── การต่อสู้ ─────────────────────────────

  maybeEncounter() {
    const room = this.room;
    if (room.boss && !this.flags.defeated.includes(room.boss)) return this.startEncounter(room.boss);
    if (!room.encounters?.length) return [];
    if (!this.rng.chance(room.encounterChance ?? 0.3)) return [];
    return this.startEncounter(this.rng.pick(room.encounters));
  }

  startEncounter(enemyId) {
    const def = getEnemy(enemyId);
    if (!def) return [];
    const bearing = this.rng.pick([0, 45, 90, 135, 180, 225, 270, 315]);
    this.enemy = {
      id: def.id, name: def.name, hp: def.hp, maxHp: def.hp,
      attack: def.attack, defense: def.defense, speed: def.speed,
      element: def.element, bearing, distance: def.boss ? 5 : 6,
      stunned: 0, rooted: 0, phase: 0, boss: !!def.boss,
    };
    const angle = relativeAngle(this.facingDir.bearing, bearing);
    return [
      this.ev('combat_start', { enemy: { ...this.enemy }, caption: def.caption }),
      this.narrate(this.rng.pick(def.tells), { priority: 'high', caption: def.tells[0] }),
      this.sfx(def.sound, { angle, distance: this.enemy.distance, caption: `เสียง${def.name} ${angleToThai(angle)}` }),
      this.haptic(def.boss ? 'boss_appear' : 'danger'),
      this.wisp(`${def.name}อยู่${angleToThai(angle)} ห่าง ${numberToThai(Math.round(this.enemy.distance))} ก้าว พูดชื่อคาถาเพื่อโจมตี`, { priority: 'high' }),
      this.hud(),
    ];
  }

  enemyBearingHint() {
    if (!this.inCombat) return [];
    const angle = relativeAngle(this.facingDir.bearing, this.enemy.bearing);
    const def = getEnemy(this.enemy.id);
    return [this.sfx(def.sound, { angle, distance: this.enemy.distance, caption: `${this.enemy.name} ${angleToThai(angle)}` })];
  }

  /**
   * ร่ายคาถา
   * @param {string} spellId
   * @param {number} clarity ความชัดของการออกเสียง (0..1) มาจากคะแนนความมั่นใจของตัวรู้จำเสียง
   */
  castSpell(spellId, clarity = 1) {
    const spell = getSpell(spellId);
    if (!spell) return [this.wisp('ไม่รู้จักคาถานั้น')];
    if (!this.player.spells.includes(spellId)) {
      return [this.wisp(`ยังร่าย${spell.name}ไม่ได้ ต้องเรียนจากใครสักคนก่อน`), this.haptic('deny')];
    }
    if (this.player.mana < spell.cost) {
      return [
        this.sfx('fizzle', { caption: 'คาถาดับ' }), this.haptic('deny'),
        this.wisp(`พลังกังวานไม่พอ เหลือ ${numberToThai(this.player.mana)} ต้องใช้ ${numberToThai(spell.cost)}`, { priority: 'high' }),
      ];
    }

    this.player.mana -= spell.cost;
    this.turn++;
    const events = [
      this.ev('cast', { spell: spell.id, name: spell.name, caption: `ร่ายคาถา ${spell.name}` }),
      this.sfx(spell.sound, { angle: 0, distance: 0.6, caption: `เสียงคาถา ${spell.name}` }),
      this.haptic(spell.haptic),
    ];

    if (spell.kind === 'utility' && spell.id === 'survey_ripple') {
      events.push(...this.surveyRipple());
      events.push(this.hud());
      return events;
    }
    if (spell.kind === 'heal') {
      const res = resolveSpell(spell, {}, { clarity });
      const before = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + res.heal);
      events.push(this.wisp(`แผลสมานขึ้น ${numberToThai(this.player.hp - before)} หน่วย ตอนนี้พลังชีวิต ${numberToThai(this.player.hp)}`));
      events.push(this.hud());
      if (this.inCombat) events.push(...this.enemyTurn());
      return events;
    }
    if (spell.kind === 'shield') {
      const res = resolveSpell(spell, {}, { clarity });
      this.player.shield += res.shield;
      events.push(this.wisp(`ผลึกจันทร์ห่อหุ้มตัวไว้ ป้องกันได้ ${numberToThai(this.player.shield)} หน่วย`));
      events.push(this.hud());
      if (this.inCombat) events.push(...this.enemyTurn());
      return events;
    }

    if (!this.inCombat) {
      // ร่ายใส่ระฆังเพื่อปลุกเสียง
      if (this.room.bell && !this.flags.bells.includes(this.room.bell) && spell.kind === 'attack') {
        return [...events, ...this.ringBell()];
      }
      events.push(this.narrate('เสียงคาถากระจายออกไปในที่ว่าง แล้วเงียบลง ไม่มีอะไรให้โจมตีตอนนี้'));
      events.push(this.hud());
      return events;
    }

    // เล็งด้วยหู: ต้องหันหน้าเข้าหาเสียง
    const angle = Math.abs(relativeAngle(this.facingDir.bearing, this.enemy.bearing));
    let aimFactor;
    if (this.assistAim && angle <= 90) aimFactor = 1;
    else if (angle <= 35) aimFactor = 1;
    else if (angle <= 80) aimFactor = 0.6;
    else aimFactor = 0.15;

    const def = getEnemy(this.enemy.id);
    const res = resolveSpell(spell, { element: this.enemy.element, defense: this.enemy.defense }, { clarity });

    if (spell.kind === 'control') {
      if (spell.id === 'earth_root') this.enemy.rooted = res.control;
      else this.enemy.stunned = res.control;
      events.push(this.wisp(`${this.enemy.name}ถูก${spell.name}ตรึงไว้ ${numberToThai(res.control)} จังหวะ`));
      events.push(this.hud());
      events.push(...this.enemyTurn());
      return events;
    }

    const damage = Math.round(res.damage * aimFactor);
    this.enemy.hp -= damage;
    if (res.manaBack) this.player.mana = Math.min(this.player.maxMana, this.player.mana + res.manaBack);

    if (aimFactor < 0.5) {
      events.push(this.sfx('miss', { caption: 'คาถาพลาดเป้า' }));
      events.push(this.wisp(`เกือบไป! เสียงมันอยู่${angleToThai(relativeAngle(this.facingDir.bearing, this.enemy.bearing))} ลองหันไปทางนั้นก่อนร่าย`, { priority: 'high' }));
    } else {
      events.push(this.sfx('hit', { angle: relativeAngle(this.facingDir.bearing, this.enemy.bearing), distance: this.enemy.distance, caption: 'คาถาเข้าเป้า' }));
      events.push(this.haptic(res.multiplier > 1 ? 'crit' : 'hit'));
      events.push(this.wisp(`เข้าเต็ม ๆ ${numberToThai(damage)} หน่วย ธาตุ${spell.element}${res.effective}กับ${this.enemy.name}`));
    }

    if (this.enemy.hp <= 0) { events.push(...this.defeatEnemy(def)); return events; }

    if (this.enemy.boss) events.push(...this.bossPhaseCheck(def));
    events.push(this.ev('enemy_hp', { hp: Math.max(0, this.enemy.hp), maxHp: this.enemy.maxHp }));
    events.push(...this.enemyTurn());
    return events;
  }

  surveyRipple() {
    const events = [this.sfx('spell_survey', { distance: 0.3, caption: 'ระลอกเสียงกระจายออกรอบตัว' })];
    const exits = this.exitList();
    events.push(this.wisp(`ผังห้อง ${this.room.name}: ` + (exits.length
      ? exits.map((e) => `${e.relativeTh}มีทางไป${e.targetName}`).join(' ')
      : 'ไม่มีทางออกอื่นนอกจากทางที่เข้ามา')));
    for (const lm of this.landmarkList()) {
      events.push(this.sfx(lm.sound, { angle: lm.angle, distance: lm.distance, caption: `${lm.name} ${lm.relativeTh}` }));
    }
    const hidden = (this.room.items ?? []).filter((i) => !this.player.inventory.includes(i));
    if (hidden.length) events.push(this.wisp(`ระลอกเสียงสะท้อนกลับจากบางอย่าง: ${hidden.map((i) => getItem(i).name).join(', ')}`));
    if (this.inCombat) events.push(...this.enemyBearingHint());
    return events;
  }

  bossPhaseCheck(def) {
    const ratio = this.enemy.hp / this.enemy.maxHp;
    const phases = def.phases ?? [];
    for (let i = phases.length - 1; i > this.enemy.phase; i--) {
      if (ratio <= phases[i].at) {
        this.enemy.phase = i;
        return [
          this.ev('boss_phase', { phase: phases[i].name, caption: `เข้าสู่ช่วง "${phases[i].name}"` }),
          this.haptic('boss_phase'),
          this.narrate(phases[i].taunt, { voice: 'maha_ngiap', priority: 'high' }),
        ];
      }
    }
    return [];
  }

  defeatEnemy(def) {
    const events = [
      this.sfx('enemy_down', { caption: `${def.name} สลายไป` }),
      this.haptic('victory_small'),
      this.narrate(`${def.name}สลายเป็นเสียงกระซิบแล้วเงียบลง`, { caption: `${def.name} พ่ายแพ้` }),
    ];
    if (!this.flags.defeated.includes(def.id)) this.flags.defeated.push(def.id);
    if (def.loot && !this.player.inventory.includes(def.loot)) {
      this.player.inventory.push(def.loot);
      events.push(this.wisp(`ได้รับ ${getItem(def.loot)?.name ?? def.loot}`));
    }
    this.player.mana = Math.min(this.player.maxMana, this.player.mana + 12);
    this.enemy = null;

    if (def.boss) events.push(...this.finale());
    events.push(this.hud());
    return events;
  }

  enemyTurn() {
    if (!this.inCombat) return [];
    const def = getEnemy(this.enemy.id);
    const events = [];
    this.regen(5);

    if (this.enemy.stunned > 0) {
      this.enemy.stunned--;
      events.push(this.wisp(`${this.enemy.name}ยังส่งเสียงไม่ได้`));
      return events;
    }
    if (this.enemy.rooted > 0) {
      this.enemy.rooted--;
      events.push(this.sfx('struggle', { angle: relativeAngle(this.facingDir.bearing, this.enemy.bearing), distance: this.enemy.distance, caption: `${this.enemy.name}ดิ้นอยู่กับที่` }));
      return events;
    }

    // ขยับเข้าใกล้และเปลี่ยนมุมเล็กน้อย เพื่อให้ผู้เล่นต้องฟังต่อเนื่อง
    this.enemy.bearing = (this.enemy.bearing + this.rng.int(-40, 40) + 360) % 360;
    const angle = relativeAngle(this.facingDir.bearing, this.enemy.bearing);

    if (this.enemy.distance > 2) {
      this.enemy.distance = Math.max(1.5, this.enemy.distance - this.enemy.speed);
      events.push(this.sfx(def.footstep, { angle, distance: this.enemy.distance, caption: `เสียง${this.enemy.name}เข้าใกล้จาก${angleToThai(angle)}` }));
      events.push(this.haptic('approach'));
      events.push(this.ev('enemy_move', { distance: this.enemy.distance, angle }));
      return events;
    }

    const raw = this.enemy.attack + this.rng.int(-2, 4);
    let damage = raw;
    if (this.player.shield > 0) {
      const absorbed = Math.min(this.player.shield, damage);
      this.player.shield -= absorbed;
      damage -= absorbed;
      events.push(this.sfx('shield_break', { angle, caption: 'ผลึกรับแรงไว้' }));
    }
    this.player.hp = Math.max(0, this.player.hp - damage);
    events.push(this.sfx('enemy_attack', { angle, distance: 1, caption: `${this.enemy.name}โจมตีจาก${angleToThai(angle)}` }));
    events.push(this.haptic(damage > 12 ? 'hurt_heavy' : 'hurt'));
    events.push(this.narrate(`${this.enemy.name}โจมตีจาก${angleToThai(angle)} เสียพลังชีวิต ${numberToThai(damage)}`, { priority: 'high' }));

    if (this.player.hp <= 0) events.push(...this.gameOver());
    else if (this.player.hp <= this.player.maxHp * 0.3) {
      events.push(this.haptic('low_hp'));
      events.push(this.wisp(`พลังชีวิตเหลือ ${numberToThai(this.player.hp)} รีบร่ายแสงสมาน หรือพูดว่า "หนี"`, { priority: 'high' }));
    }
    events.push(this.hud());
    return events;
  }

  gameOver() {
    this.over = true; this.enemy = null;
    return [
      this.ev('game_over', { caption: 'คุณล้มลง — เสียงรอบตัวค่อย ๆ เงียบ' }),
      this.haptic('game_over'),
      this.narrate('เสียงรอบตัวห่างออกไปทีละชั้น… แล้ววิสป์ก็ดึงคุณกลับมาที่หมู่บ้าน พูดว่า "เริ่มใหม่" เพื่อลองอีกครั้ง', { priority: 'high' }),
    ];
  }

  revive() {
    this.over = false;
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;
    this.player.roomId = 'village_square';
    this.enemy = null;
    return [this.wisp('วิสป์พาคุณกลับมาที่ลานระฆังแล้ว'), ...this.describeRoom()];
  }

  // ───────────────────────────── ระฆัง เควส และตอนจบ ─────────────────────────────

  ringBell() {
    const bellId = this.room.bell;
    if (!bellId) return [this.wisp('ที่นี่ไม่มีระฆัง')];
    if (this.flags.bells.includes(bellId)) return [this.wisp('ระฆังใบนี้ตื่นแล้ว')];
    if (this.inCombat) return [this.wisp('ยังตีระฆังไม่ได้ ต้องจัดการเสียงที่คุกคามก่อน', { priority: 'high' })];
    if (bellId === 'third_bell' && !this.flags.defeated.includes('maha_ngiap')) {
      return [this.wisp('โซ่เงายังพันระฆังใบสุดท้ายอยู่')];
    }
    this.flags.bells.push(bellId);
    const count = this.flags.bells.length;
    // ระฆังที่ตื่นแล้วคืนเสียงให้ผู้ฟัง — เพิ่มขีดจำกัดพลังและฟื้นเต็ม
    this.player.maxMana += 20;
    this.player.maxHp += 10;
    this.player.mana = this.player.maxMana;
    this.player.hp = this.player.maxHp;
    const events = [
      this.ev('bell_ring', { bell: bellId, count, caption: `ระฆังใบที่ ${count} ดังขึ้น` }),
      this.sfx('bell_awaken', { distance: 0.5, caption: 'เสียงระฆังกังวานยาว' }),
      this.haptic('bell'),
      this.narrate(`เสียงระฆังกังวานแผ่ออกไปทั่วทั้งหุบเขา นี่คือใบที่ ${numberToThai(count)} จากสามใบ`, { priority: 'high' }),
      this.wisp(`เสียงของระฆังไหลกลับเข้าตัวเจ้า พลังชีวิตและพลังกังวานเต็มแล้ว และรับได้มากขึ้นกว่าเดิม`),
    ];
    events.push(...this.checkQuestProgress());
    events.push(this.hud());
    return events;
  }

  checkQuestProgress() {
    const q = getQuest(this.quest);
    if (!q) return [];
    const done =
      (q.id === 'q1_listen' && this.flags.talkedTo.includes('malee')) ||
      (q.id === 'q2_first_bell' && this.flags.bells.includes('first_bell')) ||
      (q.id === 'q3_second_bell' && this.flags.bells.includes('second_bell')) ||
      (q.id === 'q4_silence' && this.flags.defeated.includes('maha_ngiap'));
    if (!done) return [];
    this.quest = q.next;
    const next = getQuest(this.quest);
    const events = [this.ev('quest_done', { quest: q.id, caption: `ภารกิจสำเร็จ: ${q.title}` }), this.sfx('quest', { caption: 'ภารกิจคืบหน้า' }), this.haptic('quest')];
    if (next) events.push(this.wisp(`ภารกิจใหม่: ${next.title} — ${next.goal}`, { priority: 'high' }));
    return events;
  }

  finale() {
    this.won = true;
    return [
      this.ev('victory', { caption: 'มหาเงียบได้ยินเสียงของตัวเองเป็นครั้งแรก' }),
      this.haptic('victory'),
      this.narrate('มหาเงียบหยุดนิ่ง แล้วเปล่งเสียงแรกของมันออกมา — เสียงสั่นเล็ก ๆ ที่ฟังเหมือนคนกำลังหัดร้องเพลง ระฆังใบสุดท้ายหลุดจากโซ่เงา และวิรัลยาก็มีเสียงอีกครั้ง', { priority: 'high' }),
      this.wisp('เจ้าทำได้แล้ว ผู้ฟัง ตอนนี้พูดว่า "ตีระฆัง" เพื่อปิดฉากการเดินทาง'),
    ];
  }

  // ───────────────────────────── ปฏิสัมพันธ์อื่น ๆ ─────────────────────────────

  pickUp() {
    const room = this.room;
    const available = (room.items ?? []).filter((i) => !this.player.inventory.includes(i));
    if (!available.length) return [this.wisp('ไม่มีของให้เก็บที่นี่')];
    const id = available[0];
    this.player.inventory.push(id);
    const item = getItem(id);
    return [
      this.sfx('pickup', { caption: `เก็บ${item.name}` }), this.haptic('pickup'),
      this.wisp(`เก็บ${item.name}แล้ว — ${item.desc}`), this.hud(),
    ];
  }

  useItem(nameOrId) {
    const id = this.player.inventory.find((i) => i === nameOrId || getItem(i)?.name === nameOrId);
    if (!id) return [this.wisp('ไม่มีของชิ้นนั้นในย่าม'), this.haptic('deny')];
    const item = getItem(id);
    const events = [this.sfx('drink', { caption: `ใช้${item.name}` }), this.haptic('pickup')];
    if (item.use === 'restore_mana') {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + item.amount);
      events.push(this.wisp(`พลังกังวานกลับมาเป็น ${numberToThai(this.player.mana)}`));
      this.player.inventory.splice(this.player.inventory.indexOf(id), 1);
    } else if (item.use === 'restore_hp') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.amount);
      events.push(this.wisp(`พลังชีวิตกลับมาเป็น ${numberToThai(this.player.hp)}`));
      this.player.inventory.splice(this.player.inventory.indexOf(id), 1);
    } else {
      events.push(this.wisp(`${item.name}: ${item.desc}`));
    }
    events.push(this.hud());
    if (this.inCombat) events.push(...this.enemyTurn());
    return events;
  }

  listInventory() {
    if (!this.player.inventory.length) return [this.wisp('ย่ามว่างเปล่า')];
    const names = this.player.inventory.map((i) => getItem(i)?.name ?? i).join(' ');
    return [this.wisp(`ในย่ามมี: ${names}`)];
  }

  listSpells() {
    const names = this.player.spells.map((id) => getSpell(id)?.name).filter(Boolean);
    return [this.wisp(`คาถาที่ร่ายได้: ${names.join(' ')} — พูดชื่อคาถาได้เลย`)];
  }

  /** อ่านค่าสถานะแบบสรุปให้ฟัง */
  statusReport() {
    const p = this.player;
    const parts = [
      `พลังชีวิต ${numberToThai(p.hp)} จาก ${numberToThai(p.maxHp)}`,
      `พลังกังวาน ${numberToThai(p.mana)} จาก ${numberToThai(p.maxMana)}`,
    ];
    if (p.shield > 0) parts.push(`เกราะผลึก ${numberToThai(p.shield)}`);
    parts.push(`อยู่ที่ ${this.room.name} หันหน้าไปทาง${this.facingDir.th}`);
    if (this.inCombat) {
      const angle = relativeAngle(this.facingDir.bearing, this.enemy.bearing);
      parts.push(`กำลังสู้กับ ${this.enemy.name} อยู่${angleToThai(angle)} ห่าง ${numberToThai(Math.round(this.enemy.distance))} ก้าว พลังชีวิตมันเหลือ ${numberToThai(Math.max(0, this.enemy.hp))}`);
    }
    const q = getQuest(this.quest);
    if (q) parts.push(`ภารกิจ: ${q.goal}`);
    const text = parts.join(' ');
    return [this.wisp(text, { caption: text, priority: 'high' }), this.hud()];
  }

  learnSpell(spellId) {
    if (this.player.spells.includes(spellId)) return [];
    this.player.spells.push(spellId);
    const spell = getSpell(spellId);
    return [
      this.sfx('learn', { caption: `เรียนคาถา ${spell.name}` }), this.haptic('quest'),
      this.wisp(`เรียนคาถาใหม่: ${spell.name} — ${spell.description}`, { priority: 'high' }),
    ];
  }

  /** ค้นหา NPC ในห้องปัจจุบัน */
  npcsHere() { return (this.room.npcs ?? []).map((id) => getNpc(id)).filter(Boolean); }

  markTalked(npcId) {
    if (!this.flags.talkedTo.includes(npcId)) this.flags.talkedTo.push(npcId);
    return this.checkQuestProgress();
  }

  /** เส้นทางสั้นที่สุดจากห้องปัจจุบันไปยังห้องเป้าหมาย (BFS) */
  pathTo(destId) {
    if (destId === this.player.roomId) return [];
    const queue = [[this.player.roomId]];
    const seen = new Set([this.player.roomId]);
    while (queue.length) {
      const path = queue.shift();
      const room = getRoom(path[path.length - 1]);
      for (const [dir, next] of Object.entries(room.exits ?? {})) {
        if (seen.has(next)) continue;
        seen.add(next);
        const extended = [...path, next];
        if (next === destId) return extended.map((id, i) => ({ id, dir: i === 0 ? null : dirBetween(extended[i - 1], id) }));
        queue.push(extended);
      }
    }
    return null;
  }
}

export function dirBetween(fromId, toId) {
  const from = getRoom(fromId);
  for (const [dir, target] of Object.entries(from?.exits ?? {})) if (target === toId) return dir;
  return null;
}

export const ALL_ROOM_IDS = ROOMS.map((r) => r.id);
