import {
  AlertCircle,
  CheckCircle2,
  Grid3X3,
  List,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "Not enabled";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function moduleTypeClass(type) {
  if (type === "core") return "border-blue-200 bg-blue-50 text-blue-700";
  if (type === "operations") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "intelligence") return "border-purple-200 bg-purple-50 text-purple-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

export function ERPControlHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Modules <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">ERP Control</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">ERP Control</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control which ERP modules each client workspace can access.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>
  );
}

export function ERPControlLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">
        Loading ERP control...
      </p>
    </div>
  );
}

export function ERPControlErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">
            Failed to load ERP control
          </h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function ERPControlKPICards({
  workspaces,
  modules,
  accessRows,
  selectedWorkspaceId,
}) {
  const selectedRows = accessRows.filter(
    (row) => row.workspace_id === selectedWorkspaceId
  );

  const enabledCount = selectedRows.filter((row) => row.is_enabled).length;

  const cards = [
    {
      label: "Client Workspaces",
      value: workspaces.length,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      label: "Available Modules",
      value: modules.length,
      icon: Grid3X3,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      label: "Enabled Modules",
      value: enabledCount,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Access Rules",
      value: accessRows.length,
      icon: ShieldCheck,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <h3 className="mt-4 text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Workspace access control
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  selectedWorkspace,
  onWorkspaceChange,
  view,
  onViewChange,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Selected Workspace
        </p>

        <select
          className="mt-2 h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500"
          value={selectedWorkspaceId}
          onChange={(e) => onWorkspaceChange(e.target.value)}
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>

        {selectedWorkspace && (
          <p className="mt-2 text-sm text-gray-500">
            {selectedWorkspace.company_name} · Owner: {selectedWorkspace.owner}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          className={
            view === "grid"
              ? "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          }
        >
          <Grid3X3 className="h-4 w-4" />
          Grid
        </button>

        <button
          type="button"
          onClick={() => onViewChange("table")}
          className={
            view === "table"
              ? "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              : "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          }
        >
          <List className="h-4 w-4" />
          Table
        </button>
      </div>
    </div>
  );
}

export function ModuleAccessGrid({ modules, savingKey, onToggle }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <div
          key={module.key}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-gray-900">{module.label}</h3>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {module.description}
              </p>
            </div>

            <button
              type="button"
              disabled={savingKey === module.key}
              onClick={() => onToggle(module.key, !module.is_enabled)}
              className={
                module.is_enabled
                  ? "text-emerald-600 disabled:opacity-50"
                  : "text-gray-400 disabled:opacity-50"
              }
            >
              {module.is_enabled ? (
                <ToggleRight className="h-8 w-8" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span
              className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${moduleTypeClass(
                module.type
              )}`}
            >
              {module.type}
            </span>

            <span
              className={
                module.is_enabled
                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold uppercase text-emerald-700"
                  : "rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold uppercase text-gray-500"
              }
            >
              {module.is_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Last enabled: {formatDate(module.enabled_at)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ModuleAccessTable({ modules, savingKey, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Enabled By</th>
            <th className="px-4 py-3">Enabled At</th>
            <th className="px-4 py-3">Access</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {modules.map((module) => (
            <tr key={module.key} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">
                {module.label}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${moduleTypeClass(
                    module.type
                  )}`}
                >
                  {module.type}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{module.description}</td>
              <td className="px-4 py-3 text-gray-600">
                {module.enabled_by || "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatDate(module.enabled_at)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={savingKey === module.key}
                  onClick={() => onToggle(module.key, !module.is_enabled)}
                  className={
                    module.is_enabled
                      ? "inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                      : "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50"
                  }
                >
                  {module.is_enabled ? "Enabled" : "Disabled"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
