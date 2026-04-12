/**
 * 修补中文名称脚本 - 批量从 PokeAPI 获取中文名并更新本地 JSON
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../src/data/pokemon.json');
const CONCURRENCY = 15;

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
}

async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function main() {
  const pokemon = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`📦 加载 ${pokemon.length} 只宝可梦，开始补充中文数据...\n`);

  let count = 0;
  const tasks = pokemon.map((p, idx) => async () => {
    try {
      const species = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${p.id}`);

      // 中文名（简体优先，繁体备用）
      p.nameZh = species.names.find(n => n.language.name === 'zh-hans')?.name
        || species.names.find(n => n.language.name === 'zh-hant')?.name
        || p.name;

      // 属种
      p.genusZh = species.genera?.find(g => g.language.name === 'zh-hans')?.genus
        || species.genera?.find(g => g.language.name === 'zh-hant')?.genus || '';
      p.genus = species.genera?.find(g => g.language.name === 'en')?.genus || '';

      // 图鉴描述
      const entries = species.flavor_text_entries || [];
      p.flavorTextZh = entries.filter(f => f.language.name === 'zh-hans' || f.language.name === 'zh-hant')
        .pop()?.flavor_text?.replace(/\f|\n/g, ' ') || '';
      p.flavorText = entries.filter(f => f.language.name === 'en')
        .pop()?.flavor_text?.replace(/\f|\n/g, ' ') || '';

    } catch (e) {
      // 静默失败，保持原有数据
    }
    count++;
    process.stdout.write(`\r  进度: ${count}/${pokemon.length} - #${p.id} ${p.nameZh}    `);
    return p;
  });

  await runPool(tasks, CONCURRENCY);

  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemon, null, 2));

  const withZh = pokemon.filter(p => p.nameZh !== p.name).length;
  console.log(`\n\n✅ 完成！${withZh}/${pokemon.length} 只宝可梦有中文名\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
