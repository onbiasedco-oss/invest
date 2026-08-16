import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Save, Star, TrendingUp, TrendingDown, Heart, Zap, ChevronDown, ChevronUp, X, Check, Bookmark, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  industries, 
  getTierColor, 
  getOverallRatingColor,
  getScoreColor,
  StockRating 
} from '@/data/stockRatings';
import { useStockRatingsWithOverrides } from '@/hooks/useStockRatingsWithOverrides';
import GuestGate from '@/components/ui/GuestGate';

interface FilterPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  filters: FilterState;
}


interface FilterState {
  healthMin: number;
  healthMax: number;
  performanceMin: number;
  performanceMax: number;
  overallMin: number;
  overallMax: number;
  industries: string[];
  tiers: string[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

const defaultFilters: FilterState = {
  healthMin: 0,
  healthMax: 5,
  performanceMin: 0,
  performanceMax: 5,
  overallMin: 0,
  overallMax: 10,
  industries: [],
  tiers: [],
};

const presets: FilterPreset[] = [
  {
    id: 'top-performers',
    name: 'Top Performers',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Stocks with highest overall ratings (8+)',
    filters: {
      ...defaultFilters,
      overallMin: 8,
    },
  },
  {
    id: 'high-health',
    name: 'High Health',
    icon: <Heart className="w-4 h-4" />,
    description: 'Companies with strong financial health (4+)',
    filters: {
      ...defaultFilters,
      healthMin: 4,
    },
  },
  {
    id: 'undervalued',
    name: 'Undervalued',
    icon: <Zap className="w-4 h-4" />,
    description: 'High health but lower overall (potential value)',
    filters: {
      ...defaultFilters,
      healthMin: 3.5,
      overallMax: 7,
    },
  },
  {
    id: 'momentum',
    name: 'Momentum Plays',
    icon: <Star className="w-4 h-4" />,
    description: 'High performance stocks (4.5+)',
    filters: {
      ...defaultFilters,
      performanceMin: 4.5,
    },
  },
];

const tierOptions = ['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'];

export default function StockScreenerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'health' | 'performance' | 'name'>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use the shared hook that applies all overrides + custom stocks
  const { stockRatings, loading: ratingsLoading } = useStockRatingsWithOverrides();

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedStockFilters');
    if (saved) setSavedFilters(JSON.parse(saved));
  }, []);

  const filteredStocks = useMemo(() => {
    let result = stockRatings.filter(stock => {

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!stock.name.toLowerCase().includes(query) && 
            !stock.symbol.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Health filter
      if (stock.companyHealth < filters.healthMin || stock.companyHealth > filters.healthMax) {
        return false;
      }

      // Performance filter
      if (stock.companyPerformance < filters.performanceMin || stock.companyPerformance > filters.performanceMax) {
        return false;
      }

      // Overall filter
      if (stock.overall < filters.overallMin || stock.overall > filters.overallMax) {
        return false;
      }

      // Industry filter
      if (filters.industries.length > 0 && !filters.industries.includes(stock.industry)) {
        return false;
      }

      // Tier filter
      if (filters.tiers.length > 0 && !filters.tiers.includes(stock.tier)) {
        return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'overall':
          comparison = a.overall - b.overall;
          break;
        case 'health':
          comparison = a.companyHealth - b.companyHealth;
          break;
        case 'performance':
          comparison = a.companyPerformance - b.companyPerformance;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [searchQuery, filters, sortBy, sortOrder, stockRatings]);

  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  const applySavedFilter = (saved: SavedFilter) => {
    setFilters(saved.filters);
  };

  const saveCurrentFilter = () => {
    if (!saveFilterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveFilterName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedStockFilters', JSON.stringify(updated));
    setSaveFilterName('');
    setShowSaveModal(false);
  };

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedStockFilters', JSON.stringify(updated));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
  };

  const toggleIndustry = (industry: string) => {
    setFilters(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  const toggleTier = (tier: string) => {
    setFilters(prev => ({
      ...prev,
      tiers: prev.tiers.includes(tier)
        ? prev.tiers.filter(t => t !== tier)
        : [...prev.tiers, tier],
    }));
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <GuestGate showPreview={true} preMessage="Sign up to access the Stock Screener and advanced filtering tools">
    <div className="min-h-screen bg-slate-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Stock Screener</h1>
              <p className="text-slate-400 text-sm sm:text-base">Filter and discover stocks based on health, performance, and ratings</p>
            </div>
          </div>
        </div>

        {/* Preset Filters */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">Quick Filters</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {presets.map(preset => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                onClick={() => applyPreset(preset)}
              >
                {preset.icon}
                <span className="ml-1 sm:ml-2">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">Saved Filters</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {savedFilters.map(saved => (
                <div key={saved.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 text-xs sm:text-sm"
                    onClick={() => applySavedFilter(saved)}
                  >
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {saved.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 hover:text-red-400"
                    onClick={() => deleteSavedFilter(saved.id)}
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full bg-slate-800/50 border-slate-700 text-white"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filters Panel */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="bg-slate-800/50 border-slate-700 lg:sticky lg:top-4">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                    Filters
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-3 sm:pb-6">
                {/* Search */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                    <Input
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 sm:pl-10 bg-slate-900 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Health Range */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">
                    Company Health: {filters.healthMin.toFixed(1)} - {filters.healthMax.toFixed(1)}
                  </label>
                  <Slider
                    value={[filters.healthMin, filters.healthMax]}
                    onValueChange={([min, max]) => setFilters(prev => ({ ...prev, healthMin: min, healthMax: max }))}
                    min={0}
                    max={5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                {/* Performance Range */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">
                    Performance: {filters.performanceMin.toFixed(1)} - {filters.performanceMax.toFixed(1)}
                  </label>
                  <Slider
                    value={[filters.performanceMin, filters.performanceMax]}
                    onValueChange={([min, max]) => setFilters(prev => ({ ...prev, performanceMin: min, performanceMax: max }))}
                    min={0}
                    max={5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                {/* Overall Range */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">
                    Overall Rating: {filters.overallMin.toFixed(1)} - {filters.overallMax.toFixed(1)}
                  </label>
                  <Slider
                    value={[filters.overallMin, filters.overallMax]}
                    onValueChange={([min, max]) => setFilters(prev => ({ ...prev, overallMin: min, overallMax: max }))}
                    min={0}
                    max={10}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                {/* Industries */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">Industries</label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {industries.filter(i => i !== 'All Industries').map(industry => (
                      <Badge
                        key={industry}
                        variant={filters.industries.includes(industry) ? 'default' : 'outline'}
                        className={`cursor-pointer transition-all text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                          filters.industries.includes(industry)
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                        onClick={() => toggleIndustry(industry)}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tiers */}
                <div>
                  <label className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2 block">Tiers</label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tierOptions.map(tier => (
                      <Badge
                        key={tier}
                        variant={filters.tiers.includes(tier) ? 'default' : 'outline'}
                        className={`cursor-pointer capitalize transition-all text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                          filters.tiers.includes(tier)
                            ? getTierColor(tier as StockRating['tier'])
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                        onClick={() => toggleTier(tier)}
                      >
                        {tier}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 sm:pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs sm:text-sm"
                    onClick={resetFilters}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm"
                    onClick={() => setShowSaveModal(true)}
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <p className="text-slate-400 text-xs sm:text-base">
                Showing <span className="text-white font-medium">{filteredStocks.length}</span> stocks
              </p>
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
                <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap">Sort:</span>
                {(['overall', 'health', 'performance', 'name'] as const).map(field => (
                  <Button
                    key={field}
                    variant="ghost"
                    size="sm"
                    className={`capitalize text-xs sm:text-sm px-1.5 sm:px-3 py-1 ${sortBy === field ? 'text-cyan-400' : 'text-slate-400'}`}
                    onClick={() => toggleSort(field)}
                  >
                    {field === 'performance' ? 'Perf' : field}
                    {sortBy === field && (
                      sortOrder === 'desc' ? <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" /> : <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stock List */}
            <div className="space-y-2 sm:space-y-3">
              {filteredStocks.map((stock, index) => {
                return (
                  <Card 
                    key={stock.symbol} 
                    className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all"
                  >
                    <CardContent className="p-2.5 sm:p-4">
                      <div 
                        className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-2 sm:gap-4"
                        onClick={() => setExpandedStock(expandedStock === stock.symbol ? null : stock.symbol)}
                      >
                        {/* Left side: Rank, Symbol, Name */}
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-lg sm:text-2xl font-bold text-slate-500 w-6 sm:w-8">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-sm sm:text-lg font-bold text-white">{stock.symbol}</span>
                              <Badge className={`${getTierColor(stock.tier)} text-[10px] sm:text-xs`} variant="secondary">
                                {stock.tier}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm truncate">{stock.name}</p>
                          </div>
                        </div>
                        
                        {/* Right side: Scores and Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6">
                          {/* Scores - Mobile optimized grid */}
                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-slate-500 uppercase">Health</p>
                              <p className={`text-sm sm:text-lg font-bold ${getOverallRatingColor(stock.companyHealth * 2)}`}>
                                {stock.companyHealth.toFixed(1)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-slate-500 uppercase">Perf</p>
                              <p className={`text-sm sm:text-lg font-bold ${getOverallRatingColor(stock.companyPerformance * 2)}`}>
                                {stock.companyPerformance.toFixed(1)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-slate-500 uppercase">Overall</p>
                              <p className={`text-base sm:text-xl font-bold ${getOverallRatingColor(stock.overall)}`}>
                                {stock.overall.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Industry Badge - Hidden on mobile, shown on larger screens */}
                          <Badge variant="outline" className="border-slate-600 text-slate-300 hidden md:inline-flex text-xs">
                            {stock.industry}
                          </Badge>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Link to={`/stocks/${stock.symbol}`} onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs px-2 sm:px-3 py-1 h-7 sm:h-9">
                                <span className="hidden sm:inline">Details</span>
                                <span className="sm:hidden">View</span>
                              </Button>
                            </Link>
                            <Link to={`/compare?stocks=${stock.symbol}`} onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-2 h-7 sm:h-9">
                                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </Link>
                            <div className="text-slate-400">
                              {expandedStock === stock.symbol ? (
                                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section with Health Metrics */}
                      {expandedStock === stock.symbol && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700 space-y-4 sm:space-y-6">
                          {/* Industry Badge - Shown on mobile in expanded view */}
                          <div className="md:hidden">
                            <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {stock.industry}
                            </Badge>
                          </div>
                          
                          {/* Health Metrics Breakdown */}
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3">Health Metrics Breakdown</h4>
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-4">
                              {[
                                { key: 'epsScore', label: 'EPS' },
                                { key: 'peScore', label: 'P/E' },
                                { key: 'deScore', label: 'D/E' },
                                { key: 'fcfScore', label: 'FCF' },
                                { key: 'marginScore', label: 'Margin' },
                              ].map(({ key, label }) => (
                                <div key={key} className="text-center">
                                  <div className={`text-base sm:text-2xl font-bold rounded-lg py-1 sm:py-2 ${getScoreColor(stock.healthMetrics[key as keyof typeof stock.healthMetrics])}`}>
                                    {stock.healthMetrics[key as keyof typeof stock.healthMetrics]}
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{label}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Company Info */}
                          <div className="p-2 sm:p-3 bg-slate-900/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-slate-300">{stock.companyInfo.description}</p>
                            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400">
                              <span>Founded: {stock.companyInfo.founded}</span>
                              <span>HQ: {stock.companyInfo.headquarters}</span>
                              <span>CEO: {stock.companyInfo.ceo}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredStocks.length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-slate-400 text-sm sm:text-lg">No stocks match your filters</p>
                  <Button
                    variant="outline"
                    className="mt-3 sm:mt-4 border-slate-600 text-slate-300 text-sm"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Filter Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <CardTitle className="text-white text-base sm:text-lg">Save Filter</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Input
                  placeholder="Filter name..."
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white mb-3 sm:mb-4 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 text-sm"
                    onClick={() => setShowSaveModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
                    onClick={saveCurrentFilter}
                    disabled={!saveFilterName.trim()}
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </GuestGate>
  );
}

