import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  LogOut,
  Save,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  TrendingUp,
  Newspaper,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AlertPreferences {
  price_alert_enabled: boolean;
  price_threshold: number;
  news_alert_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  alert_frequency: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAlertPrefs, setLoadingAlertPrefs] = useState(false);
  const [savingAlertPrefs, setSavingAlertPrefs] = useState(false);
  const [alertPrefsSaved, setAlertPrefsSaved] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_updates: true,
    market_alerts: true,
    course_updates: true,
    weekly_digest: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    show_profile: true,
    show_watchlist: false,
    show_activity: true
  });

  // Stock Alert Preferences
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>({
    price_alert_enabled: true,
    price_threshold: 5,
    news_alert_enabled: true,
    email_notifications: true,
    push_notifications: false,
    alert_frequency: 'immediate',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });

  // Load alert preferences when tab is selected
  useEffect(() => {
    if (activeTab === 'stock-alerts' && user?.id) {
      loadAlertPreferences();
    }
  }, [activeTab, user?.id]);

  const loadAlertPreferences = async () => {
    if (!user?.id) return;
    
    setLoadingAlertPrefs(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-alerts', {
        body: { action: 'get_preferences', userId: user.id }
      });

      if (data?.preferences) {
        setAlertPreferences({
          price_alert_enabled: data.preferences.price_alert_enabled ?? true,
          price_threshold: data.preferences.price_threshold ?? 5,
          news_alert_enabled: data.preferences.news_alert_enabled ?? true,
          email_notifications: data.preferences.email_notifications ?? true,
          push_notifications: data.preferences.push_notifications ?? false,
          alert_frequency: data.preferences.alert_frequency ?? 'immediate',
          quiet_hours_start: data.preferences.quiet_hours_start ?? '22:00',
          quiet_hours_end: data.preferences.quiet_hours_end ?? '08:00'
        });
      }
    } catch (error) {
      console.error('Error loading alert preferences:', error);
    } finally {
      setLoadingAlertPrefs(false);
    }
  };

  const saveAlertPreferences = async () => {
    if (!user?.id) return;

    setSavingAlertPrefs(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-alerts', {
        body: { 
          action: 'update_preferences', 
          userId: user.id,
          preferences: alertPreferences
        }
      });

      if (data?.success) {
        setAlertPrefsSaved(true);
        setTimeout(() => setAlertPrefsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving alert preferences:', error);
    } finally {
      setSavingAlertPrefs(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: profileForm.full_name,
            avatar_url: profileForm.avatar_url
          })
          .eq('id', user.id);

        if (!error) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'stock-alerts', label: 'Stock Alerts', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Settings className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Manage your account preferences</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    {profileForm.avatar_url ? (
                      <img
                        src={profileForm.avatar_url}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-700"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-700">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{profileForm.full_name || 'Your Name'}</h3>
                    <p className="text-slate-400 text-sm">{profileForm.email}</p>
                    {user?.is_admin && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Avatar URL</label>
                    <input
                      type="url"
                      value={profileForm.avatar_url}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Alerts Tab */}
            {activeTab === 'stock-alerts' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-1">Stock Alert Settings</h2>
                      <p className="text-slate-400 text-sm">
                        Get notified when stocks in your watchlist have significant price movements or appear in breaking news.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingAlertPrefs ? (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Price Alerts */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Price Movement Alerts</h3>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Enable Price Alerts */}
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                          <div>
                            <h4 className="text-white font-medium">Enable Price Alerts</h4>
                            <p className="text-slate-400 text-sm">Get notified when watchlist stocks have significant price changes</p>
                          </div>
                          <button
                            onClick={() => setAlertPreferences(prev => ({ ...prev, price_alert_enabled: !prev.price_alert_enabled }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              alertPreferences.price_alert_enabled ? 'bg-cyan-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                alertPreferences.price_alert_enabled ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Price Threshold */}
                        <div className="p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-white font-medium">Price Change Threshold</h4>
                              <p className="text-slate-400 text-sm">Alert when daily change exceeds this percentage</p>
                            </div>
                            <span className="text-2xl font-bold text-cyan-400">{alertPreferences.price_threshold}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            value={alertPreferences.price_threshold}
                            onChange={(e) => setAlertPreferences(prev => ({ ...prev, price_threshold: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            disabled={!alertPreferences.price_alert_enabled}
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>1%</span>
                            <span>5%</span>
                            <span>10%</span>
                            <span>15%</span>
                            <span>20%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* News Alerts */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Newspaper className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Breaking News Alerts</h3>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div>
                          <h4 className="text-white font-medium">Enable News Alerts</h4>
                          <p className="text-slate-400 text-sm">Get notified when watchlist stocks appear in breaking news</p>
                        </div>
                        <button
                          onClick={() => setAlertPreferences(prev => ({ ...prev, news_alert_enabled: !prev.news_alert_enabled }))}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            alertPreferences.news_alert_enabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              alertPreferences.news_alert_enabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Notification Methods */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Notification Methods</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                              <h4 className="text-white font-medium">Email Notifications</h4>
                              <p className="text-slate-400 text-sm">Receive alerts via email</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAlertPreferences(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              alertPreferences.email_notifications ? 'bg-cyan-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                alertPreferences.email_notifications ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-slate-400" />
                            <div>
                              <h4 className="text-white font-medium">Push Notifications</h4>
                              <p className="text-slate-400 text-sm">Receive browser push notifications</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setAlertPreferences(prev => ({ ...prev, push_notifications: !prev.push_notifications }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              alertPreferences.push_notifications ? 'bg-cyan-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                alertPreferences.push_notifications ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alert Frequency */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Alert Frequency</h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'immediate', label: 'Immediate', desc: 'As they happen' },
                          { value: 'hourly', label: 'Hourly', desc: 'Digest every hour' },
                          { value: 'daily', label: 'Daily', desc: 'Once per day' },
                        ].map((freq) => (
                          <button
                            key={freq.value}
                            onClick={() => setAlertPreferences(prev => ({ ...prev, alert_frequency: freq.value }))}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              alertPreferences.alert_frequency === freq.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                            }`}
                          >
                            <h4 className={`font-medium ${alertPreferences.alert_frequency === freq.value ? 'text-cyan-400' : 'text-white'}`}>
                              {freq.label}
                            </h4>
                            <p className="text-slate-400 text-xs mt-1">{freq.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={saveAlertPreferences}
                        disabled={savingAlertPrefs}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                      >
                        {savingAlertPrefs ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : alertPrefsSaved ? (
                          <>
                            <Check className="w-4 h-4" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Alert Settings
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  {[
                    { key: 'email_updates', label: 'Email Updates', description: 'Receive important account updates via email' },
                    { key: 'market_alerts', label: 'Market Alerts', description: 'Get notified about significant market movements' },
                    { key: 'course_updates', label: 'Course Updates', description: 'Notifications when new courses are available' },
                    { key: 'weekly_digest', label: 'Weekly Digest', description: 'Receive a weekly summary of market news' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div>
                        <h3 className="text-white font-medium">{item.label}</h3>
                        <p className="text-slate-400 text-sm">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications] ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Privacy Settings</h2>
                
                <div className="space-y-6">
                  {[
                    { key: 'show_profile', label: 'Public Profile', description: 'Allow others to see your profile' },
                    { key: 'show_watchlist', label: 'Show Watchlist', description: 'Make your watchlist visible to others' },
                    { key: 'show_activity', label: 'Activity Status', description: 'Show when you were last active' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                      <div>
                        <h3 className="text-white font-medium">{item.label}</h3>
                        <p className="text-slate-400 text-sm">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          privacy[item.key as keyof typeof privacy] ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            privacy[item.key as keyof typeof privacy] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <h3 className="text-red-400 font-medium mb-2">Danger Zone</h3>
                  <p className="text-slate-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Appearance</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'dark', label: 'Dark', colors: ['bg-slate-900', 'bg-slate-800'] },
                        { id: 'light', label: 'Light', colors: ['bg-white', 'bg-gray-100'] },
                        { id: 'system', label: 'System', colors: ['bg-slate-900', 'bg-white'] },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            theme.id === 'dark' ? 'border-cyan-500' : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex gap-1 mb-3">
                            {theme.colors.map((color, i) => (
                              <div key={i} className={`w-6 h-6 rounded ${color} border border-slate-600`} />
                            ))}
                          </div>
                          <span className={`text-sm ${theme.id === 'dark' ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {theme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-medium mb-4">Accent Color</h3>
                    <div className="flex gap-3">
                      {['cyan', 'blue', 'purple', 'green', 'amber', 'rose'].map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full bg-${color}-500 ${
                            color === 'cyan' ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-cyan-500' : ''
                          } hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
