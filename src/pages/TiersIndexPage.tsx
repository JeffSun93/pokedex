import { Link } from 'react-router-dom';
import { TIER_LIST, TIER_NAMES_ZH, SMOGON_BASE_URL } from '../types/pokemon';
import type { Pokemon } from '../types/pokemon';
import allPokemonData from '../data/pokemon.json';

const ALL_POKEMON = allPokemonData as Pokemon[];

// 统计每个分级的宝可梦数（SV + NatDex 分开）
function buildTierStats() {
  const svCounts: Record<string, number> = {};
  const natCounts: Record<string, number> = {};
  const svSlugs: Record<string, string> = {};
  const natSlugs: Record<string, string> = {};

  for (const p of ALL_POKEMON) {
    if (p.tier && p.tierSlug) {
      svCounts[p.tier] = (svCounts[p.tier] || 0) + 1;
      svSlugs[p.tier] = p.tierSlug;
    }
    if (p.natDexTier && p.natDexTierSlug) {
      natCounts[p.natDexTier] = (natCounts[p.natDexTier] || 0) + 1;
      natSlugs[p.natDexTier] = p.natDexTierSlug;
    }
  }
  return { svCounts, natCounts, svSlugs, natSlugs };
}

const { svCounts, svSlugs } = buildTierStats();

// 分级详细说明
const TIER_DESC: Record<string, { zh: string; en: string }> = {
  AG:   { zh: '无限制，任何宝可梦均可使用，几乎没有禁用规则', en: 'Anything Goes — virtually no bans' },
  Uber: { zh: '超级分级，顶尖强力宝可梦聚集地，含各代传说', en: 'Power house tier, includes most legendaries' },
  OU:   { zh: '过度使用，标准对战最常用的分级，竞技主流', en: 'Overused — the standard competitive tier' },
  UUBL: { zh: 'UU 禁用，实力超过 UU 但未能进入 OU 的宝可梦', en: 'UU Banlist — too strong for UU' },
  UU:   { zh: '低度使用，OU 中出场率低但依然实力不俗', en: 'Underused — capable but uncommon in OU' },
  RUBL: { zh: 'RU 禁用，实力超过 RU 但未能进入 UU 的宝可梦', en: 'RU Banlist — too strong for RU' },
  RU:   { zh: '极少使用，在 UU 中见不到的宝可梦', en: 'Rarely Used — absent from UU' },
  NUBL: { zh: 'NU 禁用，实力超过 NU 但未能进入 RU 的宝可梦', en: 'NU Banlist — too strong for NU' },
  NU:   { zh: '从未使用，RU 中出场率极低的宝可梦', en: 'Never Used — absent from RU' },
  PUBL: { zh: 'PU 禁用，实力超过 PU 但未能进入 NU 的宝可梦', en: 'PU Banlist — too strong for PU' },
  PU:   { zh: '几乎不用，NU 中也难以见到的宝可梦', en: 'Partially Used — absent from NU' },
  ZUBL: { zh: 'ZU 禁用，实力超过 ZU 但未能进入 PU 的宝可梦', en: 'ZU Banlist — too strong for ZU' },
  ZU:   { zh: '零使用，竞技场中最少出现的宝可梦', en: 'Zero Used — the lowest standard tier' },
  NFE:  { zh: '未完全进化，尚未进化到最终形态的宝可梦', en: 'Not Fully Evolved — pre-evolutions' },
  LC:   { zh: '小宝贝，限定只能使用一阶段宝可梦，等级上限 5', en: 'Little Cup — level 5 baby Pokémon only' },
};

// 代表性宝可梦（每个分级取前5只展示）
function getRepresentatives(tier: string, count = 5): Pokemon[] {
  return ALL_POKEMON.filter(p => p.tier === tier).slice(0, count);
}

