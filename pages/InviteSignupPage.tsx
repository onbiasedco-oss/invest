import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  PartyPopper,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface InvitationData {
  id: string;
  email: string;
  status: string;
  expires_at: string;
}

const InviteSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { signup, isLoading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    if (!token) {
      setValidationError('Invalid invitation link');
      setIsValidating(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, status, expires_at')
        .eq('token', token)
        .single();

      if (error || !data) {
        setValidationError('This invitation link is invalid or has expired');
        setIsValidating(false);
        return;
      }

      // Check if invitation is still pending
      if (data.status !== 'pending') {
        setValidationError('This invitation has already been used');
        setIsValidating(false);
        return;
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setValidationError('This invitation has expired');
        setIsValidating(false);
        return;
      }

      setInvitation(data);
      setIsValidating(false);
    } catch (err) {
      console.error('Error validating invitation:', err);
      setValidationError('Failed to validate invitation');
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!invitation) {
      setError('Invalid invitation');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the user account - the signup function in AuthContext
      // automatically registers the user in verified_users via edge function
      await signup(invitation.email, password, fullName);

      // Update invitation status to accepted
      await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      setSignupSuccess(true);

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 2000);

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid invitation
  if (validationError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-slate-400 mb-6">{validationError}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to The Club!</h1>
          <p className="text-slate-400 mb-4">Your account has been created successfully.</p>
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">
              The <span className="text-cyan-400">Club</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            You're Invited!
          </h1>
          <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">
            Complete your registration to join The Club
          </p>

          {/* Invitation Info */}
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-400 font-medium text-sm">Valid Invitation</p>
                <p className="text-slate-400 text-xs mt-1">
                  You've been invited to join with the email: <span className="text-white font-medium">{invitation?.email}</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl text-red-400 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email (readonly) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="email"
                  value={invitation?.email || ''}
                  readOnly
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-slate-400 text-sm sm:text-base cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                This email is linked to your invitation
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                  minLength={6}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Password must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm sm:text-base font-medium rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766367427775_8c819222.jpg"
          alt="Investment background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to The Club
            </h2>
            <p className="text-slate-300 text-lg">
              You've been personally invited to join our exclusive investment community. Complete your registration to access expert analysis, courses, and real-time market insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteSignupPage;
