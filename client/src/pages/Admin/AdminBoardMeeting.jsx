import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { 
  Presentation, TrendingUp, TrendingDown, DollarSign, Users, Target, 
  Brain, Sparkles, Download, Calendar, AlertTriangle, CheckCircle, 
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, PieChart
} from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminBoardMeeting() {
  const [kpis, setKpis] = useState(null);
  const [boardMetrics, setBoardMetrics] = useState(null);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [strategicInitiatives, setStrategicInitiatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);

  useEffect(() => {
    fetchBoardData();
  }, []);

  const fetchBoardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive board metrics
      const [
        revenueData,
        dealsData,
        teamData,
        projectData,
        riskData
      ] = await Promise.all([
        supabase.from('revenue').select('*').order('date', { ascending: false }).limit(12),
        supabase.from('deals').select('*').eq('status', 'active'),
        supabase.from('team_members').select('*'),
        supabase.from('projects').select('*').eq('status', 'active'),
        supabase.from('risk_assessments').select('*').order('severity', { ascending: false })
      ]);

      // Calculate board-level KPIs
      const totalRevenue = revenueData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const activeDeals = dealsData.data?.length || 0;
      const totalTeamSize = teamData.data?.length || 0;
      const activeProjects = projectData.data?.length || 0;
      const highRiskItems = riskData.data?.filter(item => item.severity === 'high').length || 0;

      setKpis({
        totalRevenue,
        revenueGrowth: calculateRevenueGrowth(revenueData.data || []),
        activeDeals,
        dealValue: dealsData.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
        teamSize: totalTeamSize,
        teamGrowth: calculateTeamGrowth(teamData.data || []),
        activeProjects,
        projectCompletionRate: calculateProjectCompletion(projectData.data || []),
        highRiskItems,
        riskScore: calculateRiskScore(riskData.data || [])
      });

      setBoardMetrics({
        marketPerformance: generateMarketPerformance(),
        operationalEfficiency: generateOperationalEfficiency(),
        financialHealth: generateFinancialHealth(),
        innovationIndex: generateInnovationIndex()
      });

      setRiskAssessments(riskData.data || []);
      setStrategicInitiatives(generateStrategicInitiatives());

      // Generate AI insights
      const insights = await aiModules.generateBoardInsights({
        kpis: { totalRevenue, activeDeals, teamSize: totalTeamSize, activeProjects },
        risks: riskData.data || [],
        trends: revenueData.data || []
      });
      setAiInsights(insights);

      // Generate AI predictions
      const predictions = await aiModules.predictBoardOutcomes({
        currentMetrics: { totalRevenue, activeDeals, teamSize: totalTeamSize },
        marketData: generateMarketData(),
        historicalData: revenueData.data || []
      });
      setAiPredictions(predictions);

    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRevenueGrowth = (revenueData) => {
    if (revenueData.length < 2) return 0;
    const recent = revenueData.slice(0, 6).reduce((sum, item) => sum + (item.amount || 0), 0);
    const previous = revenueData.slice(6, 12).reduce((sum, item) => sum + (item.amount || 0), 0);
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const calculateTeamGrowth = (teamData) => {
    // Placeholder for team growth calculation
    return 12.5;
  };

  const calculateProjectCompletion = (projectData) => {
    if (!projectData.length) return 0;
    const completed = projectData.filter(p => p.status === 'completed').length;
    return (completed / projectData.length) * 100;
  };

  const calculateRiskScore = (riskData) => {
    if (!riskData.length) return 0;
    const weightedScore = riskData.reduce((sum, risk) => {
      const weight = risk.severity === 'high' ? 3 : risk.severity === 'medium' ? 2 : 1;
      return sum + weight;
    }, 0);
    return Math.min((weightedScore / (riskData.length * 3)) * 100, 100);
  };

  const generateMarketPerformance = () => ({
    marketShare: 18.5,
    competitorAnalysis: 'Leading position in enterprise segment',
    customerSatisfaction: 92,
    brandValue: 45000000
  });

  const generateOperationalEfficiency = () => ({
    productivityIndex: 87,
    costOptimization: 15.3,
    processAutomation: 68,
    resourceUtilization: 79
  });

  const generateFinancialHealth = () => ({
    profitability: 23.8,
    cashFlow: 'Positive',
    debtToEquity: 0.45,
    liquidityRatio: 2.1
  });

  const generateInnovationIndex = () => ({
    rdInvestment: 12.5,
    patentPortfolio: 24,
    productInnovation: 8,
    processInnovation: 6
  });

  const generateStrategicInitiatives = () => [
    {
      id: 1,
      title: "Digital Transformation Complete",
      status: "on-track",
      progress: 78,
      owner: "CTO Office",
      impact: "High",
      deadline: "2024-06-30"
    },
    {
      id: 2,
      title: "Market Expansion - APAC",
      status: "at-risk",
      progress: 45,
      owner: "Business Development",
      impact: "Critical",
      deadline: "2024-09-30"
    },
    {
      id: 3,
      title: "AI Integration Suite",
      status: "ahead",
      progress: 85,
      owner: "Innovation Lab",
      impact: "Transformative",
      deadline: "2024-05-15"
    }
  ];

  const generateMarketData = () => ({
    marketGrowth: 5.2,
    marketSize: 12500000000,
    competitivePosition: 2,
    marketTrends: ['Digital Transformation', 'AI Adoption', 'Sustainability Focus']
  });

  const generateAIInsights = async () => {
    return await aiModules.generateBoardInsights({
      kpis,
      risks: riskAssessments,
      trends: []
    });
  };

  const generateAIPredictions = async () => {
    return await aiModules.predictBoardOutcomes({
      currentMetrics: kpis,
      marketData: generateMarketData(),
      historicalData: []
    });
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
      {/* Board Meeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board Meeting Dashboard</h1>
          <p className="text-gray-600">Executive KPIs and strategic overview for board presentations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Report
          </Button>
          <Button icon={Presentation}>
            Start Presentation
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(kpis?.totalRevenue || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {kpis?.revenueGrowth > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${kpis?.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis?.revenueGrowth?.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.activeDeals || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Value: ${(kpis?.dealValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.teamSize || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{kpis?.teamGrowth || 0}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.riskScore || 0}%</p>
                <p className="text-sm text-gray-500 mt-2">
                  {kpis?.highRiskItems || 0} high risks
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Board Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Market Share</span>
                <span className="font-semibold">{boardMetrics?.marketPerformance?.marketShare}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold">{boardMetrics?.marketPerformance?.customerSatisfaction}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Brand Value</span>
                <span className="font-semibold">${(boardMetrics?.marketPerformance?.brandValue / 1000000).toFixed(0)}M</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Operational Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Productivity Index</span>
                <span className="font-semibold">{boardMetrics?.operationalEfficiency?.productivityIndex}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cost Optimization</span>
                <span className="font-semibold">{boardMetrics?.operationalEfficiency?.costOptimization}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Automation Level</span>
                <span className="font-semibold">{boardMetrics?.operationalEfficiency?.processAutomation}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategic Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategicInitiatives.map((initiative) => (
              <div key={initiative.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{initiative.title}</h4>
                  <Badge variant={initiative.status === 'on-track' ? 'success' : initiative.status === 'at-risk' ? 'warning' : 'info'}>
                    {initiative.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Progress:</span>
                    <span className="ml-2 font-medium">{initiative.progress}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-medium">{initiative.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Impact:</span>
                    <span className="ml-2 font-medium">{initiative.impact}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <span className="ml-2 font-medium">{initiative.deadline}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${initiative.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Intelligence Panel */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Board Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {aiInsights?.insights?.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">AI insights loading...</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Predictions & Recommendations
              </h4>
              <div className="space-y-2">
                {aiPredictions?.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">AI predictions loading...</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant 
        context="board-meeting"
        data={{ kpis, boardMetrics, strategicInitiatives, riskAssessments }}
      />
    </div>
  );
}
