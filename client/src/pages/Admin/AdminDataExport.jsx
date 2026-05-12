import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Select } from '../../components/admin/ui';
import { Download, FileSpreadsheet, FileText, File, Database, Brain, Sparkles } from 'lucide-react';

export default function AdminDataExport() {
  const [format, setFormat] = useState('csv');
  const [module, setModule] = useState('deals');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    setExporting(false);
    alert('Export started. Your file will be downloaded shortly.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Data Export</h1><p className="text-sm text-gray-500">Export your data in various formats for external use</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Export Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <select value={module} onChange={e => setModule(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white text-sm py-2 px-3">
                <option value="deals">Deals</option>
                <option value="contacts">Contacts</option>
                <option value="revenue">Revenue</option>
                <option value="projects">Projects</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <div className="flex gap-2">
                {[
                  { value: 'csv', icon: FileSpreadsheet, label: 'CSV' },
                  { value: 'xlsx', icon: File, label: 'Excel' },
                  { value: 'pdf', icon: FileText, label: 'PDF' },
                  { value: 'json', icon: Database, label: 'JSON' },
                ].map(f => (
                  <button key={f.value} onClick={() => setFormat(f.value)} className={'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border ' + (format === f.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
                    <f.icon className="w-4 h-4" />{f.label}
                  </button>
                ))}
              </div>
            </div>
            <Button icon={Download} loading={exporting} onClick={handleExport} className="w-full">Export Data</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Exports</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-8">No recent exports. Export data to see history here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}