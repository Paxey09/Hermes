import { useState, useEffect, useMemo } from "react";
import { Plus, Search, TrendingUp, DollarSign, Calendar, X, Edit2, Trash2, Brain, Sparkles, Target, Zap } from "lucide-react";
import { Card, CardContent, Button, Badge, AIAssistant, CardHeader, CardTitle } from "../../components/admin/ui";
import { supabase } from "../../config/supabaseClient";
import { useTheme } from "../../context/ThemeContext";
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
} from "../../services/deals";

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

  // AI State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dealPredictions, setDealPredictions] = useState({});

  // AI Functions
  async function generateAIInsights() {
    setAiLoading(true);
    try {
      const insights = await aiModules.generateBusinessInsights({
        deals,
        stages,
        module: 'deals'
      }, 'current_month');
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
    setAiLoading(true);
    try {
      const email = await aiModules.draftOutreachEmail(deal, 'follow_up');
      alert(`AI Drafted Email:\n\nSubject: ${email.subject}\n\n${email.body}`);
    } catch (err) {
      console.error("Email drafting error:", err);
    } finally {
      setAiLoading(false);
    }
  }

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
    } catch (err) {
      console.error("Deals load error:", err);
      setError(err.message || "Failed to load deals.");
    } finally {
      setLoading(false);
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
      });

      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to update deal stage.");
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
    <div className="space-y-6">
      {/* AI Deal Intelligence */}
      <Card className="border-[#c9a84c]/30 bg-gradient-to-r from-[#c9a84c]/10 to-[#ea580c]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#c9a84c]" />
            AI Deal Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Sparkles}
              loading={aiLoading}
              onClick={generateAIInsights}
            >
              Generate Insights
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Target}
              loading={aiLoading}
              onClick={predictDealOutcomes}
            >
              Predict Deals
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Zap}
              onClick={() => draftDealEmail(deals[0])}
              disabled={!deals.length}
            >
              Draft Email
            </Button>
          </div>
          {aiInsights && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">{aiInsights.executiveSummary}</p>
              <div className="flex flex-wrap gap-2">
                {aiInsights.keyFindings?.slice(0, 3).map((finding, i) => (
                  <Badge key={i} variant="info" className="text-xs">{finding}</Badge>
                ))}
              </div>
            </div>
          )}
          {Object.keys(dealPredictions).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Deal Predictions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(dealPredictions).map(([dealId, prediction]) => (
                  <div key={dealId} className="p-2 bg-white dark:bg-white/5 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{deals.find(d => d.id === dealId)?.title?.slice(0, 20)}...</span>
                      <Badge variant={prediction.probability > 70 ? 'success' : prediction.probability > 40 ? 'warning' : 'default'}>
                        {prediction.probability}%
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{prediction.estimatedCloseDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DealsHeader onAddDeal={openCreateModal} />

      {loading && <DealsLoadingState />}

      {!loading && error && (
        <DealsErrorState message={error} onRetry={loadDeals} />
      )}

      {!loading && !error && (
        <>
          <DealsKPICards deals={deals} />

          <div className="space-y-4">
            <DealsViewTabs activeView={activeView} onViewChange={setActiveView} />

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
          stageLabels={stageLabels}
          stageColors={stageColors}
          rawStages={rawStages}
          onClose={() => setSelectedDeal(null)}
          onEdit={openEditModal}
          onDelete={handleDeleteDeal}
          onStageChange={handleStageChange}
          onMarkWon={handleMarkDealWon}
          onMarkLost={handleMarkDealLost}
        />
      )}

      {creatingDeal && (
        <CreateDealModal
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
          onClose={() => setEditingDeal(null)}
          onSuccess={async () => {
            setEditingDeal(null);
            await loadDeals();
          }}
        />
      )}

      {/* AI Assistant Widget */}
      <AIAssistant 
        context="deals" 
        contextData={{ deals, stages, dealPredictions, aiInsights }}
      />
    </div>
  );
}
