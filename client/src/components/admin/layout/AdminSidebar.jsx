import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, TrendingUp, BookOpen, Package,
  Mail, BarChart3, Database, Building2, MessageSquare,
  Calendar, Bot, X, ChevronRight, Settings, Shield, Sun, Moon,
  Briefcase, CheckSquare, Inbox, Wallet, PieChart, TrendingUp as Trending,
  LineChart, Target, Award, UserCircle, MessageCircle, BookOpen as Book,
  Download, Users2, Workflow, FileText, Bell, ClipboardList,
  CalendarDays, DollarSign, Scale, Lightbulb, Brain, Eye, Mic,
  FileCheck, AlertTriangle, TrendingDown, Handshake, GraduationCap,
  Search, Filter, Activity, Zap, Globe, Building, CreditCard,
  FileSearch, MessageSquarePlus, Presentation, MonitorSpeaker, Heart
} from "lucide-react";
import { cn, initials } from "../../../lib/adminUtils";
import { useTheme } from "../../../context/ThemeContext";

// Navigation organized by corporate business divisions
const NAV_SECTIONS = [
  {
    title: "Executive",
    items: [
      { to: "/Admin/Dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/Admin/Analytics", icon: BarChart3, label: "Analytics" },
      { to: "/Admin/BoardMeeting", icon: Presentation, label: "Board Meeting" },
      { to: "/Admin/InvestorRelations", icon: DollarSign, label: "Investor Relations" },
      { to: "/Admin/ComplianceRisk", icon: AlertTriangle, label: "Compliance & Risk" },
      { to: "/Admin/StrategicPlanning", icon: Target, label: "Strategic Planning" },
    ]
  },
  {
    title: "Sales & CRM",
    items: [
      { to: "/Admin/CRM", icon: Users, label: "CRM" },
      { to: "/Admin/Leads", icon: TrendingUp, label: "Leads Pipeline" },
      { to: "/Admin/Contacts", icon: BookOpen, label: "Contacts" },
      { to: "/Admin/Revenue", icon: Wallet, label: "Revenue" },
      { to: "/Admin/PipelineAnalytics", icon: Trending, label: "Pipeline Analytics" },
      { to: "/Admin/Leaderboard", icon: Award, label: "Sales Leaderboard" },
    ]
  },
  {
    title: "Marketing",
    items: [
      { to: "/Admin/Marketing", icon: Mail, label: "Email Campaigns" },
      { to: "/Admin/FacebookConnect", icon: MessageSquare, label: "Facebook Connect" },
      { to: "/Admin/CustomerPortal", icon: UserCircle, label: "Customer Portal" },
      { to: "/Admin/FeedbackPortal", icon: MessageCircle, label: "Feedback Portal" },
    ]
  },
  {
    title: "Operations",
    items: [
      { to: "/Admin/Projects", icon: Briefcase, label: "Projects" },
      { to: "/Admin/Tasks", icon: CheckSquare, label: "Tasks" },
      { to: "/Admin/Inventory", icon: Package, label: "Inventory" },
      { to: "/Admin/ERP", icon: Building2, label: "ERP Control" },
      { to: "/Admin/Booking", icon: CalendarDays, label: "Booking" },
      { to: "/Admin/Calendar", icon: Calendar, label: "Calendar" },
    ]
  },
  {
    title: "Customer Success",
    items: [
      { to: "/Admin/Inbox", icon: Inbox, label: "Inbox" },
      { to: "/Admin/Chatbot", icon: Bot, label: "AI Chatbot" },
      { to: "/Admin/KnowledgeBase", icon: Book, label: "Knowledge Base" },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { to: "/Admin/DataAnalytics", icon: PieChart, label: "Data Analytics" },
      { to: "/Admin/RevenueProjections", icon: LineChart, label: "Revenue Forecast" },
      { to: "/Admin/Predictive", icon: Target, label: "Predictive AI" },
      { to: "/Admin/Reports", icon: FileText, label: "Reports" },
      { to: "/Admin/DataExport", icon: Download, label: "Data Export" },
    ]
  },
  {
    title: "Human Resources",
    items: [
      { to: "/Admin/HRAnalytics", icon: GraduationCap, label: "HR Analytics" },
      { to: "/Admin/Performance", icon: Activity, label: "Performance Management" },
      { to: "/Admin/Recruitment", icon: Users, label: "Recruitment AI" },
      { to: "/Admin/EmployeeEngagement", icon: Heart, label: "Employee Engagement" },
    ]
  },
  {
    title: "Finance & Treasury",
    items: [
      { to: "/Admin/Finance", icon: CreditCard, label: "Finance Control" },
      { to: "/Admin/Treasury", icon: DollarSign, label: "Treasury" },
      { to: "/Admin/FinancialPlanning", icon: TrendingUp, label: "Financial Planning" },
      { to: "/Admin/FraudDetection", icon: Eye, label: "Fraud Detection" },
    ]
  },
  {
    title: "Legal & Compliance",
    items: [
      { to: "/Admin/Legal", icon: Scale, label: "Legal" },
      { to: "/Admin/ContractAnalysis", icon: FileSearch, label: "Contract Analysis" },
      { to: "/Admin/RegulatoryCompliance", icon: Shield, label: "Regulatory Compliance" },
      { to: "/Admin/RiskManagement", icon: AlertTriangle, label: "Risk Management" },
    ]
  },
  {
    title: "R&D & Innovation",
    items: [
      { to: "/Admin/Research", icon: Lightbulb, label: "Research & Development" },
      { to: "/Admin/Innovation", icon: Zap, label: "Innovation Pipeline" },
      { to: "/Admin/Patents", icon: FileCheck, label: "Patents & IP" },
      { to: "/Admin/LabManagement", icon: Building, label: "Lab Management" },
    ]
  },
  {
    title: "Advanced AI",
    items: [
      { to: "/Admin/CrossDepartmentAI", icon: Brain, label: "Cross-Department AI" },
      { to: "/Admin/ResourceAllocation", icon: Filter, label: "Resource Allocation AI" },
      { to: "/Admin/PredictiveAnalytics", icon: Target, label: "Predictive Analytics Hub" },
      { to: "/Admin/AutomatedReporting", icon: FileText, label: "Automated Reporting" },
      { to: "/Admin/WorkflowIntelligence", icon: Workflow, label: "Workflow Intelligence" },
      { to: "/Admin/DigitalTwin", icon: MonitorSpeaker, label: "Digital Twin" },
      { to: "/Admin/PrescriptiveAnalytics", icon: TrendingUp, label: "Prescriptive Analytics" },
      { to: "/Admin/AnomalyDetection", icon: Eye, label: "Anomaly Detection" },
      { to: "/Admin/NaturalLanguageInterface", icon: Mic, label: "Voice & NLP Interface" },
    ]
  },
  {
    title: "Communication & Collaboration",
    items: [
      { to: "/Admin/MeetingIntelligence", icon: Presentation, label: "Meeting Intelligence" },
      { to: "/Admin/DocumentIntelligence", icon: FileSearch, label: "Document Intelligence" },
      { to: "/Admin/CommunicationHub", icon: MessageSquarePlus, label: "Communication Hub" },
      { to: "/Admin/CorporateCommunications", icon: Globe, label: "Corporate Communications" },
    ]
  },
  {
    title: "Administration",
    items: [
      { to: "/Admin/Team", icon: Users2, label: "Team Management" },
      { to: "/Admin/Workflows", icon: Workflow, label: "Workflows" },
      { to: "/Admin/AuditLogs", icon: ClipboardList, label: "Audit Logs" },
      { to: "/Admin/Notifications", icon: Bell, label: "Notifications" },
      { to: "/Admin/Security", icon: Shield, label: "Security" },
      { to: "/Admin/AccountControl", icon: Settings, label: "Account Control" },
      { to: "/Admin/Settings", icon: Settings, label: "Settings" },
    ]
  },
];

