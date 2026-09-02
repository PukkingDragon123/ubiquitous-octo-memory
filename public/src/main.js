/**
 * วิรัลยา: เสียงสะท้อน — ตัวควบคุมหลัก
 * เชื่อมคำสั่งเสียง เอนจินเกม เสียงสามมิติ คำบรรยาย และการสั่นเข้าด้วยกัน
 */

import { GameState, angleToThai, relativeAngle } from './game/game-state.js';
import { parseCommand, HELP_TEXT, resolveName } from './game/commands.js';
import { routeCommand } from './game/command-router.js';
import { getSpell } from './world/spells.js';
import { getEnemy, getItem } from './world/world-data.js';
import { AudioEngine } from './audio/audio-engine.js';
import { MusicDirector } from './audio/music.js';
import { FootstepPlayer } from './audio/footsteps.js';
import { ThaiTTS } from './audio/tts.js';
import { Haptics } from './haptics/haptics.js';
import { SpeechInput } from './input/speech-input.js';
import { KeyboardInput, keyboardHelpText } from './input/keyboard.js';
import { Captions } from './ui/captions.js';
import { Hud } from './ui/hud.js';
import { loadSettings, saveSettings, bindSettings } from './ui/settings.js';
import { AiClient } from './ai/ai-client.js';
import { WispBrain } from './ai/wisp.js';
import { NpcBrain } from './ai/npc-brain.js';

const SAVE_KEY = 'wiranlaya.save';

class Game {
  constructor() {
    this.el = queryElements();
    this.settings = loadSettings();
    this.state = new GameState({ assistAim: this.settings.assistAim });
    this.audio = new AudioEngine();
    this.music = new MusicDirector(this.audio);
    this.steps = new FootstepPlayer(this.audio);
    this.captions = new Captions(this.el.captionList);
    this.hud = new Hud(this.el);
    this.haptics = new Haptics((payload) => {
      this.captions.haptic(payload);
      this.hud.showHaptic(payload);
    });
    this.tts = new ThaiTTS((payload) => this.captions.speech(payload));
    this.ai = new AiClient({ endpoint: this.settings.aiEndpoint || null, model: this.settings.aiModel, apiKey: this.settings.aiKey || null });
    this.wisp = new WispBrain(this.ai);
    this.npcs = new NpcBrain(this.ai);
    this.speech = new SpeechInput({
      onResult: (r) => this.onSpeech(r),
      onInterim: (r) => this.hud.setHeard(r.transcript, false),
      onStart: () => this.hud.setMicState('listening', 'กำลังฟัง…'),
      onEnd: () => this.hud.setMicState('idle', this.settings.micMode === 'always' ? 'พร้อมฟัง' : 'กดค้างเพื่อพูด'),
      onError: (e) => this.onSpeechError(e),
    });
    this.keyboard = new KeyboardInput((cmd) => this.dispatch(cmd), {
      onTalkStart: () => this.speech.pushToTalkStart(),
      onTalkEnd: () => this.speech.pushToTalkEnd(),
      spellsOf: () => this.state.player.spells,
    });
    this.conversation = null;
    this.enemyPulse = null;
    this.started = false;
  }

  // ───────────────────────────── เริ่มเกม ─────────────────────────────

