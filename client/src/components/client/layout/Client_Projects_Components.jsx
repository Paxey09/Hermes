import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  FolderKanban,
  ListChecks,
  MessageSquare,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  CLIENT_PROJECT_PRIORITY_LABELS,
  CLIENT_PROJECT_STAGE_LABELS,
} from "../../../services/clientProjects";

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

function statusClass(status) {
  if (status === "blocked") return "border-red-200 bg-red-50 text-red-700";
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "border-gray-200 bg-gray-50 text-gray-600";

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function priorityClass(priority) {
  if (priority === "critical") return "text-purple-700";
  if (priority === "high") return "text-red-600";
  if (priority === "medium") return "text-amber-600";

  return "text-gray-500";
}

function stageLabel(stage) {
  return CLIENT_PROJECT_STAGE_LABELS[stage] || stage || "Planning";
}

function priorityLabel(priority) {
  return CLIENT_PROJECT_PRIORITY_LABELS[priority] || priority || "Medium";
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-gray-100">
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${Math.min(Number(value || 0), 100)}%` }}
      />
    </div>
  );
}

export function ClientProjectsHeader({ onRefresh, onCreate }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Workspace <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Projects</span>
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">Projects</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage workspace projects, deliverables, tasks, and progress.
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
          New Project
        </button>
      </div>
    </div>
  );
}

export function ClientProjectsLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">
        Loading workspace projects...
      </p>
    </div>
  );
}

export function ClientProjectsErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />

        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load projects</h3>
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

export function ClientProjectsKPICards({ projects }) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const blocked = projects.filter((p) => p.status === "blocked").length;

  const overdue = projects.filter(
    (p) =>
      isPastDue(p.dueDate) && !["completed", "cancelled"].includes(p.status)
  ).length;

  const avgProgress = total
    ? Math.round(
        projects.reduce((sum, p) => sum + Number(p.progress || 0), 0) / total
      )
    : 0;

  const openTasks = projects.reduce(
    (sum, project) =>
      sum + (project.tasks || []).filter((task) => !task.done).length,
    0
  );

  const cards = [
    {
      label: "Total Projects",
      value: total,
      icon: FolderKanban,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      label: "Active",
      value: active,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: "At Risk",
      value: blocked + overdue,
      icon: AlertCircle,
      color: "text-red-600 bg-red-50 border-red-200",
    },
    {
      label: "Avg Progress",
      value: `${avgProgress}%`,
      icon: Target,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      label: "Open Tasks",
      value: openTasks,
      icon: ListChecks,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>

                <h3 className="mt-4 text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>

                <p className="mt-3 text-sm font-medium text-gray-500">
                  Workspace-safe project data
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}
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

export function ClientProjectsFilterToolbar({
  filters,
  onFilterChange,
  stages,
  priorities,
}) {
  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 py-4 xl:flex-row">
      <input
        className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500"
        placeholder="Search projects, service, package..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.stage}
        onChange={(e) => update("stage", e.target.value)}
      >
        <option value="all">All Stages</option>
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stageLabel(stage)}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.status}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="blocked">Blocked</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.priority}
        onChange={(e) => update("priority", e.target.value)}
      >
        <option value="all">All Priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priorityLabel(priority)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ClientProjectsList({ projects, onSelectProject }) {
  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <FolderKanban className="mx-auto h-10 w-10 text-gray-300" />

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No projects found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Create a workspace project to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {projects.map((project) => {
        const overdue =
          isPastDue(project.dueDate) &&
          !["completed", "cancelled"].includes(project.status);

        const openTasks = (project.tasks || []).filter((task) => !task.done).length;

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(project)}
            className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {project.name}
                </h3>

                <p className="mt-1 text-sm font-medium text-blue-600">
                  {project.serviceCategory || "No service category"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {project.servicePackage || "No package"}
                </p>
              </div>

              <span
                className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${statusClass(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <ProgressBar value={project.progress} />

              <span className="text-xs font-bold text-gray-600">
                {project.progress}%
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Stage</p>
                <p className="mt-1 font-semibold text-gray-700">
                  {stageLabel(project.stage)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Priority
                </p>
                <p
                  className={`mt-1 font-semibold ${priorityClass(
                    project.priority
                  )}`}
                >
                  {priorityLabel(project.priority)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400">
                  Open Tasks
                </p>
                <p className="mt-1 font-semibold text-gray-700">{openTasks}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Admin: {project.assignedAdmin || "Unassigned"}</span>

              <span className={overdue ? "font-bold text-red-600" : ""}>
                Due {formatDate(project.dueDate)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ClientProjectDetailDrawer({
  project,
  saving,
  onClose,
  onEdit,
  onAddTask,
  onEditTask,
  onArchiveTask,
  onArchive,
  onAddNote,
}) {
  const [tab, setTab] = useState("overview");
  const [note, setNote] = useState("");

  async function submitNote() {
    await onAddNote(project.id, note);
    setNote("");
    setTab("activity");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold uppercase text-blue-700">
                  {stageLabel(project.stage)}
                </span>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${statusClass(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>

              <p className="mt-1 text-sm text-blue-600">
                {project.serviceCategory || "No service category"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {project.servicePackage || "No package"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <ProgressBar value={project.progress} />

            <span className="text-sm font-bold text-gray-700">
              {project.progress}%
            </span>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {["overview", "tasks", "activity", "notes"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "border-b-2 border-blue-600 px-4 py-3 text-sm font-semibold capitalize text-blue-600"
                  : "px-4 py-3 text-sm font-medium capitalize text-gray-500 hover:text-gray-900"
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "overview" && (
            <div className="space-y-4 text-sm">
              <Info label="Project" value={project.name} />
              <Info label="Service Category" value={project.serviceCategory} />
              <Info label="Service Package" value={project.servicePackage} />
              <Info label="Stage" value={stageLabel(project.stage)} />
              <Info label="Status" value={project.status} />
              <Info label="Priority" value={priorityLabel(project.priority)} />
              <Info label="Assigned Admin" value={project.assignedAdmin} />
              <Info label="Start Date" value={formatDate(project.startDate)} />
              <Info label="Due Date" value={formatDate(project.dueDate)} />
              <Info label="Progress" value={`${project.progress}%`} />
              <Info label="Description" value={project.description} />
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddTask}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </div>

              {(project.tasks || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
                  No tasks yet.
                </div>
              ) : (
                project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={
                            task.done
                              ? "font-semibold text-gray-400 line-through"
                              : "font-semibold text-gray-900"
                          }
                        >
                          {task.title}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {task.description || "No description"}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          Due {formatDate(task.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={
                            task.done
                              ? "text-xs font-bold text-emerald-600"
                              : "text-xs font-bold text-gray-500"
                          }
                        >
                          {task.done ? "Done" : task.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onArchiveTask(task)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "activity" && (
            <div className="space-y-3">
              {(project.activities || []).length === 0 ? (
                <p className="text-center text-sm text-gray-400">
                  No activity yet.
                </p>
              ) : (
                project.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                        {activity.type}
                      </span>

                      <span className="text-xs text-gray-400">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {activity.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {activity.user}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <textarea
                className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                placeholder="Write a note or update for this project..."
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
            onClick={onAddTask}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            Add Task
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onArchive}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Archiving..." : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientProjectFormModal({
  mode,
  project,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceCategory: "",
    servicePackage: "",
    status: "active",
    stage: "planning",
    priority: "medium",
    progress: 0,
    startDate: "",
    dueDate: "",
  });

  useEffect(() => {
    if (mode === "edit" && project) {
      setForm({
        name: project.name || "",
        description: project.description || "",
        serviceCategory: project.serviceCategory || "",
        servicePackage: project.servicePackage || "",
        status: project.status || "active",
        stage: project.stage || "planning",
        priority: project.priority || "medium",
        progress: project.progress || 0,
        startDate: project.startDate || "",
        dueDate: project.dueDate || "",
      });
    }
  }, [mode, project]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Project name is required.");
      return;
    }

    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      serviceCategory: form.serviceCategory.trim(),
      servicePackage: form.servicePackage.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "edit" ? "Edit Project" : "New Project"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage projects inside this workspace only.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Input
            label="Project Name"
            value={form.name}
            onChange={(value) => update("name", value)}
          />

          <Input
            label="Service Category"
            value={form.serviceCategory}
            onChange={(value) => update("serviceCategory", value)}
          />

          <Input
            label="Service Package"
            value={form.servicePackage}
            onChange={(value) => update("servicePackage", value)}
          />

          <Select
            label="Stage"
            value={form.stage}
            onChange={(value) => update("stage", value)}
            options={[
              ["planning", "Planning"],
              ["kickoff", "Kickoff"],
              ["in_progress", "In Progress"],
              ["review", "Review"],
              ["blocked", "Blocked"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ]}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(value) => update("status", value)}
            options={[
              ["active", "Active"],
              ["blocked", "Blocked"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ]}
          />

          <Select
            label="Priority"
            value={form.priority}
            onChange={(value) => update("priority", value)}
            options={[
              ["low", "Low"],
              ["medium", "Medium"],
              ["high", "High"],
              ["critical", "Critical"],
            ]}
          />

          <Input
            type="number"
            label="Progress %"
            value={form.progress}
            onChange={(value) => update("progress", value)}
          />

          <Input
            type="date"
            label="Start Date"
            value={form.startDate}
            onChange={(value) => update("startDate", value)}
          />

          <Input
            type="date"
            label="Due Date"
            value={form.dueDate}
            onChange={(value) => update("dueDate", value)}
          />

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Description
            </label>

            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Project scope, requirements, notes, or context..."
            />
          </div>
        </div>

        <ModalFooter
          saving={saving}
          onClose={onClose}
          submitLabel={mode === "edit" ? "Save Changes" : "Create Project"}
        />
      </form>
    </div>
  );
}

export function ClientProjectTaskModal({
  mode,
  task,
  project,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    if (mode === "edit" && task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
      });
    }
  }, [mode, task]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Task title is required.");
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
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

            <p className="mt-1 text-sm text-gray-500">
              {project?.name || "Workspace project"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Task Title"
              value={form.title}
              onChange={(value) => update("title", value)}
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(value) => update("status", value)}
            options={[
              ["todo", "To Do"],
              ["in_progress", "In Progress"],
              ["review", "Review"],
              ["done", "Done"],
              ["blocked", "Blocked"],
            ]}
          />

          <Select
            label="Priority"
            value={form.priority}
            onChange={(value) => update("priority", value)}
            options={[
              ["low", "Low"],
              ["medium", "Medium"],
              ["high", "High"],
              ["critical", "Critical"],
            ]}
          />

          <Input
            type="date"
            label="Due Date"
            value={form.dueDate}
            onChange={(value) => update("dueDate", value)}
          />

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Description
            </label>

            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Task details, deliverable context, or notes..."
            />
          </div>
        </div>

        <ModalFooter
          saving={saving}
          onClose={onClose}
          submitLabel={mode === "edit" ? "Save Changes" : "Create Task"}
        />
      </form>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <input
        type={type}
        className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <select
        className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function ModalFooter({ saving, onClose, submitLabel }) {
  return (
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
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
