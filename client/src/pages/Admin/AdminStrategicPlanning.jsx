import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { 
  Target, TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle,
  Brain, Sparkles, Download, Calendar, Users, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, Zap, Award, Globe, Eye, Flag,
  Lightbulb, Rocket, Star, MapPin
} from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminStrategicPlanning() {
  const [strategicData, setStrategicData] = useState(null);
  const [okrs, setOKRs] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('current');

  useEffect(() => {
    fetchStrategicData();
  }, []);

  const fetchStrategicData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive strategic planning data
      const [
        okrData,
        initiativeData,
        marketData,
        competitorData
      ] = await Promise.all([
        supabase.from('okrs').select('*').order('created_at', { ascending: false }),
        supabase.from('strategic_initiatives').select('*').order('priority', { ascending: false }),
        supabase.from('market_analysis').select('*').order('date', { ascending: false }).limit(10),
        supabase.from('competitor_analysis').select('*').order('date', { ascending: false }).limit(15)
      ]);

      // Calculate strategic metrics
      const totalOKRs = okrData.data?.length || 0;
      const completedOKRs = okrData.data?.filter(okr => okr.status === 'completed').length || 0;
      const onTrackOKRs = okrData.data?.filter(okr => okr.status === 'on-track').length || 0;
      const atRiskOKRs = okrData.data?.filter(okr => okr.status === 'at-risk').length || 0;

      const totalInitiatives = initiativeData.data?.length || 0;
      const activeInitiatives = initiativeData.data?.filter(init => init.status === 'active').length || 0;
      const completedInitiatives = initiativeData.data?.filter(init => init.status === 'completed').length || 0;

      setStrategicData({
        totalOKRs,
        completedOKRs,
        onTrackOKRs,
        atRiskOKRs,
        okrCompletionRate: totalOKRs > 0 ? (completedOKRs / totalOKRs) * 100 : 0,
        totalInitiatives,
        activeInitiatives,
        completedInitiatives,
        initiativeCompletionRate: totalInitiatives > 0 ? (completedInitiatives / totalInitiatives) * 100 : 0
      });

      setOKRs(okrData.data || []);
      setInitiatives(initiativeData.data || []);
      setMarketAnalysis(generateMarketAnalysis(marketData.data || [], competitorData.data || []));

      // Generate AI insights
      const insights = await aiModules.generateStrategicInsights({
        currentStrategy: generateCurrentStrategy(),
        marketAnalysis: marketAnalysis,
        competitors: competitorData.data || [],
        capabilities: generateCapabilities()
      });
      setAiInsights(insights);

    } catch (error) {
      console.error('Error fetching strategic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarketAnalysis = (marketData, competitorData) => ({
    marketSize: 12500000000,
    marketGrowth: 12.5,
    marketShare: 18.5,
    competitivePosition: 2,
    marketTrends: ['Digital Transformation', 'AI Adoption', 'Sustainability Focus', 'Remote Work'],
    opportunities: [
      { area: 'Enterprise AI', potential: 2500000000, timeline: '2-3 years' },
      { area: 'Sustainability Tech', potential: 1800000000, timeline: '3-5 years' },
      { area: 'Healthcare Innovation', potential: 1200000000, timeline: '4-6 years' }
    ],
    threats: [
      { threat: 'New Market Entrants', impact: 'High', probability: 'Medium' },
      { threat: 'Regulatory Changes', impact: 'Medium', probability: 'High' },
      { threat: 'Technology Disruption', impact: 'High', probability: 'Low' }
    ]
  });

  const generateCurrentStrategy = () => ({
    vision: 'Become the leading AI-powered enterprise platform',
    mission: 'Transform businesses through intelligent automation',
    strategicThemes: ['AI Innovation', 'Customer Success', 'Operational Excellence', 'Market Expansion'],
    timeHorizon: '5 years',
    investmentFocus: ['R&D', 'Talent Acquisition', 'Market Development', 'Technology Infrastructure']
  });

  const generateCapabilities = () => ({
    strengths: ['AI Technology', 'Customer Relationships', 'Agile Development', 'Market Knowledge'],
    weaknesses: ['Brand Recognition', 'Scale', 'Global Presence', 'Capital Resources'],
    opportunities: ['Market Growth', 'Technology Trends', 'Partnerships', 'Acquisitions'],
    threats: ['Competition', 'Regulation', 'Economic Conditions', 'Talent Shortage']
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'on-track': return 'text-blue-600 bg-blue-100';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100';
      case 'off-track': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-[var(--accent-gold)] bg-yellow-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 60) return 'bg-blue-600';
    if (progress >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
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
      {/* Strategic Planning Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strategic Planning</h1>
          <p className="text-gray-600">OKR tracking, strategic initiatives, and market analysis</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export Strategy Report
          </Button>
          <Button icon={Target}>
            Create New OKR
          </Button>
        </div>
      </div>

      {/* Strategic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total OKRs</p>
                <p className="text-2xl font-bold text-gray-900">{strategicData?.totalOKRs || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {strategicData?.okrCompletionRate?.toFixed(0)}% completed
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">{strategicData?.onTrackOKRs || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {strategicData?.atRiskOKRs || 0} at risk
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Strategic Initiatives</p>
                <p className="text-2xl font-bold text-gray-900">{strategicData?.totalInitiatives || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {strategicData?.activeInitiatives || 0} active
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Market Share</p>
                <p className="text-2xl font-bold text-gray-900">{marketAnalysis?.marketShare}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{marketAnalysis?.marketGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OKRs Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objectives & Key Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {okrs.slice(0, 6).map((okr) => (
              <div key={okr.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{okr.objective}</h4>
                    <p className="text-sm text-gray-600 mt-1">{okr.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(okr.status)}>
                      {okr.status}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {okr.progress || 0}%
                    </span>
                  </div>
                </div>
                
                {/* Key Results */}
                <div className="space-y-2">
                  {(okr.key_results || []).map((kr, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{kr.title}</p>
                        <p className="text-xs text-gray-500">
                          Target: {kr.target} | Current: {kr.current}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(kr.progress || 0)}`}
                            style={{ width: `${kr.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-10 text-right">
                          {kr.progress || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>Owner: {okr.owner || 'Unassigned'}</span>
                  <span>Quarter: {okr.quarter || 'Q1'}</span>
                  <span>Due: {okr.due_date || 'Not set'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Strategic Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initiatives.slice(0, 4).map((initiative) => (
              <div key={initiative.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{initiative.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(initiative.priority)}>
                      {initiative.priority}
                    </Badge>
                    <Badge className={getStatusColor(initiative.status)}>
                      {initiative.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Progress:</span>
                    <span className="ml-2 font-medium">{initiative.progress || 0}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Owner:</span>
                    <span className="ml-2 font-medium">{initiative.owner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timeline:</span>
                    <span className="ml-2 font-medium">{initiative.timeline || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <span className="ml-2 font-medium">${(initiative.budget || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(initiative.progress || 0)}`}
                    style={{ width: `${initiative.progress || 0}%` }}
                  />
                </div>

                {initiative.expected_outcome && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Expected Outcome:</strong> {initiative.expected_outcome}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketAnalysis?.opportunities?.map((opp, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{opp.area}</h4>
                    <p className="text-sm text-gray-600">
                      Potential: ${(opp.potential / 1000000000).toFixed(1)}B
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" className="text-xs">
                      {opp.timeline}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Market Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketAnalysis?.threats?.map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{threat.threat}</h4>
                    <p className="text-sm text-gray-600">Impact: {threat.impact}</p>
                  </div>
                  <Badge variant={threat.probability === 'High' ? 'error' : threat.probability === 'Medium' ? 'warning' : 'info'} className="text-xs">
                    {threat.probability}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Strategic Intelligence */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Strategic Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Strategic Assessment
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Current Position</p>
                  <p className="text-xs text-gray-600 mt-1">{aiInsights?.strategicAssessment?.currentPosition || 'Strong market position with growth opportunities'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Market Opportunity</p>
                  <p className="text-xs text-gray-600 mt-1">{aiInsights?.strategicAssessment?.marketOpportunity || 'Significant growth in enterprise AI market'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Strategic Initiatives
              </h4>
              <div className="space-y-2">
                {aiInsights?.strategicInitiatives?.slice(0, 3).map((initiative, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{initiative.initiative}</p>
                      <Badge variant={initiative.priority === 'high' ? 'error' : initiative.priority === 'medium' ? 'warning' : 'info'} className="text-xs">
                        {initiative.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{initiative.timeline}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Loading strategic initiatives...</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-600" />
                Key Recommendations
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

      {/* AI Assistant */}
      <AIAssistant 
        context="strategic-planning"
        data={{ strategicData, okrs, initiatives, marketAnalysis }}
      />
    </div>
  );
}
