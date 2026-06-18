import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Upload, Clock, BarChart2, Settings, FileCheck } from 'lucide-react';

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
    { to: '/submit',      label: 'Submit',  icon: Upload },
    { to: '/submissions', label: 'History', icon: Clock },
  ];

  const adminLinks = [
    { to: '/admin/appeals',   label: 'Appeals',   icon: FileCheck },
    { to: '/admin/policies',  label: 'Policies',  icon: Settings },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="bg-bark text-white w-64 min-h-screen flex flex-col fixed left-0 top-0 z-10">
      {/* Logo */}
      <Link to={isAdmin ? '/admin/analytics' : '/dashboard'} className="flex items-center gap-3 px-6 py-5 border-b border-bark-dark">
        <Shield size={22} className="text-gold" />
        <span className="font-semibold text-base tracking-wide">ModerateAI</span>
      </Link>

      {/* Nav links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {!isAdmin && (
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors
              ${isActive('/dashboard') ? 'bg-gold text-white' : 'text-white/70 hover:text-white hover:bg-bark-dark'}`}
          >
            <BarChart2 size={16} />
            Dashboard
          </Link>
        )}
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors
              ${isActive(to) ? 'bg-gold text-white' : 'text-white/70 hover:text-white hover:bg-bark-dark'}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-bark-dark">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Signed in as</div>
        <div className="text-sm text-white/80 truncate mb-3">{user?.email}</div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${isAdmin ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/60'}`}>
            {user?.role?.toUpperCase()}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
