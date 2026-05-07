import { Plus, Search, Mail, Phone, Building2, X, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/admin/ui";
import { supabase } from "../../config/supabaseClient";
import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect, useMemo } from "react";

import {
  ContactsHeader,
  ContactsKPICards,
  ContactsFilterToolbar,
  ContactsTable,
  ContactDetailDrawer,
  ContactsLoadingState,
  ContactsErrorState,
} from "../../components/admin/layout/Admin_Contacts_Components.jsx";

import {
  getContactsData,
  createContact,
  updateContact,
  archiveContact,
} from "../../services/contacts";

import CreateDealModal from "../../components/admin/modals/CreateDealModal.jsx";

const emptyContactForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "lead",
  source: "manual",
};

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function AdminContacts() {
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

      const data = await getContactsData();

      setContacts(data.contacts || []);
      setSources(data.sources || []);
      setTypes(data.types || []);
      setStatuses(data.statuses || []);
    } catch (err) {
      console.error("Contacts load error:", err);
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
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      if (modalMode === "create") {
        await createContact(form);
      } else {
        await updateContact(modalMode.id, form);
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
      await archiveContact(contact.id);
      setSelectedContact(null);
      await loadContacts();
    } catch (err) {
      alert(err.message || "Failed to archive contact.");
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
      <ContactsHeader onAddContact={openCreateModal} />

      {loading && <ContactsLoadingState />}

      {!loading && error && (
        <ContactsErrorState message={error} onRetry={loadContacts} />
      )}

      {!loading && !error && (
        <>
          <ContactsKPICards contacts={contacts} />

          <div className="space-y-4">
            <ContactsFilterToolbar
              filters={filters}
              onFilterChange={setFilters}
              sources={sources}
              types={types}
              statuses={statuses}
            />

            <ContactsTable
              contacts={filteredContacts}
              onRowClick={setSelectedContact}
              onEditContact={openEditModal}
              onCreateDeal={openCreateDealModal}
            />
          </div>
        </>
      )}

      {selectedContact && (
        <ContactDetailDrawer
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
                Maintain customer and company information.
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
                  required
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {dealContact && (
        <CreateDealModal
          contact={dealContact}
          onClose={() => setDealContact(null)}
          onSuccess={async () => {
            setDealContact(null);
            await loadContacts();
          }}
        />
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
