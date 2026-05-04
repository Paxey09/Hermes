import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import pentagiService from '../../../services/pentagi';
import { db, supabase } from '../../../config/supabaseClient';

function AdminSecurity() {
    const [securityStatus, setSecurityStatus] = useState({
        overall: 'secure',
        vulnerabilities: 0,
        complianceScore: 95,
        lastAudit: '2024-04-05'
    });
    const [complianceStandards, setComplianceStandards] = useState([]);
    const [recentIncidents, setRecentIncidents] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showReportIncident, setShowReportIncident] = useState(false);
    const [newIncident, setNewIncident] = useState({
        type: '',
        severity: 'low',
        description: ''
    });

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        try {
            // Load compliance status
            const status = await pentagiService.getComplianceStatus();
            if (status) {
                setSecurityStatus(status);
                if (status.standards) {
                    setComplianceStandards(status.standards);
                }
            }

            // Load security logs from Supabase
            const { data: logs } = await db.getSecurityLogs({ limit: 10 });
            if (logs) {
                setSecurityLogs(logs);
            }

            // Load recent incidents (mock for now, could be stored in Supabase)
            setRecentIncidents([
                { id: 1, type: 'Unauthorized Access', severity: 'low', date: '2024-04-04', status: 'resolved' },
                { id: 2, type: 'API Rate Limit', severity: 'medium', date: '2024-04-02', status: 'resolved' }
            ]);
        } catch (error) {
            console.error('Error loading security data:', error);
            // Set default data
            setComplianceStandards([
                { name: 'PH-DPA', status: 'compliant', lastChecked: new Date().toISOString().split('T')[0] },
                { name: 'GDPR', status: 'compliant', lastChecked: new Date().toISOString().split('T')[0] },
                { name: 'ISO-27001', status: 'pending', lastChecked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
            ]);
        }
    };

    const runSecurityAudit = async () => {
        setLoading(true);
        try {
            const result = await pentagiService.runSecurityAudit('all');

            // Log the audit action
            const { data: { user } } = await supabase.auth.getUser();
            await db.logSecurityEvent('security_audit', user?.id, {
                module: 'all',
                result: result
            });

            alert('Security audit completed successfully!');
            loadSecurityData();
        } catch (error) {
            console.error('Error running security audit:', error);
            alert('Error running security audit: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkCompliance = async () => {
        setLoading(true);
        try {
            const result = await pentagiService.checkCompliance();

            // Log the compliance check action
            const { data: { user } } = await supabase.auth.getUser();
            await db.logSecurityEvent('compliance_check', user?.id, {
                result: result
            });

            alert('Compliance check completed successfully!');
            loadSecurityData();
        } catch (error) {
            console.error('Error checking compliance:', error);
            alert('Error checking compliance: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const reportIncident = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Log the incident
            await db.logSecurityEvent('security_incident', user?.id, {
                type: newIncident.type,
                severity: newIncident.severity,
                description: newIncident.description
            });

            // Add to recent incidents
            setRecentIncidents([
                {
                    id: Date.now(),
                    type: newIncident.type,
                    severity: newIncident.severity,
                    date: new Date().toISOString().split('T')[0],
                    status: 'reported'
                },
                ...recentIncidents
            ]);

            setShowReportIncident(false);
            setNewIncident({ type: '', severity: 'low', description: '' });
            alert('Security incident reported successfully!');
        } catch (error) {
            console.error('Error reporting incident:', error);
            alert('Failed to report incident: ' + error.message);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return '#4caf50';
            case 'medium': return '#ffa726';
            case 'high': return '#ff6b6b';
            case 'critical': return '#d32f2f';
            default: return '#9e9e9e';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'compliant': return '#4caf50';
            case 'pending': return '#ffa726';
            case 'non-compliant': return '#ff6b6b';
            default: return '#9e9e9e';
        }
    };

    return (
        <Admin_Layout title="Security & Compliance">
            <div className="security-header">
                <h1>PentAgi Security & Compliance</h1>
                <p>Monitor security audits and compliance status</p>
            </div>

            {/* Security Overview */}
            <div className="security-overview">
                <div className="overview-card">
                    <div className="overview-icon" style={{ color: '#4caf50' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    </div>
                    <div className="overview-content">
                        <div className="overview-label">Overall Status</div>
                        <div className="overview-value" style={{ color: '#4caf50' }}>
                            {securityStatus.overall}
                        </div>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon" style={{ color: '#ff6b6b' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div className="overview-content">
                        <div className="overview-label">Vulnerabilities</div>
                        <div className="overview-value">{securityStatus.vulnerabilities}</div>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon" style={{ color: '#2196f3' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="overview-content">
                        <div className="overview-label">Compliance Score</div>
                        <div className="overview-value">{securityStatus.complianceScore}%</div>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon" style={{ color: '#9c27b0' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div className="overview-content">
                        <div className="overview-label">Last Audit</div>
                        <div className="overview-value">{securityStatus.lastAudit}</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="security-actions">
                <button
                    className="btn-primary"
                    onClick={runSecurityAudit}
                    disabled={loading}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Run Security Audit
                </button>
                <button
                    className="btn-secondary"
                    onClick={checkCompliance}
                    disabled={loading}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Check Compliance
                </button>
                <button
                    className="btn-secondary"
                    onClick={() => setShowReportIncident(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    Report Incident
                </button>
            </div>

            {/* Compliance Standards */}
            <div className="compliance-section">
                <h2>Compliance Standards</h2>
                <div className="compliance-list">
                    {complianceStandards.map((standard, index) => (
                        <div key={index} className="compliance-item">
                            <div className="compliance-info">
                                <div className="compliance-name">{standard.name}</div>
                                <div className="compliance-date">Last checked: {standard.lastChecked}</div>
                            </div>
                            <span
                                className="compliance-badge"
                                style={{ backgroundColor: getStatusColor(standard.status) }}
                            >
                                {standard.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Incidents */}
            <div className="incidents-section">
                <h2>Recent Security Incidents</h2>
                <div className="incidents-list">
                    {recentIncidents.map((incident) => (
                        <div key={incident.id} className="incident-item">
                            <div className="incident-icon" style={{ color: getSeverityColor(incident.severity) }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                            </div>
                            <div className="incident-info">
                                <div className="incident-type">{incident.type}</div>
                                <div className="incident-meta">
                                    <span className="incident-severity" style={{ color: getSeverityColor(incident.severity) }}>
                                        {incident.severity}
                                    </span>
                                    <span className="incident-date">{incident.date}</span>
                                </div>
                            </div>
                            <span className="incident-status">{incident.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security Logs */}
            <div className="security-logs-section">
                <h2>Security Audit Logs</h2>
                <div className="logs-list">
                    {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                            <div key={log.id} className="log-item">
                                <div className="log-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div className="log-info">
                                    <div className="log-action">{log.action}</div>
                                    <div className="log-meta">
                                        <span>{new Date(log.created_at).toLocaleString()}</span>
                                        {log.profiles && <span>by {log.profiles.full_name || 'System'}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="logs-placeholder">
                            <p>No security logs available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Incident Modal */}
            {showReportIncident && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Report Security Incident</h2>
                        <form onSubmit={(e) => { e.preventDefault(); reportIncident(); }}>
                            <div className="form-group">
                                <label>Incident Type</label>
                                <input
                                    type="text"
                                    value={newIncident.type}
                                    onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                                    required
                                    placeholder="e.g., Unauthorized Access, Data Breach"
                                />
                            </div>
                            <div className="form-group">
                                <label>Severity</label>
                                <select
                                    value={newIncident.severity}
                                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newIncident.description}
                                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                                    rows="4"
                                    required
                                    placeholder="Describe the incident in detail..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowReportIncident(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Report Incident</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default AdminSecurity;
