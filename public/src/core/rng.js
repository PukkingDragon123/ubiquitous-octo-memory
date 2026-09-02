/** ตัวสุ่มแบบกำหนด seed ได้ เพื่อให้เทสต์ทำซ้ำผลลัพธ์เดิมได้ */
export function createRng(seed = 1337) {
  let state = seed >>> 0 || 1;
  const next = () => {
    // xorshift32
    state ^= state << 13; state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5; state >>>= 0;
    return state / 0x100000000;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}
