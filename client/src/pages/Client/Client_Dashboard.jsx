import Client_Layout from '../Components/Client_Components/Client_Layout.jsx';

function Client_Dashboard() {
  const modules = [
    {
      id: 1,
      title: 'CRM / Profile',
      description: 'View your company profile, contact details, and account information.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      ),
      link: '/ClientDashboard/profile',
      color: '#4caf50',
      layer: 'Profile',
      status: 'coming soon',
      disabled: true,
    },
    {
      id: 2,
      title: 'Personal Bookings',
      description: 'View your demo bookings, schedules, and meeting details.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <path d="M3 10h18"></path>
        </svg>
      ),
      link: '/ClientDashboard/demo-bookings',
      color: '#c9a84c',
      layer: 'Meetings',
      status: 'coming soon',
      disabled: true,
    },
    {
      id: 3,
      title: 'Personal Projects',
      description: 'Track your active projects, progress, modules, and updates.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <path d="M9 9h6"></path>
          <path d="M9 15h6"></path>
        </svg>
      ),
      link: '/ClientDashboard/projects',
      color: '#42a5f5',
      layer: 'Delivery',
      status: 'coming soon',
      disabled: true,
    },
    {
      id: 4,
      title: 'Hermes Chatbot',
      description: 'Chat with Hermes AI for client support and guidance.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      link: '/ClientDashboard/hermes-chatbot',
      color: '#c9a84c',
      layer: 'Intelligence',
      status: 'active',
      disabled: false,
    },
    {
      id: 5,
      title: 'ERP',
      description: 'Manage your workspace items, services, assets, categories, stock, and availability.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <path d="M3.27 6.96 12 12.01l8.73-5.05"></path>
          <path d="M12 22.08V12"></path>
        </svg>
      ),
      link: '/ClientDashboard/erp',
      color: '#2196f3',
      layer: 'Operations',
      status: 'active',
      disabled: false,
    },
    {
      id: 6,
      title: 'Analytics & Reports',
      description: 'View business reports, activity summaries, and performance insights.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
      link: '#',
      color: '#9c27b0',
      layer: 'Reporting',
      status: 'coming soon',
      disabled: true,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'coming soon':
        return '#ffa726';
      case 'inactive':
        return '#ff6b6b';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <Client_Layout title="Dashboard">
      <div className="dashboard-welcome">
        <h1>Welcome to the Client Dashboard</h1>
        <p>Select a module below to manage your workspace.</p>
      </div>

      <div className="dashboard-modules">
        {modules.map((module) => (
          <a
            key={module.id}
            href={module.link}
            className={`module-card ${module.disabled ? 'disabled' : ''}`}
            style={{ '--module-color': module.color }}
            onClick={module.disabled ? (e) => e.preventDefault() : undefined}
          >
            <div className="module-icon">{module.icon}</div>

            <div className="module-content">
              <div className="module-header">
                <h3 className="module-title">{module.title}</h3>
                <span className="module-layer">{module.layer}</span>
              </div>

              <p className="module-description">{module.description}</p>

              <div className="module-status">
                <span
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(module.status) }}
                ></span>
                <span className="status-label-small">{module.status}</span>
              </div>
            </div>

            <div className="module-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </a>
        ))}
      </div>
    </Client_Layout>
  );
}

export default Client_Dashboard;
