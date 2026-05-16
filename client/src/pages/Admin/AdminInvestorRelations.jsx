import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { 
  DollarSign, TrendingUp, TrendingDown, Users, Target, 
  Brain, Sparkles, Download, Calendar, Presentation, Eye,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3, PieChart,
  FileText, Globe, Building, Award, AlertCircle
} from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminInvestorRelations() {
  const [financialData, setFinancialData] = useState(null);
  const [investorMetrics, setInvestorMetrics] = useState(null);
  const [marketPosition, setMarketPosition] = useState(null);
  const [shareholderData, setShareholderData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [projections, setProjections] = useState(null);

  useEffect(() => {
    fetchInvestorData();
  }, []);

  const fetchInvestorData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive financial and investor data
      const [
        revenueData,
        dealsData,
        teamData,
        investorData
      ] = await Promise.all([
        supabase.from('revenue').select('*').order('date', { ascending: false }).limit(24),
        supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('team_members').select('*'),
        supabase.from('investor_relations').select('*').order('date', { ascending: false }).limit(20)
      ]);

      // Calculate financial metrics
      const totalRevenue = revenueData.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const quarterlyRevenue = calculateQuarterlyRevenue(revenueData.data || []);
      const revenueGrowth = calculateRevenueGrowth(revenueData.data || []);
      const dealValue = dealsData.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
      const teamSize = teamData.data?.length || 0;

      setFinancialData({
        totalRevenue,
        quarterlyRevenue,
        revenueGrowth,
        dealPipeline: dealValue,
        teamSize,
        profitability: calculateProfitability(revenueData.data || []),
        ebitda: calculateEBITDA(revenueData.data || []),
        cashFlow: calculateCashFlow(revenueData.data || [])
      });

      setInvestorMetrics({
        totalInvestors: 156,
        activeInvestors: 89,
        investorSatisfaction: 94,
        fundingRounds: 4,
        totalRaised: 12500000,
        currentValuation: 85000000,
        nextFundingTarget: 25000000,
        investorRetention: 87
      });

      setMarketPosition({
        marketShare: 18.5,
        marketGrowth: 12.3,
        competitiveRanking: 2,
        brandRecognition: 76,
        customerSatisfaction: 92,
        npsScore: 68
      });

      setShareholderData(generateShareholderData());

      // Generate AI insights
      const insights = await aiModules.generateInvestorInsights({
        financials: financialData,
        marketPosition: marketPosition,
        growthMetrics: { revenueGrowth, teamGrowth: 8.5 }
      });
      setAiInsights(insights);

      // Generate projections
      const projectionData = await aiModules.generateFinancialProjections({
        currentMetrics: { totalRevenue, teamSize },
        marketData: marketPosition,
        historicalData: revenueData.data || []
      });
      setProjections(projectionData);

    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateQuarterlyRevenue = (revenueData) => {
    const quarters = {};
    revenueData.forEach(item => {
      const quarter = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', quarter: 'numeric' });
      quarters[quarter] = (quarters[quarter] || 0) + (item.amount || 0);
    });
    return Object.entries(quarters).slice(-4).map(([quarter, revenue]) => ({ quarter, revenue }));
  };

  const calculateRevenueGrowth = (revenueData) => {
    if (revenueData.length < 12) return 15.2; // Default growth
    const recent = revenueData.slice(0, 6).reduce((sum, item) => sum + (item.amount || 0), 0);
    const previous = revenueData.slice(6, 12).reduce((sum, item) => sum + (item.amount || 0), 0);
    return previous > 0 ? ((recent - previous) / previous) * 100 : 15.2;
  };

  const calculateProfitability = (revenueData) => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const estimatedCosts = totalRevenue * 0.65; // Assume 65% cost structure
    return totalRevenue > 0 ? ((totalRevenue - estimatedCosts) / totalRevenue) * 100 : 23.5;
  };

  const calculateEBITDA = (revenueData) => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
    return totalRevenue * 0.28; // Assume 28% EBITDA margin
  };

  const calculateCashFlow = (revenueData) => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.amount || 0), 0);
    return totalRevenue * 0.15; // Assume 15% cash flow margin
  };

  const generateShareholderData = () => [
    {
      id: 1,
      name: "Venture Capital Partners",
      type: "VC",
      shares: 2500000,
      percentage: 29.4,
      investment: 8500000,
      date: "2022-03-15",
      status: "active"
    },
    {
      id: 2,
      name: "Strategic Investors Fund",
      type: "PE",
      shares: 1800000,
      percentage: 21.2,
      investment: 6200000,
      date: "2023-01-20",
      status: "active"
    },
    {
      id: 3,
      name: "Angel Investor Group",
      type: "Angel",
      shares: 1200000,
      percentage: 14.1,
      investment: 2800000,
      date: "2021-08-10",
      status: "active"
    },
    {
      id: 4,
      name: "Employee Stock Options",
      type: "ESOP",
      shares: 850000,
      percentage: 10.0,
      investment: 0,
      date: "2020-01-01",
      status: "active"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Investor Relations Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Investor Relations</h1>
          <p className="text-[var(--text-secondary)]">Financial metrics, investor communications, and market performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Download Investor Deck
          </Button>
          <Button icon={Presentation}>
            Schedule Investor Meeting
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Total Revenue</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ${(financialData?.totalRevenue || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {financialData?.revenueGrowth > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-[var(--danger)]" />
                  )}
                  <span className={`text-sm ${financialData?.revenueGrowth > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {financialData?.revenueGrowth?.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-[var(--brand-cyan-soft)] rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Valuation</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ${(investorMetrics?.currentValuation / 1000000).toFixed(0)}M
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Series B Stage
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--success-soft)] rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Total Raised</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ${(investorMetrics?.totalRaised / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  {investorMetrics?.fundingRounds} rounds
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--brand-gold-soft)] rounded-2xl flex items-center justify-center">
                <Award className="w-6 h-6 text-[var(--brand-gold)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Investors</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{investorMetrics?.totalInvestors || 0}</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  {investorMetrics?.activeInvestors} active
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--brand-gold-soft)] rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[var(--brand-gold)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Performance & Market Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Financial Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Profitability</span>
                <span className="font-semibold">{financialData?.profitability?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">EBITDA Margin</span>
                <span className="font-semibold">${(financialData?.ebitda / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Cash Flow</span>
                <span className="font-semibold">${(financialData?.cashFlow / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Deal Pipeline</span>
                <span className="font-semibold">${(financialData?.dealPipeline / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Market Share</span>
                <span className="font-semibold">{marketPosition?.marketShare}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Market Growth</span>
                <span className="font-semibold text-[var(--success)]">+{marketPosition?.marketGrowth}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Competitive Ranking</span>
                <span className="font-semibold">#{marketPosition?.competitiveRanking}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Customer Satisfaction</span>
                <span className="font-semibold">{marketPosition?.customerSatisfaction}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shareholder Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Shareholder Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--bg-card)] divide-y divide-[var(--border-color)]">
                {shareholderData.map((shareholder) => (
                  <tr key={shareholder.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                      {shareholder.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                      <Badge variant="default" className="text-xs">
                        {shareholder.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                      {shareholder.shares.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                      {shareholder.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                      ${shareholder.investment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                      {new Date(shareholder.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Investor Intelligence */}
      <Card className="bg-gradient-to-r from-[var(--success-soft)] via-[var(--bg-card)] to-[var(--brand-cyan-soft)] border-[var(--success)]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--success)]" />
            AI Investor Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--success)]" />
                Key Highlights for Investors
              </h4>
              <div className="space-y-2">
                {aiInsights?.keyHighlights?.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)]">{highlight}</p>
                  </div>
                )) || (
                  <p className="text-sm text-[var(--text-muted)]">AI insights loading...</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Presentation className="w-4 h-4 text-[var(--brand-cyan)]" />
                Investor Talking Points
              </h4>
              <div className="space-y-2">
                {aiInsights?.investorTalkingPoints?.map((point, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-[var(--brand-cyan)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)]">{point}</p>
                  </div>
                )) || (
                  <p className="text-sm text-[var(--text-muted)]">AI talking points loading...</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Financial Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3">Next Quarter</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                  <span className="font-medium">
                    ${((aiInsights?.financialProjections?.nextQuarter?.revenue || 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Growth</span>
                  <span className="font-medium text-[var(--success)]">
                    +{aiInsights?.financialProjections?.nextQuarter?.growth || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3">Next Year</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                  <span className="font-medium">
                    ${((aiInsights?.financialProjections?.nextYear?.revenue || 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Profitability</span>
                  <span className="font-medium text-[var(--success)]">
                    {aiInsights?.financialProjections?.nextYear?.profitability || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant 
        context="investor-relations"
        data={{ financialData, investorMetrics, marketPosition, shareholderData }}
      />
    </div>
  );
}
