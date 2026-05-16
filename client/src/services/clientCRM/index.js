import { supabase } from "../../config/supabaseClient";
import {
  CLIENT_DEAL_STAGES,
  CLIENT_DEAL_STAGE_LABELS,
  CLIENT_DEAL_STAGE_COLORS,
  CLIENT_DEAL_STAGE_PROBABILITIES,
  normalizeClientDeal,
} from "../clientDeals";

function requireWorkspaceId(workspaceId) {
  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }
}

export function buildClientCRMKPIs(deals) {
  const open = deals.filter((deal) => deal.status === "open");
  const won = deals.filter((deal) => deal.status === "won");
  const lost = deals.filter((deal) => deal.status === "lost");

  const openPipelineValue = open.reduce(
    (sum, deal) => sum + Number(deal.value || 0),
    0
  );

  const weightedPipeline = open.reduce(
    (sum, deal) =>
      sum + Number(deal.value || 0) * (Number(deal.probability || 0) / 100),
    0
  );

  const wonRevenue = won.reduce(
    (sum, deal) => sum + Number(deal.value || 0),
    0
  );

  const conversionRate =
    deals.length > 0 ? Math.round((won.length / deals.length) * 100) : 0;

  return {
    totalDeals: deals.length,
    openDeals: open.length,
    wonDeals: won.length,
    lostDeals: lost.length,
    openPipelineValue,
    weightedPipeline,
    wonRevenue,
    conversionRate,
  };
}

export async function getClientCRMData(workspaceId) {
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

  const normalizedDeals = (deals || []).map(normalizeClientDeal);

  const stages = CLIENT_DEAL_STAGES.map((key, index) => ({
    id: key,
    key,
    name: CLIENT_DEAL_STAGE_LABELS[key],
    color: CLIENT_DEAL_STAGE_COLORS[key],
    sort_order: index + 1,
    probability: CLIENT_DEAL_STAGE_PROBABILITIES[key],
    is_won: key === "won",
    is_lost: key === "lost",
  }));

  const recentActivities = normalizedDeals
    .slice()
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 6)
    .map((deal) => ({
      id: `activity_${deal.id}`,
      type:
        deal.status === "won"
          ? "won"
          : deal.status === "lost"
            ? "lost"
            : "updated",
      title: deal.title,
      company: deal.company,
      stageName: CLIENT_DEAL_STAGE_LABELS[deal.stage] || deal.stage,
      status: deal.status,
      date: deal.updated_at,
    }));

  return {
    stages,
    opportunities: normalizedDeals.map((deal) => ({
      id: deal.id,
      workspace_id: deal.workspace_id,

      name: deal.title,
      title: deal.title,

      company: deal.company,
      contact: deal.contact_name,
      contact_id: deal.contact_id,
      email: deal.email,
      phone: deal.phone,

      stage: deal.stage,
      stageName: CLIENT_DEAL_STAGE_LABELS[deal.stage] || deal.stage,
      stageSortOrder:
        stages.find((stage) => stage.key === deal.stage)?.sort_order || 0,

      revenue: Number(deal.value || 0),
      probability: Number(deal.probability || 0),

      status: deal.status || "open",
      source: deal.source || "manual",
      description: deal.description || "",
      expectedCloseDate: deal.expected_close_date,

      createdAt: deal.created_at,
      updatedAt: deal.updated_at || deal.created_at,
    })),
    deals: normalizedDeals,
    recentActivities,
    kpis: buildClientCRMKPIs(normalizedDeals),
    stageLabels: CLIENT_DEAL_STAGE_LABELS,
    stageColors: CLIENT_DEAL_STAGE_COLORS,
  };
}
