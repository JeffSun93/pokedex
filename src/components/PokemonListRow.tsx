import type { Pokemon } from '../types/pokemon';
import { TYPE_COLORS } from '../types/pokemon';
import { TypeBadge } from './TypeBadge';
import { TierBadge } from './TierBadge';
import { formatId, getTotalStats } from '../utils/pokemon';

interface PokemonListRowProps {
  pokemon: Pokemon;
  onClick: (p: Pokemon) => void;
}

export function PokemonListRow({ pokemon, onClick }: PokemonListRowProps) {
  const mainType = pokemon.types[0]?.name || 'normal';
  const color = TYPE_COLORS[mainType] || '#888';
  const total = getTotalStats(pokemon);

  return (
    <div
      onClick={() => onClick(pokemon)}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 56px 1fr 120px 80px repeat(6, 48px) 56px',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background var(--transition)',
        borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${color}15`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
        {formatId(pokemon.id)}
      </span>
      <img
        src={pokemon.sprite}
        alt={pokemon.nameZh}
        loading="lazy"
        style={{ width: '48px', height: '48px', imageRendering: 'pixelated', objectFit: 'contain' }}
      />
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>{pokemon.nameZh}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pokemon.name}</div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {pokemon.types.map(t => (
          <TypeBadge key={t.name} typeName={t.name} typeNameZh={t.nameZh} size="sm" />
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        {pokemon.tier && pokemon.tierSlug ? (
          <TierBadge tier={pokemon.tier} tierSlug={pokemon.tierSlug} size="sm" />
        ) : pokemon.natDexTier && pokemon.natDexTierSlug ? (
          <TierBadge tier={pokemon.natDexTier} tierSlug={pokemon.natDexTierSlug} isNatDex size="sm" />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
        )}
      </div>
      {pokemon.stats.map(s => (
        <div key={s.name} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
          {s.baseStat}
        </div>
      ))}
      <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: color }}>
        {total}
      </div>
    </div>
  );
}

export function ListHeader() {
  const cols = ['HP', '攻击', '防御', '特攻', '特防', '速度'];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 56px 1fr 120px 80px repeat(6, 48px) 56px',
      gap: '8px',
      padding: '8px 16px',
      fontSize: '11px',
      color: 'var(--text-muted)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: '120px',
      background: 'var(--bg-primary)',
      zIndex: 5,
    }}>
      <span>编号</span>
      <span></span>
      <span>名称</span>
      <span>属性</span>
      <span>分级</span>
      {cols.map(c => <span key={c} style={{ textAlign: 'center' }}>{c}</span>)}
      <span style={{ textAlign: 'center' }}>总计</span>
    </div>
  );
}
