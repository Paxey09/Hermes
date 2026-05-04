import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect, useCallback } from 'react';
import openClaudeService from '../../../services/openClaude';
import { db, supabase, utils } from '../../../config/supabaseClient';

const EMPTY_CUSTOMER = {
    name: '',
    email: '',
    status: 'active',
    value: 0,
    notes: ''
};

function Admin_Contacts() {
    const [customers, setCustomers] = useState([]);
    const [insights, setInsights] = useState('');
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [customerError, setCustomerError] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);

    const [customerFilters, setCustomerFilters] = useState({
        status: 'all',
        search: ''
    });

    const loadCustomers = useCallback(async () => {
        setLoadingCustomers(true);
        setCustomerError('');

        try {
            const { data, error } = await db.getCustomers(customerFilters);
            if (error) throw error;
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading customers:', error);
            setCustomerError(error.message || 'Failed to load customers.');
        } finally {
            setLoadingCustomers(false);
        }
    }, [customerFilters]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    useEffect(() => {
        const customerSubscription = db.subscribeToCustomers(() => {
            loadCustomers();
        });

        return () => {
            supabase.removeChannel(customerSubscription);
        };
    }, [loadCustomers]);

    const handleAddCustomer = async () => {
        setSavingCustomer(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const payload = {
                ...newCustomer,
                name: newCustomer.name.trim(),
                email: newCustomer.email.trim(),
                notes: newCustomer.notes.trim(),
                value: Number(newCustomer.value) || 0,
                created_by: user?.id || null
            };

            const { error } = await db.createCustomer(payload);
            if (error) throw error;

            setShowAddModal(false);
            setNewCustomer(EMPTY_CUSTOMER);
            await loadCustomers();
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer: ' + error.message);
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleUpdateCustomer = async () => {
        if (!selectedCustomer) return;

        setSavingCustomer(true);
        try {
            const payload = {
                ...selectedCustomer,
                name: selectedCustomer.name.trim(),
                email: selectedCustomer.email.trim(),
                notes: (selectedCustomer.notes || '').trim(),
                value: Number(selectedCustomer.value) || 0
            };

            const { error } = await db.updateCustomer(selectedCustomer.id, payload);
            if (error) throw error;

            setShowEditModal(false);
            setSelectedCustomer(null);
            await loadCustomers();
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer: ' + error.message);
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            const { error } = await db.deleteCustomer(id);
            if (error) throw error;
            await loadCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer: ' + error.message);
        }
    };

    const extractInsightText = (result) => {
        if (!result) return 'No insights returned.';
        if (typeof result === 'string') return result;

        if (Array.isArray(result?.content)) {
            const textParts = result.content
                .map((item) => {
                    if (typeof item === 'string') return item;
                    if (item?.text) return item.text;
                    return '';
                })
                .filter(Boolean);

            if (textParts.length) {
                return textParts.join('\n\n');
            }
        }

        if (typeof result?.message === 'string') return result.message;
        if (typeof result?.text === 'string') return result.text;

        return JSON.stringify(result, null, 2);
    };

    const generateInsights = async (customerId) => {
        const customer = customers.find((c) => c.id === customerId);
        if (!customer) return;

        setGeneratingInsights(true);
        try {
            const result = await openClaudeService.generateCRMInsights(customer);
            setInsights(extractInsightText(result));
        } catch (error) {
            console.error('Error generating insights:', error);
            alert('Failed to generate insights: ' + error.message);
        } finally {
            setGeneratingInsights(false);
        }
    };

    const openEditModal = (customer) => {
        setSelectedCustomer({ ...customer });
        setShowEditModal(true);
    };

    const totalValue = customers.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0);
    const activeCount = customers.filter((c) => c.status === 'active').length;
    const inactiveCount = customers.filter((c) => c.status === 'inactive').length;
    const pendingCount = customers.filter((c) => c.status === 'pending').length;

    return (
        <Admin_Layout title="Contacts">
            <div className="crm-header">
                <h1>Contacts</h1>
                <p>Manage customer records and relationship data.</p>
            </div>

            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{customers.length}</div>
                        <div className="stat-label">Total Contacts</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{activeCount}</div>
                        <div className="stat-label">Active</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{inactiveCount}</div>
                        <div className="stat-label">Inactive</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{pendingCount}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{utils.formatCurrency(totalValue)}</div>
                        <div className="stat-label">Contact Value</div>
                    </div>
                </div>
            </div>

            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerFilters.search}
                        onChange={(e) =>
                            setCustomerFilters((prev) => ({ ...prev, search: e.target.value }))
                        }
                        className="search-input"
                    />
                    <select
                        value={customerFilters.status}
                        onChange={(e) =>
                            setCustomerFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
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

            {customerError && (
                <div style={{ marginBottom: '16px', color: '#ff6b6b' }}>
                    {customerError}
                </div>
            )}

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
                        {loadingCustomers ? (
                            <tr>
                                <td colSpan="5">Loading customers...</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="5">No customers found.</td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.name}</td>
                                    <td>{customer.email}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor:
                                                    customer.status === 'active'
                                                        ? '#4caf50'
                                                        : customer.status === 'inactive'
                                                        ? '#ff6b6b'
                                                        : '#ffa726'
                                            }}
                                        >
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td>{utils.formatCurrency(parseFloat(customer.value) || 0)}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => generateInsights(customer.id)}
                                                disabled={generatingInsights}
                                            >
                                                AI
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => openEditModal(customer)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteCustomer(customer.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {insights && (
                <div className="insights-panel">
                    <div className="panel-header">
                        <h2>AI-Generated Insights</h2>
                        <button className="close-btn" onClick={() => setInsights('')}>×</button>
                    </div>
                    <div className="insights-content">
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                            {insights}
                        </pre>
                    </div>
                </div>
            )}

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
                                    onChange={(e) => setNewCustomer({ ...newCustomer, value: e.target.value })}
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewCustomer(EMPTY_CUSTOMER);
                                    }}
                                    disabled={savingCustomer}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={savingCustomer}>
                                    {savingCustomer ? 'Saving...' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, value: e.target.value })}
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedCustomer(null);
                                    }}
                                    disabled={savingCustomer}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={savingCustomer}>
                                    {savingCustomer ? 'Saving...' : 'Update Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default Admin_Contacts;
