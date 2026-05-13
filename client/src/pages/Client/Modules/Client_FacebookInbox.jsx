import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import facebookIntegrationService from "../../../services/facebookIntegration";

export default function Client_FacebookInbox() {
  const context = useOutletContext() || {};
  const workspaceId =
    typeof context?.workspace?.id === "string"
      ? context.workspace.id.trim()
      : "";

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPages() {
      if (!workspaceId) {
        if (mounted) {
          setPages([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await facebookIntegrationService.getClientPagesByWorkspaceId(workspaceId);
        if (!mounted) return;
        setPages(Array.isArray(data?.pages) ? data.pages : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load Facebook inbox pages.");
        setPages([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPages();

    return () => {
      mounted = false;
    };
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
          <h2 className="text-sm font-semibold text-gray-900">Connected Facebook Pages</h2>
          <p className="text-xs text-gray-500">Pages linked to your workspace in Admin Facebook Connect.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {loading && (
            <div className="px-4 py-6 text-sm text-gray-500">Loading pages...</div>
          )}

          {!loading && pages.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              No Facebook Pages are linked to your workspace yet.
            </div>
          )}

          {!loading &&
            pages.map((page) => (
              <div key={page.pageId || page.pageName} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {page.pageName || "Facebook Page"}
                  </p>
                  <p className="text-xs text-gray-500">Page ID: {page.pageId || "-"}</p>
                </div>
                <div className="text-xs text-gray-500">
                  Access: {String(page.accessMode || "enable").toLowerCase() === "disable" ? "Disabled" : "Enabled"}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
        Message history and replies will appear here once the Facebook Inbox is fully connected.
      </div>
    </div>
  );
}
