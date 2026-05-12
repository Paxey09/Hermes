import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Input, Label, Select, SelectItem, Switch, AIAssistant, Progress
} from "../../components/admin/ui";
import { 
  Save, Settings, User, Building, Bell, Link, Brain, Sparkles, Zap, 
  TrendingUp, CheckCircle, AlertTriangle, Lightbulb, Target, Shield
} from "lucide-react";
import { aiModules } from "../../services/ai";
import { supabase } from "../../config/supabaseClient";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [optimizationScore, setOptimizationScore] = useState(75);
  const [recommendations, setRecommendations] = useState([]);
  const [settingsData, setSettingsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch current settings
      const [profileData, companyData, notificationData] = await Promise.all([
        fetchProfileSettings(),
        fetchCompanySettings(),
        fetchNotificationSettings()
      ]);

      setSettingsData({
        profile: profileData,
        company: companyData,
        notifications: notificationData
      });

      // Generate AI insights and recommendations
      const insights = await aiModules.analyzeSettings({
        profile: profileData,
        company: companyData,
        notifications: notificationData
      });
      setAiInsights(insights);
      setRecommendations(insights.recommendations || []);
      setOptimizationScore(insights.optimizationScore || 75);

    } catch (error) {
      console.error('Error fetching settings data:', error);
      // Use mock data for demo
      const mockData = generateMockSettings();
      setSettingsData(mockData);
      setRecommendations(generateMockRecommendations());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSettings = () => ({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@hermes.com',
      phone: '+1 (555) 123-4567',
      bio: 'Experienced technology professional'
    },
    company: {
      name: 'Hermes Technologies',
      industry: 'technology',
      size: '51-200',
      website: 'https://hermes.com'
    },
    notifications: {
      email: true,
      push: false,
      sms: true,
      marketing: false
    }
  });

  const generateMockRecommendations = () => [
    {
      id: 1,
      category: 'security',
      priority: 'high',
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account with 2FA',
      impact: 'Increases account security by 99%',
      effort: 'low'
    },
    {
      id: 2,
      category: 'productivity',
      priority: 'medium',
      title: 'Optimize Notification Settings',
      description: 'Adjust notification preferences to reduce distractions',
      impact: 'Improves focus by 25%',
      effort: 'low'
    },
    {
      id: 3,
      category: 'integration',
      priority: 'medium',
      title: 'Connect Slack Integration',
      description: 'Integrate with Slack for better team collaboration',
      impact: 'Streamlines communication',
      effort: 'medium'
    }
  ];

  const fetchProfileSettings = async () => generateMockSettings().profile;
  const fetchCompanySettings = async () => generateMockSettings().company;
  const fetchNotificationSettings = async () => generateMockSettings().notifications;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save settings to database
      await supabase.from('user_settings').upsert({
        user_id: 'current-user',
        settings: settingsData,
        updated_at: new Date().toISOString()
      });

      // Re-analyze settings after save
      const insights = await aiModules.analyzeSettings(settingsData);
      setAiInsights(insights);
      setRecommendations(insights.recommendations || []);
      setOptimizationScore(insights.optimizationScore || 75);

    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const runOptimizationAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      
      const analysis = await aiModules.optimizeSettings({
        currentSettings: settingsData,
        userBehavior: generateUserBehaviorData(),
        bestPractices: getBestPractices()
      });

      setRecommendations(analysis.recommendations);
      setOptimizationScore(analysis.optimizedScore);
      setAiInsights(prev => ({
        ...prev,
        ...analysis
      }));

    } catch (error) {
      console.error('Error running optimization analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateUserBehaviorData = () => ({
    loginFrequency: 'daily',
    activeHours: ['9:00-17:00'],
    preferredCommunication: 'email',
    teamSize: 15,
    role: 'admin'
  });

  const getBestPractices = () => ({
    security: ['2fa_enabled', 'strong_password', 'regular_updates'],
    productivity: ['focused_notifications', 'email_batches', 'meeting_free_blocks'],
    collaboration: ['slack_integration', 'calendar_sync', 'document_sharing']
  });

  const applyRecommendation = async (recommendation) => {
    // Apply the recommended setting change
    const updatedSettings = { ...settingsData };
    
    switch (recommendation.category) {
      case 'security':
        updatedSettings.notifications = { ...updatedSettings.notifications, security: true };
        break;
      case 'productivity':
        updatedSettings.notifications = { ...updatedSettings.notifications, push: false, marketing: false };
        break;
      case 'integration':
        // Would open integration dialog
        break;
    }

    setSettingsData(updatedSettings);
    
    // Remove applied recommendation
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return colors[priority] || 'bg-gray-100';
  };

  const getOptimizationLevel = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { text: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'Needs Improvement', color: 'text-red-600' };
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Link }
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
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Powered Settings</h1>
          <p className="text-gray-600">Intelligent optimization and personalized recommendations</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            icon={Brain}
            onClick={runOptimizationAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'AI Optimization'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Optimization Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Settings Optimization</h3>
                <p className={`text-3xl font-bold ${getOptimizationLevel(optimizationScore).color}`}>
                  {optimizationScore}%
                </p>
                <p className="text-sm text-gray-600">
                  {getOptimizationLevel(optimizationScore).text} Configuration
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">AI Recommendations</p>
              <p className="text-2xl font-bold text-purple-600">{recommendations.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {rec.effort} effort
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Impact:</span> {rec.impact}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyRecommendation(rec)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={settingsData.profile?.firstName || ''}
                    onChange={e => setSettingsData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, firstName: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={settingsData.profile?.lastName || ''}
                    onChange={e => setSettingsData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, lastName: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={settingsData.profile?.email || ''}
                  onChange={e => setSettingsData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={settingsData.profile?.phone || ''}
                  onChange={e => setSettingsData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={4}
                  value={settingsData.profile?.bio || ''}
                  onChange={e => setSettingsData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, bio: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "company" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={settingsData.company?.name || ''}
                  onChange={e => setSettingsData(prev => ({
                    ...prev,
                    company: { ...prev.company, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={settingsData.company?.industry || ''}>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </Select>
              </div>
              <div>
                <Label htmlFor="size">Company Size</Label>
                <Select value={settingsData.company?.size || ''}>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201+">201+ employees</SelectItem>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  type="url" 
                  value={settingsData.company?.website || ''}
                  onChange={e => setSettingsData(prev => ({
                    ...prev,
                    company: { ...prev.company, website: e.target.value }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email updates about your account</p>
                </div>
                <Switch 
                  checked={settingsData.notifications?.email || false}
                  onCheckedChange={checked => setSettingsData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                </div>
                <Switch 
                  checked={settingsData.notifications?.push || false}
                  onCheckedChange={checked => setSettingsData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive text messages for important updates</p>
                </div>
                <Switch 
                  checked={settingsData.notifications?.sms || false}
                  onCheckedChange={checked => setSettingsData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: checked }
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-gray-600">Receive emails about new features and updates</p>
                </div>
                <Switch 
                  checked={settingsData.notifications?.marketing || false}
                  onCheckedChange={checked => setSettingsData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, marketing: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "integrations" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-[var(--accent-gold)]" />
                Third-Party Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Slack</h4>
                    <Badge className="bg-yellow-100 text-yellow-700">Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Connect your workspace for team collaboration</p>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Google Calendar</h4>
                    <Badge className="bg-green-100 text-green-700">Popular</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Sync your calendar for better scheduling</p>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Settings Intelligence */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Settings Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Optimization Insights
              </h4>
              <div className="space-y-2">
                {aiInsights?.insights?.slice(0, 3).map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Analyzing settings patterns...</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Usage Patterns
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Peak Activity</p>
                  <p className="text-xs text-gray-600 mt-1">{aiInsights?.patterns?.peakTime || '9:00-11:00 AM'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Preferred Features</p>
                  <p className="text-xs text-gray-600 mt-1">{aiInsights?.patterns?.topFeatures || 'Dashboard, Reports'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {aiInsights?.suggestions?.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Generating personalized suggestions...</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <AIAssistant 
        context="settings"
        data={{ settingsData, recommendations, optimizationScore, aiInsights }}
      />
    </div>
  );
}
