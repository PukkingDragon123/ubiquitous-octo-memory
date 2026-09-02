/**
 * โลก "วิรัลยา" (Wiranlaya) — ดินแดนที่ทุกสิ่งดำรงอยู่ได้ด้วยเสียง
 *
 * เรื่องย่อ: เมื่อ "มหาเงียบ" เริ่มกลืนเสียงของโลกไปทีละอย่าง หมู่บ้านกังวาน
 * จึงส่ง "ผู้ฟัง" คนสุดท้าย — ตัวผู้เล่น ซึ่งมองไม่เห็นแต่ได้ยินได้ลึกกว่าใคร —
 * ออกเดินทางไปคืนเสียงให้ระฆังทั้งสามใบ ก่อนที่โลกจะเงียบสนิทตลอดกาล
 *
 * ทุกสถานที่ ตัวละคร และสิ่งมีชีวิตในไฟล์นี้เป็นงานสร้างสรรค์ใหม่ทั้งหมด
 * พิกัด: x = ตะวันออก(+) / ตะวันตก(-), y = เหนือ(+) / ใต้(-) หน่วยเป็น "ก้าว"
 */

import { ELEMENTS } from './spells.js';

export const DIRECTIONS = {
  north: { th: 'เหนือ', dx: 0, dy: 1, bearing: 0 },
  east: { th: 'ตะวันออก', dx: 1, dy: 0, bearing: 90 },
  south: { th: 'ใต้', dx: 0, dy: -1, bearing: 180 },
  west: { th: 'ตะวันตก', dx: -1, dy: 0, bearing: 270 },
};

export const DIRECTION_ORDER = ['north', 'east', 'south', 'west'];

