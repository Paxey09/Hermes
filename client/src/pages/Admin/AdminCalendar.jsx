import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Video, Brain, Sparkles, Target, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, AIAssistant } from "../../components/admin/ui";
import { aiModules } from "../../services/ai";

export default function AdminCalendar() {
  const [events] = useState([]);

  // AI State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scheduleOptimization, setScheduleOptimization] = useState(null);

  // AI Functions
  async function generateAIInsights() {
    setAiLoading(true);
    try {
      const insights = await aiModules.generateBusinessInsights({
        events,
        module: 'calendar'
      }, 'current_month');
      setAiInsights(insights);
    } catch (err) {
      console.error("AI insights error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function optimizeSchedule() {
    setAiLoading(true);
    try {
      const optimization = await aiModules.optimizeSchedule(events);
      setScheduleOptimization(optimization);
    } catch (err) {
      console.error("Schedule optimization error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function suggestMeetingTimes() {
    setAiLoading(true);
    try {
      const suggestions = await aiModules.suggestMeetingTimes(events);
      console.log('Meeting Time Suggestions:', suggestions);
    } catch (err) {
      console.error("Meeting suggestions error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">Manage meetings and appointments</p>
        </div>
        <Button icon={Plus}>New Event</Button>
      </div>

      {/* AI Calendar Intelligence */}
      <Card className="border-[#c9a84c]/30 bg-gradient-to-r from-[#c9a84c]/10 to-[#ea580c]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#c9a84c]" />
            AI Calendar Intelligence
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
              onClick={optimizeSchedule}
            >
              Optimize Schedule
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Zap}
              loading={aiLoading}
              onClick={suggestMeetingTimes}
            >
              Suggest Times
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
          {scheduleOptimization && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Schedule Optimization:</p>
              <div className="p-3 bg-white dark:bg-white/5 rounded text-sm">
                <p className="font-medium">Efficiency Score:</p>
                <Badge variant={scheduleOptimization.efficiency > 80 ? 'success' : scheduleOptimization.efficiency > 60 ? 'warning' : 'default'}>
                  {scheduleOptimization.efficiency}%
                </Badge>
                {scheduleOptimization.recommendations && (
                  <div className="mt-2">
                    <p className="font-medium">Recommendations:</p>
                    <ul className="text-xs text-gray-500 mt-1 space-y-1">
                      {scheduleOptimization.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Calendar view coming soon!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Widget */}
      <AIAssistant 
        context="calendar" 
        contextData={{ events, aiInsights, scheduleOptimization }}
      />
    </div>
  );
}
