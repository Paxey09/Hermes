import { useState } from 'react';
import '../../../styles/Admin_styles/Admin_Style.css';
import Admin_Sidebar from './Admin_Sidebar';
import Admin_Navbar from './Admin_Navbar';

function Admin_Layout({ title, children }) {
      const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
          <div className="admin-dashboard">
              <Admin_Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

              <div className="admin-main">
                  <Admin_Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title={title} />

                  <main className="admin-content">
                      {children}
                  </main>
              </div>
          </div>
    );
}

export default Admin_Layout;