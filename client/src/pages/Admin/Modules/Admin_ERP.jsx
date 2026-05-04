import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useEffect, useMemo, useState } from 'react';

import {
  ERP_AVAILABILITY_MODE_OPTIONS,
  loadErpData,
  getActiveTypes,
  getTypeForItem,
  createErpItem,
  updateErpItem,
  deleteErpItem,
  createErpType,
  updateErpType,
  activateErpType,
  deactivateErpType,
  deleteErpTypeIfUnused,
  formatPhp,
  getDisplayType,
  getAvailabilityText,
  getAvailabilityClass,
  getStatusClass,
  getTypeStatusClass,
  buildErpStats,
} from '../../../services/erp';

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

const emptyTypeForm = {
  key: '',
  label: '',
  has_stock: false,
  availability_mode: 'status',
  is_active: true,
};

function AdminERP() {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
  });

  const [typeFilters, setTypeFilters] = useState({
    search: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);

  const activeTypes = useMemo(() => getActiveTypes(types), [types]);
  const selectedType = types.find((type) => type.key === itemForm.type_key);

  const loadAll = async () => {
    setLoading(true);

    try {
      const data = await loadErpData(filters, typeFilters);
      setTypes(data.types);
      setItems(data.items);
    } catch (error) {
      console.error('Error loading ERP data:', error);
      alert(error.message || 'Failed to load ERP data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAll();
    }, 500);

    return () => clearTimeout(timeout);
  }, [filters, typeFilters]);

  const stats = useMemo(() => {
    return buildErpStats(items, types);
  }, [items, types]);

  const openAddTypeModal = () => {
    setEditingType(null);
    setTypeForm(emptyTypeForm);
    setShowTypeModal(true);
  };

  const openEditTypeModal = (type) => {
    setEditingType(type);
    setTypeForm({
      key: type.key || '',
      label: type.label || '',
      has_stock: Boolean(type.has_stock),
      availability_mode: type.availability_mode || 'status',
      is_active: type.is_active !== false,
    });
    setShowTypeModal(true);
  };

  const closeTypeModal = () => {
    setShowTypeModal(false);
    setEditingType(null);
    setTypeForm(emptyTypeForm);
  };

  const handleTypeSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const result = editingType
        ? await updateErpType(editingType.key, typeForm)
        : await createErpType(typeForm);

      if (result.error) throw result.error;

      await loadAll();
      closeTypeModal();
    } catch (error) {
      console.error('Error saving ERP category:', error);
      alert(error.message || 'Failed to save ERP category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTypeActive = async (type) => {
    const action = type.is_active ? deactivateErpType : activateErpType;

    try {
      const { error } = await action(type.key);
      if (error) throw error;

      await loadAll();
    } catch (error) {
      console.error('Error updating ERP category status:', error);
      alert(error.message || 'Failed to update ERP category status');
    }
  };

  const handleDeleteType = async (type) => {
    if (!confirm(`Delete type "${type.label}"?`)) return;

    try {
      const { error } = await deleteErpTypeIfUnused(type.key);
      if (error) throw error;

      await loadAll();
    } catch (error) {
      console.error('Error deleting ERP category:', error);
      alert(error.message || 'Failed to delete ERP category');
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      ...emptyItemForm,
      type_key: activeTypes[0]?.key || '',
    });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    const itemType = getTypeForItem(item, types);

    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      sku: item.sku || '',
      type_key: item.type_key || itemType?.key || '',
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

  const handleItemTypeChange = (typeKey) => {
    const nextType = types.find((type) => type.key === typeKey);

    setItemForm((current) => ({
      ...current,
      type_key: typeKey,
      stock: nextType?.has_stock ? current.stock : '',
    }));
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();

    const typeDef = types.find((type) => type.key === itemForm.type_key);

    setSaving(true);

    try {
      const result = editingItem
        ? await updateErpItem(editingItem.id, itemForm, typeDef)
        : await createErpItem(itemForm, typeDef);

      if (result.error) throw result.error;

      await loadAll();
      closeItemModal();
    } catch (error) {
      console.error('Error saving ERP item:', error);
      alert(error.message || 'Failed to save ERP item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      const { error } = await deleteErpItem(item.id);
      if (error) throw error;

      setItems((current) => current.filter((record) => record.id !== item.id));
    } catch (error) {
      console.error('Error deleting ERP item:', error);
      alert(error.message || 'Failed to delete ERP item');
    }
  };

  return (
    <Admin_Layout title="ERP">
      <div className="erp-page">
        <div className="erp-header">
          <div>
            <h1>ERP</h1>
            <p>Enterprise resource & inventory management</p>
          </div>
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
              <p>Manage item categories and behavior rules.</p>
            </div>

            <div className="erp-section-actions">
              <input
                type="text"
                placeholder="Search types..."
                value={typeFilters.search}
                onChange={(e) =>
                  setTypeFilters({ ...typeFilters, search: e.target.value })
                }
                className="erp-search"
              />

              <button
                className="erp-add-btn"
                onClick={openAddTypeModal}
                type="button"
              >
                + Add Type
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
                ) : types.length === 0 ? (
                  <tr>
                    <td colSpan="6">No ERP categories found.</td>
                  </tr>
                ) : (
                  types.map((type) => (
                    <tr key={type.key}>
                      <td>
                        <div className="erp-product-name">{type.label}</div>
                      </td>
                      <td className="erp-muted">{type.key}</td>
                      <td>{type.has_stock ? 'Tracked' : 'Not tracked'}</td>
                      <td>{type.availability_mode}</td>
                      <td>
                        <span className={getTypeStatusClass(type.is_active)}>
                          {type.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="erp-actions">
                          <button
                            className="erp-icon-btn edit"
                            onClick={() => openEditTypeModal(type)}
                            title="Edit"
                            type="button"
                          >
                            ✎
                          </button>

                          <button
                            className="erp-icon-btn edit"
                            onClick={() => handleToggleTypeActive(type)}
                            title={type.is_active ? 'Deactivate' : 'Activate'}
                            type="button"
                          >
                            {type.is_active ? '⏸' : '▶'}
                          </button>

                          <button
                            className="erp-icon-btn delete"
                            onClick={() => handleDeleteType(type)}
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
                <option value="all">All Category</option>
                {activeTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
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
                  <th>Category</th>
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

                      <td>{getDisplayType(item, types)}</td>

                      <td className="erp-muted">{item.sku || 'N/A'}</td>

                      <td>
                        <span className="erp-category">
                          {item.category || 'N/A'}
                        </span>
                      </td>

                      <td>{formatPhp(item.price)}</td>

                      <td>
                        <span className={getAvailabilityClass(item, types)}>
                          {getAvailabilityText(item, types)}
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

        {showTypeModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingType ? 'Edit ERP Category' : 'Add ERP Category'}</h2>

              <form onSubmit={handleTypeSubmit}>
                <div className="form-group">
                  <label>Type Key</label>
                  <input
                    type="text"
                    value={typeForm.key}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, key: e.target.value })
                    }
                    placeholder="Example: food, service, rental, equipment"
                    disabled={Boolean(editingType)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={typeForm.label}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, label: e.target.value })
                    }
                    placeholder="Example: Food, Service, Rental, Equipment"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Availability Rule</label>
                  <select
                    value={typeForm.availability_mode}
                    onChange={(e) =>
                      setTypeForm({
                        ...typeForm,
                        availability_mode: e.target.value,
                        has_stock:
                          e.target.value === 'stock' ? true : typeForm.has_stock,
                      })
                    }
                  >
                    {ERP_AVAILABILITY_MODE_OPTIONS.map((option) => (
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
                      checked={typeForm.has_stock}
                      onChange={(e) =>
                        setTypeForm({
                          ...typeForm,
                          has_stock: e.target.checked,
                          availability_mode: e.target.checked
                            ? 'stock'
                            : 'status',
                        })
                      }
                    />{' '}
                    Track stock quantity for this type
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={typeForm.is_active}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, is_active: e.target.checked })
                      }
                    />{' '}
                    Active
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeTypeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? 'Saving...'
                      : editingType
                        ? 'Update Type'
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
                  <label>Item Type</label>
                  <select
                    value={itemForm.type_key}
                    onChange={(e) => handleItemTypeChange(e.target.value)}
                  >
                    <option value="">Select Type</option>
                    {activeTypes.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.label}
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
                    placeholder="Example: HMS-ERP-001"
                  />
                </div>

                <div className="form-group">
                  <label>Category / Subcategory</label>
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

                {selectedType?.has_stock && (
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
                    {selectedType?.availability_mode === 'status'
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
                      {selectedType?.availability_mode === 'status'
                        ? 'Available'
                        : 'Active'}
                    </option>
                    <option value="inactive">
                      {selectedType?.availability_mode === 'status'
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
    </Admin_Layout>
  );
}

export default AdminERP;
