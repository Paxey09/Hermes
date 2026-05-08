import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabaseClient.js';
import '../../../styles/Admin_styles/Admin_Style.css';

function Client_Navbar({ onToggleSidebar, title = 'Client Dashboard' }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="admin-navbar">
      <button className="navbar-toggle" onClick={onToggleSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="navbar-title">
        <h1>{title}</h1>
      </div>

      <div className="navbar-actions">
        <div className="user-menu">
          <button className="user-avatar" onClick={() => navigate('/ClientDashboard/profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Client_Navbar;
