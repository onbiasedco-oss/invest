import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, RefreshCw, Activity, Heart, Star, ChevronDown, ChevronUp, GitCompare, Newspaper, Calendar, DollarSign, BarChart3, PieChart, Wallet, Percent, Filter, Target, Plus, Trash2, X, Loader2, Search, Edit2, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import StockCard from '@/components/ui/StockCard';
import StoryCard from '@/components/ui/StoryCard';
import MarketTicker from '@/components/ui/MarketTicker';
import { StockWithRating, Story } from '@/types';
import { stockRatings as staticStockRatings, getOverallRatingColor, getTierColor, getScoreColor, StockRating, industries } from '@/data/stockRatings';
import { Badge } from '@/components/ui/badge';
import GuestGate from '@/components/ui/GuestGate';


// localStorage helpers for tier overrides (ensures persistence even if DB column doesn't exist)
const TIER_OVERRIDES_KEY = 'stock_tier_overrides';

const loadTierOverrides = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(TIER_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveTierOverride = (symbol: string, tier: string) => {
  try {
    const current = loadTierOverrides();
    current[symbol] = tier;
    localStorage.setItem(TIER_OVERRIDES_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save tier override to localStorage:', e);
  }
};

const removeTierOverride = (symbol: string) => {
  try {
    const current = loadTierOverrides();
    delete current[symbol];
    localStorage.setItem(TIER_OVERRIDES_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to remove tier override from localStorage:', e);
  }
};

// Interface for stock rating overrides from database
interface StockRatingOverride {
  id: string;
  symbol: string;
  company_health: number | null;
  company_performance: number | null;
  overall: number | null;
  tier?: string | null;
  updated_at: string;
}



// Interface for custom stocks from database
interface CustomStock {
  id: string;
  symbol: string;
  name: string;
  industry: string;
  company_health: number;
  company_performance: number;
  overall: number;
  tier: string;
  current_price: number | null;
  eps_score: number | null;
  pe_score: number | null;
  de_score: number | null;
  fcf_score: number | null;
  margin_score: number | null;
  created_at: string;
}


// Context for sharing stock ratings across components
interface StockRatingsContextType {
  mergedStockRatings: StockRating[];
  ratingOverrides: Record<string, StockRatingOverride>;
  customStocks: CustomStock[];
  refreshRatings: () => Promise<void>;
}

const StockRatingsContext = createContext<StockRatingsContextType | null>(null);

export const useStockRatings = () => {
  const context = useContext(StockRatingsContext);
  if (!context) {
    // Return default values if not in context
    return {
      mergedStockRatings: staticStockRatings,
      ratingOverrides: {},
      customStocks: [],
      refreshRatings: async () => {}
    };
  }
  return context;
};

// Weekly Stocks to Buy Component
interface WeeklyStock {
  id: string;
  symbol: string;
  name: string;
  reason: string;
  target_price: number | null;
  current_price: number | null;
  industry: string;
  sort_order?: number;
}


const WeeklyStocksToBuy: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mergedStockRatings } = useStockRatings();
  const [stocks, setStocks] = useState<WeeklyStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [error, setError] = useState<string | null>(null);

  // Check admin status - also check email directly as fallback
  const isAdmin = user?.is_admin === true || user?.email === 'naccitheceo@gmail.com';

  // Get unique industries from merged stockRatings
  const industriesList = ['All Industries', ...Array.from(new Set(mergedStockRatings.map(s => s.industry)))];

  useEffect(() => {
    fetchWeeklyStocks();
  }, []);

  const fetchWeeklyStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_stock_picks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (data && !error) {
        setStocks(data);
      } else if (error) {
        console.error('Error fetching weekly stocks:', error);
      }
    } catch (e) {
      console.warn('Failed to fetch weekly stocks:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (stock: StockRating) => {

    if (!isAdmin) {
      setError('You do not have permission to add stocks');
      return;
    }

    if (stocks.length >= 20) {
      setError('Maximum of 20 stocks allowed in weekly picks');
      return;
    }

    // Check if stock is already in the list
    if (stocks.some(s => s.symbol === stock.symbol)) {
      setError('This stock is already in the weekly picks');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const maxOrder = stocks.length > 0 ? Math.max(...stocks.map(s => s.sort_order || 0)) : 0;
      
      // Try direct Supabase insert first
      const { data, error: insertError } = await supabase.from('weekly_stock_picks').insert({
        symbol: stock.symbol,
        name: stock.name,
        reason: `${stock.tier.charAt(0).toUpperCase() + stock.tier.slice(1)} tier stock with ${stock.overall.toFixed(1)} overall rating`,
        industry: stock.industry,
        is_active: true,
        sort_order: maxOrder + 1,
        added_by: user?.id
      }).select();

      if (insertError) {
        console.error('Direct insert error:', insertError);
        
        // Fallback to edge function
        console.log('Trying edge function fallback for add...');
        const { data: edgeData, error: edgeFnError } = await supabase.functions.invoke('admin-operations', {
          body: {
            action: 'add_weekly_stock',
            data: {
              symbol: stock.symbol,
              name: stock.name,
              reason: `${stock.tier.charAt(0).toUpperCase() + stock.tier.slice(1)} tier stock with ${stock.overall.toFixed(1)} overall rating`,
              industry: stock.industry,
              is_active: true,
              sort_order: maxOrder + 1
            }
          }
        });

        if (edgeFnError) {
          console.error('Edge function error:', edgeFnError);
          setError(`Failed to add stock: ${edgeFnError.message || 'Unknown error'}`);
          return;
        }

        if (!edgeData?.success) {
          console.error('Operation failed:', edgeData?.error);
          setError(`Failed to add stock: ${edgeData?.error || 'Unknown error'}`);
          return;
        }
        
        console.log('Stock added via edge function');
      } else {
        console.log('Stock added successfully via direct insert:', data);
      }
      
      await fetchWeeklyStocks();
    } catch (e: any) {
      console.error('Error adding stock:', e);
      setError(`Failed to add stock: ${e.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };



  const handleDeleteStock = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAdmin) {
      alert('You do not have permission to remove stocks');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this stock from the weekly picks?')) return;

    setError(null);
    
    try {
      // Use direct Supabase delete for better reliability
      const { error: deleteError } = await supabase
        .from('weekly_stock_picks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        
        // Fallback to edge function if direct delete fails (RLS issue)
        console.log('Trying edge function fallback...');
        const { data, error: edgeFnError } = await supabase.functions.invoke('admin-operations', {
          body: {
            action: 'delete_weekly_stock',
            data: { id }
          }
        });

        if (edgeFnError) {
          console.error('Edge function error:', edgeFnError);
          alert(`Failed to remove stock: ${edgeFnError.message || 'Unknown error'}`);
          return;
        }

        if (!data?.success) {
          console.error('Operation failed:', data?.error);
          alert(`Failed to remove stock: ${data?.error || 'Unknown error'}`);
          return;
        }
      }

      console.log('Stock removed successfully');
      // Update local state immediately for better UX
      setStocks(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      console.error('Error deleting stock:', e);
      alert(`Failed to remove stock: ${e.message || 'Unknown error'}`);
    }
  };


  // Get stock rating data for a weekly stock - use merged ratings
  const getStockRatingData = (symbol: string): StockRating | undefined => {
    return mergedStockRatings.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  };

  // Filter stocks for the add modal
  const filteredStocks = mergedStockRatings.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'All Industries' || stock.industry === selectedIndustry;
    const notAlreadyAdded = !stocks.some(s => s.symbol === stock.symbol);
    return matchesSearch && matchesIndustry && notAlreadyAdded;
  });


  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-4 h-48"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {!hideHeader && (
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Weekly Stocks to Buy</h2>
            <span className="text-xs text-slate-500">({stocks.length}/20)</span>
          </div>
          <p className="text-slate-400 text-sm">Our top picks for this week based on expert analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && stocks.length < 20 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Stock</span>
            </button>

          )}
          <button
            onClick={() => navigate('/screener')}
            className="hidden sm:flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
          >
            View Screener <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      {stocks.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No weekly stock picks yet</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Add your first stock pick
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {stocks.map((stock, index) => {
            const ratingData = getStockRatingData(stock.symbol);
            return (
              <div
                key={stock.id}
                onClick={() => navigate(`/stocks/${stock.symbol}`)}
                className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-xl p-3 sm:p-4 hover:border-cyan-500/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Rank Badge & Admin Controls */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteStock(stock.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                      title="Remove stock"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Stock Info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm">{stock.symbol}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">{stock.name}</p>
                  </div>
                </div>

                {/* Ratings */}
                {ratingData ? (
                  <div className="space-y-2 mb-3">
                    {/* Company Health */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-400" />
                        <span className="text-[10px] text-slate-400">Health</span>
                      </div>
                      <span className="text-xs font-semibold text-pink-400">{ratingData.companyHealth.toFixed(1)}</span>
                    </div>
                    {/* Company Performance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] text-slate-400">Perf</span>
                      </div>
                      <span className="text-xs font-semibold text-cyan-400">
                        {ratingData.symbol === 'CRWV' ? 'N/A' : ratingData.companyPerformance.toFixed(1)}
                      </span>
                    </div>
                    {/* Overall Rating */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-slate-400">Overall</span>
                      </div>
                      <span className={`text-sm font-bold ${getOverallRatingColor(ratingData.overall)}`}>
                        {ratingData.overall.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">
                      {stock.industry || 'Technology'}
                    </span>
                  </div>
                )}

                {/* Tier Badge */}
                {ratingData && (
                  <div className="flex justify-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getTierColor(ratingData.tier)}`}>
                      {ratingData.tier} tier
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Add Stock Modal - Stock List Style */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Plus className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Stock to Weekly Picks</h3>
                  <p className="text-xs text-slate-400">Select from our ranked stocks ({stocks.length}/20 added)</p>

                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSelectedIndustry('All Industries');
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 border-b border-slate-700 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by symbol or name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {industries.slice(0, 8).map(industry => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedIndustry === industry
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
                {industries.length > 8 && (
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">More...</option>
                    {industries.slice(8).map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Stock List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredStocks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No stocks found matching your criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase">Stock</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">
                          <div className="flex items-center justify-center gap-1">
                            <Heart className="w-3 h-3 text-pink-400" />
                            Health
                          </div>
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">
                          <div className="flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            Perf
                          </div>
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            Overall
                          </div>
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">Tier</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-400 uppercase">Add</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredStocks.slice(0, 30).map((stock, index) => (
                        <tr 
                          key={stock.symbol}
                          className={`hover:bg-slate-700/30 transition-colors ${
                            stock.tier === 'lowest' ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              staticStockRatings.indexOf(stock) < 3 ? 'bg-amber-500/20 text-amber-400' : 
                              staticStockRatings.indexOf(stock) < 10 ? 'bg-cyan-500/20 text-cyan-400' : 
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {staticStockRatings.indexOf(stock) + 1}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center">
                                <span className="font-mono font-bold text-cyan-400 text-[10px]">{stock.symbol.slice(0, 2)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{stock.symbol}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{stock.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-pink-400 text-sm">{stock.companyHealth.toFixed(1)}</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-cyan-400 text-sm">{stock.companyPerformance.toFixed(1)}</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-bold text-sm ${getOverallRatingColor(stock.overall)}`}>
                              {stock.overall.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getTierColor(stock.tier)}`}>
                              {stock.tier}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleAddStock(stock)}
                              disabled={submitting || stocks.length >= 20}
                              className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Add to weekly picks"
                            >
                              {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStocks.length > 30 && (
                    <p className="text-center text-slate-400 text-xs py-3">
                      Showing 30 of {filteredStocks.length} stocks. Use search to find more.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSelectedIndustry('All Industries');
                }}
                className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};












const newsSources = [
  { name: 'Bloomberg', color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Reuters', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'TechCrunch', color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Wall Street Journal', color: 'bg-slate-500/20 text-slate-300' },
  { name: "Barron's", color: 'bg-red-500/20 text-red-400' },
  { name: 'Yahoo Finance', color: 'bg-purple-500/20 text-purple-400' },
];

// Real news articles from Yahoo Finance with actual thumbnails (December 2025)
const fallbackStories: Story[] = [
  {
    id: 'fallback-1',
    title: 'Stock market today: Dow, S&P 500 notch records, Nasdaq gains as Wall Street flies high into Christmas holiday',
    summary: 'U.S. stock markets rallied on Christmas Eve as investors embraced the "Santa Claus rally" period. The Dow and S&P 500 hit new record highs while the Nasdaq posted strong gains.',
    content: 'U.S. stock markets rallied on Christmas Eve as investors embraced the "Santa Claus rally" period.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/ircEHYzn6QvqFOUOpnwsMw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://s.yimg.com/os/creatr-uploaded-images/2023-12/d38af8b0-a43b-11ee-b9ef-3de472356920.cf.webp',
    source: 'Yahoo Finance',
    category: 'Markets',
    published_at: '2025-12-24T18:05:00Z',
    created_at: '2025-12-24T18:05:00Z',
    updated_at: '2025-12-24T18:05:00Z',
    link: 'https://finance.yahoo.com/news/live/stock-market-today-dow-sp-500-notch-records-nasdaq-gains-as-wall-street-flies-high-into-christmas-holiday-180542226.html'
  },
  {
    id: 'fallback-2',
    title: 'Warren Buffett is resigning as CEO but remaining chairman. He once said retiring would be "unthinkable"',
    summary: 'Warren Buffett announced he is stepping down as CEO of Berkshire Hathaway but will remain chairman.',
    content: 'Warren Buffett announced he is stepping down as CEO of Berkshire Hathaway but will remain chairman.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/2siln2K85Mt_PpzLj4ikqw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/ca19dd3c9d6badd3290051e8ac7c07cb.cf.webp',
    source: 'Business Insider',
    category: 'Markets',
    published_at: '2025-12-24T17:23:00Z',
    created_at: '2025-12-24T17:23:00Z',
    updated_at: '2025-12-24T17:23:00Z',
    link: 'https://finance.yahoo.com/news/warren-buffett-resigning-ceo-remaining-172301275.html'
  },
  {
    id: 'fallback-3',
    title: 'Gold Steadies as Traders Book Profits After Rally to Record',
    summary: 'Gold prices stabilized as traders took profits following a rally that pushed the precious metal to record highs.',
    content: 'Gold prices steadied as traders booked profits after a rally that pushed the precious metal to record highs.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/Nr6TGtWnQYz03JCvLBF.tQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/b24670784eb0957164a8daa8ec79de10.cf.webp',
    source: 'Bloomberg',
    category: 'Commodities',
    published_at: '2025-12-24T06:36:00Z',
    created_at: '2025-12-24T06:36:00Z',
    updated_at: '2025-12-24T06:36:00Z',
    link: 'https://finance.yahoo.com/news/gold-climbs-above-4-500-063606076.html'
  },
  {
    id: 'fallback-4',
    title: 'Carvana, Robinhood, Coinbase: How 3 of the market\'s biggest 2022 losers ended up in the S&P 500',
    summary: 'Three companies that were among the biggest losers in 2022 have made remarkable comebacks and are now part of the S&P 500.',
    content: 'In a remarkable turnaround, three companies that were among the biggest losers in 2022 have made stunning comebacks.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/h.v9ycxaLiSGW5h10410TQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://s.yimg.com/os/creatr-uploaded-images/2025-11/5cd7ce90-bfdd-11f0-bafe-c091b51d1f91.cf.webp',
    source: 'Yahoo Finance',
    category: 'Markets',
    published_at: '2025-12-24T14:06:00Z',
    created_at: '2025-12-24T14:06:00Z',
    updated_at: '2025-12-24T14:06:00Z',
    link: 'https://finance.yahoo.com/news/carvana-robinhood-coinbase-how-3-of-the-markets-biggest-2022-losers-ended-up-in-the-sp-500-this-year-140654224.html'
  },
  {
    id: 'fallback-5',
    title: '3 surprises that could rattle markets in 2026, according to Morgan Stanley',
    summary: 'Morgan Stanley analysts outline three potential surprises that could shake up financial markets in 2026.',
    content: 'Morgan Stanley analysts have outlined three potential surprises that could rattle financial markets in 2026.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/JjyueTVxflxu9bwsLMbnpQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/8f23447fdb3139d643cc6f256d0b9b11.cf.webp',
    source: 'Business Insider',
    category: 'Markets',
    published_at: '2025-12-24T18:30:00Z',
    created_at: '2025-12-24T18:30:00Z',
    updated_at: '2025-12-24T18:30:00Z',
    link: 'https://finance.yahoo.com/news/3-surprises-could-rattle-markets-183001692.html'
  },
  {
    id: 'fallback-6',
    title: 'A Google-Backed Software Company Could Join Next Year\'s AI-Powered IPO Rush',
    summary: 'A software company backed by Google is reportedly preparing for an IPO in 2026.',
    content: 'A software company backed by Google is reportedly preparing for an initial public offering in 2026.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/A03pq2_MKk_zvKD8tgGXMg--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/investopedia_245/e16b7bfe54e9855bc35b612f91ae0f19.cf.webp',
    source: 'Investopedia',
    category: 'Technology',
    published_at: '2025-12-24T18:43:00Z',
    created_at: '2025-12-24T18:43:00Z',
    updated_at: '2025-12-24T18:43:00Z',
    link: 'https://finance.yahoo.com/news/google-backed-software-company-could-184311813.html'
  },
  {
    id: 'fallback-7',
    title: 'Copper Poised for Best Year Since 2009 After December Surge',
    summary: 'Copper prices are on track for their best annual performance since 2009.',
    content: 'Copper prices are poised for their best annual performance since 2009 following a December surge.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/BQqgLLC1jCuhiGleLfDhjw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/61df9362c7ecc3f8d4afcdb782483343.cf.webp',
    source: 'Bloomberg',
    category: 'Commodities',
    published_at: '2025-12-24T06:56:00Z',
    created_at: '2025-12-24T06:56:00Z',
    updated_at: '2025-12-24T06:56:00Z',
    link: 'https://finance.yahoo.com/news/copper-poised-best-since-2009-065642820.html'
  },
  {
    id: 'fallback-8',
    title: 'Logan Paul says young investors should consider nontraditional assets over stocks',
    summary: 'YouTube star Logan Paul advises young investors to look beyond traditional stocks.',
    content: 'YouTube star and entrepreneur Logan Paul is advising young investors to consider nontraditional assets over stocks.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/lm3EK0ZyyKr05A4Zf8_iIg--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/8b16991ae8dd54d351977a979debffc5.cf.webp',
    source: 'Business Insider',
    category: 'Investing',
    published_at: '2025-12-24T19:22:00Z',
    created_at: '2025-12-24T19:22:00Z',
    updated_at: '2025-12-24T19:22:00Z',
    link: 'https://finance.yahoo.com/news/logan-paul-says-young-investors-192210647.html'
  },
  {
    id: 'fallback-9',
    title: '119 JCPenney stores hang in the balance as deal deadline approaches',
    summary: 'The fate of 119 JCPenney stores remains uncertain as a critical deal deadline approaches.',
    content: 'The fate of 119 JCPenney stores hangs in the balance as a critical deal deadline approaches.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/Y8gE4CoBQ3qaD3PFLMZUoA--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/usa_today_money_325/65e890ee5282e98ac75cca5c2784175e.cf.webp',
    source: 'USA Today',
    category: 'Retail',
    published_at: '2025-12-24T19:10:00Z',
    created_at: '2025-12-24T19:10:00Z',
    updated_at: '2025-12-24T19:10:00Z',
    link: 'https://finance.yahoo.com/news/119-jcpenney-stores-hang-balance-191018272.html'
  },
  {
    id: 'fallback-10',
    title: 'Chipotle Just Launched a New Protein-Packed Menu. Should You Buy CMG Stock for 2026?',
    summary: 'Chipotle has launched a new protein-focused menu as the fast-casual chain continues to innovate.',
    content: 'Chipotle Mexican Grill has launched a new protein-packed menu.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/_ZTM7pdM6g_OGjJ2.Z0xUw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/barchart_com_477/788b32f6a16b0bcc2cda90797d102061.cf.webp',
    source: 'Barchart',
    category: 'Stocks',
    published_at: '2025-12-24T17:27:00Z',
    created_at: '2025-12-24T17:27:00Z',
    updated_at: '2025-12-24T17:27:00Z',
    link: 'https://finance.yahoo.com/news/chipotle-just-launched-protein-packed-172751463.html'
  },
  {
    id: 'fallback-11',
    title: 'How Pudgy Penguins Landed the Las Vegas Sphere—After Dogwifhat Couldn\'t',
    summary: 'NFT project Pudgy Penguins secured a spot on the Las Vegas Sphere after rival meme coin failed.',
    content: 'NFT project Pudgy Penguins has secured a coveted spot on the Las Vegas Sphere.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/0neMO06_ZDzUtDSRowuFgA--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/decrypt_157/b7b0da198db424184f1d48e82b59b4b2.cf.webp',
    source: 'Decrypt',
    category: 'Cryptocurrency',
    published_at: '2025-12-24T17:23:00Z',
    created_at: '2025-12-24T17:23:00Z',
    updated_at: '2025-12-24T17:23:00Z',
    link: 'https://finance.yahoo.com/news/pudgy-penguins-landed-las-vegas-172304648.html'
  },
  {
    id: 'fallback-12',
    title: 'Oil Steadies as Global Tensions Help Offset Oversupply Outlook',
    summary: 'Oil prices stabilized as geopolitical tensions provided support despite concerns about oversupply.',
    content: 'Oil prices steadied as global geopolitical tensions helped offset concerns about oversupply.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/P3tVxD0SQoBMp.duWVtWFQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/9f10bfa4781fdbef35c5e58a0977867f.cf.webp',
    source: 'Bloomberg',
    category: 'Commodities',
    published_at: '2025-12-24T09:50:00Z',
    created_at: '2025-12-24T09:50:00Z',
    updated_at: '2025-12-24T09:50:00Z',
    link: 'https://finance.yahoo.com/news/oil-steadies-global-tensions-help-095045523.html'
  }
];




const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.is_admin === true || user?.email === 'naccitheceo@gmail.com';
  const [topStocks, setTopStocks] = useState<StockWithRating[]>([]);
  const [dailyPerformers, setDailyPerformers] = useState<StockWithRating[]>([]);
  const [stories, setStories] = useState<Story[]>(fallbackStories);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshingNews, setRefreshingNews] = useState(false);
  const [newArticlesCount, setNewArticlesCount] = useState<number>(0);
  
  // Stock rating edit state
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, StockRatingOverride>>({});
  const [customStocks, setCustomStocks] = useState<CustomStock[]>([]);
  const [editingStock, setEditingStock] = useState<StockRating | null>(null);
  const [editFormData, setEditFormData] = useState({ companyHealth: '', companyPerformance: '', overall: '', tier: '' as string });

  const [savingRating, setSavingRating] = useState(false);
  
  // Add custom stock modal state
  const [showAddCustomStockModal, setShowAddCustomStockModal] = useState(false);
  const [customStockForm, setCustomStockForm] = useState({
    symbol: '',
    name: '',
    industry: 'Technology',
    companyHealth: '2.5',
    companyPerformance: '2.5',
    overall: '5.0',
    tier: 'mid' as 'top' | 'high' | 'mid-high' | 'mid' | 'lower' | 'low' | 'lowest',
    currentPrice: '',
    epsScore: '3',
    peScore: '3',
    deScore: '3',
    fcfScore: '3',
    marginScore: '3'
  });

  const [addingCustomStock, setAddingCustomStock] = useState(false);

  // Merge static ratings with overrides and custom stocks
  const stockRatings: StockRating[] = [
    // Static stocks with overrides applied
    ...staticStockRatings.map(stock => {
      const override = ratingOverrides[stock.symbol];
      if (override) {
        const validTiers = ['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'] as const;
        const overrideTier = override.tier && validTiers.includes(override.tier as any) 
          ? (override.tier as typeof validTiers[number]) 
          : null;
        return {
          ...stock,
          companyHealth: override.company_health != null ? Number(override.company_health) : stock.companyHealth,
          companyPerformance: override.company_performance != null ? Number(override.company_performance) : stock.companyPerformance,
          overall: override.overall != null ? Number(override.overall) : stock.overall,
          tier: overrideTier || stock.tier
        };
      }
      return stock;
    }),

    // Custom stocks from database (converted to StockRating format)
    ...customStocks
      .filter(cs => !staticStockRatings.some(s => s.symbol.toUpperCase() === cs.symbol.toUpperCase()))
      .map(cs => ({
        symbol: cs.symbol,
        name: cs.name,
        companyHealth: Number(cs.company_health),
        companyPerformance: Number(cs.company_performance),
        overall: Number(cs.overall),
        tier: cs.tier as 'top' | 'high' | 'mid-high' | 'mid' | 'lower' | 'lowest',
        industry: cs.industry,
        currentPrice: cs.current_price || 0,
        healthMetrics: {
          epsScore: cs.eps_score ?? 3,
          peScore: cs.pe_score ?? 3,
          deScore: cs.de_score ?? 3,
          fcfScore: cs.fcf_score ?? 3,
          marginScore: cs.margin_score ?? 3
        },
        companyInfo: { description: 'Custom stock added by admin', founded: 'N/A', headquarters: 'N/A', ceo: 'N/A', employees: 'N/A', website: '' }
      }))
  ].sort((a, b) => b.overall - a.overall);





  useEffect(() => {
    fetchData();
    fetchRatingOverrides();
    fetchCustomStocks();
  }, [user]);

  // Fetch rating overrides from database, then merge with localStorage tier data
  const fetchRatingOverrides = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_rating_overrides')
        .select('*');
      
      // Load tier overrides from localStorage (always available, even if DB doesn't have tier column)
      const localTierOverrides = loadTierOverrides();
      
      if (data && !error) {
        const overridesMap: Record<string, StockRatingOverride> = {};
        data.forEach((override: any) => {
          // Merge: DB tier takes priority if it exists, otherwise use localStorage tier
          const dbTier = override.tier;
          const localTier = localTierOverrides[override.symbol];
          overridesMap[override.symbol] = {
            ...override,
            tier: dbTier || localTier || null
          };
        });
        
        // Also add any localStorage-only tier overrides (for stocks that have tier changes but no other DB overrides)
        Object.entries(localTierOverrides).forEach(([symbol, tier]) => {
          if (!overridesMap[symbol]) {
            // Create a minimal override entry just for the tier
            overridesMap[symbol] = {
              id: `local-${symbol}`,
              symbol,
              company_health: null,
              company_performance: null,
              overall: null,
              tier,
              updated_at: new Date().toISOString()
            };
          }
        });
        
        setRatingOverrides(overridesMap);
      } else {
        // If DB fetch fails, still use localStorage tier overrides
        const overridesMap: Record<string, StockRatingOverride> = {};
        Object.entries(localTierOverrides).forEach(([symbol, tier]) => {
          overridesMap[symbol] = {
            id: `local-${symbol}`,
            symbol,
            company_health: null,
            company_performance: null,
            overall: null,
            tier,
            updated_at: new Date().toISOString()
          };
        });
        if (Object.keys(overridesMap).length > 0) {
          setRatingOverrides(overridesMap);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch rating overrides:', e);
      // Fallback: use localStorage tier overrides
      const localTierOverrides = loadTierOverrides();
      const overridesMap: Record<string, StockRatingOverride> = {};
      Object.entries(localTierOverrides).forEach(([symbol, tier]) => {
        overridesMap[symbol] = {
          id: `local-${symbol}`,
          symbol,
          company_health: null,
          company_performance: null,
          overall: null,
          tier,
          updated_at: new Date().toISOString()
        };
      });
      if (Object.keys(overridesMap).length > 0) {
        setRatingOverrides(overridesMap);
      }
    }
  };


  // Fetch custom stocks from database
  const fetchCustomStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_stocks')
        .select('*')
        .order('overall', { ascending: false });
      
      if (data && !error) {
        setCustomStocks(data);
      }
    } catch (e) {
      console.warn('Failed to fetch custom stocks:', e);
    }
  };

  // Handle adding a custom stock
  const handleAddCustomStock = async () => {
    if (!isAdmin) return;
    
    // Validate form
    if (!customStockForm.symbol.trim() || !customStockForm.name.trim()) {
      alert('Symbol and name are required');
      return;
    }

    // Check if symbol already exists in static data
    if (staticStockRatings.some(s => s.symbol.toUpperCase() === customStockForm.symbol.toUpperCase())) {
      alert('This stock symbol already exists in the static data. Use the edit function instead.');
      return;
    }

    // Check if symbol already exists in custom stocks
    if (customStocks.some(s => s.symbol.toUpperCase() === customStockForm.symbol.toUpperCase())) {
      alert('This stock symbol already exists in custom stocks.');
      return;
    }

    setAddingCustomStock(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'add_custom_stock',
          data: {
            symbol: customStockForm.symbol.toUpperCase().trim(),
            name: customStockForm.name.trim(),
            industry: customStockForm.industry,
            company_health: parseFloat(customStockForm.companyHealth),
            company_performance: parseFloat(customStockForm.companyPerformance),
            overall: parseFloat(customStockForm.overall),
            tier: customStockForm.tier,
            current_price: customStockForm.currentPrice ? parseFloat(customStockForm.currentPrice) : null,
            eps_score: parseInt(customStockForm.epsScore) || 3,
            pe_score: parseInt(customStockForm.peScore) || 3,
            de_score: parseInt(customStockForm.deScore) || 3,
            fcf_score: parseInt(customStockForm.fcfScore) || 3,
            margin_score: parseInt(customStockForm.marginScore) || 3
          }
        }
      });

      if (error) {
        console.error('Error adding custom stock:', error);
        alert(`Failed to add stock: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data?.success) {
        alert(`Failed to add stock: ${data?.error || 'Unknown error'}`);
        return;
      }

      // Refresh custom stocks
      await fetchCustomStocks();
      
      // Reset form and close modal
      setCustomStockForm({
        symbol: '',
        name: '',
        industry: 'Technology',
        companyHealth: '2.5',
        companyPerformance: '2.5',
        overall: '5.0',
        tier: 'mid',
        currentPrice: '',
        epsScore: '3',
        peScore: '3',
        deScore: '3',
        fcfScore: '3',
        marginScore: '3'
      });

      setShowAddCustomStockModal(false);
      alert('Custom stock added successfully!');
    } catch (e: any) {
      console.error('Error adding custom stock:', e);
      alert(`Failed to add stock: ${e.message || 'Unknown error'}`);
    } finally {
      setAddingCustomStock(false);
    }
  };

  // Handle opening edit modal
  const handleEditStock = (stock: StockRating, e: React.MouseEvent) => {
    e.stopPropagation();
    const override = ratingOverrides[stock.symbol];
    setEditingStock(stock);
    setEditFormData({
      companyHealth: (override?.company_health ?? stock.companyHealth).toString(),
      companyPerformance: (override?.company_performance ?? stock.companyPerformance).toString(),
      overall: (override?.overall ?? stock.overall).toString(),
      tier: (override?.tier ?? stock.tier) as string
    });
  };



  // Handle saving rating changes
  const handleSaveRating = async () => {
    if (!editingStock) return;
    
    setSavingRating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_stock_rating',
          data: {
            symbol: editingStock.symbol,
            company_health: parseFloat(editFormData.companyHealth),
            company_performance: parseFloat(editFormData.companyPerformance),
            overall: parseFloat(editFormData.overall),
            tier: editFormData.tier
          }
        }
      });

      if (error) {
        console.error('Error saving rating:', error);
        alert(`Failed to save rating: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data?.success) {
        alert(`Failed to save rating: ${data?.error || 'Unknown error'}`);
        return;
      }

      // CRITICAL: Save tier to localStorage for guaranteed persistence across page refreshes
      // This ensures the tier survives even if the DB doesn't have a tier column
      saveTierOverride(editingStock.symbol, editFormData.tier);

      // Also try to directly update the tier in the database (best-effort)
      try {
        await supabase
          .from('stock_rating_overrides')
          .update({ tier: editFormData.tier })
          .eq('symbol', editingStock.symbol);
      } catch (dbErr) {
        // Silently fail - localStorage is the primary persistence for tier
        console.warn('Could not update tier in DB (column may not exist):', dbErr);
      }

      // Update local state
      setRatingOverrides(prev => ({
        ...prev,
        [editingStock.symbol]: {
          ...prev[editingStock.symbol],
          id: data.data?.id || prev[editingStock.symbol]?.id || '',
          symbol: editingStock.symbol,
          company_health: parseFloat(editFormData.companyHealth),
          company_performance: parseFloat(editFormData.companyPerformance),
          overall: parseFloat(editFormData.overall),
          tier: editFormData.tier,
          updated_at: new Date().toISOString()
        }
      }));

      setEditingStock(null);
      alert('Rating updated successfully!');
    } catch (e: any) {
      console.error('Error saving rating:', e);
      alert(`Failed to save rating: ${e.message || 'Unknown error'}`);
    } finally {
      setSavingRating(false);
    }
  };





  // Handle resetting to default values
  const handleResetToDefault = async () => {
    if (!editingStock || !isAdmin) return;
    
    const originalStock = staticStockRatings.find(s => s.symbol === editingStock.symbol);
    if (!originalStock) return;

    if (!confirm('Reset this stock\'s ratings to the default values?')) return;

    setSavingRating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_stock_rating_override',
          data: { symbol: editingStock.symbol }
        }
      });

      if (error) {
        console.error('Error resetting rating:', error);
        alert(`Failed to reset rating: ${error.message || 'Unknown error'}`);
        return;
      }

      // CRITICAL: Also remove tier override from localStorage
      removeTierOverride(editingStock.symbol);

      // Remove from local state
      setRatingOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[editingStock.symbol];
        return newOverrides;
      });

      // Reset form to original values
      setEditFormData({
        companyHealth: originalStock.companyHealth.toString(),
        companyPerformance: originalStock.companyPerformance.toString(),
        overall: originalStock.overall.toString(),
        tier: originalStock.tier
      });

      alert('Rating reset to default values!');
    } catch (e: any) {
      console.error('Error resetting rating:', e);
      alert(`Failed to reset rating: ${e.message || 'Unknown error'}`);
    } finally {
      setSavingRating(false);
    }
  };


  // Function to refresh news from Yahoo Finance
  const handleRefreshNews = async () => {
    setRefreshingNews(true);
    try {
      const { data: newsData, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        console.error('Error refreshing news:', error);
        alert('Failed to refresh news. Please try again.');
        return;
      }
      
      if (newsData?.news && Array.isArray(newsData.news) && newsData.news.length > 0) {
        const formattedNews: Story[] = newsData.news.slice(0, 12).map((item: any, index: number) => ({
          id: `live-${item.id || index}-${Date.now()}`,
          title: item.title,
          summary: item.summary || item.description || '',
          content: item.summary || item.description || '',
          image_url: item.image_url || item.thumbnail || fallbackStories[index % fallbackStories.length]?.image_url,
          source: item.source || 'Yahoo Finance',
          category: item.category || 'Market News',
          published_at: item.published_at || new Date().toISOString(),
          created_at: item.published_at || new Date().toISOString(),
          updated_at: item.published_at || new Date().toISOString(),
          link: item.link || item.url
        }));
        setStories(formattedNews);
        if (newsData.lastUpdated) {
          setLastUpdated(newsData.lastUpdated);
        }
        if (newsData.newArticlesAdded > 0) {
          setNewArticlesCount(newsData.newArticlesAdded);
          alert(`News refreshed! ${newsData.newArticlesAdded} new article${newsData.newArticlesAdded > 1 ? 's' : ''} added.`);
        } else {
          alert('News refreshed! No new articles found.');
        }
      } else {
        alert('No new stories found. Using cached stories.');
      }
    } catch (err: any) {
      console.error('Error refreshing news:', err);
      alert('Failed to refresh news: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshingNews(false);
    }
  };



  const fetchData = async () => {
    try {
      // Fetch ranked stocks with ratings - with safe query
      try {
        const query = supabase.from('stock_rankings');
        if (query && typeof query.select === 'function') {
          const { data: rankedStocks, error } = await query
            .select(`
              rank_position,
              stocks (
                *,
                stock_ratings (*)
              )
            `)
            .order('rank_position');

          if (rankedStocks && !error) {
            const formattedStocks = rankedStocks
              .filter((item: any) => item.stocks)
              .map((item: any) => ({
                ...item.stocks,
                rating: item.stocks.stock_ratings?.[0],
                rank_position: item.rank_position,
                health_score: item.stocks.stock_ratings?.[0] 
                  ? (item.stocks.stock_ratings[0].financial_health_score + item.stocks.stock_ratings[0].profitability_score) / 2 
                  : 0,
                performance_score: item.stocks.stock_ratings?.[0]
                  ? (item.stocks.stock_ratings[0].growth_score + item.stocks.stock_ratings[0].value_score + item.stocks.stock_ratings[0].sentiment_score) / 3
                  : 0
              }));
            setTopStocks(formattedStocks);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch ranked stocks:', e);
      }

      // Fetch daily performers - with safe query
      try {
        const query = supabase.from('stock_daily_performance');
        if (query && typeof query.select === 'function') {
          const { data: performers, error } = await query
            .select(`
              daily_change_percent,
              stocks (
                *,
                stock_ratings (*)
              )
            `)
            .eq('date', new Date().toISOString().split('T')[0])
            .order('daily_change_percent', { ascending: false })
            .limit(10);

          if (performers && !error) {
            const formattedPerformers = performers
              .filter((item: any) => item.stocks)
              .map((item: any) => ({
                ...item.stocks,
                rating: item.stocks.stock_ratings?.[0],
                daily_change: item.daily_change_percent
              }));
            setDailyPerformers(formattedPerformers);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch daily performers:', e);
      }

      // Fetch stories - try live news first, get 12 stories
      setStoriesLoading(true);
      let storiesLoaded = false;
      
      try {
        const { data: newsData, error: newsError } = await supabase.functions.invoke('fetch-market-news');
        
        if (!newsError && newsData?.news && Array.isArray(newsData.news) && newsData.news.length > 0) {
          const formattedNews: Story[] = newsData.news.slice(0, 12).map((item: any, index: number) => ({
            id: `live-${item.id || index}-${Date.now()}`,
            title: item.title || 'Untitled',
            summary: item.summary || item.description || '',
            content: item.summary || item.description || '',
            image_url: item.image_url || item.thumbnail || fallbackStories[index % fallbackStories.length]?.image_url,
            source: item.source || 'Yahoo Finance',
            category: item.category || 'Market News',
            published_at: item.published_at || new Date().toISOString(),
            created_at: item.published_at || new Date().toISOString(),
            updated_at: item.published_at || new Date().toISOString(),
            link: item.link || item.url
          }));
          setStories(formattedNews);
          storiesLoaded = true;
          if (newsData.lastUpdated) {
            setLastUpdated(newsData.lastUpdated);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch live news:', e);
      }

      // If live news failed, try database stories
      if (!storiesLoaded) {
        try {
          const query = supabase.from('stories');
          if (query && typeof query.select === 'function') {
            const { data: storiesData, error } = await query
              .select('*')
              .order('published_at', { ascending: false })
              .limit(12);

            if (storiesData && !error && storiesData.length > 0) {
              setStories(storiesData);
              storiesLoaded = true;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch database stories:', e);
        }
      }

      // If all else fails, use fallback stories (already initialized)
      if (!storiesLoaded) {
        console.log('Using fallback stories');
        setStories(fallbackStories);
      }

      setStoriesLoading(false);

      // Fetch user's watchlist and bookmarks
      if (user) {
        try {
          const query = supabase.from('watchlists');
          if (query && typeof query.select === 'function') {
            const { data: watchlistData, error } = await query
              .select('stock_id')
              .eq('user_id', user.id);

            if (watchlistData && !error) {
              setWatchlist(watchlistData.map(w => w.stock_id));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch watchlist:', e);
        }

        try {
          const query = supabase.from('story_bookmarks');
          if (query && typeof query.select === 'function') {
            const { data: bookmarksData, error } = await query
              .select('story_id')
              .eq('user_id', user.id);

            if (bookmarksData && !error) {
              setBookmarks(bookmarksData.map(b => b.story_id));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch bookmarks:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Stories already initialized with fallback
    } finally {
      setLoading(false);
      setStoriesLoading(false);
    }
  };




  const toggleWatchlist = async (stockId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const isWatchlisted = watchlist.includes(stockId);
    
    try {
      if (isWatchlisted) {
        const query = supabase.from('watchlists');
        if (query && typeof query.delete === 'function') {
          await query
            .delete()
            .eq('user_id', user.id)
            .eq('stock_id', stockId);
        }
        setWatchlist(prev => prev.filter(id => id !== stockId));
      } else {
        const query = supabase.from('watchlists');
        if (query && typeof query.insert === 'function') {
          await query.insert({ user_id: user.id, stock_id: stockId });
        }
        setWatchlist(prev => [...prev, stockId]);
      }
    } catch (e) {
      console.warn('Failed to toggle watchlist:', e);
    }
  };

  const toggleBookmark = async (storyId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (storyId.startsWith('fallback-') || storyId.startsWith('live-')) {
      if (bookmarks.includes(storyId)) {
        setBookmarks(prev => prev.filter(id => id !== storyId));
      } else {
        setBookmarks(prev => [...prev, storyId]);
      }
      return;
    }

    const isBookmarked = bookmarks.includes(storyId);
    
    try {
      if (isBookmarked) {
        const query = supabase.from('story_bookmarks');
        if (query && typeof query.delete === 'function') {
          await query
            .delete()
            .eq('user_id', user.id)
            .eq('story_id', storyId);
        }
        setBookmarks(prev => prev.filter(id => id !== storyId));
      } else {
        const query = supabase.from('story_bookmarks');
        if (query && typeof query.insert === 'function') {
          await query.insert({ user_id: user.id, story_id: storyId });
        }
        setBookmarks(prev => [...prev, storyId]);
      }
    } catch (e) {
      console.warn('Failed to toggle bookmark:', e);
    }
  };


  const toggleExpand = (symbol: string) => {
    setExpandedStock(expandedStock === symbol ? null : symbol);
  };

  const getRatingBar = (value: number, max: number, color: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
        <div 
          className={`h-1.5 sm:h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const displayedStocks = showAllStocks ? stockRatings : stockRatings.slice(0, 20);

  // Context value for sharing stock ratings with child components
  const stockRatingsContextValue: StockRatingsContextType = {
    mergedStockRatings: stockRatings,
    ratingOverrides,
    customStocks,
    refreshRatings: async () => {
      await fetchRatingOverrides();
      await fetchCustomStocks();
    }
  };

  return (
    <StockRatingsContext.Provider value={stockRatingsContextValue}>
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766367427775_8c819222.jpg"
            alt="Hero background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs sm:text-sm mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              Your Investment Journey Starts Here
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Master the Markets with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Expert Insights
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl">
              Access curated stock analysis, comprehensive courses, and real-time market data to make informed investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm sm:text-base font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Start Learning
              </button>
              <button
                onClick={() => navigate('/industries')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-800 text-white text-sm sm:text-base font-medium rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700 transition-all"
              >
                Explore Stocks
              </button>
              <button
                onClick={() => navigate('/compare')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-800 text-white text-sm sm:text-base font-medium rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <GitCompare className="w-4 h-4 sm:w-5 sm:h-5" />
                Compare Stocks
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Market Ticker - Stock Rankings Rolling Banner */}
      <MarketTicker />

      {/* Weekly Stocks to Buy Section Header - Always visible */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Weekly Stocks to Buy</h2>
        </div>
        <p className="text-slate-400 text-sm">Our top picks for this week based on expert analysis</p>
      </section>

      {/* Weekly Stocks to Buy Content - Gated for guests */}
      <GuestGate showPreview={true} preMessage="Sign up to see our Weekly Stocks to Buy picks">
        <WeeklyStocksToBuy hideHeader />
      </GuestGate>


      {/* Top Stories Section - Now showing more stories */}





      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Top Stories</h2>
              <div className="hidden sm:flex items-center gap-2">
                {newsSources.slice(0, 3).map((source, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${source.color}`}>
                    {source.name}
                  </span>
                ))}
                <span className="text-slate-500 text-xs">+3 more</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {lastUpdated ? (
                <>Auto-refreshes twice daily • Last updated: {new Date(lastUpdated).toLocaleString()}</>
              ) : (
                <>Auto-refreshes twice daily (6 AM & 6 PM UTC)</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshNews}
              disabled={refreshingNews}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingNews ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshingNews ? 'Refreshing...' : 'Refresh News'}</span>
            </button>
            <button
              onClick={() => navigate('/news')}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm sm:text-base"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>



        {stories.length > 0 && (

          <div className="space-y-6 sm:space-y-8">
            {/* Featured Story + Top 3 */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <StoryCard
                story={stories[0]}
                variant="featured"
                isBookmarked={bookmarks.includes(stories[0].id)}
                onToggleBookmark={toggleBookmark}
                onClick={() => {
                  if (stories[0].link) {
                    window.open(stories[0].link, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate('/news');
                  }
                }}
              />
              <div className="grid gap-3 sm:gap-4">
                {stories.slice(1, 4).map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    variant="compact"
                    isBookmarked={bookmarks.includes(story.id)}
                    onToggleBookmark={toggleBookmark}
                    onClick={() => {
                      if (story.link) {
                        window.open(story.link, '_blank', 'noopener,noreferrer');
                      } else {
                        navigate('/news');
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Additional Stories Grid - Stories 5-12 */}
            {stories.length > 4 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stories.slice(4, 12).map((story) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      if (story.link) {
                        window.open(story.link, '_blank', 'noopener,noreferrer');
                      } else {
                        navigate('/news');
                      }
                    }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="relative h-24 sm:h-32 overflow-hidden">
                      <img
                        src={story.image_url || fallbackStories[0].image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <span className="absolute top-2 left-2 px-1.5 sm:px-2 py-0.5 bg-cyan-500/20 backdrop-blur-sm text-cyan-400 text-[10px] sm:text-xs rounded-full">
                        {story.category}
                      </span>
                    </div>
                    <div className="p-2 sm:p-3">
                      <h3 className="font-medium text-white text-xs sm:text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors mb-1 sm:mb-2">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-400">
                        <span className="truncate">{story.source}</span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{new Date(story.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

      {/* Top Ranked Stocks Section - Full Rankings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Top Ranked Stocks</h2>
            <p className="text-slate-400 text-sm">Complete rankings - tap any stock for details{isAdmin && ' • Click edit to modify ratings'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAddCustomStockModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Custom Stock</span>
              </button>
            )}
            <button
              onClick={() => navigate('/industries')}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stock Rankings Table - Mobile Optimized */}
        <div className="bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-700 overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">#</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Stock</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400 hidden sm:block" />
                      Health
                    </div>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400 hidden sm:block" />
                      Perf
                    </div>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 hidden sm:block" />
                      Overall
                    </div>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Tier</th>
                  {isAdmin && (
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Edit</th>
                  )}
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {displayedStocks.map((stock, index) => {
                  const hasOverride = !!ratingOverrides[stock.symbol];
                  return (
                    <React.Fragment key={stock.symbol}>
                      <tr 
                        className={`hover:bg-slate-700/30 transition-colors cursor-pointer group ${
                          stock.tier === 'lowest' ? 'bg-red-500/5' : ''
                        } ${expandedStock === stock.symbol ? 'bg-slate-700/50' : ''}`}
                        onClick={() => navigate(`/stocks/${stock.symbol}`)}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold ${
                            index < 3 ? 'bg-amber-500/20 text-amber-400' : 
                            index < 10 ? 'bg-cyan-500/20 text-cyan-400' : 
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                              <span className="font-mono font-bold text-cyan-400 text-[10px] sm:text-xs">{stock.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="font-semibold text-white text-xs sm:text-sm">{stock.symbol}</p>
                                {hasOverride && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Custom rating" />
                                )}
                              </div>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[60px] sm:max-w-[120px]">{stock.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className="font-bold text-pink-400 text-xs sm:text-sm">{stock.companyHealth.toFixed(1)}</span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className="font-bold text-cyan-400 text-xs sm:text-sm">
                            {stock.symbol === 'CRWV' ? 'N/A' : stock.companyPerformance.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className={`font-bold text-sm sm:text-lg ${getOverallRatingColor(stock.overall)}`}>
                            {stock.overall.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${getTierColor(stock.tier)}`}>
                            {stock.tier}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <button
                              onClick={(e) => handleEditStock(stock, e)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              title="Edit ratings"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        </td>
                      </tr>

                    </React.Fragment>
                  );
                })}

              </tbody>
            </table>
          </div>
          
          {/* Show More/Less Button */}
          <div className="p-3 sm:p-4 border-t border-slate-700">
            <button
              onClick={() => setShowAllStocks(!showAllStocks)}
              className="w-full py-2 text-center text-cyan-400 hover:text-cyan-300 font-medium transition-colors text-sm"
            >
              {showAllStocks ? `Show Less (Top 20)` : `Show All ${stockRatings.length} Stocks`}
            </button>
          </div>
        </div>
      </section>

      {/* Edit Stock Rating Modal */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <span className="font-mono font-bold text-cyan-400 text-sm">{editingStock.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit {editingStock.symbol}</h3>
                  <p className="text-xs text-slate-400">{editingStock.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStock(null)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Company Health */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  Company Health
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={editFormData.companyHealth}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, companyHealth: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm"
                  placeholder="0.0 - 5.0"
                />
                <p className="text-xs text-slate-500 mt-1">Original: {staticStockRatings.find(s => s.symbol === editingStock.symbol)?.companyHealth.toFixed(1)}</p>
              </div>

              {/* Company Performance */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Company Performance
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={editFormData.companyPerformance}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, companyPerformance: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  placeholder="0.0 - 5.0"
                />
                <p className="text-xs text-slate-500 mt-1">Original: {staticStockRatings.find(s => s.symbol === editingStock.symbol)?.companyPerformance.toFixed(1)}</p>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Overall Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={editFormData.overall}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, overall: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  placeholder="0.0 - 10.0"
                />
                <p className="text-xs text-slate-500 mt-1">Original: {staticStockRatings.find(s => s.symbol === editingStock.symbol)?.overall.toFixed(1)}</p>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tier
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, tier }))}
                      className={`px-2 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        editFormData.tier === tier
                          ? getTierColor(tier) + ' ring-2 ring-offset-2 ring-offset-slate-800'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">Original: {staticStockRatings.find(s => s.symbol === editingStock.symbol)?.tier}</p>
              </div>


              {/* Info about custom ratings */}
              {ratingOverrides[editingStock.symbol] && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-xs text-amber-400">This stock has custom ratings applied</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-slate-700">
              <button
                onClick={handleResetToDefault}
                disabled={savingRating || !ratingOverrides[editingStock.symbol]}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </button>
              <button
                onClick={handleSaveRating}
                disabled={savingRating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 text-sm"
              >
                {savingRating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingRating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Stock Modal */}
      {showAddCustomStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Custom Stock</h3>
                  <p className="text-xs text-slate-400">Add a new stock to the ratings list</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomStockModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stock Symbol <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customStockForm.symbol}
                  onChange={(e) => setCustomStockForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm uppercase"
                  placeholder="e.g., AAPL"
                  maxLength={10}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customStockForm.name}
                  onChange={(e) => setCustomStockForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                  placeholder="e.g., Apple Inc."
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Industry
                </label>
                <select
                  value={customStockForm.industry}
                  onChange={(e) => setCustomStockForm(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  {industries.filter(i => i !== 'All Industries').map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              {/* Ratings Row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Company Health */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-2">
                    <Heart className="w-3 h-3 text-pink-400" />
                    Health
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={customStockForm.companyHealth}
                    onChange={(e) => setCustomStockForm(prev => ({ ...prev, companyHealth: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm"
                    placeholder="0-5"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">0.0 - 5.0</p>
                </div>

                {/* Company Performance */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-2">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Perf
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={customStockForm.companyPerformance}
                    onChange={(e) => setCustomStockForm(prev => ({ ...prev, companyPerformance: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                    placeholder="0-5"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">0.0 - 5.0</p>
                </div>

                {/* Overall Rating */}
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-2">
                    <Star className="w-3 h-3 text-amber-400" />
                    Overall
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={customStockForm.overall}
                    onChange={(e) => setCustomStockForm(prev => ({ ...prev, overall: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                    placeholder="0-10"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">0.0 - 10.0</p>
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tier
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setCustomStockForm(prev => ({ ...prev, tier }))}
                      className={`px-2 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                        customStockForm.tier === tier
                          ? getTierColor(tier) + ' ring-2 ring-offset-2 ring-offset-slate-800'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Metric Scores */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Health Metric Scores (1-5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'epsScore', label: 'EPS', icon: <DollarSign className="w-3 h-3 text-emerald-400" /> },
                    { key: 'peScore', label: 'P/E', icon: <BarChart3 className="w-3 h-3 text-blue-400" /> },
                    { key: 'deScore', label: 'D/E', icon: <PieChart className="w-3 h-3 text-purple-400" /> },
                    { key: 'fcfScore', label: 'FCF', icon: <Wallet className="w-3 h-3 text-amber-400" /> },
                    { key: 'marginScore', label: 'Margin', icon: <Percent className="w-3 h-3 text-cyan-400" /> },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {icon}
                        <span className="text-[10px] text-slate-400">{label}</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={customStockForm[key as keyof typeof customStockForm]}
                        onChange={(e) => {
                          const val = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                          setCustomStockForm(prev => ({ ...prev, [key]: val.toString() }));
                        }}
                        className="w-full px-1 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Each score from 1 (worst) to 5 (best)</p>
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Price (optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customStockForm.currentPrice}
                    onChange={(e) => setCustomStockForm(prev => ({ ...prev, currentPrice: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Validation Info */}
              <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl">
                <p className="text-xs text-slate-400">
                  <span className="text-red-400">*</span> Required fields. The stock will be added to the ratings list and will appear on the Industries page and Screener page automatically.
                </p>
              </div>
            </div>



            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => setShowAddCustomStockModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomStock}
                disabled={addingCustomStock || !customStockForm.symbol.trim() || !customStockForm.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {addingCustomStock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Add Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="relative bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to Level Up Your Investing?
              </h2>
              <p className="text-slate-300 max-w-xl text-sm sm:text-base">
                Join thousands of investors who are already using The Club to make smarter investment decisions.
              </p>
            </div>

            <button
              onClick={() => navigate('/courses')}
              className="flex-shrink-0 px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all text-sm sm:text-base"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
    </StockRatingsContext.Provider>
  );
};

export default HomePage;

