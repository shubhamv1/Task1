import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../services/socket';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/projects" className="text-xl font-bold text-blue-600">
        ProjectHub
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name}
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {user.role}
            </span>
          </span>
          <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
