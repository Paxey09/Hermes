import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  List,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITIES,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from "../../../services/tasks";

function labelStatus(status) {
  return TASK_STATUS_LABELS[status] || status || "Unknown";
}

function labelPriority(priority) {
  return TASK_PRIORITY_LABELS[priority] || priority || "Unknown";
}

function formatDate(date) {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isPastDue(date) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

function Avatar({ name, size = "h-8 w-8" }) {
  const initials = String(name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white`}>
      {initials}
    </div>
  );
}

export function TaskStatusBadge({ status }) {
  const color = TASK_STATUS_COLORS[status] || "#6b7a8d";

  return (
    <span
      className="rounded-full border px-2 py-1 text-xs font-bold uppercase"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}15` }}
    >
      {labelStatus(status)}
    </span>
  );
}

export function TasksHeader({ onRefresh, onCreate }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Modules <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Tasks</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage project-based tasks, priorities, assignees, and deadlines.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>
    </div>
  );
}

export function TasksLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">Loading tasks...</p>
    </div>
  );
}

export function TasksErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load tasks</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function TasksKPICards({ tasks }) {
  const total = tasks.length;
  const open = tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length;
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const highPriority = tasks.filter((task) => ["high", "critical"].includes(task.priority)).length;
  const overdue = tasks.filter(
    (task) => isPastDue(task.dueDate) && !["done", "cancelled"].includes(task.status)
  ).length;

  const cards = [
    { label: "Total Tasks", value: total, icon: List, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Open Tasks", value: open, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Completed", value: done, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Blocked", value: blocked, icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" },
    { label: "High Priority", value: highPriority, icon: FolderKanban, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <h3 className="mt-4 text-3xl font-bold text-gray-900">{card.value}</h3>
                <p className="mt-3 text-sm font-medium text-gray-500">Project-based task data</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TasksViewTabs({ activeView, onViewChange }) {
  const tabs = [
    { key: "kanban", label: "Board", icon: FolderKanban },
    { key: "list", label: "List", icon: List },
  ];

  return (
    <div className="flex flex-wrap gap-6 border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onViewChange(tab.key)}
            className={
              activeView === tab.key
                ? "flex items-center gap-2 border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-600"
                : "flex items-center gap-2 pb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
            }
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TasksFilterToolbar({ filters, onFilterChange, statuses, priorities, assignees, projects }) {
  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 py-4 xl:flex-row">
      <input
        className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500"
        placeholder="Search tasks, projects, assignees..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.status} onChange={(e) => update("status", e.target.value)}>
        <option value="all">All Status</option>
        {statuses.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.priority} onChange={(e) => update("priority", e.target.value)}>
        <option value="all">All Priorities</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{labelPriority(priority)}</option>)}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.assignee} onChange={(e) => update("assignee", e.target.value)}>
        <option value="all">All Assignees</option>
        {assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.project} onChange={(e) => update("project", e.target.value)}>
        <option value="all">All Projects</option>
        {projects.map((project) => <option key={project} value={project}>{project}</option>)}
      </select>
    </div>
  );
}

function TaskCard({ task, onClick }) {
  const statusColor = TASK_STATUS_COLORS[task.status] || "#6b7a8d";
  const priorityColor = TASK_PRIORITY_COLORS[task.priority] || "#8a94a6";
  const overdue = isPastDue(task.dueDate) && !["done", "cancelled"].includes(task.status);
  const subtasks = task.subtasks || [];
  const subtasksDone = subtasks.filter((item) => item.done).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTop: `3px solid ${statusColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-gray-900">{task.title}</h4>
          <p className="mt-1 text-sm text-blue-600">{task.project}</p>
        </div>
        <span style={{ color: priorityColor }} className="text-xs font-bold uppercase">
          {labelPriority(task.priority)}
        </span>
      </div>

      {task.notes && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{task.notes}</p>}

      {subtasks.length > 0 && (
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-emerald-500"
              style={{ width: `${(subtasksDone / subtasks.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {subtasksDone}/{subtasks.length} subtasks done
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-2">
          <Avatar name={task.assignee} size="h-6 w-6" />
          {task.assignee}
        </span>
        <span className={overdue ? "font-bold text-red-600" : ""}>{formatDate(task.dueDate)}</span>
      </div>
    </button>
  );
}

export function TasksKanbanBoard({ statuses, tasks, onCardClick }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {statuses.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status);
        const color = TASK_STATUS_COLORS[status] || "#6b7a8d";

        return (
          <div key={status} className="min-h-[420px] rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">{labelStatus(status)}</h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {statusTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {statusTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400">
                  No tasks
                </div>
              ) : (
                statusTasks.map((task) => <TaskCard key={task.id} task={task} onClick={() => onCardClick(task)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TasksListView({ tasks, onRowClick }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <List className="mx-auto h-10 w-10 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No tasks found</h3>
        <p className="mt-1 text-sm text-gray-500">Create project-based tasks to start tracking work.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Task</th>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Due Date</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <tr key={task.id} onClick={() => onRowClick(task)} className="cursor-pointer hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">{task.title}</td>
              <td className="px-4 py-3 text-blue-600">{task.project}</td>
              <td className="px-4 py-3 font-semibold" style={{ color: TASK_PRIORITY_COLORS[task.priority] }}>
                {labelPriority(task.priority)}
              </td>
              <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
              <td className="px-4 py-3 text-gray-600">{task.assignee}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(task.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTimeline({ activities }) {
  if (!activities?.length) {
    return <p className="text-center text-sm text-gray-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-blue-600">{activity.type}</span>
            <span className="text-xs text-gray-400">{formatDate(activity.date)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.note}</p>
          <p className="mt-2 text-xs text-gray-400">{activity.user}</p>
        </div>
      ))}
    </div>
  );
}

export function TaskDetailDrawer({ task, onClose, onEdit, onMarkDone, onAddNote, saving }) {
  const [tab, setTab] = useState("details");
  const [note, setNote] = useState("");

  async function submitNote() {
    await onAddNote(task.id, note);
    setNote("");
    setTab("activity");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
              <p className="mt-1 text-sm text-blue-600">{task.project}</p>
            </div>

            <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {["details", "activity", "notes", "subtasks"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "border-b-2 border-blue-600 px-5 py-3 text-sm font-semibold capitalize text-blue-600"
                  : "px-5 py-3 text-sm font-medium capitalize text-gray-500 hover:text-gray-900"
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "details" && (
            <div className="space-y-4 text-sm">
              <Info label="Project" value={task.project} />
              <Info label="Status" value={labelStatus(task.status)} />
              <Info label="Priority" value={labelPriority(task.priority)} />
              <Info label="Assignee" value={task.assignee} />
              <Info label="Due Date" value={formatDate(task.dueDate)} />
              <Info label="Created" value={formatDate(task.created)} />
              <Info label="Description" value={task.notes || "No description"} />
            </div>
          )}

          {tab === "activity" && <ActivityTimeline activities={task.activities} />}

          {tab === "notes" && (
            <div className="space-y-3">
              <textarea
                className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                placeholder="Write a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                disabled={saving || !note.trim()}
                onClick={submitNote}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>
          )}

          {tab === "subtasks" && (
            <p className="text-center text-sm text-gray-400">
              Subtasks are not enabled yet. Add the subtasks table after CRUD is stable.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={saving || task.status === "done"}
            onClick={onMarkDone}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {task.status === "done" ? "Completed" : saving ? "Saving..." : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskFormModal({ mode, task, options, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    assignedTo: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    description: "",
  });

  useEffect(() => {
    if (mode === "edit" && task) {
      setForm({
        title: task.title || "",
        projectId: task.projectId || "",
        assignedTo: task.assigneeId || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
        description: task.notes || "",
      });
    }
  }, [mode, task]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();

    if (!form.projectId) {
      alert("Project is required.");
      return;
    }

    if (!form.title.trim()) {
      alert("Task title is required.");
      return;
    }

    onSubmit({
      title: form.title.trim(),
      projectId: form.projectId,
      assignedTo: form.assignedTo || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      description: form.description.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "edit" ? "Edit Task" : "New Task"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Tasks must be linked to a project.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Task Title</label>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Project</label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
            >
              <option value="">Select project</option>
              {(options.projects || []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Assignee</label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.assignedTo}
              onChange={(e) => update("assignedTo", e.target.value)}
            >
              <option value="">Unassigned</option>
              {(options.assignees || []).map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.full_name || assignee.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Status</label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{labelStatus(status)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Priority</label>
            <select
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{labelPriority(priority)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Due Date</label>
            <input
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Description</label>
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Task details, request, bug notes, or internal context..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}
