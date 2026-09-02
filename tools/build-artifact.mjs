/**
 * รวมเกมทั้งหมดเป็นไฟล์ HTML เดียว สำหรับเผยแพร่เป็นหน้าเว็บที่เล่นได้ทันที
 *
 * ยังคงโครงสร้างโมดูลไว้ในซอร์สโค้ด โดยห่อแต่ละไฟล์เป็นฟังก์ชันในทะเบียนโมดูลเล็ก ๆ
 * (แปลง import/export เป็นการเรียกทะเบียน) จึงไม่ต้องใช้ bundler ภายนอก
 *
 * ใช้: node tools/build-artifact.mjs [ไฟล์ปลายทาง]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { posix, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SRC = posix.join(ROOT.replace(/\\/g, '/'), 'public/src');

/** ลำดับไม่สำคัญ (โหลดแบบ lazy) แต่เรียงตามชั้นเพื่อให้อ่านง่าย */
const MODULES = [
  'core/rng.js', 'core/text.js', 'core/event-bus.js',
  'world/spells.js', 'world/world-data.js',
  'game/game-state.js', 'game/commands.js', 'game/command-router.js',
  'ai/ai-client.js', 'ai/wisp.js', 'ai/npc-brain.js',
  'audio/synth-bank.js', 'audio/audio-engine.js', 'audio/music.js',
  'audio/footsteps.js', 'audio/tts.js',
  'haptics/haptics.js', 'input/speech-input.js', 'input/keyboard.js',
  'ui/captions.js', 'ui/hud.js', 'ui/settings.js',
  'main.js',
];

const IMPORT_RE = /import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';?/g;
const EXPORT_DECL_RE = /^export\s+(async\s+)?(function|class|const|let|var)\s+([A-Za-z0-9_$]+)/gm;

/** แปลงไฟล์โมดูลหนึ่งไฟล์เป็นรายการในทะเบียน */
function transform(key, source) {
  const dir = posix.dirname(key);
  const exports = [];
  for (const match of source.matchAll(EXPORT_DECL_RE)) exports.push(match[3]);

  const body = source
    .replace(IMPORT_RE, (_, names, specifier) => {
      const target = posix.normalize(posix.join(dir, specifier)).replace(/^\.\//, '');
      return `const {${names.trim()}} = __req('${target}');`;
    })
    .replace(/^export\s+/gm, '');

  return `__def(${JSON.stringify(key)}, function () {\n${body}\nreturn { ${exports.join(', ')} };\n});`;
}

const registry = `
// ทะเบียนโมดูลขนาดเล็ก แทนระบบ ES module ตอนรวมเป็นไฟล์เดียว
const __defs = new Map();
const __cache = new Map();
function __def(name, factory) { __defs.set(name, factory); }
function __req(name) {
  if (__cache.has(name)) return __cache.get(name);
  const factory = __defs.get(name);
  if (!factory) throw new Error('ไม่พบโมดูล ' + name);
  const exportsObj = factory();
  __cache.set(name, exportsObj);
  return exportsObj;
}
`;

const parts = [];
for (const key of MODULES) {
  const source = await readFile(posix.join(SRC, key), 'utf8');
  parts.push(transform(key, source));
}

const css = await readFile(posix.join(ROOT.replace(/\\/g, '/'), 'public/styles/main.css'), 'utf8');
const html = await readFile(posix.join(ROOT.replace(/\\/g, '/'), 'public/index.html'), 'utf8');

const bodyMarkup = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'))
  .replace(/\s*<script type="module"[\s\S]*?<\/script>/g, '')
  .trim();

const fontImport = "@import url('https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap');\n";

const out = `<title>วิรัลยา: เสียงสะท้อน</title>
<style>
${fontImport}${css}
</style>

${bodyMarkup}

<script>
${registry}
${parts.join('\n\n')}

// เริ่มเกม
__req('main.js');
<\/script>
`;

const dest = process.argv[2] ?? posix.join(ROOT.replace(/\\/g, '/'), 'dist/wiranlaya.html');
await writeFile(dest, out, 'utf8');
console.log(`สร้างไฟล์เดียวเสร็จแล้ว: ${dest} (${(out.length / 1024).toFixed(0)} KB)`);
