import { useEffect, useState, useCallback } from 'react';
import Client_Layout from '../../Components/Client_Components/Client_Layout.jsx';
import { supabase } from '../../../config/supabaseClient';
import { Loader2, FolderKanban, Calendar, User, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function Client_Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('Please log in to view your projects');
        return;
      }
      setUser(currentUser);

      // Get user's profile to find customer_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      // Fetch user's projects
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*, customers(name, email)')
        .eq('customer_id', profile?.id || currentUser.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'not_started':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active':
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'not_started':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Client_Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-white/60">Track your project progress and details</p>
          </div>
          <button
            onClick={loadProjects}
            disabled={loading}
            className="px-4 py-2 bg-[#0d1525] border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#2196f3]" />
            <span className="ml-3 text-white/60">Loading your projects...</span>
          </div>
        )}

        {/* Projects List */}
        {!loading && projects.length === 0 && !error && (
          <div className="text-center py-20 bg-[#0d1525] border border-white/10 rounded-xl">
            <FolderKanban className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-white/50">Projects will appear here once assigned by your admin.</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#0d1525] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(project.status)}
                    <h3 className="text-lg font-semibold text-white">{project.project_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-white/30 font-mono">
                    #{project.id?.slice(0, 8)}
                  </div>
                </div>

                {/* Modules */}
                {project.modules_included && (
                  <div className="mb-4">
                    <p className="text-sm text-white/40 mb-2">Modules Included:</p>
                    <p className="text-white/70">{project.modules_included}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <User className="w-4 h-4 text-[#2196f3]" />
                    <span className="text-sm">{project.assigned_member || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <DollarSign className="w-4 h-4 text-[#2196f3]" />
                    <span className="text-sm">${project.sale_value || '0'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="w-4 h-4 text-[#2196f3]" />
                    <span className="text-sm">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-[#2196f3] h-2 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm">{project.progress || 0}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/50">Progress</span>
                    <span className="text-sm text-white/70">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#2196f3] to-[#42a5f5] h-2 rounded-full transition-all"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Notes */}
                {project.notes && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/40 mb-1">Notes:</p>
                    <p className="text-sm text-white/70">{project.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Client_Layout>
  );
}

export default Client_Projects;
