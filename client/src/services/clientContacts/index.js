import { supabase } from "../../config/supabaseClient";

export const CLIENT_CONTACT_TYPES = ["person", "company"];

export const CLIENT_CONTACT_STATUSES = [
  "lead",
  "prospect",
  "customer",
  "archived",
];

export const CLIENT_CONTACT_SOURCES = [
  "manual",
  "referral",
  "website",
  "social_media",
  "cold_outreach",
  "event",
  "landing_page",
  "demo_request",
];

function requireWorkspaceId(workspaceId) {
  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user?.id) {
    throw new Error("Authenticated user is required.");
  }

  return user.id;
}

export function normalizeClientContact(contact, relatedDeals = []) {
  return {
    id: contact.id,
    workspace_id: contact.workspace_id,

    name: contact.full_name || "Unnamed Contact",
    full_name: contact.full_name || "Unnamed Contact",

    company: contact.company_name || "",
    company_name: contact.company_name || "",

    email: contact.email || "",
    phone: contact.phone || "",

    type: contact.company_name ? "company" : "person",
    status: contact.status || "lead",
    source: contact.source || "manual",

    created_by: contact.created_by || null,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    last_activity_at: contact.updated_at || contact.created_at,

    related_deals: relatedDeals.map((deal) => ({
      id: deal.id,
      title: deal.title || "Untitled Deal",
      value: Number(deal.expected_revenue || 0),
      status: deal.status || "open",
      stage: deal.stage || "new",
      probability: Number(deal.probability || 0),
      expected_close_date: deal.expected_close_date,
    })),

    activities: [],
    tags: [],
    job_title: "",
  };
}

export async function getClientContactsData(workspaceId) {
  requireWorkspaceId(workspaceId);

  const { data: contacts, error: contactsError } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (contactsError) throw contactsError;

  const { data: deals, error: dealsError } = await supabase
    .from("client_deals")
    .select(`
      id,
      workspace_id,
      contact_id,
      title,
      expected_revenue,
      probability,
      status,
      stage,
      expected_close_date,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId);

  if (dealsError) throw dealsError;

  const dealsByContactId = (deals || []).reduce((acc, deal) => {
    if (!deal.contact_id) return acc;

    acc[deal.contact_id] = acc[deal.contact_id] || [];
    acc[deal.contact_id].push(deal);

    return acc;
  }, {});

  return {
    contacts: (contacts || []).map((contact) =>
      normalizeClientContact(contact, dealsByContactId[contact.id] || [])
    ),
    types: CLIENT_CONTACT_TYPES,
    statuses: CLIENT_CONTACT_STATUSES,
    sources: CLIENT_CONTACT_SOURCES,
  };
}

export async function getClientContactById(id, workspaceId) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Contact ID is required.");
  }

  const { data: contact, error } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!contact) return null;

  const { data: deals, error: dealsError } = await supabase
    .from("client_deals")
    .select(`
      id,
      workspace_id,
      contact_id,
      title,
      expected_revenue,
      probability,
      status,
      stage,
      expected_close_date,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId)
    .eq("contact_id", id);

  if (dealsError) throw dealsError;

  return normalizeClientContact(contact, deals || []);
}

export async function createClientContact(workspaceId, contact) {
  requireWorkspaceId(workspaceId);

  const userId = await getCurrentUserId();

  const payload = cleanPayload({
    workspace_id: workspaceId,
    full_name: contact.name || contact.full_name,
    email: contact.email || null,
    phone: contact.phone || null,
    company_name: contact.company || contact.company_name || null,
    source: contact.source || "manual",
    status: contact.status || "lead",
    created_by: userId,
  });

  if (!payload.full_name) {
    throw new Error("Full name is required.");
  }

  const { data, error } = await supabase
    .from("client_contacts")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return normalizeClientContact(data);
}

export async function updateClientContact(id, workspaceId, contact) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Contact ID is required.");
  }

  const payload = cleanPayload({
    full_name: contact.name ?? contact.full_name,
    email: contact.email,
    phone: contact.phone,
    company_name: contact.company ?? contact.company_name,
    source: contact.source,
    status: contact.status,
  });

  const { data, error } = await supabase
    .from("client_contacts")
    .update(payload)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) throw error;

  return normalizeClientContact(data);
}

export async function deleteClientContact(id, workspaceId) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Contact ID is required.");
  }

  const { error } = await supabase
    .from("client_contacts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  return true;
}

export async function archiveClientContact(id, workspaceId) {
  return updateClientContact(id, workspaceId, {
    status: "archived",
  });
}
