import { useEffect, useMemo, useState } from "react";

import {
  AttendanceErrorState,
  AttendanceHeader,
  AttendanceKPICards,
  AttendanceLoadingState,
  AttendanceTable,
  AttendanceToolbar,
} from "../../components/admin/layout/Admin_Attendance_Components.jsx";

import {
  getAttendanceData,
} from "../../services/human_resources/attendance";

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const data = await getAttendanceData();

      setAttendance(data.attendance || []);
    } catch (err) {
      console.error("Attendance load error:", err);

      setError(err.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  const filteredAttendance = useMemo(() => {
    const term = search.trim().toLowerCase();

    return attendance.filter((item) => {
      if (!term) return true;

      return (
        item.employee.toLowerCase().includes(term) ||
        item.employeeCode.toLowerCase().includes(term) ||
        item.department.toLowerCase().includes(term)
      );
    });
  }, [attendance, search]);

  return (
    <div className="space-y-6">
      <AttendanceHeader onRefresh={loadAttendance} />

      {loading && <AttendanceLoadingState />}

      {!loading && error && (
        <AttendanceErrorState
          message={error}
          onRetry={loadAttendance}
        />
      )}

      {!loading && !error && (
        <>
          <AttendanceKPICards attendance={attendance} />

          <AttendanceToolbar
            search={search}
            onSearchChange={setSearch}
          />

          <AttendanceTable attendance={filteredAttendance} />
        </>
      )}
    </div>
  );
}
