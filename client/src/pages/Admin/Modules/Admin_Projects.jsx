import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect, useCallback } from 'react';
import { db, supabase, utils } from '../../../config/supabaseClient';

const EMPTY_PROJECT_FORM = {
    customer_id: '',
    project_name: '',
    modules_included: '',
    assigned_member: '',
    sale_value: '',
    progress: 0,
    status: 'not_started',
    notes: ''
};

function Admin_Projects() {
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectError, setProjectError] = useState('');
    const [updatingProjectId, setUpdatingProjectId] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [savingProject, setSavingProject] = useState(false);
    const [newProject, setNewProject] = useState(EMPTY_PROJECT_FORM);

    const [projectFilters, setProjectFilters] = useState({
        status: 'all',
        search: ''
    });

    const loadProjects = useCallback(async () => {
        setLoadingProjects(true);
        setProjectError('');

        try {
            const { data, error } = await db.getProjects(projectFilters);
            if (error) throw error;
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading projects:', error);
            setProjectError(error.message || 'Failed to load projects.');
        } finally {
            setLoadingProjects(false);
        }
    }, [projectFilters]);

    const loadCustomers = useCallback(async () => {
        try {
            const { data, error } = await db.getCustomers({ limit: 200 });
            if (error) throw error;
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading customers for project form:', error);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    useEffect(() => {
        const projectSubscription = db.subscribeToProjects(() => {
            loadProjects();
        });

        return () => {
            supabase.removeChannel(projectSubscription);
        };
    }, [loadProjects]);

    const handleUpdateProject = async (projectId, updates) => {
        setUpdatingProjectId(projectId);
        try {
            const { error } = await db.updateProject(projectId, updates);
            if (error) throw error;
            await loadProjects();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project: ' + error.message);
        } finally {
            setUpdatingProjectId(null);
        }
    };

    const handleCreateProject = async () => {
        const customerId = newProject.customer_id;
        const projectName = newProject.project_name.trim();
        const modulesIncluded = newProject.modules_included.trim();
        const assignedMember = newProject.assigned_member.trim();
        const saleValue = Number(newProject.sale_value) || 0;
        const progress = Number(newProject.progress) || 0;
        const status = newProject.status || 'not_started';
        const notes = newProject.notes.trim();

        if (!customerId) {
            alert('Please select a contact.');
            return;
        }

        if (!projectName) {
            alert('Project name is required.');
            return;
        }

        setSavingProject(true);
        try {
            const payload = {
                customer_id: customerId,
                project_name: projectName,
                modules_included: modulesIncluded || null,
                assigned_member: assignedMember || null,
                sale_value: saleValue,
                progress,
                status,
                notes: notes || null
            };

            const { error } = await db.createProject(payload);
            if (error) throw error;

            setShowAddModal(false);
            setNewProject(EMPTY_PROJECT_FORM);
            await loadProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project: ' + error.message);
        } finally {
            setSavingProject(false);
        }
    };

    const getProjectStatusColor = (status) => {
        switch (status) {
            case 'not_started':
                return '#78909c';
            case 'in_progress':
                return '#42a5f5';
            case 'on_hold':
                return '#ffa726';
            case 'completed':
                return '#4caf50';
            default:
                return '#78909c';
        }
    };

    const totalProjectValue = projects.reduce((sum, p) => sum + (parseFloat(p.sale_value) || 0), 0);
    const notStartedCount = projects.filter((p) => p.status === 'not_started').length;
    const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;
    const onHoldCount = projects.filter((p) => p.status === 'on_hold').length;
    const completedCount = projects.filter((p) => p.status === 'completed').length;

    return (
        <Admin_Layout title="Projects">
            <div className="crm-header">
                <h1>Projects</h1>
                <p>Manage delivery execution, progress, and assigned members.</p>
            </div>

            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{projects.length}</div>
                        <div className="stat-label">Total Projects</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{notStartedCount}</div>
                        <div className="stat-label">Not Started</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{inProgressCount}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{onHoldCount}</div>
                        <div className="stat-label">On Hold</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{completedCount}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{utils.formatCurrency(totalProjectValue)}</div>
                        <div className="stat-label">Project Value</div>
                    </div>
                </div>
            </div>

            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectFilters.search}
                        onChange={(e) =>
                            setProjectFilters((prev) => ({ ...prev, search: e.target.value }))
                        }
                        className="search-input"
                    />
                    <select
                        value={projectFilters.status}
                        onChange={(e) =>
                            setProjectFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="action-buttons">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Project
                    </button>
                </div>
            </div>

            {projectError && (
                <div style={{ marginBottom: '16px', color: '#ff6b6b' }}>
                    {projectError}
                </div>
            )}

            <div className="customers-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Client</th>
                            <th>Modules</th>
                            <th>Assigned Member</th>
                            <th>Value</th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingProjects ? (
                            <tr>
                                <td colSpan="8">Loading projects...</td>
                            </tr>
                        ) : projects.length === 0 ? (
                            <tr>
                                <td colSpan="8">No projects found.</td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id}>
                                    <td>{project.project_name}</td>
                                    <td>{project.customers?.name || '-'}</td>
                                    <td>{project.modules_included || '-'}</td>
                                    <td>{project.assigned_member || '-'}</td>
                                    <td>{utils.formatCurrency(parseFloat(project.sale_value) || 0)}</td>
                                    <td style={{ minWidth: '160px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={project.progress || 0}
                                                onChange={(e) =>
                                                    handleUpdateProject(project.id, {
                                                        progress: Number(e.target.value)
                                                    })
                                                }
                                                disabled={updatingProjectId === project.id}
                                                style={{ flex: 1 }}
                                            />
                                            <span>{project.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            value={project.status || 'not_started'}
                                            onChange={(e) =>
                                                handleUpdateProject(project.id, {
                                                    status: e.target.value
                                                })
                                            }
                                            disabled={updatingProjectId === project.id}
                                            className="filter-select"
                                            style={{
                                                minWidth: '130px',
                                                backgroundColor: getProjectStatusColor(project.status),
                                                color: '#fff',
                                                border: 'none'
                                            }}
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>
                                    <td>{project.created_at ? utils.formatDate(project.created_at) : '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add Project</h2>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateProject();
                            }}
                        >
                            <div className="form-group">
                                <label>Contact / Client</label>
                                <select
                                    value={newProject.customer_id}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, customer_id: e.target.value }))
                                    }
                                    required
                                >
                                    <option value="">Select a contact</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                            {customer.company ? ` — ${customer.company}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.project_name}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, project_name: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Modules Included</label>
                                <input
                                    type="text"
                                    value={newProject.modules_included}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, modules_included: e.target.value }))
                                    }
                                    placeholder="CRM, ERP, Analytics"
                                />
                            </div>

                            <div className="form-group">
                                <label>Assigned Member</label>
                                <input
                                    type="text"
                                    value={newProject.assigned_member}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, assigned_member: e.target.value }))
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Sale Value</label>
                                <input
                                    type="number"
                                    value={newProject.sale_value}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, sale_value: e.target.value }))
                                    }
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Progress</label>
                                <input
                                    type="number"
                                    value={newProject.progress}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, progress: e.target.value }))
                                    }
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={newProject.status}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, status: e.target.value }))
                                    }
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={newProject.notes}
                                    onChange={(e) =>
                                        setNewProject((prev) => ({ ...prev, notes: e.target.value }))
                                    }
                                    rows="4"
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewProject(EMPTY_PROJECT_FORM);
                                    }}
                                    disabled={savingProject}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={savingProject}
                                >
                                    {savingProject ? 'Saving...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default Admin_Projects;
