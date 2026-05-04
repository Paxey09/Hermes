import Client_Layout from '../../Components/Client_Components/Client_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useEffect, useMemo, useState } from 'react';

import {
  CLIENT_ERP_AVAILABILITY_MODE_OPTIONS,
  loadClientErpData,
  getAccessibleWorkspaces,
  getCurrentProfile,
  getActiveCategories,
  getCategoryForItem,
  createClientErpItem,
  updateClientErpItem,
  deleteClientErpItem,
  createClientErpCategory,
  updateClientErpCategory,
  activateClientErpCategory,
  deactivateClientErpCategory,
  deleteClientErpCategoryIfUnused,
  formatPhp,
  getDisplayCategory,
  getAvailabilityText,
  getAvailabilityClass,
  getStatusClass,
  getCategoryStatusClass,
  buildClientErpStats,
} from '../../../services/clientErp';

const emptyItemForm = {
  name: '',
  sku: '',
  type_key: '',
  category: '',
  price: '',
  stock: '',
  status: 'active',
  description: '',
};

const emptyCategoryForm = {
  key: '',
  label: '',
  has_stock: false,
  availability_mode: 'status',
  is_active: true,
};

function normalizeWorkspaceRows(rows = []) {
  return rows
    .map((row) => row.workspaces || row)
    .filter(Boolean);
}

