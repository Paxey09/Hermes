import { useState } from "react";
import { Plus, Mail, Send, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatCard } from "../../components/admin/ui";

export default function AdminMarketing() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-500">Email campaigns and marketing automation</p>
        </div>
        <Button icon={Plus}>Create Campaign</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Campaigns" value="0" icon={Mail} color="bg-blue-500" />
        <StatCard title="Emails Sent" value="0" icon={Send} color="bg-green-500" />
        <StatCard title="Open Rate" value="0%" icon={BarChart3} color="bg-amber-500" />
        <StatCard title="Click Rate" value="0%" icon={BarChart3} color="bg-purple-500" />
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Marketing module coming soon. Create your first campaign!</p>
        </CardContent>
      </Card>
    </div>
  );
}
