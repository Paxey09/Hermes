import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "../../config/supabaseClient.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

/* ─── Design Tokens ──────────────────────────────────────────── */
const THEME = {
  colors: {
    primary: "#6366f1",
    revenue: "#3b82f6",
    users: "#10b981",
    conversion: "#f59e0b",
    growth: "#8b5cf6",
    danger: "#ef4444",
    success: "#22c55e",
    background: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: { primary: "#0f172a", secondary: "#64748b", muted: "#94a3b8" },
  },
};

const TRAFFIC_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
const RANGES = [{ key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "90d", label: "90D" }];
const RANGE_LABELS = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };
const QUICK_PROMPTS = [
  "What's driving revenue growth?",
  "Predict next month's conversion rate",
  "Which metric needs attention?",
  "Summarise performance this period",
];
const PAGE_SIZE = 20;

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n) =>
  n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `₱${(n / 1_000).toFixed(0)}k`
      : `₱${n}`;
const pctFmt = (n) => `${Number(n).toFixed(1)}%`;
const numFmt = (n) => Number(n).toLocaleString();
const calcChange = (arr) => {
  if (!arr || arr.length < 2) return 0;
  const latest = arr.at(-1)?.value ?? 0;
  const previous = arr.at(-2)?.value ?? 0;
  if (!previous) return 0;
  return ((latest - previous) / previous) * 100;
};

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ label, value, delta, icon: Icon, color }) {
  const isUp = delta >= 0;
  return (
    <div
      style={{ background: THEME.colors.surface, borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", border: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.2s ease", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgb(0 0 0 / 0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px 0 rgb(0 0 0 / 0.1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={24} color={color} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", background: isUp ? "#dcfce7" : "#fee2e2", color: isUp ? "#166534" : "#991b1b", fontSize: "13px", fontWeight: "600" }}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
      <div>
        <p style={{ fontSize: "14px", color: THEME.colors.text.secondary, margin: "0 0 8px 0", fontWeight: "500" }}>{label}</p>
        <p style={{ fontSize: "28px", fontWeight: "700", color: THEME.colors.text.primary, margin: 0, letterSpacing: "-0.5px" }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Chart Card ─────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: THEME.colors.surface, borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", border: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: THEME.colors.text.primary, margin: "0 0 4px 0" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: "13px", color: THEME.colors.text.muted, margin: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ─── AI Insights Panel ──────────────────────────────────────── */
function AiInsightsPanel({ metrics, revenueChart, conversionChart, userChart, growthChart, timeRange }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your analytics AI. I have full visibility into your current metrics. Ask me anything — trends, predictions, or recommendations.",
      chips: ["⚡ Real-time data connected", "📊 Predictive mode ready"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const buildContext = useCallback(() => {
    const revenueLatest = revenueChart.at(-1)?.value ?? metrics.total_revenue;
    const convLatest = conversionChart.at(-1)?.value ?? metrics.conversion_rate;
    const revenueArr = revenueChart.map((d) => `${d.date}: ₱${d.value.toFixed(0)}`).join(", ");
    const convArr = conversionChart.map((d) => `${d.date}: ${d.value.toFixed(2)}%`).join(", ");
    return `You are an expert business analytics AI assistant embedded in an admin analytics dashboard for a Philippine e-commerce/business platform.

LIVE METRICS (${timeRange} window):
- Total Revenue: ₱${revenueLatest.toLocaleString()}
- Active Users: ${metrics.active_users.toLocaleString()}
- Conversion Rate: ${convLatest.toFixed(2)}%
- Growth Rate: ${metrics.growth_rate.toFixed(2)}%

REVENUE TREND DATA: ${revenueArr || "Insufficient data"}
CONVERSION TREND DATA: ${convArr || "Insufficient data"}

TRAFFIC SOURCES: Direct 40%, Organic 30%, Referral 20%, Social 10%

INSTRUCTIONS:
- Give concise, actionable insights (under 120 words)
- Reference specific numbers from the data when relevant
- Use bullet points for lists (max 4 bullets)
- For predictions, state a confidence level
- Currency is Philippine Peso (₱)`;
  }, [metrics, revenueChart, conversionChart, timeRange]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          max_tokens: 1000,
          messages: [
            { role: "system", content: buildContext() },
            { role: "user", content: msg }
          ],
        }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Unable to generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "⚠ Could not reach the AI service. Please try again shortly.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (data) => {
    if (!data || data.length < 2) return { slope: 0, r2: 0, avg: 0 };
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map((d) => d.value);
    const sx = x.reduce((a, b) => a + b, 0);
    const sy = y.reduce((a, b) => a + b, 0);
    const sxy = x.reduce((t, xi, i) => t + xi * y[i], 0);
    const sx2 = x.reduce((t, xi) => t + xi * xi, 0);
    const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const yMean = sy / n;
    const ssTotal = y.reduce((t, yi) => t + (yi - yMean) ** 2, 0);
    const ssRes = y.reduce((t, yi, i) => t + (yi - (slope * x[i] + intercept)) ** 2, 0);
    return { slope, r2: ssTotal > 0 ? 1 - ssRes / ssTotal : 0, avg: yMean };
  };

  const runPredictiveAnalysis = async () => {
    setPredicting(true);
    setPredictions(null);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const rT = calculateTrend(revenueChart);
      const cT = calculateTrend(conversionChart);
      const uT = calculateTrend(userChart);
      const D = 30;
      const pR = rT.avg + rT.slope * D;
      const pC = cT.avg + cT.slope * D;
      const pU = uT.avg + uT.slope * D;
      const curR = revenueChart.at(-1)?.value || rT.avg || 1;
      const curC = conversionChart.at(-1)?.value || cT.avg || 1;
      const curU = userChart.at(-1)?.value || uT.avg || 1;
      const pts = revenueChart.length || 1;
      const confidence = Math.round(60 + Math.min(25, ((rT.r2 + cT.r2) / 2) * 25) + Math.min(15, (pts / 30) * 15));
      let topRisk = "Insufficient data for risk analysis";
      let topOpportunity = "Insufficient data for opportunity analysis";
      if (cT.slope < 0) topRisk = "Conversion rate trending downward";
      else if (rT.slope < 0) topRisk = "Revenue growth slowing";
      else if (confidence < 70) topRisk = "Low prediction confidence — collect more data";
      if (cT.slope > 0 && rT.slope > 0) topOpportunity = "Strong conversion + revenue growth trajectory";
      else if (uT.slope > 0) topOpportunity = "User acquisition accelerating";
      else if (rT.slope > uT.slope && uT.slope > 0) topOpportunity = "Revenue per user increasing";
      setPredictions({
        projectedRevenue: { value: Math.max(0, pR), change: ((pR - curR) / curR) * 100, confidence },
        projectedUsers: { value: Math.max(0, Math.round(pU)), change: ((pU - curU) / curU) * 100, confidence: Math.round(confidence * 0.9) },
        projectedConversion: { value: Math.max(0, Math.min(100, pC)), change: ((pC - curC) / curC) * 100, confidence: Math.round(confidence * 0.85) },
        topRisk, topOpportunity,
      });
    } catch {
      setPredictions({ error: "Failed to generate predictions" });
    } finally {
      setPredicting(false);
    }
  };

  const ttStyle = { backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px", padding: "8px 12px" };

  return (
    <div style={{ background: THEME.colors.surface, borderRadius: "16px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)", border: `1px solid ${THEME.colors.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${THEME.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "white", margin: 0 }}>AI Insights</h3>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", margin: 0 }}>Powered by Claude</p>
          </div>
        </div>
        <button onClick={runPredictiveAnalysis} disabled={predicting} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.2)", color: "white", fontSize: "13px", fontWeight: "500", cursor: predicting ? "not-allowed" : "pointer", opacity: predicting ? 0.7 : 1 }}>
          {predicting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={14} />}
          {predicting ? "Analyzing..." : "Forecast"}
        </button>
      </div>

      {/* Predictions */}
      {predictions && !predictions.error && (
        <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: `1px solid ${THEME.colors.border}` }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: THEME.colors.text.secondary, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>30-Day Forecast</p>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { label: "Revenue", value: fmt(predictions.projectedRevenue.value), change: predictions.projectedRevenue.change, conf: predictions.projectedRevenue.confidence, color: THEME.colors.revenue },
              { label: "Users", value: numFmt(predictions.projectedUsers.value), change: predictions.projectedUsers.change, conf: predictions.projectedUsers.confidence, color: THEME.colors.users },
              { label: "Conv.", value: pctFmt(predictions.projectedConversion.value), change: predictions.projectedConversion.change, conf: predictions.projectedConversion.confidence, color: THEME.colors.conversion },
            ].map((pred, i) => (
              <div key={i} style={{ flex: 1, padding: "12px", background: "white", borderRadius: "10px", border: `1px solid ${THEME.colors.border}` }}>
                <p style={{ fontSize: "11px", color: THEME.colors.text.muted, margin: "0 0 6px 0" }}>{pred.label}</p>
                <p style={{ fontSize: "16px", fontWeight: "700", color: THEME.colors.text.primary, margin: "0 0 4px 0" }}>{pred.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: pred.change >= 0 ? THEME.colors.success : THEME.colors.danger, fontWeight: "600" }}>
                    {pred.change >= 0 ? "+" : ""}{pred.change.toFixed(1)}%
                  </span>
                  <div style={{ flex: 1, height: "4px", background: THEME.colors.border, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${pred.conf}%`, height: "100%", background: pred.color, borderRadius: "2px" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
            <div style={{ padding: "10px 12px", background: "#fee2e2", borderRadius: "8px" }}>
              <p style={{ fontSize: "10px", fontWeight: "600", color: "#991b1b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Top Risk</p>
              <p style={{ fontSize: "12px", color: "#7f1d1d", margin: 0 }}>{predictions.topRisk}</p>
            </div>
            <div style={{ padding: "10px 12px", background: "#dcfce7", borderRadius: "8px" }}>
              <p style={{ fontSize: "10px", fontWeight: "600", color: "#166534", margin: "0 0 4px 0", textTransform: "uppercase" }}>Opportunity</p>
              <p style={{ fontSize: "12px", color: "#14532d", margin: 0 }}>{predictions.topOpportunity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={16} color="white" />
              </div>
            )}
            <div>
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: msg.role === "user" ? THEME.colors.primary : msg.isError ? "#fee2e2" : "#f1f5f9", color: msg.role === "user" ? "white" : msg.isError ? "#991b1b" : THEME.colors.text.primary, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {msg.text}
              </div>
              {msg.chips && (
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  {msg.chips.map((chip, ci) => (
                    <span key={ci} style={{ padding: "4px 10px", borderRadius: "12px", background: "#e0e7ff", color: "#4338ca", fontSize: "11px", fontWeight: "500" }}>{chip}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="white" />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#f1f5f9", display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: THEME.colors.text.muted, animation: `bounce 1s infinite ${delay}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${THEME.colors.border}`, display: "flex", gap: "8px", overflowX: "auto" }}>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button key={i} onClick={() => sendMessage(prompt)} disabled={loading} style={{ padding: "8px 14px", borderRadius: "20px", border: `1px solid ${THEME.colors.border}`, background: "white", color: THEME.colors.text.secondary, fontSize: "12px", whiteSpace: "nowrap", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${THEME.colors.border}`, display: "flex", gap: "12px" }}>
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Ask about your analytics..." disabled={loading}
          style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", border: `1px solid ${THEME.colors.border}`, fontSize: "14px", outline: "none", background: "white" }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          style={{ width: "44px", height: "44px", borderRadius: "10px", border: "none", background: THEME.colors.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.6 : 1 }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── User Table with Pagination, Search & Filters ───────────── */
function UserTable({ userList, loading }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => setPage(1), [userList.length, searchQuery, roleFilter]);

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role || "Client").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        (user.role || "Client").toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [userList, searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pageSlice = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    const roles = new Set(userList.map((u) => u.role || "Client"));
    return Array.from(roles).sort();
  }, [userList]);

  // Helper: get initials from full_name or email
  const getInitial = (user) =>
    (user.full_name?.[0] || user.email?.[0] || "?").toUpperCase();

  // Helper: derive display username from email
  const getUsername = (user) =>
    user.email ? `@${user.email.split("@")[0]}` : "";

  // Role badge colours — handles capitalised ("Admin") and lowercase ("admin")
  const getRoleBadge = (role) => {
    const r = (role || "Client").toLowerCase();
    if (r === "admin") return { bg: "#fef3c7", color: "#92400e" };
    return { bg: "#e0e7ff", color: "#4338ca" };
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setPage(1);
  };

  const hasActiveFilters = searchQuery || roleFilter !== "all";

  return (
    <div style={{ marginTop: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: THEME.colors.text.primary, margin: 0 }}>
          All Users
        </h3>
        <span style={{ fontSize: "13px", color: THEME.colors.text.muted }}>
          {filteredUsers.length.toLocaleString()} shown
          {hasActiveFilters && ` of ${userList.length.toLocaleString()} total`}
          {totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </span>
      </div>

      {/* Search & Filters Bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#000" }} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              borderRadius: "10px",
              border: `1px solid ${THEME.colors.border}`,
              fontSize: "14px",
              outline: "none",
              background: "white",
              color: "#000", 
              transition: "border-color 0.2s",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: THEME.colors.text.muted,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color={THEME.colors.text.secondary} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${THEME.colors.border}`,
              fontSize: "14px",
              background: "white",
              cursor: "pointer",
              outline: "none",
              minWidth: "120px",
              color: "#000",
            }}
          >
            <option value="all">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${THEME.colors.border}`,
              background: "white",
              color: THEME.colors.text.secondary,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      <div style={{ background: THEME.colors.surface, borderRadius: "16px", border: `1px solid ${THEME.colors.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: THEME.colors.text.muted }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <p>Loading all users…</p>
          </div>
        ) : userList.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: THEME.colors.text.muted }}>
            <Users size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <p>No users found</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: THEME.colors.text.muted }}>
            <Search size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <p style={{ margin: "0 0 8px 0" }}>No users match your filters</p>
            <button
              onClick={clearFilters}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: `1px solid ${THEME.colors.border}`,
                background: "white",
                color: THEME.colors.primary,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${THEME.colors.border}` }}>
                    {["#", "User", "Email", "Role", "Joined"].map((col) => (
                      <th key={col} style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: THEME.colors.text.secondary, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((user, idx) => {
                    const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                    const badge = getRoleBadge(user.role);
                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom: idx < pageSlice.length - 1 ? `1px solid ${THEME.colors.border}` : "none", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Row number */}
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: THEME.colors.text.muted, width: "40px" }}>
                          {rowNum}
                        </td>

                        {/* User — avatar + full_name + derived username */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: user.avatar_url ? "transparent" : THEME.colors.primary, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "14px", fontWeight: "600", color: "white", flexShrink: 0 }}>
                              {user.avatar_url
                                ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : getInitial(user)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: THEME.colors.text.primary }}>
                                {user.full_name || "Unnamed User"}
                              </p>
                              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: THEME.colors.text.muted }}>
                                {getUsername(user)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: THEME.colors.text.primary }}>
                            {user.email || "-"}
                          </p>
                        </td>

                        {/* Role — handles "Admin", "Client", etc. */}
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "500", background: badge.bg, color: badge.color }}>
                            {user.role || "Client"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td style={{ padding: "14px 16px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: THEME.colors.text.primary }}>
                            {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: THEME.colors.text.muted }}>
                            {new Date(user.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${THEME.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: THEME.colors.text.muted }}>
                  Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, filteredUsers.length).toLocaleString()} of {filteredUsers.length.toLocaleString()}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${THEME.colors.border}`, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "…" ? (
                        <span key={`ellipsis-${i}`} style={{ fontSize: "13px", color: THEME.colors.text.muted, padding: "0 4px" }}>…</span>
                      ) : (
                        <button
                          key={item} onClick={() => setPage(item)}
                          style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${item === page ? THEME.colors.primary : THEME.colors.border}`, background: item === page ? THEME.colors.primary : "white", color: item === page ? "white" : THEME.colors.text.secondary, fontSize: "13px", fontWeight: item === page ? "600" : "400", cursor: "pointer" }}>
                          {item}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${THEME.colors.border}`, background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState({ total_revenue: 0, growth_rate: 0, active_users: 0, conversion_rate: 0 });
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const snapshotRef = useRef(null);

  const [userStats, setUserStats] = useState({
    totalUsers: 0, newUsersThisMonth: 0, userGrowthRate: 0,
    roleDistribution: [], statusDistribution: [], registrationTrend: [],
  });
  const [userList, setUserList] = useState([]);
  const [userTableLoading, setUserTableLoading] = useState(false);

  const rangeInDays = (r) => (r === "7d" ? 7 : r === "30d" ? 30 : 90);

  const filterByTimeRange = useCallback((data) => {
    const now = new Date();
    const days = rangeInDays(timeRange);
    return (data || []).filter((item) => {
      const date = new Date(item.recorded_at || item.created_at);
      return (now - date) / (1000 * 60 * 60 * 24) <= days;
    });
  }, [timeRange]);

  const calcChange_ = (newVal, oldVal) => (!oldVal ? 0 : ((newVal - oldVal) / oldVal) * 100);

  const fetchActiveUsers = async (startDate) => {
    const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("updated_at", startDate.toISOString());
    if (error) throw error;
    return count ?? 0;
  };

  /* ── Fetch ALL users using Admin client (bypasses RLS) ── */
  const fetchAllUsers = async () => {
    setUserTableLoading(true);
    try {
      const { fetchAllProfilesAdmin } = await import("../../config/supabaseAdminClient.js");
      const { data, error } = await fetchAllProfilesAdmin();
      if (error) throw error;
      setUserList(data || []);
    } catch (err) {
      console.error("Error fetching all users:", err);
      // Fallback: try regular client
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000);
        setUserList(data || []);
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    } finally {
      setUserTableLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const { count: totalUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true });

      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { count: newUsersThisMonth } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString());

      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      const { count: lastMonthUsers } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfLastMonth.toISOString()).lt("created_at", startOfMonth.toISOString());

      const userGrowthRate = lastMonthUsers > 0 ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      // Only select the columns that exist in this table
      const { data: users } = await supabase.from("profiles").select("role, created_at");

      const roleCounts = {}, registrationsByDate = {};
      users?.forEach((user) => {
        // Normalise role to capitalised form for display consistency
        const role = user.role || "Client";
        roleCounts[role] = (roleCounts[role] || 0) + 1;

        const userDate = new Date(user.created_at);
        const daysAgo = Math.floor((Date.now() - userDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo <= 30) {
          const dateKey = userDate.toLocaleDateString("en-CA");
          registrationsByDate[dateKey] = (registrationsByDate[dateKey] || 0) + 1;
        }
      });

      const roleDistribution = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      const registrationTrend = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString("en-CA");
        registrationTrend.push({ date: dateKey, value: registrationsByDate[dateKey] || 0 });
      }

      setUserStats({
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        userGrowthRate,
        roleDistribution,
        // No status column — derive from updated_at as a proxy (active if updated in last 30d)
        statusDistribution: [],
        registrationTrend,
      });
    } catch (err) { console.error("Error fetching user analytics:", err); }
  };

  const computeGrowthRate = async () => {
    const now = new Date(), days = rangeInDays(timeRange);
    const cStart = new Date(); cStart.setDate(now.getDate() - days);
    const pStart = new Date(cStart); pStart.setDate(cStart.getDate() - days);
    const [current, previous] = await Promise.all([fetchActiveUsers(cStart), fetchActiveUsers(pStart)]);
    return calcChange_(current, previous);
  };

  const buildChartData = (data, metricName) => {
    const grouped = {};
    (data || []).filter((m) => m.metric_name === metricName).forEach((item) => {
      const date = new Date(item.recorded_at).toLocaleDateString("en-CA");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(Number(item.value));
    });
    return Object.keys(grouped).sort().map((date) => ({ date, value: grouped[date].reduce((a, b) => a + b, 0) / grouped[date].length }));
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("metrics").select("*").order("recorded_at", { ascending: true });
      if (error) throw error;
      const filtered = filterByTimeRange(data);
      const revenue = buildChartData(filtered, "total_revenue");
      const conversion = buildChartData(filtered, "conversion_rate");
      const activeUsersCount = await fetchActiveUsers(new Date(Date.now() - rangeInDays(timeRange) * 86400000));
      const growthRateValue = await computeGrowthRate();
      setMetricsHistory(filtered);
      setMetrics({ total_revenue: revenue.at(-1)?.value ?? 0, active_users: activeUsersCount, conversion_rate: conversion.at(-1)?.value ?? 0, growth_rate: growthRateValue });
      await fetchUserAnalytics();
      await fetchAllUsers();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const revenueChart = useMemo(() => buildChartData(metricsHistory, "total_revenue"), [metricsHistory]);
  const userChart = useMemo(() => buildChartData(metricsHistory, "active_users"), [metricsHistory]);
  const conversionChart = useMemo(() => buildChartData(metricsHistory, "conversion_rate"), [metricsHistory]);
  const growthChart = useMemo(() => buildChartData(metricsHistory, "growth_rate"), [metricsHistory]);

  const revenueChange = calcChange(revenueChart);
  const userChange = calcChange(userChart);
  const conversionChange = calcChange(conversionChart);
  const growthChange = calcChange(growthChart);

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  useEffect(() => {
    const channel = supabase
      .channel("metrics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "metrics" }, (payload) => {
        const row = payload.new;
        if (!row) return;
        setMetricsHistory((prev) => filterByTimeRange([...prev, row]));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [timeRange]);

  const exportXLSX = () => {
    if (!metricsHistory?.length) return;
    const grouped = {};
    metricsHistory.forEach((item) => {
      const date = new Date(item.recorded_at).toLocaleDateString("en-CA");
      if (!grouped[date]) grouped[date] = { date, total_revenue: 0, active_users: 0, conversion_rate: 0, growth_rate: 0 };
      const value = Number(item.value) || 0;
      if (item.metric_name in grouped[date]) grouped[date][item.metric_name] += value;
    });
    const exportData = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = Object.keys(exportData[0] || {}).map((key) => ({ wch: Math.max(key.length, ...exportData.map((row) => String(row[key] ?? "").length)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics Report");
    XLSX.writeFile(workbook, `analytics-report-${timeRange}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = async () => {
    if (!snapshotRef.current) return;
    const canvas = await html2canvas(snapshotRef.current);
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape" });
    pdf.addImage(img, "PNG", 10, 10, 277, 0);
    pdf.save("analytics.pdf");
  };

  const tooltipStyle = { backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px", padding: "8px 12px" };

  return (
    <div ref={snapshotRef} style={{ minHeight: "100vh", background: THEME.colors.background, padding: "24px" }}>
      <style>{`
        @keyframes spin   { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: THEME.colors.text.primary}}>Analytics Dashboard</h1>
          <p style={{ fontSize: "14px", color: THEME.colors.text.secondary, margin: 0 }}>Track your business performance and insights</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", background: "white", borderRadius: "10px", padding: "4px", border: `1px solid ${THEME.colors.border}` }}>
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setTimeRange(r.key)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: timeRange === r.key ? THEME.colors.primary : "transparent", color: timeRange === r.key ? "white" : THEME.colors.text.secondary, fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}>
                {r.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={exportXLSX} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", border: `1px solid ${THEME.colors.border}`, background: "white", color: THEME.colors.text.primary, fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              <FileSpreadsheet size={16} /> Export XLSX
            </button>
            <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", border: `1px solid ${THEME.colors.border}`, background: "white", color: THEME.colors.text.primary, fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <KpiCard label="Total Revenue" value={fmt(metrics.total_revenue)} delta={revenueChange} icon={DollarSign} color={THEME.colors.revenue} />
        <KpiCard label="Active Users" value={numFmt(metrics.active_users)} delta={userChange} icon={Users} color={THEME.colors.users} />
        <KpiCard label="Conversion Rate" value={pctFmt(metrics.conversion_rate)} delta={conversionChange} icon={Target} color={THEME.colors.conversion} />
        <KpiCard label="Growth Rate" value={pctFmt(metrics.growth_rate)} delta={growthChange} icon={TrendingUp} color={THEME.colors.growth} />
      </div>

      {/* Charts + AI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <ChartCard title="Revenue Trend" subtitle={RANGE_LABELS[timeRange]}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME.colors.revenue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME.colors.revenue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke={THEME.colors.revenue} strokeWidth={2} fill="url(#revenueGrad)" dot={{ r: 4, strokeWidth: 2, fill: "white" }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <ChartCard title="Conversion Rate" subtitle={RANGE_LABELS[timeRange]}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={conversionChart}>
                  <defs><linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.conversion} stopOpacity={0.3} /><stop offset="95%" stopColor={THEME.colors.conversion} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)}%`, "Conversion Rate"]} />
                  <Area type="monotone" dataKey="value" stroke={THEME.colors.conversion} strokeWidth={2} fill="url(#convGrad)" dot={{ r: 3, strokeWidth: 2, fill: "white" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Growth Rate" subtitle={RANGE_LABELS[timeRange]}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthChart}>
                  <defs><linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.growth} stopOpacity={0.3} /><stop offset="95%" stopColor={THEME.colors.growth} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)}%`, "Growth Rate"]} />
                  <Area type="monotone" dataKey="value" stroke={THEME.colors.growth} strokeWidth={2} fill="url(#growthGrad)" dot={{ r: 3, strokeWidth: 2, fill: "white" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
        <div style={{ height: "calc(100vh - 200px)", minHeight: "700px" }}>
          <AiInsightsPanel metrics={metrics} revenueChart={revenueChart} conversionChart={conversionChart} userChart={userChart} growthChart={growthChart} timeRange={timeRange} />
        </div>
      </div>

      {/* User Analytics Section */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: THEME.colors.text.primary, margin: "0 0 20px 0" }}>User Overview</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
          <KpiCard label="Total Users" value={numFmt(userStats.totalUsers)} delta={userStats.userGrowthRate} icon={Users} color={THEME.colors.users} />
          <KpiCard label="New Users This Month" value={numFmt(userStats.newUsersThisMonth)} delta={userStats.newUsersThisMonth > 0 ? 100 : 0} icon={Zap} color={THEME.colors.conversion} />
          <KpiCard label="User Growth Rate" value={pctFmt(userStats.userGrowthRate)} delta={userStats.userGrowthRate} icon={TrendingUp} color={THEME.colors.growth} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <ChartCard title="User Roles" subtitle="Distribution by role">
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={userStats.roleDistribution.length > 0 ? userStats.roleDistribution : [{ name: "No Data", value: 1 }]}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                >
                  {(userStats.roleDistribution.length > 0 ? userStats.roleDistribution : [{ name: "No Data", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} users`, n]} />
              </RePieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
              {userStats.roleDistribution.map((role, i) => (
                <div key={role.name} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }} />
                  <span style={{ fontSize: "11px", color: THEME.colors.text.secondary }}>{role.name} ({role.value})</span>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="New Registrations" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userStats.registrationTrend}>
                <defs><linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={THEME.colors.primary} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} new users`, "Registrations"]} />
                <Area type="monotone" dataKey="value" stroke={THEME.colors.primary} strokeWidth={2} fill="url(#regGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Full user table — paginated client-side */}
        <UserTable userList={userList} loading={userTableLoading} />
      </div>
    </div>
  );
}
