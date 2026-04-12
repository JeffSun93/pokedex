/**
 * 从 Pokemon Showdown 官方仓库抓取 SV 分级数据，更新本地 pokemon.json
 * 数据源: https://github.com/smogon/pokemon-showdown/blob/master/data/formats-data.ts
 *
 * 两套分级：
 *   tier       → SV 标准对战分级（不在SV本传中的标记 Illegal）
 *   natDexTier → National Dex 分级（包含全世代宝可梦）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../src/data/pokemon.json');
const FORMATS_URL =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/formats-data.ts';

// SV 标准分级 → Smogon URL slug
// https://www.smogon.com/dex/sv/formats/{slug}/
const SV_TIER_SLUG = {
  AG:     'ag',
  Uber:   'uber',
  OU:     'ou',
  UUBL:   'uubl',
  UU:     'uu',
  RUBL:   'rubl',
  RU:     'ru',
  NUBL:   'nubl',
  NU:     'nu',
  PUBL:   'publ',
  PU:     'pu',
  ZUBL:   'zubl',
  ZU:     'zu',
  NFE:    'nfe',
  LC:     'lc',
};

// NatDex 分级 → Smogon URL slug（只映射有专属页面的）
const NATDEX_TIER_SLUG = {
  Uber:   'national-dex-ubers',
  OU:     'national-dex',
  UUBL:   'national-dex-uu',   // BL 归属 UU 页面
  UU:     'national-dex-uu',
  RUBL:   'national-dex-ru',
  RU:     'national-dex-ru',
  NUBL:   'national-dex',      // 无专属页，回退到 national-dex
  NU:     'national-dex',
  PUBL:   'national-dex',
  PU:     'national-dex',
  ZUBL:   'national-dex',
  ZU:     'national-dex',
  NFE:    'national-dex',
  LC:     'national-dex',
  AG:     'national-dex',
};

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log('📡 从 Pokemon Showdown 获取 SV 分级数据...\n');

  const res = await fetch(FORMATS_URL);
  const raw = await res.text();

  // 解析每个 entry：name + tier + isNonstandard + natDexTier
  const entryMap = {}; // normalizedName → { tier, natDexTier, isNonstandard }

  // 用多行正则解析 TypeScript 对象
  const entryRe = /^\t(\w+):\s*\{([^}]+)\}/gm;
  let match;
  while ((match = entryRe.exec(raw)) !== null) {
    const psName = match[1];
    const body = match[2];

    const tierMatch = body.match(/(?<![a-zA-Z])tier:\s*"([^"]+)"/);
    const natDexTierMatch = body.match(/natDexTier:\s*"([^"]+)"/);
    const isNonstandard = body.includes('isNonstandard:');

    const entry = {};
    if (tierMatch) entry.tier = tierMatch[1];
    if (natDexTierMatch) entry.natDexTier = natDexTierMatch[1];
    entry.isNonstandard = isNonstandard;

    entryMap[psName.toLowerCase()] = entry;
  }

  console.log(`✅ 解析完成，共 ${Object.keys(entryMap).length} 条数据\n`);

  const pokemon = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let svCount = 0;
  let natdexCount = 0;
  let noneCount = 0;

  for (const p of pokemon) {
    // 尝试多种名称变体匹配 PS 数据
    const variants = [
      normalizeName(p.name),
      p.name.replace(/-/g, '').toLowerCase(),
      p.name.toLowerCase(),
    ];

    let entry = null;
    for (const v of variants) {
      if (entryMap[v]) { entry = entryMap[v]; break; }
    }

    // 清空旧字段
    p.tier = '';
    p.tierSlug = '';
    p.natDexTier = '';
    p.natDexTierSlug = '';
    p.inSV = false;

    if (!entry) {
      noneCount++;
      continue;
    }

    // SV 标准分级（非 Illegal）
    if (entry.tier && entry.tier !== 'Illegal' && SV_TIER_SLUG[entry.tier]) {
      p.tier = entry.tier;
      p.tierSlug = SV_TIER_SLUG[entry.tier];
      p.inSV = true;
      svCount++;
    }

    // NatDex 分级
    if (entry.natDexTier && NATDEX_TIER_SLUG[entry.natDexTier]) {
      p.natDexTier = entry.natDexTier;
      p.natDexTierSlug = NATDEX_TIER_SLUG[entry.natDexTier];
      if (!p.tier) natdexCount++;
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemon, null, 2));

  // 统计
  const svStats = {}, natStats = {};
  for (const p of pokemon) {
    if (p.tier) svStats[p.tier] = (svStats[p.tier] || 0) + 1;
    if (p.natDexTier && !p.tier) natStats[p.natDexTier] = (natStats[p.natDexTier] || 0) + 1;
  }

  console.log('📊 SV 标准分级分布：');
  for (const [t, n] of Object.entries(svStats).sort((a, b) => b[1] - a[1])) {
    const url = `https://www.smogon.com/dex/sv/formats/${SV_TIER_SLUG[t]}/`;
    console.log(`   ${t.padEnd(6)} ${String(n).padStart(3)} 只   ${url}`);
  }

  console.log('\n📊 NatDex 分级分布（仅限不在 SV 中的宝可梦）：');
  for (const [t, n] of Object.entries(natStats).sort((a, b) => b[1] - a[1])) {
    const slug = NATDEX_TIER_SLUG[t];
    console.log(`   ${t.padEnd(6)} ${String(n).padStart(3)} 只   https://www.smogon.com/dex/sv/formats/${slug}/`);
  }

  console.log(`\n✅ 更新完成：`);
  console.log(`   SV 标准分级：${svCount} 只`);
  console.log(`   仅 NatDex：  ${natdexCount} 只`);
  console.log(`   无分级数据：  ${noneCount} 只`);

  // 抽样
  console.log('\n🔍 抽样验证（各分级各取1例）：');
  for (const [t] of Object.entries(svStats)) {
    const ex = pokemon.find(p => p.tier === t);
    if (ex) console.log(`   ${ex.nameZh.padEnd(8)} ${ex.tier.padEnd(6)} → /dex/sv/formats/${ex.tierSlug}/`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
