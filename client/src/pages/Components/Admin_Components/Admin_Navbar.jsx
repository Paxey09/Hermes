import '../../../styles/Admin_styles/Admin_Style.css';

  function Admin_Navbar({ onToggleSidebar, title }) {
      const handleLogout = () => {
          // Add your logout logic here
          localStorage.clear();
          window.location.href = '/';
      };

      return (
          <header className="admin-navbar">
              <button className="navbar-toggle" onClick={onToggleSidebar}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
              </button>
              <div className="navbar-title">
                  <h1>{title}</h1>
              </div>
              <div className="navbar-actions">
                  <button className="notification-btn">
                      <svg className="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                      <span className="notification-badge">3</span>
                  </button>

                  <div className="user-menu">
                      <button className="user-avatar">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                      </button>
                  </div>

                  <button className="logout-btn" onClick={handleLogout}>
                      <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span className="logout-text">Logout</span>
                  </button>
              </div>
          </header>
      );
  }

  export default Admin_Navbar;