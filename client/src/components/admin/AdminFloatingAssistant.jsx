import { useMemo, useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, X, AlertTriangle, Sparkles, Activity } from "lucide-react";
import { aiApi, mainApi, securityApi } from "../../services/api";

const ADMIN_CHATBOT_MODEL = import.meta.env.VITE_ADMIN_CHATBOT_MODEL || import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";

const ADMIN_MODULES = [
  "Dashboard",
  "CRM",
  "Deals",
  "Contacts",
  "Inventory",
  "Marketing",
  "Analytics",
  "ERP",
  "Inbox",
  "Calendar",
  "Chatbot",
  "Security",
  "Settings",
  "Projects",
  "Tasks",
  "Team",
  "Booking",
  "Revenue",
  "KnowledgeBase",
  "Reports",
  "AuditLogs",
  "FacebookConnect",
  "AccountControl",
];

function getCurrentModule(pathname) {
  const routePart = pathname.split("/").filter(Boolean)[1];
  return routePart || "Dashboard";
}

function normalizeCheck(name, result) {
  if (result.status === "fulfilled") {
    const value = result.value || {};
    const status = String(value.status || "healthy").toLowerCase();

    return {
      name,
      status,
      detail: value.message || value.error || "Healthy",
    };
  }

  return {
    name,
    status: "down",
    detail: result.reason?.message || "Service unavailable",
  };
}

export default function AdminFloatingAssistant() {
  const location = useLocation();
  const scrollRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [input, setInput] = useState("");
  const [lastSnapshot, setLastSnapshot] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Admin Sentinel online. I can scan all admin modules and detect bugs, mismatches, and risky system states.",
    },
  ]);

  const currentModule = useMemo(() => getCurrentModule(location.pathname), [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, loadingScan]);

  const runSnapshot = async () => {
    const checks = await Promise.allSettled([
      mainApi.health(),
      aiApi.groqHealth(),
      securityApi.nucleiHealth(),
      aiApi.adminSystemScan(),
    ]);

    const healthChecks = [
      normalizeCheck("api", checks[0]),
      normalizeCheck("groq", checks[1]),
      normalizeCheck("security", checks[2]),
    ];

    const serverScan = checks[3].status === "fulfilled" ? checks[3].value : { error: "System scan unavailable" };

    const unavailableModules = healthChecks.some((check) => check.status !== "healthy") ? 1 : 0;

    return {
      currentModule,
      route: location.pathname,
      healthChecks,
      moduleStats: {
        totalModules: ADMIN_MODULES.length,
        unavailableModules,
      },
      serverScan,
      generatedAt: new Date().toISOString(),
    };
  };

  const askAssistant = async (question, forceRescan = false) => {
    const text = (question || input).trim();
    if (!text || loading || loadingScan) return;

    const nextUserMessage = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput("");

    setLoading(true);
    try {
      const snapshot = forceRescan || !lastSnapshot ? await runSnapshot() : lastSnapshot;
      setLastSnapshot(snapshot);

      const response = await aiApi.adminDiagnostics(text, currentModule, snapshot, {
        model: ADMIN_CHATBOT_MODEL,
        temperature: 0.3,
        maxTokens: 1200,
      });

      const findings = Array.isArray(response.findings)
        ? response.findings
            .map((f) => `[${String(f.severity || "low").toUpperCase()}] ${f.title}: ${f.detail}`)
            .join("\n")
        : "";

      const answer = findings
        ? `${response.response}\n\nQuick findings:\n${findings}`
        : response.response || "No diagnostic output returned.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: `Could not complete diagnostics: ${error.message || "Unknown error"}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runFullScan = async () => {
    if (loading || loadingScan) return;

    setLoadingScan(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        text: "Running full admin system scan across modules and services...",
      },
    ]);

    try {
      const snapshot = await runSnapshot();
      setLastSnapshot(snapshot);
      await askAssistant("Run a complete admin scan and list any bugs, mismatches, and risky modules.", true);
    } finally {
      setLoadingScan(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await askAssistant();
  };

  const canSend = input.trim().length > 0 && !loading && !loadingScan;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-80 h-14 w-14 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-600/30 transition-transform hover:scale-105"
        aria-label="Open admin AI diagnostics assistant"
      >
        <Bot className="mx-auto h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-80 flex h-[70vh] max-h-[620px] w-[92vw] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-950 text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-linear-to-r from-blue-700/90 to-indigo-800/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Admin Sentinel</p>
                <p className="text-xs text-blue-100">Module: {currentModule}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-slate-100/90 transition-colors hover:bg-white/10"
              aria-label="Close admin AI diagnostics assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-800 px-3 py-2">
            <button
              type="button"
              onClick={runFullScan}
              disabled={loading || loadingScan}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Activity className="h-3.5 w-3.5" />
              Full System Scan
            </button>
            <button
              type="button"
              onClick={() => askAssistant("Analyze this current module for likely bugs and mismatches.")}
              disabled={loading || loadingScan}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Analyze Module
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto rounded-br-md bg-blue-600 text-white"
                    : message.isError
                    ? "mr-auto rounded-bl-md border border-red-500/30 bg-red-500/15 text-red-100"
                    : "mr-auto rounded-bl-md border border-slate-700 bg-slate-900 text-slate-100"
                }`}
              >
                {message.text}
              </div>
            ))}

            {(loading || loadingScan) && (
              <div className="mr-auto inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                {loadingScan ? "Scanning..." : "Analyzing..."}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="grid grid-cols-[1fr_auto] gap-2 border-t border-slate-800 p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about bugs, mismatches, or module failures..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-xl bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
