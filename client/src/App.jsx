import { Routes, Route, Navigate } from "react-router-dom";

//=================== OTHER IMPORTS ===================//
import NewLandingPage from "./pages/NewLandingPage.jsx";
import Auth from "./pages/Auth.jsx";
import NotFound from "./pages/NotFound.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import ProtectedRoute from "./pages/Components/ProtectedRoute.jsx";
import DebugAuth from "./pages/DebugAuth.jsx";

//=================== ADMIN LAYOUT ===================//
import AdminLayout from "./components/admin/layout/AdminLayout.jsx";

//=================== ADMIN IMPORTS ===================//
import UnifiedAdminDashboard from "./pages/Admin/UnifiedAdminDashboard.jsx";
import AdminCRM from "./pages/Admin/AdminCRM.jsx";
import AdminDeals from "./pages/Admin/AdminDeals.jsx";
import AdminContacts from "./pages/Admin/AdminContacts.jsx";
import AdminInventory from "./pages/Admin/AdminInventory.jsx";
import AdminMarketing from "./pages/Admin/AdminMarketing.jsx";
import AdminAnalytics from "./pages/Admin/AdminAnalytics.jsx";
import AdminERPControl from "./pages/Admin/AdminERPControl.jsx";
import AdminInbox from "./pages/Admin/AdminInbox.jsx";
import AdminCalendar from "./pages/Admin/AdminCalendar.jsx";
import AdminChatbot from "./pages/Admin/AdminChatbot.jsx";
import AdminSecurity from "./pages/Admin/AdminSecurity.jsx";
import AdminSettings from "./pages/Admin/AdminSettings.jsx";
import AdminProjects from "./pages/Admin/AdminProjects.jsx";
import AdminTasks from "./pages/Admin/AdminTasks.jsx";
import AdminTeam from "./pages/Admin/AdminTeam.jsx";
import AdminBooking from "./pages/Admin/AdminBooking.jsx";
import AdminRevenue from "./pages/Admin/AdminRevenue.jsx";
import AdminKnowledgeBase from "./pages/Admin/AdminKnowledgeBase.jsx";
import AdminReports from "./pages/Admin/AdminReports.jsx";
import AdminAuditLogs from "./pages/Admin/AdminAuditLogs.jsx";
import Admin_FacebookConnect from "./pages/Admin/Admin_FacebookConnect.jsx";

// Placeholder components for modules not yet implemented
const PlaceholderPage = ({ title }) => (
  <div className="p-6">
    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
    <p className="text-muted-foreground mt-2">This module is coming soon.</p>
    <div className="mt-8 p-12 bg-muted/30 rounded-lg text-center">
      <p className="text-muted-foreground">Full functionality will be available in the next update.</p>
    </div>
  </div>
);
const AdminDataAnalytics = () => <PlaceholderPage title="Data Analytics" />;
const AdminPipelineAnalytics = () => <PlaceholderPage title="Pipeline Analytics" />;
const AdminRevenueProjections = () => <PlaceholderPage title="Revenue Projections" />;
const AdminPredictive = () => <PlaceholderPage title="Predictive Analytics" />;
const AdminLeaderboard = () => <PlaceholderPage title="Leaderboard" />;
const AdminCustomerPortal = () => <PlaceholderPage title="Customer Portal" />;
const AdminFeedbackPortal = () => <PlaceholderPage title="Feedback Portal" />;
const AdminDataExport = () => <PlaceholderPage title="Data Export" />;
const AdminWorkflows = () => <PlaceholderPage title="Workflows" />;
const AdminNotifications = () => <PlaceholderPage title="Notifications" />;

//=================== CLIENT LAYOUT ===================//
import ClientLayout from "./pages/Components/Client_Components/Client_Layout.jsx";

//=================== CLIENT IMPORTS ===================//
import ClientDashboard from "./pages/Client/Client_Dashboard.jsx";
import ClientProfile from "./pages/Client/Modules/Client_Profile.jsx";
import ClientProjects from "./pages/Client/Modules/Client_Projects.jsx";

