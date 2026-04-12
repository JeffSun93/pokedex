import { useEffect, useCallback, useState, lazy, Suspense } from 'react';
import type { Pokemon } from '../types/pokemon';
import { TYPE_COLORS } from '../types/pokemon';
import { TypeBadge } from './TypeBadge';
import { TierBadge } from './TierBadge';
import { StatBar } from './StatBar';
import { formatId, formatHeight, formatWeight, getTotalStats } from '../utils/pokemon';

const AnalysisView = lazy(() =>
  import('./AnalysisView').then(m => ({ default: m.AnalysisView }))
);

interface PokemonModalProps {
  pokemon: Pokemon;
  onClose: () => void;
}

type Tab = 'info' | 'analysis';

export function PokemonModal({ pokemon, onClose }: PokemonModalProps) {
  const [tab, setTab] = useState<Tab>('info');
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const mainType = pokemon.types[0]?.name || 'normal';
  const color = TYPE_COLORS[mainType] || '#888';
  const total = getTotalStats(pokemon);
  const tierForAnalysis = pokemon.tier || pokemon.natDexTier || '';

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  // 切换到分析 tab 时懒加载数据
  useEffect(() => {
    if (tab !== 'analysis' || analysisData) return;
    setAnalysisLoading(true);
    import(`../data/analyses/${pokemon.name}.json`)
      .then(m => { setAnalysisData(m.default); })
      .catch(() => { setAnalysisData({}); })
      .finally(() => setAnalysisLoading(false));
  }, [tab, pokemon.name, analysisData]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${color}44`,
        borderRadius: '20px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: `0 24px 80px ${color}30`,
        position: 'relative',
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
            fontSize: '18px', cursor: 'pointer', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>

        {/* 顶部：渐变背景 + 高清图 */}
        <div style={{
          background: `linear-gradient(160deg, ${color}44 0%, var(--bg-secondary) 60%)`,
          padding: '40px 32px 0',
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', marginBottom: '20px' }}>
            <img
              src={pokemon.artwork}
              alt={pokemon.nameZh}
              style={{ width: '140px', height: '140px', objectFit: 'contain', flexShrink: 0 }}
              onError={e => {
                const img = e.target as HTMLImageElement;
                // 本地高清图不存在时（如 GitHub Pages）→ PokeAPI CDN
                if (!img.src.includes('raw.githubusercontent.com')) {
                  img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
                } else {
                  // CDN 也失败时 → 像素精灵图
                  img.src = pokemon.sprite;
                  img.style.imageRendering = 'pixelated';
                }
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {formatId(pokemon.id)}{pokemon.genusZh && ` · ${pokemon.genusZh}`}
              </div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1.1, marginBottom: '4px' }}>
                {pokemon.nameZh}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {pokemon.name}{pokemon.genus && ` · ${pokemon.genus}`}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {pokemon.types.map(t => (
                  <TypeBadge key={t.name} typeName={t.name} typeNameZh={t.nameZh} />
                ))}
                {pokemon.tier && pokemon.tierSlug ? (
                  <TierBadge tier={pokemon.tier} tierSlug={pokemon.tierSlug} />
                ) : pokemon.natDexTier && pokemon.natDexTierSlug ? (
                  <TierBadge tier={pokemon.natDexTier} tierSlug={pokemon.natDexTierSlug} isNatDex />
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <InfoChip label="身高" value={formatHeight(pokemon.height)} />
                <InfoChip label="体重" value={formatWeight(pokemon.weight)} />
                <InfoChip label="世代" value={`第${pokemon.generation}世代`} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px' }}>
            <TabBtn label="基本信息" active={tab === 'info'} color={color} onClick={() => setTab('info')} />
            <TabBtn
              label={`对战分析${tierForAnalysis ? ` · ${tierForAnalysis}` : ''}`}
              active={tab === 'analysis'}
              color={color}
              onClick={() => setTab('analysis')}
            />
          </div>
        </div>

        {/* Tab 内容 */}
        <div style={{ padding: '24px 32px' }}>
          {tab === 'info' && (
            <InfoTab pokemon={pokemon} color={color} total={total} />
          )}
          {tab === 'analysis' && (
            <div>
              {analysisLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  加载分析数据...
                </div>
              ) : analysisData && Object.keys(analysisData).length > 0 ? (
                <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>渲染中...</div>}>
                  <AnalysisView
                    data={analysisData as { en: never; cn: never }}
                    format={tierForAnalysis}
                    accentColor={color}
                  />
                </Suspense>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
                  <div>暂无该宝可梦的对战分析</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.7 }}>No analysis available</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px',
      fontSize: '13px', fontWeight: 600,
      background: active ? 'var(--bg-secondary)' : 'transparent',
      color: active ? color : 'var(--text-muted)',
      border: 'none', cursor: 'pointer',
      borderRadius: '8px 8px 0 0',
      borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '1px' }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '13px' }}>{value}</div>
    </div>
  );
}

function InfoTab({ pokemon, color, total }: { pokemon: Pokemon; color: string; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 图鉴描述 */}
      {(pokemon.flavorTextZh || pokemon.flavorText) && (
        <div>
          <SectionTitle>图鉴说明</SectionTitle>
          {pokemon.flavorTextZh && (
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '4px' }}>
              {pokemon.flavorTextZh}
            </p>
          )}
          {pokemon.flavorText && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {pokemon.flavorText}
            </p>
          )}
        </div>
      )}

      {/* 特性 */}
      {pokemon.abilities.length > 0 && (
        <div>
          <SectionTitle>特性</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pokemon.abilities.map(a => (
              <div key={a.slot} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.04)', padding: '8px 12px',
                borderRadius: '8px', fontSize: '13px',
              }}>
                <span style={{ fontWeight: 600 }}>{a.nameZh || a.name}</span>
                {a.nameZh && a.nameZh !== a.name && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{a.name}</span>
                )}
                {a.isHidden && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '10px',
                    background: `${color}33`, color,
                    padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                  }}>梦特性</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 种族值 */}
      <div>
        <SectionTitle>
          种族值
          <span style={{ marginLeft: '8px', fontSize: '13px', color, fontWeight: 700 }}>
            总计 {total}
          </span>
        </SectionTitle>
        {pokemon.stats.map(s => (
          <StatBar key={s.name} nameZh={s.nameZh} value={s.baseStat} />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '1px',
      marginBottom: '10px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      {children}
    </h3>
  );
}