function ClientERP() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [profile, setProfile] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
  });

  const [categoryFilters, setCategoryFilters] = useState({
    search: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const isAdmin = profile?.role === 'admin';
  const activeCategories = useMemo(() => getActiveCategories(categories), [categories]);
  const selectedCategory = categories.find((category) => category.key === itemForm.type_key);

  const effectiveWorkspaceId = isAdmin ? selectedWorkspaceId || null : selectedWorkspaceId || null;

  const loadWorkspaceOptions = async () => {
    const currentProfile = await getCurrentProfile();
    setProfile(currentProfile);

    const workspaceRes = await getAccessibleWorkspaces();
    if (workspaceRes.error) throw workspaceRes.error;

    const normalized = normalizeWorkspaceRows(workspaceRes.data || []);
    setWorkspaces(normalized);

    if (currentProfile.role !== 'admin' && normalized[0]?.id) {
      setSelectedWorkspaceId(normalized[0].id);
    }
  };

  const loadAll = async () => {
    setLoading(true);

    try {
      if (!profile) {
        await loadWorkspaceOptions();
        return;
      }

      const data = await loadClientErpData(filters, categoryFilters, {
        workspaceId: effectiveWorkspaceId,
      });

      setCategories(data.categories);
      setItems(data.items);
    } catch (error) {
      console.error('Error loading client ERP data:', error);
      alert(error.message || 'Failed to load client ERP data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceOptions().catch((error) => {
      console.error('Error loading workspace options:', error);
      alert(error.message || 'Failed to load workspace options');
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (profile) loadAll();
    }, 500);

    return () => clearTimeout(timeout);
  }, [profile, selectedWorkspaceId, filters, categoryFilters]);

  const stats = useMemo(() => {
    return buildClientErpStats(items, categories);
  }, [items, categories]);

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      key: category.key || '',
      label: category.label || '',
      has_stock: Boolean(category.has_stock),
      availability_mode: category.availability_mode || 'status',
      is_active: category.is_active !== false,
    });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const result = editingCategory
        ? await updateClientErpCategory(editingCategory.key, categoryForm, effectiveWorkspaceId)
        : await createClientErpCategory(categoryForm, effectiveWorkspaceId);

      if (result.error) throw result.error;

      await loadAll();
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving client ERP category:', error);
      alert(error.message || 'Failed to save client ERP category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryActive = async (category) => {
    const action = category.is_active
      ? deactivateClientErpCategory
      : activateClientErpCategory;

    try {
      const { error } = await action(category.key, effectiveWorkspaceId);
      if (error) throw error;

      await loadAll();
    } catch (error) {
      console.error('Error updating category status:', error);
      alert(error.message || 'Failed to update category status');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete category "${category.label}"?`)) return;

    try {
      const { error } = await deleteClientErpCategoryIfUnused(
        category.key,
        effectiveWorkspaceId
      );

      if (error) throw error;

      await loadAll();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.message || 'Failed to delete category');
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      ...emptyItemForm,
      type_key: activeCategories[0]?.key || '',
    });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    const itemCategory = getCategoryForItem(item, categories);

    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      sku: item.sku || '',
      type_key: item.type_key || itemCategory?.key || '',
      category: item.category || '',
      price: item.price ?? '',
      stock: item.stock ?? '',
      status: item.status || 'active',
      description: item.description || '',
    });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm(emptyItemForm);
  };

  const handleItemCategoryChange = (categoryKey) => {
    const nextCategory = categories.find((category) => category.key === categoryKey);

    setItemForm((current) => ({
      ...current,
      type_key: categoryKey,
      stock: nextCategory?.has_stock ? current.stock : '',
    }));
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();

    const categoryDef = categories.find(
      (category) => category.key === itemForm.type_key
    );

    setSaving(true);

    try {
      const result = editingItem
        ? await updateClientErpItem(editingItem.id, itemForm, categoryDef, effectiveWorkspaceId)
        : await createClientErpItem(itemForm, categoryDef, effectiveWorkspaceId);

      if (result.error) throw result.error;

      await loadAll();
      closeItemModal();
    } catch (error) {
      console.error('Error saving client ERP item:', error);
      alert(error.message || 'Failed to save client ERP item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      const { error } = await deleteClientErpItem(item.id, effectiveWorkspaceId);
      if (error) throw error;

      setItems((current) => current.filter((record) => record.id !== item.id));
    } catch (error) {
      console.error('Error deleting client ERP item:', error);
      alert(error.message || 'Failed to delete client ERP item');
    }
  };

  return (
    <Client_Layout title="ERP">
      <div className="erp-page">
        <div className="erp-header">
          <div>
            <h1>ERP</h1>
            <p>Manage your workspace products, services, assets, and resources.</p>
          </div>

          {isAdmin && (
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="erp-select"
            >
              <option value="">All Workspaces</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name || workspace.company_name || workspace.id}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="erp-stats">
          <div className="erp-stat-card">
            <div className="erp-stat-label">Stock-tracked Items</div>
            <div className="erp-stat-value">{stats.totalProducts}</div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-label">Non-stock Items</div>
            <div className="erp-stat-value">{stats.totalServices}</div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-label">Active Items</div>
            <div className="erp-stat-value">{stats.activeItems}</div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-label">Inactive / Discontinued</div>
            <div className="erp-stat-value">{stats.inactiveOrDiscontinued}</div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-label">Out of Stock</div>
            <div className="erp-stat-value">{stats.outOfStockHardware}</div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-label">Unavailable Items</div>
            <div className="erp-stat-value">{stats.unavailableAddons}</div>
          </div>
        </div>

        {(stats.outOfStockHardware > 0 || stats.unavailableAddons > 0) && (
          <div className="erp-alert">
            ⚠ {stats.outOfStockHardware} stock-tracked item(s) out of stock and{' '}
            {stats.unavailableAddons} unavailable item(s).
          </div>
        )}

        <div className="erp-table-card">
          <div className="erp-section-header">
            <div className="erp-section-title">
              <h2>ERP Categories</h2>
              <p>Manage workspace item categories and behavior rules.</p>
            </div>

            <div className="erp-section-actions">
              <input
                type="text"
                placeholder="Search categories..."
                value={categoryFilters.search}
                onChange={(e) =>
                  setCategoryFilters({
                    ...categoryFilters,
                    search: e.target.value,
                  })
                }
                className="erp-search"
              />

              <button
                className="erp-add-btn"
                onClick={openAddCategoryModal}
                type="button"
                disabled={isAdmin && !selectedWorkspaceId}
                title={isAdmin && !selectedWorkspaceId ? 'Select a workspace first' : ''}
              >
                + Add Category
              </button>
            </div>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Key</th>
                  <th>Stock</th>
                  <th>Availability Rule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">Loading ERP categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="6">No ERP categories found.</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={`${category.workspace_id}-${category.key}`}>
                      <td>
                        <div className="erp-product-name">{category.label}</div>
                      </td>
                      <td className="erp-muted">{category.key}</td>
                      <td>{category.has_stock ? 'Tracked' : 'Not tracked'}</td>
                      <td>{category.availability_mode}</td>
                      <td>
                        <span className={getCategoryStatusClass(category.is_active)}>
                          {category.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          <button
                            className="erp-icon-btn edit"
                            onClick={() => openEditCategoryModal(category)}
                            title="Edit"
                            type="button"
                          >
                            ✎
                          </button>

                          <button
                            className="erp-icon-btn edit"
                            onClick={() => handleToggleCategoryActive(category)}
                            title={category.is_active ? 'Deactivate' : 'Activate'}
                            type="button"
                          >
                            {category.is_active ? '⏸' : '▶'}
                          </button>

                          <button
                            className="erp-icon-btn delete"
                            onClick={() => handleDeleteCategory(category)}
                            title="Delete"
                            type="button"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-table-card">
          <div className="erp-section-header">
            <div className="erp-section-title">
              <h2>ERP Items</h2>
              <p>Manage actual products, services, assets, or resources.</p>
            </div>

            <div className="erp-section-actions">
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="erp-search"
              />

              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="erp-select"
              >
                <option value="all">All Categories</option>
                {activeCategories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>

              <button
                className="erp-add-btn"
                onClick={openAddItemModal}
                type="button"
                disabled={isAdmin && !selectedWorkspaceId}
                title={isAdmin && !selectedWorkspaceId ? 'Select a workspace first' : ''}
              >
                + Add Item
              </button>
            </div>
          </div>

          <div className="erp-table-wrapper">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Subcategory</th>
                  <th>Price</th>
                  <th>Stock / Availability</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">Loading ERP items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="8">No ERP items found.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="erp-product-name">{item.name}</div>
                        {item.description && (
                          <div className="erp-product-desc">
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td>{getDisplayCategory(item, categories)}</td>

                      <td className="erp-muted">{item.sku || 'N/A'}</td>

                      <td>
                        <span className="erp-category">
                          {item.category || 'N/A'}
                        </span>
                      </td>

                      <td>{formatPhp(item.price)}</td>

                      <td>
                        <span className={getAvailabilityClass(item, categories)}>
                          {getAvailabilityText(item, categories)}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(item.status)}>
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="erp-actions">
                          <button
                            className="erp-icon-btn edit"
                            onClick={() => openEditItemModal(item)}
                            title="Edit"
                            type="button"
                          >
                            ✎
                          </button>

                          <button
                            className="erp-icon-btn delete"
                            onClick={() => handleDeleteItem(item)}
                            title="Delete"
                            type="button"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCategoryModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingCategory ? 'Edit ERP Category' : 'Add ERP Category'}</h2>

              <form onSubmit={handleCategorySubmit}>
                <div className="form-group">
                  <label>Category Key</label>
                  <input
                    type="text"
                    value={categoryForm.key}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, key: e.target.value })
                    }
                    placeholder="Example: food, service, rental, equipment"
                    disabled={Boolean(editingCategory)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.label}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, label: e.target.value })
                    }
                    placeholder="Example: Food, Service, Rental, Equipment"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Availability Rule</label>
                  <select
                    value={categoryForm.availability_mode}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        availability_mode: e.target.value,
                        has_stock:
                          e.target.value === 'stock'
                            ? true
                            : categoryForm.has_stock,
                      })
                    }
                  >
                    {CLIENT_ERP_AVAILABILITY_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={categoryForm.has_stock}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          has_stock: e.target.checked,
                          availability_mode: e.target.checked ? 'stock' : 'status',
                        })
                      }
                    />{' '}
                    Track stock quantity for this category
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          is_active: e.target.checked,
                        })
                      }
                    />{' '}
                    Active
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeCategoryModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? 'Saving...'
                      : editingCategory
                        ? 'Update Category'
                        : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showItemModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingItem ? 'Edit ERP Item' : 'Add ERP Item'}</h2>

              <form onSubmit={handleItemSubmit}>
                <div className="form-group">
                  <label>Item Category</label>
                  <select
                    value={itemForm.type_key}
                    onChange={(e) => handleItemCategoryChange(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {activeCategories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, sku: e.target.value })
                    }
                    placeholder="Example: CLIENT-ERP-001"
                  />
                </div>

                <div className="form-group">
                  <label>Subcategory</label>
                  <input
                    type="text"
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    placeholder="Optional subcategory"
                  />
                </div>

                <div className="form-group">
                  <label>Price (PHP)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, price: e.target.value })
                    }
                  />
                </div>

                {selectedCategory?.has_stock && (
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={itemForm.stock}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, stock: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>
                    {selectedCategory?.availability_mode === 'status'
                      ? 'Availability'
                      : 'Status'}
                  </label>
                  <select
                    value={itemForm.status}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, status: e.target.value })
                    }
                  >
                    <option value="active">
                      {selectedCategory?.availability_mode === 'status'
                        ? 'Available'
                        : 'Active'}
                    </option>
                    <option value="inactive">
                      {selectedCategory?.availability_mode === 'status'
                        ? 'Not Available'
                        : 'Inactive'}
                    </option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, description: e.target.value })
                    }
                    placeholder="Describe this item..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeItemModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? 'Saving...'
                      : editingItem
                        ? 'Update Item'
                        : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Client_Layout>
  );
}

export default ClientERP;
