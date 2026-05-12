import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  DollarSign,
  Eye,
  List,
  Search,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatShortCurrency(amount) {
  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `₱${Math.round(amount / 1000)}K`;
  return formatCurrency(amount);
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

function statusBadgeClass(status) {
  if (status === "won")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "lost")
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export function ClientDealsHeader({ onAddDeal }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Client ERP <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Leads</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Leads Pipeline
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track workspace sales opportunities and expected revenue.
        </p>
      </div>

      <button
        type="button"
        onClick={onAddDeal}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        <BriefcaseBusiness className="h-4 w-4" />
        Add Deal
      </button>
    </div>
  );
}

export function ClientDealsLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-medium text-gray-600">Loading deals...</p>
    </div>
  );
}

export function ClientDealsErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load deals</h3>
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

export function ClientDealsKPICards({ deals }) {
  const total = deals.length;
  const open = deals.filter((deal) => deal.status === "open").length;
  const pipelineValue = deals
    .filter((deal) => deal.status === "open")
    .reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  const avgDealSize =
    total > 0
      ? Math.round(
          deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0) / total
        )
      : 0;

  const won = deals.filter((deal) => deal.status === "won").length;
  const lost = deals.filter((deal) => deal.status === "lost").length;

  const cards = [
    {
      label: "Total Deals",
      value: total,
      icon: BriefcaseBusiness,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      label: "Open Deals",
      value: open,
      icon: Target,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      label: "Pipeline Value",
      value: formatShortCurrency(pipelineValue),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Avg Deal Size",
      value: formatShortCurrency(avgDealSize),
      icon: DollarSign,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      label: "Closed Won",
      value: won,
      icon: Trophy,
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      label: "Lost Deals",
      value: lost,
      icon: X,
      color: "text-red-600 bg-red-50 border-red-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <h3 className="mt-4 text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Workspace deal data
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}
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

export function ClientDealsViewTabs({ activeView, onViewChange }) {
  const tabs = [
    { key: "pipeline", label: "Pipeline", icon: Target },
    { key: "list", label: "List", icon: List },
    { key: "forecast", label: "Forecast", icon: BarChart3 },
    { key: "lost", label: "Lost Deals", icon: X },
  ];

  return (
    <div className="flex flex-wrap gap-6 border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onViewChange(tab.key)}
            className={
              activeView === tab.key
                ? "flex items-center gap-2 border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-600"
                : "flex items-center gap-2 pb-3 text-sm font-medium text-gray-500 hover:text-gray-900"
            }
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function ClientDealsFilterToolbar({
  filters,
  onFilterChange,
  stages,
  stageLabels,
  salespersons,
  sources,
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
          placeholder="Search deals, company, contact..."
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
        />
      </div>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.stage}
        onChange={(event) => update("stage", event.target.value)}
      >
        <option value="all">All Stages</option>
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stageLabels[stage] || labelize(stage)}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.owner}
        onChange={(event) => update("owner", event.target.value)}
      >
        <option value="all">All Owners</option>
        {salespersons.map((person) => (
          <option key={person} value={person}>
            {person}
          </option>
        ))}
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
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
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.status}
        onChange={(event) => update("status", event.target.value)}
      >
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>

      <select
        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
        value={filters.sort}
        onChange={(event) => update("sort", event.target.value)}
      >
        <option value="updated_desc">Recently Updated</option>
        <option value="value_desc">Highest Value</option>
        <option value="value_asc">Lowest Value</option>
        <option value="close_date">Close Date</option>
      </select>
    </div>
  );
}

function DealStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${statusBadgeClass(
        status
      )}`}
    >
      {status || "open"}
    </span>
  );
}

function DealCard({ deal, stageLabels, stageColors, onClick }) {
  const color = stageColors[deal.stage] || "#4a90d9";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className="mt-1.5 h-2.5 w-2.5 rounded-full"
            style={{ background: color }}
          />
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {deal.title || "Untitled Deal"}
            </h4>
            <p className="mt-1 text-sm font-medium text-blue-600">
              {deal.company || "No company"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {deal.contact_name || "No contact"}
            </p>
          </div>
        </div>

        <DealStatusBadge status={deal.status} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(deal.value)}
        </span>
        <span className="font-bold text-emerald-600">
          {deal.probability || 0}%
        </span>
      </div>

      <div className="mt-2 h-1.5 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${deal.probability || 0}%`,
            background: color,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>{stageLabels[deal.stage] || labelize(deal.stage)}</span>
        <span>{formatDate(deal.expected_close_date)}</span>
      </div>
    </button>
  );
}

