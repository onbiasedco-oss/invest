import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Activity, 
  Star,
  BarChart3,
  Check,
  Trophy,
  ArrowRight,
  DollarSign,
  PieChart,
  Wallet,
  Percent,
  Info
} from 'lucide-react';
import { stockRatings as staticStockRatings, getStockRating, getOverallRatingColor, getTierColor, getScoreColor, healthMetricExplanations, StockRating } from '@/data/stockRatings';
import { Badge } from '@/components/ui/badge';
import { useStockRatingsWithOverrides } from '@/hooks/useStockRatingsWithOverrides';
import GuestGate from '@/components/ui/GuestGate';



interface ComparisonStock extends StockRating {
  livePrice?: number;
  change?: number;
  changePercent?: number;
}

const StockComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedStocks, setSelectedStocks] = useState<ComparisonStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMetricInfo, setShowMetricInfo] = useState<string | null>(null);

  // Use the shared hook that applies all overrides + custom stocks
  const { stockRatings } = useStockRatingsWithOverrides();

  // Load stocks from URL params on mount
  useEffect(() => {
    const stocksParam = searchParams.get('stocks');
    if (stocksParam && stockRatings.length > 0) {
      const symbols = stocksParam.split(',');
      const stocks = symbols
        .map(s => stockRatings.find(r => r.symbol.toUpperCase() === s.toUpperCase()))
        .filter(Boolean) as StockRating[];
      if (stocks.length > 0) {
        setSelectedStocks(stocks);
      }
    }
  }, [searchParams, stockRatings]);

  const filteredStocks = stockRatings.filter(stock => 
    (stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !selectedStocks.find(s => s.symbol === stock.symbol)
  );


  const addStock = (stock: StockRating) => {
    if (selectedStocks.length < 4 && !selectedStocks.find(s => s.symbol === stock.symbol)) {
      setSelectedStocks(prev => [...prev, { ...stock }]);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const removeStock = (symbol: string) => {
    setSelectedStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const getBestInCategory = (category: 'companyHealth' | 'companyPerformance' | 'overall') => {
    if (selectedStocks.length === 0) return null;
    return selectedStocks.reduce((best, stock) => 
      stock[category] > best[category] ? stock : best
    );
  };

  const getBestInMetric = (metric: keyof StockRating['healthMetrics']) => {
    if (selectedStocks.length === 0) return null;
    return selectedStocks.reduce((best, stock) => 
      stock.healthMetrics[metric] > best.healthMetrics[metric] ? stock : best
    );
  };

  const getRecommendation = () => {
    if (selectedStocks.length < 2) return null;
    
    const best = getBestInCategory('overall');
    const healthBest = getBestInCategory('companyHealth');
    const perfBest = getBestInCategory('companyPerformance');
    
    return { best, healthBest, perfBest };
  };

  const recommendation = getRecommendation();

  const getRatingBar = (value: number, max: number, color: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const metricIcons = {
    epsScore: <DollarSign className="w-4 h-4" />,
    peScore: <BarChart3 className="w-4 h-4" />,
    deScore: <PieChart className="w-4 h-4" />,
    fcfScore: <Wallet className="w-4 h-4" />,
    marginScore: <Percent className="w-4 h-4" />,
  };

  const metricLabels = {
    epsScore: 'EPS',
    peScore: 'P/E',
    deScore: 'D/E',
    fcfScore: 'FCF',
    marginScore: 'Margin',
  };

  return (
    <GuestGate showPreview={true} preMessage="Sign up to access the Stock Comparison Tool">
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Stock Comparison Tool</h1>
              <p className="text-slate-400">Compare up to 4 stocks side-by-side with detailed health metrics breakdown</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {selectedStocks.map((stock) => (
              <div 
                key={stock.symbol}
                className="flex items-center gap-3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="font-mono font-bold text-cyan-400">{stock.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{stock.symbol}</p>
                  <p className="text-xs text-slate-400">{stock.name}</p>
                </div>
                <button
                  onClick={() => removeStock(stock.symbol)}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {selectedStocks.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Stock ({selectedStocks.length}/4)
                </button>
                
                {showSearch && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search stocks..."
                          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredStocks.slice(0, 10).map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => addStock(stock)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                            <span className="font-mono text-xs font-bold text-cyan-400">{stock.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{stock.symbol}</p>
                            <p className="text-xs text-slate-400 truncate">{stock.name}</p>
                          </div>
                          <span className={`text-sm font-bold ${getOverallRatingColor(stock.overall)}`}>
                            {stock.overall.toFixed(1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedStocks.length < 2 && (
            <p className="text-slate-400 text-sm">Select at least 2 stocks to compare</p>
          )}
        </div>

        {/* Comparison Table */}
        {selectedStocks.length >= 2 && (
          <>
            {/* Ratings Comparison */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Ratings Comparison
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Metric</th>
                      {selectedStocks.map((stock) => (
                        <th key={stock.symbol} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-white">{stock.symbol}</span>
                            <Badge className={getTierColor(stock.tier)} variant="secondary">
                              {stock.tier}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {/* Company Health */}
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-400" />
                          <span className="text-white font-medium">Company Health</span>
                          <span className="text-xs text-slate-500">(1-5)</span>
                        </div>
                      </td>
                      {selectedStocks.map((stock) => {
                        const isBest = recommendation?.healthBest?.symbol === stock.symbol;
                        return (
                          <td key={stock.symbol} className="px-6 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isBest ? 'bg-pink-500/20 ring-2 ring-pink-500' : 'bg-pink-500/10'}`}>
                                <span className="font-bold text-pink-400 text-lg">{stock.companyHealth.toFixed(1)}</span>
                                {isBest && <Trophy className="w-4 h-4 text-pink-400" />}
                              </div>
                              {getRatingBar(stock.companyHealth, 5, 'bg-pink-500')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Company Performance */}
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span className="text-white font-medium">Company Performance</span>
                          <span className="text-xs text-slate-500">(1-5)</span>
                        </div>
                      </td>
                      {selectedStocks.map((stock) => {
                        const isBest = recommendation?.perfBest?.symbol === stock.symbol;
                        return (
                          <td key={stock.symbol} className="px-6 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isBest ? 'bg-cyan-500/20 ring-2 ring-cyan-500' : 'bg-cyan-500/10'}`}>
                                <span className="font-bold text-cyan-400 text-lg">{stock.companyPerformance.toFixed(1)}</span>
                                {isBest && <Trophy className="w-4 h-4 text-cyan-400" />}
                              </div>
                              {getRatingBar(stock.companyPerformance, 5, 'bg-cyan-500')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Overall Rating */}
                    <tr className="bg-slate-900/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="text-white font-medium">Overall Rating</span>
                          <span className="text-xs text-slate-500">(1-10)</span>
                        </div>
                      </td>
                      {selectedStocks.map((stock) => {
                        const isBest = recommendation?.best?.symbol === stock.symbol;
                        return (
                          <td key={stock.symbol} className="px-6 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isBest ? 'bg-amber-500/20 ring-2 ring-amber-500' : 'bg-slate-700'}`}>
                                <span className={`font-bold text-2xl ${getOverallRatingColor(stock.overall)}`}>
                                  {stock.overall.toFixed(1)}
                                </span>
                                {isBest && <Trophy className="w-5 h-5 text-amber-400" />}
                              </div>
                              {getRatingBar(stock.overall, 10, stock.overall >= 8 ? 'bg-emerald-500' : stock.overall >= 6 ? 'bg-blue-500' : 'bg-red-500')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Health Metrics Breakdown */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Health Metrics Breakdown
                  </h2>
                  <button
                    onClick={() => setShowMetricInfo(showMetricInfo ? null : 'all')}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    <Info className="w-4 h-4" />
                    {showMetricInfo ? 'Hide Info' : 'Show Info'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Metric</th>
                      {selectedStocks.map((stock) => (
                        <th key={stock.symbol} className="px-6 py-4 text-center">
                          <span className="font-bold text-white">{stock.symbol}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {(['epsScore', 'peScore', 'deScore', 'fcfScore', 'marginScore'] as const).map((metric) => {
                      const best = getBestInMetric(metric);
                      const metricKey = metric.replace('Score', '') as keyof typeof healthMetricExplanations;
                      const info = healthMetricExplanations[metricKey];
                      
                      return (
                        <React.Fragment key={metric}>
                          <tr>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">{metricIcons[metric]}</span>
                                <span className="text-white font-medium">{metricLabels[metric]} Score</span>
                                <span className="text-xs text-slate-500">(1-5)</span>
                              </div>
                            </td>
                            {selectedStocks.map((stock) => {
                              const score = stock.healthMetrics[metric];
                              const isBest = best?.symbol === stock.symbol;
                              return (
                                <td key={stock.symbol} className="px-6 py-4">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isBest ? 'ring-2 ring-emerald-500' : ''} ${getScoreColor(score)}`}>
                                      <span className="font-bold text-lg">{score}</span>
                                      {isBest && <Trophy className="w-4 h-4 text-emerald-400" />}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                          {showMetricInfo && (
                            <tr className="bg-slate-900/30">
                              <td colSpan={selectedStocks.length + 1} className="px-6 py-3">
                                <div className="text-sm">
                                  <p className="text-cyan-400 font-medium mb-1">{info.name}</p>
                                  <p className="text-slate-400">{info.description}</p>
                                  <p className="text-slate-500 text-xs mt-1">Formula: {info.formula}</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Comparison Chart */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Visual Comparison
              </h2>
              
              <div className="space-y-6">
                {/* Health Comparison */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-slate-300">Company Health</span>
                  </div>
                  <div className="space-y-2">
                    {selectedStocks.map((stock) => (
                      <div key={stock.symbol} className="flex items-center gap-4">
                        <span className="w-16 text-sm font-mono text-white">{stock.symbol}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-400 flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${(stock.companyHealth / 5) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{stock.companyHealth.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Performance Comparison */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-300">Company Performance</span>
                  </div>
                  <div className="space-y-2">
                    {selectedStocks.map((stock) => (
                      <div key={stock.symbol} className="flex items-center gap-4">
                        <span className="w-16 text-sm font-mono text-white">{stock.symbol}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ width: `${(stock.companyPerformance / 5) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{stock.companyPerformance.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Overall Comparison */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">Overall Rating</span>
                  </div>
                  <div className="space-y-2">
                    {selectedStocks.map((stock) => (
                      <div key={stock.symbol} className="flex items-center gap-4">
                        <span className="w-16 text-sm font-mono text-white">{stock.symbol}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                          <div 
                            className={`h-full flex items-center justify-end pr-2 transition-all duration-500 ${
                              stock.overall >= 8 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                              stock.overall >= 6 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                              'bg-gradient-to-r from-red-500 to-red-400'
                            }`}
                            style={{ width: `${(stock.overall / 10) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{stock.overall.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Summary */}
            {recommendation && (
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Recommendation Summary
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Best Overall */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">Best Overall</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center">
                        <span className="font-mono font-bold text-amber-400">{recommendation.best?.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{recommendation.best?.symbol}</p>
                        <p className="text-sm text-slate-400">{recommendation.best?.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getOverallRatingColor(recommendation.best?.overall || 0)}`}>
                        {recommendation.best?.overall.toFixed(1)}
                      </span>
                      <span className="text-slate-400">/10</span>
                    </div>
                  </div>
                  
                  {/* Best Health */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-pink-400" />
                      <span className="text-sm font-medium text-slate-300">Healthiest Company</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                        <span className="font-mono font-bold text-pink-400">{recommendation.healthBest?.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{recommendation.healthBest?.symbol}</p>
                        <p className="text-sm text-slate-400">{recommendation.healthBest?.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-pink-400">
                        {recommendation.healthBest?.companyHealth.toFixed(1)}
                      </span>
                      <span className="text-slate-400">/5</span>
                    </div>
                  </div>
                  
                  {/* Best Performance */}
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm font-medium text-slate-300">Best Performance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center">
                        <span className="font-mono font-bold text-cyan-400">{recommendation.perfBest?.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">{recommendation.perfBest?.symbol}</p>
                        <p className="text-sm text-slate-400">{recommendation.perfBest?.name}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-cyan-400">
                        {recommendation.perfBest?.companyPerformance.toFixed(1)}
                      </span>
                      <span className="text-slate-400">/5</span>
                    </div>
                  </div>
                </div>
                
                {/* Verdict */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                  <h3 className="font-semibold text-white mb-2">Analysis</h3>
                  <p className="text-slate-300">
                    Based on our comprehensive ratings, <span className="text-amber-400 font-semibold">{recommendation.best?.symbol}</span> leads 
                    with an overall score of {recommendation.best?.overall.toFixed(1)}/10. 
                    {recommendation.healthBest?.symbol !== recommendation.best?.symbol && (
                      <> However, <span className="text-pink-400 font-semibold">{recommendation.healthBest?.symbol}</span> shows 
                      stronger company fundamentals with a health score of {recommendation.healthBest?.companyHealth.toFixed(1)}/5.</>
                    )}
                    {recommendation.perfBest?.symbol !== recommendation.best?.symbol && recommendation.perfBest?.symbol !== recommendation.healthBest?.symbol && (
                      <> For growth-focused investors, <span className="text-cyan-400 font-semibold">{recommendation.perfBest?.symbol}</span> offers 
                      the best performance metrics at {recommendation.perfBest?.companyPerformance.toFixed(1)}/5.</>
                    )}
                  </p>
                </div>

                {/* Health Metrics Winner Summary */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                  <h3 className="font-semibold text-white mb-3">Health Metrics Winners</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {(['epsScore', 'peScore', 'deScore', 'fcfScore', 'marginScore'] as const).map((metric) => {
                      const best = getBestInMetric(metric);
                      return (
                        <div key={metric} className="text-center">
                          <p className="text-xs text-slate-400 mb-1">{metricLabels[metric]}</p>
                          <p className="font-bold text-cyan-400">{best?.symbol}</p>
                          <p className="text-xs text-slate-500">{best?.healthMetrics[metric]}/5</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Add Suggestions */}
        {selectedStocks.length < 4 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Popular Comparisons</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stocks: ['AAPL', 'MSFT', 'GOOGL'], label: 'Tech Giants' },
                { stocks: ['NVDA', 'AMD', 'AVGO'], label: 'Chip Makers' },
                { stocks: ['JPM', 'V', 'AXP'], label: 'Financials' },
                { stocks: ['AMZN', 'SHOP', 'MELI'], label: 'E-Commerce' },
              ].map((group) => (
                <button
                  key={group.label}
                  onClick={() => {
                    const stocks = group.stocks
                      .map(s => stockRatings.find(r => r.symbol === s))
                      .filter(Boolean) as StockRating[];
                    setSelectedStocks(stocks);
                  }}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all text-left group"
                >
                  <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">{group.label}</p>
                  <p className="text-sm text-slate-400">{group.stocks.join(' vs ')}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </GuestGate>
  );
};


export default StockComparePage;
