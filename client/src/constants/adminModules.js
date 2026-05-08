import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BookOpen,
  Package,
  Mail,
  BarChart3,
  Database,
  Building2,
  MessageSquare,
  CalendarDays,
  Bot,
  ChevronRight,
  Settings,
  Shield,
  Briefcase,
  CheckSquare,
  Inbox,
  Wallet,
  PieChart,
  LineChart,
  Target,
  Award,
  UserCircle,
  MessageCircle,
  BookOpen as Book,
  Download,
  Users2,
  Workflow,
  FileText,
  Bell,
  ClipboardList,
} from "lucide-react";

export const ADMIN_NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      {
        key: "dashboard",
        to: "/Admin/Dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        description: "System health, business metrics, and top-level admin status.",
      },
    ],
  },
  {
    title: "Work",
    items: [
      { key: "projects", to: "/Admin/Projects", icon: Briefcase, label: "Projects", description: "Implementation work, delivery tracking, and project progress." },
      { key: "tasks", to: "/Admin/Tasks", icon: CheckSquare, label: "Tasks", description: "Action items, assignments, and execution checkpoints." },
      { key: "deals", to: "/Admin/Deals", icon: TrendingUp, label: "Deals", description: "Pipeline opportunities and deal movement." },
      { key: "contacts", to: "/Admin/Contacts", icon: BookOpen, label: "Contacts", description: "Business contacts and relationship records." },
      { key: "inbox", to: "/Admin/Inbox", icon: Inbox, label: "Inbox", description: "Messages, conversations, and linked communications." },
      { key: "booking", to: "/Admin/Booking", icon: CalendarDays, label: "Booking", description: "Appointments, schedules, and demo booking records." },
      { key: "crm", to: "/Admin/CRM", icon: Users, label: "CRM", description: "Customer relationship management and account tracking." },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { key: "revenue", to: "/Admin/Revenue", icon: Wallet, label: "Revenue", description: "Revenue summaries, billing trends, and financial signals." },
      { key: "analytics", to: "/Admin/Analytics", icon: BarChart3, label: "Analytics", description: "Core reporting dashboards and business metrics." },
      { key: "data_analytics", to: "/Admin/DataAnalytics", icon: PieChart, label: "Data Analytics", description: "Deeper trend analysis and data breakdowns." },
      { key: "pipeline_analytics", to: "/Admin/PipelineAnalytics", icon: TrendingUp, label: "Pipeline Analytics", description: "Sales pipeline movement, conversion, and stage health." },
      { key: "revenue_projections", to: "/Admin/RevenueProjections", icon: LineChart, label: "Revenue Projections", description: "Forecasted revenue and expected growth." },
      { key: "predictive", to: "/Admin/Predictive", icon: Target, label: "Predictive", description: "Predictive recommendations and future-state signals." },
      { key: "leaderboard", to: "/Admin/Leaderboard", icon: Award, label: "Leaderboard", description: "Top performers and activity rankings." },
    ],
  },
  {
    title: "Customer",
    items: [
      { key: "customer_portal", to: "/Admin/CustomerPortal", icon: UserCircle, label: "Customer Portal", description: "Customer-facing workspace resources and access views." },
      { key: "feedback_portal", to: "/Admin/FeedbackPortal", icon: MessageCircle, label: "Feedback Portal", description: "Customer feedback collection and review." },
      { key: "knowledge_base", to: "/Admin/KnowledgeBase", icon: Book, label: "Knowledge Base", description: "Documentation, help articles, and support knowledge." },
      { key: "chatbot", to: "/Admin/Chatbot", icon: Bot, label: "Chatbot", description: "AI chatbot configuration, auto-replies, and support tools." },
      { key: "facebook_connect", to: "/Admin/FacebookConnect", icon: MessageSquare, label: "Facebook Connect", description: "Facebook messaging and integration controls." },
    ],
  },
  {
    title: "Operations",
    items: [
      { key: "inventory", to: "/Admin/Inventory", icon: Package, label: "Inventory", description: "Stock, product, and operational inventory records." },
      { key: "erp", to: "/Admin/ERP", icon: Building2, label: "ERP Control", description: "ERP tools, resource planning, and operational controls." },
      { key: "marketing", to: "/Admin/Marketing", icon: Mail, label: "Marketing", description: "Campaign tools, email marketing, and outreach controls." },
      { key: "data_export", to: "/Admin/DataExport", icon: Download, label: "Data Export", description: "Exports for reports, records, and operational data." },
    ],
  },
  {
    title: "Manage",
    items: [
      { key: "team", to: "/Admin/Team", icon: Users2, label: "Team", description: "Team members, roles, and collaboration controls." },
      { key: "workflows", to: "/Admin/Workflows", icon: Workflow, label: "Workflows", description: "Automations, process flows, and business logic." },
      { key: "reports", to: "/Admin/Reports", icon: FileText, label: "Reports", description: "Admin reports and operational summaries." },
      { key: "notifications", to: "/Admin/Notifications", icon: Bell, label: "Notifications", description: "Alerts, reminders, and system notifications." },
      { key: "audit_logs", to: "/Admin/AuditLogs", icon: ClipboardList, label: "Audit Logs", description: "Activity history, traceability, and admin audit records." },
      { key: "settings", to: "/Admin/Settings", icon: Settings, label: "Settings", description: "System configuration and admin preferences." },
      { key: "account_control", to: "/Admin/AccountControl", icon: Shield, label: "Account Control", description: "Admin access, permissions, and account governance." },
    ],
  },
];

export const ADMIN_MODULES = ADMIN_NAV_SECTIONS.flatMap((section) => section.items);

export function getAdminModuleByRoute(route) {
  return ADMIN_MODULES.find((module) => module.to === route || route.endsWith(module.to.replace("/Admin/", "")));
}

export function buildAdminModuleContext() {
  return ADMIN_NAV_SECTIONS.map((section) => {
    const items = section.items.map((item) => `${item.label}: ${item.description}`).join("\n");
    return `${section.title}\n${items}`;
  }).join("\n\n");
}