import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BarChart3, Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      try {
        // The reset link will automatically create a session
        // We need to check if there's an active session with a recovery type
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setIsValidToken(false);
        } else if (!session) {
          // Check URL for error parameters
          const errorParam = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (errorParam) {
            setError(errorDescription || 'Invalid or expired reset link');
            setIsValidToken(false);
          } else {
            // No session and no error - might be a direct visit
            setIsValidToken(false);
            setError('No valid reset session found. Please request a new password reset link.');
          }
        } else {
          // We have a valid session from the reset link
          setIsValidToken(true);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setIsValidToken(false);
        setError('Failed to verify reset link. Please try again.');
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkSession();

    // Listen for auth state changes (when user clicks the reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
        setIsCheckingToken(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  // Check if all password requirements are met
  const allRequirementsMet = passwordRequirements.every((req) => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password requirements
    if (!allRequirementsMet) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    // Validate password match
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
      
      // Sign out after password reset so user can log in with new password
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 1000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              The <span className="text-cyan-400">Club</span>
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
            <p className="text-slate-400 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Back to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              The <span className="text-cyan-400">Club</span>
            </span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Password Updated!</h1>
            <p className="text-slate-400 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">
            The <span className="text-cyan-400">Club</span>
          </span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
            <p className="text-slate-400 text-sm">
              Enter a strong password for your account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-slate-900/50 rounded-xl space-y-2">
              <p className="text-xs font-medium text-slate-400 mb-2">Password Requirements:</p>
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(password);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      password.length === 0
                        ? 'text-slate-500'
                        : isMet
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {password.length === 0 ? (
                      <div className="w-4 h-4 rounded-full border border-slate-600" />
                    ) : isMet ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {req.label}
                  </div>
                );
              })}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full pl-12 pr-12 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !allRequirementsMet || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Remember your password?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