/** ห้อง/สถานที่ทั้งหมด */
export const ROOMS = [
  {
    id: 'village_square',
    name: 'ลานระฆังหมู่บ้านกังวาน',
    pos: [0, 0],
    ambience: 'amb_village',
    intro: 'ลานดินกว้าง กลางลานมีเสาระฆังเก่าที่ตอนนี้เงียบสนิท ลมพัดผ่านใบมะขามเบา ๆ มีเสียงคนคุยกันอยู่ไกล ๆ',
    caption: 'ลานหมู่บ้าน กลางวัน เสาระฆังไร้เสียง',
    landmarks: [
      { id: 'silent_bell', name: 'เสาระฆังใหญ่', offset: [0, 2, 0], sound: 'landmark_bell_hum', desc: 'ระฆังใบใหญ่ที่ไม่ส่งเสียงมาสามฤดูแล้ว' },
      { id: 'well', name: 'บ่อน้ำ', offset: [-3, -1, 0], sound: 'landmark_water', desc: 'บ่อน้ำหินก้อนกลม มีเสียงหยดน้ำสะท้อนขึ้นมา' },
    ],
    exits: { north: 'village_gate', west: 'malee_hut', east: 'bell_forge' },
    floor: 'dirt',
    safe: true,
  },
  {
    id: 'malee_hut',
    name: 'กระท่อมยายมาลี',
    pos: [-2, 0],
    ambience: 'amb_hut',
    intro: 'กลิ่นสมุนไพรตากแห้งลอยมาแต่ไกล พื้นไม้กระดานลั่นเอี๊ยดใต้ฝ่าเท้า มีเสียงหม้อดินเดือดปุด ๆ',
    caption: 'ในกระท่อมไม้ กลิ่นสมุนไพร หม้อยาเดือด',
    landmarks: [
      { id: 'herb_pot', name: 'หม้อยา', offset: [1, 1, 0], sound: 'landmark_boil', desc: 'หม้อดินเผาบนเตาถ่าน' },
    ],
    exits: { east: 'village_square' },
    npcs: ['malee'],
    floor: 'wood',
    safe: true,
  },
  {
    id: 'bell_forge',
    name: 'โรงหล่อระฆังของนายกังวาล',
    pos: [2, 0],
    ambience: 'amb_forge',
    intro: 'ความร้อนแผ่มาปะทะหน้า เสียงค้อนกระทบทองสัมฤทธิ์ดังเป็นจังหวะ ทุกครั้งที่ค้อนลง เสียงจะสะท้อนกลับมาจากเพดานสูง',
    caption: 'โรงหล่อโลหะ ไฟเตาสีส้ม เสียงค้อนเป็นจังหวะ',
    landmarks: [
      { id: 'anvil', name: 'ทั่งตีเหล็ก', offset: [0, 1, 0], sound: 'landmark_anvil', desc: 'ทั่งเหล็กดำที่ถูกใช้มานับร้อยปี' },
      { id: 'forge_fire', name: 'เตาหลอม', offset: [2, 2, 0], sound: 'landmark_fire', desc: 'เตาหลอมที่ลุกโชนตลอดเวลา' },
    ],
    exits: { west: 'village_square' },
    npcs: ['kangwan'],
    floor: 'stone',
    safe: true,
  },
  {
    id: 'village_gate',
    name: 'ประตูเหนือหมู่บ้าน',
    pos: [0, 2],
    ambience: 'amb_gate',
    intro: 'เสาไม้สองต้นปักขนาบทาง มีกระดิ่งเล็กแขวนไว้ให้คนเดินทางเคาะบอกลา ข้างหน้าคือทางดินที่เสียงเปลี่ยนเป็นกรอบแกรบของใบไม้',
    caption: 'ประตูหมู่บ้าน กระดิ่งเล็กแขวนอยู่ ทางดินทอดสู่ป่า',
    landmarks: [
      { id: 'farewell_chime', name: 'กระดิ่งอำลา', offset: [1, 0, 1], sound: 'landmark_chime', desc: 'กระดิ่งทองเหลืองใบจิ๋ว' },
    ],
    exits: { south: 'village_square', north: 'forest_edge' },
    npcs: ['pin'],
    floor: 'dirt',
    safe: true,
  },
  {
    id: 'forest_edge',
    name: 'ชายป่าเสียงกระซิบ',
    pos: [0, 4],
    ambience: 'amb_forest',
    intro: 'ต้นไม้สูงบังลมจนเสียงรอบตัวทึบลง ใบไม้เสียดสีกันเป็นเสียงกระซิบที่แทบจะเป็นคำพูด',
    caption: 'ชายป่ามืดครึ้ม ใบไม้ไหวเหมือนเสียงกระซิบ',
    landmarks: [
      { id: 'old_shrine', name: 'ศาลเก่า', offset: [-2, 1, 0], sound: 'landmark_shrine', desc: 'ศาลไม้เล็กมีถ้วยน้ำวางอยู่' },
    ],
    exits: { south: 'village_gate', north: 'forest_fork' },
    encounters: ['shadeling'],
    encounterChance: 0.45,
    floor: 'leaves',
  },
  {
    id: 'forest_fork',
    name: 'สามแพร่งกลางป่า',
    pos: [0, 6],
    ambience: 'amb_forest_deep',
    intro: 'ทางแยกสามทาง เสียงน้ำไหลมาจากทางตะวันตก เสียงลมดูดเข้าโพรงหินมาจากทางตะวันออก ส่วนทางเหนือ… เงียบผิดปกติ',
    caption: 'ทางแยกสามทาง เสียงต่างกันในแต่ละทิศ',
    landmarks: [
      { id: 'marker_stone', name: 'หินบอกทาง', offset: [0, 0, 0], sound: 'landmark_stone_hum', desc: 'หินสลักอักษรกังวาน สั่นเบา ๆ เมื่อแตะ' },
    ],
    exits: { south: 'forest_edge', west: 'moss_hollow', east: 'cave_mouth', north: 'tower_base' },
    encounters: ['shadeling'],
    encounterChance: 0.3,
    floor: 'leaves',
  },
  {
    id: 'moss_hollow',
    name: 'แอ่งมอสส์',
    pos: [-2, 6],
    ambience: 'amb_water',
    intro: 'พื้นนุ่มจนฝีเท้าแทบไม่มีเสียง น้ำซึมจากผนังหินหยดลงแอ่งเป็นจังหวะช้า ๆ ที่นี่คือที่ที่เสียงมาพักผ่อน',
    caption: 'แอ่งน้ำในหินมอสส์เขียว น้ำหยดเป็นจังหวะ',
    landmarks: [
      { id: 'spring', name: 'ตาน้ำ', offset: [0, 1, 0], sound: 'landmark_spring', desc: 'ตาน้ำใสที่คืนพลังกังวาน' },
    ],
    items: ['echo_flask'],
    exits: { east: 'forest_fork' },
    floor: 'moss',
    safe: true,
  },
  {
    id: 'cave_mouth',
    name: 'ปากถ้ำสะท้อน',
    pos: [2, 6],
    ambience: 'amb_cave',
    intro: 'ทุกเสียงที่คุณเปล่งออกไปวิ่งกลับมาช้ากว่าที่ควรจะเป็นครึ่งจังหวะ อากาศเย็นไหลออกมาจากปากถ้ำ',
    caption: 'ปากถ้ำหินปูน เสียงสะท้อนก้อง ลมเย็นพัดออก',
    landmarks: [
      { id: 'echo_wall', name: 'ผนังสะท้อน', offset: [0, 2, 0], sound: 'landmark_echo', desc: 'ผนังหินโค้งที่สะท้อนเสียงกลับได้แม่นยำ' },
    ],
    exits: { west: 'forest_fork', east: 'cave_hall' },
    encounters: ['gnawer'],
    encounterChance: 0.35,
    floor: 'stone',
  },
  {
    id: 'cave_hall',
    name: 'ห้องโถงกังวาน',
    pos: [4, 6],
    ambience: 'amb_cave_hall',
    intro: 'เพดานสูงจนเสียงฝีเท้าลอยขึ้นไปแล้วหายไปนาน กลางห้องมีบางอย่างที่ดูดเสียงเข้าไปเงียบ ๆ',
    caption: 'ห้องโถงถ้ำขนาดใหญ่ ตรงกลางมีเงาดำเคลื่อนไหว',
    landmarks: [
      { id: 'first_bell', name: 'ระฆังใบแรก', offset: [0, 3, 0], sound: 'landmark_bell_dead', desc: 'ระฆังสัมฤทธิ์ใบแรกในสามใบ ผิวเย็นเฉียบ' },
    ],
    exits: { west: 'cave_mouth' },
    encounters: ['gnawer', 'stone_husk'],
    encounterChance: 0.6,
    bell: 'first_bell',
    floor: 'stone',
  },
  {
    id: 'tower_base',
    name: 'ฐานหอระฆังร้าง',
    pos: [0, 8],
    ambience: 'amb_ruin',
    intro: 'เศษหินกองอยู่รอบฐานหอ ลมพัดผ่านช่องหน้าต่างสูงเป็นเสียงหวีดยาว บันไดวนขึ้นไปทางเหนือ',
    caption: 'ซากหอระฆังหิน บันไดวนขึ้นด้านบน',
    landmarks: [
      { id: 'stair', name: 'บันไดวน', offset: [0, 2, 1], sound: 'landmark_wind_hole', desc: 'บันไดหินสึกกร่อน' },
    ],
    exits: { south: 'forest_fork', north: 'tower_top' },
    encounters: ['bell_bat'],
    encounterChance: 0.4,
    floor: 'gravel',
  },
  {
    id: 'tower_top',
    name: 'ยอดหอระฆัง',
    pos: [0, 10],
    ambience: 'amb_high_wind',
    intro: 'ลมแรงจนแทบได้ยินอย่างอื่นไม่ชัด แต่ตรงนี้เสียงเดินทางได้ไกลที่สุดในวิรัลยา และมีเสียงหนึ่งรออยู่',
    caption: 'ยอดหอกลางแจ้ง ลมแรง มองเห็นทั่วป่า',
    landmarks: [
      { id: 'second_bell', name: 'ระฆังใบที่สอง', offset: [0, 1, 2], sound: 'landmark_bell_dead', desc: 'ระฆังใบที่สอง แขวนอยู่บนคานที่ผุแล้ว' },
    ],
    exits: { south: 'tower_base', north: 'silence_gate' },
    npcs: ['arin'],
    bell: 'second_bell',
    floor: 'stone',
  },
  {
    id: 'silence_gate',
    name: 'ประตูแห่งความเงียบ',
    pos: [0, 12],
    ambience: 'amb_void',
    intro: 'ก้าวข้ามเส้นนี้แล้วเสียงฝีเท้าของคุณจะหายไปครึ่งหนึ่ง แม้แต่เสียงหายใจก็ถูกดูดเข้าไปในความมืด',
    caption: 'ทางเดินที่เสียงหายไป ขอบเขตของมหาเงียบ',
    landmarks: [
      { id: 'void_arch', name: 'ซุ้มประตูดำ', offset: [0, 2, 0], sound: 'landmark_void', desc: 'ซุ้มหินที่ไม่สะท้อนเสียงใด ๆ กลับมาเลย' },
    ],
    exits: { south: 'tower_top', north: 'heart_of_silence' },
    encounters: ['shadeling', 'stone_husk'],
    encounterChance: 0.5,
    floor: 'ash',
  },
  {
    id: 'heart_of_silence',
    name: 'ใจกลางมหาเงียบ',
    pos: [0, 14],
    ambience: 'amb_boss',
    intro: 'ที่นี่ไม่มีเสียงใดเป็นของตัวเอง ทุกอย่างถูกยืมมาแล้วกลืนหายไป และตรงกลางนั้น มีบางสิ่งกำลังฟังคุณอยู่',
    caption: 'ห้องโล่งไร้เสียง ตรงกลางมีร่างสีดำสนิทหายใจช้า ๆ',
    landmarks: [
      { id: 'third_bell', name: 'ระฆังใบสุดท้าย', offset: [0, 4, 0], sound: 'landmark_bell_dead', desc: 'ระฆังใบที่สาม ถูกโซ่เงาพันไว้' },
    ],
    exits: { south: 'silence_gate' },
    boss: 'maha_ngiap',
    bell: 'third_bell',
    floor: 'ash',
  },
];

