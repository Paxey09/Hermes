import { supabase } from "../../config/supabaseClient";

export const EMPLOYEE_STATUSES = ["active", "on_leave", "inactive", "terminated"];
export const EMPLOYEE_TYPES = ["full_time", "part_time", "contract", "intern"];

export const EMPLOYEE_STATUS_LABELS = {
  active: "Active",
  on_leave: "On Leave",
  inactive: "Inactive",
  terminated: "Terminated",
};

export const EMPLOYEE_TYPE_LABELS = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

function normalizeEmployee(row) {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    name: [row.first_name, row.last_name].filter(Boolean).join(" "),
    email: row.email,
    phone: row.phone,
    departmentId: row.department?.id || "",
    positionId: row.position?.id || "",
    department: row.department?.name || "Unassigned",
    position: row.position?.title || "Unassigned",
    manager: "—",
    type: row.employment_type || "full_time",
    status: row.employment_status || "active",
    hireDate: row.hire_date,
    attendanceStatus: "Not connected",
    payrollStatus: "Not connected",
    performanceRating: null,
    aiRisk: "Pending",
  };
}

async function getCurrentWorkspaceId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  const userId = authData?.user?.id;

  if (!userId) {
    throw new Error("No authenticated user found.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data?.workspace_id) {
    throw new Error("No workspace membership found for current user.");
  }

  return data.workspace_id;
}

export async function getEmployeesData() {
  const { data, error } = await supabase
    .from("hr_employees")
    .select(`
      id,
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      employment_type,
      employment_status,
      hire_date,
      department:hr_departments (
        id,
        name
      ),
      position:hr_positions (
        id,
        title
      )
    `)
    .eq("is_active", true)
    .order("employee_code", { ascending: true });

  if (error) throw error;

  const employees = (data || []).map(normalizeEmployee);

  const departments = Array.from(
    new Set(
      employees
        .map((employee) => employee.department)
        .filter((department) => department && department !== "Unassigned")
    )
  );

  return {
    employees,
    departments,
    statuses: EMPLOYEE_STATUSES,
    types: EMPLOYEE_TYPES,
  };
}

export async function getEmployeeFormOptions() {
  const [departmentsResult, positionsResult, employeesResult] =
    await Promise.all([
      supabase
        .from("hr_departments")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("hr_positions")
        .select("id, title")
        .eq("is_active", true)
        .order("title", { ascending: true }),

      supabase
        .from("hr_employees")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("first_name", { ascending: true }),
    ]);

  if (departmentsResult.error) throw departmentsResult.error;
  if (positionsResult.error) throw positionsResult.error;
  if (employeesResult.error) throw employeesResult.error;

  return {
    departments: departmentsResult.data || [],
    positions: positionsResult.data || [],
    statuses: EMPLOYEE_STATUSES,
    types: EMPLOYEE_TYPES,
    managers: (employeesResult.data || []).map((employee) => ({
      id: employee.id,
      name: [employee.first_name, employee.last_name].filter(Boolean).join(" "),
    })),
  };
}

export async function createEmployee(payload) {
  const workspaceId = await getCurrentWorkspaceId();

  const { error } = await supabase.from("hr_employees").insert({
    workspace_id: workspaceId,
    employee_code: payload.employeeCode?.trim(),
    first_name: payload.firstName?.trim(),
    last_name: payload.lastName?.trim(),
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    department_id: payload.departmentId || null,
    position_id: payload.positionId || null,
    employment_status: payload.status || "active",
    employment_type: payload.type || "full_time",
    hire_date: payload.hireDate || null,
  });

  if (error) throw error;

  return true;
}

export async function updateEmployee(id, payload) {
  if (!id) throw new Error("Employee ID is required.");

  const { error } = await supabase
    .from("hr_employees")
    .update({
      employee_code: payload.employeeCode?.trim(),
      first_name: payload.firstName?.trim(),
      last_name: payload.lastName?.trim(),
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      department_id: payload.departmentId || null,
      position_id: payload.positionId || null,
      employment_status: payload.status || "active",
      employment_type: payload.type || "full_time",
      hire_date: payload.hireDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function archiveEmployee(id) {
  if (!id) throw new Error("Employee ID is required.");

  const { error } = await supabase
    .from("hr_employees")
    .update({
      is_active: false,
      employment_status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  return true;
}
