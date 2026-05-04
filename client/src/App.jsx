import { Routes, Route } from "react-router-dom";

//=================== OTHER IMPORTS ===================//
import LandingPage from "./pages/LandingPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./pages/Components/ProtectedRoute.jsx";

//=================== ADMIN IMPORTS ===================//
import AdminDashboard from "./pages/Admin/Admin_Dashboard.jsx";
import AdminAccountContol from "./pages/Admin/Admin_AccountControl.jsx";
import Admin_HermesChatbot from "./pages/Admin/Admin_HermesChatbot.jsx";
import AdminCRM from "./pages/Admin/Modules/Admin_CRM.jsx";
import Admin_DemoBookings from "./pages/Admin/Modules/Admin_DemoBookings.jsx";
import Admin_Calendar from "./pages/Admin/Modules/Admin_Calendar.jsx";
import Admin_Contacts from "./pages/Admin/Modules/Admin_Contacts.jsx";
import Admin_Projects from "./pages/Admin/Modules/Admin_Projects.jsx";
import AdminERP from "./pages/Admin/Modules/Admin_ERP.jsx";
import AdminAnalytics from "./pages/Admin/Modules/Admin_Analytics.jsx";
import AdminInfrastructure from "./pages/Admin/Modules/Admin_Infrastructure.jsx";
import AdminSecurity from "./pages/Admin/Modules/Admin_Security.jsx";

//=================== CLIENT IMPORTS ===================//
import ClientDashboard from "./pages/Client/Client_Dashboard.jsx";
import Client_Profile from "./pages/Client/Modules/Client_Profile.jsx";
import Client_DemoBookings from "./pages/Client/Modules/Client_DemoBookings.jsx";
import Client_Projects from "./pages/Client/Modules/Client_Projects.jsx";
import Client_ERP from "./pages/Client/Modules/Client_ERP.jsx";
import Client_HermesChatbot from "./pages/Client/Modules/Client_HermesChatbot.jsx";

function App() {
  return (
    <Routes>
      {/* =================== OTHER ROUTES =================== */}
      <Route path="/" element={<LandingPage />} />

      {/* =================== ADMIN ROUTES =================== */}
      <Route
        path="/AdminDashboard"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminAccountControl"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminAccountContol />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminHermesChatbot"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin_HermesChatbot />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminCRM"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminCRM />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminDemoBookings"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin_DemoBookings />
          </ProtectedRoute>
        }
      />

    <Route
        path="/AdminCalendar"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin_Calendar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminContacts"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin_Contacts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminProjects"
        element={
          <ProtectedRoute requiredRole="Admin">
            <Admin_Projects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminERP"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminERP />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminAnalytics"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminInfrastructure"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminInfrastructure />
          </ProtectedRoute>
        }
      />

      <Route
        path="/AdminSecurity"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminSecurity />
          </ProtectedRoute>
        }
      />

      {/* =================== CLIENT ROUTES =================== */}
      <Route
        path="/ClientDashboard"
        element={
          <ProtectedRoute requiredRole="Client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ClientDashboard/profile"
        element={
          <ProtectedRoute requiredRole="Client">
            <Client_Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ClientDashboard/demo-bookings"
        element={
          <ProtectedRoute requiredRole="Client">
            <Client_DemoBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ClientDashboard/erp"
        element={
          <ProtectedRoute requiredRole="Client">
            <Client_ERP />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ClientDashboard/projects"
        element={
          <ProtectedRoute requiredRole="Client">
            <Client_Projects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ClientDashboard/hermes-chatbot"
        element={
          <ProtectedRoute requiredRole="Client">
            <Client_HermesChatbot />
          </ProtectedRoute>
        }
      />

      {/* =================== NOT FOUND =================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