/** ตัวละคร NPC ที่ขับเคลื่อนด้วย AI (มีสมองสำรองในเครื่องเมื่อไม่มี API) */
export const NPCS = [
  {
    id: 'malee',
    name: 'ยายมาลี',
    role: 'หมอยาประจำหมู่บ้าน',
    voice: { pitch: 1.25, rate: 0.92 },
    persona: 'หญิงชราใจดี พูดช้า ชอบเปรียบเทียบทุกอย่างกับการต้มยา เป็นห่วงผู้เล่นเหมือนหลานแท้ ๆ',
    knowledge: [
      'ยายมาลีปรุง "น้ำกังวาน" จากรากไม้ที่แอ่งมอสส์ทางตะวันตกของสามแพร่ง',
      'มหาเงียบเริ่มกลืนเสียงตั้งแต่ระฆังใบแรกในถ้ำหยุดดัง',
      'ถ้าพลังชีวิตเหลือน้อย ให้ร่ายคาถาแสงสมาน หรือกลับมาหายายมาลี',
    ],
    greeting: 'อ้าว หลานเอ๊ย มานี่มา ยายได้ยินฝีเท้าตั้งแต่ปลายซอยแล้ว',
    farewell: 'ไปดี ๆ นะหลาน ฟังให้ดีก่อนก้าว',
    gives: ['echo_flask'],
    topics: {
      'ยา|รักษา|เจ็บ|แผล': 'ยายต้มน้ำกังวานไว้ให้แล้ว ดื่มแล้วแผลจะสมานเหมือนเสียงที่กลับมาเข้าที่',
      'มหาเงียบ|ความเงียบ': 'อย่าไปเรียกชื่อมันดัง ๆ หลาน มันมาตามเสียงคนที่กลัว ถ้าจะสู้ ต้องพูดคาถาให้มั่นคง',
      'ระฆัง': 'ระฆังสามใบคือหัวใจของวิรัลยา ใบแรกในถ้ำ ใบสองบนหอ ใบสามอยู่กับมันเอง',
      'วิสป์|ภูต': 'เจ้าภูตดวงนั้นเหรอ มันตามหลานมาตั้งแต่เกิด แค่หลานเพิ่งได้ยินมันชัดตอนนี้เอง',
    },
  },
  {
    id: 'kangwan',
    name: 'นายกังวาล',
    role: 'ช่างหล่อระฆัง',
    voice: { pitch: 0.75, rate: 1.0 },
    persona: 'ชายวัยกลางคนเสียงทุ้ม พูดสั้น ตรงไปตรงมา ภูมิใจในงานฝีมือ ไม่ค่อยพูดเรื่องความรู้สึก',
    knowledge: [
      'นายกังวาลหล่อระฆังใบที่สองด้วยมือตัวเอง เมื่อสามสิบปีก่อน',
      'ระฆังจะดังอีกครั้งได้ ต้องมีคนเปล่งคาถาที่ถูกธาตุใส่มันตรง ๆ',
      'ค้างคาวกระดิ่งบนหอกลัวคาถาสายลมวน ส่วนซากหินคำรามต้องใช้คาถาค้อนกังวานเท่านั้น',
    ],
    teaches: 'toll_hammer',
    greeting: 'มาแล้วหรือ ยืนห่างเตาหน่อย ความร้อนมันไม่เลือกคน',
    farewell: 'ระวังตัว เสียงค้อนข้าจะดังรอเจ้าอยู่',
    topics: {
      'ระฆัง|หล่อ|โลหะ': 'ระฆังไม่ได้ดังเพราะโลหะ มันดังเพราะมีคนตั้งใจฟัง เจ้าไปเคาะมันด้วยคาถาสิ',
      'คาถา|เวท': 'ข้าไม่ใช่นักเวท แต่ข้ารู้ว่าเสียงที่มั่นคงกินเนื้อโลหะได้ลึกกว่าเสียงที่สั่น',
      'ค้างคาว|หอ': 'บนหอมีค้างคาวกระดิ่ง มันบินตามเสียง ใช้ลมตีให้มันร่วงก่อน',
      'อาวุธ|ดาบ': 'เจ้าไม่ต้องใช้ดาบ ปากเจ้าคมกว่าอยู่แล้ว',
      'ค้อนกังวาน|ซากหิน|หิน': 'ข้าสอนเจ้าเปล่งเสียงแบบค้อนตีระฆังแล้ว เจอของแข็งเมื่อไหร่ ใช้ค้อนกังวาน มันร้าวแน่',
    },
  },
  {
    id: 'pin',
    name: 'ปิ่น',
    role: 'เด็กส่งข่าวประจำประตูเหนือ',
    voice: { pitch: 1.5, rate: 1.1 },
    persona: 'เด็กอายุสิบขวบ พูดเร็ว ตื่นเต้นง่าย ชอบเล่าข่าวลือเกินจริงแต่มีเบาะแสจริงปนอยู่',
    knowledge: [
      'ปิ่นเห็นเงาดำเคลื่อนที่ในป่าตอนพลบค่ำ',
      'ทางเหนือของสามแพร่งคือหอระฆังร้าง ไม่มีใครกล้าขึ้นไปมาสองปีแล้ว',
    ],
    greeting: 'พี่! พี่จะไปป่าจริง ๆ เหรอ ผมเล่าให้ฟังก่อนนะ',
    farewell: 'พี่กลับมาเล่าให้ฟังด้วยนะ!',
    topics: {
      'ป่า|เงา': 'ในป่ามีเงาที่ไม่มีเสียงครับ! ผมเห็นมันเดินผ่านแล้วใบไม้ไม่ขยับเลยสักใบ',
      'หอ|ระฆัง': 'หอระฆังร้างอยู่เหนือสามแพร่งครับ ข้างบนมีลุงคนหนึ่ง… แต่คนบอกว่าลุงตายไปแล้วนะ',
      'วิสป์': 'ภูตของพี่สวยจัง มันส่องแสงตอนพี่พูดด้วย',
    },
  },
  {
    id: 'arin',
    name: 'อาริน',
    role: 'ผู้ฟังรุ่นก่อน (วิญญาณค้าง)',
    voice: { pitch: 0.95, rate: 0.85 },
    persona: 'วิญญาณของนักเดินทางที่ล้มเหลวเมื่อสามสิบปีก่อน พูดเป็นปริศนา เสียงมีเอคโค เศร้าแต่เมตตา',
    knowledge: [
      'อารินคือผู้ฟังคนก่อนที่ไปไม่ถึงระฆังใบที่สาม',
      'มหาเงียบไม่ได้เกลียดเสียง มันแค่ไม่เคยมีเสียงเป็นของตัวเอง',
      'คาถาวิรัลประกายต้องใช้เสียงจากความทรงจำที่ผู้ร่ายรักที่สุด',
    ],
    greeting: 'อีกคนแล้วหรือ… เข้ามาใกล้ ๆ สิ ลมบนนี้กลืนคำพูดเก่ง',
    farewell: 'ถ้าเจ้าไปถึงจุดที่ข้าไปไม่ถึง ช่วยตะโกนชื่อข้าสักครั้ง',
    teaches: 'wiral_blaze',
    topics: {
      'วิรัลประกาย|คาถาสูงสุด': 'คาถานั้นไม่ได้อยู่ในตำรา มันอยู่ในเสียงที่เจ้าคิดถึงที่สุด ข้ามอบมันให้เจ้าแล้ว',
      'มหาเงียบ': 'มันไม่ได้ชั่วร้าย มันแค่หิว มันไม่เคยได้ยินเสียงของตัวเองเลยสักครั้ง',
      'ตาย|วิญญาณ': 'ข้าไม่ได้ตายหรอก ข้าแค่เบาลงจนคนไม่ได้ยิน',
      'ระฆัง': 'ตีใบแรกให้ตื่น ใบสองให้จำ ใบสามให้อภัย',
    },
  },
];

