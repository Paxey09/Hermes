import { Routes, Route, Navigate } from "react-router-dom";

//=================== OTHER IMPORTS ===================//
import NewLandingPage from "./pages/NewLandingPage.jsx";
import Auth from "./pages/Auth.jsx";
import NotFound from "./pages/NotFound.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import ProtectedRoute from "./pages/Components/ProtectedRoute.jsx";
// DebugAuth removed for production security

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
import AdminWorkspaceAccess from "./pages/Admin/AdminWorkspaceAccess.jsx";
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
import AdminAccountControl from "./pages/Admin/AdminAccountControl.jsx";
import AdminDataAnalytics from "./pages/Admin/AdminDataAnalytics.jsx";
import AdminPipelineAnalytics from "./pages/Admin/AdminPipelineAnalytics.jsx";
import AdminRevenueProjections from "./pages/Admin/AdminRevenueProjections.jsx";
import AdminPredictive from "./pages/Admin/AdminPredictive.jsx";
import AdminLeaderboard from "./pages/Admin/AdminLeaderboard.jsx";
import AdminCustomerPortal from "./pages/Admin/AdminCustomerPortal.jsx";
import AdminFeedbackPortal from "./pages/Admin/AdminFeedbackPortal.jsx";
import AdminDataExport from "./pages/Admin/AdminDataExport.jsx";
import AdminWorkflows from "./pages/Admin/AdminWorkflows.jsx";
import AdminNotifications from "./pages/Admin/AdminNotifications.jsx";
import AdminWorkspaceAdministration from "./pages/Admin/AdminWorkspaceAdministration.jsx";
import AdminERPRegistry from "./pages/Admin/AdminERPRegistry.jsx";
import AdminHRDashboard from "./pages/Admin/AdminHRDashboard.jsx";
import AdminEmployees from "./pages/Admin/AdminEmployees.jsx";
import AdminAttendance from "./pages/Admin/AdminAttendance.jsx";
import AdminLeaveManagement from "./pages/Admin/AdminLeaveManagement.jsx";
import AdminPayroll from "./pages/Admin/AdminPayroll.jsx";
import AdminRecruitment from "./pages/Admin/AdminRecruitment.jsx";
import AdminPerformance from "./pages/Admin/AdminPerformance.jsx";
import AdminEmployeeEngagement from "./pages/Admin/AdminEmployeeEngagement.jsx";
import AdminHRAnalytics from "./pages/Admin/AdminHRAnalytics.jsx";
import AdminLeadsPipeline from "./pages/Admin/AdminLeadsPipeline.jsx";
import AdminSalesLeaderBoards from "./pages/Admin/AdminSalesLeaderboard.jsx";
//=================== CLIENT LAYOUT ===================//
import ClientLayout from "./pages/Components/Client_Components/Client_Layout.jsx";
import ClientModuleRoute from "./pages/Components/Client_Components/ClientModuleRoute.jsx";

//=================== CLIENT IMPORTS ===================//
import ClientDashboard from "./pages/Client/Client_Dashboard.jsx";
import ClientProfile from "./pages/Client/Modules/Client_Profile.jsx";
import ClientProjects from "./pages/Client/Modules/ClientProjects.jsx";
import ClientDemoBookings from "./pages/Client/Modules/Client_DemoBookings.jsx";
import ClientCRM from "./pages/Client/Modules/ClientCRM.jsx";
import ClientContacts from "./pages/Client/Modules/ClientContacts.jsx";
import ClientDeals from "./pages/Client/Modules/ClientDeals.jsx";
import ClientTasks from "./pages/Client/Modules/ClientTasks.jsx";
import ClientFacebookInbox from "./pages/Client/Modules/Client_FacebookInbox.jsx";

// Client placeholder components (not yet implemented on client side)
const PlaceholderPage = ({ title }) => (
  <div className="p-6">
    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
    <p className="text-gray-500 mt-2">This module is coming soon.</p>
    <div className="mt-8 p-12 bg-gray-50 dark:bg-white/5 rounded-lg text-center">
      <p className="text-gray-500">Full functionality will be available in the next update.</p>
    </div>
  </div>
);

const ClientInbox = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500">Select an inbox to view conversations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="/Client/Inbox/Facebook"
          className="rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">FB</div>
            <div>
              <h3 className="font-semibold text-gray-900">Facebook Inbox</h3>
              <p className="text-sm text-gray-500">View Facebook page conversations</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};
