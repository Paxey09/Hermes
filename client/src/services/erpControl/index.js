import { supabase } from "../../config/supabaseClient";
import { WORKSPACE_CLIENT_MODULES } from "../../constants/modules";

export const ERP_MODULES = WORKSPACE_CLIENT_MODULES.map((module) => ({
  key: module.key,
  label: module.label,
  type: module.section?.toLowerCase() || "module",
  description: module.description,
}));

export async function getERPControlData() {
  const { data: memberRows, error: memberError } = await supabase
    .from("workspace_members")
    .select(`
      workspace_id,
      user_id,
      role
    `);

  if (memberError) throw memberError;

  const workspaceIds = [
    ...new Set((memberRows || []).map((row) => row.workspace_id)),
  ];

  const userIds = [
    ...new Set((memberRows || []).map((row) => row.user_id)),
  ];

  const [workspaceResult, profileResult, accessResult] = await Promise.all([
    supabase
      .from("workspaces")
      .select(`
        id,
        name,
        workspace_type,
        status,
        created_at
      `)
      .in("id", workspaceIds),

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        status
      `)
      .in("id", userIds),

    supabase
      .from("workspace_module_access")
      .select(`
        id,
        workspace_id,
        module_key,
        is_enabled,
        enabled_at,
        enabled_by
      `),
  ]);

  if (workspaceResult.error) throw workspaceResult.error;
  if (profileResult.error) throw profileResult.error;
  if (accessResult.error) throw accessResult.error;

  const workspaceLookup = new Map();
  const profileLookup = new Map();

  for (const workspace of workspaceResult.data || []) {
    workspaceLookup.set(workspace.id, workspace);
  }

  for (const profile of profileResult.data || []) {
    profileLookup.set(profile.id, profile);
  }

  const workspaceMap = new Map();

  for (const member of memberRows || []) {
    const workspace = workspaceLookup.get(member.workspace_id);
    const profile = profileLookup.get(member.user_id);

    if (!workspace || !profile) continue;

    // Ignore internal admin workspace
    if (workspace.workspace_type === "internal") continue;

    // Only active clients
    if (profile.role !== "Client") continue;
    if (profile.status !== "active") continue;

    if (!workspaceMap.has(workspace.id)) {
      workspaceMap.set(workspace.id, {
        id: workspace.id,
        name: workspace.name,
        workspace_type: workspace.workspace_type,
        status: workspace.status,
        created_at: workspace.created_at,
        company_name: workspace.name,
        owner: profile.full_name || profile.email || "Workspace Owner",
        owner_email: profile.email,
        owner_id: profile.id,
      });
    }
  }

  const workspaces = Array.from(workspaceMap.values());

  const validWorkspaceIds = new Set(
    workspaces.map((workspace) => workspace.id)
  );

  const accessRows = (accessResult.data || []).filter((row) =>
    validWorkspaceIds.has(row.workspace_id)
  );

  return {
    workspaces,
    modules: ERP_MODULES,
    accessRows,
  };
}

export async function updateWorkspaceModuleAccess({
  workspaceId,
  moduleKey,
  isEnabled,
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const payload = {
    workspace_id: workspaceId,
    module_key: moduleKey,
    is_enabled: isEnabled,
    enabled_by: userId,
    enabled_at: isEnabled ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("workspace_module_access")
    .upsert(payload, {
      onConflict: "workspace_id,module_key",
    })
    .select(`
      id,
      workspace_id,
      module_key,
      is_enabled,
      enabled_at,
      enabled_by,
      profiles:enabled_by (
        full_name,
        email
      )
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workspace_id: data.workspace_id,
    module_key: data.module_key,
    is_enabled: data.is_enabled,
    enabled_at: data.enabled_at,
    enabled_by:
      data.profiles?.full_name ||
      data.profiles?.email ||
      "Unknown User",
  };
}