/** สิ่งมีชีวิตของวิรัลยา — ออกแบบใหม่ทั้งหมด */
export const ENEMIES = [
  {
    id: 'shadeling',
    name: 'เงาไร้เสียง',
    element: ELEMENTS.SHADE,
    hp: 42, attack: 9, defense: 2, speed: 1.0,
    sound: 'enemy_shadeling', footstep: 'step_soft',
    caption: 'เงาบางร่างหนึ่งลื่นไหลบนพื้น ไม่มีเสียงฝีเท้า',
    description: 'ร่างแบนราบที่เคลื่อนโดยไม่ทำให้ใบไม้ขยับ มันกลัวแสงและเสียงที่ชัดเจน',
    tells: ['อากาศรอบตัวเย็นลงอย่างกะทันหัน', 'เสียงรอบข้างเบาลงราวกับถูกดูด'],
    loot: 'shade_dust',
  },
  {
    id: 'gnawer',
    name: 'อสูรกลืนเสียง',
    element: ELEMENTS.ROOT,
    hp: 60, attack: 13, defense: 5, speed: 0.8,
    sound: 'enemy_gnawer', footstep: 'step_heavy',
    caption: 'สัตว์ตัวหนาปกคลุมด้วยหินงอก กำลังเคี้ยวอะไรบางอย่าง',
    description: 'สัตว์ถ้ำที่กัดกินคลื่นเสียงเป็นอาหาร ยิ่งคุณเงียบ มันยิ่งหาคุณไม่เจอ',
    tells: ['เสียงเคี้ยวกรอบ ๆ ดังจากพื้นถ้ำ', 'หินร่วงจากเพดานเป็นชุด'],
    loot: 'stone_chip',
  },
  {
    id: 'bell_bat',
    name: 'ค้างคาวกระดิ่ง',
    element: ELEMENTS.GALE,
    hp: 30, attack: 11, defense: 1, speed: 1.6,
    sound: 'enemy_bat', footstep: 'step_flap',
    caption: 'ฝูงค้างคาวตัวเล็กมีกระดิ่งพันคอ บินวนเหนือศีรษะ',
    description: 'บินตามเสียงที่ดังที่สุดในห้อง กระดิ่งที่คอมันดังก่อนโจมตีเสมอ',
    tells: ['กระดิ่งเล็ก ๆ ดังกรุ๊งจากด้านบน', 'ลมจากปีกพัดผมคุณ'],
    loot: 'bell_shard',
  },
  {
    id: 'stone_husk',
    name: 'ซากหินคำราม',
    element: ELEMENTS.CRYSTAL,
    hp: 78, attack: 15, defense: 8, speed: 0.6,
    sound: 'enemy_husk', footstep: 'step_grind',
    caption: 'ก้อนหินรูปคนสูงสองเมตร เคลื่อนไหวช้าและหนัก',
    description: 'ซากผู้พิทักษ์เก่าที่เสียงข้างในหายไปแล้ว เหลือแต่โครงหินที่ยังเดินตามคำสั่งสุดท้าย',
    tells: ['พื้นสั่นเป็นจังหวะหนัก ๆ', 'เสียงหินเสียดสีกันดังยาว'],
    loot: 'core_fragment',
  },
  {
    id: 'maha_ngiap',
    name: 'มหาเงียบ',
    element: ELEMENTS.SHADE,
    hp: 180, attack: 14, defense: 6, speed: 1.2,
    boss: true,
    phases: [
      { at: 1.0, name: 'ความว่าง', taunt: 'เจ้ามีเสียงเยอะจัง… ให้ข้ายืมสักคำได้ไหม' },
      { at: 0.6, name: 'การกลืน', taunt: 'ทำไมเจ้ายังพูดได้อีก หยุดสิ หยุด' },
      { at: 0.25, name: 'เสียงแรกของมัน', taunt: 'นี่หรือ… เสียงของข้าเอง' },
    ],
    sound: 'enemy_boss', footstep: 'step_void',
    caption: 'ร่างสูงสีดำสนิทที่ขอบเบลอ ทุกเสียงรอบตัวถูกดูดเข้าหามัน',
    description: 'สิ่งที่เกิดขึ้นในที่ที่ไม่เคยมีใครส่งเสียงถึง มันไม่ได้เกลียดเสียง มันแค่อยากมีเสียงเป็นของตัวเอง',
    tells: ['ความเงียบหนาขึ้นจนหูอื้อ', 'เสียงหัวใจตัวเองดังกว่าปกติสามเท่า'],
    loot: 'first_voice',
  },
];

