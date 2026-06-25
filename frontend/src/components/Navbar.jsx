import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Upload, Clock, FileCheck, Settings, Flag } from 'lucide-react';

export default function Navbar() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const userLinks = [
    { to: '/dashboard',   label: 'Dashboard', icon: BarChart2 },
    { to: '/submit',      label: 'Submit',    icon: Upload },
    { to: '/submissions', label: 'History',   icon: Clock },
  ];

  const adminLinks = [
    { to: '/admin/flagged',   label: 'Flagged',   icon: Flag },
    { to: '/admin/appeals',   label: 'Appeals',   icon: FileCheck },
    { to: '/admin/policies',  label: 'Policies',  icon: Settings },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div
      style={{
        background: '#AC956A',
        width: '270px',
        minHeight: '42vh',
        borderRadius: '0 70px 70px 0',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 0',
      }}
    >
      <p style={{
        color: 'rgba(44,36,22,0.5)',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        paddingLeft: '30px',
        marginBottom: '20px',
      }}>
        Menu
      </p>

      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: '4px',
        padding: '0 14px',
      }}>
        {links.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '14px 8px',
                borderRadius: '20px',
                textDecoration: 'none',
                flex: 1,
                transition: 'all 0.15s ease',
                background: active ? 'rgba(255,255,255,0.28)' : 'transparent',
                border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 2}
                style={{ color: active ? '#2c2416' : 'rgba(44,36,22,0.75)' }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 700 : 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: active ? '#2c2416' : 'rgba(44,36,22,0.7)',
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
