import { useEffect, useMemo, useState } from "react";
import { Brain, Sparkles, Target, Zap } from "lucide-react";

import { Card, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";

import {
  DealsHeader,
  DealsKPICards,
  DealsViewTabs,
  DealsFilterToolbar,
  DealsPipelineBoard,
  DealsListView,
  DealsForecastView,
  DealsLostView,
  DealDetailDrawer,
  DealsLoadingState,
  DealsErrorState,
} from "../../components/admin/layout/Admin_Deals_Components.jsx";

import {
  getDealsData,
  updateDeal,
  deleteDeal,
  markDealWon,
  markDealLost,
} from "../../services/sales_crm/deals";

import CreateDealModal from "../../components/admin/modals/CreateDealModal.jsx";

export default function AdminDeals() {
  const [activeView, setActiveView] = useState("pipeline");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [creatingDeal, setCreatingDeal] = useState(false);

  const [deals, setDeals] = useState([]);
  const [stages, setStages] = useState([]);
  const [rawStages, setRawStages] = useState([]);
  const [stageLabels, setStageLabels] = useState({});
  const [stageColors, setStageColors] = useState({});
  const [salespersons, setSalespersons] = useState([]);
  const [sources, setSources] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    stage: "all",
    owner: "all",
    source: "all",
    status: "all",
    sort: "updated_desc",
  });

  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dealPredictions, setDealPredictions] = useState({});

  useEffect(() => {
    loadDeals();
  }, []);

  async function loadDeals() {
    try {
      setLoading(true);
      setError("");

      const data = await getDealsData();

      setDeals(data.deals || []);
      setStages(data.stages || []);
      setRawStages(data.rawStages || []);
      setStageLabels(data.stageLabels || {});
      setStageColors(data.stageColors || {});
      setSalespersons(data.salespersons || []);
      setSources(data.sources || []);
      setAdmins(data.admins || []);
    } catch (err) {
      console.error("Deals load error:", err);
      setError(err.message || "Failed to load deals.");
    } finally {
      setLoading(false);
    }
  }

  async function generateAIInsights() {
    setAiLoading(true);

    try {
      const insights = await aiModules.generateBusinessInsights(
        {
          deals,
          stages,
          module: "deals",
        },
        "current_month"
      );

      setAiInsights(insights);
    } catch (err) {
      console.error("AI insights error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function predictDealOutcomes() {
    setAiLoading(true);

    try {
      const predictions = {};

      for (const deal of deals.slice(0, 5)) {
        const prediction = await aiModules.predictDealClose(deal);
        predictions[deal.id] = prediction;
      }

      setDealPredictions(predictions);
    } catch (err) {
      console.error("Deal prediction error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function draftDealEmail(deal) {
    if (!deal) return;

    setAiLoading(true);

    try {
      const email = await aiModules.draftOutreachEmail(deal, "follow_up");
      alert(`AI Drafted Email:\n\nSubject: ${email.subject}\n\n${email.body}`);
    } catch (err) {
      console.error("Email drafting error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  function openCreateModal() {
    setCreatingDeal(true);
  }

  function openEditModal(deal) {
    setSelectedDeal(null);
    setEditingDeal(deal);
  }

  async function handleStageChange(deal, stageKey) {
    const nextStage = rawStages.find((stage) => stage.key === stageKey);
    if (!nextStage) return;

    try {
      await updateDeal(deal.id, {
        stage_id: nextStage.id,
        probability: nextStage.probability,
        status: nextStage.is_won ? "won" : nextStage.is_lost ? "lost" : "open",
        assigned_admin_id: deal.assigned_admin_id || null,
      });

      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to update deal stage.");
    }
  }

  async function handleOwnerChange(deal, assignedAdminId) {
    try {
      await updateDeal(deal.id, {
        assigned_admin_id: assignedAdminId || null,
      });

      await loadDeals();

      setSelectedDeal((prev) =>
        prev
          ? {
              ...prev,
              assigned_admin_id: assignedAdminId || null,
              owner:
                admins.find((admin) => admin.id === assignedAdminId)
                  ?.full_name || "Unassigned",
            }
          : prev
      );
    } catch (err) {
      alert(err.message || "Failed to update deal owner.");
    }
  }

  async function handleDeleteDeal(deal) {
    const confirmed = window.confirm(`Delete "${deal.title}"?`);
    if (!confirmed) return;

    try {
      await deleteDeal(deal.id);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to delete deal.");
    }
  }

  async function handleMarkDealWon(deal) {
    try {
      await markDealWon(deal.id);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to mark deal as won.");
    }
  }

  async function handleMarkDealLost(deal) {
    try {
      await markDealLost(deal.id);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to mark deal as lost.");
    }
  }

  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        const search = filters.search.trim().toLowerCase();

        const matchesSearch =
          !search ||
          (deal.title || "").toLowerCase().includes(search) ||
          (deal.company || "").toLowerCase().includes(search) ||
          (deal.contact_name || "").toLowerCase().includes(search) ||
          (deal.email || "").toLowerCase().includes(search);

        return (
          matchesSearch &&
          (filters.stage === "all" || deal.stage === filters.stage) &&
          (filters.owner === "all" || deal.owner === filters.owner) &&
          (filters.source === "all" || deal.source === filters.source) &&
          (filters.status === "all" || deal.status === filters.status)
        );
      })
      .sort((a, b) => {
        if (filters.sort === "value_desc") {
          return Number(b.value || 0) - Number(a.value || 0);
        }

        if (filters.sort === "value_asc") {
          return Number(a.value || 0) - Number(b.value || 0);
        }

        if (filters.sort === "close_date") {
          return (
            new Date(a.expected_close_date || 0) -
            new Date(b.expected_close_date || 0)
          );
        }

        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      });
  }, [deals, filters]);

  return (
    <div className="min-w-0 space-y-6 text-[var(--text-primary)]">
      <DealsHeader onAddDeal={openCreateModal} />

      <Card className="min-w-0 overflow-hidden border border-[var(--brand-gold-border)] bg-[var(--bg-card)] shadow-sm">
        <div className="border-b border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--brand-gold)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              AI Deal Intelligence
            </h2>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] px-5 py-4">
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={Sparkles}
              loading={aiLoading}
              onClick={generateAIInsights}
              className="w-full border border-[var(--border-color)] bg-[var(--hover-bg)] !text-[var(--text-primary)] hover:bg-[var(--brand-gold-soft)] sm:w-auto"
            >
              Generate Insights
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Target}
              loading={aiLoading}
              onClick={predictDealOutcomes}
              className="w-full border border-[var(--border-color)] bg-[var(--hover-bg)] !text-[var(--text-primary)] hover:bg-[var(--brand-gold-soft)] sm:w-auto"
            >
              Predict Deals
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Zap}
              onClick={() => draftDealEmail(deals[0])}
              disabled={!deals.length}
              className="w-full border border-[var(--border-color)] bg-[var(--hover-bg)] !text-[var(--text-primary)] hover:bg-[var(--brand-gold-soft)] disabled:opacity-50 sm:w-auto"
            >
              Draft Email
            </Button>
          </div>

          {aiInsights && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {aiInsights.executiveSummary}
              </p>

              <div className="flex flex-wrap gap-2">
                {aiInsights.keyFindings?.slice(0, 3).map((finding, index) => (
                  <Badge key={index} variant="info" className="text-xs">
                    {finding}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {Object.keys(dealPredictions).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Deal Predictions:
              </p>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(dealPredictions).map(([dealId, prediction]) => {
                  const deal = deals.find((item) => item.id === dealId);

                  return (
                    <div
                      key={dealId}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-medium text-[var(--text-primary)]">
                          {deal?.title || "Untitled Deal"}
                        </span>

                        <Badge
                          variant={
                            prediction.probability > 70
                              ? "success"
                              : prediction.probability > 40
                                ? "warning"
                                : "default"
                          }
                        >
                          {prediction.probability}%
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {prediction.estimatedCloseDate}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading && <DealsLoadingState />}

      {!loading && error && (
        <DealsErrorState message={error} onRetry={loadDeals} />
      )}

      {!loading && !error && (
        <>
          <DealsKPICards deals={deals} />

          <div className="min-w-0 space-y-4">
            <DealsViewTabs
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <DealsFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              stages={stages}
              stageLabels={stageLabels}
              salespersons={salespersons}
              sources={sources}
            />

            {activeView === "pipeline" && (
              <DealsPipelineBoard
                deals={filteredDeals}
                stages={stages}
                stageLabels={stageLabels}
                stageColors={stageColors}
                onCardClick={setSelectedDeal}
              />
            )}

            {activeView === "list" && (
              <DealsListView
                deals={filteredDeals}
                stageLabels={stageLabels}
                stageColors={stageColors}
                onRowClick={setSelectedDeal}
              />
            )}

            {activeView === "forecast" && (
              <DealsForecastView
                deals={filteredDeals}
                stages={stages}
                stageLabels={stageLabels}
                stageColors={stageColors}
              />
            )}

            {activeView === "lost" && (
              <DealsLostView
                deals={filteredDeals}
                stageLabels={stageLabels}
                stageColors={stageColors}
                onRowClick={setSelectedDeal}
              />
            )}
          </div>
        </>
      )}

      {selectedDeal && (
        <DealDetailDrawer
          deal={selectedDeal}
          admins={admins}
          stageLabels={stageLabels}
          stageColors={stageColors}
          rawStages={rawStages}
          onClose={() => setSelectedDeal(null)}
          onEdit={openEditModal}
          onDelete={handleDeleteDeal}
          onStageChange={handleStageChange}
          onOwnerChange={handleOwnerChange}
          onMarkWon={handleMarkDealWon}
          onMarkLost={handleMarkDealLost}
        />
      )}

      {creatingDeal && (
        <CreateDealModal
          admins={admins}
          onClose={() => setCreatingDeal(false)}
          onSuccess={async () => {
            setCreatingDeal(false);
            await loadDeals();
          }}
        />
      )}

      {editingDeal && (
        <CreateDealModal
          deal={editingDeal}
          admins={admins}
          onClose={() => setEditingDeal(null)}
          onSuccess={async () => {
            setEditingDeal(null);
            await loadDeals();
          }}
        />
      )}

      <AIAssistant
        context="deals"
        contextData={{ deals, stages, dealPredictions, aiInsights }}
      />
    </div>
  );
}
