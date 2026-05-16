import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../config/supabaseClient";

import {
  ClientCRMHeader,
  ClientCRMKPICards,
  ClientPipelineSnapshot,
  ClientTopOpportunities,
  ClientRecentActivities,
  ClientReportingSummary,
  ClientOpportunityPreviewDrawer,
  ClientCRMEmptyState,
  ClientCRMLoadingState,
  ClientCRMErrorState,
  buildClientCRMKPIs,
} from "../../../components/client/layout/Client_CRM_Components.jsx";

import { getClientCRMData } from "../../../services/clientCRM";

async function resolveWorkspaceId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData?.user?.id;
  if (!userId) throw new Error("User session not found.");

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace_id) throw new Error("No workspace assigned to this user.");

  return data.workspace_id;
}

export default function ClientCRM() {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);

  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCRMData();
  }, []);

  async function loadCRMData() {
    try {
      setLoading(true);
      setError("");

      const activeWorkspaceId = workspaceId || (await resolveWorkspaceId());
      setWorkspaceId(activeWorkspaceId);

      const data = await getClientCRMData(activeWorkspaceId);

      setStages(data.stages || []);
      setOpportunities(data.opportunities || []);
      setRecentActivities(data.recentActivities || []);
    } catch (err) {
      console.error("Client CRM load error:", err);
      setError(err.message || "Failed to load CRM data.");
    } finally {
      setLoading(false);
    }
  }

  const kpis = useMemo(
    () => buildClientCRMKPIs(opportunities),
    [opportunities]
  );

  const topOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => opp.status === "open")
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 5);
  }, [opportunities]);

  return (
    <div className="space-y-6">
      <ClientCRMHeader />

      {loading && <ClientCRMLoadingState />}

      {!loading && error && (
        <ClientCRMErrorState message={error} onRetry={loadCRMData} />
      )}

      {!loading && !error && opportunities.length === 0 && (
        <ClientCRMEmptyState />
      )}

      {!loading && !error && opportunities.length > 0 && (
        <>
          <ClientCRMKPICards kpis={kpis} />

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <ClientPipelineSnapshot
              stages={stages}
              opportunities={opportunities}
              onOpportunityClick={setSelectedOpp}
            />

            <ClientTopOpportunities
              opportunities={topOpportunities}
              onOpportunityClick={setSelectedOpp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <ClientRecentActivities activities={recentActivities} />

            <ClientReportingSummary opportunities={opportunities} />
          </div>
        </>
      )}

      {selectedOpp && (
        <ClientOpportunityPreviewDrawer
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}
