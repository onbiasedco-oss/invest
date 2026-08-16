import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Eye, 
  LogIn, 
  MousePointer, 
  FileText,
  TrendingUp,
  GraduationCap,
  Search,
  Clock,
  Users,
  RefreshCw,
  Filter,
  Calendar,
  Globe,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UserActivity {
  id: string;
  user_id: string;
  user_email: string;
  action_type: string;
  action_details: any;
  page_url: string;
  created_at: string;
}

interface ActivityStats {
  totalActions: number;
  uniqueUsers: number;
  pageViews: number;
  logins: number;
  stockViews: number;
  courseViews: number;
}

const UserActivityDashboard: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalActions: 0,
    uniqueUsers: 0,
    pageViews: 0,
    logins: 0,
    stockViews: 0,
    courseViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  useEffect(() => {
    fetchActivities();
  }, [filter, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('user_activity')
        .select('*')
        .gte('created_at', getDateFilter())
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action_type', filter);
      }

      const { data, error } = await query;

      if (data && !error) {
        setActivities(data);
        
        // Calculate stats
        const uniqueUserIds = new Set(data.map(a => a.user_id).filter(Boolean));
        const pageViews = data.filter(a => a.action_type === 'page_view').length;
        const logins = data.filter(a => a.action_type === 'login').length;
        const stockViews = data.filter(a => a.action_type === 'stock_view').length;
        const courseViews = data.filter(a => a.action_type === 'course_view').length;

        setStats({
          totalActions: data.length,
          uniqueUsers: uniqueUserIds.size,
          pageViews,
          logins,
          stockViews,
          courseViews
        });
      }
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'page_view':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'login':
        return <LogIn className="w-4 h-4 text-emerald-400" />;
      case 'stock_view':
        return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'course_view':
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-amber-400" />;
      case 'click':
        return <MousePointer className="w-4 h-4 text-pink-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'page_view':
        return 'bg-blue-500/20 text-blue-400';
      case 'login':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'stock_view':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'course_view':
        return 'bg-purple-500/20 text-purple-400';
      case 'search':
        return 'bg-amber-500/20 text-amber-400';
      case 'click':
        return 'bg-pink-500/20 text-pink-400';
      default:
        return 'bg-slate-700 text-slate-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statCards = [
    { label: 'Total Actions', value: stats.totalActions, icon: Activity, color: 'cyan' },
    { label: 'Unique Users', value: stats.uniqueUsers, icon: Users, color: 'emerald' },
    { label: 'Page Views', value: stats.pageViews, icon: Eye, color: 'blue' },
    { label: 'Logins', value: stats.logins, icon: LogIn, color: 'purple' },
    { label: 'Stock Views', value: stats.stockViews, icon: TrendingUp, color: 'amber' },
    { label: 'Course Views', value: stats.courseViews, icon: GraduationCap, color: 'pink' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">User Activity</h2>
          <p className="text-slate-400 text-sm">Track user interactions and engagement on the platform</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className={`p-2 rounded-lg bg-${stat.color}-500/20 w-fit mb-2`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Actions</option>
            <option value="page_view">Page Views</option>
            <option value="login">Logins</option>
            <option value="stock_view">Stock Views</option>
            <option value="course_view">Course Views</option>
            <option value="search">Searches</option>
            <option value="click">Clicks</option>
          </select>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getActionColor(activity.action_type)}`}>
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">
                        {activity.user_email || 'Anonymous'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getActionColor(activity.action_type)}`}>
                        {activity.action_type.replace('_', ' ')}
                      </span>
                    </div>
                    {activity.page_url && (
                      <p className="text-slate-400 text-xs mt-1 truncate flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {activity.page_url}
                      </p>
                    )}
                    {activity.action_details && (
                      <p className="text-slate-500 text-xs mt-1">
                        {typeof activity.action_details === 'object' 
                          ? JSON.stringify(activity.action_details).slice(0, 100)
                          : activity.action_details
                        }
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity recorded yet</p>
              <p className="text-sm mt-1">User actions will appear here as they interact with the platform</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActivityDashboard;
