import { useEffect, useMemo, useState } from "react";

import {
  ERPControlHeader,
  ERPControlKPICards,
  WorkspaceSelector,
  ModuleAccessGrid,
  ModuleAccessTable,
  ERPControlLoadingState,
  ERPControlErrorState,
} from "../../components/admin/layout/Admin_ERPControl_Components.jsx";

import {
  getERPControlData,
  updateWorkspaceModuleAccess,
} from "../../services/erpControl";

export default function AdminERPControl() {
  const [workspaces, setWorkspaces] = useState([]);
  const [modules, setModules] = useState([]);
  const [accessRows, setAccessRows] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadERPControl();
  }, []);

  async function loadERPControl() {
    try {
      setLoading(true);
      setError("");

      const data = await getERPControlData();

      setWorkspaces(data.workspaces || []);
      setModules(data.modules || []);
      setAccessRows(data.accessRows || []);

      if (!selectedWorkspaceId) {
        setSelectedWorkspaceId(data.workspaces?.[0]?.id || "");
      }
    } catch (err) {
      console.error("ERP Control load error:", err);
      setError(err.message || "Failed to load ERP control.");
    } finally {
      setLoading(false);
    }
  }

  const selectedWorkspace = useMemo(() => {
    return workspaces.find((workspace) => workspace.id === selectedWorkspaceId);
  }, [workspaces, selectedWorkspaceId]);

  const workspaceAccess = useMemo(() => {
    return modules.map((module) => {
      const row = accessRows.find(
        (access) =>
          access.workspace_id === selectedWorkspaceId &&
          access.module_key === module.key
      );

      return {
        ...module,
        is_enabled: row?.is_enabled || false,
        enabled_at: row?.enabled_at || null,
        enabled_by: row?.enabled_by || null,
      };
    });
  }, [modules, accessRows, selectedWorkspaceId]);

  async function handleToggle(moduleKey, nextValue) {
    if (!selectedWorkspaceId) return;

    try {
      setSavingKey(moduleKey);

      await updateWorkspaceModuleAccess({
        workspaceId: selectedWorkspaceId,
        moduleKey,
        isEnabled: nextValue,
      });

      setAccessRows((prev) => {
        const exists = prev.some(
          (row) =>
            row.workspace_id === selectedWorkspaceId &&
            row.module_key === moduleKey
        );

        if (!exists) {
          return [
            ...prev,
            {
              id: `${selectedWorkspaceId}_${moduleKey}`,
              workspace_id: selectedWorkspaceId,
              module_key: moduleKey,
              is_enabled: nextValue,
              enabled_by: "Current Admin",
              enabled_at: nextValue ? new Date().toISOString() : null,
            },
          ];
        }

        return prev.map((row) =>
          row.workspace_id === selectedWorkspaceId && row.module_key === moduleKey
            ? {
                ...row,
                is_enabled: nextValue,
                enabled_by: "Current Admin",
                enabled_at: nextValue ? new Date().toISOString() : null,
              }
            : row
        );
      });
    } catch (err) {
      alert(err.message || "Failed to update module access.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className="space-y-6">
      <ERPControlHeader onRefresh={loadERPControl} />

      {loading && <ERPControlLoadingState />}

      {!loading && error && (
        <ERPControlErrorState message={error} onRetry={loadERPControl} />
      )}

      {!loading && !error && (
        <>
          <ERPControlKPICards
            workspaces={workspaces}
            modules={modules}
            accessRows={accessRows}
            selectedWorkspaceId={selectedWorkspaceId}
          />

          <WorkspaceSelector
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            selectedWorkspace={selectedWorkspace}
            onWorkspaceChange={setSelectedWorkspaceId}
            view={view}
            onViewChange={setView}
          />

          {view === "grid" && (
            <ModuleAccessGrid
              modules={workspaceAccess}
              savingKey={savingKey}
              onToggle={handleToggle}
            />
          )}

          {view === "table" && (
            <ModuleAccessTable
              modules={workspaceAccess}
              savingKey={savingKey}
              onToggle={handleToggle}
            />
          )}
        </>
      )}
    </div>
  );
}
