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
  if (status === "customer") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "prospect") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "lead") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "archived") return "bg-gray-50 text-gray-600 border-gray-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
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
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white`}
    >
      {initials}
    </div>
  );
}

function ContactStatusBadge({ status }) {
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${contactStatusClass(status)}`}>
      {labelize(status)}
    </span>
  );
}

export function ContactsHeader({ onAddContact }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Modules <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Contacts</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage customers, companies, and lead contacts
        </p>
      </div>

      <button
        type="button"
        onClick={onAddContact}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Add Contact
      </button>
    </div>
  );
}

export function ContactsLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-medium text-gray-600">Loading contacts...</p>
    </div>
  );
}

export function ContactsErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load contacts</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContactsKPICards({ contacts }) {
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
    { label: "Total Contacts", value: total, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Companies", value: companies, icon: Building2, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { label: "Customers", value: customers, icon: UserRound, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Leads", value: leads, icon: Users, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Prospects", value: prospects, icon: Search, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Recently Added", value: recent, icon: Plus, color: "text-green-600 bg-green-50 border-green-200" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <h3 className="mt-4 text-3xl font-bold text-gray-900">{card.value}</h3>
                <p className="mt-3 text-sm font-medium text-gray-500">Live contact data</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ContactsFilterToolbar({
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
    <div className="flex flex-col gap-3 border-b border-gray-200 py-4 xl:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Search contacts, email, company..."
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
        />
      </div>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.type} onChange={(e) => update("type", e.target.value)}>
        <option value="all">All Types</option>
        {types.map((type) => (
          <option key={type} value={type}>{labelize(type)}</option>
        ))}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.status} onChange={(e) => update("status", e.target.value)}>
        <option value="all">All Status</option>
        {statuses.map((status) => (
          <option key={status} value={status}>{labelize(status)}</option>
        ))}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.source} onChange={(e) => update("source", e.target.value)}>
        <option value="all">All Sources</option>
        {sources.map((source) => (
          <option key={source} value={source}>{labelize(source)}</option>
        ))}
      </select>

      <select className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700" value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="recent">Recently Added</option>
        <option value="activity">Last Activity</option>
      </select>
    </div>
  );
}

export function ContactsTable({
  contacts,
  onRowClick,
  onEditContact,
  onCreateDeal,
}) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No contacts found</h3>
        <p className="mt-1 text-sm text-gray-500">Add your first contact or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
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
            <tr key={contact.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <button type="button" onClick={() => onRowClick(contact)} className="flex items-center gap-3 text-left">
                  <Avatar name={contact.name} />
                  <div>
                    <p className="font-semibold text-gray-900">{contact.name || "Unnamed Contact"}</p>
                    <p className="text-xs text-blue-600">{contact.email || "No email"}</p>
                  </div>
                </button>
              </td>
              <td className="px-4 py-3 text-gray-600">{contact.company || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{contact.phone || "—"}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold uppercase text-blue-700">
                  {labelize(contact.type)}
                </span>
              </td>
              <td className="px-4 py-3"><ContactStatusBadge status={contact.status} /></td>
              <td className="px-4 py-3 text-gray-600">{labelize(contact.source)}</td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  {contact.related_deals?.length || 0} deals
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDate(contact.last_activity_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button type="button" onClick={() => onRowClick(contact)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50" title="View">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => onEditContact(contact)} className="rounded-lg border border-amber-200 bg-amber-50 px-2 text-sm text-amber-700 hover:bg-amber-100" title="Edit">
                    ✏️
                  </button>
                  <button type="button" onClick={() => onCreateDeal(contact)} className="rounded-lg border border-blue-200 bg-blue-50 px-2 text-sm text-blue-700 hover:bg-blue-100" title="Create Deal">
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
    return <p className="text-center text-sm text-gray-400">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-blue-600">{activity.type}</span>
            <span className="text-xs text-gray-400">{formatDate(activity.date)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.note}</p>
          <p className="mt-2 text-xs text-gray-400">{activity.user}</p>
        </div>
      ))}
    </div>
  );
}

export function ContactDetailDrawer({
  contact,
  onClose,
  onEdit,
  onCreateDeal,
  onArchive,
}) {
  const [tab, setTab] = useState("profile");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <Avatar name={contact.name} size="h-12 w-12" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{contact.name || "Unnamed Contact"}</h3>
                <p className="mt-1 text-sm text-gray-500">{contact.job_title || labelize(contact.type)}</p>
                <p className="mt-1 text-sm text-blue-600">{contact.company || "No company"}</p>
              </div>
            </div>

            <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ContactStatusBadge status={contact.status} />
            {contact.tags?.map((tag) => (
              <span key={tag} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {["profile", "deals", "activity", "notes"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                tab === item
                  ? "border-b-2 border-blue-600 px-5 py-3 text-sm font-semibold capitalize text-blue-600"
                  : "px-5 py-3 text-sm font-medium capitalize text-gray-500 hover:text-gray-900"
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
              <Info icon={Building2} label="Company" value={contact.company || "—"} />
              <Info icon={UserRound} label="Type" value={labelize(contact.type)} />
              <Info icon={Archive} label="Source" value={labelize(contact.source)} />
              <Info label="Created" value={formatDate(contact.created_at)} />
              <Info label="Last Activity" value={formatDate(contact.last_activity_at)} />
            </div>
          )}

          {tab === "deals" && (
            <div className="space-y-3">
              {contact.related_deals?.length ? (
                contact.related_deals.map((deal) => (
                  <div key={deal.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{deal.title}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {formatCurrency(deal.value)}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold uppercase text-blue-700">
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-400">No related deals yet.</p>
              )}
            </div>
          )}

          {tab === "activity" && <ActivityTimeline activities={contact.activities} />}

          {tab === "notes" && (
            <textarea
              className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
              placeholder="Write a note about this contact..."
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button type="button" onClick={() => onEdit?.(contact)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
            Edit
          </button>
          <button type="button" onClick={() => onCreateDeal?.(contact)} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Create Deal
          </button>
          <button type="button" onClick={() => onArchive?.(contact)} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2 font-medium text-gray-900">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span>{value || "—"}</span>
      </div>
    </div>
  );
}
