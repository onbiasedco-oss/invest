import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Building2, TrendingUp, ArrowRight, Star, Activity, Heart, X, ChevronDown, ChevronUp, GitCompare, DollarSign, BarChart3, PieChart, Wallet, Percent, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Industry, StockWithRating } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import StockCard from '@/components/ui/StockCard';
import { getStockRating, getOverallRatingColor, getTierColor, getScoreColor, StockRating, industries } from '@/data/stockRatings';
import GuestGate from '@/components/ui/GuestGate';
import { Badge } from '@/components/ui/badge';
import { useStockRatingsWithOverrides } from '@/hooks/useStockRatingsWithOverrides';


const IndustriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stocks, setStocks] = useState<StockWithRating[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'overall' | 'health' | 'performance' | 'name'>('overall');
  const [loading, setLoading] = useState(true);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // Use the shared hook that applies all overrides + custom stocks
  const { stockRatings: allStockRatings, loading: ratingsLoading } = useStockRatingsWithOverrides();

  const industriesWithCounts = (() => {
    const counts: Record<string, number> = {};
    allStockRatings.forEach(s => { counts[s.industry] = (counts[s.industry] || 0) + 1; });
    return Object.entries(counts).map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count);
  })();


  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all stocks with ratings
      const { data: stocksData } = await supabase
        .from('stocks')
        .select(`
          *,
          stock_ratings (*),
          stock_industries (industry_id)
        `)
        .order('company_name');

      if (stocksData) {
        const formattedStocks = stocksData.map((stock: any) => {
          const staticRating = getStockRating(stock.ticker);
          
          return {
            ...stock,
            rating: stock.stock_ratings?.[0],
            industry_ids: stock.stock_industries?.map((si: any) => si.industry_id) || [],
            health_score: staticRating?.companyHealth || (stock.stock_ratings?.[0]
              ? (stock.stock_ratings[0].financial_health_score + stock.stock_ratings[0].profitability_score) / 2
              : 0),
            performance_score: staticRating?.companyPerformance || (stock.stock_ratings?.[0]
              ? (stock.stock_ratings[0].growth_score + stock.stock_ratings[0].value_score + stock.stock_ratings[0].sentiment_score) / 3
              : 0),
            overall_score: staticRating?.overall || 0,
            tier: staticRating?.tier
          };
        });
        setStocks(formattedStocks);
      }

      // Fetch watchlist
      if (user) {
        const { data: watchlistData } = await supabase
          .from('watchlists')
          .select('stock_id')
          .eq('user_id', user.id);

        if (watchlistData) {
          setWatchlist(watchlistData.map(w => w.stock_id));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async (stockId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const isWatchlisted = watchlist.includes(stockId);

    if (isWatchlisted) {
      await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_id', stockId);
      setWatchlist(prev => prev.filter(id => id !== stockId));
    } else {
      await supabase
        .from('watchlists')
        .insert({ user_id: user.id, stock_id: stockId });
      setWatchlist(prev => [...prev, stockId]);
    }
  };

  // Filter and sort stocks from merged ratings (static + overrides + custom)
  const filteredRatedStocks = allStockRatings
    .filter((stock) => {
      const matchesSearch = 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = !selectedIndustry || stock.industry === selectedIndustry;
      return matchesSearch && matchesIndustry;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'health') return b.companyHealth - a.companyHealth;
      if (sortBy === 'performance') return b.companyPerformance - a.companyPerformance;
      return b.overall - a.overall;
    });


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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Stock Ratings</h1>
              <p className="text-slate-400 text-xs sm:text-sm lg:text-base max-w-2xl">
                Comprehensive ratings based on Health, Performance, and Overall scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/screener"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-600 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Screener</span>
              </Link>
              <button
                onClick={() => navigate('/compare')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <GuestGate showPreview={true} preMessage="Sign up to access detailed stock ratings and industry analysis">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Industries Filter - Horizontal Scroll on Mobile */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-sm sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            Browse by Industry
          </h2>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-2 min-w-max sm:flex-wrap">
              <button
                onClick={() => setSelectedIndustry(null)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  !selectedIndustry
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All ({allStockRatings.length})
              </button>

              {industriesWithCounts.map(({ industry, count }) => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    selectedIndustry === industry
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {industry} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rating Legend - Collapsible on Mobile */}
        <details className="mb-4 sm:mb-8 bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-700 group">
          <summary className="p-3 sm:p-6 cursor-pointer list-none flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              Rating System
            </h3>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-3 pb-3 sm:px-6 sm:pb-6 pt-0">
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400" />
                  <span className="text-xs sm:text-sm font-medium text-white">Company Health</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">EPS, P/E, D/E, FCF, Margin (1-5)</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-medium text-white">Performance</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">Growth, momentum, position (1-5)</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-medium text-white">Overall</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">Combined quality score (1-10)</p>
              </div>
            </div>
          </div>
        </details>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks..."
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm sm:text-base text-white focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="overall">Overall</option>
              <option value="health">Health</option>
              <option value="performance">Performance</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <p className="text-slate-400 text-xs sm:text-sm">
            <span className="text-white font-medium">{filteredRatedStocks.length}</span> stocks
            {selectedIndustry && <span className="hidden sm:inline"> in <span className="text-cyan-400">{selectedIndustry}</span></span>}
          </p>
        </div>

        {/* Stocks Table - Mobile Optimized */}
        <div className="bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">#</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Stock</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <span className="hidden sm:inline">Health</span>
                    <Heart className="w-3 h-3 text-pink-400 sm:hidden mx-auto" />
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <span className="hidden sm:inline">Perf</span>
                    <Activity className="w-3 h-3 text-cyan-400 sm:hidden mx-auto" />
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
                    <span className="hidden sm:inline">Overall</span>
                    <Star className="w-3 h-3 text-amber-400 sm:hidden mx-auto" />
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Tier</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-slate-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredRatedStocks.map((stock, index) => (
                  <React.Fragment key={stock.symbol}>
                    <tr 
                      className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${
                        stock.tier === 'lowest' ? 'bg-red-500/5' : ''
                      } ${expandedStock === stock.symbol ? 'bg-slate-700/50' : ''}`}
                      onClick={() => toggleExpand(stock.symbol)}
                    >
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                        <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full text-[10px] sm:text-xs lg:text-sm font-bold ${
                          index < 3 ? 'bg-amber-500/20 text-amber-400' : 
                          index < 10 ? 'bg-cyan-500/20 text-cyan-400' : 
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-mono font-bold text-cyan-400 text-[10px] sm:text-xs lg:text-sm">{stock.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-xs sm:text-sm lg:text-base">{stock.symbol}</p>
                            <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate max-w-[80px] sm:max-w-[150px] lg:max-w-[200px]">{stock.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center">
                        <span className="font-bold text-pink-400 text-xs sm:text-sm">{stock.companyHealth.toFixed(1)}</span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center">
                        <span className="font-bold text-cyan-400 text-xs sm:text-sm">{stock.companyPerformance.toFixed(1)}</span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center">
                        <span className={`font-bold text-sm sm:text-base lg:text-lg ${getOverallRatingColor(stock.overall)}`}>
                          {stock.overall.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${getTierColor(stock.tier)}`}>
                          {stock.tier}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-center">
                        {expandedStock === stock.symbol ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedStock === stock.symbol && (
                      <tr className="bg-slate-800/80">
                        <td colSpan={7} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
                          <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
                            {/* Company Health Breakdown */}
                            <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-700">
                              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                                <h4 className="font-semibold text-white text-xs sm:text-sm">Health Breakdown</h4>
                                <span className="ml-auto text-base sm:text-2xl font-bold text-pink-400">{stock.companyHealth.toFixed(1)}/5</span>
                              </div>
                              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
                                {[
                                  { key: 'epsScore', label: 'EPS' },
                                  { key: 'peScore', label: 'P/E' },
                                  { key: 'deScore', label: 'D/E' },
                                  { key: 'fcfScore', label: 'FCF' },
                                  { key: 'marginScore', label: 'Margin' },
                                ].map(({ key, label }) => {
                                  const score = stock.healthMetrics[key as keyof typeof stock.healthMetrics];
                                  return (
                                    <div key={key} className={`text-center p-1.5 sm:p-3 rounded-lg ${getScoreColor(score)}`}>
                                      <span className="text-[8px] sm:text-[10px] block mb-0.5 opacity-80">{label}</span>
                                      <div className="text-sm sm:text-xl font-bold">{score}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Company Performance Breakdown */}
                            <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-700">
                              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                                <h4 className="font-semibold text-white text-xs sm:text-sm">Performance</h4>
                                <span className="ml-auto text-base sm:text-2xl font-bold text-cyan-400">{stock.companyPerformance.toFixed(1)}/5</span>
                              </div>
                              <div className="space-y-2 sm:space-y-3">
                                {[
                                  { label: 'Revenue Growth', factor: 0.95 },
                                  { label: 'Momentum', factor: 1.02 },
                                  { label: 'Position', factor: 0.98 },
                                ].map(({ label, factor }) => (
                                  <div key={label}>
                                    <div className="flex justify-between text-[10px] sm:text-sm mb-1">
                                      <span className="text-slate-400">{label}</span>
                                      <span className="text-cyan-400">{Math.min(stock.companyPerformance * factor, 5).toFixed(1)}</span>
                                    </div>
                                    {getRatingBar(stock.companyPerformance * factor, 5, 'bg-cyan-500')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                            <Link
                              to={`/stocks/${stock.symbol}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-700 text-white rounded-lg text-xs sm:text-sm hover:bg-slate-600 transition-all"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              Details
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/compare?stocks=${stock.symbol}`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs sm:text-sm hover:bg-cyan-500/30 transition-all"
                            >
                              <GitCompare className="w-3 h-3 sm:w-4 sm:h-4" />
                              Compare
                            </button>
                            <span className="text-[10px] sm:text-xs text-slate-500">{stock.industry}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && !ratingsLoading && filteredRatedStocks.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">No stocks found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
      </GuestGate>
    </div>

  );
};

export default IndustriesPage;
