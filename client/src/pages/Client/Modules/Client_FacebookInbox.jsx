import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import facebookIntegrationService from "../../../services/marketing/facebook_connect";

export default function Client_FacebookInbox() {
  const context = useOutletContext() || {};
  const workspaceId =
    typeof context?.workspace?.id === "string"
      ? context.workspace.id.trim()
      : "";
  const [pages, setPages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [activeThreadId, setActiveThreadId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeThread = useMemo(
    () => threads.find((thread) => thread.threadId === activeThreadId) || null,
    [threads, activeThreadId]
  );

  const formatDateTime = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString();
  };

  const loadInbox = async (pageId = "") => {
    if (!workspaceId) {
      setPages([]);
      setThreads([]);
      setSelectedPageId("");
      setActiveThreadId("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await facebookIntegrationService.getClientInboxByWorkspaceId(workspaceId, pageId);
      const nextPages = Array.isArray(data?.pages) ? data.pages : [];
      const nextThreads = Array.isArray(data?.threads) ? data.threads : [];
      const nextPageId = typeof data?.pageId === "string" ? data.pageId : "";

      setPages(nextPages);
      setThreads(nextThreads);
      setSelectedPageId(nextPageId);
      setActiveThreadId((current) => {
        if (current && nextThreads.some((thread) => thread.threadId === current)) {
          return current;
        }
        return nextThreads[0]?.threadId || "";
      });
    } catch (err) {
      setError(err?.message || "Failed to load Facebook inbox messages.");
      setPages([]);
      setThreads([]);
      setSelectedPageId("");
      setActiveThreadId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox("");
  }, [workspaceId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Facebook Inbox</h1>
        <p className="text-sm text-gray-500">
          Showing conversations for your workspace.
        </p>
      </div>

      {!workspaceId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Your workspace ID is not available yet. Contact your admin if this persists.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Connected Facebook Pages</h2>
              <p className="text-xs text-gray-500">Pages linked to your workspace in Admin Facebook Connect.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                value={selectedPageId}
                onChange={(event) => {
                  const nextPageId = event.target.value;
                  setSelectedPageId(nextPageId);
                  loadInbox(nextPageId);
                }}
                disabled={loading || pages.length === 0}
              >
                {pages.length === 0 && <option value="">No pages</option>}
                {pages.map((page) => (
                  <option key={page.pageId || page.pageName} value={page.pageId || ""}>
                    {page.pageName || "Facebook Page"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => loadInbox(selectedPageId)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="px-4 py-6 text-sm text-gray-500">Loading conversations...</div>}

        {!loading && pages.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">No Facebook Pages are linked to your workspace yet.</div>
        )}

        {!loading && pages.length > 0 && (
          <div className="grid gap-0 md:grid-cols-[300px_1fr]">
            <div className="border-r border-gray-200">
              <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Conversations
              </div>

              {threads.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No messages found for this page yet.</div>
              )}

              <div className="max-h-[520px] overflow-y-auto">
                {threads.map((thread) => (
                  <button
                    key={thread.threadId}
                    type="button"
                    className={`w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                      activeThreadId === thread.threadId ? "bg-blue-50" : "bg-white"
                    }`}
                    onClick={() => setActiveThreadId(thread.threadId)}
                  >
                    <p className="truncate text-sm font-semibold text-gray-900">{thread.participantName || "Facebook User"}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{thread.snippet || "No preview"}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{formatDateTime(thread.updatedTime)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {activeThread?.participantName || "Select a conversation"}
                </h3>
                {activeThread?.updatedTime && (
                  <p className="text-xs text-gray-500">Updated: {formatDateTime(activeThread.updatedTime)}</p>
                )}
              </div>

              {!activeThread && (
                <div className="px-4 py-10 text-sm text-gray-500">
                  Select a conversation from the left panel to view message history.
                </div>
              )}

              {activeThread && (
                <div className="max-h-[520px] space-y-3 overflow-y-auto bg-gray-50/60 p-4">
                  {(Array.isArray(activeThread.messages) ? activeThread.messages : []).map((message) => (
                    <div
                      key={message.id || `${message.fromId}-${message.createdTime}`}
                      className={`flex ${message.isPageMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          message.isPageMessage
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <p>{message.text}</p>
                        <p
                          className={`mt-1 text-[11px] ${
                            message.isPageMessage ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {message.fromName} - {formatDateTime(message.createdTime)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!Array.isArray(activeThread.messages) || activeThread.messages.length === 0) && (
                    <div className="text-sm text-gray-500">No readable messages in this conversation yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
