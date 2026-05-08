import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Grid3X3,
  Inbox,
  Loader2,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getEnabledClientModules } from "../../services/clientModules";

function Client_Dashboard() {
  const outletContext = useOutletContext();
  const [moduleContext, setModuleContext] = useState(outletContext || null);
  const [loading, setLoading] = useState(!outletContext);
  const [error, setError] = useState("");

  useEffect(() => {
    if (outletContext) {
      setModuleContext(outletContext);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getEnabledClientModules();

        if (mounted) {
          setModuleContext(data);
        }
      } catch (err) {
        console.error("Client dashboard load error:", err);

        if (mounted) {
          setError(err.message || "Failed to load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [outletContext]);

  const modules = moduleContext?.modules || [];
  const workspaceModules = moduleContext?.workspaceModules || [];
  const user = moduleContext?.profile;
  const workspace = moduleContext?.workspace;

  const enabledKeys = useMemo(
    () => new Set(workspaceModules.map((module) => module.key)),
    [workspaceModules]
  );

  const hasModule = (key) => enabledKeys.has(key);

  const kpiCards = [
    {
      label: "Enabled Modules",
      value: workspaceModules.length,
      sub: "Workspace tools available",
      icon: Grid3X3,
      color: "bg-blue-500",
      show: true,
    },
    {
      label: "Projects",
      value: hasModule("projects") ? "Active" : "Disabled",
      sub: hasModule("projects")
        ? "Project tracking enabled"
        : "Not enabled for workspace",
      icon: Briefcase,
      color: hasModule("projects") ? "bg-green-500" : "bg-gray-400",
      show: true,
    },
    {
      label: "CRM / Deals",
      value: hasModule("crm") || hasModule("deals") ? "Enabled" : "Disabled",
      sub: "Customer and pipeline access",
      icon: TrendingUp,
      color: hasModule("crm") || hasModule("deals") ? "bg-purple-500" : "bg-gray-400",
      show: true,
    },
    {
      label: "Access Mode",
      value: "Controlled",
      sub: "Managed by Hermes Admin",
      icon: ShieldCheck,
      color: "bg-orange-500",
      show: true,
    },
  ];

  const activityItems = [
    {
      title: "Workspace access loaded",
      time: "Just now",
      icon: ShieldCheck,
    },
    {
      title: `${workspaceModules.length} workspace modules enabled`,
      time: "Today",
      icon: Grid3X3,
    },
    {
      title: `${workspace?.name || "Workspace"} is active`,
      time: "Today",
      icon: CheckCircle2,
    },
  ];

  const moduleStatusCards = [
    {
      key: "projects",
      title: "Projects",
      description: "Project delivery and implementation tracking.",
      icon: Briefcase,
    },
    {
      key: "tasks",
      title: "Tasks",
      description: "Assigned work, task status, and execution tracking.",
      icon: CheckCircle2,
    },
    {
      key: "inbox",
      title: "Inbox",
      description: "Workspace communication and linked messages.",
      icon: Inbox,
    },
    {
      key: "booking",
      title: "Booking",
      description: "Meetings, demo bookings, and schedules.",
      icon: CalendarDays,
    },
    {
      key: "crm",
      title: "CRM",
      description: "Customer records and relationship tracking.",
      icon: Users,
    },
    {
      key: "analytics",
      title: "Analytics",
      description: "Workspace metrics and reporting insights.",
      icon: BarChart3,
    },
  ];

  const availabilityData = [
    { name: "Enabled", value: workspaceModules.length },
    {
      name: "Available",
      value: Math.max(0, 26 - workspaceModules.length),
    },
  ];

  const activityTrendData = [
    { month: "Jan", modules: 1, activity: 20 },
    { month: "Feb", modules: 2, activity: 35 },
    { month: "Mar", modules: 2, activity: 45 },
    { month: "Apr", modules: workspaceModules.length, activity: 60 },
    { month: "May", modules: workspaceModules.length, activity: 75 },
    { month: "Jun", modules: workspaceModules.length, activity: 90 },
  ];

  const moduleCategoryData = [
    {
      name: "Work",
      value: workspaceModules.filter((m) => m.section === "Work").length,
    },
    {
      name: "Intelligence",
      value: workspaceModules.filter((m) => m.section === "Intelligence").length,
    },
    {
      name: "Customer",
      value: workspaceModules.filter((m) => m.section === "Customer").length,
    },
    {
      name: "Operations",
      value: workspaceModules.filter((m) => m.section === "Operations").length,
    },
    {
      name: "Manage",
      value: workspaceModules.filter((m) => m.section === "Manage").length,
    },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#ea580c]" />
          <span className="text-sm font-medium text-gray-600">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <h2 className="mt-3 text-lg font-bold text-red-900">
            Failed to load dashboard
          </h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Client Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ""}. This
            dashboard is generated from the modules enabled for your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#ea580c]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Current Workspace
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {workspace?.name || "Client Workspace"}
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Health */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#c9a84c]" />
            <h2 className="font-bold text-gray-900">Workspace Health</h2>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Workspace
            </p>
            <p className="mt-2 font-bold text-gray-900">
              {workspace?.name || "Active Workspace"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Status
            </p>
            <p className="mt-2 font-bold capitalize text-emerald-600">
              {workspace?.status || "active"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Module Access
            </p>
            <p className="mt-2 font-bold text-gray-900">Controlled</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">
              Portal Mode
            </p>
            <p className="mt-2 font-bold text-gray-900">Client Workspace</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
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
                  <h3 className="mt-4 text-2xl font-bold text-gray-900">
                    {card.value}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-gray-500">
                    {card.sub}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#c9a84c]" />
              <h2 className="font-bold text-gray-900">Workspace Activity</h2>
            </div>
          </div>

          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="#c9a84c"
                  fill="#c9a84c"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="modules"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-[#c9a84c]" />
              <h2 className="font-bold text-gray-900">Module Access</h2>
            </div>
          </div>

          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Module Status + Activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#c9a84c]" />
              <h2 className="font-bold text-gray-900">
                Operational Module Status
              </h2>
            </div>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2">
            {moduleStatusCards.map((item) => {
              const Icon = item.icon;
              const enabled = hasModule(item.key);

              return (
                <div
                  key={item.key}
                  className={[
                    "rounded-xl border p-4",
                    enabled
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-white text-gray-400",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p
                        className={[
                          "mt-1 text-xs font-bold uppercase",
                          enabled ? "text-emerald-700" : "text-gray-400",
                        ].join(" ")}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#c9a84c]" />
              <h2 className="font-bold text-gray-900">Recent Activities</h2>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {activityItems.map((activity) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.title}
                  className="flex items-center gap-3 rounded-xl bg-[#0f172a] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c]/10 text-[#c9a84c]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-white/40">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module Category Chart */}
      {moduleCategoryData.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#c9a84c]" />
              <h2 className="font-bold text-gray-900">
                Enabled Modules by Category
              </h2>
            </div>
          </div>

          <div className="h-72 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis allowDecimals={false} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" fill="#c9a84c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Quick Access Modules
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Open the modules currently available to your workspace.
            </p>
          </div>

          <Bell className="h-5 w-5 text-gray-300" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.key}
                to={module.route}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#ea580c]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#ea580c]" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{module.label}</h3>

                    {module.isCore && (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {module.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Client_Dashboard;
