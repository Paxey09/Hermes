import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Select, SelectItem,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogHeader, DialogFooter, DialogTitle, DialogContent, Label, Input,
  AIAssistant
} from "../../components/admin/ui";
import { aiModules } from "../../services/ai";
import { Plus, DollarSign, TrendingUp, Calendar, Download, Brain, Sparkles, Target, Zap, TrendingDown } from "lucide-react";
import { supabase } from "../../config/supabaseClient";

export default function AdminRevenue() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    source: "sales",
    category: "product",
    description: ""
  });

  // AI State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [revenueForecasts, setRevenueForecasts] = useState({});

  // AI Functions
  async function generateAIInsights() {
    setAiLoading(true);
    try {
      const insights = await aiModules.generateBusinessInsights({
        revenue: entries,
        summary,
        module: 'revenue'
      }, 'current_month');
      setAiInsights(insights);
    } catch (err) {
      console.error("AI insights error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function forecastRevenue() {
    setAiLoading(true);
    try {
      const forecast = await aiModules.predictRevenue(entries, '3_months');
      setRevenueForecasts(forecast);
    } catch (err) {
      console.error("Revenue forecasting error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  async function analyzeRevenueTrends() {
    setAiLoading(true);
    try {
      const trends = await aiModules.analyzeRevenueTrends(entries);
      console.log('Revenue Trends:', trends);
    } catch (err) {
      console.error("Trend analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch revenue entries
      let query = supabase.from('revenue_entries').select('*').order('date', { ascending: false });
      if (filter !== "all") query = query.eq('source', filter);
      
      const { data: entriesData, error: entriesError } = await query;
      if (entriesError) throw entriesError;
      setEntries(entriesData || []);
      
      // Calculate summary locally
      const summary = {
        total: (entriesData || []).reduce((sum, e) => sum + Number(e.amount), 0),
        bySource: (entriesData || []).reduce((acc, e) => {
          acc[e.source] = (acc[e.source] || 0) + Number(e.amount);
          return acc;
        }, {}),
        byCategory: (entriesData || []).reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
          return acc;
        }, {})
      };
      setSummary(summary);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      // Mock data fallback
      const mockEntries = [
        { id: 1, date: '2024-01-15', amount: 5000, source: 'sales', category: 'product', description: 'Product sales Q1' },
        { id: 2, date: '2024-01-20', amount: 3500, source: 'service', category: 'consulting', description: 'Consulting project' },
        { id: 3, date: '2024-02-05', amount: 8000, source: 'subscription', category: 'saas', description: 'Annual subscriptions' },
        { id: 4, date: '2024-02-15', amount: 4200, source: 'sales', category: 'product', description: 'Enterprise license' },
        { id: 5, date: '2024-03-01', amount: 2500, source: 'other', category: 'licensing', description: 'Partnership revenue' },
      ];
      setEntries(mockEntries);
      setSummary({
        total: 23200,
        bySource: { sales: 9200, service: 3500, subscription: 8000, other: 2500 },
        byCategory: { product: 9200, consulting: 3500, saas: 8000, licensing: 2500 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEntry.amount || !newEntry.date) {
      alert("Date and amount are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('revenue_entries')
        .insert([{ ...newEntry, amount: parseFloat(newEntry.amount) }])
        .select()
        .single();

      if (error) throw error;
      setEntries([data, ...entries]);
      setIsCreateOpen(false);
      setNewEntry({ date: new Date().toISOString().split('T')[0], amount: "", source: "sales", category: "product", description: "" });
    } catch (error) {
      console.error('Error creating entry:', error);
      const mockEntry = { id: Date.now(), ...newEntry, amount: parseFloat(newEntry.amount) };
      setEntries([mockEntry, ...entries]);
      setIsCreateOpen(false);
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      sales: "bg-blue-500",
      service: "bg-green-500",
      subscription: "bg-purple-500",
      other: "bg-gray-500"
    };
    return colors[source] || "bg-gray-500";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue</h2>
          <p className="text-muted-foreground">Track and manage all revenue streams.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
        </div>
      </div>

      {/* AI Revenue Intelligence */}
      <Card className="border-[#c9a84c]/30 bg-gradient-to-r from-[#c9a84c]/10 to-[#ea580c]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#c9a84c]" />
            AI Revenue Intelligence
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
              onClick={forecastRevenue}
            >
              Forecast Revenue
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={Zap}
              loading={aiLoading}
              onClick={analyzeRevenueTrends}
            >
              Analyze Trends
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
          {Object.keys(revenueForecasts).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Revenue Forecasts:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(revenueForecasts).map(([period, forecast]) => (
                  <div key={period} className="p-2 bg-white dark:bg-white/5 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{period}</span>
                      <Badge variant="success">${forecast.amount?.toLocaleString()}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Confidence: {forecast.confidence}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary.bySource.sales || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Product sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary.bySource.service || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Consulting & services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary.bySource.subscription || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Recurring revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Revenue Entry</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input type="number" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: e.target.value})} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={newEntry.source} onChange={e => setNewEntry({...newEntry, source: e.target.value})}>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})}>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="licensing">Licensing</SelectItem>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Brief description..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Add Entry</Button>
        </DialogFooter>
      </Dialog>

      {/* Filter & Table */}
      <div className="flex items-center justify-between">
        <Select value={filter} onChange={e => setFilter(e.target.value)} className="w-[200px]">
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="sales">Sales</SelectItem>
          <SelectItem value="service">Services</SelectItem>
          <SelectItem value="subscription">Subscriptions</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No revenue entries found</TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`${getSourceColor(entry.source)} text-white capitalize`}>
                      {entry.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{entry.category}</TableCell>
                  <TableCell>{entry.description || '-'}</TableCell>
                  <TableCell className="text-right font-medium">${Number(entry.amount).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* AI Assistant Widget */}
      <AIAssistant 
        context="revenue" 
        contextData={{ entries, summary, aiInsights, revenueForecasts }}
      />
    </div>
  );
}
