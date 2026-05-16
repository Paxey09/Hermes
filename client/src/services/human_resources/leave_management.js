import { supabase } from "../../config/supabaseClient";

export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"];

export const LEAVE_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

async function getCurrentWorkspaceId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData?.user?.id;
  if (!userId) throw new Error("No authenticated user found.");

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace_id) throw new Error("No workspace membership found.");

  return data.workspace_id;
}

function normalizeLeaveRequest(row) {
  const employeeName = row.employee
    ? [row.employee.first_name, row.employee.last_name].filter(Boolean).join(" ")
    : "Unknown Employee";

  return {
    id: row.id,
    employeeId: row.employee_id,
    employee: employeeName,
    employeeName,
    employeeCode: row.employee?.employee_code || "—",
    department: row.employee?.department?.name || "Unassigned",
    leaveType: row.leave_type?.name || "Unassigned",
    type: row.leave_type?.name || "Unassigned",
    leaveTypeId: row.leave_type_id || "",
    startDate: row.start_date,
    endDate: row.end_date,
    from: row.start_date,
    to: row.end_date,
    totalDays: Number(row.total_days || 0),
    days: Number(row.total_days || 0),
    reason: row.reason || "—",
    status: row.status || "pending",
    statusLabel: LEAVE_STATUS_LABELS[row.status] || row.status || "Pending",
    aiFlag: row.ai_flag || "Normal",
    createdAt: row.created_at,
  };
}

export async function getLeaveManagementData() {
  const [requestsResult, typesResult, employeesResult] = await Promise.all([
    supabase
      .from("hr_leave_requests")
      .select(`
        id,
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        ai_flag,
        created_at,
        employee:hr_employees!hr_leave_requests_employee_id_fkey (
          id,
          employee_code,
          first_name,
          last_name,
          department:hr_departments (
            id,
            name
          )
        ),
        leave_type:hr_leave_types (
          id,
          name,
          leave_key
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("hr_leave_types")
      .select("id, name, leave_key, default_annual_days, is_paid")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("hr_employees")
      .select("id, employee_code, first_name, last_name")
      .eq("is_active", true)
      .order("employee_code", { ascending: true }),
  ]);

  if (requestsResult.error) throw requestsResult.error;
  if (typesResult.error) throw typesResult.error;
  if (employeesResult.error) throw employeesResult.error;

  const requests = (requestsResult.data || []).map(normalizeLeaveRequest);

  return {
    requests,
    leaveRequests: requests,
    leaves: requests,
    leaveTypes: typesResult.data || [],
    employees: (employeesResult.data || []).map((employee) => ({
      id: employee.id,
      employeeCode: employee.employee_code,
      name: [employee.first_name, employee.last_name].filter(Boolean).join(" "),
    })),
    statuses: LEAVE_STATUSES,
    balances: [],
  };
}

export async function createLeaveRequest(payload) {
  const workspaceId = await getCurrentWorkspaceId();

  const { error } = await supabase.from("hr_leave_requests").insert({
    workspace_id: workspaceId,
    employee_id: payload.employeeId,
    leave_type_id: payload.leaveTypeId || null,
    start_date: payload.startDate,
    end_date: payload.endDate,
    total_days: Number(payload.totalDays || 1),
    reason: payload.reason?.trim() || null,
    status: "pending",
    ai_flag: "Needs HR review",
  });

  if (error) throw error;
  return true;
}

export async function updateLeaveRequest(id, payload) {
  if (!id) throw new Error("Leave request ID is required.");

  const { error } = await supabase
    .from("hr_leave_requests")
    .update({
      employee_id: payload.employeeId,
      leave_type_id: payload.leaveTypeId || null,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: Number(payload.totalDays || 1),
      reason: payload.reason?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function updateLeaveRequestStatus(id, status) {
  if (!id) throw new Error("Leave request ID is required.");

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved") {
    updates.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("hr_leave_requests")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function deleteLeaveRequest(id) {
  if (!id) throw new Error("Leave request ID is required.");

  const { error } = await supabase
    .from("hr_leave_requests")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}
