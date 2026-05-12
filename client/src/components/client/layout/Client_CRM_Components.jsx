import {
  AlertCircle,
  BarChart3,
  DollarSign,
  Eye,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
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

function statusClass(status) {
  if (status === "won") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "lost") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function stageColor(stageKey) {
  const map = {
    new: "bg-blue-500",
    qualified: "bg-amber-500",
    proposal: "bg-purple-500",
    negotiation: "bg-orange-500",
    won: "bg-emerald-500",
    lost: "bg-red-500",
  };

  return map[stageKey] || "bg-gray-500";
}

function colorClasses(color) {
  const map = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
  };

  return map[color] || map.blue;
}

export function buildClientCRMKPIs(opportunities) {
  const open = opportunities.filter((opp) => opp.status === "open");
  const won = opportunities.filter((opp) => opp.status === "won");
  const lost = opportunities.filter((opp) => opp.status === "lost");

  const openPipelineValue = open.reduce(
    (sum, opp) => sum + Number(opp.revenue || 0),
    0
  );

  const weightedPipeline = open.reduce(
    (sum, opp) =>
      sum + Number(opp.revenue || 0) * (Number(opp.probability || 0) / 100),
    0
  );

  const wonRevenue = won.reduce(
    (sum, opp) => sum + Number(opp.revenue || 0),
    0
  );

  const conversionRate =
    opportunities.length > 0
      ? Math.round((won.length / opportunities.length) * 100)
      : 0;

  return [
    {
      id: "total",
      label: "Total Deals",
      value: opportunities.length,
      change: "All workspace deals",
      icon: Users,
      color: "blue",
      progress: 80,
    },
    {
      id: "open",
      label: "Open Pipeline",
      value: open.length,
      change: "Active deals",
      icon: Target,
      color: "amber",
      progress: 70,
    },
    {
      id: "pipeline",
      label: "Pipeline Value",
      value: formatShortCurrency(openPipelineValue),
      change: "Open expected revenue",
      icon: TrendingUp,
      color: "emerald",
      progress: 65,
    },
    {
      id: "weighted",
      label: "Weighted Forecast",
      value: formatShortCurrency(weightedPipeline),
      change: "Probability-adjusted",
      icon: BarChart3,
      color: "purple",
      progress: 60,
    },
    {
      id: "won",
      label: "Won Revenue",
      value: formatShortCurrency(wonRevenue),
      change: "Closed won value",
      icon: Trophy,
      color: "green",
      progress: 75,
    },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      change: `${lost.length} lost deals`,
      icon: DollarSign,
      color: "red",
      progress: conversionRate,
    },
  ];
}

export function ClientCRMHeader() {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Client ERP <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">CRM</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          CRM Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Workspace pipeline health, top deals, recent activity, and sales
          reporting.
        </p>
      </div>
    </div>
  );
}

export function ClientCRMLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">
        Loading CRM overview...
      </p>
    </div>
  );
}

export function ClientCRMErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />

        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load CRM</h3>
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

export function ClientCRMEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <Users className="mx-auto h-10 w-10 text-gray-300" />

      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No CRM deals yet
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Create and manage workspace deals from the Deals module.
      </p>
    </div>
  );
}

