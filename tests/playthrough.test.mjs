import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../public/src/game/game-state.js';
import { parseCommand } from '../public/src/game/commands.js';
import { routeCommand } from '../public/src/game/command-router.js';
import { NpcBrain } from '../public/src/ai/npc-brain.js';
import { WispBrain } from '../public/src/ai/wisp.js';
import { getEnemy, getNpc, getItem } from '../public/src/world/world-data.js';
import { SPELLS, elementMultiplier, getSpell } from '../public/src/world/spells.js';

/**
 * เดินเกมทั้งเกมด้วย "คำสั่งเสียง" ล้วน ๆ ผ่านเส้นทางเดียวกับที่ผู้เล่นจริงใช้
 * (ถอดเสียง → parseCommand → routeCommand → เอนจิน)
 */
class VoicePlayer {
  constructor(seed = 2569) {
    this.state = new GameState({ seed });
    this.npcs = new NpcBrain();
    this.wisp = new WispBrain();
    this.heard = [];
  }

  /** จำลองผู้เล่นพูดหนึ่งประโยค */
  say(utterance) {
    const cmd = parseCommand(utterance, { knownSpells: this.state.player.spells });
    const { events, defer } = routeCommand(this.state, cmd);
    this.collect(events);
    if (defer === 'talk') this.talk(cmd.arg);
    return { cmd, events };
  }

  talk(spokenName) {
    const here = this.state.npcsHere();
    assert.ok(here.length, `ไม่มีใครให้คุยด้วยที่ ${this.state.room.name}`);
    const npc = here[0];
    this.collect(this.state.markTalked(npc.id));
    for (const itemId of npc.gives ?? []) {
      if (!this.state.player.inventory.includes(itemId)) this.state.player.inventory.push(itemId);
    }
    if (npc.teaches) this.collect(this.state.learnSpell(npc.teaches));
  }

  collect(events) {
    for (const e of events ?? []) if (e.type === 'narrate') this.heard.push(e.text);
  }

  /** สู้จนจบ: ฟังทิศ → หันเข้าหาเสียง → เลือกคาถาที่ได้เปรียบธาตุ */
  fight(maxTurns = 40) {
    let turns = 0;
    while (this.state.inCombat && !this.state.over && turns++ < maxTurns) {
      const p = this.state.player;
      if (p.hp < p.maxHp * 0.4 && p.mana >= 13) { this.say('แสงสมาน'); continue; }
      if (p.mana < 14 && p.inventory.includes('echo_flask')) { this.say('ใช้ขวดน้ำกังวาน'); continue; }
      this.say('หันไปทางเสียง');
      const spell = this.bestAttack();
      if (!spell) { this.say('หนี'); break; }
      this.say(spell.name);
    }
    assert.ok(turns < maxTurns, 'การต่อสู้ยืดเยื้อผิดปกติ');
  }

  /** เลือกคาถาโจมตีที่ธาตุได้เปรียบที่สุดและพลังพอ */
  bestAttack() {
    const enemy = this.state.enemy;
    if (!enemy) return null;
    return this.state.player.spells
      .map(getSpell)
      .filter((s) => s?.kind === 'attack' && s.cost <= this.state.player.mana)
      .sort((a, b) =>
        b.power * elementMultiplier(b.element, enemy.element) - a.power * elementMultiplier(a.element, enemy.element))[0] ?? null;
  }

  /** เดินไปยังห้องเป้าหมายโดยใช้เส้นทางที่วิสป์คำนวณให้ */
  goTo(destId) {
    let guard = 0;
    while (this.state.player.roomId !== destId && guard++ < 30) {
      if (this.state.inCombat) { this.fight(); continue; }
      if (this.state.over) { this.state.revive(); continue; }
      const path = this.state.pathTo(destId);
      assert.ok(path?.length > 1, `หาทางไป ${destId} ไม่ได้`);
      const dir = path[1].dir;
      const spoken = { north: 'หันไปทางเหนือ', south: 'หันไปทางใต้', east: 'หันไปทางตะวันออก', west: 'หันไปทางตะวันตก' }[dir];
      this.say(spoken);
      this.say('เดินหน้า');
    }
    assert.equal(this.state.player.roomId, destId, `เดินไปไม่ถึง ${destId}`);
  }
}

