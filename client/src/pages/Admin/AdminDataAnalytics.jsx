import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/admin/ui';
import { BarChart3, TrendingUp, Download, Brain, Sparkles, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

export default function AdminDataAnalytics() {
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMetrics(); }, [dateRange]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const { data: events } = await supabase.from('analytics_events').select('*').order('timestamp', { ascending: false }).limit(1000);
      const totals = (events || []).reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {});
      setMetrics({
        totalEvents: events?.length || 0,
        pageViews: totals.page_view || 0,
        clicks: totals.click || 0,
        conversions: totals.conversion || 0,
        errors: totals.error || 0,
        events: events || [],
      });
    } catch { setMetrics({ totalEvents: 0, pageViews: 0, clicks: 0, conversions: 0, errors: 0, events: [] }); }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track user behavior, page views, and conversion metrics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(r => (
            <button key={r} onClick={() => setDateRange(r)} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (dateRange === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>{r}</button>
          ))}
          <Button variant="secondary" size="sm" icon={Download}>Export</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent><div className="animate-pulse h-16 bg-gray-200 rounded" /></CardContent></Card>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Events</p><p className="text-2xl font-bold">{metrics?.totalEvents || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Page Views</p><p className="text-2xl font-bold">{metrics?.pageViews || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Conversions</p><p className="text-2xl font-bold">{metrics?.conversions || 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Errors</p><p className="text-2xl font-bold text-red-500">{metrics?.errors || 0}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="pb-2">Type</th><th className="pb-2">Name</th><th className="pb-2">Page</th><th className="pb-2">Time</th></tr></thead>
                  <tbody>
                    {(metrics?.events || []).slice(0, 20).map(e => (
                      <tr key={e.id} className="border-t border-gray-100"><td className="py-2"><Badge>{e.event_type}</Badge></td><td className="py-2">{e.event_name}</td><td className="py-2 text-gray-500">{e.page_url}</td><td className="py-2 text-gray-500">{new Date(e.timestamp).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}