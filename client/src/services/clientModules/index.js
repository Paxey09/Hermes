import { supabase } from "../../config/supabaseClient";
import {
  CORE_CLIENT_MODULES,
  WORKSPACE_CLIENT_MODULES,
} from "../../constants/modules";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated.");

  return user;
}

export async function getCurrentProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function getCurrentWorkspace(userId) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      id,
      user_id,
      workspace_id,
      role,
      workspaces:workspace_id (
        id,
        name,
        workspace_type,
        owner_user_id,
        status
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  const memberships = data || [];

  const activeClientMembership =
    memberships.find(
      (membership) =>
        membership.workspaces?.status === "active" &&
        membership.workspaces?.workspace_type !== "internal"
    ) || memberships[0];

  if (!activeClientMembership?.workspace_id) {
    throw new Error("No client workspace found for this user.");
  }

  return {
    membership: activeClientMembership,
    workspace: activeClientMembership.workspaces,
    workspaceId: activeClientMembership.workspace_id,
    workspaceRole: activeClientMembership.role,
  };
}

export async function getWorkspaceModuleAccess(workspaceId) {
  const { data, error } = await supabase
    .from("workspace_module_access")
    .select("id, workspace_id, module_key, is_enabled, enabled_at, enabled_by")
    .eq("workspace_id", workspaceId)
    .eq("is_enabled", true);

  if (error) throw error;

  return data || [];
}

export async function getEnabledClientModules() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile(user.id);
  const workspaceContext = await getCurrentWorkspace(user.id);
  const accessRows = await getWorkspaceModuleAccess(workspaceContext.workspaceId);

  const enabledKeys = new Set(
    accessRows
      .filter((row) => row.is_enabled)
      .map((row) => row.module_key)
  );

  const enabledWorkspaceModules = WORKSPACE_CLIENT_MODULES.filter((module) =>
    enabledKeys.has(module.key)
  );

  return {
    user,
    profile,
    workspace: workspaceContext.workspace,
    workspaceId: workspaceContext.workspaceId,
    workspaceRole: workspaceContext.workspaceRole,
    accessRows,
    modules: [...CORE_CLIENT_MODULES, ...enabledWorkspaceModules],
    coreModules: CORE_CLIENT_MODULES,
    workspaceModules: enabledWorkspaceModules,
    enabledKeys,
  };
}

export async function canAccessClientModule(moduleKey) {
  if (!moduleKey) return false;

  const coreModule = CORE_CLIENT_MODULES.find(
    (module) => module.key === moduleKey
  );

  if (coreModule) return true;

  const context = await getEnabledClientModules();
  return context.enabledKeys.has(moduleKey);
}
