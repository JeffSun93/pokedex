import type { Pokemon } from '../types/pokemon';
import { TYPE_COLORS } from '../types/pokemon';
import { TypeBadge } from './TypeBadge';
import { TierBadge } from './TierBadge';
import { formatId, getTotalStats } from '../utils/pokemon';

interface PokemonCardProps {
  pokemon: Pokemon;
  onClick: (p: Pokemon) => void;
}

export function PokemonCard({ pokemon, onClick }: PokemonCardProps) {
  const mainType = pokemon.types[0]?.name || 'normal';
  const color = TYPE_COLORS[mainType] || '#888';
  const total = getTotalStats(pokemon);

  return (
    <div
      onClick={() => onClick(pokemon)}
      style={{
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${color}22 100%)`,
        border: `1px solid ${color}33`,
        borderRadius: 'var(--radius)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = `0 12px 32px ${color}40`;
        el.style.borderColor = `${color}66`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.borderColor = `${color}33`;
      }}
    >
      {/* 背景编号水印 */}
      <div style={{
        position: 'absolute',
        right: '-8px',
        bottom: '-12px',
        fontSize: '72px',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.03)',
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        {String(pokemon.id).padStart(3, '0')}
      </div>

      {/* 顶部：编号 + 分级 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {formatId(pokemon.id)}
        </span>
        {pokemon.tier && pokemon.tierSlug ? (
          <TierBadge tier={pokemon.tier} tierSlug={pokemon.tierSlug} size="sm" />
        ) : pokemon.natDexTier && pokemon.natDexTierSlug ? (
          <TierBadge tier={pokemon.natDexTier} tierSlug={pokemon.natDexTierSlug} isNatDex size="sm" />
        ) : null}
      </div>

      {/* 精灵图 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', height: '80px', alignItems: 'center' }}>
        <img
          src={pokemon.sprite}
          alt={pokemon.nameZh}
          loading="lazy"
          style={{ width: '80px', height: '80px', imageRendering: 'pixelated', objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
        />
      </div>

      {/* 名字 */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {pokemon.nameZh}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {pokemon.name}
        </div>
      </div>

      {/* 属性 */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
        {pokemon.types.map(t => (
          <TypeBadge key={t.name} typeName={t.name} typeNameZh={t.nameZh} size="sm" />
        ))}
      </div>

      {/* 六维总值 */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        总能力值 <span style={{ color: color, fontWeight: 700 }}>{total}</span>
      </div>

      {/* 迷你属性条 */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '2px' }}>
        {pokemon.stats.map(s => {
          const pct = Math.min((s.baseStat / 180) * 100, 100);
          return (
            <div key={s.name} title={`${s.nameZh}: ${s.baseStat}`} style={{ flex: 1 }}>
              <div style={{
                height: '3px',
                background: `rgba(255,255,255,0.1)`,
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '2px',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