/** ของใช้ */
export const ITEMS = [
  { id: 'echo_flask', name: 'ขวดน้ำกังวาน', use: 'restore_mana', amount: 40, desc: 'น้ำใสที่สั่นเบา ๆ ในขวด ดื่มแล้วคืนพลังกังวาน' },
  { id: 'shade_dust', name: 'ผงเงา', use: 'material', desc: 'ผงสีดำที่ดูดเสียงรอบตัวเล็กน้อย' },
  { id: 'stone_chip', name: 'สะเก็ดหิน', use: 'material', desc: 'เศษหินจากอสูรกลืนเสียง' },
  { id: 'bell_shard', name: 'เศษกระดิ่ง', use: 'material', desc: 'โลหะบางที่ยังสั่นค้างอยู่' },
  { id: 'core_fragment', name: 'เศษแกนกังวาน', use: 'restore_hp', amount: 35, desc: 'แกนกลางของผู้พิทักษ์เก่า อุ่นเมื่อถือไว้' },
  { id: 'first_voice', name: 'เสียงแรก', use: 'quest', desc: 'เสียงแรกของมหาเงียบ เก็บไว้ในผลึกใส' },
];

/** ลำดับเนื้อเรื่อง */
export const QUESTS = [
  { id: 'q1_listen', title: 'ฟังให้ได้ยิน', goal: 'คุยกับยายมาลีและรับขวดน้ำกังวาน', room: 'malee_hut', next: 'q2_first_bell' },
  { id: 'q2_first_bell', title: 'ระฆังใบแรก', goal: 'เข้าถ้ำสะท้อนแล้วปลุกระฆังใบแรกด้วยคาถา', room: 'cave_hall', next: 'q3_second_bell' },
  { id: 'q3_second_bell', title: 'ระฆังใบที่สอง', goal: 'ขึ้นหอระฆังร้าง คุยกับอาริน แล้วปลุกระฆังใบที่สอง', room: 'tower_top', next: 'q4_silence' },
  { id: 'q4_silence', title: 'ใจกลางมหาเงียบ', goal: 'ข้ามประตูแห่งความเงียบไปเผชิญหน้ากับมหาเงียบ', room: 'heart_of_silence', next: null },
];

