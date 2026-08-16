import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Mail, ArrowLeft, Clock, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          Access Not Authorized
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-center mb-8">
          Your account is not on the verified users list. Access to NACCI Members Club is restricted to pre-approved members only.

        </p>

        {/* User Info Card */}
        {user && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <UserX className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.full_name || 'User'}</p>
                <p className="text-slate-400 text-sm truncate">{user.email}</p>
              </div>
              <div className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                Not Verified
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium text-sm">How to Get Access</p>
              <p className="text-slate-400 text-sm mt-1">
                Contact an administrator to have your email added to the verified users list. Once approved, you'll be able to access all features.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">Need Help?</p>
              <p className="text-slate-400 text-sm mt-1">
                If you believe this is an error or need assistance, please reach out to the administrator for support.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Sign Out
          </button>
          <button
            onClick={() => window.location.href = 'mailto:support@naccimembersclub.com?subject=Access Request'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"

          >
            <Mail className="w-4 h-4" />
            Contact Admin
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 text-xs mt-6">
          This is a members-only platform. Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
