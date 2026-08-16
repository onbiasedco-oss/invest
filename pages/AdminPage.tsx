import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  BarChart3, 
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  X,
  UserCheck,
  TrendingUp,
  Video,
  Wrench,
  Save,
  Pencil,
  PieChart,
  Settings,
  Mail,
  Send,
  Copy,
  Check,
  Clock,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Sparkles,
  Activity,
  FileText
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import UserRoleManagement from '@/components/admin/UserRoleManagement';
import WeeklyStocksManagement from '@/components/admin/WeeklyStocksManagement';
import UserActivityDashboard from '@/components/admin/UserActivityDashboard';
import AboutPageEditor from '@/components/admin/AboutPageEditor';

interface Invitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}



const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const [stats, setStats] = useState({
    users: 0,
    verifiedUsers: 0,
    stories: 0,
    stocks: 0,
    courses: 0,
    resources: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);
  const [modalType, setModalType] = useState<'verified' | 'course' | 'resource'>('verified');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Invite user state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ link: string; email: string } | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    image_url: '',
    is_published: true
  });

  const [editCourseForm, setEditCourseForm] = useState({
    id: '',
    title: '',
    description: '',
    image_url: '',
    is_published: true
  });

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'Videos',
    url: ''
  });

  const [editResourceForm, setEditResourceForm] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Videos',
    url: ''
  });

  // Fallback admin check based on email
  const isAdmin = user?.is_admin === true || user?.email === 'naccitheceo@gmail.com';

  // Sync tab with URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
      const fetchCount = async (table: string): Promise<number> => {
        try {
          const query = supabase.from(table);
          if (query && typeof query.select === 'function') {
            const { count, error } = await query.select('id', { count: 'exact', head: true });
            if (!error && count !== null) return count;
          }
        } catch (e) {
          console.warn(`Failed to fetch count for ${table}:`, e);
        }
        return 0;
      };

      const [usersCount, verifiedCount, storiesCount, stocksCount, coursesCount, resourcesCount] = await Promise.all([
        fetchCount('users'),
        fetchCount('verified_users'),
        fetchCount('stories'),
        fetchCount('stocks'),
        fetchCount('courses'),
        fetchCount('resources'),
      ]);

      setStats({
        users: usersCount,
        verifiedUsers: verifiedCount,
        stories: storiesCount,
        stocks: stocksCount,
        courses: coursesCount,
        resources: resourcesCount
      });

      // Fetch users
      try {
        const { data: usersData, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (usersData && !error) setUsers(usersData);
      } catch (e) {
        console.warn('Failed to fetch users:', e);
      }

      // Fetch verified users
      try {
        const { data: verifiedData, error } = await supabase
          .from('verified_users')
          .select('*')
          .order('created_at', { ascending: false });
        if (verifiedData && !error) setVerifiedUsers(verifiedData);
      } catch (e) {
        console.warn('Failed to fetch verified users:', e);
      }

      // Fetch invitations
      try {
        const { data: invitationsData, error } = await supabase
          .from('invitations')
          .select('*')
          .order('created_at', { ascending: false });
        if (invitationsData && !error) setInvitations(invitationsData);
      } catch (e) {
        console.warn('Failed to fetch invitations:', e);
      }

      // Fetch courses
      try {
        const { data: coursesData, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
        if (coursesData && !error) setCourses(coursesData);
      } catch (e) {
        console.warn('Failed to fetch courses:', e);
      }

      // Fetch resources
      try {
        const { data: resourcesData, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });
        if (resourcesData && !error) setResources(resourcesData);
      } catch (e) {
        console.warn('Failed to fetch resources:', e);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVerifiedUser = async () => {
    if (!newEmail.trim()) {
      setErrorMessage('Please enter an email address');
      return;
    }
    
    if (!isAdmin) {
      setErrorMessage('You do not have permission to add verified users.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const emailToAdd = newEmail.trim().toLowerCase();
      console.log('Adding verified user via edge function:', emailToAdd);
      
      // Get current session to ensure we have a valid token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        setErrorMessage('Session expired. Please refresh the page and try again.');
        return;
      }
      
      console.log('Session token available, length:', sessionData.session.access_token.length);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'add_verified_user',
          data: {
            email: emailToAdd,
            notes: null
          }
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        // Try to get more details from the error
        const errorMsg = error.message || 'Failed to add verified user';
        setErrorMessage(errorMsg);
        return;
      }

      if (!data?.success) {
        console.error('Operation failed:', data?.error);
        setErrorMessage(data?.error || 'Failed to add verified user');
        return;
      }
      
      console.log('Successfully added verified user:', data.data);
      setNewEmail('');
      setShowAddModal(false);
      setErrorMessage('');
      fetchAdminData();
    } catch (error: any) {
      console.error('Error adding verified user:', error);
      setErrorMessage(error.message || 'Failed to add verified user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };













  // Invite user function
  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: inviteEmail.trim(),
          invitedBy: user?.id,
          baseUrl: window.location.origin
        }
      });

      if (error) throw error;

      if (data.error) {
        setInviteError(data.error);
        return;
      }

      setInviteSuccess({
        link: data.inviteLink,
        email: data.email
      });

      fetchAdminData();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteSuccess?.link) {
      await navigator.clipboard.writeText(inviteSuccess.link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess(null);
    setCopiedLink(false);
  };

  const deleteInvitation = async (id: string) => {
    try {
      await supabase.from('invitations').delete().eq('id', id);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting invitation:', error);
    }
  };

  const addCourse = async () => {
    if (!courseForm.title) return;
    
    setSubmitting(true);
    try {
      await supabase.from('courses').insert({
        ...courseForm,
        sort_order: courses.length + 1
      });
      setCourseForm({ title: '', description: '', image_url: '', is_published: true });
      setShowAddModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error adding course:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateCourse = async () => {
    if (!editCourseForm.id || !editCourseForm.title) return;
    
    setSubmitting(true);
    try {
      const { id, ...updateData } = editCourseForm;
      await supabase.from('courses').update(updateData).eq('id', id);
      setEditCourseForm({ id: '', title: '', description: '', image_url: '', is_published: true });
      setShowEditCourseModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCourseModal = (course: any) => {
    setEditCourseForm({
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      image_url: course.image_url || '',
      is_published: course.is_published ?? true
    });
    setShowEditCourseModal(true);
  };

  const addResource = async () => {
    if (!resourceForm.title || !resourceForm.url) return;
    
    setSubmitting(true);
    try {
      await supabase.from('resources').insert(resourceForm);
      setResourceForm({ title: '', description: '', category: 'Videos', url: '' });
      setShowAddModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error adding resource:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateResource = async () => {
    if (!editResourceForm.id || !editResourceForm.title || !editResourceForm.url) return;
    
    setSubmitting(true);
    try {
      const { id, ...updateData } = editResourceForm;
      await supabase.from('resources').update(updateData).eq('id', id);
      setEditResourceForm({ id: '', title: '', description: '', category: 'Videos', url: '' });
      setShowEditResourceModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating resource:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditResourceModal = (resource: any) => {
    setEditResourceForm({
      id: resource.id,
      title: resource.title || '',
      description: resource.description || '',
      category: resource.category || 'Videos',
      url: resource.url || ''
    });
    setShowEditResourceModal(true);
  };

  const removeVerifiedUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this verified user?')) return;
    
    try {
      console.log('Removing verified user via edge function:', id);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_verified_user',
          data: { id }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        alert('Failed to remove verified user: ' + error.message);
        return;
      }

      if (!data.success) {
        console.error('Operation failed:', data.error);
        alert('Failed to remove verified user: ' + data.error);
        return;
      }

      fetchAdminData();
    } catch (error: any) {
      console.error('Error removing verified user:', error);
      alert('Failed to remove verified user: ' + (error.message || 'Unknown error'));
    }
  };


  // Delete user from users table
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete this user? This action cannot be undone and will remove all their data.`)) return;
    
    try {
      // Delete user from related tables first
      await supabase.from('verified_users').delete().eq('email', userEmail);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('invitations').delete().eq('email', userEmail);
      // Delete user from users table
      await supabase.from('users').delete().eq('id', userId);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };


  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await supabase.from('courses').delete().eq('id', id);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const deleteCourseFromModal = async () => {
    if (!editCourseForm.id) return;
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await supabase.from('courses').delete().eq('id', editCourseForm.id);
      setShowEditCourseModal(false);
      setEditCourseForm({ id: '', title: '', description: '', image_url: '', is_published: true });
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await supabase.from('resources').delete().eq('id', id);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const deleteResourceFromModal = async () => {
    if (!editResourceForm.id) return;
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
    try {
      await supabase.from('resources').delete().eq('id', editResourceForm.id);
      setShowEditResourceModal(false);
      setEditResourceForm({ id: '', title: '', description: '', category: 'Videos', url: '' });
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const openAddModal = (type: 'verified' | 'course' | 'resource') => {
    setModalType(type);
    setShowAddModal(true);
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.status === 'accepted') {
      return { label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400' };
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { label: 'Expired', color: 'bg-red-500/20 text-red-400' };
    }
    return { label: 'Pending', color: 'bg-amber-500/20 text-amber-400' };
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'weekly-picks', label: 'Weekly Picks', icon: Sparkles },
    { id: 'user-activity', label: 'User Activity', icon: Activity },
    { id: 'user-roles', label: 'User Roles', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verified', label: 'Verified Users', icon: UserCheck },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'about-page', label: 'About Page', icon: FileText },
  ];



  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'cyan' },
    { label: 'Verified Users', value: stats.verifiedUsers, icon: UserCheck, color: 'emerald' },
    { label: 'Stocks', value: stats.stocks, icon: TrendingUp, color: 'amber' },
    { label: 'Courses', value: stats.courses, icon: GraduationCap, color: 'blue' },
    { label: 'Resources', value: stats.resources, icon: BookOpen, color: 'pink' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400">Manage users, content, and settings</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/20`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <h3 className="text-slate-400">{stat.label}</h3>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {/* Weekly Picks Tab */}
        {activeTab === 'weekly-picks' && <WeeklyStocksManagement />}

        {/* User Activity Tab */}
        {activeTab === 'user-activity' && <UserActivityDashboard />}

        {/* User Roles Tab */}
        {activeTab === 'user-roles' && <UserRoleManagement />}


        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Joined</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <Users className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <span className="text-white font-medium">{u.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{u.email}</td>
                      <td className="px-6 py-4">
                        {u.is_admin ? (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Admin</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Verified Users Tab */}
        {activeTab === 'verified' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Send className="w-4 h-4" />
                Invite User
              </button>
              <button
                onClick={() => openAddModal('verified')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Email
              </button>
            </div>

            {/* Verified Users Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Verified Users</h3>
                <p className="text-sm text-slate-400">Users who can access the platform</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Added</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {verifiedUsers.map((vu) => (
                      <tr key={vu.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4 text-white">{vu.email}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(vu.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => removeVerifiedUser(vu.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {verifiedUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          No verified users yet. Add your first verified email or send an invitation!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white">Invitations</h3>
                  <p className="text-sm text-slate-400">Pending and past invitations</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Expires</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {invitations.map((inv) => {
                        const status = getInvitationStatus(inv);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-700/30">
                            <td className="px-6 py-4 text-white">{inv.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(inv.expires_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteInvitation(inv.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => openAddModal('course')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
                >
                  <img
                    src={course.image_url || 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374378127_dc649748.png'}
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2">{course.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${course.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCourseModal(course)}
                          className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  No courses yet. Add your first course!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => openAddModal('resource')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>

            <div className="space-y-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                >
                  <div className={`p-3 rounded-xl ${
                    resource.category === 'Videos' ? 'bg-red-500/20' :
                    resource.category === 'Books' ? 'bg-blue-500/20' :
                    'bg-green-500/20'
                  }`}>
                    {resource.category === 'Videos' ? <Video className="w-5 h-5 text-red-400" /> :
                     resource.category === 'Books' ? <BookOpen className="w-5 h-5 text-blue-400" /> :
                     <Wrench className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{resource.title}</h3>
                    <p className="text-slate-400 text-sm truncate">{resource.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                    {resource.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditResourceModal(resource)}
                      className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteResource(resource.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {resources.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No resources yet. Add your first resource!
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Page Tab */}
        {activeTab === 'about-page' && <AboutPageEditor />}
      </div>


      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Send className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Invite User</h3>
              </div>
              <button
                onClick={closeInviteModal}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-400 font-medium">Invitation Created!</p>
                      <p className="text-slate-400 text-sm mt-1">
                        Share this link with <span className="text-white">{inviteSuccess.email}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invitation Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteSuccess.link}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className={`px-4 py-3 rounded-xl transition-all flex items-center gap-2 ${
                        copiedLink 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>This invitation expires in 7 days</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setInviteSuccess(null);
                      setInviteEmail('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Invite Another
                  </button>
                  <button
                    onClick={closeInviteModal}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Send an invitation link to a new user. When they sign up using this link, they'll be automatically added to the verified users list.
                </p>

                {inviteError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      disabled={inviteLoading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeInviteModal}
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteUser}
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {modalType === 'verified' && 'Add Verified User'}
                {modalType === 'course' && 'Add New Course'}
                {modalType === 'resource' && 'Add New Resource'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'verified' && (
              <div className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setErrorMessage('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addVerifiedUser}
                    disabled={submitting || !newEmail.trim()}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </div>
            )}

            {modalType === 'course' && (
              <div className="space-y-4">
                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Course title"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Course description"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={courseForm.image_url}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={courseForm.is_published}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="published" className="text-sm text-slate-300">Publish immediately</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCourse}
                    disabled={submitting || !courseForm.title}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Course'}
                  </button>
                </div>
              </div>
            )}


            {modalType === 'resource' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Resource description"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL *</label>
                  <input
                    type="text"
                    value={resourceForm.url}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/resource"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Videos">Videos</option>
                    <option value="Books">Books</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addResource}
                    disabled={submitting || !resourceForm.title || !resourceForm.url}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Resource'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Course</h3>
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={editCourseForm.title}
                  onChange={(e) => setEditCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Course title"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={editCourseForm.description}
                  onChange={(e) => setEditCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                <input
                  type="text"
                  value={editCourseForm.image_url}
                  onChange={(e) => setEditCourseForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-published"
                  checked={editCourseForm.is_published}
                  onChange={(e) => setEditCourseForm(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="edit-published" className="text-sm text-slate-300">Published</label>
              </div>


              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditCourseModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateCourse}
                    disabled={submitting || !editCourseForm.title}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <button
                  onClick={deleteCourseFromModal}
                  className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {showEditResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Resource</h3>
              <button
                onClick={() => setShowEditResourceModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={editResourceForm.title}
                  onChange={(e) => setEditResourceForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={editResourceForm.description}
                  onChange={(e) => setEditResourceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Resource description"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">URL *</label>
                <input
                  type="text"
                  value={editResourceForm.url}
                  onChange={(e) => setEditResourceForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/resource"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={editResourceForm.category}
                  onChange={(e) => setEditResourceForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Videos">Videos</option>
                  <option value="Books">Books</option>
                  <option value="Tools">Tools</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditResourceModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateResource}
                    disabled={submitting || !editResourceForm.title || !editResourceForm.url}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                <button
                  onClick={deleteResourceFromModal}
                  className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Resource
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
