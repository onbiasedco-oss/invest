import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, TrendingUp, TrendingDown, Bookmark, BarChart3, GraduationCap, BookOpen, ArrowRight, Sparkles, Home, Settings, LogOut, Menu, X, ExternalLink, Clock } from 'lucide-react';

interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  sector?: string;
  market_cap?: number;
  health_score?: number;
  performance_score?: number;
  daily_change?: number;
  rank_position?: number;
}

interface Story {
  id: string;
  title: string;
  summary?: string;
  source?: string;
  image_url?: string;
  category: string;
  published_at: string;
  link?: string;
}

interface Industry {
  id: string;
  name: string;
  description?: string;
}

// Fallback data when database is unavailable
const fallbackStocks: Stock[] = [
  { id: '1', ticker: 'AAPL', company_name: 'Apple Inc.', sector: 'Technology', market_cap: 3000000000000, health_score: 4.5, performance_score: 4.2, daily_change: 1.25, rank_position: 1 },
  { id: '2', ticker: 'MSFT', company_name: 'Microsoft Corporation', sector: 'Technology', market_cap: 2800000000000, health_score: 4.6, performance_score: 4.4, daily_change: 0.85, rank_position: 2 },
  { id: '3', ticker: 'GOOGL', company_name: 'Alphabet Inc.', sector: 'Technology', market_cap: 1900000000000, health_score: 4.3, performance_score: 4.1, daily_change: -0.45, rank_position: 3 },
  { id: '4', ticker: 'AMZN', company_name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', market_cap: 1800000000000, health_score: 4.2, performance_score: 4.0, daily_change: 2.15, rank_position: 4 },
  { id: '5', ticker: 'NVDA', company_name: 'NVIDIA Corporation', sector: 'Technology', market_cap: 1200000000000, health_score: 4.8, performance_score: 4.7, daily_change: 3.45, rank_position: 5 },
  { id: '6', ticker: 'META', company_name: 'Meta Platforms Inc.', sector: 'Technology', market_cap: 900000000000, health_score: 4.1, performance_score: 4.3, daily_change: -1.20, rank_position: 6 },
  { id: '7', ticker: 'TSLA', company_name: 'Tesla Inc.', sector: 'Consumer Cyclical', market_cap: 800000000000, health_score: 3.8, performance_score: 4.5, daily_change: 4.50, rank_position: 7 },
  { id: '8', ticker: 'BRK.B', company_name: 'Berkshire Hathaway', sector: 'Financial Services', market_cap: 750000000000, health_score: 4.7, performance_score: 3.9, daily_change: 0.35, rank_position: 8 },
];

const fallbackStories: Story[] = [
  { id: '1', title: 'Fed Cuts Rates by 0.25%, Powell Warns of Uncertain Path Ahead', summary: 'The Federal Reserve cut interest rates by 25 basis points to 4.25-4.50%, marking the third cut of the year.', source: 'CNBC', category: 'Economy', published_at: '2025-12-22T10:00:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg', link: 'https://www.cnbc.com/2025/12/10/fed-interest-rate-decision-december-2025-.html' },
  { id: '2', title: 'Nvidia Leads Chip Rally After Micron Backs AI Investment Cycle', summary: 'NVIDIA shares rose as strong earnings from Micron eased investor worries about AI spending.', source: 'Yahoo Finance', category: 'Technology', published_at: '2025-12-22T09:15:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374378127_dc649748.png', link: 'https://finance.yahoo.com/news/why-nvidia-stock-rising-today-160826749.html' },
  { id: '3', title: 'Tesla Stock Closes at Record as Robotaxi Hype Builds', summary: 'Tesla shares reached an all-time closing high of $489.88 as CEO Elon Musk revealed driverless vehicle testing.', source: 'CNBC', category: 'Automotive', published_at: '2025-12-21T16:45:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374374324_c1cdc246.jpg', link: 'https://www.cnbc.com/2025/12/16/tesla-stock-hits-record-on-robotaxi-hype-despite-drop-in-ev-sales.html' },
  { id: '4', title: 'Google Releases More Efficient Gemini 3 AI Model', summary: 'Alphabet unveiled Gemini 3 Flash, outperforming competitors in benchmark tests.', source: 'Bloomberg', category: 'Technology', published_at: '2025-12-21T14:20:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374368791_f0802509.jpg', link: 'https://www.bloomberg.com/news/articles/2025-12-17/google-releases-more-efficient-gemini-3-ai-model-across-products' },
  { id: '5', title: 'Bitcoin Could Hit $200,000 in 2026, Arthur Hayes Predicts', summary: 'BitMEX co-founder says Bitcoin\'s current pause masks a powerful liquidity-driven move.', source: 'Yahoo Finance', category: 'Crypto', published_at: '2025-12-21T11:00:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374373624_edf089d2.jpg', link: 'https://finance.yahoo.com/news/bitcoin-hit-200-000-2026-043106493.html' },
  { id: '6', title: 'Apple Punted on AI This Year, Next Year Will Be Critical', summary: 'Apple delayed its new AI assistant upgrade to 2026. Analyst says Apple promised to "blow us away" next year.', source: 'CNBC', category: 'Technology', published_at: '2025-12-20T15:30:00Z', image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374371009_dc6d6a7e.jpg', link: 'https://www.cnbc.com/2025/12/17/apple-ai-delay-siri.html' },
];




const fallbackIndustries: Industry[] = [
  { id: '1', name: 'Technology', description: 'Software, hardware, and IT services' },
  { id: '2', name: 'Healthcare', description: 'Pharmaceuticals, biotech, and medical devices' },
  { id: '3', name: 'Financial Services', description: 'Banks, insurance, and investment firms' },
  { id: '4', name: 'Consumer Cyclical', description: 'Retail, automotive, and entertainment' },
  { id: '5', name: 'Energy', description: 'Oil, gas, and renewable energy' },
  { id: '6', name: 'Industrials', description: 'Manufacturing and construction' },
  { id: '7', name: 'Real Estate', description: 'REITs and property management' },
  { id: '8', name: 'Utilities', description: 'Electric, gas, and water services' },
];

// Safe database query helper
const safeQuery = async <T>(queryFn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> => {
  try {
    const result = await queryFn();
    if (result.error || !result.data) {
      console.warn('Database query returned error or no data, using fallback');
      return fallback;
    }
    return result.data;
  } catch (error) {
    console.warn('Database query failed, using fallback:', error);
    return fallback;
  }
};

const AppLayout: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedView, setSelectedView] = useState<'home' | 'stocks' | 'courses' | 'resources'>('home');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try to fetch stocks from database
      let stocksData: Stock[] = fallbackStocks;
      try {
        const query = supabase.from('stock_rankings');
        if (query && typeof query.select === 'function') {
          const { data: rankedStocks, error } = await query
            .select(`rank_position, stocks (*, stock_ratings (*), stock_daily_performance (daily_change_percent))`)
            .order('rank_position')
            .limit(10);

          if (rankedStocks && !error) {
            const formatted = rankedStocks
              .filter((item: any) => item.stocks)
              .map((item: any) => ({
                ...item.stocks,
                rank_position: item.rank_position,
                daily_change: item.stocks.stock_daily_performance?.[0]?.daily_change_percent,
                health_score: item.stocks.stock_ratings?.[0] ? (item.stocks.stock_ratings[0].financial_health_score + item.stocks.stock_ratings[0].profitability_score) / 2 : 0,
                performance_score: item.stocks.stock_ratings?.[0] ? (item.stocks.stock_ratings[0].growth_score + item.stocks.stock_ratings[0].value_score + item.stocks.stock_ratings[0].sentiment_score) / 3 : 0
              }));
            if (formatted.length > 0) {
              stocksData = formatted;
            }
          }
        }
      } catch (stockError) {
        console.warn('Failed to fetch stocks, using fallback:', stockError);
      }
      setStocks(stocksData);

      // Try to fetch stories from database
      let storiesData: Story[] = fallbackStories;
      try {
        const query = supabase.from('stories');
        if (query && typeof query.select === 'function') {
          const { data, error } = await query
            .select('*')
            .order('published_at', { ascending: false })
            .limit(6);
          if (data && !error && data.length > 0) {
            storiesData = data;
          }
        }
      } catch (storyError) {
        console.warn('Failed to fetch stories, using fallback:', storyError);
      }
      setStories(storiesData);

      // Try to fetch industries from database
      let industriesData: Industry[] = fallbackIndustries;
      try {
        const query = supabase.from('industries');
        if (query && typeof query.select === 'function') {
          const { data, error } = await query.select('*').order('name');
          if (data && !error && data.length > 0) {
            industriesData = data;
          }
        }
      } catch (industryError) {
        console.warn('Failed to fetch industries, using fallback:', industryError);
      }
      setIndustries(industriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use fallback data
      setStocks(fallbackStocks);
      setStories(fallbackStories);
      setIndustries(fallbackIndustries);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (id: string) => setWatchlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleBookmark = (id: string) => setBookmarks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const formatMarketCap = (cap?: number) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  };

  const navLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'stocks', label: 'Stocks', icon: BarChart3 },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">The <span className="text-cyan-400">Club</span></span>

            </div>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button key={link.id} onClick={() => setSelectedView(link.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedView === link.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <link.icon className="w-4 h-4" />{link.label}
                </button>
              ))}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button key={link.id} onClick={() => { setSelectedView(link.id as any); setMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium ${selectedView === link.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300'}`}>
                <link.icon className="w-5 h-5" />{link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      {selectedView === 'home' && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766367427775_8c819222.jpg" alt="Hero" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-6">
                <Sparkles className="w-4 h-4" />Your Investment Journey Starts Here
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Master the Markets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Expert Insights</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl">Access curated stock analysis, comprehensive courses, and real-time market data to make informed investment decisions.</p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setSelectedView('courses')} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all">Start Learning</button>
                <button onClick={() => setSelectedView('stocks')} className="px-6 py-3 bg-slate-800 text-white font-medium rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all">Explore Stocks</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            {/* Home View */}
            {selectedView === 'home' && (
              <>
                {/* Stories */}
                <section className="mb-16">
                  <h2 className="text-2xl font-bold text-white mb-6">Top Stories</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                      <div 
                        key={story.id} 
                        className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer"
                        onClick={() => {
                          if (story.link) {
                            window.open(story.link, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img src={story.image_url || 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766367447807_79f53980.png'} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                          <button onClick={(e) => { e.stopPropagation(); toggleBookmark(story.id); }} className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-all ${bookmarks.includes(story.id) ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white hover:text-amber-400'}`}>
                            <Bookmark className={`w-4 h-4 ${bookmarks.includes(story.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">{story.title}</h3>
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{story.summary}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-cyan-400 font-medium">{story.source}</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />{new Date(story.published_at).toLocaleDateString()}</span>
                              {story.link && <ExternalLink className="w-3 h-3 text-slate-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>



                {/* Top Stocks */}
                <section>
                  <h2 className="text-2xl font-bold text-white mb-6">Top Ranked Stocks</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stocks.map((stock) => (
                      <div key={stock.id} className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/50 transition-all">
                        {stock.rank_position && <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">{stock.rank_position}</div>}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white font-mono">{stock.ticker}</span>
                              {stock.daily_change !== undefined && <span className={`flex items-center text-sm font-medium ${stock.daily_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stock.daily_change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}{stock.daily_change >= 0 ? '+' : ''}{stock.daily_change.toFixed(2)}%</span>}
                            </div>
                            <h3 className="text-slate-300 text-sm mt-1 line-clamp-1">{stock.company_name}</h3>
                          </div>
                          <button onClick={() => toggleWatchlist(stock.id)} className={`p-2 rounded-full transition-all ${watchlist.includes(stock.id) ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-700/50 text-slate-400 hover:text-pink-400'}`}>
                            <Heart className={`w-4 h-4 ${watchlist.includes(stock.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <div className="text-xs text-slate-500 mb-1">Health</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" style={{ width: `${((stock.health_score || 0) / 5) * 100}%` }} /></div>
                              <span className="text-sm font-bold text-emerald-400">{(stock.health_score || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-slate-500 mb-1">Performance</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${((stock.performance_score || 0) / 5) * 100}%` }} /></div>
                              <span className="text-sm font-bold text-amber-400">{(stock.performance_score || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{stock.sector}</span>
                          <span className="text-slate-300 font-medium">{formatMarketCap(stock.market_cap)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Stocks View */}
            {selectedView === 'stocks' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Browse by Industry</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {industries.map((ind) => (
                    <div key={ind.id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-center hover:border-cyan-500/50 transition-all cursor-pointer">
                      <span className="text-white font-medium">{ind.name}</span>
                    </div>
                  ))}
                </div>
                <h2 className="text-2xl font-bold text-white mb-6">All Stocks</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {stocks.map((stock) => (
                    <div key={stock.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/50 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-white font-mono">{stock.ticker}</span>
                        <button onClick={() => toggleWatchlist(stock.id)} className={`p-2 rounded-full ${watchlist.includes(stock.id) ? 'text-pink-400' : 'text-slate-400 hover:text-pink-400'}`}>
                          <Heart className={`w-4 h-4 ${watchlist.includes(stock.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <h3 className="text-slate-300 text-sm mb-3">{stock.company_name}</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{stock.sector}</span>
                        <span className="text-cyan-400 font-bold">{(stock.health_score || 0).toFixed(1)}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Courses View */}
            {selectedView === 'courses' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Investment Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['Investment Fundamentals', 'Technical Analysis Mastery', 'Value Investing Principles', 'Options Trading Basics', 'Portfolio Management', 'Cryptocurrency Investing'].map((title, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all">
                      <div className="h-40 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                        <GraduationCap className="w-16 h-16 text-cyan-400/50" />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                        <p className="text-slate-400 text-sm mb-4">Learn essential skills for successful investing</p>
                        <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium">Start Learning <ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resources View */}
            {selectedView === 'resources' && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Learning Resources</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ title: 'Investopedia Guide', cat: 'Books' }, { title: 'Yahoo Finance', cat: 'Tools' }, { title: 'TradingView', cat: 'Tools' }, { title: 'Khan Academy Finance', cat: 'Videos' }, { title: 'Bloomberg Markets', cat: 'Tools' }, { title: 'The Intelligent Investor', cat: 'Books' }].map((res, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-all">
                      <div className="p-3 bg-blue-500/20 rounded-lg"><BookOpen className="w-6 h-6 text-blue-400" /></div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{res.title}</h3>
                        <p className="text-slate-400 text-sm">{res.cat}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">The <span className="text-cyan-400">Club</span></span>
            </div>
            <p className="text-slate-500 text-sm">© 2025 The Club. Investment involves risk.</p>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
