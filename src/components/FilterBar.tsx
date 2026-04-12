import type { Filters, FilterGeneration } from '../types/pokemon';
import { GENERATION_NAMES, TIER_LIST, TIER_NAMES_ZH, TYPE_NAMES_ZH } from '../types/pokemon';

interface FilterBarProps {
  filters: Filters;
  total: number;
  filtered: number;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  viewMode: 'grid' | 'list';
  onViewChange: (m: 'grid' | 'list') => void;
}

const ALL_TYPES = Object.keys(TYPE_NAMES_ZH);

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '30px',
  minWidth: '120px',
};

export function FilterBar({ filters, total, filtered, onChange, onReset, viewMode, onViewChange }: FilterBarProps) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '12px 24px',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'sticky',
      top: '64px',
      zIndex: 10,
    }}>
      {/* 搜索框 */}
      <div style={{ position: 'relative', flex: '1', minWidth: '180px', maxWidth: '280px' }}>
        <span style={{
          position: 'absolute', left: '12px', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '14px', color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          placeholder="搜索名称 / Search..."
          value={filters.search}
          onChange={e => onChange({ search: e.target.value })}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            padding: '8px 12px 8px 36px',
            fontSize: '13px',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
        />
      </div>

      {/* 世代 */}
      <select
        value={filters.generation}
        onChange={e => onChange({ generation: Number(e.target.value) as FilterGeneration })}
        style={selectStyle}
      >
        {Object.entries(GENERATION_NAMES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* 属性 */}
      <select
        value={filters.type}
        onChange={e => onChange({ type: e.target.value })}
        style={selectStyle}
      >
        <option value="">全部属性</option>
        {ALL_TYPES.map(t => (
          <option key={t} value={t}>{TYPE_NAMES_ZH[t]} ({t})</option>
        ))}
      </select>

      {/* 分级 */}
      <select
        value={filters.tier}
        onChange={e => onChange({ tier: e.target.value })}
        style={selectStyle}
      >
        <option value="">全部分级</option>
        {TIER_LIST.map(t => (
          <option key={t} value={t}>
            {t}{TIER_NAMES_ZH[t] ? ` · ${TIER_NAMES_ZH[t]}` : ''}
          </option>
        ))}
      </select>

      {/* 重置 */}
      {(filters.search || filters.generation !== 0 || filters.type || filters.tier) && (
        <button onClick={onReset} style={{
          background: 'var(--accent)', color: '#fff',
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
        }}>重置</button>
      )}

      {/* 右侧：计数 + 视图切换 */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered === total ? `共 ${total} 只` : `${filtered} / ${total} 只`}
        </span>
        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-card)', padding: '3px', borderRadius: '6px' }}>
          {(['grid', 'list'] as const).map(m => (
            <button key={m} onClick={() => onViewChange(m)} style={{
              padding: '4px 10px', borderRadius: '4px', fontSize: '13px',
              background: viewMode === m ? 'var(--accent)' : 'transparent',
              color: viewMode === m ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
            }}>
              {m === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
