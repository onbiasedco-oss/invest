import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BarChart3, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Get the redirect path from location state, default to /home
  const from = (location.state as any)?.from?.pathname || '/home';

  // Provide user-friendly error messages
  const getFriendlyError = (errorMessage: string): string => {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (lower.includes('user already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return 'The server is taking longer than expected. Please try again.';
    }
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await signup(email, password, fullName);
        navigate(from, { replace: true });
      } else {
        await login(email, password);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const message = err.message || 'Authentication failed';
      setError(getFriendlyError(message));
    }
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle forgot password submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    if (!isValidEmail(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Reset the forgot password modal state when closing
  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setTimeout(() => {
      setResetEmail('');
      setResetError('');
      setResetSuccess(false);
    }, 200);
  };

  // Open forgot password modal with current email pre-filled
  const handleOpenForgotPassword = () => {
    setResetEmail(email);
    setResetError('');
    setResetSuccess(false);
    setShowForgotPassword(true);
  };

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
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">
            {isSignUp 
              ? 'Start your investment journey today' 
              : 'Sign in to access your dashboard'}
          </p>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl text-red-400 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isSignUp && (
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
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-medium text-slate-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
              {isSignUp && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm sm:text-base font-medium rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-slate-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
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
              Start Building Your Financial Future
            </h2>
            <p className="text-slate-300 text-lg">
              Access expert analysis, comprehensive courses, and real-time market insights to make informed investment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={handleCloseForgotPassword}>
        <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              {resetSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Check Your Email
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-cyan-400" />
                  Reset Password
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {resetSuccess
                ? "We've sent you a password reset link. Please check your inbox and spam folder."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium text-sm">Email Sent Successfully</p>
                    <p className="text-slate-400 text-sm mt-1">
                      A password reset link has been sent to <span className="text-white font-medium">{resetEmail}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-slate-400 space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseForgotPassword}
                  className="flex-1 px-4 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => {
                    setResetSuccess(false);
                    setResetEmail('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-xl hover:bg-cyan-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
              {resetError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    disabled={resetLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForgotPassword}
                  disabled={resetLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
