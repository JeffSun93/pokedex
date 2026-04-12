import { TIER_COLORS, TIER_NAMES_ZH, SMOGON_BASE_URL } from '../types/pokemon';

interface TierBadgeProps {
  tier: string;
  tierSlug: string;
  isNatDex?: boolean;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, tierSlug, isNatDex = false, size = 'md' }: TierBadgeProps) {
  const color = TIER_COLORS[tier] || '#888';
  const zhName = TIER_NAMES_ZH[tier];
  const url = `${SMOGON_BASE_URL}${tierSlug}/`;

  const pad = size === 'sm' ? '2px 7px' : '3px 11px';
  const fontSize = size === 'sm' ? '10px' : '11px';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${isNatDex ? '[NatDex] ' : ''}${tier}${zhName ? ' · ' + zhName : ''} — 在 Smogon 查看`}
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: color,
        color: '#fff',
        padding: pad,
        borderRadius: '5px',
        fontSize,
        fontWeight: 700,
        textDecoration: 'none',
        letterSpacing: '0.3px',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        boxShadow: `0 1px 4px ${color}66`,
        transition: 'filter 0.15s, transform 0.15s',
        lineHeight: 1.4,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.filter = 'brightness(1.15)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.filter = '';
        el.style.transform = '';
      }}
    >
      {isNatDex && (
        <span style={{ opacity: 0.85, fontSize: '0.8em', fontWeight: 500 }}>ND·</span>
      )}
      {tier}
    </a>
  );
}
