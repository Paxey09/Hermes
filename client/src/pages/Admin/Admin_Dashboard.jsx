import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import '../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import openClaudeService from '../../services/openClaude';
import openfangService from '../../services/openfang';
import pentagiService from '../../services/pentagi';
import { db } from '../../config/supabaseClient';
import { supabase } from '../../config/supabaseClient';

function Admin_Dashboard() {
    const [systemStatus, setSystemStatus] = useState({
        openClaude: 'checking',
        openfang: 'checking',
        pentagi: 'checking'
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalCustomers: 0,
        totalDocuments: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load real stats from Supabase
            const [profiles, customers, documents] = await Promise.all([
                db.getAllProfiles(),
                db.getCustomers(),
                db.getDocuments()
            ]);

            const totalUsers = profiles.data?.length || 0;
            const activeUsers = profiles.data?.filter(p => p.role === 'Admin' || p.role === 'Client')?.length || 0;
            const totalCustomers = customers.data?.length || 0;
            const totalDocuments = documents.data?.length || 0;
            const totalRevenue = customers.data?.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0) || 0;

            setStats({
                totalUsers,
                activeUsers,
                totalCustomers,
                totalDocuments,
                totalRevenue
            });

            // Check system health
            await checkSystemHealth();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkSystemHealth = async () => {
        const health = {
            openClaude: 'active',
            openfang: 'active',
            pentagi: 'active'
        };

        try {
            // Test OpenClaude
            await openClaudeService.chatCompletion(
                [{ role: 'user', content: 'test' }],
                'claude-3-haiku-20240307',
                { maxTokens: 10 }
            );
            health.openClaude = 'active';
        } catch (error) {
            console.error('OpenClaude health check failed:', error);
            health.openClaude = 'inactive';
        }

        try {
            const openfangHealth = await openfangService.healthCheck();
            health.openfang = openfangHealth.status === 'healthy' ? 'active' : 'inactive';
        } catch (error) {
            console.error('Openfang health check failed:', error);
            health.openfang = 'inactive';
        }

        try {
            const pentagiHealth = await pentagiService.healthCheck();
            health.pentagi = pentagiHealth.status === 'healthy' ? 'active' : 'inactive';
        } catch (error) {
            console.error('PentAgi health check failed:', error);
            health.pentagi = 'inactive';
        }

        setSystemStatus(health);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const modules = [
        {
            id: 1,
            title: 'Hermes Chatbot',
            description: 'Manage AI-powered chatbot configurations and responses',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            ),
            link: '/AdminHermesChatbot',
            color: '#c9a84c',
            layer: 'Intelligence',
            status: systemStatus.openClaude
        },
        {
            id: 2,
            title: 'CRM Workflows',
            description: `Customer relationship management with AI-powered insights (${stats.totalCustomers} customers)`,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            ),
            link: '/AdminCRM',
            color: '#4caf50',
            layer: 'Intelligence',
            status: systemStatus.openClaude
        },
        {
            id: 3,
            title: 'ERP Documentation',
            description: `Enterprise resource planning documentation and workflows (${stats.totalDocuments} documents)`,
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            ),
            link: '/AdminERP',
            color: '#2196f3',
            layer: 'Intelligence',
            status: systemStatus.openClaude
        },
        {
            id: 4,
            title: 'Analytics & Reports',
            description: 'Business intelligence, analytics, and market research',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            link: '/AdminAnalytics',
            color: '#9c27b0',
            layer: 'Intelligence',
            status: systemStatus.openClaude
        },
        {
            id: 5,
            title: 'Infrastructure',
            description: 'Openfang inference engine and resource management',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
            ),
            link: '/AdminInfrastructure',
            color: '#ff9800',
            layer: 'Infrastructure',
            status: systemStatus.openfang
        },
        {
            id: 6,
            title: 'Security & Compliance',
            description: 'PentAgi security audits and compliance monitoring',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            ),
            link: '/AdminSecurity',
            color: '#ff6b6b',
            layer: 'Security',
            status: systemStatus.pentagi
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#4caf50';
            case 'inactive': return '#ff6b6b';
            case 'checking': return '#ffa726';
            default: return '#9e9e9e';
        }
    };

    if (loading) {
        return (
            <Admin_Layout title="Dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </Admin_Layout>
        );
    }

    return (
        <Admin_Layout title="Dashboard">
            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ color: '#4caf50' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div className="quick-stat-content">
                        <div className="quick-stat-value">{stats.totalUsers}</div>
                        <div className="quick-stat-label">Total Users</div>
                    </div>
                </div>
                <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ color: '#2196f3' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className="quick-stat-content">
                        <div className="quick-stat-value">{stats.totalCustomers}</div>
                        <div className="quick-stat-label">Customers</div>
                    </div>
                </div>
                <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ color: '#9c27b0' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <div className="quick-stat-content">
                        <div className="quick-stat-value">{stats.totalDocuments}</div>
                        <div className="quick-stat-label">Documents</div>
                    </div>
                </div>
                <div className="quick-stat-card">
                    <div className="quick-stat-icon" style={{ color: '#ff9800' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <div className="quick-stat-content">
                        <div className="quick-stat-value">${stats.totalRevenue.toLocaleString()}</div>
                        <div className="quick-stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="system-status-banner">
                <div className="status-header">
                    <h2>System Status</h2>
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
                <div className="status-indicators">
                    <div className="status-item">
                        <span className="status-label">OpenClaude (Intelligence)</span>
                        <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.openClaude) }}></span>
                        <span className="status-text">{systemStatus.openClaude}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Openfang (Infrastructure)</span>
                        <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.openfang) }}></span>
                        <span className="status-text">{systemStatus.openfang}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">PentAgi (Security)</span>
                        <span className="status-dot" style={{ backgroundColor: getStatusColor(systemStatus.pentagi) }}></span>
                        <span className="status-text">{systemStatus.pentagi}</span>
                    </div>
                </div>
            </div>

            {/* Welcome Section */}
            <div className="dashboard-welcome">
                <h1>Welcome to the Admin Dashboard</h1>
                <p>Select a module below to manage your system</p>
            </div>

            {/* Module Cards */}
            <div className="dashboard-modules">
                {modules.map((module) => (
                    <a
                        key={module.id}
                        href={module.link}
                        className="module-card"
                        style={{ '--module-color': module.color }}
                    >
                        <div className="module-icon">
                            {module.icon}
                        </div>
                        <div className="module-content">
                            <div className="module-header">
                                <h3 className="module-title">{module.title}</h3>
                                <span className="module-layer">{module.layer}</span>
                            </div>
                            <p className="module-description">{module.description}</p>
                            <div className="module-status">
                                <span className="status-indicator" style={{ backgroundColor: getStatusColor(module.status) }}></span>
                                <span className="status-label-small">{module.status}</span>
                            </div>
                        </div>
                        <div className="module-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </a>
                ))}
            </div>
        </Admin_Layout>
    );
}

export default Admin_Dashboard;
