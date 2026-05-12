import { useEffect, useMemo, useState } from "react";
import { Sparkles, Target, TrendingUp, Mail, Brain } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";

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
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  async function generateAIInsights() {
    setAiLoading(true);
    try {
      const insights = await aiModules.generateBusinessInsights({
        opportunities,
        stages,
        recentActivities,
        module: 'crm'
      }, 'current_month');
      setAiInsights(insights);
    } catch (err) {
      console.error("AI insights error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function scoreAllLeads() {
    setAiLoading(true);
    try {
      const scored = await Promise.all(
        opportunities.slice(0, 5).map(async (opp) => {
          const score = await aiModules.scoreLead(opp);
          return { ...opp, aiScore: score };
        })
      );
      // Update opportunities with AI scores
      console.log('AI Lead Scores:', scored);
    } catch (err) {
      console.error("Lead scoring error:", err);
    } finally {
      setAiLoading(false);
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

      {/* AI Insights Panel */}
      <Card className="border-[#c9a84c]/30 bg-gradient-to-r from-[#c9a84c]/10 to-[#ea580c]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#c9a84c]" />
            AI Sales Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Sparkles}
              loading={aiLoading}
              onClick={generateAIInsights}
            >
              Generate Insights
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Target}
              loading={aiLoading}
              onClick={scoreAllLeads}
            >
              Score Leads
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={TrendingUp}
              onClick={() => {}}
            >
              Predict Deals
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Mail}
              onClick={() => {}}
            >
              Draft Emails
            </Button>
          </div>
          {aiInsights && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">{aiInsights.executiveSummary}</p>
              <div className="flex flex-wrap gap-2">
                {aiInsights.keyFindings?.slice(0, 3).map((finding, i) => (
                  <Badge key={i} variant="info" className="text-xs">{finding}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* AI Assistant Widget */}
      <AIAssistant 
        context="crm" 
        contextData={{ opportunities, stages, kpis }}
      />
    </div>
  );
}
