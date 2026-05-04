import { supabase } from '../../config/supabaseClient';

const ITEMS_TABLE = 'client_erp_items';
const CATEGORIES_TABLE = 'client_erp_item_categories';
const WORKSPACE_MEMBERS_TABLE = 'workspace_members';
const WORKSPACES_TABLE = 'workspaces';
const PROFILES_TABLE = 'profiles';

export const CLIENT_ERP_AVAILABILITY_MODE_OPTIONS = [
  { value: 'status', label: 'Status-based' },
  { value: 'stock', label: 'Stock-based' },
];

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('You must be logged in.');
  return data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('id,email,role,full_name')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function getMyWorkspaceMemberships() {
  const profile = await getCurrentProfile();

  const { data, error } = await supabase
    .from(WORKSPACE_MEMBERS_TABLE)
    .select('workspace_id,role')
    .eq('user_id', profile.id);

  if (error) throw error;

  return {
    profile,
    memberships: data || [],
  };
}

export async function getWritableWorkspaceId(workspaceId = null) {
  if (workspaceId) return workspaceId;

  const { profile, memberships } = await getMyWorkspaceMemberships();

  if (profile.role === 'admin') {
    throw new Error('Admin must select a workspace before creating or updating client ERP records.');
  }

  const workspace = memberships[0];

  if (!workspace?.workspace_id) {
    throw new Error('No workspace found for this account.');
  }

  return workspace.workspace_id;
}

export async function getAccessibleWorkspaces() {
  const profile = await getCurrentProfile();

  if (profile.role === 'admin') {
    return supabase
      .from(WORKSPACES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
  }

  return supabase
    .from(WORKSPACE_MEMBERS_TABLE)
    .select('workspace_id,role,workspaces(*)')
    .eq('user_id', profile.id);
}

export async function getClientErpCategories(
  { activeOnly = false, search = '' } = {},
  { workspaceId = null } = {}
) {
  let query = supabase
    .from(CATEGORIES_TABLE)
    .select('*')
    .order('label', { ascending: true });

  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  if (activeOnly) query = query.eq('is_active', true);

  if (search?.trim()) {
    const value = search.trim();
    query = query.or(`key.ilike.%${value}%,label.ilike.%${value}%`);
  }

  return query;
}

export async function getClientErpItems(filters = {}, { workspaceId = null } = {}) {
  let query = supabase
    .from(ITEMS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (workspaceId) query = query.eq('workspace_id', workspaceId);

  if (filters.search?.trim()) {
    query = query.ilike('name', `%${filters.search.trim()}%`);
  }

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type_key', filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  return query;
}

export async function loadClientErpData(filters = {}, categoryFilters = {}, options = {}) {
  const categoriesRes = await getClientErpCategories(
    {
      activeOnly: false,
      search: categoryFilters.search || '',
    },
    options
  );

  if (categoriesRes.error) throw categoriesRes.error;

  const itemsRes = await getClientErpItems(filters, options);

  if (itemsRes.error) throw itemsRes.error;

  return {
    categories: categoriesRes.data || [],
    items: itemsRes.data || [],
  };
}

export function getActiveCategories(categories = []) {
  return categories.filter((category) => category.is_active !== false);
}

export function normalizeCategoryKey(value = '') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getCategoryForItem(item, categories = []) {
  return categories.find((category) => category.key === item.type_key) || null;
}

export function buildClientErpCategoryPayload(form, workspaceId, { editing = false } = {}) {
  if (!workspaceId) throw new Error('Workspace is required.');
  if (!form.key?.trim()) throw new Error('Category key is required.');
  if (!form.label?.trim()) throw new Error('Category name is required.');
  if (!form.availability_mode) throw new Error('Availability rule is required.');

  const key = normalizeCategoryKey(form.key);
  if (!key) throw new Error('Category key is invalid.');

  const payload = {
    workspace_id: workspaceId,
    label: form.label.trim(),
    has_stock: Boolean(form.has_stock),
    availability_mode: form.availability_mode,
    is_active: form.is_active !== false,
  };

  if (!editing) payload.key = key;

  return payload;
}

export async function createClientErpCategory(form, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);
  const payload = buildClientErpCategoryPayload(form, finalWorkspaceId);

  return supabase
    .from(CATEGORIES_TABLE)
    .insert(payload)
    .select()
    .single();
}

export async function updateClientErpCategory(key, form, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);
  const payload = buildClientErpCategoryPayload(form, finalWorkspaceId, { editing: true });

  return supabase
    .from(CATEGORIES_TABLE)
    .update(payload)
    .eq('workspace_id', finalWorkspaceId)
    .eq('key', key)
    .select()
    .single();
}

export async function activateClientErpCategory(key, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);

  return supabase
    .from(CATEGORIES_TABLE)
    .update({ is_active: true })
    .eq('workspace_id', finalWorkspaceId)
    .eq('key', key);
}

export async function deactivateClientErpCategory(key, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);

  return supabase
    .from(CATEGORIES_TABLE)
    .update({ is_active: false })
    .eq('workspace_id', finalWorkspaceId)
    .eq('key', key);
}

export async function countClientItemsUsingCategory(typeKey, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);

  return supabase
    .from(ITEMS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', finalWorkspaceId)
    .eq('type_key', typeKey);
}

