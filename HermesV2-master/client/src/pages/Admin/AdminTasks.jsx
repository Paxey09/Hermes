import { useEffect, useMemo, useState } from "react";

import {
  TasksHeader,
  TasksKPICards,
  TasksViewTabs,
  TasksFilterToolbar,
  TasksKanbanBoard,
  TasksListView,
  TaskDetailDrawer,
  TasksLoadingState,
  TasksErrorState,
} from "../../components/admin/layout/Admin_Tasks_Components.jsx";

import { getTasksData } from "../../services/tasks";

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [priorities, setPriorities] = useState([]);

  const [activeView, setActiveView] = useState("list");
  const [selectedTask, setSelectedTask] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    assignee: "all",
    project: "all",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const data = await getTasksData();

      setTasks(data.tasks || []);
      setStatuses(data.statuses || []);
      setAssignees(data.assignees || []);
      setPriorities(data.priorities || []);
    } catch (err) {
      console.error("Tasks load error:", err);
      setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  const projectNames = useMemo(() => {
    return [...new Set(tasks.map((task) => task.project).filter(Boolean))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const search = filters.search.trim().toLowerCase();

      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.project.toLowerCase().includes(search) ||
        task.assignee.toLowerCase().includes(search) ||
        (task.notes || "").toLowerCase().includes(search);

      return (
        matchesSearch &&
        (filters.status === "all" || task.status === filters.status) &&
        (filters.priority === "all" || task.priority === filters.priority) &&
        (filters.assignee === "all" || task.assignee === filters.assignee) &&
        (filters.project === "all" || task.project === filters.project)
      );
    });
  }, [tasks, filters]);

  return (
    <div className="space-y-6">
      <TasksHeader onRefresh={loadTasks} />

      {loading && <TasksLoadingState />}

      {!loading && error && <TasksErrorState message={error} onRetry={loadTasks} />}

      {!loading && !error && (
        <>
          <TasksKPICards tasks={tasks} />

          <div className="space-y-4">
            <TasksViewTabs activeView={activeView} onViewChange={setActiveView} />

            <TasksFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              statuses={statuses}
              priorities={priorities}
              assignees={assignees}
              projects={projectNames}
            />

            {activeView === "kanban" && (
              <TasksKanbanBoard
                statuses={statuses}
                tasks={filteredTasks}
                onCardClick={setSelectedTask}
              />
            )}

            {activeView === "list" && (
              <TasksListView tasks={filteredTasks} onRowClick={setSelectedTask} />
            )}
          </div>
        </>
      )}

      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