function App() {
  return (
    <Routes>
      {/* =================== PUBLIC ROUTES =================== */}
      <Route path="/" element={<NewLandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      <Route path="/debug" element={<DebugAuth />} />

      {/* Redirect lowercase /admin → /Admin (handle case-sensitivity) */}
      <Route path="/admin/*" element={<Navigate to="/Admin/Dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/Admin/Dashboard" replace />} />

      {/* =================== NEW ADMIN ROUTES (with Layout) =================== */}
      <Route
        path="/Admin/*"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="Dashboard" element={<UnifiedAdminDashboard />} />
        <Route path="CRM" element={<AdminCRM />} />
        <Route path="Deals" element={<AdminDeals />} />
        <Route path="Contacts" element={<AdminContacts />} />
        <Route path="Inventory" element={<AdminInventory />} />
        <Route path="Marketing" element={<AdminMarketing />} />
        <Route path="Analytics" element={<AdminAnalytics />} />
        <Route path="ERP" element={<AdminERPControl />} />
        <Route path="Inbox" element={<AdminInbox />} />
        <Route path="Calendar" element={<AdminCalendar />} />
        <Route path="Chatbot" element={<AdminChatbot />} />
        <Route path="Security" element={<AdminSecurity />} />
        <Route path="Settings" element={<AdminSettings />} />
        <Route path="Projects" element={<AdminProjects />} />
        <Route path="Tasks" element={<AdminTasks />} />
        <Route path="Team" element={<AdminTeam />} />
        <Route path="Booking" element={<AdminBooking />} />
        <Route path="Revenue" element={<AdminRevenue />} />
        <Route path="DataAnalytics" element={<AdminDataAnalytics />} />
        <Route path="PipelineAnalytics" element={<AdminPipelineAnalytics />} />
        <Route path="RevenueProjections" element={<AdminRevenueProjections />} />
        <Route path="Predictive" element={<AdminPredictive />} />
        <Route path="Leaderboard" element={<AdminLeaderboard />} />
        <Route path="CustomerPortal" element={<AdminCustomerPortal />} />
        <Route path="FeedbackPortal" element={<AdminFeedbackPortal />} />
        <Route path="KnowledgeBase" element={<AdminKnowledgeBase />} />
        <Route path="DataExport" element={<AdminDataExport />} />
        <Route path="Workflows" element={<AdminWorkflows />} />
        <Route path="Reports" element={<AdminReports />} />
        <Route path="Notifications" element={<AdminNotifications />} />
        <Route path="AuditLogs" element={<AdminAuditLogs />} />
        <Route path="FacebookConnect" element={<Admin_FacebookConnect />} />
        <Route index element={<Navigate to="Dashboard" replace />} />
        <Route index element={<Navigate to="CRM" replace />} />
        <Route index element={<Navigate to="Deals" replace />} />
        <Route index element={<Navigate to="Contacts" replace />} />
        <Route index element={<Navigate to="Inventory" replace />} />
        <Route index element={<Navigate to="Marketing" replace />} />
        <Route index element={<Navigate to="Analytics" replace />} />
        <Route index element={<Navigate to="ERP" replace />} />
        <Route index element={<Navigate to="Calendar" replace />} />
        <Route index element={<Navigate to="Security" replace />} />
      </Route>

      {/* =================== LEGACY ADMIN ROUTES (Deprecated - Redirect to new) =================== */}
      <Route path="/AdminDashboard" element={<Navigate to="/Admin/Dashboard" replace />} />
      <Route path="/AdminCRM" element={<Navigate to="/Admin/CRM" replace />} />
      <Route path="/AdminDeals" element={<Navigate to="/Admin/Deals" replace />} />
      <Route path="/AdminContacts" element={<Navigate to="/Admin/Contacts" replace />} />
      <Route path="/AdminInventory" element={<Navigate to="/Admin/Inventory" replace />} />
      <Route path="/AdminMarketing" element={<Navigate to="/Admin/Marketing" replace />} />
      <Route path="/AdminAnalytics" element={<Navigate to="/Admin/Analytics" replace />} />
      <Route path="/AdminDataAnalytics" element={<Navigate to="/Admin/Analytics" replace />} />
      <Route path="/AdminERP" element={<Navigate to="/Admin/ERP" replace />} />
      <Route path="/AdminInbox" element={<Navigate to="/Admin/Inbox" replace />} />
      <Route path="/AdminCalendar" element={<Navigate to="/Admin/Calendar" replace />} />
      <Route path="/AdminHermesChatbot" element={<Navigate to="/Admin/Chatbot" replace />} />
      <Route path="/AdminChatbot" element={<Navigate to="/Admin/Chatbot" replace />} />
      <Route path="/AdminSecurity" element={<Navigate to="/Admin/Security" replace />} />
      <Route path="/AdminSettings" element={<Navigate to="/Admin/Settings" replace />} />
      <Route path="/AdminAccountControl" element={<Navigate to="/Admin/Settings" replace />} />

      {/* =================== CLIENT ROUTES (with Layout) =================== */}
      <Route
        path="/Client/*"
        element={
          <ProtectedRoute requiredRole={["Client", "User"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="Dashboard" element={<ClientDashboard />} />
        <Route path="Profile" element={<ClientProfile />} />
        <Route path="Projects" element={<ClientProjects />} />
        <Route index element={<Navigate to="Dashboard" replace />} />
      </Route>

      {/* =================== LEGACY CLIENT ROUTES =================== */}
      <Route
        path="/ClientDashboard"
        element={
          <ProtectedRoute requiredRole={["Client", "User"]}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ClientProfile"
        element={
          <ProtectedRoute requiredRole={["Client", "User"]}>
            <ClientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ClientProjects"
        element={
          <ProtectedRoute requiredRole={["Client", "User"]}>
            <ClientProjects />
          </ProtectedRoute>
        }
      />

      {/* =================== UNAUTHORIZED =================== */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* =================== NOT FOUND =================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
