/**
 * การตั้งค่าและการเข้าถึง (Accessibility Settings)
 * เก็บค่าไว้ในเครื่องผู้เล่น และนำไปใช้กับทุกระบบทันทีที่เปลี่ยน
 */

const STORAGE_KEY = 'wiranlaya.settings';

export const DEFAULT_SETTINGS = {
  master: 0.9, sfx: 1.0, music: 0.45, voice: 1.0, ambience: 0.8,
  ttsEnabled: true, ttsRate: 1.0,
  hapticsEnabled: true, hapticIntensity: 1.0,
  micMode: 'push',
  assistAim: true,
  showSoundCaptions: true,
  highContrast: false, largeText: false, reduceMotion: false,
  aiEndpoint: '', aiModel: 'claude-sonnet-5', aiKey: '',
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* โหมดส่วนตัวอาจเขียนไม่ได้ */ }
}

/**
 * ผูกการตั้งค่าเข้ากับหน้าจอและระบบต่าง ๆ
 * @param {object} systems { audio, music, tts, haptics, speech, captions, state, ai }
 */
export function bindSettings(settings, systems, root = document) {
  const apply = () => applySettings(settings, systems);

  root.querySelectorAll('[data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    if (!(key in settings)) return;
    if (input.type === 'checkbox') input.checked = Boolean(settings[key]);
    else input.value = settings[key];

    input.addEventListener('input', () => {
      settings[key] = input.type === 'checkbox' ? input.checked
        : input.type === 'range' || input.type === 'number' ? Number(input.value)
        : input.value;
      apply();
      saveSettings(settings);
      const out = root.querySelector(`[data-setting-value="${key}"]`);
      if (out) out.textContent = formatValue(key, settings[key]);
    });

    const out = root.querySelector(`[data-setting-value="${key}"]`);
    if (out) out.textContent = formatValue(key, settings[key]);
  });

  apply();
  return apply;
}

export function applySettings(s, systems) {
  const { audio, music, tts, haptics, speech, captions, state, ai } = systems;
  if (audio?.ready) {
    audio.setVolume('master', s.master);
    audio.setVolume('sfx', s.sfx);
    audio.setVolume('music', s.music);
    audio.setVolume('voice', s.voice);
    audio.setVolume('ambience', s.ambience);
  }
  music?.setEnabled(s.music > 0.01);
  if (tts) { tts.setEnabled(s.ttsEnabled); tts.setRate(s.ttsRate); tts.setVolume(s.voice); }
  if (haptics) { haptics.setEnabled(s.hapticsEnabled); haptics.setIntensity(s.hapticIntensity); }
  if (speech && speech.mode !== s.micMode) speech.setMode(s.micMode);
  captions?.setShowSounds(s.showSoundCaptions);
  if (state) state.assistAim = s.assistAim;
  ai?.configure({ endpoint: s.aiEndpoint || null, model: s.aiModel, apiKey: s.aiKey || null });

  const html = document.documentElement;
  html.classList.toggle('high-contrast', s.highContrast);
  html.classList.toggle('large-text', s.largeText);
  html.classList.toggle('reduce-motion', s.reduceMotion);
}

function formatValue(key, value) {
  if (typeof value === 'number') return key.includes('Rate') || key.includes('Intensity') ? `${value.toFixed(2)}x` : `${Math.round(value * 100)}%`;
  if (typeof value === 'boolean') return value ? 'เปิด' : 'ปิด';
  return String(value);
}
