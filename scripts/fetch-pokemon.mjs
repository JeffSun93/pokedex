/**
 * 宝可梦数据抓取脚本
 * 从 PokeAPI 获取全部宝可梦数据（含中文名），并下载精灵图到本地
 * 用法: node scripts/fetch-pokemon.mjs
 *
 * 注意：第一次运行耗时较长（约10-30分钟，含图片下载）
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SPRITES_DIR = path.join(ROOT, 'public', 'sprites');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'pokemon.json');

// 只抓前9代（1-1010），SV截止到 #1025
const TOTAL = 1025;
const CONCURRENCY = 10; // 并发请求数

// 类型中文名映射
const TYPE_NAMES_ZH = {
  normal: '一般', fire: '火', water: '水', electric: '电', grass: '草',
  ice: '冰', fighting: '格斗', poison: '毒', ground: '地面', flying: '飞行',
  psychic: '超能力', bug: '虫', rock: '岩石', ghost: '幽灵', dragon: '龙',
  dark: '恶', steel: '钢', fairy: '妖精',
};

const STAT_NAMES_ZH = {
  hp: 'HP', attack: '攻击', defense: '防御',
  'special-attack': '特攻', 'special-defense': '特防', speed: '速度',
};

// Smogon SV 分级数据（预置，来自 Smogon 公开数据）
const SMOGON_TIERS = {
  uber: ['mewtwo','mew','lugia','ho-oh','celebi','kyogre','groudon','rayquaza','jirachi','deoxys','deoxys-attack','deoxys-defense','deoxys-speed','dialga','palkia','giratina','giratina-origin','arceus','reshiram','zekrom','kyurem-black','kyurem-white','xerneas','yveltal','zygarde','solgaleo','lunala','necrozma-dawn-wings','necrozma-dusk-mane','zacian','zamazenta','eternatus','calyrex-ice','calyrex-shadow','koraidon','miraidon'],
  ou: ['alakazam','tyranitar','salamence','garchomp','heatran','rotom-wash','landorus-therian','thundurus','tornadus-therian','keldeo','aegislash','greninja','talonflame','slowbro','clefable','ferrothorn','skarmory','blissey','chansey','toxapex','kartana','magearna','tapu-koko','tapu-lele','tapu-bulu','tapu-fini','urshifu','dragapult','corviknight','rillaboom','cinderace','inteleon','barraskewda','clefairy','volcanion','weavile','garchomp','iron-valiant','roaring-moon','great-tusk','iron-treads','gholdengo','kingambit','flutter-mane','chi-yu','chien-pao'],
  uu: ['togekiss','mimikyu','mamoswine','heracross','sharpedo','azumarill','breloom','conkeldurr','scizor','magnezone','porygon-z','manectric','slowking','tentacruel','cofagrigus','victini','cobalion','terrakion','virizion','jolteon','vaporeon','flareon','espeon','umbreon','leafeon','glaceon','sylveon','arcanine','machamp'],
  nu: ['meganium','typhlosion','feraligatr','ambipom','snorlax','starmie','absol','primeape','haunter','mismagius','electrode','nidoking','nidoqueen'],
  pu: ['raticate','pidgeot','farfetchd','lickitung','tangela','kangaskhan'],
  lc: ['pichu','cleffa','igglybuff','togepi','tyrogue','smoochum','elekid','magby','azurill','wynaut','budew','chingling','bonsly','mime-jr','happiny','munchlax','riolu','mantyke'],
};

function buildTierMap() {
  const map = {};
  for (const [tier, names] of Object.entries(SMOGON_TIERS)) {
    for (const name of names) {
      map[name] = tier.toUpperCase();
    }
  }
  return map;
}

const TIER_MAP = buildTierMap();

// 世代区间
const GENERATION_RANGES = [
  { gen: 1, start: 1, end: 151 },
  { gen: 2, start: 152, end: 251 },
  { gen: 3, start: 252, end: 386 },
  { gen: 4, start: 387, end: 493 },
  { gen: 5, start: 494, end: 649 },
  { gen: 6, start: 650, end: 721 },
  { gen: 7, start: 722, end: 809 },
  { gen: 8, start: 810, end: 905 },
  { gen: 9, start: 906, end: 1025 },
];

function getGeneration(id) {
  for (const { gen, start, end } of GENERATION_RANGES) {
    if (id >= start && id <= end) return gen;
  }
  return 9;
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        resolve(); // 静默失败，不阻断流程
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', () => { file.close(); fs.unlink(dest, () => {}); resolve(); });
  });
}

async function fetchPokemonData(id) {
  const [pokemon, species] = await Promise.all([
    fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`),
    fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
  ]);

  // 中文名
  const zhName = species.names.find(n => n.language.name === 'zh-Hans')?.name
    || species.names.find(n => n.language.name === 'zh-Hant')?.name
    || pokemon.name;

  // 中文属种（例如：火鼠宝可梦）
  const genusZh = species.genera?.find(g => g.language.name === 'zh-Hans')?.genus
    || species.genera?.find(g => g.language.name === 'zh-Hant')?.genus
    || '';
  const genusEn = species.genera?.find(g => g.language.name === 'en')?.genus || '';

  // 图鉴描述（中英文）
  const flavorZh = species.flavor_text_entries
    ?.filter(f => f.language.name === 'zh-Hans' || f.language.name === 'zh-Hant')
    ?.pop()?.flavor_text?.replace(/\f|\n/g, ' ') || '';
  const flavorEn = species.flavor_text_entries
    ?.filter(f => f.language.name === 'en')
    ?.pop()?.flavor_text?.replace(/\f|\n/g, ' ') || '';

  // 属性
  const types = pokemon.types.map(t => ({
    name: t.type.name,
    nameZh: TYPE_NAMES_ZH[t.type.name] || t.type.name,
  }));

  // 特性（先尝试获取中文特性名）
  const abilities = pokemon.abilities.map(a => ({
    name: a.ability.name,
    nameZh: '', // 后续批量处理
    isHidden: a.is_hidden,
    slot: a.slot,
  }));

  // 基础属性值
  const stats = pokemon.stats.map(s => ({
    name: s.stat.name,
    nameZh: STAT_NAMES_ZH[s.stat.name] || s.stat.name,
    baseStat: s.base_stat,
  }));

  // 精灵图 URL（用于下载）
  const spriteUrl = pokemon.sprites.front_default || '';
  const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default || '';

  return {
    id,
    name: pokemon.name,
    nameZh: zhName,
    height: pokemon.height,
    weight: pokemon.weight,
    types,
    abilities,
    stats,
    sprite: `/sprites/${id}.png`,
    artwork: `/sprites/artwork/${id}.png`,
    generation: getGeneration(id),
    tier: TIER_MAP[pokemon.name] || '',
    evolutionChain: [],
    flavorText: flavorEn,
    flavorTextZh: flavorZh,
    genus: genusEn,
    genusZh: genusZh,
    _spriteUrl: spriteUrl,
    _artworkUrl: artworkUrl,
  };
}

async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        results[i] = await tasks[i]();
      } catch (e) {
        console.error(`  Task ${i} failed:`, e.message);
        results[i] = null;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🚀 开始抓取宝可梦数据...\n');

  // 确保目录存在
  fs.mkdirSync(SPRITES_DIR, { recursive: true });
  fs.mkdirSync(path.join(SPRITES_DIR, 'artwork'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'src', 'data'), { recursive: true });

  // 检查是否有缓存
  let existing = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log(`📦 发现缓存数据，已有 ${existing.length} 只宝可梦\n`);
    } catch {}
  }

  const existingIds = new Set(existing.map(p => p.id));
  const toFetch = [];
  for (let id = 1; id <= TOTAL; id++) {
    if (!existingIds.has(id)) toFetch.push(id);
  }

  console.log(`📡 需要抓取 ${toFetch.length} 只宝可梦数据...\n`);

  let fetched = [...existing];
  let count = 0;

  const tasks = toFetch.map(id => async () => {
    const data = await fetchPokemonData(id);
    count++;
    process.stdout.write(`\r  进度: ${existingIds.size + count}/${TOTAL} - #${id} ${data.nameZh}(${data.name})    `);
    return data;
  });

  const newData = await runPool(tasks, CONCURRENCY);
  fetched = [...fetched, ...newData.filter(Boolean)];
  fetched.sort((a, b) => a.id - b.id);

  // 去掉内部字段前先保存图片 URL
  const spriteMap = {};
  for (const p of fetched) {
    if (p._spriteUrl) spriteMap[p.id] = { sprite: p._spriteUrl, artwork: p._artworkUrl };
    delete p._spriteUrl;
    delete p._artworkUrl;
  }

  // 写入 JSON 数据
  fs.writeFileSync(DATA_FILE, JSON.stringify(fetched, null, 2));
  console.log(`\n\n✅ 数据保存完成：${fetched.length} 只宝可梦\n`);

  // 下载图片
  console.log('🖼  开始下载精灵图...\n');
  let imgCount = 0;
  const imgTasks = fetched.map(p => async () => {
    const urls = spriteMap[p.id] || {};
    await Promise.all([
      urls.sprite ? downloadFile(urls.sprite, path.join(SPRITES_DIR, `${p.id}.png`)) : Promise.resolve(),
      urls.artwork ? downloadFile(urls.artwork, path.join(SPRITES_DIR, 'artwork', `${p.id}.png`)) : Promise.resolve(),
    ]);
    imgCount++;
    process.stdout.write(`\r  图片: ${imgCount}/${fetched.length}    `);
  });

  await runPool(imgTasks, 20);
  console.log(`\n\n🎉 全部完成！共下载 ${imgCount} 只宝可梦的精灵图\n`);
}

main().catch(e => { console.error('错误:', e); process.exit(1); });