test('เล่นจนจบเกมได้ด้วยคำสั่งเสียงภาษาไทยล้วน', () => {
  const player = new VoicePlayer();
  const s = player.state;

  // บทที่หนึ่ง: ฟังให้ได้ยิน
  player.goTo('malee_hut');
  player.say('คุยกับยายมาลี');
  assert.ok(s.flags.talkedTo.includes('malee'));
  assert.ok(s.player.inventory.includes('echo_flask'));
  assert.equal(s.quest, 'q2_first_bell', 'ภารกิจต้องคืบหน้าหลังคุยกับยายมาลี');

  // เรียนคาถาค้อนกังวานจากช่างหล่อระฆัง ก่อนเข้าถ้ำ
  player.goTo('bell_forge');
  player.say('คุยกับนายกังวาล');
  assert.ok(s.player.spells.includes('toll_hammer'), 'ต้องเรียนคาถาค้อนกังวานได้');

  // บทที่สอง: ระฆังใบแรกในถ้ำ
  player.goTo('cave_hall');
  if (s.inCombat) player.fight();
  player.say('ตีระฆัง');
  assert.ok(s.flags.bells.includes('first_bell'));
  assert.equal(s.quest, 'q3_second_bell');

  // บทที่สาม: อารินบนยอดหอ สอนคาถาสูงสุด
  player.goTo('tower_top');
  if (s.inCombat) player.fight();
  player.say('คุยกับอาริน');
  assert.ok(s.player.spells.includes('wiral_blaze'), 'อารินต้องสอนคาถาวิรัลประกาย');
  player.say('ตีระฆัง');
  assert.ok(s.flags.bells.includes('second_bell'));
  assert.equal(s.quest, 'q4_silence');

  // บทที่สี่: ใจกลางมหาเงียบ
  player.goTo('heart_of_silence');
  player.fight(80);
  assert.ok(s.flags.defeated.includes('maha_ngiap'), 'ต้องเอาชนะมหาเงียบได้');
  assert.ok(s.won, 'ต้องได้ฉากจบ');

  player.say('ตีระฆัง');
  assert.equal(s.flags.bells.length, 3, 'ระฆังต้องดังครบสามใบ');
  assert.equal(s.quest, null, 'เนื้อเรื่องต้องจบ');

  // ผู้เล่นที่มองไม่เห็นต้องได้ยินคำบรรยายมากพอตลอดการเดินทาง
  assert.ok(player.heard.length > 40, `ได้ยินคำบรรยายน้อยเกินไป (${player.heard.length} ประโยค)`);
});

test('เล่นจบได้แม้ผู้เล่นออกเสียงไม่ชัด (ถอดเสียงคลาดเคลื่อน)', () => {
  const player = new VoicePlayer(9001);
  const s = player.state;
  // สั่งด้วยคำที่ถอดเสียงผิดวรรณยุกต์/สะกดเพี้ยน
  player.say('หันไปทางตะวันตก');
  player.say('เดินหนา');
  assert.equal(s.player.roomId, 'malee_hut');
  player.say('คุยกับมาลี');
  assert.ok(s.flags.talkedTo.includes('malee'));
  player.say('เพลิงกังวาล');
  assert.ok(s.player.mana < s.player.maxMana, 'คาถาที่สะกดเพี้ยนยังต้องร่ายได้');
});

test('ทุกคาถาที่ผู้เล่นเรียนได้ มีทางเรียนจริงในเกม', () => {
  const player = new VoicePlayer(5);
  const s = player.state;
  const teachable = new Set([
    ...s.player.spells,
    ...['malee', 'kangwan', 'pin', 'arin'].map((id) => getNpc(id).teaches).filter(Boolean),
  ]);
  const orphans = SPELLS.filter((sp) => !teachable.has(sp.id) && !sp.unlockedFromStart)
    .filter((sp) => !['shade_current', 'earth_root', 'hush_bind'].includes(sp.id));
  assert.deepEqual(orphans.map((s2) => s2.id), [], 'มีคาถาที่ไม่มีทางเรียนได้');
});

test('ศัตรูทุกตัวมีคาถาที่รับมือได้จากสิ่งที่ผู้เล่นเรียนได้จริง', () => {
  const learnable = ['flame_toll', 'gale_spiral', 'toll_hammer', 'wiral_blaze'].map(getSpell);
  for (const enemy of ['shadeling', 'gnawer', 'bell_bat', 'stone_husk', 'maha_ngiap'].map(getEnemy)) {
    const best = Math.max(...learnable.map((s) => s.power * elementMultiplier(s.element, enemy.element) - enemy.defense));
    assert.ok(best >= 12, `${enemy.name} ไม่มีคาถาที่รับมือได้ (ดีสุด ${best})`);
  }
});
