import { NavLink } from 'react-router-dom';

export function Header() {
  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    fontSize: '13px',
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: '6px',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent)' : 'transparent',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <header style={{
      background: 'rgba(22, 33, 62, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--accent)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
        }}>⚡</div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
            宝可梦图鉴
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Pokédex · SV · 朱/紫
          </div>
        </div>
      </NavLink>

      {/* 导航 */}
      <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <NavLink to="/" end style={navLinkStyle}>
          图鉴
        </NavLink>
        <NavLink to="/tiers" style={navLinkStyle}>
          对战分级
        </NavLink>
      </nav>
    </header>
  );
}
