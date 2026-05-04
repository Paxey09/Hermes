import Client_Sidebar from './Client_Sidebar.jsx';
import Client_Navbar from './Client_Navbar.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';

function Client_Layout({ children }) {
  return (
    <div className="admin-dashboard">
      <Client_Sidebar />

      <main className="admin-main">
        <Client_Navbar />

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Client_Layout;
