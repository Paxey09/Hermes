/**
 * AI Assistant Widget - Universal AI companion for all modules
 * Provides context-aware AI assistance across the admin panel
 */

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Brain,
  TrendingUp,
  Target,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { aiService } from "../../../services/ai";
import { cn } from "../../../lib/adminUtils";

const QUICK_ACTIONS = {
  crm: [
    { icon: Target, label: "Score Leads", action: "score_leads" },
    { icon: TrendingUp, label: "Predict Deals", action: "predict_deals" },
    { icon: MessageSquare, label: "Draft Email", action: "draft_email" },
  ],
  marketing: [
    { icon: Sparkles, label: "Create Campaign", action: "create_campaign" },
    { icon: Target, label: "Optimize Send Time", action: "optimize_time" },
    { icon: TrendingUp, label: "Predict Performance", action: "predict_performance" },
  ],
  inventory: [
    { icon: TrendingUp, label: "Forecast Demand", action: "forecast_demand" },
    { icon: Target, label: "Optimize Stock", action: "optimize_stock" },
    { icon: Zap, label: "Find Dead Stock", action: "find_dead_stock" },
  ],
  erp: [
    { icon: Zap, label: "Automation Ideas", action: "automation" },
    { icon: Brain, label: "Process Docs", action: "process_docs" },
    { icon: Target, label: "Workflow Optimize", action: "workflow_optimize" },
  ],
  analytics: [
    { icon: Brain, label: "Generate Insights", action: "insights" },
    { icon: TrendingUp, label: "Revenue Forecast", action: "forecast" },
    { icon: Target, label: "Anomaly Detection", action: "anomalies" },
  ],
  inbox: [
    { icon: MessageSquare, label: "Draft Response", action: "draft_response" },
    { icon: Target, label: "Classify Tickets", action: "classify" },
    { icon: Zap, label: "Smart Routing", action: "routing" },
  ],
  projects: [
    { icon: Target, label: "Estimate Timeline", action: "estimate" },
    { icon: Brain, label: "Risk Analysis", action: "risks" },
    { icon: Zap, label: "Task Breakdown", action: "tasks" },
  ],
  default: [
    { icon: Brain, label: "Ask AI", action: "ask" },
    { icon: Sparkles, label: "Generate Report", action: "report" },
    { icon: TrendingUp, label: "Get Insights", action: "insights" },
  ],
};

