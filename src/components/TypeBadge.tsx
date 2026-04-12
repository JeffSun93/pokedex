import { TYPE_COLORS } from '../types/pokemon';

interface TypeBadgeProps {
  typeName: string;
  typeNameZh: string;
  size?: 'sm' | 'md';
}

export function TypeBadge({ typeName, typeNameZh, size = 'md' }: TypeBadgeProps) {
  const color = TYPE_COLORS[typeName] || '#888';

  return (
    <span
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: size === 'sm' ? '2px 8px' : '3px 12px',
        borderRadius: '999px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        display: 'inline-block',
        lineHeight: 1.6,
      }}
    >
      {typeNameZh} <span style={{ opacity: 0.8, fontSize: '0.85em' }}>{typeName}</span>
    </span>
  );
}
