import { NavLink } from "react-router-dom";
import { ChevronRight, Moon, Sun, X } from "lucide-react";
import { cn, initials } from "../../../lib/adminUtils";
import { useTheme } from "../../../context/ThemeContext";
import { ADMIN_NAV_SECTIONS } from "../../../constants/adminModules";

export default function AdminSidebar({ open, onClose, user }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 flex flex-col transition-all duration-300",
          isDark ? "bg-[#0f172a]" : "bg-white",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/10" : "border-gray-200"
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ea580c] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className={`font-bold text-base tracking-tight ${isDark ? "text-white" : "text-gray-900"
              }`}>Hermes Admin</span>
          </div>
          <button onClick={onClose} className={`lg:hidden p-1 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto no-scrollbar space-y-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className={cn(
                "px-3 text-xs font-semibold uppercase tracking-wider",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                {section.title}
              </p>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                      isActive
                        ? isDark
                          ? "bg-[#ea580c]/20 text-[#ea580c] font-medium"
                          : "bg-[#ea580c]/20 text-[#ea580c] font-medium"
                        : isDark
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive
                            ? "text-[#ea580c]"
                            : isDark
                              ? "text-gray-500 group-hover:text-gray-300"
                              : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-[#ea580c]" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Theme Toggle & User Footer */}
        <div className={`px-4 py-3 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-2 ${isDark
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
          >
            <span className="flex items-center gap-3">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? "bg-[#ea580c]" : "bg-gray-300"
              }`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDark ? "left-4.5" : "left-0.5"
                }`} />
            </div>
          </button>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-[#ea580c] flex items-center justify-center text-white text-xs font-bold">
                {initials(user.full_name || user.email || "Admin")}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                  {user.full_name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.role || "Administrator"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