const ClientRevenue = () => <PlaceholderPage title="Revenue" />;
const ClientAnalytics = () => <PlaceholderPage title="Analytics" />;
const ClientDataAnalytics = () => <PlaceholderPage title="Data Analytics" />;
const ClientPipelineAnalytics = () => <PlaceholderPage title="Pipeline Analytics" />;
const ClientRevenueProjections = () => <PlaceholderPage title="Revenue Projections" />;
const ClientPredictive = () => <PlaceholderPage title="Predictive" />;
const ClientLeaderboard = () => <PlaceholderPage title="Leaderboard" />;
const ClientCustomerPortal = () => <PlaceholderPage title="Customer Portal" />;
const ClientFeedbackPortal = () => <PlaceholderPage title="Feedback Portal" />;
const ClientKnowledgeBase = () => <PlaceholderPage title="Knowledge Base" />;
const ClientChatbot = () => <PlaceholderPage title="Chatbot" />;
const ClientFacebookConnect = () => <PlaceholderPage title="Facebook Connect" />;
const ClientInventory = () => <PlaceholderPage title="Inventory" />;
const ClientMarketing = () => <PlaceholderPage title="Marketing" />;
const ClientDataExport = () => <PlaceholderPage title="Data Export" />;
const ClientTeam = () => <PlaceholderPage title="Team" />;
const ClientWorkflows = () => <PlaceholderPage title="Workflows" />;
const ClientReports = () => <PlaceholderPage title="Reports" />;
const ClientNotifications = () => <PlaceholderPage title="Notifications" />;
const ClientAuditLogs = () => <PlaceholderPage title="Audit Logs" />;
const ClientSettings = () => <PlaceholderPage title="Settings" />;

function GuardedClientModule({ moduleKey, children }) {
  return (
    <ClientModuleRoute moduleKey={moduleKey}>
      {children}
    </ClientModuleRoute>
  );
}

