import { useState, useEffect } from "react";
import { Plus, FileText, Users, DollarSign, Receipt, X, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../components/admin/ui";
import { supabase } from "../../config/supabaseClient";
import { useTheme } from "../../context/ThemeContext";

export default function AdminERP() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({ title: "", category: "invoice", content: "", status: "draft" });
  const { isDark } = useTheme();

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        await supabase.from("documents").update({ title: formData.title, category: formData.category, content: formData.content, status: formData.status }).eq("id", editingDoc.id);
      } else {
        await supabase.from("documents").insert({ title: formData.title, category: formData.category, content: formData.content, status: formData.status });
      }
      setShowModal(false);
      setEditingDoc(null);
      setFormData({ title: "", category: "invoice", content: "", status: "draft" });
      fetchDocuments();
    } catch (error) {
      alert("Failed to save document.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    await supabase.from("documents").delete().eq("id", id);
    fetchDocuments();
  };

  const invoices = documents.filter(d => d.category === "invoice");
  const totalRevenue = invoices.reduce((sum, d) => sum + (Number(JSON.parse(d.content || '{}').amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>ERP</h1>
          <p className="text-sm text-gray-500">Enterprise Resource Planning</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingDoc(null); setFormData({ title: "", category: "invoice", content: "", status: "draft" }); setShowModal(true); }}>New Document</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[ 
          { label: "Documents", value: documents.length, icon: FileText, color: "blue" },
          { label: "Invoices", value: invoices.length, icon: Receipt, color: "green" },
          { label: "Published", value: documents.filter(d => d.status === "published").length, icon: FileText, color: "amber" },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "purple" },
        ].map((stat, idx) => (
          <Card key={idx} className={isDark ? "bg-white/5 border-white/10" : ""}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-${stat.color}-500/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={isDark ? "bg-white/5 border-white/10" : ""}>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full mx-auto mb-4" /><p className="text-gray-500">Loading...</p></div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className={`text-lg mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>No documents yet</p>
              <Button icon={Plus} onClick={() => setShowModal(true)}>Add Document</Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className={`${isDark ? "bg-white/5" : "bg-gray-50"} border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
                <tr>{["Title", "Category", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className={`border-b ${isDark ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"}`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{doc.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{doc.category}</td>
                    <td className="px-4 py-3"><Badge className={doc.status === "published" ? "bg-green-500" : doc.status === "draft" ? "bg-amber-500" : "bg-gray-500"}>{doc.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingDoc(doc); setFormData({ title: doc.title, category: doc.category, content: doc.content, status: doc.status }); setShowModal(true); }} className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className={`w-full max-w-md mx-4 ${isDark ? "bg-[#0d1525] border-white/10" : ""}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{editingDoc ? "Edit" : "Add"} Document</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-300"}`} />
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-300"}`}>
                  <option value="invoice">Invoice</option>
                  <option value="contract">Contract</option>
                  <option value="report">Report</option>
                  <option value="other">Other</option>
                </select>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-300"}`}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <textarea placeholder="Content (JSON or notes)" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-300"}`} />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingDoc ? "Update" : "Add"}</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
