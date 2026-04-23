  import { useState } from 'react';
  import '../../styles/Admin_styles/Admin_Style.css';
  import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';

  function Admin_AccountControl() {
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('all');
      const [selectedUsers, setSelectedUsers] = useState([]);

      // Sample user data
      const users = [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Client', status: 'active', joined: '2024-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Client', status: 'active', joined: '2024-02-20' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Client', status: 'inactive', joined: '2024-03-10' },
          { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Client', status: 'active', joined: '2024-03-25' },
          { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Client', status: 'pending', joined: '2024-04-01' },
      ];

      const filteredUsers = users.filter(user => {
          const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
          return matchesSearch && matchesFilter;
      });

      const handleSelectUser = (userId) => {
          setSelectedUsers(prev =>
              prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
          );
      };

      const handleSelectAll = () => {
          setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));
      };

      const handleDeleteSelected = () => {
          if (selectedUsers.length > 0) {
              if (confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
                  console.log('Deleting users:', selectedUsers);
                  setSelectedUsers([]);
              }
          }
      };

      const getStatusColor = (status) => {
          switch (status) {
              case 'active': return '#4caf50';
              case 'inactive': return '#ff6b6b';
              case 'pending': return '#ffa726';
              default: return '#9e9e9e';
          }
      };

      const getStatIcon = (type) => {
          const icons = {
              total: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
              ),
              active: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
              ),
              pending: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
              ),
              inactive: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
              )
          };
          return icons[type] || icons.total;
      };

      return (
          <Admin_Layout title="Accounts Control">
              {/* Stats Cards */}
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
                          <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
                          <div className="stat-label">Active</div>
                      </div>
                  </div>
                  <div className="stat-card">
                      <div className="stat-icon">{getStatIcon('pending')}</div>
                      <div className="stat-info">
                          <div className="stat-value">{users.filter(u => u.status === 'pending').length}</div>
                          <div className="stat-label">Pending</div>
                      </div>
                  </div>
                  <div className="stat-card">
                      <div className="stat-icon">{getStatIcon('inactive')}</div>
                      <div className="stat-info">
                          <div className="stat-value">{users.filter(u => u.status === 'inactive').length}</div>
                          <div className="stat-label">Inactive</div>
                      </div>
                  </div>
              </div>

              {/* Actions Bar */}
              <div className="account-actions">
                  <div className="search-filter">
                      <input
                          type="text"
                          placeholder="Search users..."
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
                      <button className="btn-primary">+ Add User</button>
                  </div>
              </div>

              {/* Users Table */}
              <div className="users-table-container">
                  <table className="users-table">
                      <thead>
                          <tr>
                              <th>
                                  <input
                                      type="checkbox"
                                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                      onChange={handleSelectAll}
                                  />
                              </th>
                              <th>User</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Joined</th>
                              <th>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredUsers.map(user => (
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
                                          <div className="user-avatar-small">{user.name.charAt(0)}</div>
                                          <span>{user.name}</span>
                                      </div>
                                  </td>
                                  <td>{user.email}</td>
                                  <td>
                                      <span className="role-badge">{user.role}</span>
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
                                          <button className="action-btn edit" title="Edit">
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                              </svg>
                                          </button>
                                          <button className="action-btn delete" title="Delete">
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

              {/* Pagination */}
              <div className="pagination">
                  <button className="pagination-btn" disabled>Previous</button>
                  <span className="pagination-info">Page 1 of 1</span>
                  <button className="pagination-btn" disabled>Next</button>
              </div>
          </Admin_Layout>
      );
  }

  export default Admin_AccountControl;