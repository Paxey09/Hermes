import { useEffect, useMemo, useState } from "react";
import { Brain, Zap, Sparkles, FileText, Target, Workflow } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";

import {
  ERPControlHeader,
  ERPControlKPICards,
  WorkspaceSelector,
  ModuleAccessGrid,
  ModuleAccessTable,
  ERPControlLoadingState,
  ERPControlErrorState,
} from "../../components/admin/layout/Admin_ERPControl_Components.jsx";

import {
  getERPControlData,
  updateWorkspaceModuleAccess,
} from "../../services/erpControl";

export default function AdminERPControl() {
  const [workspaces, setWorkspaces] = useState([]);
  const [modules, setModules] = useState([]);
  const [accessRows, setAccessRows] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState(null);

  useEffect(() => {
    loadERPControl();
  }, []);

  async function loadERPControl() {
    try {
      setLoading(true);
      setError("");

      const data = await getERPControlData();

      setWorkspaces(data.workspaces || []);
      setModules(data.modules || []);
      setAccessRows(data.accessRows || []);

      if (!selectedWorkspaceId) {
        setSelectedWorkspaceId(data.workspaces?.[0]?.id || "");
      }
    } catch (err) {
      console.error("ERP Control load error:", err);
      setError(err.message || "Failed to load ERP control.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeProcessAutomation() {
    setAiLoading(true);
    try {
      const analysis = await aiModules.analyzeProcessForAutomation({
        modules: modules.map(m => m.key),
        workspaceCount: workspaces.length,
        accessPatterns: accessRows
      });
      setAiInsights(analysis);
    } catch (err) {
      console.error("AI analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function generateDocumentation() {
    setAiLoading(true);
    try {
      const docs = await aiModules.generateProcessDocs(
        'ERP Module Access Control',
        [
          'Review workspace module access',
          'Enable/disable modules per workspace',
          'Monitor usage patterns',
          'Audit access changes'
        ],
        ['SuperAdmin', 'Admin', 'Workspace Manager']
      );
      setGeneratedDocs(docs);
    } catch (err) {
      console.error("AI docs error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  const selectedWorkspace = useMemo(() => {
    return workspaces.find((workspace) => workspace.id === selectedWorkspaceId);
  }, [workspaces, selectedWorkspaceId]);

  const workspaceAccess = useMemo(() => {
    return modules.map((module) => {
      const row = accessRows.find(
        (access) =>
          access.workspace_id === selectedWorkspaceId &&
          access.module_key === module.key
      );

      return {
        ...module,
        is_enabled: row?.is_enabled || false,
        enabled_at: row?.enabled_at || null,
        enabled_by: row?.enabled_by || null,
      };
    });
  }, [modules, accessRows, selectedWorkspaceId]);

  async function handleToggle(moduleKey, nextValue) {
    if (!selectedWorkspaceId) return;

    try {
      setSavingKey(moduleKey);

      await updateWorkspaceModuleAccess({
        workspaceId: selectedWorkspaceId,
        moduleKey,
        isEnabled: nextValue,
      });

      setAccessRows((prev) => {
        const exists = prev.some(
          (row) =>
            row.workspace_id === selectedWorkspaceId &&
            row.module_key === moduleKey
        );

        if (!exists) {
          return [
            ...prev,
            {
              id: `${selectedWorkspaceId}_${moduleKey}`,
              workspace_id: selectedWorkspaceId,
              module_key: moduleKey,
              is_enabled: nextValue,
              enabled_by: "Current Admin",
              enabled_at: nextValue ? new Date().toISOString() : null,
            },
          ];
        }

        return prev.map((row) =>
          row.workspace_id === selectedWorkspaceId && row.module_key === moduleKey
            ? {
                ...row,
                is_enabled: nextValue,
                enabled_by: "Current Admin",
                enabled_at: nextValue ? new Date().toISOString() : null,
              }
            : row
        );
      });
    } catch (err) {
      alert(err.message || "Failed to update module access.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className="space-y-6">
      <ERPControlHeader onRefresh={loadERPControl} />

      {/* AI ERP Intelligence */}
      <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            AI ERP Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-sm">Automation Finder</span>
              </div>
              <p className="text-xs text-gray-500">AI identifies automation opportunities</p>
            </div>
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="w-4 h-4 text-teal-500" />
                <span className="font-medium text-sm">Workflow Optimize</span>
              </div>
              <p className="text-xs text-gray-500">AI-suggested workflow improvements</p>
            </div>
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Auto Documentation</span>
              </div>
              <p className="text-xs text-gray-500">Generate SOPs and process docs</p>
            </div>
            <div className="p-4 bg-white dark:bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-sm">Usage Analytics</span>
              </div>
              <p className="text-xs text-gray-500">AI-powered usage insights</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Zap}
              loading={aiLoading}
              onClick={analyzeProcessAutomation}
            >
              Find Automations
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={FileText}
              loading={aiLoading}
              onClick={generateDocumentation}
            >
              Generate Docs
            </Button>
          </div>
          {aiInsights && (
            <div className="mt-4 p-4 bg-white dark:bg-white/5 rounded-lg">
              <p className="text-sm font-medium mb-2">AI Recommendations:</p>
              <ul className="text-sm space-y-1">
                {aiInsights.automationOpportunities?.slice(0, 3).map((opp, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {opp.task} - {opp.roiEstimate} ROI
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && <ERPControlLoadingState />}

      {!loading && error && (
        <ERPControlErrorState message={error} onRetry={loadERPControl} />
      )}

      {!loading && !error && (
        <>
          <ERPControlKPICards
            workspaces={workspaces}
            modules={modules}
            accessRows={accessRows}
            selectedWorkspaceId={selectedWorkspaceId}
          />

          <WorkspaceSelector
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            selectedWorkspace={selectedWorkspace}
            onWorkspaceChange={setSelectedWorkspaceId}
            view={view}
            onViewChange={setView}
          />

          {view === "grid" && (
            <ModuleAccessGrid
              modules={workspaceAccess}
              savingKey={savingKey}
              onToggle={handleToggle}
            />
          )}

          {view === "table" && (
            <ModuleAccessTable
              modules={workspaceAccess}
              savingKey={savingKey}
              onToggle={handleToggle}
            />
          )}
        </>
      )}

      {/* AI Assistant Widget */}
      <AIAssistant 
        context="erp" 
        contextData={{ workspaces, modules, accessRows }}
      />
    </div>
  );
}
