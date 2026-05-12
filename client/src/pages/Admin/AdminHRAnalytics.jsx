import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { 
  Users, TrendingUp, TrendingDown, UserCheck, GraduationCap, Heart, 
  Brain, Sparkles, Download, Calendar, Target, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, Zap, Award, Eye, AlertTriangle,
  Briefcase, Star, Clock, CheckCircle, XCircle
} from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminHRAnalytics() {
  const [hrData, setHRData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [recruitmentData, setRecruitmentData] = useState([]);
  const [engagementData, setEngagementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive HR data
      const [
        employeeData,
        performanceData,
        recruitmentData,
        engagementData
      ] = await Promise.all([
        supabase.from('team_members').select('*'),
        supabase.from('performance_reviews').select('*').order('date', { ascending: false }).limit(50),
        supabase.from('recruitment_pipeline').select('*').order('created_at', { ascending: false }),
        supabase.from('employee_engagement').select('*').order('date', { ascending: false }).limit(20)
      ]);

      // Calculate HR metrics
      const totalEmployees = employeeData.data?.length || 0;
      const activeEmployees = employeeData.data?.filter(emp => emp.status === 'active').length || 0;
      const newHires = employeeData.data?.filter(emp => {
        const hireDate = new Date(emp.hire_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return hireDate > threeMonthsAgo;
      }).length || 0;

      const avgPerformance = calculateAveragePerformance(performanceData.data || []);
      const engagementScore = calculateEngagementScore(engagementData.data || []);
      const turnoverRate = calculateTurnoverRate(employeeData.data || []);

      setHRData({
        totalEmployees,
        activeEmployees,
        newHires,
        avgPerformance,
        engagementScore,
        turnoverRate,
        departmentBreakdown: calculateDepartmentBreakdown(employeeData.data || []),
        skillGaps: calculateSkillGaps(employeeData.data || [])
      });

      setPerformanceData(performanceData.data || []);
      setRecruitmentData(recruitmentData.data || []);
      setEngagementData(generateEngagementMetrics(engagementData.data || []));

      // Generate AI insights
      const insights = await aiModules.analyzePeopleAnalytics({
        employees: employeeData.data || [],
        performance: performanceData.data || [],
        recruitment: recruitmentData.data || [],
        engagement: engagementData.data || []
      });
      setAiInsights(insights);

      // Generate AI predictions
      const predictions = await aiModules.predictPeopleTrends({
        currentMetrics: { totalEmployees, avgPerformance, engagementScore, turnoverRate },
        historicalData: performanceData.data || [],
        marketData: generateHRMarketData()
      });
      setAiPredictions(predictions);

    } catch (error) {
      console.error('Error fetching HR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAveragePerformance = (performanceData) => {
    if (performanceData.length === 0) return 3.5;
    const totalScore = performanceData.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (totalScore / performanceData.length).toFixed(1);
  };

  const calculateEngagementScore = (engagementData) => {
    if (engagementData.length === 0) return 78;
    const totalScore = engagementData.reduce((sum, survey) => sum + (survey.score || 0), 0);
    return Math.round((totalScore / engagementData.length));
  };

  const calculateTurnoverRate = (employeeData) => {
    const activeEmployees = employeeData.filter(emp => emp.status === 'active').length;
    const terminatedEmployees = employeeData.filter(emp => emp.status === 'terminated').length;
    const totalEmployees = employeeData.length;
    
    if (totalEmployees === 0) return 0;
    return ((terminatedEmployees / totalEmployees) * 100).toFixed(1);
  };

  const calculateDepartmentBreakdown = (employeeData) => {
    const departments = {};
    employeeData.forEach(emp => {
      const dept = emp.department || 'Other';
      departments[dept] = (departments[dept] || 0) + 1;
    });
    return departments;
  };

  const calculateSkillGaps = (employeeData) => {
    // Placeholder for skill gap analysis
    return [
      { skill: 'AI/ML', gap: 35, priority: 'high' },
      { skill: 'Data Science', gap: 28, priority: 'high' },
      { skill: 'Cloud Architecture', gap: 22, priority: 'medium' },
      { skill: 'DevOps', gap: 18, priority: 'medium' }
    ];
  };

  const generateEngagementMetrics = (engagementData) => ({
    overallScore: calculateEngagementScore(engagementData),
    jobSatisfaction: 82,
    workLifeBalance: 75,
    careerDevelopment: 68,
    managementSupport: 79,
    teamCollaboration: 85,
    recognition: 71,
    trends: {
      monthly: [75, 78, 82, 79, 81, 78],
      departments: {
        'Engineering': 85,
        'Sales': 78,
        'Marketing': 82,
        'Operations': 76,
        'HR': 88
      }
    }
  });

  const generateHRMarketData = () => ({
    marketGrowth: 8.5,
    talentAvailability: 'Moderate',
    salaryInflation: 4.2,
    competitionLevel: 'High',
    emergingSkills: ['AI/ML', 'Data Science', 'Cloud Computing', 'Cybersecurity']
  });

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-blue-600 bg-blue-100';
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEngagementColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
      {/* HR Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & People Analytics</h1>
          <p className="text-gray-600">Employee performance, recruitment insights, and engagement metrics</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export HR Report
          </Button>
          <Button icon={Users}>
            Launch Recruitment Campaign
          </Button>
        </div>
      </div>

      {/* HR Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{hrData?.totalEmployees || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {hrData?.newHires || 0} new hires
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{hrData?.avgPerformance || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Out of 5.0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engagement Score</p>
                <p className="text-2xl font-bold text-gray-900">{engagementData?.overallScore || 0}%</p>
                <div className="flex items-center gap-1 mt-2">
                  {engagementData?.overallScore >= 80 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Turnover Rate</p>
                <p className="text-2xl font-bold text-red-600">{hrData?.turnoverRate || 0}%</p>
                <p className="text-sm text-gray-500 mt-2">Annual rate</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Department Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(hrData?.departmentBreakdown || {}).map(([dept, count]) => (
              <div key={dept} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600">{dept}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Recent Performance Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.slice(0, 5).map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.employee_name}</h4>
                    <p className="text-sm text-gray-600">{review.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceColor(review.rating)}>
                      {review.rating}/5.0
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{review.summary}</p>
                {review.goals && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600">Key Goals:</p>
                    <ul className="text-xs text-gray-500 list-disc list-inside">
                      {review.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Recruitment Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recruitmentData.slice(0, 4).map((candidate) => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={candidate.stage === 'offer' ? 'success' : 
                                   candidate.stage === 'interview' ? 'warning' : 'info'}>
                      {candidate.stage}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(candidate.applied_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Experience: {candidate.experience}</span>
                  <span>Location: {candidate.location}</span>
                  <span>Source: {candidate.source}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Skill Gaps Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hrData?.skillGaps?.map((skill, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{skill.skill}</span>
                    <span className="text-sm text-gray-600">{skill.gap}% gap</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        skill.priority === 'high' ? 'bg-red-600' : 
                        skill.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${skill.gap}%` }}
                    />
                  </div>
                </div>
                <Badge variant={skill.priority === 'high' ? 'error' : skill.priority === 'medium' ? 'warning' : 'info'} className="ml-4">
                  {skill.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Engagement Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Job Satisfaction</span>
                <span className="font-semibold">{engagementData?.jobSatisfaction}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Work-Life Balance</span>
                <span className="font-semibold">{engagementData?.workLifeBalance}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Career Development</span>
                <span className="font-semibold">{engagementData?.careerDevelopment}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Management Support</span>
                <span className="font-semibold">{engagementData?.managementSupport}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Engagement by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(engagementData?.trends?.departments || {}).map(([dept, score]) => (
                <div key={dept} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{dept}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getEngagementColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI People Intelligence */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI People Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {aiInsights?.insights?.slice(0, 3).map((insight, index) => (
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
                <TrendingUp className="w-4 h-4 text-green-600" />
                Predictions
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Turnover Risk</p>
                  <p className="text-xs text-gray-600 mt-1">{aiPredictions?.turnoverRisk || 'Moderate risk in Q3'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Hiring Needs</p>
                  <p className="text-xs text-gray-600 mt-1">{aiPredictions?.hiringNeeds || '12 roles in next quarter'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {aiInsights?.recommendations?.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
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
        context="hr-analytics"
        data={{ hrData, performanceData, recruitmentData, engagementData }}
      />
    </div>
  );
}
