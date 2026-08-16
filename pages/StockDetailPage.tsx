import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  Wallet,
  Percent,
  RefreshCw,
  Clock,
  Activity,
  Users,
  MapPin,
  Calendar,
  Globe,
  Info,
  Wifi,
  WifiOff,
  Database,
  CalendarDays,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CircularProgress from '@/components/ui/CircularProgress';
import StockChart from '@/components/ui/StockChart';
import { useStockQuote, useStockHistory, useStockIntraday, clearStockCache, getStockCacheStats } from '@/hooks/useStockData';
import { StockWithRating, StockHealthBreakdown } from '@/types';
import { 
  getStockRating, 
  getStockWithPrice,
  getSimulatedPrice,
  getLastPriceUpdate,
  healthMetricExplanations, 
  getScoreColor, 
  getTierColor,
  getOverallRatingColor,
  stockRatings as staticStockRatings
} from '@/data/stockRatings';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  created_at: string;
}

interface EarningsHistoryItem {
  fiscalDateEnding: string;
  reportedDate: string;
  reportedEPS: number;
  estimatedEPS: number;
  surprise: number;
  surprisePercentage: number;
}

const StockDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stock, setStock] = useState<StockWithRating | null>(null);
  const [healthBreakdown, setHealthBreakdown] = useState<StockHealthBreakdown | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showMetricsInfo, setShowMetricsInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M'>('1M');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(getLastPriceUpdate());
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistoryItem[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [ratingOverride, setRatingOverride] = useState<StockRatingOverride | null>(null);
  const [customStock, setCustomStock] = useState<CustomStock | null>(null);

  // Get stock rating from local data
  const baseStockRatingData = getStockRating(id || '');
  
  // If not in static data, check if it's a custom stock
  const customStockRatingData = customStock ? {
    symbol: customStock.symbol,
    name: customStock.name,
    companyHealth: Number(customStock.company_health),
    companyPerformance: Number(customStock.company_performance),
    overall: Number(customStock.overall),
    tier: customStock.tier as 'top' | 'high' | 'mid-high' | 'mid' | 'lower' | 'lowest',
    industry: customStock.industry,
    currentPrice: customStock.current_price || 0,
    healthMetrics: { epsScore: 3, peScore: 3, deScore: 3, fcfScore: 3, marginScore: 3 },
    companyInfo: { description: 'Custom stock added by admin', founded: 'N/A', headquarters: 'N/A', ceo: 'N/A', employees: 'N/A', website: '' }
  } : null;
  
  // Apply rating override if exists (for static stocks) - including tier from localStorage
  const getLocalTier = (): string | null => {
    try {
      const stored = localStorage.getItem('stock_tier_overrides');
      const tiers = stored ? JSON.parse(stored) : {};
      return tiers[id?.toUpperCase() || ''] || null;
    } catch { return null; }
  };
  
  const localTierOverride = getLocalTier();
  const validTiers = ['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'] as const;
  
  const stockRatingData = baseStockRatingData && ratingOverride ? {
    ...baseStockRatingData,
    companyHealth: ratingOverride.company_health != null ? Number(ratingOverride.company_health) : baseStockRatingData.companyHealth,
    companyPerformance: ratingOverride.company_performance != null ? Number(ratingOverride.company_performance) : baseStockRatingData.companyPerformance,
    overall: ratingOverride.overall != null ? Number(ratingOverride.overall) : baseStockRatingData.overall,
    tier: (ratingOverride.tier && validTiers.includes(ratingOverride.tier as any) ? ratingOverride.tier as typeof validTiers[number] : null)
      || (localTierOverride && validTiers.includes(localTierOverride as any) ? localTierOverride as typeof validTiers[number] : null)
      || baseStockRatingData.tier
  } : baseStockRatingData ? {
    ...baseStockRatingData,
    tier: (localTierOverride && validTiers.includes(localTierOverride as any) ? localTierOverride as typeof validTiers[number] : baseStockRatingData.tier)
  } : (baseStockRatingData || customStockRatingData);

  
  // Get simulated price data (updated hourly) as fallback
  const simulatedPriceData = stockRatingData 
    ? getSimulatedPrice(stockRatingData.currentPrice, stockRatingData.symbol)
    : null;


  const { 
    quote, 
    loading: quoteLoading, 
    error: quoteError, 
    isCached: quoteCached,
    cacheAge,
    refetch: refetchQuote 
  } = useStockQuote(stockRatingData?.symbol || stock?.ticker);
  
  const { 
    history, 
    loading: historyLoading, 
    error: historyError, 
    isCached: historyCached,
    refetch: refetchHistory 
  } = useStockHistory(stockRatingData?.symbol || stock?.ticker);
  
  const { 
    intraday, 
    loading: intradayLoading, 
    isCached: intradayCached,
    refetch: refetchIntraday 
  } = useStockIntraday(stockRatingData?.symbol || stock?.ticker);

  // Cache stats
  const cacheStats = getStockCacheStats();

  useEffect(() => {
    if (id) {
      fetchStock();
      fetchRatingOverride();
    }
  }, [id, user]);

  // Fetch rating override for this stock
  const fetchRatingOverride = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_rating_overrides')
        .select('*')
        .eq('symbol', id.toUpperCase())
        .maybeSingle();
      
      if (data && !error) {
        setRatingOverride(data);
      }
    } catch (e) {
      console.warn('Failed to fetch rating override:', e);
    }
  };

  // Auto-refresh price every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const newUpdate = getLastPriceUpdate();
      if (newUpdate !== lastUpdate) {
        setLastUpdate(newUpdate);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastUpdate]);


  const fetchStock = async () => {
    // Check if id is a stock symbol (not a UUID)
    const isStockSymbol = id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    try {
      // If using local stock data (stock symbol), skip database queries that expect UUIDs
      if (isStockSymbol) {

        // Using local data, no database queries needed
        setLoading(false);
        return;
      }

      // First try to get from database (only if id is a UUID)
      const query = supabase
        .from('stocks')
        .select(`
          *,
          stock_ratings (*),
          stock_daily_performance (daily_change_percent)
        `)
        .eq('id', id)
        .single();

      if (typeof query.then === 'function') {
        const { data: stockData } = await query;

        if (stockData) {
          const formattedStock = {
            ...stockData,
            rating: stockData.stock_ratings?.[0],
            daily_change: stockData.stock_daily_performance?.[0]?.daily_change_percent,
            health_score: stockData.stock_ratings?.[0]
              ? (stockData.stock_ratings[0].financial_health_score + stockData.stock_ratings[0].profitability_score) / 2
              : 0,
            performance_score: stockData.stock_ratings?.[0]
              ? (stockData.stock_ratings[0].growth_score + stockData.stock_ratings[0].value_score + stockData.stock_ratings[0].sentiment_score) / 3
              : 0
          };
          setStock(formattedStock);
        }

        // Only query health breakdown if id is a UUID
        const { data: breakdownData } = await supabase
          .from('stock_health_breakdown')
          .select('*')
          .eq('stock_id', id)
          .maybeSingle();

        if (breakdownData) {
          setHealthBreakdown(breakdownData);
        }

        // Only query watchlist if id is a UUID
        if (user) {
          const { data: watchlistData } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('stock_id', id)
            .maybeSingle();

          setIsWatchlisted(!!watchlistData);
        }
      }
    } catch (error) {
      console.warn('Error fetching stock from database, using local data:', error);
    } finally {
      setLoading(false);
    }
  };





  const toggleWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isWatchlisted) {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('stock_id', id);
        setIsWatchlisted(false);
      } else {
        await supabase
          .from('watchlists')
          .insert({ user_id: user.id, stock_id: id });
        setIsWatchlisted(true);
      }
    } catch (error) {
      console.warn('Error toggling watchlist:', error);
    }
  };

  const formatMarketCap = (cap?: number) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (vol?: number) => {
    if (!vol) return 'N/A';
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
    return vol.toString();
  };

  const getChartData = () => {
    if (chartTimeframe === '1D' && intraday.length > 0) return intraday;
    if (chartTimeframe === '1W' && history.length > 0) return history.slice(-7);
    return history;
  };

  if (loading && !stockRatingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Use local rating data if available
  const displayStock = stockRatingData || stock;

  if (!displayStock) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Stock not found</h2>
          <button onClick={() => navigate('/industries')} className="text-cyan-400 hover:text-cyan-300">
            Back to Industries
          </button>
        </div>
      </div>
    );
  }

  // Priority: API quote > simulated price > base price
  const displayPrice = quote?.price || simulatedPriceData?.price || stockRatingData?.currentPrice || stock?.current_price;
  const displayChange = quote?.change ?? simulatedPriceData?.change;
  const displayChangePercent = quote?.changePercent ?? simulatedPriceData?.changePercent ?? stock?.daily_change;

  const healthMetrics = stockRatingData?.healthMetrics;
  const companyInfo = stockRatingData?.companyInfo;

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-mono font-bold text-white">
                  {stockRatingData?.symbol || stock?.ticker}
                </span>
                {stockRatingData && (
                  <Badge className={getTierColor(stockRatingData.tier)} variant="secondary">
                    {stockRatingData.tier.toUpperCase()}
                  </Badge>
                )}
                {quoteLoading && (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                )}
              </div>
              
              {/* Live Price Display */}
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-white">
                  ${displayPrice?.toFixed(2) || 'N/A'}
                </span>
                {displayChangePercent !== undefined && (
                  <span className={`flex items-center text-lg font-medium ${
                    displayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {displayChangePercent >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                    {displayChange !== undefined && (
                      <span className="mr-2">{displayChange >= 0 ? '+' : ''}${displayChange.toFixed(2)}</span>
                    )}
                    ({displayChangePercent >= 0 ? '+' : ''}{displayChangePercent.toFixed(2)}%)
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-white mb-2">
                {stockRatingData?.name || stock?.company_name}
              </h1>
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {stockRatingData?.industry || stock?.sector}
                </span>
                <span>{formatMarketCap(stock?.market_cap)}</span>
              </div>

              {quote?.latestTradingDay && (
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Clock className="w-3 h-3" />
                  Last updated: {new Date(quote.latestTradingDay).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  refetchQuote();
                  refetchHistory();
                  refetchIntraday();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${quoteLoading || historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to={`/compare?stocks=${stockRatingData?.symbol || stock?.ticker}`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                Compare
              </Link>
              {(companyInfo?.website || stock?.website) && (
                <a
                  href={companyInfo?.website || stock?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              )}
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isWatchlisted
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-pink-500/50 hover:text-pink-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Ratings Summary */}
        {stockRatingData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-emerald-400 mb-2">Company Health</h3>
                <p className={`text-4xl font-bold ${getOverallRatingColor(stockRatingData.companyHealth * 2)}`}>
                  {stockRatingData.companyHealth.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1">out of 5.0</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-cyan-400 mb-2">Company Performance</h3>
                <p className={`text-4xl font-bold ${getOverallRatingColor(stockRatingData.companyPerformance * 2)}`}>
                  {stockRatingData.companyPerformance.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1">out of 5.0</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-sm font-medium text-purple-400 mb-2">Overall Rating</h3>
                <p className={`text-4xl font-bold ${getOverallRatingColor(stockRatingData.overall)}`}>
                  {stockRatingData.overall.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400 mt-1">out of 10.0</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Live Market Data */}
        {quote && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Live Market Data</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">LIVE</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">Open</span>
                <p className="text-xl font-bold text-white">${quote.open.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">High</span>
                <p className="text-xl font-bold text-emerald-400">${quote.high.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">Low</span>
                <p className="text-xl font-bold text-red-400">${quote.low.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">Prev Close</span>
                <p className="text-xl font-bold text-white">${quote.previousClose.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">Volume</span>
                <p className="text-xl font-bold text-white">{formatVolume(quote.volume)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <span className="text-slate-400 text-sm">Day Range</span>
                <p className="text-sm font-medium text-white">${quote.low.toFixed(2)} - ${quote.high.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {quoteError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
            <p className="text-amber-400 text-sm">{quoteError}</p>
          </div>
        )}

        {/* Price Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Price Chart</h2>
            <div className="flex gap-2">
              {(['1D', '1W', '1M'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    chartTimeframe === tf
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          {historyLoading || intradayLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : historyError ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-amber-400">{historyError}</p>
            </div>
          ) : (
            <StockChart data={getChartData()} height={300} showVolume={true} />
          )}
        </div>

        {/* Company Info */}
        {companyInfo && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">About {stockRatingData?.name}</h2>
            <p className="text-slate-300 leading-relaxed mb-6">{companyInfo.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-400">Founded</p>
                  <p className="text-sm font-medium text-white">{companyInfo.founded}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-400">Headquarters</p>
                  <p className="text-sm font-medium text-white">{companyInfo.headquarters}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-400">Employees</p>
                  <p className="text-sm font-medium text-white">{companyInfo.employees}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-400">CEO</p>
                  <p className="text-sm font-medium text-white">{companyInfo.ceo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Metrics Breakdown */}
        {healthMetrics && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Company Health Breakdown</h2>
              <button
                onClick={() => setShowMetricsInfo(!showMetricsInfo)}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
              >
                <Info className="w-4 h-4" />
                {showMetricsInfo ? 'Hide explanations' : 'Show explanations'}
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { key: 'epsScore', label: 'EPS Score', metricKey: 'eps' },
                { key: 'peScore', label: 'P/E Score', metricKey: 'pe' },
                { key: 'deScore', label: 'D/E Score', metricKey: 'de' },
                { key: 'fcfScore', label: 'FCF Score', metricKey: 'fcf' },
                { key: 'marginScore', label: 'Margin Score', metricKey: 'margin' },
              ].map(({ key, label, metricKey }) => {
                const score = healthMetrics[key as keyof typeof healthMetrics];
                return (
                  <div 
                    key={key} 
                    className={`text-center p-4 rounded-xl cursor-pointer transition-all ${
                      expandedMetric === metricKey ? 'ring-2 ring-cyan-500' : ''
                    } ${getScoreColor(score)}`}
                    onClick={() => setExpandedMetric(expandedMetric === metricKey ? null : metricKey)}
                  >
                    <div className="text-3xl font-bold mb-1">{score}</div>
                    <p className="text-xs opacity-80">{label}</p>
                    <p className="text-[10px] opacity-60 mt-1">out of 5</p>
                  </div>
                );
              })}
            </div>

            {/* Metric Explanations */}
            {showMetricsInfo && (
              <div className="space-y-4 mt-6 pt-6 border-t border-slate-700">
                {Object.entries(healthMetricExplanations).map(([key, info]) => (
                  <div 
                    key={key} 
                    className={`p-4 rounded-xl transition-all ${
                      expandedMetric === key 
                        ? 'bg-cyan-500/10 border border-cyan-500/30' 
                        : 'bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        key === 'eps' ? 'bg-emerald-500/20' :
                        key === 'pe' ? 'bg-blue-500/20' :
                        key === 'de' ? 'bg-purple-500/20' :
                        key === 'fcf' ? 'bg-amber-500/20' :
                        'bg-cyan-500/20'
                      }`}>
                        {key === 'eps' && <DollarSign className="w-5 h-5 text-emerald-400" />}
                        {key === 'pe' && <BarChart3 className="w-5 h-5 text-blue-400" />}
                        {key === 'de' && <PieChart className="w-5 h-5 text-purple-400" />}
                        {key === 'fcf' && <Wallet className="w-5 h-5 text-amber-400" />}
                        {key === 'margin' && <Percent className="w-5 h-5 text-cyan-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{info.name}</h3>
                        <p className="text-slate-400 text-sm mb-2">{info.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Formula:</span>
                          <code className="text-xs bg-slate-800 px-2 py-1 rounded text-cyan-400">{info.formula}</code>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${getScoreColor(healthMetrics[`${key}Score` as keyof typeof healthMetrics])}`}>
                        {healthMetrics[`${key}Score` as keyof typeof healthMetrics]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Health Score Calculation */}
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Average Health Score</p>
                  <p className="text-xs text-slate-500">
                    ({healthMetrics.epsScore} + {healthMetrics.peScore} + {healthMetrics.deScore} + {healthMetrics.fcfScore} + {healthMetrics.marginScore}) / 5
                  </p>
                </div>
                <div className={`text-3xl font-bold ${getOverallRatingColor(stockRatingData?.companyHealth ? stockRatingData.companyHealth * 2 : 0)}`}>
                  {stockRatingData?.companyHealth.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Health Breakdown (if available) */}
        {healthBreakdown && !healthMetrics && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-6">Health Breakdown</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">EPS</span>
                  <span className="text-cyan-400 font-bold">{healthBreakdown.eps_score}/5</span>
                </div>
                <span className="text-xl font-bold text-white">${healthBreakdown.eps}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">P/E Ratio</span>
                  <span className="text-cyan-400 font-bold">{healthBreakdown.pe_score}/5</span>
                </div>
                <span className="text-xl font-bold text-white">{healthBreakdown.pe_ratio}x</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Debt/Equity</span>
                  <span className="text-cyan-400 font-bold">{healthBreakdown.de_score}/5</span>
                </div>
                <span className="text-xl font-bold text-white">{healthBreakdown.debt_to_equity}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Free Cash Flow</span>
                  <span className="text-cyan-400 font-bold">{healthBreakdown.fcf_score}/5</span>
                </div>
                <span className="text-xl font-bold text-white">{formatCurrency(healthBreakdown.free_cash_flow)}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Profit Margin</span>
                  <span className="text-cyan-400 font-bold">{healthBreakdown.margin_score}/5</span>
                </div>
                <span className="text-xl font-bold text-white">{healthBreakdown.profit_margin}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Rating Breakdown from Database */}
        {stock?.rating && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Performance Rating Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: 'Growth', value: stock.rating.growth_score, color: 'from-emerald-500 to-emerald-600' },
                { label: 'Value', value: stock.rating.value_score, color: 'from-blue-500 to-blue-600' },
                { label: 'Profitability', value: stock.rating.profitability_score, color: 'from-purple-500 to-purple-600' },
                { label: 'Financial Health', value: stock.rating.financial_health_score, color: 'from-amber-500 to-amber-600' },
                { label: 'Sentiment', value: stock.rating.sentiment_score, color: 'from-cyan-500 to-cyan-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="w-32 text-slate-400 text-sm">{item.label}</span>
                  <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-white font-bold">{item.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetailPage;