export function TiersIndexPage() {
  const svTiers = TIER_LIST.filter(t => svCounts[t]);

  return (
    <main style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
          对战分级体系
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
          Smogon 将宝可梦按竞技使用率和强度分为不同等级。
          分级每月更新，反映当前对战环境（Metagame）。
          点击分级卡片查看该分级下的所有宝可梦，或点击 Smogon 链接查看英文原版。
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
          Smogon divides Pokémon into tiers based on competitive usage and power level.
          Tiers are updated monthly to reflect the current metagame.
        </p>
      </div>

      {/* SV 标准分级 */}
      <section style={{ marginBottom: '48px' }}>
        <SectionTitle zh="SV 标准分级" en="Scarlet / Violet Standard Tiers" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {svTiers.map(tier => (
            <TierCard
              key={tier}
              tier={tier}
              slug={svSlugs[tier]}
              count={svCounts[tier] || 0}
              isNatDex={false}
            />
          ))}
        </div>
      </section>

      {/* NatDex 说明 */}
      <section>
        <SectionTitle zh="National Dex 格式" en="National Dex Format" />
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          marginBottom: '16px',
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
        }}>
          <p style={{ marginBottom: '8px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>National Dex（全国图鉴）</strong> 格式允许使用未收录于 SV 本传的宝可梦。
            以下宝可梦在 SV 标准赛中标记为 <code style={{ color: 'var(--accent)', fontSize: '12px' }}>Illegal</code>，
            但在 NatDex 格式中有效参赛。
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            National Dex format allows Pokémon not native to SV.
            These are marked Illegal in standard SV play but are valid in National Dex.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['Uber','OU','UU','RU'] as const).map(t => {
              const slug = t === 'Uber' ? 'national-dex-ubers'
                         : t === 'OU'   ? 'national-dex'
                         : t === 'UU'   ? 'national-dex-uu'
                                        : 'national-dex-ru';
              return (
                <a key={t} href={`${SMOGON_BASE_URL}${slug}/`} target="_blank" rel="noopener noreferrer"
                  style={{
                    background: TIER_COLORS[t] || '#888',
                    color: '#fff', padding: '4px 12px',
                    borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                    textDecoration: 'none',
                  }}>
                  NatDex {t}
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
        {zh}
      </h2>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{en}</div>
    </div>
  );
}

function TierCard({ tier, slug, count, isNatDex }: {
  tier: string; slug: string; count: number; isNatDex: boolean;
}) {
  const color = TIER_COLORS[tier] || '#888';
  const desc = TIER_DESC[tier];
  const reps = getRepresentatives(tier);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${color}33`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'grid',
      gridTemplateColumns: '120px 1fr auto',
      gap: '20px',
      alignItems: 'center',
    }}>
      {/* 左：分级标签 + 数量 */}
      <div>
        <Link
          to={`/tiers/${slug}`}
          style={{
            display: 'inline-block',
            background: color,
            color: '#fff',
            padding: '6px 18px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 800,
            textDecoration: 'none',
            marginBottom: '6px',
            boxShadow: `0 2px 8px ${color}55`,
            transition: 'filter 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}
        >
          {isNatDex ? `ND·${tier}` : tier}
        </Link>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {TIER_NAMES_ZH[tier]}
        </div>
        <div style={{ fontSize: '11px', color: color, fontWeight: 600, marginTop: '4px' }}>
          {count} 只
        </div>
      </div>

      {/* 中：描述 + 代表宝可梦 */}
      <div>
        {desc && (
          <>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.6 }}>
              {desc.zh}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
              {desc.en}
            </p>
          </>
        )}
        {/* 代表性宝可梦小图标 */}
        {reps.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {reps.map(p => (
              <img
                key={p.id}
                src={p.sprite}
                alt={p.nameZh}
                title={`${p.nameZh} (${p.name})`}
                style={{ width: '40px', height: '40px', imageRendering: 'pixelated', objectFit: 'contain' }}
              />
            ))}
            {count > 5 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                +{count - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右：操作按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
        <Link
          to={`/tiers/${slug}`}
          style={{
            background: color,
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          查看全部 →
        </Link>
        <a
          href={`${SMOGON_BASE_URL}${slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Smogon ↗
        </a>
      </div>
    </div>
  );
}

import { TIER_COLORS } from '../types/pokemon';
