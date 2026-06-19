import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Upload, Clock, FileCheck, Settings, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const userLinks = [
    { to: '/dashboard',   label: 'Dashboard', icon: BarChart2 },
    { to: '/submit',      label: 'Submit',    icon: Upload },
    { to: '/submissions', label: 'History',   icon: Clock },
  ];

  const adminLinks = [
    { to: '/admin/appeals',   label: 'Appeals',   icon: FileCheck },
    { to: '/admin/policies',  label: 'Policies',  icon: Settings },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div
      className="text-white flex flex-col py-8 px-6"
      style={{
        background: '#AC956A',
        width: '220px',
        minHeight: '42vh',
        borderRadius: '0 70px 70px 0',
      }}
    >
      {/* Section label */}
      <p className="text-white/40 text-xs font-semibold tracking-[0.3em] uppercase mb-6">Menu</p>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link ${isActive(to) ? 'nav-link-active' : ''}`}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <p className="text-white/40 text-xs truncate mb-3">{user?.email}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-pill bg-white/20 text-white">
            {user?.role?.toUpperCase()}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}