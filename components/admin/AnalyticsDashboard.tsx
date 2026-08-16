import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  Download,
  Calendar,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  popularCourses: { id: string; title: string; enrollments: number }[];
  resourceEngagement: { category: string; views: number }[];
  storyViews: { id: string; title: string; views: number }[];
  userActivity: { date: string; activeUsers: number }[];
  totalUsers: number;
  newUsersThisMonth: number;
  totalCourseEnrollments: number;
  totalStoryViews: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    popularCourses: [],
    resourceEngagement: [],
    storyViews: [],
    userActivity: [],
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalCourseEnrollments: 0,
    totalStoryViews: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setDate(now.getDate() - 30));
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = getDateRangeStart().toISOString();

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      // Fetch new users this month
      const monthStart = new Date();
      monthStart.setDate(1);
      const { count: newUsersThisMonth } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      // Fetch user growth data
      const { data: usersData } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      // Group users by date
      const userGrowth = groupByDate(usersData || [], 'created_at');

      // Fetch courses with enrollment counts
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title');

      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('course_id');

      const enrollmentCounts: Record<string, number> = {};
      (enrollmentsData || []).forEach((e: any) => {
        enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
      });

      const popularCourses = (coursesData || [])
        .map((c: any) => ({
          id: c.id,
          title: c.title,
          enrollments: enrollmentCounts[c.id] || 0
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5);

      // Fetch resource engagement
      const { data: resourceViewsData } = await supabase
        .from('resource_views')
        .select('resource_id')
        .gte('viewed_at', startDate);

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, category');

      const resourceCategoryCounts: Record<string, number> = {};
      (resourceViewsData || []).forEach((rv: any) => {
        const resource = (resourcesData || []).find((r: any) => r.id === rv.resource_id);
        if (resource) {
          resourceCategoryCounts[resource.category] = (resourceCategoryCounts[resource.category] || 0) + 1;
        }
      });

      const resourceEngagement = Object.entries(resourceCategoryCounts).map(([category, views]) => ({
        category,
        views
      }));

      // Fetch story views
      const { data: storyViewsData } = await supabase
        .from('story_views')
        .select('story_id')
        .gte('viewed_at', startDate);

      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, title');

      const storyViewCounts: Record<string, number> = {};
      (storyViewsData || []).forEach((sv: any) => {
        storyViewCounts[sv.story_id] = (storyViewCounts[sv.story_id] || 0) + 1;
      });

      const storyViews = (storiesData || [])
        .map((s: any) => ({
          id: s.id,
          title: s.title,
          views: storyViewCounts[s.id] || 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Calculate totals
      const totalCourseEnrollments = (enrollmentsData || []).length;
      const totalStoryViews = (storyViewsData || []).length;

      setAnalytics({
        userGrowth,
        popularCourses,
        resourceEngagement: resourceEngagement.length > 0 ? resourceEngagement : [
          { category: 'Videos', views: 0 },
          { category: 'Books', views: 0 },
          { category: 'Tools', views: 0 }
        ],
        storyViews,
        userActivity: userGrowth,
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalCourseEnrollments,
        totalStoryViews
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (data: any[], dateField: string) => {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      const date = new Date(item[dateField]).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      metrics: {
        totalUsers: analytics.totalUsers,
        newUsersThisMonth: analytics.newUsersThisMonth,
        totalCourseEnrollments: analytics.totalCourseEnrollments,
        totalStoryViews: analytics.totalStoryViews
      },
      userGrowth: analytics.userGrowth,
      popularCourses: analytics.popularCourses,
      resourceEngagement: analytics.resourceEngagement,
      topStories: analytics.storyViews
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let csv = 'Metric,Value\n';
    csv += `Total Users,${analytics.totalUsers}\n`;
    csv += `New Users This Month,${analytics.newUsersThisMonth}\n`;
    csv += `Total Course Enrollments,${analytics.totalCourseEnrollments}\n`;
    csv += `Total Story Views,${analytics.totalStoryViews}\n\n`;
    
    csv += 'Popular Courses\nTitle,Enrollments\n';
    analytics.popularCourses.forEach(c => {
      csv += `"${c.title}",${c.enrollments}\n`;
    });

    csv += '\nResource Engagement\nCategory,Views\n';
    analytics.resourceEngagement.forEach(r => {
      csv += `${r.category},${r.views}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxUserGrowth = Math.max(...analytics.userGrowth.map(d => d.count), 1);
  const maxEnrollments = Math.max(...analytics.popularCourses.map(c => c.enrollments), 1);
  const maxResourceViews = Math.max(...analytics.resourceEngagement.map(r => r.views), 1);
  const maxStoryViews = Math.max(...analytics.storyViews.map(s => s.views), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex bg-slate-800 rounded-xl p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{analytics.newUsersThisMonth}</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analytics.totalUsers}</h3>
          <p className="text-slate-400 text-sm">Total Users</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <GraduationCap className="w-6 h-6 text-purple-400" />
            </div>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analytics.totalCourseEnrollments}</h3>
          <p className="text-slate-400 text-sm">Course Enrollments</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Eye className="w-6 h-6 text-amber-400" />
            </div>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{analytics.totalStoryViews}</h3>
          <p className="text-slate-400 text-sm">Story Views</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">
            {analytics.resourceEngagement.reduce((sum, r) => sum + r.views, 0)}
          </h3>
          <p className="text-slate-400 text-sm">Resource Views</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">User Growth</h3>
          </div>
          
          {analytics.userGrowth.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-end gap-1 h-40">
                {analytics.userGrowth.slice(-14).map((day, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-sm transition-all hover:from-cyan-400 hover:to-cyan-300"
                    style={{ height: `${(day.count / maxUserGrowth) * 100}%`, minHeight: '4px' }}
                    title={`${day.date}: ${day.count} users`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{analytics.userGrowth[0]?.date}</span>
                <span>{analytics.userGrowth[analytics.userGrowth.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-500">
              No user growth data available
            </div>
          )}
        </div>

        {/* Resource Engagement */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Resource Engagement</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.resourceEngagement.map((resource, i) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500'];
              return (
                <div key={resource.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{resource.category}</span>
                    <span className="text-slate-400">{resource.views} views</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
                      style={{ width: `${maxResourceViews > 0 ? (resource.views / maxResourceViews) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Content Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Courses */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Popular Courses</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.popularCourses.length > 0 ? (
              analytics.popularCourses.map((course, i) => (
                <div key={course.id} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded-full text-xs text-slate-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{course.title}</p>
                    <div className="h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(course.enrollments / maxEnrollments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm">{course.enrollments}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No course data available</p>
            )}
          </div>
        </div>

        {/* Top Stories */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Stories</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.storyViews.length > 0 ? (
              analytics.storyViews.map((story, i) => (
                <div key={story.id} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded-full text-xs text-slate-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{story.title}</p>
                    <div className="h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(story.views / maxStoryViews) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Eye className="w-3 h-3" />
                    {story.views}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No story view data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
