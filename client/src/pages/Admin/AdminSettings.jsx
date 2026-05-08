import { useState } from "react";
import { Save, User, Building, Bell, Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "../../components/admin/ui";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Globe },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Full Name" placeholder="John Doe" />
                  <Input label="Email" type="email" placeholder="john@example.com" />
                </div>
                <Input label="Phone" placeholder="+1 234 567 890" />
                <div className="flex justify-end">
                  <Button icon={Save}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Company Name" placeholder="Acme Inc." />
                <Input label="Website" placeholder="https://example.com" />
                <div className="flex justify-end">
                  <Button icon={Save}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Notification settings coming soon!</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Third-party integrations coming soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
