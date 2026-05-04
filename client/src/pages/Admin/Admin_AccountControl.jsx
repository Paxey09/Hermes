import { useEffect, useState } from 'react';
import '../../styles/Admin_styles/Admin_Style.css';
import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import { supabase } from '../../config/supabaseClient.js';

function Admin_AccountControl() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'Client',
    status: 'active',
    company_name: '',
    account_role: 'owner',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, company_name, account_role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error);
      setError(error.message);
      setUsers([]);
      setLoading(false);
      return;
    }

    const mappedUsers = (data || []).map((profile) => ({
      id: profile.id,
      name: profile.full_name || 'Unnamed User',
      email: profile.email || 'No email',
      role: profile.role || 'Client',
      status: profile.status || 'active',
      company: profile.company_name || 'N/A',
      accountRole: profile.account_role || 'owner',
      joined: profile.created_at
        ? new Date(profile.created_at).toLocaleDateString()
        : 'N/A',
    }));

    setUsers(mappedUsers);
    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.company.toLowerCase().includes(search);

    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length
        ? []
        : filteredUsers.map((u) => u.id)
    );
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.name === 'Unnamed User' ? '' : user.name,
      role: user.role || 'Client',
      status: user.status || 'active',
      company_name: user.company === 'N/A' ? '' : user.company,
      account_role: user.accountRole || 'owner',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      full_name: '',
      role: 'Client',
      status: 'active',
      company_name: '',
      account_role: 'owner',
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    const updates = {
      full_name: editForm.full_name.trim(),
      role: editForm.role,
      status: editForm.status,
      company_name: editForm.company_name.trim(),
      account_role: editForm.account_role,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', editingUser.id);

    if (error) {
      console.error('Failed to save user:', error);
      alert(error.message);
      return;
    }

    closeEditModal();
    await fetchUsers();
  };

  const handleDeleteSelected = () => {
    alert(
      'Delete user is not implemented yet. Deleting Supabase Auth users must be handled by backend service-role logic.'
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'inactive':
        return '#ff6b6b';
      case 'pending':
        return '#ffa726';
      default:
        return '#9e9e9e';
    }
  };

  const getStatIcon = (type) => {
    const icons = {
      total: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      active: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      pending: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      inactive: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    };

    return icons[type] || icons.total;
  };

  return (
    <Admin_Layout title="Accounts Control">
      <div className="account-stats">
        <div className="stat-card">
          <div className="stat-icon">{getStatIcon('total')}</div>
          <div className="stat-info">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">{getStatIcon('active')}</div>
          <div className="stat-info">
            <div className="stat-value">
              {users.filter((u) => u.status === 'active').length}
            </div>
            <div className="stat-label">Active</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">{getStatIcon('pending')}</div>
          <div className="stat-info">
            <div className="stat-value">
              {users.filter((u) => u.status === 'pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">{getStatIcon('inactive')}</div>
          <div className="stat-info">
            <div className="stat-value">
              {users.filter((u) => u.status === 'inactive').length}
            </div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
      </div>

      <div className="account-actions">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search users or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="action-buttons">
          {selectedUsers.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteSelected}>
              Delete Selected ({selectedUsers.length})
            </button>
          )}

          <button
            className="btn-primary"
            onClick={() =>
              alert('Add User is not implemented yet. Next step: backend create client account endpoint.')
            }
          >
            + Add User
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      )}

      {error && (
        <div className="system-status-banner">
          <p style={{ color: '#ff6b6b' }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Account Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>

                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>

                  <td>{user.email}</td>
                  <td>{user.company}</td>

                  <td>
                    <span className="role-badge">{user.role}</span>
                  </td>

                  <td>
                    <span className="role-badge">{user.accountRole}</span>
                  </td>

                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(user.status) }}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>{user.joined}</td>

                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit"
                        title="Edit"
                        onClick={() => openEditModal(user)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      <button
                        className="action-btn delete"
                        title="Delete"
                        onClick={() =>
                          alert('Delete user is not implemented yet. This needs backend service-role logic.')
                        }
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="pagination-btn" disabled>
          Previous
        </button>
        <span className="pagination-info">Page 1 of 1</span>
        <button className="pagination-btn" disabled>
          Next
        </button>
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeEditModal}>
              ×
            </button>

            <h2>Edit User</h2>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input value={editingUser.email} disabled />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input
                  name="company_name"
                  value={editForm.company_name}
                  onChange={handleEditChange}
                  placeholder="Company name"
                />
              </div>

              <div className="form-group">
                <label>System Role</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                >
                  <option value="Admin">Admin</option>
                  <option value="Client">Client</option>
                </select>
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select
                  name="account_role"
                  value={editForm.account_role}
                  onChange={handleEditChange}
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Admin_Layout>
  );
}

export default Admin_AccountControl;