export default function AdminSidebar({ open, onClose, user }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 flex flex-col transition-all duration-300",
          isDark ? "bg-[#0f172a]" : "bg-white",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/10" : "border-gray-200"
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ea580c] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className={`font-bold text-base tracking-tight ${isDark ? "text-white" : "text-gray-900"
              }`}>Hermes Admin</span>
          </div>
          <button onClick={onClose} className={`lg:hidden p-1 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto no-scrollbar space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className={cn(
                "px-3 text-xs font-semibold uppercase tracking-wider",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                {section.title}
              </p>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                      isActive
                        ? isDark
                          ? "bg-[#ea580c]/20 text-[#ea580c] font-medium"
                          : "bg-[#ea580c]/20 text-[#ea580c] font-medium"
                        : isDark
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isActive
                            ? "text-[#ea580c]"
                            : isDark
                              ? "text-gray-500 group-hover:text-gray-300"
                              : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-[#ea580c]" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Theme Toggle & User Footer */}
        <div className={`px-4 py-3 border-t ${isDark ? "border-white/10" : "border-gray-200"}`}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-2 ${isDark
              ? "text-gray-400 hover:text-white hover:bg-white/5"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
          >
            <span className="flex items-center gap-3">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
            </span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? "bg-[#ea580c]" : "bg-gray-300"
              }`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDark ? "left-4.5" : "left-0.5"
                }`} />
            </div>
          </button>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-[#ea580c] flex items-center justify-center text-white text-xs font-bold">
                {initials(user.full_name || user.email || "Admin")}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                  {user.full_name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.role || "Administrator"}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