const roomIndex = new Map(ROOMS.map((r) => [r.id, r]));
const npcIndex = new Map(NPCS.map((n) => [n.id, n]));
const enemyIndex = new Map(ENEMIES.map((e) => [e.id, e]));
const itemIndex = new Map(ITEMS.map((i) => [i.id, i]));

export const getRoom = (id) => roomIndex.get(id) ?? null;
export const getNpc = (id) => npcIndex.get(id) ?? null;
export const getEnemy = (id) => enemyIndex.get(id) ?? null;
export const getItem = (id) => itemIndex.get(id) ?? null;
export const getQuest = (id) => QUESTS.find((q) => q.id === id) ?? null;

/** ตรวจว่าแผนที่เชื่อมกันถูกต้องทั้งสองทางและพิกัดสอดคล้องกับทิศ */
export function validateWorld() {
  const problems = [];
  for (const room of ROOMS) {
    for (const [dir, targetId] of Object.entries(room.exits ?? {})) {
      const target = getRoom(targetId);
      if (!target) { problems.push(`${room.id} → ${targetId} ไม่มีอยู่จริง`); continue; }
      const d = DIRECTIONS[dir];
      const dx = Math.sign(target.pos[0] - room.pos[0]);
      const dy = Math.sign(target.pos[1] - room.pos[1]);
      if (dx !== d.dx || dy !== d.dy) problems.push(`${room.id} → ${targetId} ทิศ ${dir} ไม่ตรงกับพิกัด`);
    }
    for (const npcId of room.npcs ?? []) if (!getNpc(npcId)) problems.push(`${room.id} มี NPC ที่ไม่รู้จัก: ${npcId}`);
    for (const eid of room.encounters ?? []) if (!getEnemy(eid)) problems.push(`${room.id} มีศัตรูที่ไม่รู้จัก: ${eid}`);
    for (const iid of room.items ?? []) if (!getItem(iid)) problems.push(`${room.id} มีของที่ไม่รู้จัก: ${iid}`);
  }
  return problems;
}