  async boot() {
    this.bindUi();
    this.captions.system('กดปุ่ม "เริ่มการเดินทาง" หรือกด Enter เพื่อเปิดเสียง');
    this.el.startButton?.focus();
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.el.startScreen?.setAttribute('hidden', '');
    this.el.app?.removeAttribute('hidden');

    await this.audio.init();
    const hasThai = await this.tts.init();
    this.speech.init();
    this.keyboard.attach();

    this.applyAll = bindSettings(this.settings, this.systems(), document);
    this.speech.setMode(this.settings.micMode);
    this.hud.setMicState('idle', this.settings.micMode === 'always' ? 'พร้อมฟัง' : 'กดค้างเพื่อพูด');

    if (!hasThai) {
      this.captions.system('เครื่องนี้ยังไม่มีเสียงอ่านภาษาไทย เกมจะแสดงคำบรรยายเต็มรูปแบบแทน — ติดตั้งเสียงไทยในระบบปฏิบัติการเพื่อฟังเสียงพูด');
    }
    if (!this.speech.supported) {
      this.captions.system('เบราว์เซอร์นี้รับเสียงพูดไม่ได้ ใช้ช่องพิมพ์คำสั่งด้านล่างหรือแป้นพิมพ์แทนได้ทุกคำสั่ง');
    }

    this.music.play('explore');
    this.tts.speak('วิรัลยา เสียงสะท้อน', { priority: 'high' });
    this.tts.speak('โลกกำลังเงียบลงทีละเสียง ระฆังทั้งสามใบหยุดดัง และคุณคือผู้ฟังคนสุดท้ายที่ยังได้ยินมันหายใจ');
    this.tts.speak(this.wisp.intro(), { voice: 'wisp' });
    this.run(this.state.describeRoom());
    this.captions.system(`คีย์ลัด: ${keyboardHelpText()}`);
  }

  systems() {
    return {
      audio: this.audio, music: this.music, tts: this.tts, haptics: this.haptics,
      speech: this.speech, captions: this.captions, state: this.state, ai: this.ai,
    };
  }

