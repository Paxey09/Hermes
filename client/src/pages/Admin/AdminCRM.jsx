import { useEffect, useMemo, useState } from "react";

import {
  CRMHeader,
  CRMKPICards,
  PipelineSnapshot,
  TopOpportunities,
  RecentActivities,
  ReportingSummary,
  OpportunityPreviewDrawer,
  CRMEmptyState,
  CRMLoadingState,
  CRMErrorState,
  buildCRMKPIs,
} from "../../components/admin/layout/Admin_CRM_Components.jsx";

import { getCRMData } from "../../services/crm";

export default function AdminCRM() {
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

      const data = await getCRMData();

      setStages(data.stages || []);
      setOpportunities(data.opportunities || []);
      setRecentActivities(data.recentActivities || []);
    } catch (err) {
      console.error("CRM load error:", err);
      setError(err.message || "Failed to load CRM data.");
    } finally {
      setLoading(false);
    }
  }

  const kpis = useMemo(() => buildCRMKPIs(opportunities), [opportunities]);

  const topOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => opp.status === "open")
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 5);
  }, [opportunities]);

  return (
    <div className="space-y-6">
      <CRMHeader />

      {loading && <CRMLoadingState />}

      {!loading && error && (
        <CRMErrorState message={error} onRetry={loadCRMData} />
      )}

      {!loading && !error && opportunities.length === 0 && <CRMEmptyState />}

      {!loading && !error && opportunities.length > 0 && (
        <>
          <CRMKPICards kpis={kpis} />

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <PipelineSnapshot
              stages={stages}
              opportunities={opportunities}
              onOpportunityClick={setSelectedOpp}
            />

            <TopOpportunities
              opportunities={topOpportunities}
              onOpportunityClick={setSelectedOpp}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <RecentActivities activities={recentActivities} />

            <ReportingSummary opportunities={opportunities} />
          </div>
        </>
      )}

      {selectedOpp && (
        <OpportunityPreviewDrawer
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}
