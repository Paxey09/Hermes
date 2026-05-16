import { supabase } from "../../config/supabaseClient";

import {
  buildNavigationRegistry,
  getERPRegistryData,
} from "./erp_registry.js";

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

export async function getWorkspaceFeatureAccess(workspaceId) {
  const { data, error } = await supabase
    .from("workspace_feature_access")
    .select(`
      id,
      workspace_id,
      feature_key,
      is_enabled,
      enabled_at,
      enabled_by,
      access_source
    `)
    .eq("workspace_id", workspaceId)
    .eq("is_enabled", true);

  if (error) throw error;

  return data || [];
}

export async function getEnabledClientModules() {
  const user = await getCurrentUser();

  const [
    profile,
    workspaceContext,
    registryData,
  ] = await Promise.all([
    getCurrentProfile(user.id),
    getCurrentWorkspace(user.id),
    getERPRegistryData(),
  ]);

  const accessRows = await getWorkspaceFeatureAccess(
    workspaceContext.workspaceId
  );

  const enabledKeys = new Set(
    accessRows
      .filter((row) => row.is_enabled)
      .map((row) => row.feature_key)
  );

  const enabledFeatureKeys = Array.from(enabledKeys);

  const navSections = buildNavigationRegistry({
    divisions: registryData.divisions || [],
    features: registryData.features || [],
    enabledFeatureKeys,
    mode: "client",
  });

  const modules = navSections.flatMap((section) =>
    section.items.map((item) => ({
      key: item.key,
      label: item.label,
      route: item.clientRoute,
      clientRoute: item.clientRoute,
      divisionKey: section.key,
      divisionTitle: section.title,
      divisionIcon: section.icon,
      status: item.status,
      icon: item.icon || section.icon,
      description:
        item.description || "Workspace module",
      isCore:
        item.autoEnableWithDivision || false,
      is_enabled: true,
    }))
  );

  return {
    user,
    profile,
    workspace: workspaceContext.workspace,
    workspaceId: workspaceContext.workspaceId,
    workspaceRole: workspaceContext.workspaceRole,
    accessRows,
    modules,
    coreModules: modules.filter(
      (module) => module.isCore
    ),
    workspaceModules: modules,
    enabledKeys,
    enabledFeatureKeys,
    navSections,
  };
}

export async function canAccessClientModule(featureKey) {
  if (!featureKey) return false;

  const context = await getEnabledClientModules();

  return context.enabledKeys.has(featureKey);
}
