import { supabase } from "../../config/supabaseClient";

export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "absent",
  "on_leave",
  "half_day",
];

export const ATTENDANCE_STATUS_LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  on_leave: "On Leave",
  half_day: "Half Day",
};

function formatTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeAttendance(row) {
  const employeeName = row.employee
    ? [row.employee.first_name, row.employee.last_name].filter(Boolean).join(" ")
    : "Unknown Employee";

  return {
    id: row.id,
    employeeId: row.employee_id,
    employee: employeeName,
    employeeCode: row.employee?.employee_code || "—",
    department: row.employee?.department?.name || "Unassigned",
    date: row.attendance_date,
    checkIn: formatTime(row.check_in),
    checkOut: formatTime(row.check_out),
    status: row.status || "present",
    workHours: Number(row.work_hours || 0),
    overtimeHours: Number(row.overtime_hours || 0),
    aiFlag: row.ai_flag || "Normal",
  };
}

export async function getAttendanceData() {
  const { data, error } = await supabase
    .from("hr_attendance_logs")
    .select(`
      id,
      employee_id,
      attendance_date,
      check_in,
      check_out,
      status,
      work_hours,
      overtime_hours,
      ai_flag,
      employee:hr_employees (
        id,
        employee_code,
        first_name,
        last_name,
        department:hr_departments (
          id,
          name
        )
      )
    `)
    .order("attendance_date", { ascending: false });

  if (error) throw error;

  return {
    attendance: (data || []).map(normalizeAttendance),
    statuses: ATTENDANCE_STATUSES,
  };
}
