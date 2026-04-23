import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import openfangService from '../../../services/openfang';

function AdminInfrastructure() {
    const [models, setModels] = useState([]);
    const [infrastructureStatus, setInfrastructureStatus] = useState({
        status: 'healthy',
        uptime: '99.9%',
        requests: '1.2M',
        errors: '0.01%'
    });
    const [resourceMetrics, setResourceMetrics] = useState({
        cpu: 65,
        memory: 48,
        network: 32,
        disk: 55
    });
    const [loading, setLoading] = useState(false);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [newModel, setNewModel] = useState({
        name: '',
        instances: 1,
        type: 'claude-3-sonnet-20240229'
    });

    useEffect(() => {
        loadInfrastructureData();
        const interval = setInterval(loadInfrastructureData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const loadInfrastructureData = async () => {
        try {
            // Load models
            const modelsData = await openfangService.listModels();
            if (modelsData.models) {
                setModels(modelsData.models);
            }

            // Load infrastructure status
            const status = await openfangService.getInfrastructureStatus();
            if (status) {
                setInfrastructureStatus(status);
            }

            // Load resource metrics
            const metrics = await openfangService.getResourceMetrics('24h');
            if (metrics.metrics) {
                setResourceMetrics({
                    cpu: metrics.metrics.cpu?.average || 65,
                    memory: metrics.metrics.memory?.average || 48,
                    network: metrics.metrics.network?.average || 32,
                    disk: metrics.metrics.disk?.average || 55
                });
            }
        } catch (error) {
            console.error('Error loading infrastructure data:', error);
            // Set default data on error
            setModels([
                { id: 1, name: 'claude-3-sonnet-20240229', status: 'active', instances: 3, cpu: '45%', memory: '2.1GB' },
                { id: 2, name: 'claude-3-opus-20240229', status: 'active', instances: 2, cpu: '78%', memory: '4.5GB' },
                { id: 3, name: 'claude-3-haiku-20240307', status: 'idle', instances: 1, cpu: '5%', memory: '0.8GB' }
            ]);
        }
    };

    const deployModel = async () => {
        setLoading(true);
        try {
            const result = await openfangService.deployModel({
                name: newModel.name,
                type: newModel.type,
                instances: newModel.instances
            });

            if (result) {
                setModels([...models, {
                    id: result.id,
                    name: newModel.name,
                    status: 'deploying',
                    instances: newModel.instances,
                    cpu: '0%',
                    memory: '0GB'
                }]);
                setShowDeployModal(false);
                setNewModel({ name: '', instances: 1, type: 'claude-3-sonnet-20240229' });
                alert('Model deployment initiated successfully!');
            }
        } catch (error) {
            console.error('Error deploying model:', error);
            alert('Failed to deploy model: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const scaleModel = async (modelId, action) => {
        setLoading(true);
        try {
            const model = models.find(m => m.id === modelId);
            await openfangService.scaleResources({
                modelId,
                action,
                currentInstances: model.instances
            });

            // Update local state
            setModels(models.map(m =>
                m.id === modelId
                    ? { ...m, instances: action === 'up' ? m.instances + 1 : Math.max(1, m.instances - 1) }
                    : m
            ));
        } catch (error) {
            console.error('Error scaling model:', error);
            alert('Failed to scale model: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteModel = async (modelId) => {
        if (!confirm('Are you sure you want to delete this model?')) return;

        setLoading(true);
        try {
            await openfangService.deleteModel(modelId);
            setModels(models.filter(m => m.id !== modelId));
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#4caf50';
            case 'idle': return '#ffa726';
            case 'deploying': return '#2196f3';
            case 'error': return '#ff6b6b';
            default: return '#9e9e9e';
        }
    };

    const getUsageColor = (usage) => {
        const value = parseInt(usage);
        if (value > 80) return '#ff6b6b';
        if (value > 60) return '#ffa726';
        return '#4caf50';
    };

    return (
        <Admin_Layout title="Infrastructure Management">
            <div className="infrastructure-header">
                <h1>Openfang Infrastructure</h1>
                <p>Manage model deployments and infrastructure resources</p>
            </div>

            {/* Infrastructure Status */}
            <div className="infrastructure-status">
                <div className="status-card">
                    <div className="status-label">System Status</div>
                    <div className="status-value" style={{ color: getStatusColor(infrastructureStatus.status) }}>
                        {infrastructureStatus.status}
                    </div>
                </div>
                <div className="status-card">
                    <div className="status-label">Uptime</div>
                    <div className="status-value">{infrastructureStatus.uptime}</div>
                </div>
                <div className="status-card">
                    <div className="status-label">Total Requests</div>
                    <div className="status-value">{infrastructureStatus.requests}</div>
                </div>
                <div className="status-card">
                    <div className="status-label">Error Rate</div>
                    <div className="status-value">{infrastructureStatus.errors}</div>
                </div>
            </div>

            {/* Models Table */}
            <div className="models-table-container">
                <div className="table-header">
                    <h2>Deployed Models</h2>
                    <button className="btn-primary" onClick={() => setShowDeployModal(true)}>
                        + Deploy New Model
                    </button>
                </div>
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Model Name</th>
                            <th>Status</th>
                            <th>Instances</th>
                            <th>CPU Usage</th>
                            <th>Memory</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((model) => (
                            <tr key={model.id}>
                                <td>
                                    <div className="model-name">
                                        <span className="model-id">{model.id}</span>
                                        {model.name}
                                    </div>
                                </td>
                                <td>
                                    <span className="status-badge" style={{
                                        backgroundColor: getStatusColor(model.status)
                                    }}>
                                        {model.status}
                                    </span>
                                </td>
                                <td>{model.instances}</td>
                                <td>
                                    <div className="usage-bar">
                                        <div
                                            className="usage-fill"
                                            style={{
                                                width: model.cpu,
                                                backgroundColor: getUsageColor(model.cpu)
                                            }}
                                        ></div>
                                        <span>{model.cpu}</span>
                                    </div>
                                </td>
                                <td>{model.memory}</td>
                                <td>
                                    <div className="model-actions">
                                        <button
                                            className="action-btn"
                                            onClick={() => scaleModel(model.id, 'up')}
                                            disabled={loading}
                                            title="Scale Up"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => scaleModel(model.id, 'down')}
                                            disabled={loading || model.instances <= 1}
                                            title="Scale Down"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => deleteModel(model.id)}
                                            disabled={loading}
                                            title="Delete"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Resource Metrics */}
            <div className="resource-metrics">
                <h2>Resource Metrics</h2>
                <div className="metrics-grid">
                    <div className="metric-item">
                        <div className="metric-title">CPU Utilization</div>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${resourceMetrics.cpu}%` }}></div>
                        </div>
                        <div className="metric-value">{resourceMetrics.cpu}%</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-title">Memory Usage</div>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${resourceMetrics.memory}%` }}></div>
                        </div>
                        <div className="metric-value">{resourceMetrics.memory}%</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-title">Network I/O</div>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${resourceMetrics.network}%` }}></div>
                        </div>
                        <div className="metric-value">{resourceMetrics.network}%</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-title">Disk Usage</div>
                        <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${resourceMetrics.disk}%` }}></div>
                        </div>
                        <div className="metric-value">{resourceMetrics.disk}%</div>
                    </div>
                </div>
            </div>

            {/* Deploy Model Modal */}
            {showDeployModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Deploy New Model</h2>
                        <form onSubmit={(e) => { e.preventDefault(); deployModel(); }}>
                            <div className="form-group">
                                <label>Model Name</label>
                                <input
                                    type="text"
                                    value={newModel.name}
                                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Model Type</label>
                                <select
                                    value={newModel.type}
                                    onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                                >
                                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Initial Instances</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newModel.instances}
                                    onChange={(e) => setNewModel({ ...newModel, instances: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowDeployModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Deploying...' : 'Deploy Model'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default AdminInfrastructure;
