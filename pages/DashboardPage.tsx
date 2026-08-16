import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Bookmark, 
  GraduationCap, 
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Trash2,
  Clock,
  CheckCircle,
  BarChart3,
  Plus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  GitCompare,
  LineChart,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  X,
  Edit2,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StockWithRating, Story, Course, WatchlistGroup } from '@/types';
import { stockRatings, getStockRating, getTierColor, getOverallRatingColor } from '@/data/stockRatings';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<StockWithRating[]>([]);
  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>([
    { id: 'default', name: 'My Watchlist', stocks: [], color: 'cyan', created_at: new Date().toISOString() },
    { id: 'tech', name: 'Tech Giants', stocks: [], color: 'purple', created_at: new Date().toISOString() },
    { id: 'value', name: 'Value Picks', stocks: [], color: 'emerald', created_at: new Date().toISOString() },
  ]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['default']);
  const [bookmarks, setBookmarks] = useState<Story[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'watchlist' | 'bookmarks' | 'courses' | 'quizzes'>('watchlist');
  const [refreshing, setRefreshing] = useState(false);

  // Simulated real-time prices
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number }>>({});

  useEffect(() => {
    if (user) fetchDashboardData();
    else setLoading(false);
    // Simulate real-time price updates
    const interval = setInterval(() => {
      updateLivePrices();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const updateLivePrices = () => {
    const prices: Record<string, { price: number; change: number }> = {};
    stockRatings.forEach(stock => {
      const basePrice = Math.random() * 500 + 50;
      const change = (Math.random() - 0.5) * 5;
      prices[stock.symbol] = { price: basePrice, change };
    });
    setLivePrices(prices);
  };

  useEffect(() => {
    updateLivePrices();
  }, []);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch watchlist with safe query
      try {
        const query = supabase.from('watchlists');
        if (query && typeof query.select === 'function') {
          const { data: watchlistData, error } = await query
            .select(`
              stock_id,
              list_name,
              stocks (
                *,
                stock_ratings (*),
                stock_daily_performance (daily_change_percent)
              )
            `)
            .eq('user_id', user.id);

          if (watchlistData && !error) {
            const formattedWatchlist = watchlistData
              .filter((item: any) => item.stocks)
              .map((item: any) => ({
                ...item.stocks,
                list_name: item.list_name || 'default',
                rating: item.stocks.stock_ratings?.[0],
                daily_change: item.stocks.stock_daily_performance?.[0]?.daily_change_percent,
                health_score: item.stocks.stock_ratings?.[0]
                  ? (item.stocks.stock_ratings[0].financial_health_score + item.stocks.stock_ratings[0].profitability_score) / 2
                  : 0
              }));
            setWatchlist(formattedWatchlist);

            // Group stocks by list
            const updatedGroups = watchlistGroups.map(group => ({
              ...group,
              stocks: formattedWatchlist.filter((s: any) => s.list_name === group.id)
            }));
            setWatchlistGroups(updatedGroups);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch watchlist:', e);
      }

      // Fetch bookmarks with safe query
      try {
        const query = supabase.from('story_bookmarks');
        if (query && typeof query.select === 'function') {
          const { data: bookmarksData, error } = await query
            .select(`
              story_id,
              stories (*)
            `)
            .eq('user_id', user.id);

          if (bookmarksData && !error) {
            const formattedBookmarks = bookmarksData
              .filter((item: any) => item.stories)
              .map((item: any) => item.stories);
            setBookmarks(formattedBookmarks);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch bookmarks:', e);
      }

      // Fetch course progress with safe query
      try {
        const query = supabase.from('courses');
        if (query && typeof query.select === 'function') {
          const { data: progressData, error } = await query
            .select(`
              id,
              title,
              modules (
                id,
                lessons (
                  id,
                  user_progress (is_completed)
                )
              )
            `)
            .eq('is_published', true);

          if (progressData && !error) {
            const progressWithStats = progressData.map((course: any) => {
              let totalLessons = 0;
              let completedLessons = 0;
              course.modules?.forEach((module: any) => {
                module.lessons?.forEach((lesson: any) => {
                  totalLessons++;
                  if (lesson.user_progress?.some((p: any) => p.is_completed)) {
                    completedLessons++;
                  }
                });
              });
              return {
                ...course,
                totalLessons,
                completedLessons,
                progress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
              };
            });
            setCourseProgress(progressWithStats);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch course progress:', e);
      }

      // Fetch quiz attempts with safe query
      try {
        const query = supabase.from('quiz_attempts');
        if (query && typeof query.select === 'function') {
          const { data: attemptsData, error } = await query
            .select(`
              *,
              quizzes (title)
            `)
            .eq('user_id', user.id)
            .order('attempted_at', { ascending: false })
            .limit(5);

          if (attemptsData && !error) {
            setQuizAttempts(attemptsData);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch quiz attempts:', e);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    updateLivePrices();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const removeFromWatchlist = async (stockId: string) => {
    if (!user) return;
    try {
      const query = supabase.from('watchlists');
      if (query && typeof query.delete === 'function') {
        await query
          .delete()
          .eq('user_id', user.id)
          .eq('stock_id', stockId);
      }
    } catch (e) {
      console.warn('Failed to remove from watchlist:', e);
    }
    setWatchlist(prev => prev.filter(s => s.id !== stockId));
  };

  const removeBookmark = async (storyId: string) => {
    if (!user) return;
    try {
      const query = supabase.from('story_bookmarks');
      if (query && typeof query.delete === 'function') {
        await query
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId);
      }
    } catch (e) {
      console.warn('Failed to remove bookmark:', e);
    }
    setBookmarks(prev => prev.filter(s => s.id !== storyId));
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleStockSelection = (symbol: string) => {
    setSelectedStocks(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : prev.length < 4 ? [...prev, symbol] : prev
    );
  };

  const handleCompare = () => {
    if (selectedStocks.length >= 2) {
      navigate(`/compare?stocks=${selectedStocks.join(',')}`);
    }
  };

  const addNewList = () => {
    if (newListName.trim()) {
      const colors = ['cyan', 'purple', 'emerald', 'amber', 'rose', 'blue'];
      const newGroup: WatchlistGroup = {
        id: newListName.toLowerCase().replace(/\s+/g, '-'),
        name: newListName,
        stocks: [],
        color: colors[watchlistGroups.length % colors.length],
        created_at: new Date().toISOString()
      };
      setWatchlistGroups(prev => [...prev, newGroup]);
      setNewListName('');
      setShowAddList(false);
    }
  };

  const addStockToWatchlist = async (symbol: string, groupId: string = 'default') => {
    const stockRating = getStockRating(symbol);
    if (!stockRating) return;

    const newStock: StockWithRating = {
      id: symbol,
      ticker: symbol,
      company_name: stockRating.name,
      created_at: new Date().toISOString(),
      health_score: stockRating.companyHealth,
      performance_score: stockRating.companyPerformance,
    };

    setWatchlistGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, stocks: [...group.stocks, newStock] }
        : group
    ));
    setShowAddStock(false);
    setSearchQuery('');
  };

  const deleteList = (groupId: string) => {
    if (groupId === 'default') return;
    setWatchlistGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    };
    return colors[color] || colors.cyan;
  };

  const filteredStocks = stockRatings.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all stocks in watchlist for quick stats
  const allWatchlistStocks = watchlistGroups.flatMap(g => g.stocks);
  const avgHealth = allWatchlistStocks.length > 0 
    ? allWatchlistStocks.reduce((sum, s) => sum + (s.health_score || 0), 0) / allWatchlistStocks.length 
    : 0;
  const avgPerformance = allWatchlistStocks.length > 0 
    ? allWatchlistStocks.reduce((sum, s) => sum + (s.performance_score || 0), 0) / allWatchlistStocks.length 
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Please sign in to view your dashboard</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl"
          >
            Sign In
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Dashboard</h1>
              <p className="text-slate-400 text-xs sm:text-sm">Welcome back, {user.full_name || user.email?.split('@')[0] || 'User'}</p>
            </div>
            <button
              onClick={handleRefresh}
              className={`p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Watchlist</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white">{allWatchlistStocks.length}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Avg Health</span>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${getOverallRatingColor(avgHealth * 2)}`}>
                {avgHealth.toFixed(1)}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Avg Perf</span>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${getOverallRatingColor(avgPerformance * 2)}`}>
                {avgPerformance.toFixed(1)}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Bookmarks</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white">{bookmarks.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation - Horizontal Scroll */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex gap-1.5 sm:gap-2 min-w-max pb-1">
            {[
              { id: 'watchlist', label: 'Watchlist', icon: Heart },
              { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
              { id: 'courses', label: 'Courses', icon: GraduationCap },
              { id: 'quizzes', label: 'Quizzes', icon: ClipboardList },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowAddStock(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
              <button
                onClick={() => setShowAddList(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                New List
              </button>
              {selectedStocks.length >= 2 && (
                <button
                  onClick={handleCompare}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare ({selectedStocks.length})
                </button>
              )}
              {selectedStocks.length > 0 && (
                <button
                  onClick={() => setSelectedStocks([])}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear Selection
                </button>
              )}
            </div>

            {/* Watchlist Groups */}
            <div className="space-y-4">
              {watchlistGroups.map(group => {
                const colorClasses = getColorClasses(group.color);
                const isExpanded = expandedGroups.includes(group.id);
                const groupStocks = group.stocks.length > 0 ? group.stocks : 
                  stockRatings.slice(0, group.id === 'default' ? 5 : group.id === 'tech' ? 4 : 3).map(s => ({
                    id: s.symbol,
                    ticker: s.symbol,
                    company_name: s.name,
                    created_at: new Date().toISOString(),
                    health_score: s.companyHealth,
                    performance_score: s.companyPerformance,
                  }));

                return (
                  <div key={group.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/80 transition-all ${colorClasses.border} border-l-4`}
                      onClick={() => toggleGroupExpand(group.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className={`w-5 h-5 ${colorClasses.text}`} />
                        ) : (
                          <ChevronRight className={`w-5 h-5 ${colorClasses.text}`} />
                        )}
                        <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                          <Heart className={`w-4 h-4 ${colorClasses.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{group.name}</h3>
                          <p className="text-sm text-slate-400">{groupStocks.length} stocks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.id !== 'default' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteList(group.id);
                            }}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Group Stocks */}
                    {isExpanded && (
                      <div className="border-t border-slate-700/50">
                        {groupStocks.length > 0 ? (
                          <div className="divide-y divide-slate-700/50">
                            {groupStocks.map((stock) => {
                              const rating = getStockRating(stock.ticker);
                              const priceData = livePrices[stock.ticker];
                              const isSelected = selectedStocks.includes(stock.ticker);

                              return (
                                <div
                                  key={stock.id}
                                  className={`flex items-center gap-4 p-4 hover:bg-slate-900/50 transition-all ${
                                    isSelected ? 'bg-cyan-500/10' : ''
                                  }`}
                                >
                                  {/* Selection Checkbox */}
                                  <button
                                    onClick={() => toggleStockSelection(stock.ticker)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      isSelected 
                                        ? 'bg-cyan-500 border-cyan-500' 
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    {isSelected && (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    )}
                                  </button>

                                  {/* Stock Info */}
                                  <div 
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => navigate(`/industries?stock=${stock.ticker}`)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-white">{stock.ticker}</span>
                                      {rating && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(rating.tier)}`}>
                                          {rating.tier.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-400 text-sm truncate">{stock.company_name}</p>
                                  </div>

                                  {/* Live Price */}
                                  <div className="text-right">
                                    <p className="font-mono text-white font-medium">
                                      ${priceData?.price.toFixed(2) || '---'}
                                    </p>
                                    {priceData && (
                                      <p className={`text-xs font-medium flex items-center justify-end gap-1 ${
                                        priceData.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                      }`}>
                                        {priceData.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(2)}%
                                      </p>
                                    )}
                                  </div>

                                  {/* Ratings */}
                                  <div className="hidden md:flex items-center gap-4">
                                    <div className="text-center">
                                      <p className={`font-bold ${getOverallRatingColor((rating?.companyHealth || 0) * 2)}`}>
                                        {rating?.companyHealth.toFixed(1) || '-'}
                                      </p>
                                      <p className="text-slate-500 text-xs">Health</p>
                                    </div>
                                    <div className="text-center">
                                      <p className={`font-bold ${getOverallRatingColor((rating?.companyPerformance || 0) * 2)}`}>
                                        {rating?.companyPerformance.toFixed(1) || '-'}
                                      </p>
                                      <p className="text-slate-500 text-xs">Perf</p>
                                    </div>
                                    <div className="text-center">
                                      <p className={`font-bold ${getOverallRatingColor(rating?.overall || 0)}`}>
                                        {rating?.overall.toFixed(1) || '-'}
                                      </p>
                                      <p className="text-slate-500 text-xs">Overall</p>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => navigate(`/industries?stock=${stock.ticker}`)}
                                      className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                      title="View Details"
                                    >
                                      <LineChart className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => removeFromWatchlist(stock.id)}
                                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Heart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No stocks in this list</p>
                            <button
                              onClick={() => setShowAddStock(true)}
                              className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm"
                            >
                              Add stocks
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Compare Section */}
            {selectedStocks.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <GitCompare className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Quick Compare</h3>
                      <p className="text-sm text-slate-400">Select 2-4 stocks to compare</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCompare}
                    disabled={selectedStocks.length < 2}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedStocks.length >= 2
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-lg'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Compare Now
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStocks.map(symbol => {
                    const rating = getStockRating(symbol);
                    return (
                      <div
                        key={symbol}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                      >
                        <span className="font-mono font-bold text-white">{symbol}</span>
                        <span className={`text-sm ${getOverallRatingColor(rating?.overall || 0)}`}>
                          {rating?.overall.toFixed(1)}
                        </span>
                        <button
                          onClick={() => toggleStockSelection(symbol)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Bookmark className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Saved Stories</h2>
              <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-sm rounded-full">
                {bookmarks.length}
              </span>
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((story) => (
                  <div
                    key={story.id}
                    className="group bg-slate-900/50 rounded-xl overflow-hidden hover:bg-slate-900 transition-all cursor-pointer"
                    onClick={() => {
                      // Open external link if available, otherwise go to news page
                      if (story.link) {
                        window.open(story.link, '_blank', 'noopener,noreferrer');
                      } else {
                        navigate('/news');
                      }
                    }}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={story.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(story.id);
                          }}
                          className="p-2 bg-slate-900/80 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-cyan-400 mb-1">{story.source}</p>
                      <h3 className="text-white font-medium line-clamp-2">{story.title}</h3>
                      <p className="text-slate-400 text-sm mt-2">{formatDate(story.published_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No bookmarked stories yet</p>
                <button
                  onClick={() => navigate('/news')}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"
                >
                  Browse News
                </button>
              </div>
            )}
          </div>
        )}


        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Course Progress</h2>
            </div>

            {courseProgress.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {courseProgress.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-all"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{course.title}</h3>
                      <span className="text-cyan-400 font-bold">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <p className="text-slate-500 text-sm">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">Start a course to track your progress</p>
                <button
                  onClick={() => navigate('/courses')}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Quiz History</h2>
            </div>

            {quizAttempts.length > 0 ? (
              <div className="space-y-3">
                {quizAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl"
                  >
                    <div className={`p-2 rounded-lg ${
                      (attempt.score / attempt.total_questions) >= 0.7
                        ? 'bg-emerald-500/20'
                        : 'bg-amber-500/20'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        (attempt.score / attempt.total_questions) >= 0.7
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{attempt.quizzes?.title}</h3>
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(attempt.attempted_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{attempt.score}/{attempt.total_questions}</span>
                      <p className="text-slate-500 text-xs">
                        {Math.round((attempt.score / attempt.total_questions) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No quiz attempts yet</p>
                <button
                  onClick={() => navigate('/courses')}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"
                >
                  Take a Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Add Stock to Watchlist</h3>
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stocks..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredStocks.slice(0, 20).map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => addStockToWatchlist(stock.symbol)}
                    className="w-full flex items-center justify-between p-3 bg-slate-900/50 hover:bg-slate-900 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white">{stock.symbol}</span>
                      <span className="text-slate-400 text-sm truncate">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getOverallRatingColor(stock.overall)}`}>
                        {stock.overall.toFixed(1)}
                      </span>
                      <Plus className="w-4 h-4 text-cyan-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      {showAddList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Watchlist</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddList(false);
                  setNewListName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={addNewList}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
