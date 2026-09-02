/**
 * เซิร์ฟเวอร์สแตติกแบบไม่มี dependency สำหรับพัฒนาเกม
 * ใช้: npm start  →  http://localhost:5173
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../public', import.meta.url)));
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

async function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const target = resolve(join(ROOT, normalize(clean)));
  if (!target.startsWith(ROOT)) return null; // กัน path traversal
  try {
    const info = await stat(target);
    if (info.isDirectory()) return resolvePath(join(clean, 'index.html'));
    return target;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolvePath(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 ไม่พบไฟล์');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  วิรัลยา: เสียงสะท้อน — เซิร์ฟเวอร์พร้อมแล้ว`);
  console.log(`  เปิดเบราว์เซอร์ที่  http://localhost:${PORT}\n`);
  console.log(`  แนะนำ: ใช้ Chrome หรือ Edge เพื่อรองรับการรับเสียงภาษาไทย (Web Speech API)\n`);
});
