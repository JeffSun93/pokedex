/**
 * 补充特性中文名脚本
 * 从 PokeAPI 获取所有特性的中文名，更新 pokemon.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../src/data/pokemon.json');
const CONCURRENCY = 20;

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
}

async function runPool(tasks, concurrency) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) { const i = idx++; await tasks[i](); }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  const pokemon = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // 收集所有唯一特性名
  const abilityNames = new Set();
  for (const p of pokemon) {
    for (const a of p.abilities) abilityNames.add(a.name);
  }

  console.log(`🔍 共发现 ${abilityNames.size} 种特性，开始获取中文名...\n`);

  // 构建特性中文名映射
  const abilityZhMap = {};
  let count = 0;
  const names = [...abilityNames];

  const tasks = names.map(name => async () => {
    const data = await fetchJSON(`https://pokeapi.co/api/v2/ability/${name}`);
    if (data) {
      const zhName = data.names?.find(n => n.language.name === 'zh-hans')?.name
        || data.names?.find(n => n.language.name === 'zh-hant')?.name
        || name;
      abilityZhMap[name] = zhName;
    }
    count++;
    process.stdout.write(`\r  进度: ${count}/${names.length}    `);
  });

  await runPool(tasks, CONCURRENCY);

  // 更新 pokemon 数据
  for (const p of pokemon) {
    for (const a of p.abilities) {
      a.nameZh = abilityZhMap[a.name] || a.name;
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemon, null, 2));
  console.log(`\n\n✅ 特性中文名补充完成！共 ${Object.keys(abilityZhMap).length} 种特性\n`);
  console.log('示例：', Object.entries(abilityZhMap).slice(0, 5).map(([k,v]) => `${k}→${v}`).join(', '));
}

main().catch(e => { console.error(e); process.exit(1); });
