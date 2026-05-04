import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

function Client_Sidebar() {
  return (
    <aside className="admin-sidebar open">
      <div>
        <div className="sidebar-header">
          <h2>Client Portal</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/ClientDashboard" end className="nav-item">
            <LayoutDashboard size={18} />
            <span className="nav-text">Dashboard</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}

export default Client_Sidebar;
