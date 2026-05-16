import { useState } from "react";
import {
  AlertCircle,
  Archive,
  Building2,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function labelize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function contactStatusClass(status) {
  if (status === "customer")
    return "bg-[var(--success-soft)] text-[var(--success)] border-green-500/20";
  if (status === "prospect")
    return "bg-[var(--brand-gold-soft)] text-[var(--brand-gold)] border-[var(--brand-gold-border)]";
  if (status === "lead")
    return "bg-[var(--brand-gold-soft)] text-[var(--brand-gold)] border-[var(--brand-gold-border)]";
  if (status === "archived")
    return "bg-[var(--hover-bg)] text-[var(--text-secondary)] border-[var(--border-color)]";
  return "bg-[var(--hover-bg)] text-[var(--text-secondary)] border-[var(--border-color)]";
}

function Avatar({ name, size = "h-9 w-9" }) {
  const initials = String(name || "?")
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-gold)] to-[var(--brand-cyan-bright)] text-xs font-black text-[#050816]`}
    >
      {initials}
    </div>
  );
}

function ContactStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${contactStatusClass(
        status
      )}`}
    >
      {labelize(status)}
    </span>
  );
}

export function ClientContactsHeader({ onAddContact }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-color)] pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">Contacts</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Manage workspace contacts, companies, and customer records.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddContact}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-gold)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-gold-hover)]"
      >
        <Plus className="h-4 w-4" />
        Add Contact
      </button>
    </div>
  );
}

export function ClientContactsLoadingState() {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center shadow-sm">
      <p className="text-sm font-medium text-[var(--text-secondary)]">Loading contacts...</p>
    </div>
  );
}

export function ClientContactsErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-[var(--danger-soft)] p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[var(--danger)]" />
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--danger)]">Failed to load contacts</h3>
          <p className="mt-1 text-sm text-[var(--danger)]">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-2xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientContactsKPICards({ contacts }) {
  const total = contacts.length;
  const companies = contacts.filter((contact) => contact.type === "company").length;
  const customers = contacts.filter((contact) => contact.status === "customer").length;
  const leads = contacts.filter((contact) => contact.status === "lead").length;
  const prospects = contacts.filter((contact) => contact.status === "prospect").length;
  const recent = contacts.filter((contact) => {
    const created = new Date(contact.created_at || 0);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return created >= cutoff;
  }).length;

  const cards = [
    {
      label: "Total Contacts",
      value: total,
      icon: Users,
      color: "text-[var(--brand-gold)] bg-[var(--brand-gold-soft)] border-[var(--brand-gold-border)]",
    },
    {
      label: "Companies",
      value: companies,
      icon: Building2,
      color: "text-[var(--brand-cyan)] bg-[var(--brand-cyan-soft)] border-[var(--brand-cyan-border)]",
    },
    {
      label: "Customers",
      value: customers,
      icon: UserRound,
      color: "text-[var(--success)] bg-[var(--success-soft)] border-green-500/20",
    },
    {
      label: "Leads",
      value: leads,
      icon: Users,
      color: "text-[var(--brand-gold)] bg-[var(--brand-gold-soft)] border-[var(--brand-gold-border)]",
    },
    {
      label: "Prospects",
      value: prospects,
      icon: Search,
      color: "text-[var(--brand-gold)] bg-[var(--brand-gold-soft)] border-[var(--brand-gold-border)]",
    },
    {
      label: "Recently Added",
      value: recent,
      icon: Plus,
      color: "text-green-600 bg-green-50 border-green-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {card.label}
                </p>
                <h3 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
                  {card.value}
                </h3>
                <p className="mt-3 text-sm font-medium text-[var(--text-muted)]">
                  Workspace contact data
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClientContactsFilterToolbar({
  filters,
  onFilterChange,
  sources,
  types,
  statuses,
}) {
  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border-color)] py-4 xl:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
        <input
          className="h-11 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-gold-border)] focus:ring-2 focus:ring-[var(--brand-gold-soft)]"
          placeholder="Search contacts, email, company..."
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
        />
      </div>

      <select
        className="h-11 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-secondary)]"
        value={filters.type}
        onChange={(event) => update("type", event.target.value)}
      >
        <option value="all">All Types</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {labelize(type)}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-secondary)]"
        value={filters.status}
        onChange={(event) => update("status", event.target.value)}
      >
        <option value="all">All Status</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {labelize(status)}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-secondary)]"
        value={filters.source}
        onChange={(event) => update("source", event.target.value)}
      >
        <option value="all">All Sources</option>
        {sources.map((source) => (
          <option key={source} value={source}>
            {labelize(source)}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-secondary)]"
        value={filters.sort}
        onChange={(event) => update("sort", event.target.value)}
      >
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="recent">Recently Added</option>
        <option value="activity">Last Activity</option>
      </select>
    </div>
  );
}

export function ClientContactsTable({
  contacts,
  onRowClick,
  onEditContact,
  onCreateDeal,
}) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
        <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
          No contacts found
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Add your first contact or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--hover-bg)] text-xs uppercase text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Related Deals</th>
            <th className="px-4 py-3">Last Activity</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-[var(--hover-bg)]">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onRowClick(contact)}
                  className="flex items-center gap-3 text-left"
                >
                  <Avatar name={contact.name} />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {contact.name || "Unnamed Contact"}
                    </p>
                    <p className="text-xs text-[var(--brand-gold)]">
                      {contact.email || "No email"}
                    </p>
                  </div>
                </button>
              </td>

              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {contact.company || "—"}
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{contact.phone || "—"}</td>

              <td className="px-4 py-3">
                <span className="rounded-full border border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-2 py-1 text-xs font-bold uppercase text-[var(--brand-gold)]">
                  {labelize(contact.type)}
                </span>
              </td>

              <td className="px-4 py-3">
                <ContactStatusBadge status={contact.status} />
              </td>

              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {labelize(contact.source)}
              </td>

              <td className="px-4 py-3">
                <span className="rounded-xl bg-[var(--brand-gold-soft)] px-2 py-1 text-xs font-bold text-[var(--brand-gold)]">
                  {contact.related_deals?.length || 0} deals
                </span>
              </td>

              <td className="px-4 py-3 text-[var(--text-muted)]">
                {formatDate(contact.last_activity_at)}
              </td>

              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onRowClick(contact)}
                    className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditContact(contact)}
                    className="rounded-xl border border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-2 text-sm text-[var(--brand-gold)] hover:bg-[var(--brand-gold-soft)]"
                    title="Edit"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateDeal(contact)}
                    className="rounded-xl border border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-2 text-sm text-[var(--brand-gold)] hover:bg-[var(--brand-gold-soft)]"
                    title="Create Deal"
                  >
                    🎯
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--text-muted)]">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-[var(--brand-gold)]">
              {activity.type}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {formatDate(activity.date)}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{activity.note}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">{activity.user}</p>
        </div>
      ))}
    </div>
  );
}

export function ClientContactDetailDrawer({
  contact,
  onClose,
  onEdit,
  onCreateDeal,
  onArchive,
}) {
  const [tab, setTab] = useState("profile");

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl bg-[var(--bg-card)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border-color)] bg-[var(--hover-bg)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <Avatar name={contact.name} size="h-12 w-12" />
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {contact.name || "Unnamed Contact"}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {contact.job_title || labelize(contact.type)}
                </p>
                <p className="mt-1 text-sm text-[var(--brand-gold)]">
                  {contact.company || "No company"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ContactStatusBadge status={contact.status} />
          </div>
        </div>

        <div className="flex border-b border-[var(--border-color)]">
          {["profile", "deals", "activity", "notes"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "border-b-2 border-[var(--brand-gold)] px-5 py-3 text-sm font-semibold capitalize text-[var(--brand-gold)]"
                  : "px-5 py-3 text-sm font-medium capitalize text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="h-[calc(100vh-220px)] overflow-y-auto p-6">
          {tab === "profile" && (
            <div className="space-y-4 text-sm">
              <Info icon={Mail} label="Email" value={contact.email} />
              <Info icon={Phone} label="Phone" value={contact.phone} />
              <Info
                icon={Building2}
                label="Company"
                value={contact.company || "—"}
              />
              <Info icon={UserRound} label="Type" value={labelize(contact.type)} />
              <Info icon={Archive} label="Source" value={labelize(contact.source)} />
              <Info label="Created" value={formatDate(contact.created_at)} />
              <Info
                label="Last Activity"
                value={formatDate(contact.last_activity_at)}
              />
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-3">
              {contact.related_deals?.length ? (
                contact.related_deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {deal.title}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">
                          {formatCurrency(deal.value)}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-2 py-1 text-xs font-bold uppercase text-[var(--brand-gold)]">
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  No related deals yet.
                </p>
              )}
            </div>
          )}

          {tab === "activity" && (
            <ActivityTimeline activities={contact.activities} />
          )}

          {tab === "notes" && (
            <textarea
              className="min-h-32 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] p-3 text-sm outline-none focus:border-[var(--brand-gold-border)]"
              placeholder="Write a note about this contact..."
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border-color)] bg-[var(--hover-bg)] p-4">
          <button
            type="button"
            onClick={() => onEdit?.(contact)}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onCreateDeal?.(contact)}
            className="rounded-2xl border border-[var(--brand-gold-border)] bg-[var(--brand-gold-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-gold)]"
          >
            Create Deal
          </button>

          {contact.status !== "archived" && (
            <button
              type="button"
              onClick={() => onArchive?.(contact)}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--hover-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2 font-medium text-[var(--text-primary)]">
        {Icon && <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <span>{value || "—"}</span>
      </div>
    </div>
  );
}
