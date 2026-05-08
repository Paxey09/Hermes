import { useState } from "react";
import { Shield, Lock, Key, Users, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, StatCard, Badge } from "../../components/admin/ui";

export default function AdminSecurity() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Security</h1>
        <p className="text-sm text-gray-500">Manage security settings and access controls</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Email Verified" value="100%" icon={Mail} color="bg-green-500" />
        <StatCard title="Active Sessions" value="1" icon={Users} color="bg-blue-500" />
        <StatCard title="API Keys" value="0" icon={Key} color="bg-amber-500" />
        <StatCard title="Security Score" value="Good" icon={Shield} color="bg-purple-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm">Email Verification</span>
              <Badge variant="success">Required</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm">Password Policy</span>
              <Badge variant="success">Strong</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Session Timeout</span>
              <span className="text-sm text-gray-500">30 minutes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm">Admin Users</span>
              <span className="text-sm font-medium">2</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm">Client Users</span>
              <span className="text-sm font-medium">5</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Role-Based Access</span>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
