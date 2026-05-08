import { useState } from "react";
import {
  AlertCircle,
  Archive,
  Inbox,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Star,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ name, size = "h-9 w-9" }) {
  const initials = String(name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white`}>
      {initials}
    </div>
  );
}

export function InboxHeader({ onRefresh }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">
          Modules <span className="mx-1">›</span>{" "}
          <span className="text-blue-600">Inbox</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Inbox</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage conversations and messages linked to business records.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <MessageSquare className="h-4 w-4" />
          Compose
        </button>
      </div>
    </div>
  );
}

export function InboxLoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-3 text-sm font-medium text-gray-600">Loading inbox...</p>
    </div>
  );
}

export function InboxErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Failed to load inbox</h3>
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

export function InboxKPICards({ unreadCount, archivedCount, newMessages, totalConversations }) {
  const cards = [
    { label: "New Messages", value: newMessages, icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Unread", value: unreadCount, icon: Inbox, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Archived", value: archivedCount, icon: Archive, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Conversations", value: totalConversations, icon: MessageSquare, color: "text-purple-600 bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <h3 className="mt-4 text-3xl font-bold text-gray-900">{card.value}</h3>
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

export function InboxTabs({ activeTab, onTabChange, unreadCount }) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "internal", label: "Internal" },
    { key: "starred", label: "Starred" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="flex flex-wrap gap-5">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={
            activeTab === tab.key
              ? "border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-600"
              : "pb-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InboxSearchBar({ search, onSearchChange }) {
  return (
    <div className="relative w-full lg:w-72">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <input
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500"
        placeholder="Search messages..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

export function ConversationItem({ conversation, selected, onClick }) {
  const isSelected = selected?.id === conversation.id;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isSelected
          ? "flex w-full gap-3 border-b border-gray-100 border-l-4 border-l-blue-600 bg-blue-50 p-4 text-left"
          : conversation.unread
          ? "flex w-full gap-3 border-b border-gray-100 border-l-4 border-l-transparent bg-blue-50/30 p-4 text-left hover:bg-gray-50"
          : "flex w-full gap-3 border-b border-gray-100 border-l-4 border-l-transparent bg-white p-4 text-left hover:bg-gray-50"
      }
    >
      <div className="relative">
        <Avatar name={conversation.from} />
        {conversation.unread && (
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={conversation.unread ? "truncate font-bold text-gray-900" : "truncate font-semibold text-gray-800"}>
            {conversation.from}
          </p>
          <span className="shrink-0 text-xs text-gray-400">{conversation.time}</span>
        </div>

        <p className={conversation.unread ? "mt-1 truncate text-sm font-semibold text-gray-900" : "mt-1 truncate text-sm text-gray-700"}>
          {conversation.subject}
        </p>

        <p className="mt-1 truncate text-xs text-gray-500">{conversation.preview}</p>

        {conversation.linkedTo && (
          <p className="mt-2 truncate text-xs font-semibold text-blue-600">
            Linked {conversation.linkedTo.type}: {conversation.linkedTo.name}
          </p>
        )}
      </div>

      {conversation.starred && <Star className="h-4 w-4 shrink-0 text-amber-400" />}
    </button>
  );
}

export function ConversationThread({ conversation, onReply, onBack }) {
  const [replyText, setReplyText] = useState("");

  if (!conversation) return null;

  return (
    <div className="flex min-h-[540px] flex-col">
      <div className="border-b border-gray-200 bg-white p-5">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-3 text-sm font-semibold text-blue-600">
            ← Back
          </button>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{conversation.subject}</h3>
            <p className="mt-1 text-sm text-gray-500">
              From <span className="font-semibold text-gray-800">{conversation.from}</span>{" "}
              &lt;{conversation.fromEmail}&gt;
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {conversation.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {conversation.linkedTo && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <span className="font-semibold text-blue-600">
              {conversation.linkedTo.type}:
            </span>{" "}
            {conversation.linkedTo.name}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
        {conversation.messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <Avatar name={message.from} />

            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{message.from}</span>
                  {message.internal && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                      INTERNAL
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(message.date)} {message.time}
                </span>
              </div>

              <div className={message.internal ? "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-gray-700" : "rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700"}>
                {message.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <textarea
          className="min-h-24 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-500"
          placeholder={`Reply to ${conversation.from}...`}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onReply?.(conversation.id, replyText);
              setReplyText("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}
