import { useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  List,
  Plus,
  RefreshCw,
  Target,
  X,
} from "lucide-react";

import { PROJECT_STAGE_COLORS } from "../../../services/projects";

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
  if (priority === "Critical") return "text-purple-700";
  if (priority === "High") return "text-red-600";
  if (priority === "Medium") return "text-amber-600";
  return "text-gray-500";
}

function Avatar({ name, size = "h-8 w-8" }) {
  const initials = String(name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white`}
    >
      {initials}
    </div>
  );
}

function ProgressBar({ value, color = "#4a90d9" }) {
  return (
    <div className="h-1.5 flex-1 rounded-full bg-gray-100">
      <div
        className="h-1.5 rounded-full"
        style={{
          width: `${Math.min(Number(value || 0), 100)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

export function ProjectsHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Modules <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Projects</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Projects</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track ExponifyPH service delivery, deliverables, milestones, and
          client work.
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
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>
    </div>
  );
}

export function ProjectsLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">
        Loading projects...
      </p>
    </div>
  );
}

export function ProjectsErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">
            Failed to load projects
          </h3>
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

export function ProjectsKPICards({ projects }) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const blocked = projects.filter((p) => p.status === "blocked").length;
  const overdue = projects.filter(
    (p) => isPastDue(p.dueDate) && !["completed", "cancelled"].includes(p.status)
  ).length;
  const avgProgress = total
    ? Math.round(
        projects.reduce((sum, p) => sum + Number(p.progress || 0), 0) / total
      )
    : 0;

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
      label: "Service Types",
      value: new Set(projects.map((p) => p.serviceCategory)).size,
      icon: Layers,
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
                  Live service delivery data
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