  bindUi() {
    this.el.startButton?.addEventListener('click', () => this.start());
    this.el.startScreen?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.start(); });

    this.el.micButton?.addEventListener('pointerdown', () => { this.speech.pushToTalkStart(); this.el.micButton.classList.add('active'); });
    this.el.micButton?.addEventListener('pointerup', () => { this.speech.pushToTalkEnd(); this.el.micButton.classList.remove('active'); });
    this.el.micButton?.addEventListener('pointerleave', () => { this.speech.pushToTalkEnd(); this.el.micButton.classList.remove('active'); });

    this.el.commandForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.el.commandInput.value.trim();
      if (!text) return;
      this.el.commandInput.value = '';
      this.handleUtterance(text, 1, 'typed');
    });

    this.el.settingsButton?.addEventListener('click', () => {
      const panel = this.el.settingsPanel;
      const open = panel.hasAttribute('hidden');
      if (open) { panel.removeAttribute('hidden'); panel.querySelector('input,select,button')?.focus(); }
      else panel.setAttribute('hidden', '');
      this.el.settingsButton.setAttribute('aria-expanded', String(open));
    });
    this.el.closeSettings?.addEventListener('click', () => {
      this.el.settingsPanel.setAttribute('hidden', '');
      this.el.settingsButton.setAttribute('aria-expanded', 'false');
      this.el.settingsButton.focus();
    });

    this.el.saveButton?.addEventListener('click', () => this.dispatch({ intent: 'save' }));
    this.el.loadButton?.addEventListener('click', () => this.dispatch({ intent: 'load' }));
    this.el.helpButton?.addEventListener('click', () => this.dispatch({ intent: 'help' }));
  }

  // ───────────────────────────── รับคำสั่ง ─────────────────────────────

  onSpeech({ transcript, confidence }) {
    this.hud.setHeard(transcript, true);
    if (!transcript) return;
    this.handleUtterance(transcript, confidence, 'voice');
  }

  onSpeechError({ code, message }) {
    this.hud.setMicState('error', 'ไมค์มีปัญหา');
    if (code === 'no-speech') return; // เรื่องปกติ ไม่ต้องรบกวนผู้เล่น
    this.captions.system(message);
    this.tts.speak(message, { voice: 'wisp', priority: 'high' });
  }

  /** ข้อความจากปาก/แป้นพิมพ์ → คำสั่ง หรือบทสนทนากับ NPC */
  async handleUtterance(text, confidence = 1, source = 'voice') {
    const cmd = parseCommand(text, { knownSpells: this.state.player.spells });
    cmd.confidence = confidence;
    cmd.source = source;

    // อยู่ระหว่างสนทนากับ NPC: ข้อความทั่วไปส่งให้ตัวละครตอบ
    if (this.conversation && cmd.intent !== 'cast' && cmd.score < 0.9) {
      await this.talkTurn(text);
      return;
    }
    await this.dispatch(cmd);
  }

  /** ทำงานตามเจตนา */
  async dispatch(cmd) {
    const s = this.state;
    if (s.over && !['restart', 'help', 'status', 'quiet'].includes(cmd.intent)) {
      this.tts.speak('คุณล้มอยู่ พูดว่า "เริ่มใหม่" เพื่อให้วิสป์พาคุณกลับไปที่หมู่บ้าน', { voice: 'wisp', priority: 'high' });
      return;
    }

    // คำสั่งที่เดินและต่อสู้ ใช้เส้นทางเดียวกับที่ชุดทดสอบเดิน
    if (cmd.intent === 'move_forward' || cmd.intent === 'move_back' || cmd.intent === 'move_left' || cmd.intent === 'move_right') {
      return this.walk(cmd.intent.replace('move_', ''), cmd.steps);
    }
    if (cmd.intent === 'cast') return this.cast(cmd.arg, cmd.confidence ?? 1);

    const { events, defer } = routeCommand(s, cmd);
    if (!defer) return this.run(events);

    switch (defer) {
      case 'talk': return this.startTalk(cmd.arg);
      case 'guide_to': return this.say(this.wisp.guideTo(s, cmd.arg ?? ''), 'wisp');
      case 'guide_hint': return this.say(this.wisp.hint(s), 'wisp');
      case 'where': return this.say(this.wisp.describe(s), 'wisp');
      case 'help': return this.showHelp();
      case 'repeat': return this.tts.repeat();
      case 'quiet': this.tts.stop(); this.captions.system('หยุดเสียงพูดแล้ว'); return;
      case 'save': return this.saveGame();
      case 'load': return this.loadGame();
      case 'restart': return this.restart();
      case 'noop': return;
      case 'ask_wisp':
      default:
        return this.askWisp(cmd.arg ?? cmd.raw ?? '');
    }
  }

  // ───────────────────────────── การกระทำ ─────────────────────────────

  async walk(dir, steps = 1) {
    const floor = this.state.room.floor;
    const events = this.state.move(dir, steps);
    // เสียงฝีเท้าจริงเล่นเป็นจังหวะ ส่วน event ฝีเท้าใน list ถูกกรองออก
    const walkEvents = events.filter((e) => !(e.type === 'sfx' && e.key.startsWith('step_')));
    const stepCount = events.filter((e) => e.type === 'sfx' && e.key.startsWith('step_')).length;
    if (stepCount) {
      this.steps.walk(floor, stepCount);
      this.captions.sound({ caption: `เสียงฝีเท้าบนพื้น${floorName(floor)} ${stepCount} ก้าว` });
    }
    this.run(walkEvents);
  }

  async cast(spellId, clarity) {
    const spell = getSpell(spellId);
    if (spell) this.captions.system(`ร่ายคาถา ${spell.name}`, 'combat');
    this.run(this.state.castSpell(spellId, clarity));
  }

  async startTalk(spokenName) {
    const here = this.state.npcsHere();
    if (!here.length) return this.say('ตรงนี้ไม่มีใครให้คุยด้วย', 'wisp');
    const npc = spokenName ? (resolveName(spokenName, here, 0.5) ?? here[0]) : here[0];
    this.conversation = { npcId: npc.id, turns: 0 };
    const greet = this.npcs.greet(npc.id);
    this.tts.speak(greet.text, { voice: npc.id });
    this.captions.system(`เริ่มสนทนากับ${npc.name} — พูดต่อได้เลย บอก "ลาก่อน" เพื่อจบการสนทนา`);
    this.run(this.state.markTalked(npc.id));
    // NPC บางคนมอบของหรือสอนคาถาให้ทันทีที่คุยครั้งแรก
    if (npc.gives?.length) {
      for (const itemId of npc.gives) {
        if (!this.state.player.inventory.includes(itemId)) {
          this.state.player.inventory.push(itemId);
          this.say(`${npc.name}ยื่น${getItem(itemId)?.name}ให้`, 'wisp');
        }
      }
    }
    if (npc.teaches) this.run(this.state.learnSpell(npc.teaches));
  }

  async talkTurn(text) {
    const { npcId } = this.conversation;
    const npc = this.state.npcsHere().find((n) => n.id === npcId);
    if (!npc) { this.conversation = null; return; }
    const reply = await this.npcs.reply(npcId, text, this.wisp.contextLine(this.state));
    this.tts.speak(reply.text, { voice: npcId });
    this.conversation.turns++;
    for (const effect of reply.effects) {
      if (effect === 'end') { this.conversation = null; this.captions.system('จบการสนทนา'); }
      else if (effect.startsWith('teach:')) this.run(this.state.learnSpell(effect.slice(6)));
      else if (effect.startsWith('give:')) {
        const itemId = effect.slice(5);
        if (!this.state.player.inventory.includes(itemId)) {
          this.state.player.inventory.push(itemId);
          this.say(`ได้รับ${getItem(itemId)?.name ?? itemId}`, 'wisp');
          this.hud.update(this.state.snapshot());
        }
      }
    }
  }

  async askWisp(question) {
    if (!question) return;
    this.captions.system(`ถามวิสป์: ${question}`);
    const answer = await this.wisp.answer(question, this.state);
    this.say(answer, 'wisp');
  }

  showHelp() {
    this.say(HELP_TEXT, 'wisp');
    this.captions.system(`คีย์ลัด: ${keyboardHelpText()}`);
  }

  saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, this.state.save());
      this.say('บันทึกการเดินทางแล้ว', 'wisp');
    } catch {
      this.say('บันทึกไม่สำเร็จ เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล', 'wisp');
    }
  }

  loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || !this.state.load(raw)) return this.say('ยังไม่มีข้อมูลที่บันทึกไว้', 'wisp');
    this.say('กลับมาที่จุดที่บันทึกไว้แล้ว', 'wisp');
    this.run(this.state.describeRoom());
  }

  restart() {
    if (this.state.over) return this.run(this.state.revive());
    this.state.reset();
    this.npcs.memory.clear();
    this.conversation = null;
    this.say('เริ่มการเดินทางใหม่ตั้งแต่ต้น', 'wisp');
    this.run(this.state.describeRoom());
  }

  say(text, voice = 'narrator') {
    this.tts.speak(text, { voice });
  }

  // ───────────────────────────── แปลงเหตุการณ์เป็นการรับรู้ ─────────────────────────────

  /** @param {Array<object>} events */
  run(events) {
    for (const event of events ?? []) {
      switch (event.type) {
        case 'narrate':
          this.tts.speak(event.text, { voice: event.voice, priority: event.priority, caption: event.caption });
          break;
        case 'sfx':
          this.audio.play(event.key, { angle: event.angle, distance: event.distance });
          this.captions.sound({ caption: event.caption, angle: event.angle, distance: event.distance });
          break;
        case 'ambience':
          this.audio.setAmbience(event.key);
          if (event.caption) this.captions.system(event.caption, 'ambience');
          break;
        case 'haptic':
          this.haptics.play(event.pattern);
          break;
        case 'hud':
          this.hud.update(event.state);
          this.hud.setRadar({ exits: this.state.exitList(), landmarks: this.state.landmarkList() });
          break;
        case 'room':
          this.onRoomChange();
          break;
        case 'combat_start':
          this.onCombatStart(event);
          break;
        case 'enemy_move':
          this.captions.system(`${this.state.enemy?.name} เข้าใกล้ — เหลือ ${Math.round(event.distance)} ก้าว`, 'combat');
          break;
        case 'enemy_hp':
          this.hud.update(this.state.snapshot());
          break;
        case 'boss_phase':
          this.captions.system(event.caption, 'combat');
          this.music.play('boss');
          break;
        case 'bell_ring':
          this.captions.system(event.caption, 'quest');
          break;
        case 'quest_done':
          this.captions.system(event.caption, 'quest');
          break;
        case 'cast':
          break;
        case 'game_over':
          this.captions.system(event.caption, 'combat');
          this.stopEnemyPulse();
          this.music.play('explore');
          break;
        case 'victory':
          this.captions.system(event.caption, 'quest');
          this.stopEnemyPulse();
          this.music.play('explore');
          break;
        default:
          break;
      }
    }
    if (!this.state.inCombat) this.stopEnemyPulse();
    this.hud.update(this.state.snapshot());
  }

  onRoomChange() {
    this.conversation = null;
    const room = this.state.room;
    // จุดสังเกตที่ส่งเสียงต่อเนื่อง เล่นวนพร้อมตำแหน่งจริง
    for (const [id] of this.audio.loops) if (id.startsWith('lm:')) this.audio.stopLoop(id);
    for (const lm of this.state.landmarkList()) {
      if (SUSTAINED_LANDMARKS.test(lm.sound)) {
        this.audio.startLoopKey(`lm:${lm.id}`, lm.sound, { angle: lm.angle, distance: lm.distance, volume: 0.9 });
      }
    }
    this.music.play(room.boss ? 'boss' : room.encounters?.length ? 'tense' : 'explore');
  }

  onCombatStart(event) {
    this.captions.system(event.caption, 'combat');
    this.music.play(event.enemy.boss ? 'boss' : 'tense');
    this.startEnemyPulse();
  }

  /** เสียงศัตรูดังเป็นระยะจากตำแหน่งจริง เพื่อให้ผู้เล่นเล็งด้วยหูได้ตลอดเวลา */
  startEnemyPulse() {
    this.stopEnemyPulse();
    const tick = () => {
      const enemy = this.state.enemy;
      if (!enemy || enemy.hp <= 0) return this.stopEnemyPulse();
      const def = getEnemy(enemy.id);
      const angle = relativeAngle(this.state.facingDir.bearing, enemy.bearing);
      this.audio.play(def.sound, { angle, distance: enemy.distance, volume: 0.7 });
      this.captions.sound({ caption: `${enemy.name} ส่งเสียง`, angle, distance: enemy.distance });
      this.haptics.direction(angle);
      this.enemyPulse = setTimeout(tick, enemy.boss ? 3200 : 2600);
    };
    this.enemyPulse = setTimeout(tick, 1400);
  }

  stopEnemyPulse() {
    clearTimeout(this.enemyPulse);
    this.enemyPulse = null;
  }
}