function App() {
  return (
    <Routes>
      {/* =================== PUBLIC ROUTES =================== */}
      <Route path="/" element={<NewLandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth />} />
      {/* Debug route removed for production security */}

      {/* Redirect lowercase /admin → /Admin (handle case-sensitivity) */}
      <Route path="/admin/*" element={<Navigate to="/Admin/Dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/Admin/Dashboard" replace />} />

      {/* Redirect lowercase /client → /Client (handle case-sensitivity) */}
      <Route path="/client/*" element={<Navigate to="/Client/Dashboard" replace />} />
      <Route path="/client" element={<Navigate to="/Client/Dashboard" replace />} />

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
        <Route path="WorkspaceAccess" element={<AdminWorkspaceAccess />} />
	<Route path="WorkspaceAdministration" element={<AdminWorkspaceAdministration />} />
        <Route path="ERPRegistry" element={<AdminERPRegistry />} />
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
        <Route path="AccountControl" element={<AdminAccountControl />} />
	<Route path="HRDashboard" element={<AdminHRDashboard />} />
        <Route path="Employees" element={<AdminEmployees />} />
        <Route path="Attendance" element={<AdminAttendance />} />
        <Route path="LeaveManagement" element={<AdminLeaveManagement />} />
        <Route path="Payroll" element={<AdminPayroll />} />
        <Route path="Recruitment" element={<AdminRecruitment />} />
        <Route path="Performance" element={<AdminPerformance />} />
        <Route path="EmployeeEngagement" element={<AdminEmployeeEngagement />} />
        <Route path="HRAnalytics" element={<AdminHRAnalytics />} />
        <Route path="LeadsPipeline" element={<AdminLeadsPipeline />} />
        <Route path="PipelineAnalytics" element={<AdminPipelineAnalytics />} />
	<Route path="SalesLeaderBoards" element={<AdminSalesLeaderBoards />} />
        <Route index element={<Navigate to="Dashboard" replace />} />
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
      <Route path="/AdminWorkspaceAccess" element={<Navigate to="/Admin/WorkspaceAccess" replace />} />
      <Route path="/AdminWorkspaceAdministration" element={<Navigate to="/Admin/WorkspaceAdministration" replace />} />
      <Route path="/AdminERPRegistry" element={<Navigate to="/Admin/ERPRegistry" replace />} />
      <Route path="/AdminInbox" element={<Navigate to="/Admin/Inbox" replace />} />
      <Route path="/AdminCalendar" element={<Navigate to="/Admin/Calendar" replace />} />
      <Route path="/AdminHermesChatbot" element={<Navigate to="/Admin/Chatbot" replace />} />
      <Route path="/AdminChatbot" element={<Navigate to="/Admin/Chatbot" replace />} />
      <Route path="/AdminSecurity" element={<Navigate to="/Admin/Security" replace />} />
      <Route path="/AdminSettings" element={<Navigate to="/Admin/Settings" replace />} />
      <Route path="/AdminAccountControl" element={<Navigate to="/Admin/AccountControl" replace />} />

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

        <Route
          path="Projects"
          element={
            <GuardedClientModule moduleKey="projects">
              <ClientProjects />
            </GuardedClientModule>
          }
        />

        <Route
          path="Booking"
          element={
            <GuardedClientModule moduleKey="booking">
              <ClientDemoBookings />
            </GuardedClientModule>
          }
        />

        <Route
          path="Tasks"
          element={
            <GuardedClientModule moduleKey="tasks">
              <ClientTasks />
            </GuardedClientModule>
          }
        />

        <Route
          path="Deals"
          element={
            <GuardedClientModule moduleKey="deals">
              <ClientDeals />
            </GuardedClientModule>
          }
        />

        <Route
          path="Contacts"
          element={
            <GuardedClientModule moduleKey="contacts">
              <ClientContacts />
            </GuardedClientModule>
          }
        />

        <Route
          path="Inbox"
          element={
            <GuardedClientModule moduleKey="inbox">
              <ClientInbox />
            </GuardedClientModule>
          }
        />

        <Route
          path="Inbox/Facebook"
          element={
            <GuardedClientModule moduleKey="inbox">
              <ClientFacebookInbox />
            </GuardedClientModule>
          }
        />

        <Route
          path="CRM"
          element={
            <GuardedClientModule moduleKey="crm">
              <ClientCRM />
            </GuardedClientModule>
          }
        />

        <Route
          path="Revenue"
          element={
            <GuardedClientModule moduleKey="revenue">
              <ClientRevenue />
            </GuardedClientModule>
          }
        />

        <Route
          path="Analytics"
          element={
            <GuardedClientModule moduleKey="analytics">
              <ClientAnalytics />
            </GuardedClientModule>
          }
        />

        <Route
          path="DataAnalytics"
          element={
            <GuardedClientModule moduleKey="data_analytics">
              <ClientDataAnalytics />
            </GuardedClientModule>
          }
        />

        <Route
          path="PipelineAnalytics"
          element={
            <GuardedClientModule moduleKey="pipeline_analytics">
              <ClientPipelineAnalytics />
            </GuardedClientModule>
          }
        />

        <Route
          path="RevenueProjections"
          element={
            <GuardedClientModule moduleKey="revenue_projections">
              <ClientRevenueProjections />
            </GuardedClientModule>
          }
        />

        <Route
          path="Predictive"
          element={
            <GuardedClientModule moduleKey="predictive">
              <ClientPredictive />
            </GuardedClientModule>
          }
        />

        <Route
          path="Leaderboard"
          element={
            <GuardedClientModule moduleKey="leaderboard">
              <ClientLeaderboard />
            </GuardedClientModule>
          }
        />

        <Route
          path="CustomerPortal"
          element={
            <GuardedClientModule moduleKey="customer_portal">
              <ClientCustomerPortal />
            </GuardedClientModule>
          }
        />

        <Route
          path="FeedbackPortal"
          element={
            <GuardedClientModule moduleKey="feedback_portal">
              <ClientFeedbackPortal />
            </GuardedClientModule>
          }
        />

        <Route
          path="KnowledgeBase"
          element={
            <GuardedClientModule moduleKey="knowledge_base">
              <ClientKnowledgeBase />
            </GuardedClientModule>
          }
        />

        <Route
          path="Chatbot"
          element={
            <GuardedClientModule moduleKey="chatbot">
              <ClientChatbot />
            </GuardedClientModule>
          }
        />

        <Route
          path="FacebookConnect"
          element={
            <GuardedClientModule moduleKey="facebook_connect">
              <ClientFacebookConnect />
            </GuardedClientModule>
          }
        />

        <Route
          path="Inventory"
          element={
            <GuardedClientModule moduleKey="inventory">
              <ClientInventory />
            </GuardedClientModule>
          }
        />

        <Route
          path="Marketing"
          element={
            <GuardedClientModule moduleKey="marketing">
              <ClientMarketing />
            </GuardedClientModule>
          }
        />

        <Route
          path="DataExport"
          element={
            <GuardedClientModule moduleKey="data_export">
              <ClientDataExport />
            </GuardedClientModule>
          }
        />

        <Route
          path="Team"
          element={
            <GuardedClientModule moduleKey="team">
              <ClientTeam />
            </GuardedClientModule>
          }
        />

        <Route
          path="Workflows"
          element={
            <GuardedClientModule moduleKey="workflows">
              <ClientWorkflows />
            </GuardedClientModule>
          }
        />

        <Route
          path="Reports"
          element={
            <GuardedClientModule moduleKey="reports">
              <ClientReports />
            </GuardedClientModule>
          }
        />

        <Route
          path="Notifications"
          element={
            <GuardedClientModule moduleKey="notifications">
              <ClientNotifications />
            </GuardedClientModule>
          }
        />

        <Route
          path="AuditLogs"
          element={
            <GuardedClientModule moduleKey="audit_logs">
              <ClientAuditLogs />
            </GuardedClientModule>
          }
        />

        <Route
          path="Settings"
          element={
            <GuardedClientModule moduleKey="settings">
              <ClientSettings />
            </GuardedClientModule>
          }
        />

        <Route index element={<Navigate to="Dashboard" replace />} />
      </Route>

      {/* =================== LEGACY CLIENT ROUTES =================== */}
      <Route path="/ClientDashboard" element={<Navigate to="/Client/Dashboard" replace />} />
      <Route path="/ClientProfile" element={<Navigate to="/Client/Profile" replace />} />
      <Route path="/ClientProjects" element={<Navigate to="/Client/Projects" replace />} />
      <Route path="/ClientDemoBookings" element={<Navigate to="/Client/Booking" replace />} />

      {/* =================== UNAUTHORIZED =================== */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* =================== NOT FOUND =================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
