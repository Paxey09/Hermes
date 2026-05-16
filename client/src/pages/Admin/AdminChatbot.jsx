import { useState } from "react";
import { Plus, Bot, MessageSquare, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/admin/ui";

export default function AdminChatbot() {
  const [rules] = useState([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">AI Chatbot</h1>
          <p className="text-sm text-[var(--text-muted)]">Configure auto-reply rules and responses</p>
        </div>
        <Button icon={Plus}>Add Rule</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bot className="w-5 h-5 text-[var(--brand-cyan)]" />
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-[var(--text-muted)]">Active Rules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-[var(--success)]" />
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-[var(--text-muted)]">Messages Handled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-[var(--brand-gold)]" />
            <div>
              <p className="text-2xl font-bold">0%</p>
              <p className="text-xs text-[var(--text-muted)]">Response Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Bot className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">No chatbot rules configured yet. Add your first rule!</p>
        </CardContent>
      </Card>
    </div>
  );
}
