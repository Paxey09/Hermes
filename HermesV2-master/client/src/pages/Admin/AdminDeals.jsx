import { useState, useEffect, useMemo } from "react";
import { Plus, Search, TrendingUp, DollarSign, Calendar, X, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/admin/ui";
import { supabase } from "../../config/supabaseClient";
import { useTheme } from "../../context/ThemeContext";

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
    </div>
  );
}
