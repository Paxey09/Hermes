import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createDeal, updateDeal, getDealMeta } from "../../../services/deals";

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textAreaClass =
  "min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CreateDealModal({
  contact = null,
  deal = null,
  onClose,
  onSuccess,
}) {
  const [saving, setSaving] = useState(false);
  const [stages, setStages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [sources, setSources] = useState([]);

  const [form, setForm] = useState({
    title: "",
    contact_id: "",
    value: "",
    probability: 0,
    stage_id: "",
    status: "open",
    source: "manual",
    expected_close_date: "",
    description: "",
  });

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title || "",
        contact_id: deal.contact_id || "",
        value: deal.value || "",
        probability: deal.probability || 0,
        stage_id: deal.stage_id || "",
        status: deal.status || "open",
        source: deal.source || "manual",
        expected_close_date: deal.expected_close_date || "",
        description: deal.description || "",
      });
      return;
    }

    if (contact) {
      setForm((prev) => ({
        ...prev,
        title: `New Opportunity - ${contact.company || contact.name}`,
        contact_id: contact.id,
        source: contact.source || "manual",
      }));
    }
  }, [contact, deal]);

  async function loadMeta() {
    const meta = await getDealMeta();

    setStages(meta.stages || []);
    setContacts(meta.contacts || []);
    setSources(meta.sources || []);

    const firstStage = meta.stages?.[0];

    if (!deal && firstStage) {
      setForm((prev) => ({
        ...prev,
        stage_id: prev.stage_id || firstStage.id,
        probability: prev.probability || firstStage.probability || 0,
      }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...form,
        value: Number(form.value || 0),
        probability: Number(form.probability || 0),
      };

      if (deal?.id) {
        await updateDeal(deal.id, payload);
      } else {
        await createDeal(payload);
      }

      onSuccess?.();
    } catch (err) {
      alert(err.message || "Failed to save deal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 p-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {deal ? "Edit Deal" : "Create Deal"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage opportunity information before saving it to the pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="ERP Implementation - Client Name"
            />
          </Field>

          <Field label="Contact">
            <select
              required
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
              className={inputClass}
            >
              <option value="">Select contact</option>
              {contacts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name} {item.company_name ? `- ${item.company_name}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Expected Revenue">
            <input
              type="number"
              min="0"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className={inputClass}
              placeholder="50000"
            />
          </Field>

          <Field label="Stage">
            <select
              value={form.stage_id}
              onChange={(e) => {
                const selectedStage = stages.find(
                  (stage) => stage.id === e.target.value
                );

                setForm({
                  ...form,
                  stage_id: e.target.value,
                  probability: selectedStage?.probability ?? form.probability,
                });
              }}
              className={inputClass}
            >
              <option value="">No stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
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
              onChange={(e) =>
                setForm({ ...form, probability: Number(e.target.value) })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>

          <Field label="Source">
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
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
              value={form.expected_close_date || ""}
              onChange={(e) =>
                setForm({ ...form, expected_close_date: e.target.value })
              }
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={textAreaClass}
                placeholder="Add internal notes or deal context..."
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={onClose}
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
