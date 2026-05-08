import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  FolderKanban,
  MessageSquare,
  FileText,
  BarChart3,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Client_Layout from '../Components/Client_Components/Client_Layout.jsx';
import { db, supabase } from '../../config/supabaseClient';

function Client_Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('Please log in to view your dashboard');
        return;
      }
      setUser(currentUser);

      // Load user's profile
      const { data: profile } = await db.getProfile(currentUser.id);

      // Load user's demo bookings
      const { data: bookings } = await supabase
        .from('demo_bookings')
        .select('*')
        .eq('email', currentUser.email)
        .order('created_at', { ascending: false });

      // Load user's projects (if any)
      const { data: projects } = await supabase
        .from('projects')
        .select('*, customers(name, email)')
        .eq('customer_id', profile?.id || currentUser.id)
        .order('created_at', { ascending: false });

      // Calculate stats
      const totalBookings = bookings?.length || 0;
      const upcomingBookings = bookings?.filter(
        b => b.status === 'approved' && new Date(`${b.preferred_date}T${b.preferred_time}`) > new Date()
      )?.length || 0;
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active')?.length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed')?.length || 0;

      setStats({
        totalBookings,
        upcomingBookings,
        totalProjects,
        activeProjects,
        completedProjects,
      });

      setRecentBookings(bookings?.slice(0, 5) || []);
      setRecentProjects(projects?.slice(0, 5) || []);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const clientModules = [
    {
      title: 'My Profile',
      layer: 'Profile',
      description: 'View and manage your account details and preferences.',
      path: '/ClientProfile',
      status: 'Active',
      color: '#4caf50',
      icon: Users,
      stat: 'View',
    },
    {
      title: 'My Bookings',
      layer: 'Meetings',
      description: `View your demo bookings (${stats.totalBookings} total, ${stats.upcomingBookings} upcoming)`,
      path: '/ClientDemoBookings',
      status: stats.totalBookings > 0 ? 'Active' : 'No Bookings',
      color: '#c9a84c',
      icon: CalendarDays,
      stat: stats.totalBookings,
    },
    {
      title: 'My Projects',
      layer: 'Delivery',
      description: `Track your projects (${stats.totalProjects} total, ${stats.activeProjects} active)`,
      path: '/ClientProjects',
      status: stats.totalProjects > 0 ? 'Active' : 'No Projects',
      color: '#2196f3',
      icon: FolderKanban,
      stat: stats.totalProjects,
    },
    {
      title: 'Chatbot Config',
      layer: 'Intelligence',
      description: 'Access your chatbot configuration and knowledge base.',
      path: '#',
      status: 'Coming Soon',
      color: '#9c27b0',
      icon: MessageSquare,
      stat: 'Soon',
    },
    {
      title: 'Documents',
      layer: 'Operations',
      description: 'View documentation and resources for your projects.',
      path: '#',
      status: 'Coming Soon',
      color: '#03a9f4',
      icon: FileText,
      stat: 'Soon',
    },
    {
      title: 'Analytics',
      layer: 'Reporting',
      description: 'View activity summaries and performance insights.',
      path: '#',
      status: 'Coming Soon',
      color: '#ff9800',
      icon: BarChart3,
      stat: 'Soon',
    },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatStatus = (status) => {
    const statusColors = {
      pending: '#ffa726',
      approved: '#4caf50',
      rejected: '#ff6b6b',
      completed: '#2196f3',
      cancelled: '#9e9e9e',
    };
    return statusColors[status] || '#9e9e9e';
  };

  if (loading) {
    return (
      <Client_Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-white/70">Loading your dashboard...</span>
        </div>
      </Client_Layout>
    );
  }

  if (error) {
    return (
      <Client_Layout>
        <div className="flex items-center justify-center h-96">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="ml-3 text-red-400">{error}</span>
        </div>
      </Client_Layout>
    );
  }

  return (
    <Client_Layout>
      {/* Welcome Section */}
      <div className="dashboard-welcome mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-white/60">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#c9a84c]" />
            </div>
            <span className="text-white/60 text-sm">Total Bookings</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
        </div>

        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#4caf50]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#4caf50]" />
            </div>
            <span className="text-white/60 text-sm">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.upcomingBookings}</div>
        </div>

        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#2196f3]/20 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-[#2196f3]" />
            </div>
            <span className="text-white/60 text-sm">Projects</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
        </div>

        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#ff9800]/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#ff9800]" />
            </div>
            <span className="text-white/60 text-sm">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.completedProjects}</div>
        </div>
      </div>

      {/* Module Cards */}
      <h2 className="text-xl font-semibold text-white mb-4">Quick Access</h2>
      <div className="dashboard-modules grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {clientModules.map((module) => {
          const Icon = module.icon;
          const isDisabled = module.status === 'Coming Soon';

          return (
            <Link
              key={module.title}
              to={isDisabled ? '#' : module.path}
              className={`module-card ${isDisabled ? 'disabled opacity-60' : ''} bg-[#0d1525] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all`}
              style={{ '--module-color': module.color }}
              onClick={(e) => isDisabled && e.preventDefault()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="module-icon w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${module.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: module.color }} />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                  {module.stat}
                </span>
              </div>

              <div className="module-content">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="module-title text-lg font-semibold text-white">{module.title}</h3>
                  <span className="text-xs text-white/40">{module.layer}</span>
                </div>

                <p className="module-description text-sm text-white/60 mb-3">{module.description}</p>

                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: formatStatus(module.status === 'Active' ? 'approved' : module.status === 'No Bookings' || module.status === 'No Projects' ? 'pending' : 'cancelled') }}
                  />
                  <span className="text-xs text-white/50">{module.status}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
            <Link to="/ClientDemoBookings" className="text-sm text-[#c9a84c] hover:underline">
              View All
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-white/50 text-sm">No bookings yet. Book a demo to get started!</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{booking.full_name}</p>
                    <p className="text-white/50 text-xs">{formatDate(booking.preferred_date)} at {booking.preferred_time}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full capitalize"
                    style={{ backgroundColor: `${formatStatus(booking.status)}20`, color: formatStatus(booking.status) }}
                  >
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-[#0d1525] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Projects</h3>
            <Link to="/ClientProjects" className="text-sm text-[#2196f3] hover:underline">
              View All
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-white/50 text-sm">No projects yet. Projects will appear here once assigned.</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{project.project_name}</p>
                    <p className="text-white/50 text-xs">{project.modules_included || 'No modules assigned'}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full capitalize"
                    style={{ backgroundColor: `${formatStatus(project.status)}20`, color: formatStatus(project.status) }}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Client_Layout>
  );
}

export default Client_Dashboard;
