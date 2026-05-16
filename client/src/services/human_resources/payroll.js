import { supabase } from "../../config/supabaseClient";

export const PAYROLL_STATUSES = [
  "draft",
  "processing",
  "pending_approval",
  "approved",
  "disbursed",
];

export const PAYROLL_STATUS_LABELS = {
  draft: "Draft",
  processing: "Processing",
  pending_approval: "Pending Approval",
  approved: "Approved",
  disbursed: "Disbursed",
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

function money(value) {
  return Number(value || 0);
}

function normalizePayrollRun(row) {
  return {
    id: row.id,
    payrollCode: row.payroll_code,
    period: row.period_label,
    periodLabel: row.period_label,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status || "draft",
    statusLabel: PAYROLL_STATUS_LABELS[row.status] || row.status || "Draft",
    grossPay: money(row.gross_pay),
    deductions: money(row.deductions),
    netPay: money(row.net_pay),
    processedAt: row.processed_at,
    createdAt: row.created_at,
  };
}

function normalizePayrollEmployee(row) {
  const employeeName = row.employee
    ? [row.employee.first_name, row.employee.last_name].filter(Boolean).join(" ")
    : "Unknown Employee";

  return {
    id: row.id,
    payrollRunId: row.payroll_run_id,
    employeeId: row.employee_id,
    employee: employeeName,
    name: employeeName,
    employeeCode: row.employee?.employee_code || "—",
    department: row.employee?.department?.name || "Unassigned",
    position: row.employee?.position?.title || "Unassigned",
    basicSalary: money(row.basic_salary),
    allowances: money(row.allowances),
    overtime: money(row.overtime_pay),
    overtimePay: money(row.overtime_pay),
    bonus: money(row.bonus),
    deductions: money(row.deductions),
    netPay: money(row.net_pay),
    status: row.status || "pending",
  };
}

async function recalculatePayrollRun(payrollRunId) {
  if (!payrollRunId) return true;

  const { data, error } = await supabase
    .from("hr_employee_payroll_items")
    .select("basic_salary, allowances, overtime_pay, bonus, deductions, net_pay")
    .eq("payroll_run_id", payrollRunId);

  if (error) throw error;

  const totals = (data || []).reduce(
    (acc, item) => {
      acc.grossPay +=
        money(item.basic_salary) +
        money(item.allowances) +
        money(item.overtime_pay) +
        money(item.bonus);
      acc.deductions += money(item.deductions);
      acc.netPay += money(item.net_pay);
      return acc;
    },
    { grossPay: 0, deductions: 0, netPay: 0 }
  );

  const { error: updateError } = await supabase
    .from("hr_payroll_runs")
    .update({
      gross_pay: totals.grossPay,
      deductions: totals.deductions,
      net_pay: totals.netPay,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payrollRunId);

  if (updateError) throw updateError;

  return true;
}

export async function getPayrollData() {
  const [runsResult, itemsResult, employeesResult] = await Promise.all([
    supabase
      .from("hr_payroll_runs")
      .select(`
        id,
        payroll_code,
        period_label,
        period_start,
        period_end,
        status,
        gross_pay,
        deductions,
        net_pay,
        processed_at,
        created_at
      `)
      .order("period_start", { ascending: false }),

    supabase
      .from("hr_employee_payroll_items")
      .select(`
        id,
        payroll_run_id,
        employee_id,
        basic_salary,
        allowances,
        overtime_pay,
        bonus,
        deductions,
        net_pay,
        status,
        employee:hr_employees (
          id,
          employee_code,
          first_name,
          last_name,
          department:hr_departments (
            id,
            name
          ),
          position:hr_positions (
            id,
            title
          )
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("hr_employees")
      .select("id, employee_code, first_name, last_name")
      .eq("is_active", true)
      .order("employee_code", { ascending: true }),
  ]);

  if (runsResult.error) throw runsResult.error;
  if (itemsResult.error) throw itemsResult.error;
  if (employeesResult.error) throw employeesResult.error;

  const payrollRuns = (runsResult.data || []).map(normalizePayrollRun);
  const payrollEmployees = (itemsResult.data || []).map(normalizePayrollEmployee);

  return {
    payrollRuns,
    runs: payrollRuns,
    payrollEmployees,
    employeePayroll: payrollEmployees,
    payroll: payrollEmployees,
    employees: (employeesResult.data || []).map((employee) => ({
      id: employee.id,
      employeeCode: employee.employee_code,
      name: [employee.first_name, employee.last_name].filter(Boolean).join(" "),
    })),
    statuses: PAYROLL_STATUSES,
    insights: [
      {
        id: "payroll-review",
        type: "info",
        title: "Payroll Review",
        detail: "Payroll totals are recalculated after each employee payroll item update.",
      },
    ],
  };
}

export async function createPayrollRun(payload) {
  const workspaceId = await getCurrentWorkspaceId();

  const { error } = await supabase.from("hr_payroll_runs").insert({
    workspace_id: workspaceId,
    payroll_code: payload.payrollCode?.trim(),
    period_label: payload.periodLabel?.trim(),
    period_start: payload.periodStart,
    period_end: payload.periodEnd,
    status: payload.status || "draft",
  });

  if (error) throw error;
  return true;
}

export async function updatePayrollRun(id, payload) {
  if (!id) throw new Error("Payroll run ID is required.");

  const { error } = await supabase
    .from("hr_payroll_runs")
    .update({
      payroll_code: payload.payrollCode?.trim(),
      period_label: payload.periodLabel?.trim(),
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      status: payload.status || "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function deletePayrollRun(id) {
  if (!id) throw new Error("Payroll run ID is required.");

  const { error } = await supabase.from("hr_payroll_runs").delete().eq("id", id);
  if (error) throw error;

  return true;
}

export async function updatePayrollRunStatus(id, status) {
  if (!id) throw new Error("Payroll run ID is required.");

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved" || status === "disbursed") {
    updates.processed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("hr_payroll_runs")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function createPayrollItem(payload) {
  const workspaceId = await getCurrentWorkspaceId();

  const basicSalary = money(payload.basicSalary);
  const allowances = money(payload.allowances);
  const overtimePay = money(payload.overtimePay);
  const bonus = money(payload.bonus);
  const deductions = money(payload.deductions);
  const netPay = basicSalary + allowances + overtimePay + bonus - deductions;

  const { error } = await supabase.from("hr_employee_payroll_items").insert({
    workspace_id: workspaceId,
    payroll_run_id: payload.payrollRunId,
    employee_id: payload.employeeId,
    basic_salary: basicSalary,
    allowances,
    overtime_pay: overtimePay,
    bonus,
    deductions,
    net_pay: netPay,
    status: payload.status || "pending",
  });

  if (error) throw error;

  await recalculatePayrollRun(payload.payrollRunId);
  return true;
}

export async function updatePayrollItem(id, payload) {
  if (!id) throw new Error("Payroll item ID is required.");

  const basicSalary = money(payload.basicSalary);
  const allowances = money(payload.allowances);
  const overtimePay = money(payload.overtimePay);
  const bonus = money(payload.bonus);
  const deductions = money(payload.deductions);
  const netPay = basicSalary + allowances + overtimePay + bonus - deductions;

  const { error } = await supabase
    .from("hr_employee_payroll_items")
    .update({
      payroll_run_id: payload.payrollRunId,
      employee_id: payload.employeeId,
      basic_salary: basicSalary,
      allowances,
      overtime_pay: overtimePay,
      bonus,
      deductions,
      net_pay: netPay,
      status: payload.status || "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  await recalculatePayrollRun(payload.payrollRunId);
  return true;
}

export async function deletePayrollItem(id, payrollRunId) {
  if (!id) throw new Error("Payroll item ID is required.");

  const { error } = await supabase
    .from("hr_employee_payroll_items")
    .delete()
    .eq("id", id);

  if (error) throw error;

  await recalculatePayrollRun(payrollRunId);
  return true;
}
