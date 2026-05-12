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
  new: "#4a90d9",
  qualified: "#f5a623",
  proposal: "#9b59b6",
  negotiation: "#e67e22",
  won: "#27ae60",
  lost: "#95a5a6",
};

export const CLIENT_DEAL_STAGE_PROBABILITIES = {
  new: 10,
  qualified: 30,
  proposal: 60,
  negotiation: 80,
  won: 100,
  lost: 0,
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

function resolveStatusFromStage(stage, fallback = "open") {
  if (stage === "won") return "won";
  if (stage === "lost") return "lost";
  return fallback || "open";
}

export function normalizeClientDeal(deal) {
  return {
    id: deal.id,
    workspace_id: deal.workspace_id,

    title: deal.title || "Untitled Deal",

    lead_id: deal.lead_id || null,
    contact_id: deal.contact?.id || deal.contact_id || null,

    company: deal.contact?.company_name || "No company",
    contact_name: deal.contact?.full_name || "Unknown contact",
    email: deal.contact?.email || "",
    phone: deal.contact?.phone || "",

    stage: deal.stage || "new",
    stageName: CLIENT_DEAL_STAGE_LABELS[deal.stage] || "New",

    value: Number(deal.expected_revenue || 0),
    expected_revenue: Number(deal.expected_revenue || 0),

    probability: Number(
      deal.probability ?? CLIENT_DEAL_STAGE_PROBABILITIES[deal.stage] ?? 0
    ),

    owner: "Unassigned",
    source: deal.source || "manual",
    status: deal.status || "open",

    expected_close_date: deal.expected_close_date,
    description: deal.description || "",

    created_by: deal.created_by || null,
    created_at: deal.created_at,
    updated_at: deal.updated_at || deal.created_at,

    tags: [],
    activities: [],
  };
}

export async function getClientDealMeta(workspaceId) {
  requireWorkspaceId(workspaceId);

  const { data: contacts, error } = await supabase
    .from("client_contacts")
    .select("id, full_name, email, phone, company_name, source, status")
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (error) throw error;

  return {
    stages: CLIENT_DEAL_STAGES,
    stageLabels: CLIENT_DEAL_STAGE_LABELS,
    stageColors: CLIENT_DEAL_STAGE_COLORS,
    stageProbabilities: CLIENT_DEAL_STAGE_PROBABILITIES,
    contacts: contacts || [],
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
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return {
    deals: (deals || []).map(normalizeClientDeal),
    stages: CLIENT_DEAL_STAGES,
    stageLabels: CLIENT_DEAL_STAGE_LABELS,
    stageColors: CLIENT_DEAL_STAGE_COLORS,
    stageProbabilities: CLIENT_DEAL_STAGE_PROBABILITIES,
    salespersons: ["Unassigned"],
    sources: CLIENT_DEAL_SOURCES,
    rawStages: CLIENT_DEAL_STAGES.map((key, index) => ({
      id: key,
      key,
      name: CLIENT_DEAL_STAGE_LABELS[key],
      sort_order: index + 1,
      probability: CLIENT_DEAL_STAGE_PROBABILITIES[key],
      is_won: key === "won",
      is_lost: key === "lost",
    })),
  };
}

export async function getClientDealById(id, workspaceId) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Deal ID is required.");
  }

  const { data, error } = await supabase
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

  return data ? normalizeClientDeal(data) : null;
}

export async function createClientDeal(workspaceId, deal) {
  requireWorkspaceId(workspaceId);

  const stage = deal.stage || "new";
  const status = deal.status || resolveStatusFromStage(stage, "open");

  const payload = cleanPayload({
    workspace_id: workspaceId,
    lead_id: deal.lead_id || null,
    contact_id: deal.contact_id || null,
    title: deal.title,
    stage,
    expected_revenue: deal.value ?? deal.expected_revenue ?? 0,
    probability:
      deal.probability ?? CLIENT_DEAL_STAGE_PROBABILITIES[stage] ?? 0,
    status,
    expected_close_date: deal.expected_close_date || null,
    description: deal.description || null,
    source: deal.source || "manual",
    created_by: deal.created_by,
  });

  if (!payload.title) {
    throw new Error("Deal title is required.");
  }

  const { data, error } = await supabase
    .from("client_deals")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateClientDeal(id, workspaceId, deal) {
  requireWorkspaceId(workspaceId);

  if (!id) {
    throw new Error("Deal ID is required.");
  }

  const nextStage = deal.stage;
  const payload = cleanPayload({
    lead_id: deal.lead_id,
    contact_id: deal.contact_id,
    title: deal.title,
    stage: nextStage,
    expected_revenue: deal.value ?? deal.expected_revenue,
    probability:
      deal.probability ??
      (nextStage ? CLIENT_DEAL_STAGE_PROBABILITIES[nextStage] : undefined),
    status:
      deal.status ??
      (nextStage ? resolveStatusFromStage(nextStage, undefined) : undefined),
    expected_close_date:
      deal.expected_close_date === "" ? null : deal.expected_close_date,
    description: deal.description,
    source: deal.source,
  });

  const { data, error } = await supabase
    .from("client_deals")
    .update(payload)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateClientDealStage(id, workspaceId, stage) {
  if (!CLIENT_DEAL_STAGES.includes(stage)) {
    throw new Error(`Invalid deal stage: ${stage}`);
  }

  return updateClientDeal(id, workspaceId, {
    stage,
    probability: CLIENT_DEAL_STAGE_PROBABILITIES[stage],
    status: resolveStatusFromStage(stage, "open"),
  });
}

export async function markClientDealWon(id, workspaceId) {
  return updateClientDealStage(id, workspaceId, "won");
}

export async function markClientDealLost(id, workspaceId) {
  return updateClientDealStage(id, workspaceId, "lost");
}

export async function archiveClientDeal(id, workspaceId) {
  return updateClientDeal(id, workspaceId, {
    status: "lost",
    stage: "lost",
    probability: 0,
  });
}
