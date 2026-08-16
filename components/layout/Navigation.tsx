import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Shield,
  FileText,
  Newspaper,
  GitCompare,
  Filter,
  Trophy,
  Factory
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StockAlertNotifications from '@/components/ui/StockAlertNotifications';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);


  // Base nav links for all users (both logged in and logged out)
  const baseNavLinks = [
    { path: '/home', label: 'Home', shortLabel: 'Home', icon: Home },
    { path: '/industries', label: 'Industries', shortLabel: 'Industry', icon: Factory },
    { path: '/screener', label: 'Screener', shortLabel: 'Screen', icon: Filter },
    { path: '/compare', label: 'Compare', shortLabel: 'Compare', icon: GitCompare },
    { path: '/news', label: 'News', shortLabel: 'News', icon: Newspaper },
    { path: '/courses', label: 'Courses', shortLabel: 'Courses', icon: GraduationCap },
    { path: '/leaderboard', label: 'Leaderboard', shortLabel: 'Leaders', icon: Trophy },
    { path: '/resources', label: 'Resources', shortLabel: 'Resources', icon: FileText },
  ];

  // Build the complete nav links based on user role
  const getNavLinks = () => {
    const links = [...baseNavLinks];
    
    if (isAuthenticated && user) {
      if (user.is_admin) {
        // Admin users get Admin Dashboard tab
        links.push({ 
          path: '/admin', 
          label: 'Admin Dashboard', 
          shortLabel: 'Admin', 
          icon: Shield 
        });
      } else {
        // Regular users get User Dashboard tab
        links.push({ 
          path: '/dashboard', 
          label: 'User Dashboard', 
          shortLabel: 'Dashboard', 
          icon: LayoutDashboard 
        });
      }
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold text-white">
              The <span className="text-cyan-400">Club</span>
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  link.path === '/admin'
                    ? isActive(link.path)
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                    : isActive(link.path)
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-slate-800 transition-all"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || user.email}
                      className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full object-cover border-2 border-cyan-500/50"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-slate-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 sm:w-52 lg:w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                      <div className="p-3 border-b border-slate-700">
                        <p className="text-sm font-medium text-white truncate">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        {user.is_admin && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        {/* Dashboard Link - Role-specific */}
                        {user.is_admin ? (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        ) : (
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            User Dashboard
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>

                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-2.5 sm:px-3 lg:px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Tab Bar - Visible on screens smaller than lg */}
      <div className="lg:hidden border-t border-slate-800/50 bg-slate-900/98">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-1 py-1.5 min-w-max">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-center transition-all flex-shrink-0 min-w-[52px] sm:min-w-[60px] ${
                  link.path === '/admin'
                    ? isActive(link.path)
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                    : isActive(link.path)
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <link.icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight whitespace-nowrap">
                  {link.shortLabel}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
