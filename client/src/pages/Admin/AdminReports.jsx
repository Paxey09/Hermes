import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Input, Select, SelectItem,
  Dialog, DialogHeader, DialogFooter, DialogTitle, DialogContent, Label, Textarea
} from "@/components/ui";
import { Plus, FileText, Download, Calendar, Play } from "lucide-react";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      setReports([
        { id: 1, name: 'Monthly Sales Report', type: 'sales', schedule: 'monthly', lastRun: '2024-01-31', isPublic: true },
        { id: 2, name: 'Revenue Analysis', type: 'revenue', schedule: 'weekly', lastRun: '2024-01-28', isPublic: false },
        { id: 3, name: 'Team Performance', type: 'performance', schedule: null, lastRun: '2024-01-15', isPublic: true },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const getTypeColor = (type) => {
    const colors = {
      sales: "bg-blue-500",
      revenue: "bg-green-500",
      performance: "bg-purple-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Generate and manage business reports.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> New Report</Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search reports..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 text-center py-12">Loading...</div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">No reports found</div>
        ) : (
          filteredReports.map(report => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">{report.name}</CardTitle>
                  <Badge className={`${getTypeColor(report.type)} text-white capitalize`}>
                    {report.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule: {report.schedule || 'Manual'}</span>
                  </div>
                  <div>Last run: {report.lastRun}</div>
                  <div>Visibility: {report.isPublic ? 'Public' : 'Private'}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1"><Play className="mr-2 h-4 w-4" /> Run</Button>
                  <Button variant="outline" size="sm" className="flex-1"><Download className="mr-2 h-4 w-4" /> Export</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
