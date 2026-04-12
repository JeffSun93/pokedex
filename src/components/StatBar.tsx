import { getStatColor } from '../utils/pokemon';

interface StatBarProps {
  nameZh: string;
  value: number;
  max?: number;
}

export function StatBar({ nameZh, value, max = 255 }: StatBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = getStatColor(value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{
        width: '40px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {nameZh}
      </span>
      <span style={{
        width: '32px',
        fontSize: '12px',
        fontWeight: 700,
        color: color,
        flexShrink: 0,
      }}>
        {value}
      </span>
      <div style={{
        flex: 1,
        height: '6px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}