export function ProjectsViewTabs({ activeView, onViewChange }) {
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

export function ProjectsFilterToolbar({
  filters,
  onFilterChange,
  stages,
  members,
  priorities,
  serviceCategories,
}) {
  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 py-4 xl:flex-row">
      <input
        className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500"
        placeholder="Search projects, customer, service..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.serviceCategory}
        onChange={(e) => update("serviceCategory", e.target.value)}
      >
        <option value="all">All Services</option>
        {serviceCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.stage}
        onChange={(e) => update("stage", e.target.value)}
      >
        <option value="all">All Stages</option>
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
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
        value={filters.manager}
        onChange={(e) => update("manager", e.target.value)}
      >
        <option value="all">All Managers</option>
        {members.map((member) => (
          <option key={member} value={member}>
            {member}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.priority}
        onChange={(e) => update("priority", e.target.value)}
      >
        <option value="all">All Priorities</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  const color = PROJECT_STAGE_COLORS[project.stage] || "#4a90d9";
  const overdue =
    isPastDue(project.dueDate) &&
    !["completed", "cancelled"].includes(project.status);

  const completedDeliverables =
    project.deliverables?.filter((item) => item.done).length || 0;

  const deliverableCount = project.deliverables?.length || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-gray-900">{project.name}</h4>
          <p className="mt-1 text-sm font-medium text-blue-600">
            {project.customer}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Origin: {project.linkedDeal}
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

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
          {project.serviceCategory}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <ProgressBar
          value={project.progress}
          color={project.status === "blocked" ? "#e74c3c" : color}
        />
        <span className="text-xs font-bold text-gray-600">
          {project.progress}%
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Deliverables:{" "}
        <span className="font-semibold text-gray-700">
          {completedDeliverables}/{deliverableCount} done
        </span>
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-2">
          <Avatar name={project.manager} size="h-6 w-6" />
          {project.manager}
        </span>
        <span className={overdue ? "font-bold text-red-600" : ""}>
          Due {formatDate(project.dueDate)}
        </span>
      </div>
    </button>
  );
}

export function ProjectsKanbanBoard({ stages, projects, onCardClick }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageProjects = projects.filter((p) => p.stage === stage);
        const color = PROJECT_STAGE_COLORS[stage] || "#4a90d9";

        return (
          <div
            key={stage}
            className="min-h-[420px] w-[280px] shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  {stage}
                </h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {stageProjects.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {stageProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400">
                  No projects
                </div>
              ) : (
                stageProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onCardClick(project)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectsListView({ projects, onRowClick }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <FolderKanban className="mx-auto h-10 w-10 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No projects found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Add a service delivery project to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Package</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Manager</th>
            <th className="px-4 py-3">Due Date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {projects.map((project) => (
            <tr
              key={project.id}
              onClick={() => onRowClick(project)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-semibold text-gray-900">
                {project.name}
              </td>
              <td className="px-4 py-3 text-blue-600">{project.customer}</td>
              <td className="px-4 py-3 text-gray-600">
                {project.serviceCategory}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {project.servicePackage}
              </td>
              <td className="px-4 py-3 text-gray-600">{project.stage}</td>
              <td
                className={`px-4 py-3 font-semibold ${priorityClass(
                  project.priority
                )}`}
              >
                {project.priority}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar value={project.progress} />
                  <span className="text-xs text-gray-500">
                    {project.progress}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{project.manager}</td>
              <td className="px-4 py-3 text-gray-600">
                {formatDate(project.dueDate)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${statusClass(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </td>
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
        <div
          key={activity.id}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-blue-600">
              {activity.type}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(activity.date)}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.note}</p>
          <p className="mt-2 text-xs text-gray-400">{activity.user}</p>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailDrawer({ project, stages, onClose }) {
  const [tab, setTab] = useState("overview");
  const completedMilestones = project.milestones.filter((m) => m.done).length;
  const completedDeliverables =
    project.deliverables?.filter((item) => item.done).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-bold uppercase text-purple-700">
                  {project.serviceCategory}
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
              <p className="mt-1 text-sm text-blue-600">{project.customer}</p>
              <p className="mt-1 text-xs text-gray-400">
                Origin deal: {project.linkedDeal}
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

          <div className="mt-4 flex flex-wrap gap-2">
            {stages.map((stage) => (
              <span
                key={stage}
                className="rounded-lg border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor:
                    project.stage === stage ? PROJECT_STAGE_COLORS[stage] : "#e5e7eb",
                  color:
                    project.stage === stage ? PROJECT_STAGE_COLORS[stage] : "#9ca3af",
                  background:
                    project.stage === stage
                      ? `${PROJECT_STAGE_COLORS[stage]}15`
                      : "transparent",
                }}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {["overview", "deliverables", "milestones", "activity", "notes"].map(
            (item) => (
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
            )
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "overview" && (
            <div className="space-y-4 text-sm">
              <Info label="Contact" value={project.contact} />
              <Info label="Service Category" value={project.serviceCategory} />
              <Info label="Service Package" value={project.servicePackage} />
              <Info label="Stage" value={project.stage} />
              <Info label="Priority" value={project.priority} />
              <Info label="Manager" value={project.manager} />
              <Info label="Start Date" value={formatDate(project.startDate)} />
              <Info label="Due Date" value={formatDate(project.dueDate)} />
              <Info label="Progress" value={`${project.progress}%`} />
              <Info label="Description" value={project.description} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Team
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.team.map((member) => (
                    <span
                      key={member}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      <Avatar name={member} size="h-5 w-5" />
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "deliverables" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {completedDeliverables}/{project.deliverables.length} deliverables completed
              </p>

              {project.deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={
                        deliverable.done
                          ? "font-semibold text-gray-400 line-through"
                          : "font-semibold text-gray-900"
                      }
                    >
                      {deliverable.title}
                    </p>
                    <span
                      className={
                        deliverable.done
                          ? "text-xs font-bold text-emerald-600"
                          : "text-xs font-bold text-gray-500"
                      }
                    >
                      {deliverable.done ? "Done" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Due {formatDate(deliverable.dueDate)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "milestones" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {completedMilestones}/{project.milestones.length} milestones completed
              </p>

              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={
                        milestone.done
                          ? "font-semibold text-gray-400 line-through"
                          : "font-semibold text-gray-900"
                      }
                    >
                      {milestone.name}
                    </p>
                    <span
                      className={
                        milestone.done
                          ? "text-xs font-bold text-emerald-600"
                          : "text-xs font-bold text-gray-500"
                      }
                    >
                      {milestone.done ? "Done" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Due {formatDate(milestone.dueDate)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "activity" && <ActivityTimeline activities={project.activities} />}

          {tab === "notes" && (
            <textarea
              className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
              placeholder="Write a note about this project..."
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
            Edit
          </button>
          <button className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Add Task
          </button>
          <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            Archive
          </button>
        </div>
      </div>
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