const SUSTAINED_LANDMARKS = /^landmark_(bell_hum|bell_dead|spring|boil|fire|shrine|stone_hum|wind_hole|void|water|chime|anvil|echo)$/;

function floorName(floor) {
  return { dirt: 'ดิน', wood: 'ไม้', stone: 'หิน', leaves: 'ใบไม้', moss: 'มอสส์', gravel: 'กรวด', ash: 'เถ้า' }[floor] ?? floor;
}

function queryElements() {
  const $ = (id) => document.getElementById(id);
  return {
    app: $('app'), startScreen: $('start-screen'), startButton: $('start-button'),
    captionList: $('caption-list'), roomName: $('room-name'), facing: $('facing'),
    hpBar: $('hp-bar'), hpLabel: $('hp-label'),
    manaBar: $('mana-bar'), manaLabel: $('mana-label'),
    shieldBar: $('shield-bar'), shieldLabel: $('shield-label'),
    spellList: $('spell-list'), itemList: $('item-list'), questText: $('quest-text'),
    enemyPanel: $('enemy-panel'), radar: $('radar'), hapticView: $('haptic-view'),
    micState: $('mic-state'), heard: $('heard'), micButton: $('mic-button'),
    commandForm: $('command-form'), commandInput: $('command-input'),
    settingsButton: $('settings-button'), settingsPanel: $('settings-panel'), closeSettings: $('close-settings'),
    saveButton: $('save-button'), loadButton: $('load-button'), helpButton: $('help-button'),
  };
}

const game = new Game();
window.wiranlaya = game; // เผื่อทดสอบจากคอนโซล
game.boot();
