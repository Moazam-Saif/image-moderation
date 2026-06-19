import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function RightPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Generate initials from email
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className="bg-mist flex flex-col items-center justify-center gap-6"
      style={{
        width: '80px',
        height: '42vh',
        borderRadius: '100px 0 0 100px',
      }}
    >
      {/* User avatar */}
      <div
        className="flex flex-col items-center gap-1.5"
        title={user?.email}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: '#AC956A' }}
        >
          {initials}
        </div>
        <span
          className="text-bark-mid font-medium"
          style={{
            fontSize: '9px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            letterSpacing: '0.15em',
            maxHeight: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.email?.split('@')[0]}
        </span>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-bark-mid/20" />

      {/* Logout button */}
      <button
        onClick={handleLogout}
        title="Logout"
        className="w-9 h-9 rounded-full flex items-center justify-center text-bark-mid/50 hover:text-terra hover:bg-white/60 transition-all duration-150"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}