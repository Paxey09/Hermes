import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Client_Sidebar from "./Client_Sidebar.jsx";
import Client_Navbar from "./Client_Navbar.jsx";
import { getEnabledClientModules } from "../../../services/clientModules";
import "../../../styles/Admin_styles/Admin_Style.css";

function Client_Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleContext, setModuleContext] = useState(null);
  const [loadingModules, setLoadingModules] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function loadModules() {
      try {
        setLoadingModules(true);
        const data = await getEnabledClientModules();

        if (mounted) {
          setModuleContext(data);
        }
      } catch (err) {
        console.error("Client layout module load error:", err);

        if (mounted) {
          setModuleContext(null);
        }
      } finally {
        if (mounted) {
          setLoadingModules(false);
        }
      }
    }

    loadModules();

    return () => {
      mounted = false;
    };
  }, []);

  const currentModule = moduleContext?.modules?.find(
    (module) => module.route === location.pathname
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Client_Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        modules={moduleContext?.modules || []}
        user={moduleContext?.profile}
        workspace={moduleContext?.workspace}
        loading={loadingModules}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Client_Navbar
          onMenu={() => setSidebarOpen(true)}
          title={currentModule?.label || "Client Portal"}
          user={moduleContext?.profile}
          workspace={moduleContext?.workspace}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 transition-colors duration-300 lg:p-6">
          <Outlet context={moduleContext} />
        </main>
      </div>
    </div>
  );
}

export default Client_Layout;
