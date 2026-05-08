import { Menu, Bell, Search, ChevronDown, Settings, LogOut } from "lucide-react";
import { cn, initials } from "../../../lib/adminUtils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../../config/supabaseClient";
import { useTheme } from "../../../context/ThemeContext";

export default function AdminHeader({ onMenu, title, user }) {
  const navigate = useNavigate();
  const [showUser, setShowUser] = useState(false);
  const { isDark } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const goToSettings = () => {
    navigate("/Admin/Settings");
    setShowUser(false);
  };

  return (
    <header className={`h-14 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10 transition-colors duration-300 ${isDark
      ? "bg-[#0d1525] border-b border-white/10"
      : "bg-white border-b border-gray-200"
      }`}>
      <button onClick={onMenu} className={`lg:hidden p-1.5 rounded-md transition-colors ${isDark
        ? "hover:bg-white/10 text-gray-400"
        : "hover:bg-gray-100 text-gray-500"
        }`}>
        <Menu className="w-5 h-5" />
      </button>
      <h1 className={`text-sm font-semibold hidden sm:block ${isDark ? "text-white" : "text-gray-800"
        }`}>{title}</h1>

      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-500" : "text-gray-400"
            }`} />
          <input
            placeholder="Search..."
            className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border-0 outline-none transition-colors ${isDark
              ? "bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c9a84c]/50"
              : "bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#c9a84c]"
              }`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className={`relative p-1.5 rounded-md transition-colors ${isDark
          ? "hover:bg-white/10 text-gray-400"
          : "hover:bg-gray-100 text-gray-500"
          }`}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#c9a84c] rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg transition-colors ${isDark
              ? "hover:bg-white/10"
              : "hover:bg-gray-100"
              }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#0a0e1a] text-xs font-bold">
              {initials(user?.full_name || user?.email || "Admin")}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${isDark ? "text-gray-300" : "text-gray-700"
              }`}>
              {user?.full_name || "Admin"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-gray-500" : "text-gray-400"
              }`} />
          </button>

          {showUser && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUser(false)}
              />
              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg border py-1 z-20 ${isDark
                ? "bg-[#0d1525] border-white/10"
                : "bg-white border-gray-200"
                }`}>
                <div className={`px-3 py-2 border-b ${isDark ? "border-white/10" : "border-gray-100"
                  }`}>
                  <p className={`text-xs font-medium truncate ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {user?.full_name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={goToSettings}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${isDark
                    ? "text-gray-300 hover:bg-white/5"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${isDark
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-red-600 hover:bg-red-50"
                    }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
