import {
  AlertCircle,
  Brain,
  CalendarDays,
  Clock3,
  RefreshCw,
  Search,
  Timer,
  Users,
} from "lucide-react";

import {
  ATTENDANCE_STATUS_LABELS,
} from "../../../services/human_resources/attendance";

function statusLabel(status) {
  return ATTENDANCE_STATUS_LABELS[status] || status;
}

export function AttendanceHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-color)] pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Attendance
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Workforce attendance monitoring and AI attendance intelligence.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>
  );
}

export function AttendanceKPICards({ attendance }) {
  const total = attendance.length;
  const present = attendance.filter((item) => item.status === "present").length;
  const late = attendance.filter((item) => item.status === "late").length;
  const leave = attendance.filter((item) => item.status === "on_leave").length;

  const cards = [
    {
      label: "Employees Logged",
      value: total,
      icon: Users,
      color: "text-[var(--brand-gold)] bg-[var(--brand-gold-soft)] border-[var(--brand-gold-border)]",
    },
    {
      label: "Present",
      value: present,
      icon: CalendarDays,
      color: "text-[var(--success)] bg-[var(--success-soft)] border-green-500/20",
    },
    {
      label: "Late",
      value: late,
      icon: Clock3,
      color: "text-[var(--danger)] bg-[var(--danger-soft)] border-red-500/20",
    },
    {
      label: "On Leave",
      value: leave,
      icon: Timer,
      color: "text-[var(--brand-cyan)] bg-[var(--brand-cyan-soft)] border-[var(--brand-cyan-border)]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {card.label}
                </p>

                <h3 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
                  {card.value}
                </h3>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-3xl border ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AttendanceToolbar({
  search,
  onSearchChange,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-color)] py-4 xl:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search employee..."
          className="h-11 w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-gold-border)]"
        />
      </div>
    </div>
  );
}

export function AttendanceTable({ attendance }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--hover-bg)] text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Check In</th>
            <th className="px-4 py-3">Check Out</th>
            <th className="px-4 py-3">Hours</th>
            <th className="px-4 py-3">Overtime</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">AI Signal</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--border-color)]">
          {attendance.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-[var(--hover-bg)]"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {item.employee}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    {item.employeeCode}
                  </p>
                </div>
              </td>

              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {item.department}
              </td>

              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {item.date}
              </td>

              <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                {item.checkIn}
              </td>

              <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                {item.checkOut}
              </td>

              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {item.workHours} hrs
              </td>

              <td className="px-4 py-3 text-[var(--brand-gold)] font-semibold">
                {item.overtimeHours} hrs
              </td>

              <td className="px-4 py-3">
                <span className="rounded-full border border-[var(--border-color)] bg-[var(--hover-bg)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {statusLabel(item.status)}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-cyan-border)] bg-[var(--brand-cyan-soft)] px-2 py-1 text-xs font-semibold text-[var(--brand-cyan)]">
                  <Brain className="h-3 w-3" />
                  {item.aiFlag}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AttendanceLoadingState() {
  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[var(--brand-gold)]" />

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Loading attendance...
      </p>
    </div>
  );
}

export function AttendanceErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-[var(--danger-soft)] p-6">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-[var(--danger)]" />

        <div>
          <h3 className="font-semibold text-[var(--danger)]">
            Failed to load attendance
          </h3>

          <p className="mt-1 text-sm text-[var(--danger)]">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-3xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
