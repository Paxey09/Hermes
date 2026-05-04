import { supabase } from '../../config/supabaseClient';

const ITEMS_TABLE = 'erp_items';
const TYPES_TABLE = 'erp_item_types';

export const ERP_AVAILABILITY_MODE_OPTIONS = [
  { value: 'status', label: 'Status-based' },
  { value: 'stock', label: 'Stock-based' },
];

export async function getErpTypes({ activeOnly = false, search = '' } = {}) {
  let query = supabase
    .from(TYPES_TABLE)
    .select('key,label,has_stock,availability_mode,is_active,created_at')
    .order('label', { ascending: true });

  if (activeOnly) query = query.eq('is_active', true);

  if (search?.trim()) {
    const value = search.trim();
    query = query.or(`key.ilike.%${value}%,label.ilike.%${value}%`);
  }

  return query;
}

export async function getErpItems(filters = {}) {
  let query = supabase
    .from(ITEMS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

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

export async function loadErpData(filters = {}, typeFilters = {}) {
  const typesRes = await getErpTypes({
    activeOnly: false,
    search: typeFilters.search || '',
  });

  if (typesRes.error) throw typesRes.error;

  const itemsRes = await getErpItems(filters);

  if (itemsRes.error) throw itemsRes.error;

  return {
    types: typesRes.data || [],
    items: itemsRes.data || [],
  };
}

export function getActiveTypes(types = []) {
  return types.filter((type) => type.is_active !== false);
}

export function normalizeTypeKey(value = '') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getTypeForItem(item, types = []) {
  return types.find((type) => type.key === item.type_key) || null;
}

export function buildErpTypePayload(form, { editing = false } = {}) {
  if (!form.key?.trim()) throw new Error('Type key is required');
  if (!form.label?.trim()) throw new Error('Type label is required');
  if (!form.availability_mode) throw new Error('Availability mode is required');

  const key = normalizeTypeKey(form.key);
  if (!key) throw new Error('Type key is invalid');

  const payload = {
    label: form.label.trim(),
    has_stock: Boolean(form.has_stock),
    availability_mode: form.availability_mode,
    is_active: form.is_active !== false,
  };

  if (!editing) payload.key = key;

  return payload;
}

export async function createErpType(form) {
  const payload = buildErpTypePayload(form);

  return supabase
    .from(TYPES_TABLE)
    .insert(payload)
    .select()
    .single();
}

export async function updateErpType(key, form) {
  const payload = buildErpTypePayload(form, { editing: true });

  return supabase
    .from(TYPES_TABLE)
    .update(payload)
    .eq('key', key)
    .select()
    .single();
}

export async function activateErpType(key) {
  return supabase.from(TYPES_TABLE).update({ is_active: true }).eq('key', key);
}

export async function deactivateErpType(key) {
  return supabase.from(TYPES_TABLE).update({ is_active: false }).eq('key', key);
}

export async function countItemsUsingType(typeKey) {
  return supabase
    .from(ITEMS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('type_key', typeKey);
}

export async function deleteErpTypeIfUnused(typeKey) {
  const countRes = await countItemsUsingType(typeKey);

  if (countRes.error) throw countRes.error;

  if ((countRes.count || 0) > 0) {
    throw new Error(
      'This type is used by existing ERP items. Deactivate it instead.'
    );
  }

  return supabase.from(TYPES_TABLE).delete().eq('key', typeKey);
}

export function buildErpItemPayload(form, typeDef) {
  if (!form.name?.trim()) throw new Error('Name is required');
  if (!typeDef) throw new Error('Item type is required');

  const price = Number(form.price || 0);
  const stock = form.stock === '' ? null : Number(form.stock);

  if (price < 0) throw new Error('Price cannot be negative');

  if (typeDef.has_stock && stock !== null && stock < 0) {
    throw new Error('Stock cannot be negative');
  }

  return {
    name: form.name.trim(),
    sku: form.sku?.trim() || null,
    type: typeDef.label,
    type_key: typeDef.key,
    category: form.category?.trim() || null,
    price,
    currency: 'PHP',
    stock: typeDef.has_stock ? stock : null,
    status: form.status || 'active',
    description: form.description?.trim() || null,
  };
}

export async function createErpItem(form, typeDef) {
  const payload = buildErpItemPayload(form, typeDef);

  return supabase
    .from(ITEMS_TABLE)
    .insert(payload)
    .select()
    .single();
}

export async function updateErpItem(id, form, typeDef) {
  const payload = buildErpItemPayload(form, typeDef);

  return supabase
    .from(ITEMS_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteErpItem(id) {
  return supabase.from(ITEMS_TABLE).delete().eq('id', id);
}

export function formatPhp(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function getDisplayType(item, types = []) {
  const type = getTypeForItem(item, types);
  return type?.label || item.type || 'N/A';
}

export function getAvailabilityText(item, types = []) {
  const type = getTypeForItem(item, types);

  if (item.status === 'inactive' || item.status === 'discontinued') {
    return 'Not available';
  }

  if (!type) {
    return item.status === 'active' ? 'Available' : 'Not available';
  }

  if (type.availability_mode === 'status') {
    return item.status === 'active' ? 'Available' : 'Not available';
  }

  if (type.availability_mode === 'stock') {
    if (Number(item.stock || 0) === 0) return 'Out of stock';
    return item.stock;
  }

  return 'N/A';
}

export function getAvailabilityClass(item, types = []) {
  const type = getTypeForItem(item, types);

  if (item.status === 'inactive' || item.status === 'discontinued') {
    return 'badge-stock badge-danger';
  }

  if (!type) return 'badge-stock badge-neutral';

  if (type.availability_mode === 'status') {
    return item.status === 'active'
      ? 'badge-stock badge-good'
      : 'badge-stock badge-danger';
  }

  if (type.availability_mode === 'stock') {
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

export function getTypeStatusClass(isActive) {
  return isActive
    ? 'badge-status badge-active'
    : 'badge-status badge-inactive';
}

export function buildErpStats(items = [], types = []) {
  const products = items.filter((item) => {
    const type = getTypeForItem(item, types);
    return type?.has_stock;
  });

  const services = items.filter((item) => {
    const type = getTypeForItem(item, types);
    return type && !type.has_stock;
  });

  const activeItems = items.filter((item) => item.status === 'active');

  const inactiveOrDiscontinued = items.filter((item) =>
    ['inactive', 'discontinued'].includes(item.status)
  );

  const outOfStockItems = items.filter((item) => {
    const type = getTypeForItem(item, types);

    return (
      type?.has_stock &&
      item.status === 'active' &&
      Number(item.stock || 0) === 0
    );
  });

  const unavailableItems = items.filter((item) => item.status !== 'active');

  return {
    totalProducts: products.length,
    totalServices: services.length,
    activeItems: activeItems.length,
    inactiveOrDiscontinued: inactiveOrDiscontinued.length,
    outOfStockHardware: outOfStockItems.length,
    unavailableAddons: unavailableItems.length,
  };
}
