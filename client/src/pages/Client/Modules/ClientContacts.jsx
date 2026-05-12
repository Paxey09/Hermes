import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../config/supabaseClient";

import {
  ClientContactsHeader,
  ClientContactsKPICards,
  ClientContactsFilterToolbar,
  ClientContactsTable,
  ClientContactDetailDrawer,
  ClientContactsLoadingState,
  ClientContactsErrorState,
} from "../../../components/client/layout/Client_Contacts_Components.jsx";

import {
  getClientContactsData,
  createClientContact,
  updateClientContact,
  archiveClientContact,
} from "../../../services/clientContacts";

import {
  createClientDeal,
  CLIENT_DEAL_STAGES,
  CLIENT_DEAL_STAGE_LABELS,
  CLIENT_DEAL_STAGE_PROBABILITIES,
  CLIENT_DEAL_SOURCES,
} from "../../../services/clientDeals";

const emptyContactForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "lead",
  source: "manual",
};

const emptyDealForm = {
  title: "",
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

export default function ClientContacts() {
  const [workspaceId, setWorkspaceId] = useState(null);

  const [selectedContact, setSelectedContact] = useState(null);
  const [dealContact, setDealContact] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [sources, setSources] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyContactForm);
  const [dealForm, setDealForm] = useState(emptyDealForm);

  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    source: "all",
    sort: "name_asc",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setLoading(true);
      setError("");

      const activeWorkspaceId = workspaceId || (await resolveWorkspaceId());
      setWorkspaceId(activeWorkspaceId);

      const data = await getClientContactsData(activeWorkspaceId);

      setContacts(data.contacts || []);
      setSources(data.sources || []);
      setTypes(data.types || []);
      setStatuses(data.statuses || []);
    } catch (err) {
      console.error("Client contacts load error:", err);
      setError(err.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setForm(emptyContactForm);
    setModalMode("create");
  }

  function openEditModal(contact) {
    setSelectedContact(null);
    setForm({
      name: contact.name || "",
      company: contact.company || "",
      email: contact.email || "",
      phone: contact.phone || "",
      status: contact.status || "lead",
      source: contact.source || "manual",
    });
    setModalMode({ type: "edit", id: contact.id });
  }

  function openCreateDealModal(contact) {
    setSelectedContact(null);
    setDealContact(contact);
    setDealForm({
      ...emptyDealForm,
      title: `${contact.company || contact.name || "New"} Deal`,
      contact_id: contact.id,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      if (!workspaceId) throw new Error("Workspace ID is missing.");

      if (modalMode === "create") {
        await createClientContact(workspaceId, form);
      } else {
        await updateClientContact(modalMode.id, workspaceId, form);
      }

      setModalMode(null);
      setForm(emptyContactForm);
      await loadContacts();
    } catch (err) {
      alert(err.message || "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveContact(contact) {
    const confirmed = window.confirm(`Archive "${contact.name}"?`);
    if (!confirmed) return;

    try {
      if (!workspaceId) throw new Error("Workspace ID is missing.");

      await archiveClientContact(contact.id, workspaceId);
      setSelectedContact(null);
      await loadContacts();
    } catch (err) {
      alert(err.message || "Failed to archive contact.");
    }
  }

  async function handleCreateDeal(event) {
    event.preventDefault();

    try {
      setSaving(true);

      if (!workspaceId) throw new Error("Workspace ID is missing.");
      if (!dealContact?.id) throw new Error("Contact is required.");

      await createClientDeal(workspaceId, {
        ...dealForm,
        contact_id: dealContact.id,
        expected_revenue: Number(dealForm.value || 0),
        probability:
          Number(dealForm.probability) ||
          CLIENT_DEAL_STAGE_PROBABILITIES[dealForm.stage] ||
          0,
      });

      setDealContact(null);
      setDealForm(emptyDealForm);
      await loadContacts();
    } catch (err) {
      alert(err.message || "Failed to create deal.");
    } finally {
      setSaving(false);
    }
  }

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        const search = filters.search.trim().toLowerCase();

        const matchesSearch =
          !search ||
          (contact.name || "").toLowerCase().includes(search) ||
          (contact.email || "").toLowerCase().includes(search) ||
          (contact.company || "").toLowerCase().includes(search);

        return (
          matchesSearch &&
          (filters.type === "all" || contact.type === filters.type) &&
          (filters.status === "all" || contact.status === filters.status) &&
          (filters.source === "all" || contact.source === filters.source)
        );
      })
      .sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";

        if (filters.sort === "name_desc") return nameB.localeCompare(nameA);
        if (filters.sort === "recent") {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        if (filters.sort === "activity") {
          return (
            new Date(b.last_activity_at || 0) -
            new Date(a.last_activity_at || 0)
          );
        }

        return nameA.localeCompare(nameB);
      });
  }, [contacts, filters]);

  return (
    <div className="space-y-6">
      <ClientContactsHeader onAddContact={openCreateModal} />

      {loading && <ClientContactsLoadingState />}

      {!loading && error && (
        <ClientContactsErrorState message={error} onRetry={loadContacts} />
      )}

      {!loading && !error && (
        <>
          <ClientContactsKPICards contacts={contacts} />

          <div className="space-y-4">
            <ClientContactsFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              sources={sources}
              types={types}
              statuses={statuses}
            />

            <ClientContactsTable
              contacts={filteredContacts}
              onRowClick={setSelectedContact}
              onEditContact={openEditModal}
              onCreateDeal={openCreateDealModal}
            />
          </div>
        </>
      )}

      {selectedContact && (
        <ClientContactDetailDrawer
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={openEditModal}
          onCreateDeal={openCreateDealModal}
          onArchive={handleArchiveContact}
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
                {modalMode === "create" ? "Create Contact" : "Edit Contact"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Maintain workspace contact and company information.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Full Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Juan Dela Cruz"
                />
              </Field>

              <Field label="Company">
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className={inputClass}
                  placeholder="TechCorp PH"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="name@company.com"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+63 912 345 6789"
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Source">
                <select
                  value={form.source}
                  onChange={(e) =>
                    setForm({ ...form, source: e.target.value })
                  }
                  className={inputClass}
                >
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <ModalActions
              saving={saving}
              onCancel={() => setModalMode(null)}
              saveLabel="Save"
            />
          </form>
        </div>
      )}

      {dealContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={handleCreateDeal}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="border-b border-gray-200 bg-gray-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">Create Deal</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a deal for {dealContact.name}.
              </p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Deal Title">
                <input
                  required
                  value={dealForm.title}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, title: e.target.value })
                  }
                  className={inputClass}
                  placeholder="ERP Implementation Deal"
                />
              </Field>

              <Field label="Expected Revenue">
                <input
                  type="number"
                  min="0"
                  value={dealForm.value}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, value: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Stage">
                <select
                  value={dealForm.stage}
                  onChange={(e) => {
                    const stage = e.target.value;
                    setDealForm({
                      ...dealForm,
                      stage,
                      probability: CLIENT_DEAL_STAGE_PROBABILITIES[stage] || 0,
                      status:
                        stage === "won"
                          ? "won"
                          : stage === "lost"
                            ? "lost"
                            : "open",
                    });
                  }}
                  className={inputClass}
                >
                  {CLIENT_DEAL_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {CLIENT_DEAL_STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Probability">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dealForm.probability}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, probability: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Source">
                <select
                  value={dealForm.source}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, source: e.target.value })
                  }
                  className={inputClass}
                >
                  {CLIENT_DEAL_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expected Close Date">
                <input
                  type="date"
                  value={dealForm.expected_close_date}
                  onChange={(e) =>
                    setDealForm({
                      ...dealForm,
                      expected_close_date: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    value={dealForm.description}
                    onChange={(e) =>
                      setDealForm({
                        ...dealForm,
                        description: e.target.value,
                      })
                    }
                    className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Deal notes..."
                  />
                </Field>
              </div>
            </div>

            <ModalActions
              saving={saving}
              onCancel={() => setDealContact(null)}
              saveLabel="Create Deal"
            />
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

function ModalActions({ saving, onCancel, saveLabel }) {
  return (
    <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : saveLabel}
      </button>
    </div>
  );
}
