import '../../../styles/Admin_styles/Admin_Style.css';

  function Admin_Sidebar({ isOpen, onClose }) {
      return (
          <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
              <div className="sidebar-header">
                  <h2>Admin Panel</h2>
                  <button className="sidebar-close" onClick={onClose}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                  </button>
              </div>
              <nav className="sidebar-nav">
                  <a href="/AdminDashboard" className="nav-item">
                      <span className="nav-text">Dashboard</span>
                  </a>
                  <a href="/AdminAccountControl" className="nav-item">
                      <span className="nav-text">Accounts Control</span>
                  </a>
              </nav>
          </aside>
      );
  }

  export default Admin_Sidebar;