/**
 * ตัวส่งคำสั่งกลาง — แปลงเจตนาเป็นการกระทำในเอนจิน
 *
 * แยกออกมาเป็นโมดูลบริสุทธิ์ (ไม่แตะ DOM) เพื่อให้ทั้งตัวเกมจริงและชุดทดสอบ
 * เดินผ่านเส้นทางเดียวกันทุกคำสั่ง คำสั่งที่ต้องใช้ AI หรือ UI จะถูก "ส่งต่อ" (defer)
 */

import { resolveName } from './commands.js';
import { getItem } from '../world/world-data.js';

/** เจตนาที่ต้องให้ชั้นบน (AI/UI) จัดการเอง */
export const DEFERRED_INTENTS = new Set([
  'talk', 'guide_to', 'guide_hint', 'where', 'help', 'repeat',
  'quiet', 'save', 'load', 'restart', 'ask_wisp', 'noop',
]);

/**
 * @param {import('./game-state.js').GameState} state
 * @param {{intent:string, arg?:any, steps?:number, confidence?:number}} cmd
 * @returns {{events: Array<object>, defer: string|null}}
 */
export function routeCommand(state, cmd) {
  const steps = cmd.steps ?? 1;
  const clarity = cmd.confidence ?? 1;

  switch (cmd.intent) {
    case 'move_forward': return done(state.move('forward', steps));
    case 'move_back': return done(state.move('back', steps));
    case 'move_left': return done(state.move('left', steps));
    case 'move_right': return done(state.move('right', steps));
    case 'turn_left': return done(state.turnTo(-1));
    case 'turn_right': return done(state.turnTo(1));
    case 'turn_around': return done([...state.turnTo(1), ...state.turnTo(1)]);
    case 'face_north': return done(state.faceDirection('north'));
    case 'face_south': return done(state.faceDirection('south'));
    case 'face_east': return done(state.faceDirection('east'));
    case 'face_west': return done(state.faceDirection('west'));
    case 'face_sound': return done(state.faceSound());
    case 'look': return done(state.describeRoom());
    case 'status': return done(state.statusReport());
    case 'inventory': return done(state.listInventory());
    case 'spell_list': return done(state.listSpells());
    case 'pick_up': return done(state.pickUp());
    case 'ring_bell': return done(state.ringBell());
    case 'flee': return done(state.flee());
    case 'cast': return done(state.castSpell(cmd.arg, clarity));
    case 'use_item': return done(state.useItem(resolveItemId(state, cmd.arg)));
    default:
      return { events: [], defer: DEFERRED_INTENTS.has(cmd.intent) ? cmd.intent : 'ask_wisp' };
  }
}

function done(events) { return { events, defer: null }; }

/** แปลงชื่อของที่ผู้เล่นพูดเป็นรหัสของในย่าม */
export function resolveItemId(state, spoken) {
  const inventory = state.player.inventory.map((id) => ({ id, name: getItem(id)?.name ?? id }));
  if (!inventory.length) return spoken ?? '';
  const hit = spoken ? resolveName(spoken, inventory, 0.5) : inventory[0];
  return (hit ?? inventory[0]).id;
}
