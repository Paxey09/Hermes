import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, CalendarDays, FolderKanban, MessageSquare, FileText, BarChart3 } from 'lucide-react';

function Client_Sidebar() {
  const navItems = [
    { to: '/ClientDashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/ClientProfile', icon: User, label: 'My Profile' },
    { to: '/ClientDemoBookings', icon: CalendarDays, label: 'My Bookings' },
    { to: '/ClientProjects', icon: FolderKanban, label: 'My Projects' },
  ];

  const comingSoonItems = [
    { icon: MessageSquare, label: 'Chatbot Config' },
    { icon: FileText, label: 'Documents' },
    { icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <aside className="admin-sidebar open">
      <div>
        <div className="sidebar-header">
          <h2>Client Portal</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-divider" style={{ margin: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          {comingSoonItems.map((item) => (
            <div key={item.label} className="nav-item disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <item.icon size={18} />
              <span className="nav-text">{item.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#888' }}>Soon</span>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Client_Sidebar;
