import { useEffect, useState, useCallback } from 'react';
import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { db, supabase } from '../../../config/supabaseClient';

const EMPTY_CONTACT_FORM = {
    name: '',
    company: '',
    phone: '',
    email: ''
};

function Admin_CRM() {
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerError, setCustomerError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [newContact, setNewContact] = useState(EMPTY_CONTACT_FORM);

    const [customerFilters, setCustomerFilters] = useState({
        search: ''
    });

    const loadCustomers = useCallback(async () => {
        setLoadingCustomers(true);
        setCustomerError('');

        try {
            const { data, error } = await db.getCustomers({
                search: customerFilters.search,
                limit: 50
            });

            if (error) throw error;
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading CRM contacts:', error);
            setCustomerError(error.message || 'Failed to load contacts.');
        } finally {
            setLoadingCustomers(false);
        }
    }, [customerFilters.search]);

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

    const handleCreateContact = async () => {
        const name = newContact.name.trim();
        const company = newContact.company.trim();
        const phone = newContact.phone.trim();
        const email = newContact.email.trim();

        if (!name) {
            alert('Name is required.');
            return;
        }

        if (!email) {
            alert('Email is required.');
            return;
        }

        setSavingContact(true);
        try {
            const { data: authData } = await supabase.auth.getUser();

            const payload = {
                name,
                company: company || null,
                phone: phone || null,
                email,
                status: 'active',
                value: 0,
                notes: 'Created manually from CRM.',
                created_by: authData?.user?.id || null
            };

            const { error } = await db.createCustomer(payload);
            if (error) throw error;

            setShowAddModal(false);
            setNewContact(EMPTY_CONTACT_FORM);
            await loadCustomers();
        } catch (error) {
            console.error('Error creating contact:', error);
            alert('Failed to create contact: ' + error.message);
        } finally {
            setSavingContact(false);
        }
    };

    return (
        <Admin_Layout title="CRM">
            <div className="crm-header">
                <h1>CRM</h1>
                <p>Contact registry and customer relationship overview.</p>
            </div>

            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-info">
                        <div className="stat-value">{customers.length}</div>
                        <div className="stat-label">Total Contacts</div>
                    </div>
                </div>
            </div>

            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={customerFilters.search}
                        onChange={(e) =>
                            setCustomerFilters((prev) => ({ ...prev, search: e.target.value }))
                        }
                        className="search-input"
                    />
                </div>

                <div className="action-buttons">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Contact
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
                            <th>Name</th>
                            <th>Company</th>
                            <th>Contact Number</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingCustomers ? (
                            <tr>
                                <td colSpan="4">Loading contacts...</td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="4">No contacts found.</td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>{customer.name || 'N/A'}</td>
                                    <td>{customer.company || 'N/A'}</td>
                                    <td>{customer.phone || 'N/A'}</td>
                                    <td>{customer.email || 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add Contact</h2>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateContact();
                            }}
                        >
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newContact.name}
                                    onChange={(e) =>
                                        setNewContact((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Company</label>
                                <input
                                    type="text"
                                    value={newContact.company}
                                    onChange={(e) =>
                                        setNewContact((prev) => ({ ...prev, company: e.target.value }))
                                    }
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    value={newContact.phone}
                                    onChange={(e) =>
                                        setNewContact((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newContact.email}
                                    onChange={(e) =>
                                        setNewContact((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewContact(EMPTY_CONTACT_FORM);
                                    }}
                                    disabled={savingContact}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={savingContact}
                                >
                                    {savingContact ? 'Saving...' : 'Create Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default Admin_CRM;
