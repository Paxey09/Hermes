import { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle,
  Badge, Input, Select, SelectItem,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Button
} from "@/components/ui";
import { Search, Filter, Download, Shield, AlertTriangle, Info, AlertCircle } from "lucide-react";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      const mockLogs = [
        { id: 1, user_email: 'admin@hermes.com', action: 'create', resource_type: 'deal', resource_name: 'Enterprise Deal', severity: 'info', created_at: '2024-01-15T10:30:00Z', ip_address: '192.168.1.1' },
        { id: 2, user_email: 'john@hermes.com', action: 'update', resource_type: 'client', resource_name: 'Acme Corp', severity: 'info', created_at: '2024-01-15T11:15:00Z', ip_address: '192.168.1.2' },
        { id: 3, user_email: 'admin@hermes.com', action: 'delete', resource_type: 'task', resource_name: 'Old Task', severity: 'warning', created_at: '2024-01-15T12:00:00Z', ip_address: '192.168.1.1' },
        { id: 4, user_email: 'sarah@hermes.com', action: 'login', resource_type: 'auth', resource_name: 'User Login', severity: 'info', created_at: '2024-01-15T09:00:00Z', ip_address: '192.168.1.3' },
        { id: 5, user_email: 'admin@hermes.com', action: 'export', resource_type: 'report', resource_name: 'Revenue Report', severity: 'info', created_at: '2024-01-15T14:30:00Z', ip_address: '192.168.1.1' },
      ];
      setLogs(mockLogs);
      setStats({
        total: mockLogs.length,
        byAction: { create: 1, update: 1, delete: 1, login: 1, export: 1 },
        bySeverity: { info: 4, warning: 1, error: 0 }
      });
      setIsLoading(false);
    }, 500);
  }, []);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-700",
      error: "bg-red-50 text-red-600",
      warning: "bg-yellow-100 text-yellow-700",
      info: "bg-blue-100 text-blue-700",
      debug: "bg-gray-100 text-gray-700"
    };
    return colors[severity] || "bg-gray-100";
  };

  const getActionColor = (action) => {
    const colors = {
      create: "bg-green-100 text-green-700",
      update: "bg-blue-100 text-blue-700",
      delete: "bg-red-100 text-red-700",
      login: "bg-purple-100 text-purple-700",
      export: "bg-orange-100 text-orange-700",
      view: "bg-gray-100 text-gray-700"
    };
    return colors[action] || "bg-gray-100";
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_email.toLowerCase().includes(search.toLowerCase()) ||
                         log.resource_name.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">Track all system activities and changes.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Logs</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.byAction.create || 0}</div>
              <p className="text-xs text-muted-foreground">Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.byAction.update || 0}</div>
              <p className="text-xs text-muted-foreground">Updated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.byAction.delete || 0}</div>
              <p className="text-xs text-muted-foreground">Deleted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.bySeverity.warning || 0}</div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search logs..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-[150px]">
          <SelectItem value="all">All Actions</SelectItem>
          <SelectItem value="create">Create</SelectItem>
          <SelectItem value="update">Update</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="login">Login</SelectItem>
          <SelectItem value="export">Export</SelectItem>
        </Select>
        <Select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="w-[150px]">
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No logs found</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.user_email}</TableCell>
                  <TableCell>
                    <Badge className={`${getActionColor(log.action)} capitalize`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.resource_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{log.resource_type}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(log.severity)}
                      <Badge variant="outline" className={`${getSeverityColor(log.severity)} capitalize`}>
                        {log.severity}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{log.ip_address}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
