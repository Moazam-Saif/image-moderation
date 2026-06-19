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

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className="flex flex-col items-center justify-center gap-6"
      style={{
        background: '#d9d9d9',
        width: '80px',
        height: '42vh',
        borderRadius: '100px 0 0 100px',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: '#a56c6c' }}
        title={user?.email}
      >
        {initials}
      </div>

      <div className="w-6 h-px" style={{ background: 'rgba(165,108,108,0.3)' }} />

      <button
        onClick={handleLogout}
        title="Logout"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
        style={{ color: '#a56c6c' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(165,108,108,0.12)';
          e.currentTarget.style.color = '#8a5353';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#a56c6c';
        }}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
