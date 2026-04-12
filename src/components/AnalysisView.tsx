/**
 * 对战分析展示组件
 * 支持英文 / 中文 / 双语对照 三种模式
 */

interface Moveset {
  name: string;
  description: string;
  moveslots: Array<Array<{ move: string; type?: string }>>;
  ability: string[];
  item: string[];
  nature: string[];
  evs: Record<string, number>;
  teratypes: string[];
}

interface Strategy {
  format: string;
  overview: string;
  comments: string;
  movesets: Moveset[];
}

interface AnalysisData {
  en: Strategy[] | null;
  cn: Strategy[] | null;
}

interface AnalysisViewProps {
  data: AnalysisData;
  format: string;
  accentColor: string;
}

type LangMode = 'en' | 'cn' | 'bilingual';

import { useState } from 'react';

export function AnalysisView({ data, format, accentColor }: AnalysisViewProps) {
  const [langMode, setLangMode] = useState<LangMode>('bilingual');

  const enStrat = data.en?.find(s => s.format === format) || null;
  const cnStrat = data.cn?.find(s => s.format === format) || null;

  const hasCn = !!(cnStrat && (cnStrat.overview || cnStrat.comments || cnStrat.movesets.some(m => m.description)));
  const hasEn = !!(enStrat && (enStrat.overview || enStrat.movesets.length));

  if (!hasEn && !hasCn) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        暂无 {format} 分析文章 · No {format} analysis available
      </div>
    );
  }

  const modes: { key: LangMode; label: string }[] = [
    { key: 'bilingual', label: '中英对照' },
    { key: 'cn', label: '中文' },
    { key: 'en', label: 'English' },
  ];

  return (
    <div>
      {/* 语言切换 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>语言：</span>
        {modes.map(m => {
          const disabled = m.key === 'cn' && !hasCn;
          return (
            <button
              key={m.key}
              disabled={disabled}
              onClick={() => setLangMode(m.key)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${langMode === m.key ? accentColor : 'var(--border)'}`,
                background: langMode === m.key ? accentColor : 'transparent',
                color: disabled ? 'var(--text-muted)' : langMode === m.key ? '#fff' : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {m.label}
              {m.key === 'cn' && !hasCn && ' (暂无)'}
            </button>
          );
        })}
      </div>

      {/* Overview 概述 */}
      {(enStrat?.overview || cnStrat?.overview) && (
        <Section title="概述" subtitle="Overview" color={accentColor}>
          <BilingualBlock
            en={enStrat?.overview || ''}
            cn={cnStrat?.overview || ''}
            mode={langMode}
            hasCn={hasCn}
          />
        </Section>
      )}

      {/* Movesets 配置 */}
      {(enStrat?.movesets?.length ?? 0) > 0 && (
        <Section title="推荐配置" subtitle="Sets" color={accentColor}>
          {(enStrat?.movesets ?? []).map((ms, i) => {
            const cnMs = cnStrat?.movesets?.[i];
            return (
              <MovesetBlock
                key={i}
                en={ms}
                cn={cnMs}
                mode={langMode}
                hasCn={hasCn}
                color={accentColor}
              />
            );
          })}
        </Section>
      )}

      {/* Checks & Counters */}
      {(enStrat?.comments || cnStrat?.comments) && (
        <Section title="克制与应对" subtitle="Checks &amp; Counters / Other Options" color={accentColor}>
          <BilingualBlock
            en={enStrat?.comments || ''}
            cn={cnStrat?.comments || ''}
            mode={langMode}
            hasCn={hasCn}
          />
        </Section>
      )}
    </div>
  );
}

/* ── 子组件 ── */

function Section({ title, subtitle, color, children }: {
  title: string; subtitle: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '8px',
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: `2px solid ${color}44`,
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function BilingualBlock({ en, cn, mode, hasCn }: {
  en: string; cn: string; mode: LangMode; hasCn: boolean;
}) {
  if (!en && !cn) return null;

  if (mode === 'bilingual' && hasCn && en && cn) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ArticleHtml html={en} lang="en" />
        <ArticleHtml html={cn} lang="cn" />
      </div>
    );
  }

  const content = mode === 'cn' ? (cn || en) : en;
  return <ArticleHtml html={content} lang={mode === 'cn' ? 'cn' : 'en'} />;
}

function ArticleHtml({ html, lang }: { html: string; lang: string }) {
  if (!html) return null;
  return (
    <div
      lang={lang === 'cn' ? 'zh' : 'en'}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      style={{
        fontSize: '13px',
        lineHeight: 1.75,
        color: 'var(--text-secondary)',
      }}
    />
  );
}

function MovesetBlock({ en, cn, mode, hasCn, color }: {
  en: Moveset; cn?: Moveset; mode: LangMode; hasCn: boolean; color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}22`,
      borderRadius: '10px',
      padding: '16px 20px',
      marginBottom: '16px',
    }}>
      {/* 配置名 */}
      <div style={{ fontSize: '15px', fontWeight: 700, color, marginBottom: '12px' }}>
        {en.name}
      </div>

      {/* 招式槽位 */}
      {en.moveslots.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {en.moveslots.map((slot, i) => (
            <div key={i} style={{
              background: `${color}22`,
              border: `1px solid ${color}33`,
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}>
              {slot.map(m => m.move).join(' / ')}
            </div>
          ))}
        </div>
      )}

      {/* 快速参数行 */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        fontSize: '11px', color: 'var(--text-muted)',
        marginBottom: '12px', paddingBottom: '12px',
        borderBottom: `1px solid var(--border)`,
      }}>
        {en.item.length > 0 && <Chip label="道具" value={en.item.join(' / ')} />}
        {en.ability.length > 0 && <Chip label="特性" value={en.ability.join(' / ')} />}
        {en.nature.length > 0 && <Chip label="性格" value={en.nature.join(' / ')} />}
        {en.teratypes.length > 0 && <Chip label="太晶" value={en.teratypes.join(' / ')} />}
        {Object.keys(en.evs).length > 0 && (
          <Chip label="努力值" value={
            Object.entries(en.evs).map(([k, v]) => `${v} ${k}`).join(' / ')
          } />
        )}
      </div>

      {/* 配置描述 */}
      <BilingualBlock
        en={en.description}
        cn={cn?.description || ''}
        mode={mode}
        hasCn={hasCn && !!(cn?.description)}
      />
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span style={{ opacity: 0.6 }}>{label}：</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </span>
  );
}

/** 只允许安全的 HTML 标签，过滤 script/iframe 等 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/on\w+="[^"]*"/gi, '')
    // 把 Smogon 内部链接转为外链
    .replace(/href="\/dex\//g, 'href="https://www.smogon.com/dex/')
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}
