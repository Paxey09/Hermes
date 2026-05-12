import { supabase } from "../../config/supabaseClient";

export const DEAL_STAGE_COLORS = {
  new: "#4a90d9",
  discovery: "#4a90d9",
  qualified: "#f5a623",
  proposal: "#9b59b6",
  negotiation: "#e67e22",
  won: "#27ae60",
  lost: "#95a5a6",
};

export const DEAL_SOURCES = [
  "manual",
  "referral",
  "website",
  "social_media",
  "cold_outreach",
  "event",
  "landing_page",
  "demo_request",
];

function normalizeDeal(opp) {
  return {
    id: opp.id,
    title: opp.title || "Untitled Deal",
    company: opp.contact?.company_name || "No company",
    contact_id: opp.contact?.id || opp.contact_id || null,
    contact_name: opp.contact?.full_name || "Unknown contact",
    email: opp.contact?.email || "",
    phone: opp.contact?.phone || "",
    stage_id: opp.stage?.id || opp.stage_id || null,
    stage: opp.stage?.key || "new",
    value: Number(opp.expected_revenue || 0),
    probability: Number(opp.probability || opp.stage?.probability || 0),
    owner: "Unassigned",
    source: opp.source || "manual",
    status: opp.status || "open",
    expected_close_date: opp.expected_close_date,
    description: opp.description || "",
    updated_at: opp.updated_at || opp.created_at,
    created_at: opp.created_at,
    tags: [],
    activities: [],
  };
}

export async function getDealMeta() {
  const { data: stages, error: stagesError } = await supabase
    .from("crm_stages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (stagesError) throw stagesError;

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, full_name, email, phone, company_name, source, status")
    .order("full_name", { ascending: true });

  if (contactsError) throw contactsError;

  return {
    stages: stages || [],
    contacts: contacts || [],
    sources: DEAL_SOURCES,
  };
}

export async function getDealsData() {
  const { data: stages, error: stagesError } = await supabase
    .from("crm_stages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (stagesError) throw stagesError;

  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("crm_opportunities")
    .select(`
      id,
      title,
      contact_id,
      stage_id,
      expected_revenue,
      probability,
      status,
      source,
      description,
      expected_close_date,
      created_at,
      updated_at,
      contact:contacts (
        id,
        full_name,
        email,
        phone,
        company_name
      ),
      stage:crm_stages (
        id,
        key,
        name,
        sort_order,
        probability,
        is_won,
        is_lost
      )
    `)
    .order("updated_at", { ascending: false });

  if (opportunitiesError) throw opportunitiesError;

  const stageKeys = (stages || []).map((stage) => stage.key);

  const stageLabels = (stages || []).reduce((acc, stage) => {
    acc[stage.key] = stage.name;
    return acc;
  }, {});

  const stageColors = (stages || []).reduce((acc, stage) => {
    acc[stage.key] = DEAL_STAGE_COLORS[stage.key] || "#4a90d9";
    return acc;
  }, {});

  return {
    deals: (opportunities || []).map(normalizeDeal),
    stages: stageKeys,
    stageLabels,
    stageColors,
    salespersons: ["Unassigned"],
    sources: DEAL_SOURCES,
    rawStages: stages || [],
  };
}

export async function createDeal(deal) {
  const payload = {
    title: deal.title,
    contact_id: deal.contact_id || null,
    stage_id: deal.stage_id || null,
    expected_revenue: deal.value || deal.expected_revenue || 0,
    probability: deal.probability || 0,
    status: deal.status || "open",
    source: deal.source || "manual",
    expected_close_date: deal.expected_close_date || null,
    description: deal.description || null,
  };

  const { data, error } = await supabase
    .from("crm_opportunities")
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function updateDeal(id, data) {
  const payload = {
    title: data.title,
    contact_id: data.contact_id,
    stage_id: data.stage_id,
    expected_revenue: data.value ?? data.expected_revenue,
    probability: data.probability,
    status: data.status,
    source: data.source,
    expected_close_date: data.expected_close_date || null,
    description: data.description,
    updated_at: new Date().toISOString(),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  const { data: updated, error } = await supabase
    .from("crm_opportunities")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return updated;
}

export async function deleteDeal(id) {
  const { error } = await supabase
    .from("crm_opportunities")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return { id };
}

export async function markDealWon(id) {
  const { data: wonStage, error } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("is_won", true)
    .maybeSingle();

  if (error) throw error;

  return updateDeal(id, {
    status: "won",
    probability: 100,
    stage_id: wonStage?.id,
  });
}

export async function markDealLost(id) {
  const { data: lostStage, error } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("is_lost", true)
    .maybeSingle();

  if (error) throw error;

  return updateDeal(id, {
    status: "lost",
    probability: 0,
    stage_id: lostStage?.id,
  });
}