export function AIAssistant({ context = "default", contextData = {}, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: getWelcomeMessage(context) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const quickActions = QUICK_ACTIONS[context] || QUICK_ACTIONS.default;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getWelcomeMessage(ctx) {
    const messages = {
      crm: "AI Sales Assistant ready. I can score leads, predict deal outcomes, and draft personalized emails.",
      marketing: "AI Marketing Assistant ready. I can create campaigns, optimize send times, and predict performance.",
      inventory: "AI Inventory Assistant active. I can forecast demand, optimize stock levels, and identify dead stock.",
      erp: "AI ERP Assistant ready. I can suggest automations, generate documentation, and optimize workflows.",
      analytics: "AI Analytics Assistant online. I can generate insights, forecast revenue, and detect anomalies.",
      inbox: "AI Support Assistant ready. I can draft responses, classify tickets, and suggest routing.",
      projects: "AI Project Assistant ready. I can estimate timelines, analyze risks, and break down tasks.",
      default: "AI Assistant ready. How can I help you today?",
    };

    return messages[ctx] || messages.default;
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend(e) {
    e?.preventDefault();

    if (!input.trim() || loading) return;

    const userMsg = input.trim();

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(context, contextData);
      const response = await aiService.chatCompletion([
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: userMsg },
      ]);

      const aiText =
        response.choices[0]?.message?.content ||
        "I apologize, I could not process that request.";

      setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered an error. Please check that your AI API key is configured correctly.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction(action) {
    setLoading(true);

    let prompt = "";

    switch (action) {
      case "score_leads":
        prompt =
          "Score the current leads in my pipeline based on engagement, company size, and fit. Provide the top 5 hottest leads with reasoning.";
        break;
      case "predict_deals":
        prompt =
          "Predict which deals in my current pipeline are most likely to close this month. Include confidence scores and recommended actions.";
        break;
      case "draft_email":
        prompt =
          "Draft a personalized follow-up email for my highest-value opportunity that hasn't been contacted in 3 days.";
        break;
      case "create_campaign":
        prompt =
          "Create a marketing campaign concept for my next product launch. Include headline options, email copy, and social media posts.";
        break;
      case "optimize_time":
        prompt =
          "Analyze my email engagement data and recommend the best days and times to send my next campaign for maximum open rates.";
        break;
      case "predict_performance":
        prompt =
          "Predict the performance metrics for a campaign targeting my current audience segment.";
        break;
      case "forecast_demand":
        prompt =
          "Forecast inventory demand for the next 90 days based on current stock levels and historical sales patterns.";
        break;
      case "optimize_stock":
        prompt =
          "Analyze my current inventory and recommend optimal stock levels to minimize carrying costs while preventing stockouts.";
        break;
      case "find_dead_stock":
        prompt =
          "Identify products that are at risk of becoming dead stock and suggest clearance strategies.";
        break;
      case "automation":
        prompt =
          "Analyze my current business processes and identify the top 3 automation opportunities with highest ROI.";
        break;
      case "process_docs":
        prompt =
          "Generate standard operating procedure documentation for my most common repetitive tasks.";
        break;
      case "workflow_optimize":
        prompt =
          "Review my current workflows and suggest optimizations to reduce bottlenecks and improve efficiency.";
        break;
      case "insights":
        prompt =
          "Generate executive insights from my current business data. Highlight trends, anomalies, and actionable recommendations.";
        break;
      case "forecast":
        prompt =
          "Create a revenue forecast for the next quarter with confidence intervals and key assumptions.";
        break;
      case "anomalies":
        prompt =
          "Analyze my business metrics for anomalies or unusual patterns that need attention.";
        break;
      case "draft_response":
        prompt =
          "Draft a professional response to the most recent support ticket in my inbox.";
        break;
      case "classify":
        prompt =
          "Review my unassigned tickets and classify them by category and priority for efficient routing.";
        break;
      case "routing":
        prompt =
          "Suggest optimal team assignments for my current open tickets based on expertise and workload.";
        break;
      case "estimate":
        prompt =
          "Estimate the timeline and resources needed for my active projects based on scope and team capacity.";
        break;
      case "risks":
        prompt =
          "Analyze my active projects for potential risks and provide mitigation strategies.";
        break;
      case "tasks":
        prompt =
          "Break down my upcoming milestones into actionable tasks with estimated effort and dependencies.";
        break;
      default:
        prompt = "How can you help me with this module?";
    }

    setMessages((prev) => [...prev, { role: "user", text: `[Quick Action] ${prompt}` }]);

    try {
      const systemPrompt = buildSystemPrompt(context, contextData);
      const response = await aiService.chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]);

      const aiText =
        response.choices[0]?.message?.content || "I could not complete that action.";

      setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
    } catch (error) {
      console.error("Quick action error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Action failed. Please check your API configuration.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function buildSystemPrompt(ctx, data) {
    const basePrompt =
      "You are ExponifyPH AI, an intelligent business assistant integrated into the ExponifyPH Enterprise Operating System. You help users with operational, sales, marketing, analytics, and executive workflows.";

    const contextPrompts = {
      crm: `${basePrompt}\nYou are currently in the CRM module. Help with lead scoring, deal prediction, sales forecasting, email drafting, and sales strategy. Be data-driven and actionable.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      marketing: `${basePrompt}\nYou are in the Marketing module. Help create campaigns, optimize send times, predict performance, generate copy, and analyze results. Focus on engagement and conversion optimization.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      inventory: `${basePrompt}\nYou are in the Inventory module. Help forecast demand, optimize stock levels, identify dead stock, and suggest reorder points. Focus on balancing availability with carrying costs.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      erp: `${basePrompt}\nYou are in the ERP module. Help suggest process automations, generate documentation, optimize workflows, and analyze operational efficiency. Focus on productivity and standardization.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      analytics: `${basePrompt}\nYou are in the Analytics module. Help generate insights, create forecasts, detect anomalies, and build reports. Focus on data-driven recommendations and trend analysis.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      inbox: `${basePrompt}\nYou are in the Support/Inbox module. Help draft responses, classify tickets, suggest routing, and analyze support trends. Focus on customer satisfaction and efficiency.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      projects: `${basePrompt}\nYou are in the Projects module. Help estimate timelines, analyze risks, break down tasks, and suggest resource allocation. Focus on delivery and risk management.\n\nContext Data: ${JSON.stringify(data, null, 2)}`,
      default: basePrompt,
    };

    return contextPrompts[ctx] || contextPrompts.default;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full border shadow-2xl transition-all duration-200 hover:scale-105",
          "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--brand-gold-border)]",
          "before:absolute before:inset-0 before:rounded-full before:bg-[var(--ai-gradient)] before:opacity-80 before:-z-10",
          className
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-cyan-soft)] text-[var(--brand-cyan)] border border-[var(--brand-cyan-border)]">
          <Bot className="w-5 h-5" />
        </span>

        <span className="font-semibold">Exponify AI</span>

        <Sparkles className="w-4 h-4 text-[var(--brand-gold)] animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 overflow-hidden transition-all duration-300",
        "rounded-3xl border shadow-2xl",
        "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]",
        isMinimized
          ? "bottom-6 right-6 w-80 h-16"
          : "bottom-6 right-6 w-[min(24rem,calc(100vw-2rem))] h-[min(520px,calc(100vh-2rem))]",
        className
      )}
    >
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--ai-gradient)]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.16),transparent_34%)]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--brand-cyan-soft)] text-[var(--brand-cyan)] border border-[var(--brand-cyan-border)]">
            <Bot className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">Exponify AI</span>
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
            </div>
            <p className="text-[11px] capitalize text-[var(--text-muted)]">
              {context} intelligence layer
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto">
            <div className="flex gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  type="button"
                  onClick={() => handleQuickAction(action.action)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all disabled:opacity-50 bg-[var(--hover-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--brand-cyan)] hover:border-[var(--brand-cyan-border)] hover:bg-[var(--brand-cyan-soft)]"
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[330px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-2xl bg-[var(--brand-cyan-soft)] text-[var(--brand-cyan)] border border-[var(--brand-cyan-border)] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm border",
                    msg.role === "user"
                      ? "bg-[var(--brand-gold)] text-[#050816] border-[var(--brand-gold-border)] rounded-br-md"
                      : msg.isError
                        ? "bg-[var(--danger-soft)] text-[var(--danger)] border-red-500/20 rounded-bl-md"
                        : "bg-[var(--hover-bg)] text-[var(--text-primary)] border-[var(--border-color)] rounded-bl-md"
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-cyan)]" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Exponify AI..."
                disabled={loading}
                className="flex-1 px-3 py-2.5 text-sm rounded-2xl border bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold-soft)] focus:border-[var(--brand-gold-border)] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-2xl bg-[var(--brand-gold)] text-[#050816] border border-[var(--brand-gold-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--brand-gold-hover)] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default AIAssistant;
