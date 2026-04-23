import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import openClaudeService from '../../../services/openClaude';
import { db, supabase } from '../../../config/supabaseClient';

function AdminCRM() {
    const [customers, setCustomers] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        status: 'active',
        value: 0,
        notes: ''
    });
    const [filters, setFilters] = useState({
        status: 'all',
        search: ''
    });

    useEffect(() => {
        loadCustomers();

        // Subscribe to real-time changes
        const subscription = db.subscribeToCustomers((payload) => {
            console.log('Customer change received!', payload);
            loadCustomers();
        });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const { data, error } = await db.getCustomers(filters);
            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await db.createCustomer({
                ...newCustomer,
                created_by: user?.id
            });

            if (error) throw error;

            setCustomers([...customers, data]);
            setShowAddModal(false);
            setNewCustomer({ name: '', email: '', status: 'active', value: 0, notes: '' });
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer: ' + error.message);
        }
    };

    const handleUpdateCustomer = async () => {
        try {
            const { data, error } = await db.updateCustomer(selectedCustomer.id, selectedCustomer);

            if (error) throw error;

            setCustomers(customers.map(c => c.id === selectedCustomer.id ? data : c));
            setShowEditModal(false);
            setSelectedCustomer(null);
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer: ' + error.message);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            const { error } = await db.deleteCustomer(id);
            if (error) throw error;
            setCustomers(customers.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer: ' + error.message);
        }
    };

    const generateInsights = async (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        setLoading(true);
        try {
            const result = await openClaudeService.chatCompletion([
                {
                    role: 'user',
                    content: `Analyze this customer data and provide insights:\n${JSON.stringify(customer)}\n\nProvide:\n1. Customer sentiment analysis\n2. Recommended actions\n3. Risk assessment\n4. Opportunity identification`
                }
            ]);

            setInsights(result);
        } catch (error) {
            console.error('Error generating insights:', error);
            alert('Failed to generate insights: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
    };

    const totalValue = customers.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
    const activeCount = customers.filter(c => c.status === 'active').length;

    return (
        <Admin_Layout title="CRM Workflows">
            <div className="crm-header">
                <h1>Customer Relationship Management</h1>
                <p>Manage customer relationships with AI-powered insights</p>
            </div>

            {/* Stats */}
            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{customers.length}</div>
                        <div className="stat-label">Total Customers</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">${totalValue.toLocaleString()}</div>
                        <div className="stat-label">Total Value</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{activeCount}</div>
                        <div className="stat-label">Active</div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="search-input"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
                <div className="action-buttons">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Customer
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="customers-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Value</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>
                                    <span className="status-badge" style={{
                                        backgroundColor: customer.status === 'active' ? '#4caf50' :
                                                      customer.status === 'inactive' ? '#ff6b6b' : '#ffa726'
                                    }}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td>${(parseFloat(customer.value) || 0).toLocaleString()}</td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="action-btn"
                                            onClick={() => generateInsights(customer.id)}
                                            disabled={loading}
                                            title="Generate AI Insights"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => openEditModal(customer)}
                                            title="Edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDeleteCustomer(customer.id)}
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

            {/* AI Insights Panel */}
            {insights && (
                <div className="insights-panel">
                    <div className="panel-header">
                        <h2>AI-Generated Insights</h2>
                        <button className="close-btn" onClick={() => setInsights(null)}>×</button>
                    </div>
                    <div className="insights-content">
                        {insights.content && (
                            <p>{insights.content[0]?.text || 'Insights generated successfully'}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Customer</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddCustomer(); }}>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={newCustomer.status}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Value ($)</label>
                                <input
                                    type="number"
                                    value={newCustomer.value}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, value: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={newCustomer.notes}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Customer</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateCustomer(); }}>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    value={selectedCustomer.name}
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={selectedCustomer.email}
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={selectedCustomer.status}
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Value ($)</label>
                                <input
                                    type="number"
                                    value={selectedCustomer.value}
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, value: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={selectedCustomer.notes || ''}
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, notes: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Update Customer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default AdminCRM;
