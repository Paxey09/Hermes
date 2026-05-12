import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { 
  AlertTriangle, Shield, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Brain, Sparkles, Download, FileText, Eye, Calendar, Users, Target,
  Activity, BarChart3, Scale, AlertCircle, Info
} from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminComplianceRisk() {
  const [riskData, setRiskData] = useState(null);
  const [complianceScore, setComplianceScore] = useState(null);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [regulatoryUpdates, setRegulatoryUpdates] = useState([]);
  const [auditResults, setAuditResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive compliance and risk data
      const [
        riskAssessmentsData,
        complianceData,
        auditData,
        regulatoryData
      ] = await Promise.all([
        supabase.from('risk_assessments').select('*').order('severity', { ascending: false }),
        supabase.from('compliance_checks').select('*').order('date', { ascending: false }).limit(20),
        supabase.from('audit_results').select('*').order('date', { ascending: false }).limit(10),
        supabase.from('regulatory_updates').select('*').order('date', { ascending: false }).limit(15)
      ]);

      // Calculate risk metrics
      const totalRisks = riskAssessmentsData.data?.length || 0;
      const criticalRisks = riskAssessmentsData.data?.filter(r => r.severity === 'critical').length || 0;
      const highRisks = riskAssessmentsData.data?.filter(r => r.severity === 'high').length || 0;
      const mediumRisks = riskAssessmentsData.data?.filter(r => r.severity === 'medium').length || 0;
      const lowRisks = riskAssessmentsData.data?.filter(r => r.severity === 'low').length || 0;

      // Calculate compliance score
      const complianceChecks = complianceData.data || [];
      const passedChecks = complianceChecks.filter(c => c.status === 'passed').length;
      const totalChecks = complianceChecks.length;
      const score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 85;

      setRiskData({
        totalRisks,
        criticalRisks,
        highRisks,
        mediumRisks,
        lowRisks,
        riskTrend: calculateRiskTrend(riskAssessmentsData.data || []),
        openRiskItems: riskAssessmentsData.data?.filter(r => r.status === 'open').length || 0,
        mitigatedRisks: riskAssessmentsData.data?.filter(r => r.status === 'mitigated').length || 0
      });

      setComplianceScore({
        overall: score,
        dataPrivacy: calculateDomainScore(complianceChecks, 'data_privacy'),
        financial: calculateDomainScore(complianceChecks, 'financial'),
        operational: calculateDomainScore(complianceChecks, 'operational'),
        security: calculateDomainScore(complianceChecks, 'security'),
        trend: calculateComplianceTrend(complianceChecks)
      });

      setRiskAssessments(riskAssessmentsData.data || []);
      setRegulatoryUpdates(regulatoryData.data || []);
      setAuditResults(auditData.data || []);

      // Generate AI insights
      const insights = await aiModules.analyzeComplianceRisks({
        complianceData: complianceChecks,
        regulations: regulatoryData.data || [],
        riskAssessments: riskAssessmentsData.data || []
      });
      setAiInsights(insights);

    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskTrend = (riskData) => {
    // Simple trend calculation - in real implementation would compare with previous periods
    const recentRisks = riskData.slice(0, 10);
    const criticalCount = recentRisks.filter(r => r.severity === 'critical').length;
    return criticalCount > 2 ? 'increasing' : criticalCount > 0 ? 'stable' : 'decreasing';
  };

  const calculateDomainScore = (complianceChecks, domain) => {
    const domainChecks = complianceChecks.filter(c => c.domain === domain);
    if (domainChecks.length === 0) return 85;
    const passed = domainChecks.filter(c => c.status === 'passed').length;
    return (passed / domainChecks.length) * 100;
  };

  const calculateComplianceTrend = (complianceChecks) => {
    const recentChecks = complianceChecks.slice(0, 10);
    const passedCount = recentChecks.filter(c => c.status === 'passed').length;
    return passedCount >= 8 ? 'improving' : passedCount >= 6 ? 'stable' : 'declining';
  };

  const getRiskColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-[var(--accent-gold)] bg-yellow-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance & Risk Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Risk Management</h1>
          <p className="text-gray-600">Regulatory compliance monitoring and risk assessment</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Compliance Report
          </Button>
          <Button icon={Shield}>
            Run Compliance Audit
          </Button>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Risks</p>
                <p className="text-2xl font-bold text-gray-900">{riskData?.totalRisks || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(riskData?.riskTrend)}
                  <span className="text-sm text-gray-500 capitalize">{riskData?.riskTrend}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Risks</p>
                <p className="text-2xl font-bold text-red-600">{riskData?.criticalRisks || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Immediate action</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risks</p>
                <p className="text-2xl font-bold text-yellow-600">{riskData?.highRisks || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Monitor closely</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Items</p>
                <p className="text-2xl font-bold text-gray-900">{riskData?.openRiskItems || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Pending action</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">{complianceScore?.overall?.toFixed(0) || 0}%</p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(complianceScore?.trend)}
                  <span className="text-sm text-gray-500 capitalize">{complianceScore?.trend}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance by Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Compliance by Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Data Privacy</span>
                <span className="text-sm font-semibold">{complianceScore?.dataPrivacy?.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${complianceScore?.dataPrivacy || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Financial</span>
                <span className="text-sm font-semibold">{complianceScore?.financial?.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${complianceScore?.financial || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Operational</span>
                <span className="text-sm font-semibold">{complianceScore?.operational?.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${complianceScore?.operational || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Security</span>
                <span className="text-sm font-semibold">{complianceScore?.security?.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${complianceScore?.security || 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Risk Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskAssessments.slice(0, 5).map((risk) => (
              <div key={risk.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                  <Badge className={getRiskColor(risk.severity)}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{risk.category || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-medium">{risk.owner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{risk.status || 'open'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <span className="ml-2 font-medium">{risk.deadline || 'Not set'}</span>
                  </div>
                </div>
                {risk.mitigation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Regulatory Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regulatoryUpdates.slice(0, 4).map((update) => (
                <div key={update.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{update.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{update.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(update.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Audit Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditResults.slice(0, 4).map((audit) => (
                <div key={audit.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    audit.status === 'passed' ? 'bg-green-100' : audit.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {audit.status === 'passed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : audit.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{audit.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{audit.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={audit.status === 'passed' ? 'success' : audit.status === 'failed' ? 'error' : 'warning'} className="text-xs">
                        {audit.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(audit.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Compliance Intelligence */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Compliance Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Risk Assessment Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Risk Level</span>
                  <Badge variant={aiInsights?.riskSummary?.overallRiskLevel === 'high' ? 'error' : 
                                 aiInsights?.riskSummary?.overallRiskLevel === 'medium' ? 'warning' : 'success'}>
                    {aiInsights?.riskSummary?.overallRiskLevel || 'Medium'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compliance Score</span>
                  <span className="font-semibold">{aiInsights?.riskSummary?.complianceScore || 85}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Critical Items</span>
                  <span className="font-semibold text-red-600">{aiInsights?.riskSummary?.criticalRisks || 0}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                AI Recommendations
              </h4>
              <div className="space-y-2">
                {aiInsights?.recommendations?.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">AI recommendations loading...</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Compliance Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights?.upcomingDeadlines?.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{deadline.requirement}</h4>
                  <p className="text-sm text-gray-600">Due: {deadline.deadline}</p>
                </div>
                <Badge variant={deadline.status === 'on-track' ? 'success' : 
                               deadline.status === 'at-risk' ? 'warning' : 'error'}>
                  {deadline.status}
                </Badge>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No upcoming deadlines</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant 
        context="compliance-risk"
        data={{ riskData, complianceScore, riskAssessments, regulatoryUpdates }}
      />
    </div>
  );
}
