import { useEffect, useMemo, useState } from "react";

import {
  ProjectsHeader,
  ProjectsKPICards,
  ProjectsViewTabs,
  ProjectsFilterToolbar,
  ProjectsKanbanBoard,
  ProjectsListView,
  ProjectDetailDrawer,
  ProjectsLoadingState,
  ProjectsErrorState,
} from "../../components/admin/layout/Admin_Projects_Components.jsx";

import { getProjectsData } from "../../services/projects";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [members, setMembers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);

  const [activeView, setActiveView] = useState("kanban");
  const [selectedProject, setSelectedProject] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    stage: "all",
    status: "all",
    manager: "all",
    priority: "all",
    serviceCategory: "all",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjectsData();

      setProjects(data.projects || []);
      setStages(data.stages || []);
      setMembers(data.members || []);
      setPriorities(data.priorities || []);
      setServiceCategories(data.serviceCategories || []);
    } catch (err) {
      console.error("Projects load error:", err);
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const search = filters.search.trim().toLowerCase();

      const matchesSearch =
        !search ||
        project.name.toLowerCase().includes(search) ||
        project.customer.toLowerCase().includes(search) ||
        project.contact.toLowerCase().includes(search) ||
        project.linkedDeal.toLowerCase().includes(search) ||
        project.serviceCategory.toLowerCase().includes(search) ||
        project.servicePackage.toLowerCase().includes(search);

      return (
        matchesSearch &&
        (filters.stage === "all" || project.stage === filters.stage) &&
        (filters.status === "all" || project.status === filters.status) &&
        (filters.manager === "all" || project.manager === filters.manager) &&
        (filters.priority === "all" || project.priority === filters.priority) &&
        (filters.serviceCategory === "all" ||
          project.serviceCategory === filters.serviceCategory)
      );
    });
  }, [projects, filters]);

  return (
    <div className="space-y-6">
      <ProjectsHeader onRefresh={loadProjects} />

      {loading && <ProjectsLoadingState />}

      {!loading && error && (
        <ProjectsErrorState message={error} onRetry={loadProjects} />
      )}

      {!loading && !error && (
        <>
          <ProjectsKPICards projects={projects} />

          <div className="space-y-4">
            <ProjectsViewTabs
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <ProjectsFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              stages={stages}
              members={members}
              priorities={priorities}
              serviceCategories={serviceCategories}
            />

            {activeView === "kanban" && (
              <ProjectsKanbanBoard
                stages={stages}
                projects={filteredProjects}
                onCardClick={setSelectedProject}
              />
            )}

            {activeView === "list" && (
              <ProjectsListView
                projects={filteredProjects}
                onRowClick={setSelectedProject}
              />
            )}
          </div>
        </>
      )}

      {selectedProject && (
        <ProjectDetailDrawer
          project={selectedProject}
          stages={stages}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
