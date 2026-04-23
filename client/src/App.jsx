import { Routes, Route } from "react-router-dom"

//=================== OTHER IMPORTS ===================//
import LandingPage from "./pages/LandingPage.jsx"
import NotFound from "./pages/NotFound.jsx"
import ProtectedRoute from "./pages/Components/ProtectedRoute.jsx"


//=================== ADMIN IMPORTS ===================//
import AdminDashboard from "./pages/Admin/Admin_Dashboard.jsx"
import AdminAccountContol from "./pages/Admin/Admin_AccountControl.jsx"
import Admin_HermesChatbot from "./pages/Admin/Admin_HermesChatbot.jsx"
import AdminCRM from "./pages/Admin/Modules/Admin_CRM.jsx"
import AdminERP from "./pages/Admin/Modules/Admin_ERP.jsx"
import AdminAnalytics from "./pages/Admin/Modules/Admin_Analytics.jsx"
import AdminInfrastructure from "./pages/Admin/Modules/Admin_Infrastructure.jsx"
import AdminSecurity from "./pages/Admin/Modules/Admin_Security.jsx"
import AdminFacebookConnect from "./pages/Admin/Admin_FacebookConnect.jsx"



//=================== CLIENT IMPORTS ===================//
import ClientDashboard from "./pages/Client/Client_Dashboard.jsx"
import ClientHermesChatbot from "./pages/Client/Client_HermesChatbot.jsx"



function App() {
  return (
    <Routes>
      //=================== OTHER ROUTES ===================//
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<NotFound />} />



      //=================== ADMIN ROUTES ===================//
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
      <Route
          path="/AdminFacebookConnect"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminFacebookConnect />
            </ProtectedRoute>
          }
      />



      //=================== CLIENT ROUTES ===================//
      <Route
          path="/ClientDashboard"
          element={
            <ProtectedRoute requiredRole="Client">
              <ClientDashboard />
            </ProtectedRoute>
          }
      />
      <Route
          path="/ClientHermesChatbot"
          element={
            <ProtectedRoute requiredRole="Client">
              <ClientHermesChatbot />
            </ProtectedRoute>
          }
      />
    </Routes>
  )
}

export default App