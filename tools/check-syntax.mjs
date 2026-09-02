/**
 * ตรวจไวยากรณ์ไฟล์ .js/.mjs ทั้งโปรเจกต์ โดยไม่ต้องติดตั้ง dependency ใด ๆ
 * ใช้ `node --check` ซึ่งเพียงแปลงไฟล์เป็นโครงสร้างไวยากรณ์ ไม่ได้รันโค้ด
 */
import { readdir } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SKIP = new Set(['node_modules', '.git', '.github']);

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, out);
    else if (['.js', '.mjs'].includes(extname(path))) out.push(path);
  }
  return out;
}

const files = await walk(process.cwd());
const failures = [];
for (const file of files) {
  try {
    await run(process.execPath, ['--check', file], { timeout: 15000 });
  } catch (err) {
    failures.push(`${relative(process.cwd(), file)}\n${(err.stderr ?? err.message).trim()}`);
  }
}

if (failures.length) {
  console.error(`พบไวยากรณ์ผิด ${failures.length} ไฟล์:\n\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log(`ตรวจไวยากรณ์แล้ว ${files.length} ไฟล์ ผ่านทั้งหมด`);