export async function deleteClientErpCategoryIfUnused(typeKey, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);
  const countRes = await countClientItemsUsingCategory(typeKey, finalWorkspaceId);

  if (countRes.error) throw countRes.error;

  if ((countRes.count || 0) > 0) {
    throw new Error('This category is used by existing ERP items. Deactivate it instead.');
  }

  return supabase
    .from(CATEGORIES_TABLE)
    .delete()
    .eq('workspace_id', finalWorkspaceId)
    .eq('key', typeKey);
}

export function buildClientErpItemPayload(form, categoryDef, workspaceId) {
  if (!workspaceId) throw new Error('Workspace is required.');
  if (!form.name?.trim()) throw new Error('Name is required.');
  if (!categoryDef) throw new Error('Item category is required.');

  const price = Number(form.price || 0);
  const stock = form.stock === '' ? null : Number(form.stock);

  if (price < 0) throw new Error('Price cannot be negative.');

  if (categoryDef.has_stock && stock !== null && stock < 0) {
    throw new Error('Stock cannot be negative.');
  }

  return {
    workspace_id: workspaceId,
    name: form.name.trim(),
    sku: form.sku?.trim() || null,
    type: categoryDef.label,
    type_key: categoryDef.key,
    category: form.category?.trim() || null,
    price,
    currency: 'PHP',
    stock: categoryDef.has_stock ? stock : null,
    status: form.status || 'active',
    description: form.description?.trim() || null,
  };
}

export async function createClientErpItem(form, categoryDef, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);
  const payload = buildClientErpItemPayload(form, categoryDef, finalWorkspaceId);

  return supabase
    .from(ITEMS_TABLE)
    .insert(payload)
    .select()
    .single();
}

export async function updateClientErpItem(id, form, categoryDef, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);
  const payload = buildClientErpItemPayload(form, categoryDef, finalWorkspaceId);

  return supabase
    .from(ITEMS_TABLE)
    .update(payload)
    .eq('workspace_id', finalWorkspaceId)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteClientErpItem(id, workspaceId = null) {
  const finalWorkspaceId = await getWritableWorkspaceId(workspaceId);

  return supabase
    .from(ITEMS_TABLE)
    .delete()
    .eq('workspace_id', finalWorkspaceId)
    .eq('id', id);
}

export function formatPhp(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function getDisplayCategory(item, categories = []) {
  const category = getCategoryForItem(item, categories);
  return category?.label || item.type || 'N/A';
}

export function getAvailabilityText(item, categories = []) {
  const category = getCategoryForItem(item, categories);

  if (item.status === 'inactive' || item.status === 'discontinued') {
    return 'Not available';
  }

  if (!category) {
    return item.status === 'active' ? 'Available' : 'Not available';
  }

  if (category.availability_mode === 'status') {
    return item.status === 'active' ? 'Available' : 'Not available';
  }

  if (category.availability_mode === 'stock') {
    if (Number(item.stock || 0) === 0) return 'Out of stock';
    return item.stock;
  }

  return 'N/A';
}

export function getAvailabilityClass(item, categories = []) {
  const category = getCategoryForItem(item, categories);

  if (item.status === 'inactive' || item.status === 'discontinued') {
    return 'badge-stock badge-danger';
  }

  if (!category) return 'badge-stock badge-neutral';

  if (category.availability_mode === 'status') {
    return item.status === 'active'
      ? 'badge-stock badge-good'
      : 'badge-stock badge-danger';
  }

  if (category.availability_mode === 'stock') {
    if (Number(item.stock || 0) === 0) return 'badge-stock badge-danger';
    if (Number(item.stock || 0) <= 10) return 'badge-stock badge-warning';
    return 'badge-stock badge-good';
  }

  return 'badge-stock badge-neutral';
}

export function getStatusClass(status = '') {
  if (status === 'active') return 'badge-status badge-active';
  if (status === 'inactive') return 'badge-status badge-inactive';
  if (status === 'discontinued') return 'badge-status badge-discontinued';
  return 'badge-status badge-neutral';
}

export function getCategoryStatusClass(isActive) {
  return isActive
    ? 'badge-status badge-active'
    : 'badge-status badge-inactive';
}

export function buildClientErpStats(items = [], categories = []) {
  const stockTrackedItems = items.filter((item) => {
    const category = getCategoryForItem(item, categories);
    return category?.has_stock;
  });

  const nonStockItems = items.filter((item) => {
    const category = getCategoryForItem(item, categories);
    return category && !category.has_stock;
  });

  const activeItems = items.filter((item) => item.status === 'active');

  const inactiveOrDiscontinued = items.filter((item) =>
    ['inactive', 'discontinued'].includes(item.status)
  );

  const outOfStockItems = items.filter((item) => {
    const category = getCategoryForItem(item, categories);

    return (
      category?.has_stock &&
      item.status === 'active' &&
      Number(item.stock || 0) === 0
    );
  });

  const unavailableItems = items.filter((item) => item.status !== 'active');

  return {
    totalProducts: stockTrackedItems.length,
    totalServices: nonStockItems.length,
    activeItems: activeItems.length,
    inactiveOrDiscontinued: inactiveOrDiscontinued.length,
    outOfStockHardware: outOfStockItems.length,
    unavailableAddons: unavailableItems.length,
  };
}
