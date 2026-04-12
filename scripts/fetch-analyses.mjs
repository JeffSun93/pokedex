/**
 * 从 Smogon 抓取宝可梦对战分析文章（英文 + 中文）
 * 直接调用 Smogon 内部 RPC，无需 Playwright
 *
 * 用法：
 *   node scripts/fetch-analyses.mjs ou          # 只抓 OU
 *   node scripts/fetch-analyses.mjs ou uu ru    # 抓多个分级
 *   node scripts/fetch-analyses.mjs all         # 抓全部有分析的分级
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src/data/pokemon.json');
const ANALYSES_DIR = path.join(ROOT, 'src/data/analyses');

const RPC_URL = 'https://www.smogon.com/dex/_rpc/dump-pokemon';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.smogon.com/dex/sv/pokemon/',
  'Content-Type': 'application/json',
};

const CONCURRENCY = 4; // Smogon 限速，保守一点

async function fetchAnalysis(alias, language) {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { ...HEADERS, 'Referer': `https://www.smogon.com/dex/sv/pokemon/${alias}/` },
      body: JSON.stringify({ alias, gen: 'sv', language }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

function extractStrategies(data, targetFormats) {
  if (!data?.strategies) return [];
  return data.strategies
    .filter(s => targetFormats.includes(s.format))
    .map(s => ({
      format: s.format,
      overview: s.overview || '',
      comments: s.comments || '',
      movesets: (s.movesets || []).map(ms => ({
        name: ms.name || '',
        description: ms.description || '',
        moveslots: ms.moveslots || [],
        pokemon: ms.pokemon || alias,
        ability: ms.ability || [],
        item: ms.item || [],
        nature: ms.nature || [],
        evs: ms.evs || {},
        ivs: ms.ivs || {},
        teratypes: ms.teratypes || [],
      })),
    }));
}

async function runPool(tasks, concurrency) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) { const i = idx++; await tasks[i](); }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error('用法: node fetch-analyses.mjs ou [uu ru ...]'); process.exit(1); }

  fs.mkdirSync(ANALYSES_DIR, { recursive: true });

  const allPokemon = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // 决定要抓哪些分级
  const wantAll = args[0] === 'all';
  const targetTiers = wantAll
    ? [...new Set(allPokemon.filter(p => p.tier).map(p => p.tier))]
    : args.map(a => a.toUpperCase());

  // 筛选宝可梦（SV 标准分级，去掉已有文件的）
  const toFetch = allPokemon.filter(p =>
    p.tier && targetTiers.includes(p.tier)
  );

  console.log(`\n🎯 目标分级：${targetTiers.join(', ')}`);
  console.log(`📋 需要抓取：${toFetch.length} 只宝可梦\n`);

  // 抓取任务（每只宝可梦：英文 + 中文各一次请求）
  const allFormats = targetTiers; // 只抓对应分级的分析
  let done = 0;
  const results = [];

  const tasks = toFetch.map(p => async () => {
    const outFile = path.join(ANALYSES_DIR, `${p.name}.json`);

    // 已有数据则直接读（支持断点续抓）
    let existing = {};
    if (fs.existsSync(outFile)) {
      try { existing = JSON.parse(fs.readFileSync(outFile, 'utf-8')); } catch {}
    }

    // 只抓缺失的语言
    const needEn = !existing.en;
    const needCn = !existing.cn;

    let enData = existing.en || null;
    let cnData = existing.cn || null;

    if (needEn) {
      const raw = await fetchAnalysis(p.name, 'en');
      if (raw) enData = extractStrategies(raw, allFormats);
      await sleep(200);
    }
    if (needCn) {
      const raw = await fetchAnalysis(p.name, 'cn');
      if (raw) {
        // 只保存有实际内容的中文策略
        const cn = extractStrategies(raw, allFormats);
        cnData = cn.filter(s =>
          s.overview || s.comments || s.movesets.some(ms => ms.description)
        );
      }
      await sleep(200);
    }

    const output = {
      id: p.id,
      name: p.name,
      nameZh: p.nameZh,
      tier: p.tier,
      ...(existing),      // 保留已有数据
      en: enData,
      cn: cnData?.length ? cnData : null,
    };

    fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

    done++;
    const hasEn = (enData || []).some(s => s.overview || s.movesets.length);
    const hasCn = !!(cnData?.length);
    process.stdout.write(
      `\r  [${done}/${toFetch.length}] #${p.id} ${p.nameZh.padEnd(8)} ` +
      `EN:${hasEn ? '✓' : '✗'} CN:${hasCn ? '✓' : '-'}  `
    );
    results.push({ name: p.name, nameZh: p.nameZh, hasEn, hasCn });
  });

  await runPool(tasks, CONCURRENCY);

  // 汇总报告
  console.log('\n\n📊 抓取结果：');
  const withEn = results.filter(r => r.hasEn).length;
  const withCn = results.filter(r => r.hasCn).length;
  console.log(`   英文分析：${withEn}/${results.length} 只`);
  console.log(`   中文分析：${withCn}/${results.length} 只`);

  if (withCn > 0) {
    console.log('\n   有中文分析的宝可梦：');
    results.filter(r => r.hasCn).forEach(r => console.log(`   · ${r.nameZh} (${r.name})`));
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(e => { console.error(e); process.exit(1); });
