# 🏗️ 宝可梦图鉴 · 开发全记录

> 从零开始，在本地还原 [Smogon Pokédex](https://www.smogon.com/dex/sv/pokemon/)，含中英双语 + 图片本地化。

---

## 📋 目录

1. [需求分析](#-需求分析)
2. [技术选型](#-技术选型)
3. [数据来源规划](#-数据来源规划)
4. [项目初始化](#-项目初始化)
5. [目录结构设计](#-目录结构设计)
6. [数据抓取策略](#-数据抓取策略)
7. [踩坑记录](#-踩坑记录)
8. [前端组件拆分](#-前端组件拆分)
9. [TypeScript 修复](#-typescript-修复)
10. [对战分级系统（第二阶段）](#-对战分级系统第二阶段)
11. [本地分级页 — Plan A（第三阶段）](#-本地分级页--plan-a第三阶段)
12. [对战分析文章 — Plan B（第四阶段）](#-对战分析文章--plan-b第四阶段)
13. [最终结果](#-最终结果)

---

## 🔍 需求分析

### 目标网站结构解析

首先用 `WebFetch` 分析 Smogon 网站，得到以下关键信息：

| 维度 | 发现 |
|---|---|
| **数据来源** | 页面内嵌 JSON（通过 `injectRpcs` 注入，调用 `dump-gens` / `dump-basics`） |
| **技术栈** | 原生 JavaScript + 嵌入式数据，无重型框架 |
| **内容** | 精灵图、六维种族值、属性/特性、进化链、对战分级（OU/UU/NU…） |
| **图片** | CDN 托管，路径规律为 `/dex/media/sprites/xy/{name}.gif` |

### 还原思路

Smogon 的数据是私有的（嵌入在 JS bundle 里），不能直接抓取。
因此改用 **[PokeAPI](https://pokeapi.co)** 作为替代数据源：
- 完全免费、开源
- 支持多语言（含简体中文 `zh-hans`）
- 有完整的精灵图 CDN

---

## ⚙️ 技术选型

```
React 19  +  TypeScript  +  Vite
```

| 选择 | 理由 |
|---|---|
| **React** | 组件化 UI，状态管理简单 |
| **TypeScript** | 宝可梦数据结构复杂，类型安全很重要 |
| **Vite** | 启动快，对 JSON 导入支持好 |
| **原生 inline styles** | 避免引入 CSS 框架，样式与组件强绑定，主题色动态生成 |
| **本地 JSON** | 数据一次下载，永久离线可用 |

---

## 📦 数据来源规划

```
宝可梦基础数据 + 中文名  →  PokeAPI  /pokemon/{id}  +  /pokemon-species/{id}
特性中文名               →  PokeAPI  /ability/{name}
精灵图（小图）           →  PokeAPI sprites GitHub  sprites/pokemon/{id}.png
高清官方图               →  PokeAPI sprites GitHub  other/official-artwork/{id}.png
对战分级（OU/UU…）       →  预置数据（来自 Smogon 公开资料）
```

---

## 🚀 项目初始化

### 1. 创建 Vite 项目

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install axios
npm install -D @types/node
```

### 2. 创建目录结构

```bash
mkdir -p src/{types,data,components,hooks,utils,styles}
mkdir -p public/sprites/artwork
mkdir -p scripts
```

---

## 🗂️ 目录结构设计

```
pokedex/
│
├── public/
│   └── sprites/
│       ├── 1.png          ← 精灵小图（像素风）
│       ├── 2.png
│       ├── ...            （共 1025 张）
│       └── artwork/
│           ├── 1.png      ← 高清官方图
│           └── ...        （共 1025 张）
│
├── scripts/
│   ├── fetch-pokemon.mjs  ← 主数据抓取脚本
│   ├── patch-zh-names.mjs ← 中文名修补脚本
│   └── patch-abilities.mjs← 特性中文名脚本
│
└── src/
    ├── types/
    │   └── pokemon.ts     ← 全部 TypeScript 类型 + 常量
    ├── data/
    │   └── pokemon.json   ← 1025 只宝可梦完整数据（1.5MB）
    ├── utils/
    │   └── pokemon.ts     ← 筛选、格式化工具函数
    ├── styles/
    │   └── globals.css    ← CSS 变量 + 全局重置
    ├── components/
    │   ├── Header.tsx         ← 顶部导航 + 视图切换
    │   ├── FilterBar.tsx      ← 搜索 + 筛选栏
    │   ├── PokemonCard.tsx    ← 宫格卡片
    │   ├── PokemonListRow.tsx ← 列表行 + 表头
    │   ├── PokemonModal.tsx   ← 详情弹窗
    │   ├── TypeBadge.tsx      ← 属性标签
    │   └── StatBar.tsx        ← 种族值条形图
    └── App.tsx               ← 主逻辑：筛选 + 无限滚动 + 状态
```

---

## 📡 数据抓取策略

### 阶段一：主数据（`scripts/fetch-pokemon.mjs`）

对每只宝可梦，**并发**请求两个 endpoint：

```
GET https://pokeapi.co/api/v2/pokemon/{id}        → 属性、特性、种族值、精灵图 URL
GET https://pokeapi.co/api/v2/pokemon-species/{id} → 中文名、图鉴说明、属种
```

**并发控制：** 使用 Worker Pool 模式，10 个并发，避免 API 限流：

```js
async function runPool(tasks, concurrency) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}
```

### 阶段二：图片下载

对每只宝可梦并发下载 2 张图（精灵图 + 高清图），并发数提升到 20：

```js
await downloadFile(spriteUrl, `public/sprites/${id}.png`);
await downloadFile(artworkUrl, `public/sprites/artwork/${id}.png`);
```

**断点续传：** 每次下载前检查文件是否存在，已有则跳过：

```js
if (fs.existsSync(dest)) { resolve(); return; }
```

### 阶段三：特性中文名（`scripts/patch-abilities.mjs`）

收集全部 284 种不重复特性名，批量请求：

```
GET https://pokeapi.co/api/v2/ability/{name}
```

---

## 🐛 踩坑记录

### 坑 #1：PokeAPI 语言代码大小写

**现象：** 运行完主脚本后，检查数据发现 1025 只宝可梦全部没有中文名：

```bash
node -e "const d = require('./src/data/pokemon.json');
const withZh = d.filter(p => p.nameZh !== p.name);
console.log('有中文名:', withZh.length);"
# 输出：有中文名: 0
```

**原因：** 脚本里写的是 `zh-Hans`（大写 H），但 PokeAPI 实际返回的是 `zh-hans`（全小写）：

```bash
# 验证
curl -s "https://pokeapi.co/api/v2/pokemon-species/1" | \
  node -e "..." | grep zh
# 输出：{"language":{"name":"zh-hans",...},"name":"妙蛙种子"}
#                          ↑ 全小写
```

**解法：** 写了专用的修补脚本 `patch-zh-names.mjs`，正确使用小写语言代码，对 1025 只宝可梦重新请求 species endpoint：

```js
// ❌ 错误
species.names.find(n => n.language.name === 'zh-Hans')

// ✅ 正确
species.names.find(n => n.language.name === 'zh-hans')
```

修补后验证：

```bash
# 妙蛙种子、妙蛙草、妙蛙花、小火龙、火恐龙、喷火龙...
有中文名: 1025 / 总数: 1025  ✅
```

---

### 坑 #2：TypeScript `verbatimModuleSyntax` 报错

**现象：** `npm run build` 出现 9 个错误：

```
error TS1484: 'Pokemon' is a type and must be imported using a type-only import
              when 'verbatimModuleSyntax' is enabled.
```

**原因：** Vite 新版模板默认开启了 `"verbatimModuleSyntax": true`，要求类型导入必须使用 `import type`。

**解法：** 在所有导入类型的地方加上 `type` 关键字：

```ts
// ❌ 旧写法
import { Pokemon, Filters } from './types/pokemon';

// ✅ 新写法（值和类型分开导入）
import type { Pokemon, Filters } from './types/pokemon';
import { TYPE_COLORS } from './types/pokemon';
```

涉及文件：`App.tsx`、`FilterBar.tsx`、`PokemonCard.tsx`、`PokemonListRow.tsx`、`PokemonModal.tsx`、`utils/pokemon.ts`

---

### 坑 #3：JSON 导入需要开启 `resolveJsonModule`

**现象：** 直接 `import allPokemonData from './data/pokemon.json'` 报错。

**解法：** 在 `tsconfig.app.json` 中添加：

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

---

## 🧩 前端组件拆分

### 设计原则

- **主题色动态生成：** 每只宝可梦的卡片背景、边框、高亮色都来自其第一属性的颜色，无需手动配色
- **中英对照贯穿始终：** 所有显示层都同时渲染 `nameZh` 和 `name`
- **无限滚动代替分页：** 用 `IntersectionObserver` 监听列表底部，每次加载 60 条

### 核心颜色系统

```ts
const TYPE_COLORS: Record<string, string> = {
  fire:    '#F08030',   // 火 → 橙
  water:   '#6890F0',   // 水 → 蓝
  grass:   '#78C850',   // 草 → 绿
  electric:'#F8D030',   // 电 → 黄
  psychic: '#F85888',   // 超能力 → 粉
  dragon:  '#7038F8',   // 龙 → 紫
  // ...共 18 种属性
};
```

卡片会根据属性色自动计算：
- 背景渐变：`linear-gradient(135deg, var(--bg-card) 0%, ${color}22 100%)`
- 边框：`1px solid ${color}33`
- Hover 阴影：`0 12px 32px ${color}40`

### 筛选逻辑（`utils/pokemon.ts`）

```ts
export function filterPokemon(pokemon: Pokemon[], filters: Filters): Pokemon[] {
  return pokemon.filter(p => {
    // 支持中文名、英文名、编号 三合一搜索
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match = p.name.toLowerCase().includes(q)
        || p.nameZh.includes(q)
        || String(p.id).includes(q);
      if (!match) return false;
    }
    if (filters.generation !== 0 && p.generation !== filters.generation) return false;
    if (filters.type && !p.types.some(t => t.name === filters.type)) return false;
    if (filters.tier && p.tier?.toLowerCase() !== filters.tier.toLowerCase()) return false;
    return true;
  });
}
```

---

## 🏆 对战分级系统（第二阶段）

### 目标

在每只宝可梦的卡片/详情上显示带链接的分级标签，点击直接跳转到 Smogon 对应格式页面。

### 数据源调研过程

**尝试 1：Smogon 自身 RPC API**

```bash
curl -s "https://www.smogon.com/dex/_rpc/dump-basics" \
  --data '{"gen":"gen9"}' \
  -H "Content-Type: application/json"
# → null（需要特定 session cookie 或 referer，实际返回 null）
```

**尝试 2：pkmn.github.io 社区数据**

```bash
curl -s "https://pkmn.github.io/smogon/data/stats/gen9ou.json"
# → 有使用率数据，但没有分级字段
```

**✅ 成功：Pokemon Showdown 官方仓库**

```bash
curl -s "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/formats-data.ts"
# → TypeScript 格式，包含每只宝可梦的 tier / natDexTier 字段
```

输出格式示例：

```ts
bulbasaur: {
  tier: "LC",
},
venusaur: {
  tier: "ZU",
  natDexTier: "RU",
},
alakazam: {
  isNonstandard: "Past",   // 不在 SV 本传
  tier: "Illegal",
  natDexTier: "RUBL",      // NatDex 格式中的分级
},
```

### Smogon 分级页面 URL 验证

用 `curl -o /dev/null -w "%{http_code}"` 逐一验证所有分级 URL：

```bash
# SV 标准分级（全部 200）
https://www.smogon.com/dex/sv/formats/ou/
https://www.smogon.com/dex/sv/formats/uu/
https://www.smogon.com/dex/sv/formats/rubl/
# ... ag / lc / nfe / uber 等

# NatDex 格式（部分有专属页）
https://www.smogon.com/dex/sv/formats/national-dex/          # OU NatDex（200）
https://www.smogon.com/dex/sv/formats/national-dex-uu/       # UU NatDex（200）
https://www.smogon.com/dex/sv/formats/national-dex-ru/       # RU NatDex（200）
https://www.smogon.com/dex/sv/formats/national-dex-ubers/    # Ubers NatDex（200）
https://www.smogon.com/dex/sv/formats/natdexou/              # 404，不存在
https://www.smogon.com/dex/sv/formats/ubers/                 # 404，正确写法是 uber
```

### 两套分级体系设计

| 字段 | 含义 | 示例 |
|---|---|---|
| `tier` | SV 本传标准分级 | `OU`, `ZU`, `LC` |
| `tierSlug` | 对应 Smogon URL slug | `ou`, `zu`, `lc` |
| `natDexTier` | National Dex 分级 | `RUBL`, `UU` |
| `natDexTierSlug` | NatDex URL slug | `national-dex-ru`, `national-dex-uu` |
| `inSV` | 是否在 SV 本传中 | `true` / `false` |

**显示逻辑：**
- 若有 SV 标准分级 → 显示彩色 `tier` 标签，链接到 `/dex/sv/formats/{tierSlug}/`
- 若仅有 NatDex 分级 → 显示带 `ND·` 前缀的标签，链接到 `/dex/sv/formats/national-dex.../`
- 分级抓取脚本运行结果：**705 只 SV 标准分级 + 283 只仅 NatDex**

### 分级颜色体系（从高到低）

```
AG     #FF6B6B  深红  ← 最强（无限制）
Uber   #E74C3C  红
OU     #E67E22  橙    ← 标准竞技最高层
UUBL   #F39C12  橙黄
UU     #F1C40F  黄
RUBL   #27AE60  绿
RU     #2ECC71  亮绿
NUBL   #1ABC9C  青绿
NU     #16A085  青
PUBL   #3498DB  蓝
PU     #2980B9  深蓝
ZUBL   #8E44AD  紫
ZU     #9B59B6  亮紫
NFE    #7F8C8D  灰   ← 未完全进化
LC     #95A5A6  浅灰 ← 小宝贝（最低）
```

### TierBadge 组件

新建 `src/components/TierBadge.tsx`，用 `<a>` 标签包裹，`target="_blank"` 打开 Smogon，`e.stopPropagation()` 防止触发卡片点击：

```tsx
<a
  href={`https://www.smogon.com/dex/sv/formats/${tierSlug}/`}
  target="_blank"
  rel="noopener noreferrer"
  onClick={e => e.stopPropagation()}   // 关键：不触发卡片弹窗
>
  {isNatDex && <span>ND·</span>}
  {tier}
</a>
```

### 坑 #4：`ubers` vs `uber` URL

Smogon 的 Uber 分级页面 URL 是 `/dex/sv/formats/uber/`（单数），
而 NatDex Ubers 是 `/dex/sv/formats/national-dex-ubers/`（复数）。
直接用 `tier.toLowerCase()` 会得到 `uber`（正确），但如果参考其他资料写成 `ubers` 则 404。

---

## 🗺️ 本地分级页 — Plan A（第三阶段）

### 背景与决策

用户最初将 `TierBadge` 做成了链接到 Smogon 的外链。需求升级为：**完全本地化**，点击分级后跳转到本地页面而非 Smogon 外站。

讨论后确认了可行性：

- **Plan A（立刻可做）**：基于现有数据建本地分级浏览页，不需要额外抓取
- **Plan B（后续）**：抓取 Smogon 分析文章 + 中英对照展示
- 决定 A → B 顺序执行

### 引入路由

```bash
npm install react-router-dom
```

使用 `HashRouter`（而非 `BrowserRouter`），原因：项目作为本地静态文件运行，hash 路由无需服务器配置，直接用 `file://` 协议也能工作。

路由结构：

```
/           → PokedexPage     图鉴主页
/tiers      → TiersIndexPage  分级总览
/tiers/:slug → TierPage       单个分级详情
```

### 文件重构

原来 `App.tsx` 承担了所有逻辑，拆分后：

```
src/
├── App.tsx               ← 只做路由分发
├── pages/
│   ├── PokedexPage.tsx   ← 原 App 主体内容
│   ├── TiersIndexPage.tsx← 分级总览
│   └── TierPage.tsx      ← 单个分级详情
```

`FilterBar` 同时承担了视图切换（原来在 Header），Header 改为纯导航。

### TiersIndexPage 设计

每个分级渲染为一张卡片，包含：
- 彩色左边框（对应分级颜色）
- 中英双语描述
- 代表性宝可梦小精灵图（取该分级前5只）
- 「查看全部 →」本地跳转 + 「Smogon ↗」外链并存

### TierPage 设计

```
Banner
├── 分级名（大字）+ 宝可梦数 + 平均种族值
├── 上/下级分级导航（← UUBL  ZU →）
└── Smogon 外链按钮

工具栏（sticky）
├── 分级内搜索
├── 排序（编号/种族值总计/HP/攻击/速度）
├── 宫格/列表切换
└── 计数

宝可梦列表（复用 PokemonCard / PokemonListRow）

底部：属性分布柱状图
```

### slug ↔ tier 反向映射

路由参数是 slug（如 `ou`），组件需要还原出 tier 名（`OU`）：

```ts
function buildSlugMap() {
  const map: Record<string, string> = {};
  for (const p of ALL_POKEMON) {
    if (p.tier && p.tierSlug) map[p.tierSlug] = p.tier;
  }
  return map;
}
```

不用硬编码映射表，直接从数据推导，之后新增分级自动生效。

---

## 📰 对战分析文章 — Plan B（第四阶段）

### 可行性调研过程

**问题**：Smogon 分级页的真正价值在于每只宝可梦的**分析文章**（Overview / Sets / Checks & Counters），而不只是宝可梦列表。

**三种获取方式的评估**：

| 方案 | 结论 |
|---|---|
| Smogon RPC `dump-basics` | ❌ 返回 null（需登录 session） |
| Playwright 无头浏览器 | ✅ 可行但重，需额外安装 |
| 解析页面 HTML 内嵌数据 | ✅ **最优** — 数据就在页面里 |

**发现页面内嵌机制**：

```bash
curl -s "https://www.smogon.com/dex/sv/pokemon/kingambit/" | grep "injectRpcs"
# → injectRpcs":[["[\"dump-gens\",{}]",[...]], ["[\"dump-pokemon\",...], {...}]]
```

Smogon 在服务端将 RPC 结果直接注入 HTML，无需执行 JavaScript 即可拿到完整数据：

```js
// 状态机解析嵌套 JSON（直接 JSON.parse 会因截断而失败）
let depth = 0, arrEnd = 0;
for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c === '[' || c === '{') depth++;
  else if (c === ']' || c === '}') { depth--; if (depth === 0) { arrEnd = i+1; break; } }
}
const rpcs = JSON.parse(raw.substring(0, arrEnd));
```

### 发现中文数据

检查 `dump-pokemon` 返回的 `languages` 字段：

```bash
curl -s "https://www.smogon.com/dex/sv/pokemon/kingambit/" \
  | node -e "..." 
# → Available languages: [ 'en', 'pt', 'es', 'fr', 'it', 'cn' ]
```

有中文（`cn`）！但 HTML 页面只预载英文版。改为**直接调用 Smogon RPC**：

```bash
curl -s "https://www.smogon.com/dex/_rpc/dump-pokemon" \
  -H "Referer: https://www.smogon.com/dex/sv/pokemon/kingambit/" \
  -H "Content-Type: application/json" \
  --data '{"alias":"kingambit","gen":"sv","language":"cn"}'
# → {"strategies":[{"format":"OU","movesets":[{"description":"<p>凭借其技能池中剑舞..."}]}]}
```

不需要 cookie 或登录，直接可用。

### 数据结构

```
dump-pokemon response
├── languages: ["en","pt","es","fr","it","cn"]
└── strategies[]
    ├── format: "OU"
    ├── overview: "<p>Kingambit shines as...</p>"   ← 概述
    ├── comments: "<p>Other Options...</p>"          ← C&C
    └── movesets[]
        ├── name: "Swords Dance"
        ├── description: "<p>Its ability to...</p>"
        ├── moveslots: [[{move:"Swords Dance"}], ...]
        ├── ability / item / nature / evs / teratypes
```

### 抓取策略（`scripts/fetch-analyses.mjs`）

- 并发数设为 **4**（保守，避免触发 Smogon 限流）
- 每次请求间隔 200ms
- **断点续抓**：检查 `src/data/analyses/{name}.json` 是否存在，已有则跳过
- 每只宝可梦发出 **2 次请求**：`language:en` + `language:cn`
- 只保存有实际内容的中文策略（过滤空数组）

```bash
# OU 先行验证效果
node scripts/fetch-analyses.mjs ou

# 📊 结果：
#    英文分析：33/33 只
#    中文分析：31/33 只（火焰鸟、轰擂金刚猩暂无中文）
```

### 前端展示：三种语言模式

`AnalysisView` 组件支持动态切换：

```
[中英对照]  [中文]  [English]
```

- **中英对照**：`display: grid; grid-template-columns: 1fr 1fr` — 左英右中
- 若该宝可梦无中文分析，「中文」按钮自动禁用并标注「(暂无)」
- HTML 内容用 `dangerouslySetInnerHTML` 渲染，渲染前调用 `sanitizeHtml` 过滤 `<script>` / `on*` 属性

### 安全处理

```ts
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/on\w+="[^"]*"/gi, '')
    // Smogon 内链 → 外链
    .replace(/href="\/dex\//g, 'href="https://www.smogon.com/dex/')
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}
```

### Modal 改版：页签设计

`PokemonModal` 新增「对战分析」页签，**懒加载**分析数据：

```ts
// 只有切换到分析页签才触发 import
useEffect(() => {
  if (tab !== 'analysis' || analysisData) return;
  import(`../data/analyses/${pokemon.name}.json`)
    .then(m => setAnalysisData(m.default))
    .catch(() => setAnalysisData({}));
}, [tab]);
```

动态 `import()` 让分析 JSON 不打入主 bundle，按需加载，不影响首屏性能。

---

## ✅ 最终结果

### 数据统计

| 项目 | 数量 |
|---|---|
| 宝可梦总数 | 1025 只（第一至第九世代） |
| 有中文名 | 1025 / 1025 ✅ |
| 特性种数 | 284 种（含中文名） |
| 本地精灵图 | 1025 张 |
| 本地高清图 | 1025 张 |
| 基础 JSON 大小 | 1.5 MB |
| SV 标准分级 | 705 只（含 BL 系列）|
| NatDex 分级 | 283 只（不在 SV 本传）|
| OU 英文分析 | 33/33 只 ✅ |
| OU 中文分析 | 31/33 只 ✅ |

### 功能清单

**图鉴主页** `/#/`
- [x] 宫格视图 / 列表视图切换
- [x] 实时搜索（中文 / 英文 / 编号三合一）
- [x] 世代筛选（第1~9世代）
- [x] 属性筛选（18种，含属性中文名）
- [x] 对战分级筛选（OU / UU / RU / NU / PU / ZU / Uber / AG / LC / NFE / 所有 BL 系列）
- [x] 无限滚动分页（每次加载 60 只）
- [x] 键盘 Esc 关闭弹窗
- [x] 图片懒加载

**宝可梦详情弹窗**
- [x] 「基本信息」页签：高清图 + 图鉴说明（中英）+ 特性（中英）+ 种族值彩色进度条
- [x] 「对战分析」页签：Overview / Sets / C&C 三段，支持中英对照 / 纯中文 / 纯英文切换
- [x] 分析数据按需懒加载（动态 import，不影响首屏）

**对战分级页** `/#/tiers`
- [x] 分级总览：15 个分级卡片，含中英描述 + 代表宝可梦小图
- [x] 分级详情页：宝可梦列表 + 搜索 + 排序 + 属性分布图
- [x] 上/下级分级快速跳转导航
- [x] 保留「在 Smogon 查看 ↗」外链

**分级 Badge**
- [x] 彩色分级标签（15 种分级各有专属颜色）
- [x] SV 标准分级点击 → 本地分级页
- [x] NatDex 分级标注 `ND·` 前缀

### 启动命令

```bash
# 开发模式（http://localhost:5173）
npm run dev

# 生产构建
npm run build
```

### 数据脚本（按顺序执行）

```bash
npm run data:fetch      # 1. 抓取全部宝可梦基础数据 + 下载图片（1025只）
npm run data:zh         # 2. 补充中文名（PokeAPI zh-hans）
npm run data:abilities  # 3. 补充特性中文名（284种）
npm run data:tiers      # 4. 从 PS 仓库获取 SV + NatDex 分级

# 抓取对战分析文章（可指定分级）
npm run data:analyses ou          # 只抓 OU（33只）
npm run data:analyses ou uu ru    # 抓多个分级
npm run data:analyses all         # 抓全部有分级的宝可梦
```

---

## 📚 参考资源

- [PokeAPI 文档](https://pokeapi.co/docs/v2) — 宝可梦基础数据（含多语言）
- [PokeAPI Sprites GitHub](https://github.com/PokeAPI/sprites) — 精灵图和官方图片
- [Pokemon Showdown formats-data.ts](https://github.com/smogon/pokemon-showdown/blob/master/data/formats-data.ts) — SV + NatDex 分级数据源
- [Smogon `_rpc/dump-pokemon`](https://www.smogon.com/dex/_rpc/dump-pokemon) — 分析文章 RPC（POST，支持 `language: "cn"`）
- [Smogon SV OU 格式页](https://www.smogon.com/dex/sv/formats/ou/) — 分级页面 URL 格式参考
- [Smogon 所有分级说明](https://www.smogon.com/tiers/) — 各分级含义
- [React Router v7](https://reactrouter.com/) — 客户端路由（HashRouter）
- [Vite 文档](https://vitejs.dev/) — 构建工具
- [React 19 文档](https://react.dev/) — 前端框架

---

*最后更新：2026-04-12 · 阶段：Plan B OU 完成，待扩展至全分级*

---

*生成时间：2026-04-12 · 数据版本：Scarlet/Violet (SV)*
