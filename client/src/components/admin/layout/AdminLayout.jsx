import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { supabase } from "../../../config/supabaseClient";
import { useTheme } from "../../../context/ThemeContext";

const TITLES = {
  "/Admin/Dashboard": "Executive Dashboard",
  "/Admin/Analytics": "Analytics",
  "/Admin/BoardMeeting": "Board Meeting View",
  "/Admin/InvestorRelations": "Investor Relations",
  "/Admin/ComplianceRisk": "Compliance & Risk",
  "/Admin/StrategicPlanning": "Strategic Planning",
  "/Admin/CRM": "CRM",
  "/Admin/Deals": "Deals Pipeline",
  "/Admin/Contacts": "Contacts",
  "/Admin/Revenue": "Revenue",
  "/Admin/PipelineAnalytics": "Pipeline Analytics",
  "/Admin/Leaderboard": "Sales Leaderboard",
  "/Admin/Marketing": "Email Campaigns",
  "/Admin/FacebookConnect": "Facebook Connect",
  "/Admin/CustomerPortal": "Customer Portal",
  "/Admin/FeedbackPortal": "Feedback Portal",
  "/Admin/Projects": "Projects",
  "/Admin/Tasks": "Tasks",
  "/Admin/Inventory": "Inventory",
  "/Admin/ERP": "ERP Control",
  "/Admin/Booking": "Booking",
  "/Admin/Calendar": "Calendar",
  "/Admin/Inbox": "Inbox",
  "/Admin/Chatbot": "AI Chatbot",
  "/Admin/KnowledgeBase": "Knowledge Base",
  "/Admin/DataAnalytics": "Data Analytics",
  "/Admin/RevenueProjections": "Revenue Forecast",
  "/Admin/Predictive": "Predictive AI",
  "/Admin/Reports": "Reports",
  "/Admin/DataExport": "Data Export",
  "/Admin/HRAnalytics": "HR Analytics",
  "/Admin/Performance": "Performance Management",
  "/Admin/Recruitment": "Recruitment AI",
  "/Admin/EmployeeEngagement": "Employee Engagement",
  "/Admin/Finance": "Finance Control",
  "/Admin/Treasury": "Treasury",
  "/Admin/FinancialPlanning": "Financial Planning",
  "/Admin/FraudDetection": "Fraud Detection",
  "/Admin/Legal": "Legal",
  "/Admin/ContractAnalysis": "Contract Analysis",
  "/Admin/RegulatoryCompliance": "Regulatory Compliance",
  "/Admin/RiskManagement": "Risk Management",
  "/Admin/Research": "Research & Development",
  "/Admin/Innovation": "Innovation Pipeline",
  "/Admin/Patents": "Patents & IP",
  "/Admin/LabManagement": "Lab Management",
  "/Admin/CrossDepartmentAI": "Cross-Department AI",
  "/Admin/ResourceAllocation": "Resource Allocation AI",
  "/Admin/PredictiveAnalytics": "Predictive Analytics Hub",
  "/Admin/AutomatedReporting": "Automated Reporting",
  "/Admin/WorkflowIntelligence": "Workflow Intelligence",
  "/Admin/DigitalTwin": "Digital Twin",
  "/Admin/PrescriptiveAnalytics": "Prescriptive Analytics",
  "/Admin/AnomalyDetection": "Anomaly Detection",
  "/Admin/NaturalLanguageInterface": "Voice & NLP Interface",
  "/Admin/MeetingIntelligence": "Meeting Intelligence",
  "/Admin/DocumentIntelligence": "Document Intelligence",
  "/Admin/CommunicationHub": "Communication Hub",
  "/Admin/CorporateCommunications": "Corporate Communications",
  "/Admin/Team": "Team Management",
  "/Admin/Workflows": "Workflows",
  "/Admin/AuditLogs": "Audit Logs",
  "/Admin/Notifications": "Notifications",
  "/Admin/Security": "Security",
  "/Admin/AccountControl": "Account Control",
  "/Admin/Settings": "Settings",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser(profile || authUser);
      }
    };
    getUser();
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark
      ? "bg-[#0a0e1a]"
      : "bg-gray-50"
      }`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          onMenu={() => setSidebarOpen(true)}
          title={TITLES[location.pathname] || "Hermes Admin"}
          user={user}
        />
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-colors duration-300 ${isDark ? "bg-[#0a0e1a]" : "bg-gray-50"
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
