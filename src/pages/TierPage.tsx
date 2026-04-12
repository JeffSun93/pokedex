import { useParams, Link, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import type { Pokemon } from '../types/pokemon';
import { TIER_COLORS, TIER_NAMES_ZH, TIER_LIST, SMOGON_BASE_URL } from '../types/pokemon';
import { PokemonCard } from '../components/PokemonCard';
import { PokemonListRow, ListHeader } from '../components/PokemonListRow';
import { PokemonModal } from '../components/PokemonModal';
import { TypeBadge } from '../components/TypeBadge';
import { getTotalStats } from '../utils/pokemon';
import allPokemonData from '../data/pokemon.json';

const ALL_POKEMON = allPokemonData as Pokemon[];

// slug → tier name 的反向映射
function buildSlugMap() {
  const map: Record<string, string> = {};
  for (const p of ALL_POKEMON) {
    if (p.tier && p.tierSlug) map[p.tierSlug] = p.tier;
    if (p.natDexTier && p.natDexTierSlug) map[p.natDexTierSlug] = p.natDexTier;
  }
  return map;
}
const SLUG_TO_TIER = buildSlugMap();

// 按种族值总计排序
function sortPokemon(list: Pokemon[], by: SortKey): Pokemon[] {
  return [...list].sort((a, b) => {
    switch (by) {
      case 'id':    return a.id - b.id;
      case 'total': return getTotalStats(b) - getTotalStats(a);
      case 'hp':    return (b.stats[0]?.baseStat ?? 0) - (a.stats[0]?.baseStat ?? 0);
      case 'atk':   return (b.stats[1]?.baseStat ?? 0) - (a.stats[1]?.baseStat ?? 0);
      case 'spd':   return (b.stats[5]?.baseStat ?? 0) - (a.stats[5]?.baseStat ?? 0);
      default:      return a.id - b.id;
    }
  });
}

type SortKey = 'id' | 'total' | 'hp' | 'atk' | 'spd';

export function TierPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortKey>('id');
  const [search, setSearch] = useState('');

  const tier = slug ? SLUG_TO_TIER[slug] : undefined;
  const isNatDex = slug?.startsWith('national-dex') ?? false;
  const color = tier ? (TIER_COLORS[tier] || '#888') : '#888';

  const pokemon = useMemo(() => {
    if (!tier) return [];
    return isNatDex
      ? ALL_POKEMON.filter(p => !p.tier && p.natDexTier === tier)
      : ALL_POKEMON.filter(p => p.tier === tier);
  }, [tier, isNatDex]);

  const filtered = useMemo(() => {
    let list = pokemon;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.nameZh.includes(q) || String(p.id).includes(q)
      );
    }
    return sortPokemon(list, sortBy);
  }, [pokemon, search, sortBy]);

  if (!slug || (!tier && pokemon.length === 0)) {
    return <Navigate to="/tiers" replace />;
  }

  // 导航到相邻分级
  const currentIdx = TIER_LIST.indexOf(tier ?? '');
  const prevTier = currentIdx > 0 ? TIER_LIST[currentIdx - 1] : null;
  const nextTier = currentIdx < TIER_LIST.length - 1 ? TIER_LIST[currentIdx + 1] : null;

  const avgTotal = Math.round(pokemon.reduce((s, p) => s + getTotalStats(p), 0) / (pokemon.length || 1));

  return (
    <>
      {/* 分级 Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${color}22 0%, var(--bg-secondary) 60%)`,
        borderBottom: `1px solid ${color}33`,
        padding: '28px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* 面包屑 */}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>图鉴</Link>
            {' / '}
            <Link to="/tiers" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>对战分级</Link>
            {' / '}
            <span style={{ color: color }}>{isNatDex ? `NatDex · ` : ''}{tier}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            {/* 分级名 */}
            <div>
              <div style={{
                fontSize: '42px', fontWeight: 900, color,
                lineHeight: 1, marginBottom: '4px',
                textShadow: `0 2px 20px ${color}44`,
              }}>
                {isNatDex ? 'NatDex · ' : ''}{tier}
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {TIER_NAMES_ZH[tier ?? ''] || ''}
              </div>
            </div>

            {/* 统计 */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '4px' }}>
              <StatChip label="宝可梦数" value={pokemon.length} color={color} />
              <StatChip label="平均种族值" value={avgTotal} color={color} />
            </div>

            {/* Smogon 链接 */}
            <a
              href={`${SMOGON_BASE_URL}${slug}/`}
              target="_blank" rel="noopener noreferrer"
              style={{
                marginLeft: 'auto', marginBottom: '4px',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: `${color}22`, border: `1px solid ${color}55`,
                color, padding: '8px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              }}
            >
              在 Smogon 查看 ↗
            </a>
          </div>

          {/* 上/下一级导航 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {prevTier && TIER_COLORS[prevTier] && (
              <TierNavLink tier={prevTier} label={`← ${prevTier} · 更高`} />
            )}
            {nextTier && TIER_COLORS[nextTier] && (
              <TierNavLink tier={nextTier} label={`${nextTier} · 更低 →`} />
            )}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 24px',
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
        position: 'sticky', top: '64px', zIndex: 10,
      }}>
        {/* 搜索 */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '13px', color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="在此分级中搜索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text-primary)',
              padding: '7px 12px 7px 30px', fontSize: '13px', outline: 'none',
              width: '200px',
            }}
          />
        </div>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '6px', color: 'var(--text-primary)',
            padding: '7px 28px 7px 10px', fontSize: '13px', cursor: 'pointer', outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
          }}
        >
          <option value="id">按编号</option>
          <option value="total">按种族值总计</option>
          <option value="hp">按 HP</option>
          <option value="atk">按攻击</option>
          <option value="spd">按速度</option>
        </select>

        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filtered.length === pokemon.length
            ? `${pokemon.length} 只`
            : `${filtered.length} / ${pokemon.length} 只`}
        </span>

        {/* 视图切换 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', background: 'var(--bg-card)', padding: '3px', borderRadius: '6px' }}>
          {(['grid', 'list'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '4px 10px', borderRadius: '4px', fontSize: '13px',
              background: viewMode === m ? color : 'transparent',
              color: viewMode === m ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
            }}>{m === 'grid' ? '⊞' : '≡'}</button>
          ))}
        </div>
      </div>

      {/* 宝可梦列表 */}
      <main style={{ padding: viewMode === 'grid' ? '24px' : '0 0 40px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div>没有找到匹配的宝可梦</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map(p => (
              <PokemonCard key={p.id} pokemon={p} onClick={setSelected} />
            ))}
          </div>
        ) : (
          <>
            <ListHeader />
            {filtered.map(p => (
              <PokemonListRow key={p.id} pokemon={p} onClick={setSelected} />
            ))}
          </>
        )}
      </main>

      {/* 快速属性分布（仅宫格模式显示） */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <TypeDistribution pokemon={filtered} color={color} />
      )}

      {selected && <PokemonModal pokemon={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function TierNavLink({ tier, label }: { tier: string; label: string }) {
  const p = ALL_POKEMON.find(p => p.tier === tier);
  if (!p?.tierSlug) return null;
  const color = TIER_COLORS[tier] || '#888';
  return (
    <Link to={`/tiers/${p.tierSlug}`} style={{
      background: `${color}22`, border: `1px solid ${color}44`,
      color, padding: '4px 12px', borderRadius: '6px',
      fontSize: '12px', fontWeight: 600, textDecoration: 'none',
    }}>
      {label}
    </Link>
  );
}

function TypeDistribution({ pokemon, color }: { pokemon: Pokemon[]; color: string }) {
  const typeCounts: Record<string, number> = {};
  for (const p of pokemon) {
    for (const t of p.types) {
      typeCounts[t.name] = (typeCounts[t.name] || 0) + 1;
    }
  }
  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = sorted[0]?.[1] || 1;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          属性分布 · Type Distribution
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {sorted.map(([typeName, count]) => {
            const p = ALL_POKEMON.find(p => p.types.some(t => t.name === typeName));
            const typeObj = p?.types.find(t => t.name === typeName);
            return (
              <div key={typeName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color }}>{count}</div>
                <div style={{
                  width: '32px',
                  height: `${Math.max((count / max) * 60, 4)}px`,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s',
                }} />
                {typeObj && <TypeBadge typeName={typeName} typeNameZh={typeObj.nameZh} size="sm" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
