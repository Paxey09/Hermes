import { NavLink } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { groupModulesBySection } from "../../../constants/modules";
import { initials } from "../../../lib/adminUtils";

function Client_Sidebar({
  open,
  onClose,
  modules = [],
  user,
  workspace,
  loading,
}) {
  const groupedModules = groupModulesBySection(modules);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-white transition-all duration-300 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#ea580c]">
              <span className="text-sm font-bold text-white">H</span>
            </div>

            <div className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-gray-900">
                Client Portal
              </span>
              <span className="block truncate text-xs text-gray-500">
                {workspace?.name || "Workspace"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {loading && (
            <div className="space-y-2 px-3 py-2">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
            </div>
          )}

          {!loading &&
            Object.entries(groupedModules).map(([section, sectionModules]) => (
              <div key={section} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section}
                </p>

                {sectionModules.map(({ route, icon: Icon, label }) => (
                  <NavLink
                    key={route}
                    to={route}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                        isActive
                          ? "bg-[#ea580c]/20 font-medium text-[#ea580c]"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={[
                            "h-4 w-4 flex-shrink-0",
                            isActive
                              ? "text-[#ea580c]"
                              : "text-gray-400 group-hover:text-gray-600",
                          ].join(" ")}
                        />

                        <span className="flex-1 truncate">{label}</span>

                        {isActive && (
                          <ChevronRight className="h-3 w-3 text-[#ea580c]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
        </nav>

        <div className="border-t border-gray-200 px-4 py-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c] text-xs font-bold text-white">
                {initials(user.full_name || user.email || "Client")}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.full_name || "Client User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user.role || "Client"}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Client_Sidebar;