export function ClientCRMKPICards({ kpis }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <div
            key={kpi.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {kpi.label}
                </p>

                <h3 className="mt-4 text-3xl font-bold text-gray-900">
                  {kpi.value}
                </h3>

                <p className="mt-3 text-sm font-medium text-gray-500">
                  {kpi.change}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClasses(
                  kpi.color
                )}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${Math.min(kpi.progress, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ClientPipelineSnapshot({
  stages,
  opportunities,
  onOpportunityClick,
}) {
  const openOpportunities = opportunities.filter(
    (opp) => opp.status === "open"
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Pipeline Snapshot</h3>
          <p className="mt-1 text-sm text-gray-500">
            Summary by stage. Full pipeline management belongs in Deals.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => {
          const stageItems = openOpportunities.filter(
            (opp) => opp.stage === stage.key
          );

          const total = stageItems.reduce(
            (sum, opp) => sum + Number(opp.revenue || 0),
            0
          );

          return (
            <div
              key={stage.id || stage.key}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${stageColor(
                      stage.key
                    )}`}
                  />

                  <p className="font-semibold text-gray-900">
                    {stage.name || labelize(stage.key)}
                  </p>

                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500">
                    {stageItems.length}
                  </span>
                </div>

                <p className="text-sm font-bold text-gray-900">
                  {formatShortCurrency(total)}
                </p>
              </div>

              {stageItems.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {stageItems.slice(0, 2).map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => onOpportunityClick(opp)}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <span className="font-medium text-gray-700">
                        {opp.name}
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatShortCurrency(opp.revenue)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ClientTopOpportunities({
  opportunities,
  onOpportunityClick,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">Top Deals</h3>
      <p className="mt-1 text-sm text-gray-500">
        Highest-value open workspace deals.
      </p>

      <div className="mt-5 space-y-3">
        {opportunities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            No open deals.
          </p>
        ) : (
          opportunities.map((opp) => (
            <button
              key={opp.id}
              type="button"
              onClick={() => onOpportunityClick(opp)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-left hover:bg-blue-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{opp.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{opp.company}</p>
                </div>

                <Eye className="h-4 w-4 text-gray-400" />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {formatCurrency(opp.revenue)}
                </span>

                <span className="text-sm font-semibold text-emerald-600">
                  {opp.probability}%
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function ClientRecentActivities({ activities }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">Recent Activities</h3>
      <p className="mt-1 text-sm text-gray-500">
        Latest CRM movement based on workspace deal updates.
      </p>

      <div className="mt-5 space-y-3">
        {activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            No recent activity.
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-gray-900">
                  {activity.title}
                </p>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold uppercase ${statusClass(
                    activity.status
                  )}`}
                >
                  {activity.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {activity.company} · {activity.stageName}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Updated {formatDate(activity.date)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ClientReportingSummary({ opportunities }) {
  const open = opportunities.filter((opp) => opp.status === "open");
  const won = opportunities.filter((opp) => opp.status === "won");
  const lost = opportunities.filter((opp) => opp.status === "lost");

  const totalRevenue = opportunities.reduce(
    (sum, opp) => sum + Number(opp.revenue || 0),
    0
  );

  const openRevenue = open.reduce(
    (sum, opp) => sum + Number(opp.revenue || 0),
    0
  );

  const weightedRevenue = open.reduce(
    (sum, opp) =>
      sum + Number(opp.revenue || 0) * (Number(opp.probability || 0) / 100),
    0
  );

  const rows = [
    ["Total Revenue Tracked", formatCurrency(totalRevenue)],
    ["Open Pipeline Revenue", formatCurrency(openRevenue)],
    ["Weighted Forecast", formatCurrency(weightedRevenue)],
    ["Won Deals", won.length],
    ["Lost Deals", lost.length],
    ["Open Deals", open.length],
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">Reporting Summary</h3>
      <p className="mt-1 text-sm text-gray-500">
        High-level workspace sales reporting snapshot.
      </p>

      <div className="mt-5 divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientOpportunityPreviewDrawer({ opportunity, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {opportunity.name}
            </h3>
            <p className="text-sm text-gray-500">{opportunity.company}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <Info label="Contact" value={opportunity.contact} />
          <Info label="Email" value={opportunity.email || "No email"} />
          <Info label="Phone" value={opportunity.phone || "No phone"} />
          <Info label="Stage" value={opportunity.stageName} />
          <Info label="Revenue" value={formatCurrency(opportunity.revenue)} />
          <Info label="Probability" value={`${opportunity.probability}%`} />
          <Info label="Source" value={labelize(opportunity.source)} />
          <Info label="Status" value={labelize(opportunity.status)} />
          <Info
            label="Expected Close Date"
            value={formatDate(opportunity.expectedCloseDate)}
          />
          <Info
            label="Description"
            value={opportunity.description || "No description"}
          />
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
