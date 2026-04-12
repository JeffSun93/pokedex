import type { Pokemon, Filters } from '../types/pokemon';

export function filterPokemon(pokemon: Pokemon[], filters: Filters): Pokemon[] {
  return pokemon.filter(p => {
    // 搜索（支持中文名、英文名、编号）
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchZh = p.nameZh.includes(q);
      const matchId = String(p.id).includes(q);
      if (!matchName && !matchZh && !matchId) return false;
    }

    // 世代筛选
    if (filters.generation !== 0 && p.generation !== filters.generation) return false;

    // 属性筛选
    if (filters.type && !p.types.some(t => t.name === filters.type)) return false;

    // 分级筛选（同时匹配 SV tier 和 NatDex tier）
    if (filters.tier) {
      const t = filters.tier;
      const matchSV = p.tier === t;
      const matchNatDex = p.natDexTier === t;
      if (!matchSV && !matchNatDex) return false;
    }

    return true;
  });
}

export function formatId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

export function formatHeight(height: number): string {
  const m = (height / 10).toFixed(1);
  return `${m} m`;
}

export function formatWeight(weight: number): string {
  const kg = (weight / 10).toFixed(1);
  return `${kg} kg`;
}

export function getStatColor(value: number): string {
  if (value >= 150) return '#22d3ee';
  if (value >= 120) return '#4ade80';
  if (value >= 90) return '#86efac';
  if (value >= 60) return '#facc15';
  if (value >= 30) return '#fb923c';
  return '#f87171';
}

export function getTotalStats(pokemon: Pokemon): number {
  return pokemon.stats.reduce((sum, s) => sum + s.baseStat, 0);
}
