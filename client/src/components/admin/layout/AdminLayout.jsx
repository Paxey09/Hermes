import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminFloatingAssistant from "../AdminFloatingAssistant";
import { supabase } from "../../../config/supabaseClient";
import { useTheme } from "../../../context/ThemeContext";

const TITLES = {
  "/Admin/Dashboard": "Dashboard",
  "/Admin/CRM": "CRM",
  "/Admin/Deals": "Deals Pipeline",
  "/Admin/Contacts": "Contacts",
  "/Admin/Inventory": "Inventory",
  "/Admin/Marketing": "Marketing & Email",
  "/Admin/Analytics": "Analytics",
  "/Admin/ERP": "ERP",
  "/Admin/Inbox": "Inbox",
  "/Admin/Calendar": "Calendar",
  "/Admin/Chatbot": "AI Chatbot",
  "/Admin/FacebookConnect": "Facebook Connect",
  "/Admin/Security": "Security",
  "/Admin/Settings": "Settings",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser(profile || authUser);
      }
    };
    getUser();
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark
      ? "bg-[#0a0e1a]"
      : "bg-gray-50"
      }`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onMenu={() => setSidebarOpen(true)}
          title={TITLES[location.pathname] || "Hermes Admin"}
          user={user}
        />
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-colors duration-300 ${isDark ? "bg-[#0a0e1a]" : "bg-gray-50"
          }`}>
          <Outlet />
        </main>
      </div>
      <AdminFloatingAssistant />
    </div>
  );
}