export function ClientDealsPipelineBoard({
  deals,
  stages,
  stageLabels,
  stageColors,
  onCardClick,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {stages.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage);
        const total = stageDeals.reduce(
          (sum, deal) => sum + Number(deal.value || 0),
          0
        );
        const color = stageColors[stage] || "#4a90d9";

        return (
          <div
            key={stage}
            className="min-h-[420px] rounded-2xl border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  {stageLabels[stage] || labelize(stage)}
                </h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {stageDeals.length}
                </span>
              </div>

              <span className="text-xs font-semibold text-gray-500">
                {formatShortCurrency(total)}
              </span>
            </div>

            <div className="space-y-3">
              {stageDeals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400">
                  No deals
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    stageLabels={stageLabels}
                    stageColors={stageColors}
                    onClick={() => onCardClick(deal)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClientDealsListView({
  deals,
  stageLabels,
  stageColors,
  onRowClick,
}) {
  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        No deals found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Deal</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Probability</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {deals.map((deal) => (
            <tr key={deal.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">
                {deal.title || "Untitled Deal"}
              </td>
              <td className="px-4 py-3 text-blue-600">
                {deal.company || "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {deal.contact_name || "—"}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {formatCurrency(deal.value)}
              </td>
              <td className="px-4 py-3">
                <span
                  className="rounded-full border px-2 py-1 text-xs font-bold"
                  style={{
                    color: stageColors[deal.stage],
                    borderColor: stageColors[deal.stage],
                  }}
                >
                  {stageLabels[deal.stage] || labelize(deal.stage)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {deal.probability || 0}%
              </td>
              <td className="px-4 py-3 text-gray-600">{deal.owner || "—"}</td>
              <td className="px-4 py-3">
                <DealStatusBadge status={deal.status} />
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onRowClick(deal)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientDealsForecastView({
  deals,
  stages,
  stageLabels,
  stageColors,
}) {
  const byStage = stages.map((stage) => {
    const stageDeals = deals.filter(
      (deal) => deal.stage === stage && deal.status === "open"
    );

    const total = stageDeals.reduce(
      (sum, deal) => sum + Number(deal.value || 0),
      0
    );

    const weighted = stageDeals.reduce(
      (sum, deal) =>
        sum + Number(deal.value || 0) * (Number(deal.probability || 0) / 100),
      0
    );

    return {
      stage,
      total,
      weighted,
      count: stageDeals.length,
    };
  });

  const maxValue = Math.max(...byStage.map((row) => row.total), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">Revenue Forecast by Stage</h3>

      <div className="mt-5 space-y-4">
        {byStage.map((row) => (
          <div
            key={row.stage}
            className="grid gap-3 md:grid-cols-[140px_1fr_100px_120px_70px] md:items-center"
          >
            <span className="text-sm font-medium text-gray-600">
              {stageLabels[row.stage] || labelize(row.stage)}
            </span>

            <div className="h-3 rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${(row.total / maxValue) * 100}%`,
                  background: stageColors[row.stage],
                }}
              />
            </div>

            <span className="text-sm font-bold text-gray-900">
              {formatShortCurrency(row.total)}
            </span>
            <span className="text-xs text-gray-500">
              Weighted: {formatShortCurrency(row.weighted)}
            </span>
            <span className="text-xs text-gray-500">{row.count} deals</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientDealsLostView({
  deals,
  stageLabels,
  stageColors,
  onRowClick,
}) {
  const lostDeals = deals.filter((deal) => deal.status === "lost");

  return (
    <ClientDealsListView
      deals={lostDeals}
      stageLabels={stageLabels}
      stageColors={stageColors}
      onRowClick={onRowClick}
    />
  );
}

function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold capitalize text-blue-600">
              {activity.type}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(activity.date)}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.note}</p>
          <p className="mt-2 text-xs text-gray-400">{activity.user}</p>
        </div>
      ))}
    </div>
  );
}

export function ClientDealDetailDrawer({
  deal,
  stageLabels,
  stageColors,
  rawStages = [],
  onClose,
  onEdit,
  onStageChange,
  onMarkWon,
  onMarkLost,
}) {
  const [tab, setTab] = useState("overview");
  const color = stageColors[deal.stage] || "#4a90d9";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <span
                className="mt-2 h-3 w-3 rounded-full"
                style={{ background: color }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {deal.title || "Untitled Deal"}
                </h3>
                <p className="mt-1 text-sm text-blue-600">
                  {deal.company || "No company"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {rawStages.map((stage) => (
              <button
                key={stage.id || stage.key}
                type="button"
                onClick={() => onStageChange?.(deal, stage.key)}
                className="rounded-lg border px-3 py-1 text-xs font-semibold transition hover:bg-gray-50"
                style={{
                  borderColor:
                    stage.key === deal.stage ? stageColors[stage.key] : "#e5e7eb",
                  color:
                    stage.key === deal.stage ? stageColors[stage.key] : "#9ca3af",
                  background:
                    stage.key === deal.stage
                      ? `${stageColors[stage.key]}15`
                      : "transparent",
                }}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          {["overview", "activity", "notes"].map((item) => (
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

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "overview" && (
            <div className="space-y-4 text-sm">
              <Info label="Company" value={deal.company} />
              <Info label="Contact" value={deal.contact_name} />
              <Info label="Email" value={deal.email} />
              <Info label="Phone" value={deal.phone} />
              <Info
                label="Stage"
                value={stageLabels[deal.stage] || deal.stage}
              />
              <Info label="Value" value={formatCurrency(deal.value)} />
              <Info label="Probability" value={`${deal.probability || 0}%`} />
              <Info label="Owner" value={deal.owner} />
              <Info
                label="Expected Close"
                value={formatDate(deal.expected_close_date)}
              />
              <Info label="Description" value={deal.description || "—"} />
            </div>
          )}

          {tab === "activity" && <ActivityTimeline activities={deal.activities} />}

          {tab === "notes" && (
            <textarea
              className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
              placeholder="Write a note about this deal..."
            />
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => onEdit?.(deal)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Edit
          </button>

          {deal.status !== "won" && (
            <button
              type="button"
              onClick={() => onMarkWon?.(deal)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              Mark Won
            </button>
          )}

          {deal.status !== "lost" && (
            <button
              type="button"
              onClick={() => onMarkLost?.(deal)}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
            >
              Mark Lost
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}
