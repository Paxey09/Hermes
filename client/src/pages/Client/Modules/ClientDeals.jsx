import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../config/supabaseClient";

import {
  ClientDealsHeader,
  ClientDealsKPICards,
  ClientDealsViewTabs,
  ClientDealsFilterToolbar,
  ClientDealsPipelineBoard,
  ClientDealsListView,
  ClientDealsForecastView,
  ClientDealsLostView,
  ClientDealDetailDrawer,
  ClientDealsLoadingState,
  ClientDealsErrorState,
} from "../../../components/client/layout/Client_Deals_Components.jsx";

import {
  getClientDealsData,
  getClientDealMeta,
  createClientDeal,
  updateClientDeal,
  updateClientDealStage,
  markClientDealWon,
  markClientDealLost,
  CLIENT_DEAL_STAGE_PROBABILITIES,
} from "../../../services/clientDeals";

const emptyDealForm = {
  title: "",
  contact_id: "",
  value: 0,
  stage: "new",
  probability: 10,
  status: "open",
  source: "manual",
  expected_close_date: "",
  description: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

async function resolveWorkspaceId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData?.user?.id;
  if (!userId) throw new Error("User session not found.");

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace_id) throw new Error("No workspace assigned to this user.");

  return data.workspace_id;
}

export default function ClientDeals() {
  const [workspaceId, setWorkspaceId] = useState(null);

  const [activeView, setActiveView] = useState("pipeline");
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyDealForm);

  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [stages, setStages] = useState([]);
  const [rawStages, setRawStages] = useState([]);
  const [stageLabels, setStageLabels] = useState({});
  const [stageColors, setStageColors] = useState({});
  const [salespersons, setSalespersons] = useState([]);
  const [sources, setSources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const activeWorkspaceId = workspaceId || (await resolveWorkspaceId());
      setWorkspaceId(activeWorkspaceId);

      const [data, meta] = await Promise.all([
        getClientDealsData(activeWorkspaceId),
        getClientDealMeta(activeWorkspaceId),
      ]);

      setDeals(data.deals || []);
      setStages(data.stages || []);
      setRawStages(data.rawStages || []);
      setStageLabels(data.stageLabels || {});
      setStageColors(data.stageColors || {});
      setSalespersons(data.salespersons || []);
      setSources(data.sources || []);
      setContacts(meta.contacts || []);
    } catch (err) {
      console.error("Client deals load error:", err);
      setError(err.message || "Failed to load deals.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setForm(emptyDealForm);
    setModalMode("create");
  }

  function openEditModal(deal) {
    setSelectedDeal(null);
    setForm({
      title: deal.title || "",
      contact_id: deal.contact_id || "",
      value: deal.value || 0,
      stage: deal.stage || "new",
      probability: deal.probability || 0,
      status: deal.status || "open",
      source: deal.source || "manual",
      expected_close_date: deal.expected_close_date || "",
      description: deal.description || "",
    });
    setModalMode({ type: "edit", id: deal.id });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      if (!workspaceId) throw new Error("Workspace ID is missing.");

      if (modalMode === "create") {
        await createClientDeal(workspaceId, form);
      } else {
        await updateClientDeal(modalMode.id, workspaceId, form);
      }

      setModalMode(null);
      setForm(emptyDealForm);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to save deal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(deal, stageKey) {
    try {
      if (!workspaceId) throw new Error("Workspace ID is missing.");

      await updateClientDealStage(deal.id, workspaceId, stageKey);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to update deal stage.");
    }
  }

  async function handleMarkDealWon(deal) {
    try {
      if (!workspaceId) throw new Error("Workspace ID is missing.");

      await markClientDealWon(deal.id, workspaceId);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to mark deal as won.");
    }
  }

  async function handleMarkDealLost(deal) {
    try {
      if (!workspaceId) throw new Error("Workspace ID is missing.");

      await markClientDealLost(deal.id, workspaceId);
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      alert(err.message || "Failed to mark deal as lost.");
    }
  }

  function updateForm(key, value) {
    if (key === "stage") {
      const probability = CLIENT_DEAL_STAGE_PROBABILITIES[value] || 0;

      setForm({
        ...form,
        stage: value,
        probability,
        status: value === "won" ? "won" : value === "lost" ? "lost" : "open",
      });
      return;
    }

    setForm({ ...form, [key]: value });
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
      <ClientDealsHeader onAddDeal={openCreateModal} />

      {loading && <ClientDealsLoadingState />}

      {!loading && error && (
        <ClientDealsErrorState message={error} onRetry={loadDeals} />
      )}

      {!loading && !error && (
        <>
          <ClientDealsKPICards deals={deals} />

          <div className="space-y-4">
            <ClientDealsViewTabs
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <ClientDealsFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              stages={stages}
              stageLabels={stageLabels}
              salespersons={salespersons}
              sources={sources}
            />

            {activeView === "pipeline" && (
              <ClientDealsPipelineBoard
                deals={filteredDeals}
                stages={stages}
                stageLabels={stageLabels}
                stageColors={stageColors}
                onCardClick={setSelectedDeal}
              />
            )}

            {activeView === "list" && (
              <ClientDealsListView
                deals={filteredDeals}
                stageLabels={stageLabels}
                stageColors={stageColors}
                onRowClick={setSelectedDeal}
              />
            )}

            {activeView === "forecast" && (
              <ClientDealsForecastView
                deals={filteredDeals}
                stages={stages}
                stageLabels={stageLabels}
                stageColors={stageColors}
              />
            )}

            {activeView === "lost" && (
              <ClientDealsLostView
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
        <ClientDealDetailDrawer
          deal={selectedDeal}
          stageLabels={stageLabels}
          stageColors={stageColors}
          rawStages={rawStages}
          onClose={() => setSelectedDeal(null)}
          onEdit={openEditModal}
          onStageChange={handleStageChange}
          onMarkWon={handleMarkDealWon}
          onMarkLost={handleMarkDealLost}
        />
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="border-b border-gray-200 bg-gray-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Create Deal" : "Edit Deal"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Maintain workspace deal and revenue information.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Deal Title">
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className={inputClass}
                  placeholder="ERP Implementation Deal"
                />
              </Field>

              <Field label="Contact">
                <select
                  value={form.contact_id}
                  onChange={(e) => updateForm("contact_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">No contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                      {contact.company_name ? ` — ${contact.company_name}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expected Revenue">
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => updateForm("value", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Stage">
                <select
                  value={form.stage}
                  onChange={(e) => updateForm("stage", e.target.value)}
                  className={inputClass}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stageLabels[stage]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Probability">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) => updateForm("probability", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Source">
                <select
                  value={form.source}
                  onChange={(e) => updateForm("source", e.target.value)}
                  className={inputClass}
                >
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expected Close Date">
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={(e) =>
                    updateForm("expected_close_date", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Deal notes..."
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Deal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
