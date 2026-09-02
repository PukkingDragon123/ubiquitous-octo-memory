/**
 * ส่วนแสดงผลภาพ (HUD)
 *
 * ออกแบบให้ผู้พิการทางการได้ยินเล่นจบได้ด้วยตาอย่างเดียว:
 * เรดาร์บอกทิศเสียง แถบพลัง รายการคาถาพร้อมเลขปุ่ม และตัวแสดงจังหวะการสั่น
 */

import { getSpell } from '../world/spells.js';
import { getItem } from '../world/world-data.js';
import { arrowFor, directionWord } from './captions.js';

export class Hud {
  constructor(elements) {
    this.el = elements;
    this.state = null;
    this.radarData = { exits: [], enemy: null, landmarks: [] };
  }

  update(state) {
    this.state = state;
    const { player } = state;
    this.setBar('hp', player.hp, player.maxHp);
    this.setBar('mana', player.mana, player.maxMana);
    this.setBar('shield', player.shield, player.maxHp, true);

    if (this.el.roomName) this.el.roomName.textContent = state.room.name;
    if (this.el.facing) this.el.facing.textContent = `หันหน้าไปทาง${state.facing.th}`;
    if (this.el.questText) this.el.questText.textContent = state.quest ?? 'จบเนื้อเรื่องแล้ว';

    if (this.el.spellList) {
      this.el.spellList.innerHTML = '';
      player.spells.forEach((id, i) => {
        const spell = getSpell(id);
        if (!spell) return;
        const li = document.createElement('li');
        li.innerHTML = `<kbd>${i + 1}</kbd> <b>${spell.name}</b> <span class="muted">${spell.element} · ${spell.cost} กังวาน</span>`;
        li.classList.toggle('unaffordable', player.mana < spell.cost);
        this.el.spellList.appendChild(li);
      });
    }

    if (this.el.itemList) {
      this.el.itemList.innerHTML = '';
      for (const id of player.inventory) {
        const item = getItem(id);
        const li = document.createElement('li');
        li.textContent = item?.name ?? id;
        this.el.itemList.appendChild(li);
      }
      if (!player.inventory.length) this.el.itemList.innerHTML = '<li class="muted">ย่ามว่าง</li>';
    }

    if (this.el.enemyPanel) {
      if (state.enemy) {
        const angle = normalize(state.enemy.bearing - bearingOf(state.facing.key));
        this.el.enemyPanel.hidden = false;
        this.el.enemyPanel.innerHTML =
          `<h3>${state.enemy.name}</h3>` +
          `<div class="enemy-dir">${arrowFor(angle)} ${directionWord(angle)} · ห่าง ${Math.round(state.enemy.distance)} ก้าว</div>` +
          `<div class="bar bar-enemy"><span style="width:${Math.max(0, (state.enemy.hp / state.enemy.maxHp) * 100)}%"></span></div>` +
          `<div class="muted">พลังชีวิต ${Math.max(0, state.enemy.hp)} / ${state.enemy.maxHp}</div>`;
      } else {
        this.el.enemyPanel.hidden = true;
      }
    }

    this.drawRadar();
  }

  setBar(name, value, max, hideWhenZero = false) {
    const bar = this.el[`${name}Bar`];
    const label = this.el[`${name}Label`];
    if (!bar) return;
    const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
    bar.style.width = `${pct}%`;
    bar.parentElement.setAttribute('aria-valuenow', String(Math.round(value)));
    bar.parentElement.setAttribute('aria-valuemax', String(Math.round(max)));
    if (label) label.textContent = `${Math.round(value)} / ${Math.round(max)}`;
    if (hideWhenZero && bar.parentElement.parentElement) {
      bar.parentElement.parentElement.hidden = value <= 0;
    }
  }

  /** ข้อมูลสำหรับเรดาร์ — เรียกจาก main เมื่อเข้าห้องใหม่ */
  setRadar({ exits = [], landmarks = [], enemy = null }) {
    this.radarData = { exits, landmarks, enemy };
    this.drawRadar();
  }

  drawRadar() {
    const canvas = this.el.radar;
    if (!canvas?.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;
    const cx = w / 2; const cy = h / 2; const R = Math.min(w, h) / 2 - 14;
    const css = getComputedStyle(document.documentElement);
    const fg = css.getPropertyValue('--fg').trim() || '#e8e6e3';
    const accent = css.getPropertyValue('--accent').trim() || '#7ad7c4';
    const danger = css.getPropertyValue('--danger').trim() || '#ff6b6b';

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = fg; ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;

    // ผู้เล่นอยู่กลางเสมอ หันขึ้นด้านบน
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx - 8, cy + 9); ctx.lineTo(cx + 8, cy + 9);
    ctx.closePath(); ctx.fill();

    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    for (const exit of this.radarData.exits) {
      const [x, y] = polar(cx, cy, R * 0.85, exit.angle);
      ctx.fillStyle = fg; ctx.globalAlpha = exit.visited ? 1 : 0.6;
      ctx.fillText('🚪', x, y);
      ctx.globalAlpha = 1;
    }
    for (const lm of this.radarData.landmarks) {
      const [x, y] = polar(cx, cy, R * 0.5, lm.angle);
      ctx.globalAlpha = 0.75;
      ctx.fillText('◆', x, y);
      ctx.globalAlpha = 1;
    }
    const enemy = this.state?.enemy;
    if (enemy) {
      const angle = normalize(enemy.bearing - bearingOf(this.state.facing.key));
      const [x, y] = polar(cx, cy, R * Math.min(1, enemy.distance / 7), angle);
      ctx.fillStyle = danger;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** แสดงจังหวะการสั่นเป็นภาพ สำหรับเครื่องที่สั่นไม่ได้หรือผู้เล่นที่ไม่ได้ยิน */
  showHaptic({ pattern, steps }) {
    const el = this.el.hapticView;
    if (!el) return;
    el.innerHTML = `<span class="haptic-name">${pattern}</span>`;
    steps.forEach((ms, i) => {
      const span = document.createElement('span');
      span.className = i % 2 === 0 ? 'haptic-on' : 'haptic-off';
      span.style.width = `${Math.max(4, Math.min(90, ms / 4))}px`;
      el.appendChild(span);
    });
    el.classList.remove('pulse');
    void el.offsetWidth; // บังคับให้แอนิเมชันเริ่มใหม่
    el.classList.add('pulse');
  }

  setMicState(state, text) {
    if (!this.el.micState) return;
    this.el.micState.dataset.state = state;
    this.el.micState.textContent = text;
  }

  setHeard(text, isFinal) {
    if (!this.el.heard) return;
    this.el.heard.textContent = text ? `ได้ยินว่า: ${text}` : '';
    this.el.heard.classList.toggle('interim', !isFinal);
  }
}

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
}

function normalize(a) { return ((a % 360) + 540) % 360 - 180; }

function bearingOf(key) {
  return { north: 0, east: 90, south: 180, west: 270 }[key] ?? 0;
}
