export const ERP_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    type: "core",
    description: "Client overview, KPIs, summaries, and quick access.",
  },
  {
    key: "crm",
    label: "CRM",
    type: "core",
    description: "Pipeline overview and sales reporting.",
  },
  {
    key: "deals",
    label: "Deals",
    type: "core",
    description: "Detailed opportunity and deal pipeline management.",
  },
  {
    key: "contacts",
    label: "Contacts",
    type: "core",
    description: "Customer, company, and lead contact records.",
  },
  {
    key: "projects",
    label: "Projects",
    type: "operations",
    description: "Service delivery and implementation project tracking.",
  },
  {
    key: "tasks",
    label: "Tasks",
    type: "operations",
    description: "Task execution under projects.",
  },
  {
    key: "inbox",
    label: "Inbox",
    type: "operations",
    description: "Business communication and linked conversations.",
  },
  {
    key: "erp",
    label: "ERP",
    type: "operations",
    description: "ERP resources, products, services, and operational records.",
  },
  {
    key: "analytics",
    label: "Analytics",
    type: "intelligence",
    description: "Reports, metrics, dashboards, and insights.",
  },
  {
    key: "chatbot",
    label: "Chatbot",
    type: "intelligence",
    description: "AI chatbot configuration and knowledge base.",
  },
];

export const mockWorkspaces = [
  {
    id: "ws_accenture_ph",
    name: "Accenture PH Workspace",
    company_name: "Accenture PH",
    owner: "Maria Santos",
    status: "active",
  },
  {
    id: "ws_techcorp_manila",
    name: "TechCorp Manila Workspace",
    company_name: "TechCorp Manila",
    owner: "Carlos Dela Cruz",
    status: "active",
  },
  {
    id: "ws_finserve_ph",
    name: "FinServe PH Workspace",
    company_name: "FinServe PH",
    owner: "Lisa Chen",
    status: "active",
  },
];

export const mockWorkspaceModuleAccess = [
  {
    id: "1",
    workspace_id: "ws_accenture_ph",
    module_key: "dashboard",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "2",
    workspace_id: "ws_accenture_ph",
    module_key: "crm",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "3",
    workspace_id: "ws_accenture_ph",
    module_key: "deals",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "4",
    workspace_id: "ws_accenture_ph",
    module_key: "contacts",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "5",
    workspace_id: "ws_accenture_ph",
    module_key: "projects",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "6",
    workspace_id: "ws_accenture_ph",
    module_key: "tasks",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-01",
  },
  {
    id: "7",
    workspace_id: "ws_techcorp_manila",
    module_key: "dashboard",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-03",
  },
  {
    id: "8",
    workspace_id: "ws_techcorp_manila",
    module_key: "contacts",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-03",
  },
  {
    id: "9",
    workspace_id: "ws_techcorp_manila",
    module_key: "projects",
    is_enabled: true,
    enabled_by: "Mich Valenzuela",
    enabled_at: "2026-05-03",
  },
];

export async function getERPControlData() {
  return {
    workspaces: mockWorkspaces,
    modules: ERP_MODULES,
    accessRows: mockWorkspaceModuleAccess,
  };
}

export async function updateWorkspaceModuleAccess({
  workspaceId,
  moduleKey,
  isEnabled,
}) {
  return {
    id: `${workspaceId}_${moduleKey}`,
    workspace_id: workspaceId,
    module_key: moduleKey,
    is_enabled: isEnabled,
    enabled_by: "Current Admin",
    enabled_at: isEnabled ? new Date().toISOString() : null,
  };
}
