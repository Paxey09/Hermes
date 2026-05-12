import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/admin/ui';
import { TrendingUp, BarChart3, Brain, Sparkles } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

export default function AdminPipelineAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: stages } = await supabase.from('crm_stages').select('*').order('sort_order');
      const { data: deals } = await supabase.from('crm_opportunities').select('*, stage:crm_stages(*)');
      const totalValue = (deals || []).reduce((s, d) => s + Number(d.expected_revenue || 0), 0);
      setData({
        stages: stages || [],
        deals: deals || [],
        totalValue,
        avgDealSize: (deals?.length || 0) > 0 ? Math.round(totalValue / deals.length) : 0,
      });
    } catch { setData({ stages: [], deals: [], totalValue: 0, avgDealSize: 0 }); }
    setLoading(false);
  }

  if (loading) return <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Card key={i}><CardContent><div className="animate-pulse h-16 bg-gray-200 rounded" /></CardContent></Card>)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Pipeline Value</p><p className="text-2xl font-bold">${(data?.totalValue || 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Deals</p><p className="text-2xl font-bold">{data?.deals?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg Deal Size</p><p className="text-2xl font-bold">${(data?.avgDealSize || 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Stages</p><p className="text-2xl font-bold">{data?.stages?.length || 0}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Pipeline Stages</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data?.stages || []).map(stage => {
              const stageDeals = (data?.deals || []).filter(d => d.stage?.id === stage.id);
              const stageValue = stageDeals.reduce((s, d) => s + Number(d.expected_revenue || 0), 0);
              const width = data?.totalValue > 0 ? (stageValue / data.totalValue * 100) : 0;
              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-gray-500">{stageDeals.length} deals - ${stageValue.toLocaleString()} ({Math.round(width)}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: width + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}