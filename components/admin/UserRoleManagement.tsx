import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldOff,
  Ban,
  UserCheck,
  Search,
  X,
  AlertTriangle,
  Clock,
  GraduationCap,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string;
  last_login: string;
  courses_completed: number;
  created_at: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'promote' | 'demote' | 'ban' | 'unban' | 'delete';
  user: UserData | null;
  reason?: string;
}

const UserRoleManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'banned'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    isOpen: false,
    type: 'promote',
    user: null
  });
  const [banReason, setBanReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUsers(data as UserData[]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterRole === 'all' ||
      (filterRole === 'admin' && user.is_admin) ||
      (filterRole === 'user' && !user.is_admin && !user.is_banned) ||
      (filterRole === 'banned' && user.is_banned);

    return matchesSearch && matchesFilter;
  });

  const openConfirmation = (type: ConfirmationDialog['type'], user: UserData) => {
    setConfirmation({ isOpen: true, type, user });
    setBanReason('');
  };

  const closeConfirmation = () => {
    setConfirmation({ isOpen: false, type: 'promote', user: null });
    setBanReason('');
  };

  const handleConfirmAction = async () => {
    if (!confirmation.user) return;
    
    setSubmitting(true);
    try {
      const userId = confirmation.user.id;
      
      switch (confirmation.type) {
        case 'promote':
          await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', userId);
          break;
        case 'demote':
          await supabase
            .from('users')
            .update({ is_admin: false })
            .eq('id', userId);
          break;
        case 'ban':
          await supabase
            .from('users')
            .update({ is_banned: true, ban_reason: banReason || 'No reason provided' })
            .eq('id', userId);
          break;
        case 'unban':
          await supabase
            .from('users')
            .update({ is_banned: false, ban_reason: null })
            .eq('id', userId);
          break;
        case 'delete':
          // Delete user from related tables first
          await supabase.from('verified_users').delete().eq('email', confirmation.user.email);
          await supabase.from('user_roles').delete().eq('user_id', userId);
          // Delete user from users table
          await supabase.from('users').delete().eq('id', userId);
          break;
      }
      
      await fetchUsers();
      closeConfirmation();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfirmationMessage = () => {
    if (!confirmation.user) return '';
    const name = confirmation.user.full_name || confirmation.user.email;
    
    switch (confirmation.type) {
      case 'promote':
        return `Are you sure you want to promote "${name}" to admin? They will have full access to the admin dashboard.`;
      case 'demote':
        return `Are you sure you want to revoke admin privileges from "${name}"? They will lose access to the admin dashboard.`;
      case 'ban':
        return `Are you sure you want to ban "${name}"? They will not be able to access the platform.`;
      case 'unban':
        return `Are you sure you want to unban "${name}"? They will regain access to the platform.`;
      case 'delete':
        return `Are you sure you want to permanently delete "${name}"? This action cannot be undone and will remove all their data from the system.`;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        
        <div className="flex bg-slate-800 rounded-xl p-1">
          {(['all', 'admin', 'user', 'banned'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterRole(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filterRole === filter
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          onClick={fetchUsers}
          className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-slate-400 text-sm">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.is_admin).length}</p>
              <p className="text-slate-400 text-sm">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => !u.is_admin && !u.is_banned).length}</p>
              <p className="text-slate-400 text-sm">Regular Users</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Ban className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.is_banned).length}</p>
              <p className="text-slate-400 text-sm">Banned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Joined</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.full_name || 'Unknown'}</p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">User</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          <Ban className="w-3 h-3" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                          <UserCheck className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                          title="View details"
                        >
                          {expandedUser === user.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        {!user.is_admin ? (
                          <button
                            onClick={() => openConfirmation('promote', user)}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                            title="Promote to admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmation('demote', user)}
                            className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-all"
                            title="Revoke admin"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!user.is_banned ? (
                          <button
                            onClick={() => openConfirmation('ban', user)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Ban user"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmation('unban', user)}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Unban user"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete User Button */}
                        <button
                          onClick={() => openConfirmation('delete', user)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded User Details */}
                  {expandedUser === user.id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-slate-900/30">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="text-slate-400 text-xs">Last Login</p>
                              <p className="text-white text-sm">{formatDate(user.last_login)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                            <GraduationCap className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-slate-400 text-xs">Courses Completed</p>
                              <p className="text-white text-sm">{user.courses_completed || 0}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                            <div>
                              <p className="text-slate-400 text-xs">Member Since</p>
                              <p className="text-white text-sm">{formatDate(user.created_at)}</p>
                            </div>
                          </div>
                          {user.is_banned && user.ban_reason && (
                            <div className="md:col-span-3 flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-red-400 text-xs font-medium">Ban Reason</p>
                                <p className="text-white text-sm">{user.ban_reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                confirmation.type === 'ban' || confirmation.type === 'delete' ? 'bg-red-500/20' :
                confirmation.type === 'unban' ? 'bg-emerald-500/20' :
                confirmation.type === 'promote' ? 'bg-amber-500/20' :
                'bg-slate-700'
              }`}>
                {confirmation.type === 'ban' && <Ban className="w-6 h-6 text-red-400" />}
                {confirmation.type === 'unban' && <UserCheck className="w-6 h-6 text-emerald-400" />}
                {confirmation.type === 'promote' && <Shield className="w-6 h-6 text-amber-400" />}
                {confirmation.type === 'demote' && <ShieldOff className="w-6 h-6 text-slate-400" />}
                {confirmation.type === 'delete' && <Trash2 className="w-6 h-6 text-red-400" />}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {confirmation.type === 'promote' && 'Promote to Admin'}
                {confirmation.type === 'demote' && 'Revoke Admin'}
                {confirmation.type === 'ban' && 'Ban User'}
                {confirmation.type === 'unban' && 'Unban User'}
                {confirmation.type === 'delete' && 'Delete User'}
              </h3>
            </div>

            <p className="text-slate-300 mb-4">{getConfirmationMessage()}</p>

            {confirmation.type === 'ban' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for ban (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            )}

            {confirmation.type === 'delete' && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">
                    Warning: This will permanently delete the user and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeConfirmation}
                className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-all disabled:opacity-50 ${
                  confirmation.type === 'ban' || confirmation.type === 'delete'
                    ? 'bg-red-500 hover:bg-red-600' 
                    : confirmation.type === 'unban'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg'
                }`}
              >
                {submitting ? 'Processing...' : confirmation.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManagement;
