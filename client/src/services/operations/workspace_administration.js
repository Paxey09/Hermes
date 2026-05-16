import { supabase } from "../../config/supabaseClient";

export const WORKSPACE_TYPES = ["individual", "shared", "company", "internal"];

export const WORKSPACE_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "archived",
];

export const WORKSPACE_MEMBER_ROLES = ["owner", "admin", "member"];

export async function getWorkspaceAdministrationData() {
  const { data, error } = await supabase
    .from("workspaces")
    .select(`
      id,
      name,
      workspace_type,
      status,
      owner_user_id,
      created_at,
      updated_at,
      owner:owner_user_id (
        id,
        email,
        full_name,
        role,
        status
      ),
      workspace_members (
        id,
        user_id,
        workspace_id,
        role,
        created_at,
        user:user_id (
          id,
          email,
          full_name,
          role,
          status
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getWorkspaceAssignableProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function createWorkspace(payload) {
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: payload.name?.trim(),
      workspace_type: payload.workspace_type || "individual",
      status: payload.status || "active",
      owner_user_id: payload.owner_user_id || null,
    })
    .select(`
      id,
      name,
      workspace_type,
      status,
      owner_user_id,
      created_at,
      updated_at,
      owner:owner_user_id (
        id,
        email,
        full_name,
        role,
        status
      )
    `)
    .single();

  if (error) throw error;

  if (payload.owner_user_id) {
    await upsertWorkspaceMember({
      workspaceId: data.id,
      userId: payload.owner_user_id,
      role: "owner",
    });
  }

  return data;
}

export async function updateWorkspace(id, payload) {
  if (!id) throw new Error("Workspace ID is required.");

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      name: payload.name?.trim(),
      workspace_type: payload.workspace_type,
      status: payload.status,
      owner_user_id: payload.owner_user_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      id,
      name,
      workspace_type,
      status,
      owner_user_id,
      created_at,
      updated_at,
      owner:owner_user_id (
        id,
        email,
        full_name,
        role,
        status
      )
    `)
    .single();

  if (error) throw error;

  if (payload.owner_user_id) {
    await upsertWorkspaceMember({
      workspaceId: id,
      userId: payload.owner_user_id,
      role: "owner",
    });
  }

  return data;
}

export async function updateWorkspaceStatus(id, status) {
  if (!id) throw new Error("Workspace ID is required.");

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function upsertWorkspaceMember({ workspaceId, userId, role }) {
  if (!workspaceId) throw new Error("Workspace ID is required.");
  if (!userId) throw new Error("User is required.");

  const { data, error } = await supabase
    .from("workspace_members")
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        role: role || "member",
      },
      {
        onConflict: "user_id,workspace_id",
      }
    )
    .select(`
      id,
      user_id,
      workspace_id,
      role,
      created_at,
      user:user_id (
        id,
        email,
        full_name,
        role,
        status
      )
    `)
    .single();

  if (error) throw error;

  return data;
}

export async function removeWorkspaceMember(memberId) {
  if (!memberId) throw new Error("Workspace member ID is required.");

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;

  return true;
}
