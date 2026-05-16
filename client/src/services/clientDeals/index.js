import { supabase } from "../../config/supabaseClient";

export const CLIENT_DEAL_STAGES = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const CLIENT_DEAL_STAGE_LABELS = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const CLIENT_DEAL_STAGE_COLORS = {
  new: "var(--brand-cyan)",
  qualified: "var(--brand-cyan)",
  proposal: "var(--brand-gold)",
  negotiation: "var(--brand-gold)",
  won: "var(--success)",
  lost: "var(--danger)",
};

export const CLIENT_DEAL_STAGE_PROBABILITIES = {
  new: 10,
  qualified: 35,
  proposal: 55,
  negotiation: 75,
  won: 100,
  lost: 0,
};

export const CLIENT_DEAL_STATUSES = [
  "open",
  "won",
  "lost",
  "archived",
];

export const CLIENT_DEAL_STATUS_LABELS = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

export const CLIENT_DEAL_STATUS_COLORS = {
  open: "var(--brand-cyan)",
  won: "var(--success)",
  lost: "var(--danger)",
  archived: "var(--text-muted)",
};

export const CLIENT_DEAL_SOURCES = [
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

export function normalizeClientDeal(deal) {
  const contact = deal.contact || deal.client_contacts || null;

  return {
    id: deal.id,
    workspace_id: deal.workspace_id,
    lead_id: deal.lead_id || null,
    contact_id: deal.contact_id || null,

    title: deal.title || "Untitled Deal",
    name: deal.title || "Untitled Deal",

    stage: deal.stage || "new",
    stageName: CLIENT_DEAL_STAGE_LABELS[deal.stage] || deal.stage || "New",
    stageColor:
      CLIENT_DEAL_STAGE_COLORS[deal.stage] || CLIENT_DEAL_STAGE_COLORS.new,

    status: deal.status || "open",
    statusName: CLIENT_DEAL_STATUS_LABELS[deal.status] || deal.status || "Open",
    statusColor:
      CLIENT_DEAL_STATUS_COLORS[deal.status] || CLIENT_DEAL_STATUS_COLORS.open,

    expected_revenue: Number(deal.expected_revenue || 0),
    value: Number(deal.expected_revenue || 0),

    probability: Number(deal.probability || 0),
    expected_close_date: deal.expected_close_date || null,
    description: deal.description || "",
    source: deal.source || "manual",

    created_by: deal.created_by || null,
    created_at: deal.created_at,
    updated_at: deal.updated_at,

    contact: contact
      ? {
          id: contact.id,
          full_name: contact.full_name || "",
          name: contact.full_name || "",
          email: contact.email || "",
          phone: contact.phone || "",
          company_name: contact.company_name || "",
          company: contact.company_name || "",
        }
      : null,

    contact_name: contact?.full_name || "",
    company_name: contact?.company_name || "",
  };
}

export function buildClientCRMKPIs(deals) {
  const open = deals.filter((deal) => deal.status === "open");
  const won = deals.filter((deal) => deal.status === "won");
  const lost = deals.filter((deal) => deal.status === "lost");

  const pipelineValue = open.reduce(
    (sum, deal) => sum + Number(deal.expected_revenue || deal.value || 0),
    0
  );

  const wonValue = won.reduce(
    (sum, deal) => sum + Number(deal.expected_revenue || deal.value || 0),
    0
  );

  const conversionRate =
    deals.length > 0 ? Math.round((won.length / deals.length) * 100) : 0;

  return {
    totalDeals: deals.length,
    openDeals: open.length,
    wonDeals: won.length,
    lostDeals: lost.length,
    pipelineValue,
    wonValue,
    conversionRate,
  };
}

export async function getClientDealLookups(workspaceId) {
  requireWorkspaceId(workspaceId);

  const { data: contacts, error } = await supabase
    .from("client_contacts")
    .select(`
      id,
      workspace_id,
      full_name,
      email,
      phone,
      company_name,
      status,
      source
    `)
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (error) throw error;

  return {
    contacts: contacts || [],
    stages: CLIENT_DEAL_STAGES,
    stageLabels: CLIENT_DEAL_STAGE_LABELS,
    stageColors: CLIENT_DEAL_STAGE_COLORS,
    stageProbabilities: CLIENT_DEAL_STAGE_PROBABILITIES,
    statuses: CLIENT_DEAL_STATUSES,
    statusLabels: CLIENT_DEAL_STATUS_LABELS,
    statusColors: CLIENT_DEAL_STATUS_COLORS,
    sources: CLIENT_DEAL_SOURCES,
  };
}

export async function getClientDealsData(workspaceId) {
  requireWorkspaceId(workspaceId);

  const { data: deals, error } = await supabase
    .from("client_deals")
    .select(`
      id,
      workspace_id,
      lead_id,
      contact_id,
      title,
      stage,
      expected_revenue,
      probability,
      status,
      expected_close_date,
      description,
      source,
      created_by,
      created_at,
      updated_at,
      contact:client_contacts (
        id,
        full_name,
        email,
        phone,
        company_name
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const normalizedDeals = (deals || []).map(normalizeClientDeal);

  return {
    deals: normalizedDeals,
    kpis: buildClientCRMKPIs(normalizedDeals),
    stages: CLIENT_DEAL_STAGES,
    stageLabels: CLIENT_DEAL_STAGE_LABELS,
    stageColors: CLIENT_DEAL_STAGE_COLORS,
    stageProbabilities: CLIENT_DEAL_STAGE_PROBABILITIES,
    statuses: CLIENT_DEAL_STATUSES,
    statusLabels: CLIENT_DEAL_STATUS_LABELS,
    statusColors: CLIENT_DEAL_STATUS_COLORS,
    sources: CLIENT_DEAL_SOURCES,
  };
}

export async function getClientDealById(id, workspaceId) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Deal ID is required.");
  }

  const { data: deal, error } = await supabase
    .from("client_deals")
    .select(`
      id,
      workspace_id,
      lead_id,
      contact_id,
      title,
      stage,
      expected_revenue,
      probability,
      status,
      expected_close_date,
      description,
      source,
      created_by,
      created_at,
      updated_at,
      contact:client_contacts (
        id,
        full_name,
        email,
        phone,
        company_name
      )
    `)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!deal) return null;

  return normalizeClientDeal(deal);
}

export async function createClientDeal(workspaceId, deal) {
  requireWorkspaceId(workspaceId);

  const userId = await getCurrentUserId();
  const stage = deal.stage || "new";

  const payload = cleanPayload({
    workspace_id: workspaceId,
    lead_id: deal.lead_id || null,
    contact_id: deal.contact_id || null,
    title: deal.title || deal.name,
    stage,
    expected_revenue: Number(deal.expected_revenue ?? deal.value ?? 0),
    probability: Number(
      deal.probability ?? CLIENT_DEAL_STAGE_PROBABILITIES[stage] ?? 0
    ),
    status: deal.status || (stage === "won" ? "won" : stage === "lost" ? "lost" : "open"),
    expected_close_date: deal.expected_close_date || null,
    description: deal.description || null,
    source: deal.source || "manual",
    created_by: userId,
  });

  if (!payload.title) {
    throw new Error("Deal title is required.");
  }

  const { data, error } = await supabase
    .from("client_deals")
    .insert(payload)
    .select(`
      id,
      workspace_id,
      lead_id,
      contact_id,
      title,
      stage,
      expected_revenue,
      probability,
      status,
      expected_close_date,
      description,
      source,
      created_by,
      created_at,
      updated_at,
      contact:client_contacts (
        id,
        full_name,
        email,
        phone,
        company_name
      )
    `)
    .single();

  if (error) throw error;

  return normalizeClientDeal(data);
}

export async function updateClientDeal(id, workspaceId, deal) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Deal ID is required.");
  }

  const nextStage = deal.stage;
  const impliedStatus =
    nextStage === "won" ? "won" : nextStage === "lost" ? "lost" : undefined;

  const payload = cleanPayload({
    lead_id: deal.lead_id,
    contact_id: deal.contact_id,
    title: deal.title ?? deal.name,
    stage: nextStage,
    expected_revenue:
      deal.expected_revenue !== undefined || deal.value !== undefined
        ? Number(deal.expected_revenue ?? deal.value ?? 0)
        : undefined,
    probability:
      deal.probability !== undefined
        ? Number(deal.probability)
        : nextStage
          ? CLIENT_DEAL_STAGE_PROBABILITIES[nextStage]
          : undefined,
    status: deal.status ?? impliedStatus,
    expected_close_date: deal.expected_close_date,
    description: deal.description,
    source: deal.source,
  });

  const { data, error } = await supabase
    .from("client_deals")
    .update(payload)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select(`
      id,
      workspace_id,
      lead_id,
      contact_id,
      title,
      stage,
      expected_revenue,
      probability,
      status,
      expected_close_date,
      description,
      source,
      created_by,
      created_at,
      updated_at,
      contact:client_contacts (
        id,
        full_name,
        email,
        phone,
        company_name
      )
    `)
    .single();

  if (error) throw error;

  return normalizeClientDeal(data);
}

export async function deleteClientDeal(id, workspaceId) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Deal ID is required.");
  }

  const { error } = await supabase
    .from("client_deals")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  return true;
}

export async function archiveClientDeal(id, workspaceId) {
  return updateClientDeal(id, workspaceId, {
    status: "archived",
  });
}

export async function markClientDealWon(id, workspaceId) {
  return updateClientDeal(id, workspaceId, {
    status: "won",
    stage: "won",
    probability: 100,
  });
}

export async function markClientDealLost(id, workspaceId) {
  return updateClientDeal(id, workspaceId, {
    status: "lost",
    stage: "lost",
    probability: 0,
  });
}

export async function getClientDealMeta(workspaceId) {
  return getClientDealLookups(workspaceId);
}

export async function updateClientDealStage(id, workspaceId, stage) {
  return updateClientDeal(id, workspaceId, {
    stage,
    probability: CLIENT_DEAL_STAGE_PROBABILITIES[stage] ?? 0,
    status: stage === "won" ? "won" : stage === "lost" ? "lost" : "open",
  });
}
