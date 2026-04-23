import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import openClaudeService from '../../../services/openClaude';
import { db, supabase } from '../../../config/supabaseClient';

function AdminERP() {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [generatedDoc, setGeneratedDoc] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newDocument, setNewDocument] = useState({
        title: '',
        category: 'Operations',
        content: '',
        status: 'draft'
    });
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        search: ''
    });

    useEffect(() => {
        loadDocuments();

        // Subscribe to real-time changes
        const subscription = db.subscribeToDocuments((payload) => {
            console.log('Document change received!', payload);
            loadDocuments();
        });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await db.getDocuments(filters);
            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDocument = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await db.createDocument({
                ...newDocument,
                created_by: user?.id
            });

            if (error) throw error;

            setDocuments([...documents, data]);
            setShowAddModal(false);
            setNewDocument({ title: '', category: 'Operations', content: '', status: 'draft' });
        } catch (error) {
            console.error('Error adding document:', error);
            alert('Failed to add document: ' + error.message);
        }
    };

    const handleUpdateDocument = async () => {
        try {
            const { data, error } = await db.updateDocument(selectedDoc.id, selectedDoc);

            if (error) throw error;

            setDocuments(documents.map(d => d.id === selectedDoc.id ? data : d));
            setShowEditModal(false);
            setSelectedDocument(null);
        } catch (error) {
            console.error('Error updating document:', error);
            alert('Failed to update document: ' + error.message);
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const { error } = await db.deleteDocument(id);
            if (error) throw error;
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document: ' + error.message);
        }
    };

    const generateDocumentation = async (docId) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        setLoading(true);
        try {
            const result = await openClaudeService.chatCompletion([
                {
                    role: 'user',
                    content: `Generate comprehensive documentation for the following ERP context:\nTitle: ${doc.title}\nCategory: ${doc.category}\nExisting Content: ${doc.content || 'None'}\n\nInclude:\n1. Process overview\n2. Step-by-step procedures\n3. Best practices\n4. Common issues and solutions`
                }
            ]);

            setGeneratedDoc(result.content?.[0]?.text || 'Documentation generated successfully');
            setSelectedDoc(doc);
        } catch (error) {
            console.error('Error generating documentation:', error);
            alert('Failed to generate documentation: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (doc) => {
        setSelectedDocument(doc);
        setShowEditModal(true);
    };

    const categories = ['Operations', 'Procurement', 'Quality', 'Finance', 'HR', 'IT'];
    const statuses = ['draft', 'published', 'archived'];

    return (
        <Admin_Layout title="ERP Documentation">
            <div className="erp-header">
                <h1>Enterprise Resource Planning</h1>
                <p>Manage ERP documentation and workflows with AI assistance</p>
            </div>

            {/* Stats */}
            <div className="crm-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{documents.length}</div>
                        <div className="stat-label">Documents</div>
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
                        <div className="stat-value">{categories.length}</div>
                        <div className="stat-label">Categories</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{documents.filter(d => d.status === 'published').length}</div>
                        <div className="stat-label">Published</div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="account-actions">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="search-input"
                    />
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="action-buttons">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Document
                    </button>
                </div>
            </div>

            {/* Documents Table */}
            <div className="documents-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id}>
                                <td>{doc.title}</td>
                                <td>
                                    <span className="role-badge">{doc.category}</span>
                                </td>
                                <td>
                                    <span className="status-badge" style={{
                                        backgroundColor: doc.status === 'published' ? '#4caf50' :
                                                      doc.status === 'draft' ? '#ffa726' : '#9e9e9e'
                                    }}>
                                        {doc.status}
                                    </span>
                                </td>
                                <td>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="action-btn"
                                            onClick={() => generateDocumentation(doc.id)}
                                            disabled={loading}
                                            title="Generate AI Documentation"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => openEditModal(doc)}
                                            title="Edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDeleteDocument(doc.id)}
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

            {/* Generated Documentation Panel */}
            {generatedDoc && (
                <div className="documentation-panel">
                    <div className="panel-header">
                        <h2>Generated Documentation</h2>
                        {selectedDoc && <span className="doc-badge">{selectedDoc.title}</span>}
                        <button className="close-btn" onClick={() => setGeneratedDoc(null)}>×</button>
                    </div>
                    <div className="documentation-content">
                        <pre>{generatedDoc}</pre>
                    </div>
                </div>
            )}

            {/* Add Document Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Document</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddDocument(); }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newDocument.title}
                                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newDocument.category}
                                    onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={newDocument.status}
                                    onChange={(e) => setNewDocument({ ...newDocument, status: e.target.value })}
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={newDocument.content}
                                    onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                                    rows="6"
                                    placeholder="Enter document content..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Document</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Document Modal */}
            {showEditModal && selectedDocument && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Document</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateDocument(); }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={selectedDocument.title}
                                    onChange={(e) => setSelectedDocument({ ...selectedDocument, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={selectedDocument.category}
                                    onChange={(e) => setSelectedDocument({ ...selectedDocument, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={selectedDocument.status}
                                    onChange={(e) => setSelectedDocument({ ...selectedDocument, status: e.target.value })}
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={selectedDocument.content || ''}
                                    onChange={(e) => setSelectedDocument({ ...selectedDocument, content: e.target.value })}
                                    rows="6"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Update Document</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Admin_Layout>
    );
}

export default AdminERP;
