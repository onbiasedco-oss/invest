import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Globe,
  Cpu,
  DollarSign,
  Briefcase,
  BarChart3,
  Newspaper,
  X,
  Tag,
  Zap,
  AlertCircle,
  ChevronRight,
  Plus,
  Trash2,
  Shield,
  Image as ImageIcon,
  Link as LinkIcon,
  User,
  Calendar,
  BookOpen,
  Share2,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  published_at: string;
  image_url?: string;
  link?: string;
  tickers?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  isCustom?: boolean;
  author?: string;
  readTime?: number;
}

const categories = [
  { id: 'all', label: 'All', icon: Newspaper },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'technology', label: 'Tech', icon: Cpu },
  { id: 'economy', label: 'Economy', icon: DollarSign },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'crypto', label: 'Crypto', icon: Zap },
  { id: 'earnings', label: 'Earnings', icon: BarChart3 },
  { id: 'global', label: 'Global', icon: Globe },
];

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'JPM', name: 'JPMorgan' },
];

// Real news articles from Yahoo Finance with actual thumbnails (December 2025)
const fallbackNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Stock market today: Dow, S&P 500 notch records, Nasdaq gains as Wall Street flies high into Christmas holiday',
    summary: 'U.S. stock markets rallied on Christmas Eve as investors embraced the "Santa Claus rally" period. The Dow Jones Industrial Average and S&P 500 both hit new record highs, while the Nasdaq Composite posted strong gains heading into the holiday.',
    source: 'Yahoo Finance',
    category: 'markets',
    published_at: '2025-12-24T18:05:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/ircEHYzn6QvqFOUOpnwsMw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://s.yimg.com/os/creatr-uploaded-images/2023-12/d38af8b0-a43b-11ee-b9ef-3de472356920.cf.webp',
    tickers: ['SPY', 'QQQ', 'DIA'],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/live/stock-market-today-dow-sp-500-notch-records-nasdaq-gains-as-wall-street-flies-high-into-christmas-holiday-180542226.html',
    author: 'Yahoo Finance',
    readTime: 5
  },
  {
    id: 'news-2',
    title: 'Warren Buffett is resigning as CEO but remaining chairman. He once said retiring would be "unthinkable"',
    summary: 'Warren Buffett announced he is stepping down as CEO of Berkshire Hathaway but will remain chairman. The legendary investor once said retirement would be "unthinkable" and worse than death.',
    source: 'Business Insider',
    category: 'business',
    published_at: '2025-12-24T17:23:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/2siln2K85Mt_PpzLj4ikqw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/ca19dd3c9d6badd3290051e8ac7c07cb.cf.webp',
    tickers: ['BRK.A', 'BRK.B'],
    sentiment: 'neutral',
    link: 'https://finance.yahoo.com/news/warren-buffett-resigning-ceo-remaining-172301275.html',
    author: 'Business Insider',
    readTime: 4
  },
  {
    id: 'news-3',
    title: 'Gold Steadies as Traders Book Profits After Rally to Record',
    summary: 'Gold prices stabilized as traders took profits following a rally that pushed the precious metal to record highs. The commodity remains a popular hedge against economic uncertainty.',
    source: 'Bloomberg',
    category: 'markets',
    published_at: '2025-12-24T06:36:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/Nr6TGtWnQYz03JCvLBF.tQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/b24670784eb0957164a8daa8ec79de10.cf.webp',
    tickers: ['GLD', 'IAU'],
    sentiment: 'neutral',
    link: 'https://finance.yahoo.com/news/gold-climbs-above-4-500-063606076.html',
    author: 'Bloomberg',
    readTime: 3
  },
  {
    id: 'news-4',
    title: 'Carvana, Robinhood, Coinbase: How 3 of the market\'s biggest 2022 losers ended up in the S&P 500',
    summary: 'Three companies that were among the biggest losers in 2022 - Carvana, Robinhood, and Coinbase - have made remarkable comebacks and are now part of the S&P 500 index.',
    source: 'Yahoo Finance',
    category: 'markets',
    published_at: '2025-12-24T14:06:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/h.v9ycxaLiSGW5h10410TQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://s.yimg.com/os/creatr-uploaded-images/2025-11/5cd7ce90-bfdd-11f0-bafe-c091b51d1f91.cf.webp',
    tickers: ['CVNA', 'HOOD', 'COIN'],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/carvana-robinhood-coinbase-how-3-of-the-markets-biggest-2022-losers-ended-up-in-the-sp-500-this-year-140654224.html',
    author: 'Yahoo Finance',
    readTime: 5
  },
  {
    id: 'news-5',
    title: '3 surprises that could rattle markets in 2026, according to Morgan Stanley',
    summary: 'Morgan Stanley analysts outline three potential surprises that could shake up financial markets in 2026, from unexpected Fed moves to geopolitical shocks.',
    source: 'Business Insider',
    category: 'markets',
    published_at: '2025-12-24T18:30:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/JjyueTVxflxu9bwsLMbnpQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/8f23447fdb3139d643cc6f256d0b9b11.cf.webp',
    tickers: ['MS', 'SPY'],
    sentiment: 'neutral',
    link: 'https://finance.yahoo.com/news/3-surprises-could-rattle-markets-183001692.html',
    author: 'Business Insider',
    readTime: 4
  },
  {
    id: 'news-6',
    title: 'A Google-Backed Software Company Could Join Next Year\'s AI-Powered IPO Rush',
    summary: 'A software company backed by Google is reportedly preparing for an IPO in 2026, joining a wave of AI-focused companies looking to go public.',
    source: 'Investopedia',
    category: 'technology',
    published_at: '2025-12-24T18:43:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/A03pq2_MKk_zvKD8tgGXMg--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/investopedia_245/e16b7bfe54e9855bc35b612f91ae0f19.cf.webp',
    tickers: ['GOOGL'],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/google-backed-software-company-could-184311813.html',
    author: 'Investopedia',
    readTime: 4
  },
  {
    id: 'news-7',
    title: 'Copper Poised for Best Year Since 2009 After December Surge',
    summary: 'Copper prices are on track for their best annual performance since 2009, driven by strong demand from the renewable energy sector and electric vehicle production.',
    source: 'Bloomberg',
    category: 'markets',
    published_at: '2025-12-24T06:56:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/BQqgLLC1jCuhiGleLfDhjw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/61df9362c7ecc3f8d4afcdb782483343.cf.webp',
    tickers: ['COPX', 'FCX'],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/copper-poised-best-since-2009-065642820.html',
    author: 'Bloomberg',
    readTime: 3
  },
  {
    id: 'news-8',
    title: 'Logan Paul says young investors should consider nontraditional assets over stocks',
    summary: 'YouTube star Logan Paul advises young investors to look beyond traditional stocks, highlighting alternative assets like collectibles as he auctions a $5.3 million Pokémon card.',
    source: 'Business Insider',
    category: 'business',
    published_at: '2025-12-24T19:22:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/lm3EK0ZyyKr05A4Zf8_iIg--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/business_insider_articles_888/8b16991ae8dd54d351977a979debffc5.cf.webp',
    tickers: [],
    sentiment: 'neutral',
    link: 'https://finance.yahoo.com/news/logan-paul-says-young-investors-192210647.html',
    author: 'Business Insider',
    readTime: 4
  },
  {
    id: 'news-9',
    title: '119 JCPenney stores hang in the balance as deal deadline approaches',
    summary: 'The fate of 119 JCPenney stores remains uncertain as a critical deal deadline approaches. The struggling retailer faces tough decisions about its store footprint.',
    source: 'USA Today',
    category: 'business',
    published_at: '2025-12-24T19:10:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/Y8gE4CoBQ3qaD3PFLMZUoA--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/usa_today_money_325/65e890ee5282e98ac75cca5c2784175e.cf.webp',
    tickers: [],
    sentiment: 'negative',
    link: 'https://finance.yahoo.com/news/119-jcpenney-stores-hang-balance-191018272.html',
    author: 'USA Today',
    readTime: 4
  },
  {
    id: 'news-10',
    title: 'Chipotle Just Launched a New Protein-Packed Menu. Should You Buy CMG Stock for 2026?',
    summary: 'Chipotle has launched a new protein-focused menu as the fast-casual chain continues to innovate. Analysts weigh in on whether CMG stock is a buy heading into 2026.',
    source: 'Barchart',
    category: 'business',
    published_at: '2025-12-24T17:27:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/_ZTM7pdM6g_OGjJ2.Z0xUw--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/barchart_com_477/788b32f6a16b0bcc2cda90797d102061.cf.webp',
    tickers: ['CMG'],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/chipotle-just-launched-protein-packed-172751463.html',
    author: 'Barchart',
    readTime: 5
  },
  {
    id: 'news-11',
    title: 'How Pudgy Penguins Landed the Las Vegas Sphere—After Dogwifhat Couldn\'t',
    summary: 'NFT project Pudgy Penguins secured a spot on the Las Vegas Sphere after rival meme coin Dogwifhat failed to raise enough funds for the iconic display.',
    source: 'Decrypt',
    category: 'crypto',
    published_at: '2025-12-24T17:23:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/0neMO06_ZDzUtDSRowuFgA--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/decrypt_157/b7b0da198db424184f1d48e82b59b4b2.cf.webp',
    tickers: [],
    sentiment: 'positive',
    link: 'https://finance.yahoo.com/news/pudgy-penguins-landed-las-vegas-172304648.html',
    author: 'Decrypt',
    readTime: 4
  },
  {
    id: 'news-12',
    title: 'Oil Steadies as Global Tensions Help Offset Oversupply Outlook',
    summary: 'Oil prices stabilized as geopolitical tensions provided support despite concerns about oversupply in the global market heading into 2026.',
    source: 'Bloomberg',
    category: 'markets',
    published_at: '2025-12-24T09:50:00Z',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/P3tVxD0SQoBMp.duWVtWFQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/9f10bfa4781fdbef35c5e58a0977867f.cf.webp',
    tickers: ['USO', 'XLE'],
    sentiment: 'neutral',
    link: 'https://finance.yahoo.com/news/oil-steadies-global-tensions-help-095045523.html',
    author: 'Bloomberg',
    readTime: 3
  }
];



const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.is_admin || false;
  
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [customNews, setCustomNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'relevance'>('latest');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  
  // Admin modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<NewsArticle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    summary: '',
    source: '',
    category: 'business',
    image_url: '',
    link: '',
    tickers: '',
    sentiment: 'neutral' as 'positive' | 'negative' | 'neutral'
  });

  useEffect(() => {
    const saved = localStorage.getItem('savedNewsArticles');
    if (saved) setSavedArticles(JSON.parse(saved));
    fetchNews();
    fetchCustomNews();
  }, []);

  useEffect(() => {
    localStorage.setItem('savedNewsArticles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  const fetchCustomNews = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_news')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (data && !error) {
        const formattedCustomNews: NewsArticle[] = data.map((item: any) => ({
          id: `custom-${item.id}`,
          title: item.title,
          summary: item.summary,
          source: item.source || 'Admin',
          category: item.category || 'business',
          published_at: item.published_at,
          image_url: item.image_url || fallbackNews[0].image_url,
          link: item.link,
          tickers: item.tickers || [],
          sentiment: item.sentiment || 'neutral',
          isCustom: true,
          author: item.created_by || 'Admin',
          readTime: Math.ceil((item.summary?.length || 100) / 200)
        }));
        setCustomNews(formattedCustomNews);
      }
    } catch (error) {
      console.error('Error fetching custom news:', error);
    }
  };


  const fetchNews = async () => {
    setLoading(true);

    try {
      // Fetch news from edge function
      const { data: result, error } = await supabase.functions.invoke('fetch-market-news');
      
      if (error) {
        console.error('Error fetching news:', error);
        setNews(fallbackNews);
        return;
      }
      
      if (result?.news?.length > 0) {
        const formattedNews: NewsArticle[] = result.news.map((item: any, index: number) => ({
          id: `live-${item.id || index}-${Date.now()}`,
          title: item.title,
          summary: item.summary || item.description || '',
          source: item.source || 'Unknown',
          category: item.category?.toLowerCase() || categorizeNews(item.title, item.summary || ''),
          published_at: item.published_at || new Date().toISOString(),
          image_url: item.image_url, // Use the cover image from the API
          link: item.link || item.url || '',
          tickers: item.tickers || extractTickers(item.title + ' ' + (item.summary || '')),
          sentiment: item.sentiment || analyzeSentiment(item.title + ' ' + (item.summary || '')),
          author: item.author || item.source || 'Staff Writer',
          readTime: Math.ceil((item.summary?.length || 100) / 200)
        }));
        setNews(formattedNews);
      } else {
        setNews(fallbackNews);
      }
    } catch (error) {
      console.log('Using fallback news due to:', error);
      setNews(fallbackNews);
    } finally {
      setLoading(false);
    }
  };


  const refreshNews = async () => {
    setRefreshing(true);
    try {
      // Force refresh to get new articles from external sources
      const { data: result, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        console.error('Error refreshing news:', error);
        alert('Failed to refresh news. Please try again.');
        setRefreshing(false);
        return;
      }
      
      if (result?.news?.length > 0) {
        const formattedNews: NewsArticle[] = result.news.map((item: any, index: number) => ({
          id: `live-${item.id || index}-${Date.now()}`,
          title: item.title,
          summary: item.summary || item.description || '',
          source: item.source || 'Unknown',
          category: item.category?.toLowerCase() || categorizeNews(item.title, item.summary || ''),
          published_at: item.published_at || new Date().toISOString(),
          image_url: item.image_url, // Use the cover image from the API
          link: item.link || item.url || '',
          tickers: item.tickers || extractTickers(item.title + ' ' + (item.summary || '')),
          sentiment: item.sentiment || analyzeSentiment(item.title + ' ' + (item.summary || '')),
          author: item.author || item.source || 'Staff Writer',
          readTime: Math.ceil((item.summary?.length || 100) / 200)
        }));
        setNews(formattedNews);
        
        // Show notification about new articles
        if (result.newArticlesAdded > 0) {
          alert(`News refreshed! ${result.newArticlesAdded} new article${result.newArticlesAdded > 1 ? 's' : ''} added with updated cover images.`);
        } else {
          alert(result.message || 'News refreshed! No new articles found.');
        }
      }
    } catch (err: any) {
      console.error('Error refreshing news:', err);
      alert('Failed to refresh news: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
    await fetchCustomNews();
  };


  const handleAddStory = async () => {
    if (!newStory.title || !newStory.summary) return;
    
    setIsSubmitting(true);
    try {
      const tickersArray = newStory.tickers
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);
      
      const { error } = await supabase
        .from('custom_news')
        .insert({
          title: newStory.title,
          summary: newStory.summary,
          source: newStory.source || 'Admin',
          category: newStory.category,
          image_url: newStory.image_url || null,
          link: newStory.link || null,
          tickers: tickersArray.length > 0 ? tickersArray : null,
          sentiment: newStory.sentiment,
          created_by: user?.email
        });
      
      if (error) throw error;
      
      // Reset form and close modal
      setNewStory({
        title: '',
        summary: '',
        source: '',
        category: 'business',
        image_url: '',
        link: '',
        tickers: '',
        sentiment: 'neutral'
      });
      setShowAddModal(false);
      await fetchCustomNews();
    } catch (error) {
      console.error('Error adding story:', error);
      alert('Failed to add story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStory = async (article: NewsArticle) => {
    if (article.isCustom) {
      // Delete from database for custom stories
      const dbId = article.id.replace('custom-', '');
      setIsSubmitting(true);
      try {
        const { error } = await supabase
          .from('custom_news')
          .delete()
          .eq('id', dbId);
        
        if (error) throw error;
        
        setShowDeleteConfirm(null);
        setSelectedArticle(null);
        await fetchCustomNews();
      } catch (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete story. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // For non-custom stories, just hide them locally
      setNews(prev => prev.filter(n => n.id !== article.id));
      setShowDeleteConfirm(null);
      setSelectedArticle(null);
    }
  };

  const categorizeNews = (title: string, summary: string): string => {
    const text = (title + ' ' + summary).toLowerCase();
    if (text.includes('bitcoin') || text.includes('crypto')) return 'crypto';
    if (text.includes('earnings') || text.includes('eps')) return 'earnings';
    if (text.includes('fed') || text.includes('inflation')) return 'economy';
    if (text.includes('ai') || text.includes('tech')) return 'technology';
    if (text.includes('s&p') || text.includes('nasdaq')) return 'markets';
    if (text.includes('global') || text.includes('china')) return 'global';
    return 'business';
  };

  const extractTickers = (text: string): string[] => {
    const knownTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'JPM', 'AMD', 'INTC', 'NFLX', 'PLTR', 'COIN'];
    return knownTickers.filter(ticker => text.toUpperCase().includes(ticker));
  };

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['surge', 'gain', 'rise', 'record', 'high', 'growth', 'rally', 'strong', 'beat'];
    const negativeWords = ['fall', 'drop', 'decline', 'low', 'weak', 'miss', 'crash', 'plunge'];
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  // Combine custom news with regular news
  const allNews = useMemo(() => [...customNews, ...news], [customNews, news]);

  const sources = useMemo(() => ['all', ...new Set(allNews.map(n => n.source))], [allNews]);

  const filteredNews = useMemo(() => {
    let filtered = allNews;
    if (showSavedOnly) filtered = filtered.filter(a => savedArticles.includes(a.id));
    if (selectedCategory !== 'all') filtered = filtered.filter(a => a.category === selectedCategory);
    if (selectedSource !== 'all') filtered = filtered.filter(a => a.source === selectedSource);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
    }
    if (stockSearch) {
      const t = stockSearch.toUpperCase();
      filtered = filtered.filter(a => a.tickers?.includes(t) || a.title.toUpperCase().includes(t));
    }
    if (sortBy === 'latest') filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return filtered;
  }, [allNews, selectedCategory, selectedSource, searchQuery, stockSearch, showSavedOnly, savedArticles, sortBy]);

  const toggleSaveArticle = (id: string) => {
    setSavedArticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-emerald-400 bg-emerald-500/10';
    if (sentiment === 'negative') return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  const getSentimentLabel = (sentiment: string) => {
    if (sentiment === 'positive') return 'Bullish';
    if (sentiment === 'negative') return 'Bearish';
    return 'Neutral';
  };

  // Helper function to safely extract hostname from URL
  const getHostname = (url: string | undefined): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      // If URL is invalid, try to extract domain from string
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      return match ? match[1] : url;
    }
  };

  // Helper function to check if a URL is valid
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getSourceColor = (source?: string) => {
    const colors: Record<string, string> = {
      'Bloomberg': 'text-orange-400 bg-orange-500/10',
      'Reuters': 'text-blue-400 bg-blue-500/10',
      'TechCrunch': 'text-emerald-400 bg-emerald-500/10',
      'Wall Street Journal': 'text-slate-300 bg-slate-500/10',
      "Barron's": 'text-red-400 bg-red-500/10',
      'Yahoo Finance': 'text-purple-400 bg-purple-500/10',
      'Admin': 'text-amber-400 bg-amber-500/10',
      'CNBC': 'text-blue-400 bg-blue-500/10',
      'Motley Fool': 'text-indigo-400 bg-indigo-500/10',
      'Morningstar': 'text-red-400 bg-red-500/10',
    };
    return colors[source || ''] || 'text-cyan-400 bg-cyan-500/10';
  };


  const handleShareArticle = async (article: NewsArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: article.link || window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(article.link || window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading market news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Market News</h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Auto-refreshes twice daily (6 AM & 6 PM UTC)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Admin Add Story Button */}
              {isAdmin && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Story</span>
                </button>
              )}
              <button onClick={() => setShowSavedOnly(!showSavedOnly)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${showSavedOnly ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                <BookmarkCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span> ({savedArticles.length})
              </button>
              <button onClick={refreshNews} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Admin Badge */}
          {isAdmin && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Admin Mode</span>
              <span className="text-slate-400 text-xs">- You can add and delete news stories (trash icon appears on all stories)</span>
            </div>
          )}

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input type="text" placeholder="Search news..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500" />
            </div>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input type="text" placeholder="Search by ticker" value={stockSearch} onChange={(e) => setStockSearch(e.target.value.toUpperCase())} className="w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 uppercase" />
              {stockSearch && <button onClick={() => setStockSearch('')} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
              <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="flex-1 px-3 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500">
                {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'latest' | 'relevance')} className="px-3 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="latest">Latest</option>
                <option value="relevance">Relevance</option>
              </select>
            </div>
          </div>

          {/* Quick Stock Search */}
          <div className="mb-4 sm:mb-6">
            <p className="text-xs text-slate-400 mb-2">Quick search:</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {popularStocks.slice(0, 6).map(stock => (
                <button key={stock.symbol} onClick={() => setStockSearch(stockSearch === stock.symbol ? '' : stock.symbol)} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${stockSearch === stock.symbol ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                  {stock.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs - Horizontal Scroll */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex gap-1.5 sm:gap-2 min-w-max pb-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const count = cat.id === 'all' ? allNews.length : allNews.filter(n => n.category === cat.id).length;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {cat.label}
                    <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-700'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <p className="text-slate-400 text-xs sm:text-sm">
            {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'}
            {stockSearch && <span className="text-cyan-400"> for {stockSearch}</span>}
          </p>
        </div>

        {filteredNews.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Featured Article - First one */}
            {filteredNews.length > 0 && !showSavedOnly && (
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700/50 group hover:border-cyan-500/50 transition-all cursor-pointer" onClick={() => setSelectedArticle(filteredNews[0])}>
                {/* Admin/Custom Badge */}
                {filteredNews[0].isCustom && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="px-2 py-1 bg-amber-500/20 backdrop-blur-sm text-amber-400 text-xs rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin Story
                    </span>
                  </div>
                )}
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="relative h-48 sm:h-64 lg:h-auto overflow-hidden">
                    <img src={filteredNews[0].image_url || fallbackNews[0].image_url} alt={filteredNews[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan-500/20 text-cyan-400 text-xs sm:text-sm rounded-full capitalize">{filteredNews[0].category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${getSentimentColor(filteredNews[0].sentiment || 'neutral')}`}>{getSentimentLabel(filteredNews[0].sentiment || 'neutral')}</span>
                      <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1"><Clock className="w-3 h-3 sm:w-4 sm:h-4" />{formatDate(filteredNews[0].published_at)}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">{filteredNews[0].title}</h2>
                    <p className="text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">{filteredNews[0].summary}</p>
                    
                    {/* Author & Read Time */}
                    <div className="flex items-center gap-3 mb-3 text-xs sm:text-sm text-slate-400">
                      {filteredNews[0].author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {filteredNews[0].author}
                        </span>
                      )}
                      {filteredNews[0].readTime && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {filteredNews[0].readTime} min read
                        </span>
                      )}
                    </div>

                    {filteredNews[0].tickers && filteredNews[0].tickers.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {filteredNews[0].tickers.slice(0, 4).map(t => <button key={t} onClick={(e) => { e.stopPropagation(); setStockSearch(t); }} className="px-1.5 sm:px-2 py-0.5 bg-slate-700 text-cyan-400 text-[10px] sm:text-xs rounded hover:bg-slate-600">${t}</button>)}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getSourceColor(filteredNews[0].source)}`}>{filteredNews[0].source}</span>
                      <div className="flex-1" />
                      {/* Admin Delete Button - Shows on ALL stories in admin mode */}
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(filteredNews[0]); }} 
                          className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          title="Delete story"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleSaveArticle(filteredNews[0].id); }} className={`p-1.5 sm:p-2 rounded-lg transition-all ${savedArticles.includes(filteredNews[0].id) ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                        <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" fill={savedArticles.includes(filteredNews[0].id) ? 'currentColor' : 'none'} />
                      </button>
                      {filteredNews[0].link && (
                        <a 
                          href={filteredNews[0].link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500 text-white rounded-lg text-xs sm:text-sm hover:bg-cyan-600 transition-colors"
                        >
                          <span className="hidden sm:inline">Read Full Article</span>
                          <span className="sm:hidden">Read</span>
                          <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredNews.slice(showSavedOnly ? 0 : 1).map((article) => (
                <article key={article.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer relative" onClick={() => setSelectedArticle(article)}>
                  {/* Admin Badge for Custom Stories */}
                  {article.isCustom && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 bg-amber-500/20 backdrop-blur-sm text-amber-400 text-[10px] rounded-full flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    </div>
                  )}
                  <div className="relative h-36 sm:h-48 overflow-hidden">
                    <img src={article.image_url || fallbackNews[0].image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1.5">
                      {/* Admin Delete Button - Shows on ALL stories in admin mode */}
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(article); }} 
                          className="p-1.5 sm:p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleSaveArticle(article.id); }} className={`p-1.5 sm:p-2 rounded-full transition-all ${savedArticles.includes(article.id) ? 'bg-cyan-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}>
                        <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={savedArticles.includes(article.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-cyan-500/20 backdrop-blur-sm text-cyan-400 text-[10px] sm:text-xs rounded-full capitalize">{article.category}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] backdrop-blur-sm ${getSentimentColor(article.sentiment || 'neutral')}`}>
                        {getSentimentLabel(article.sentiment || 'neutral')}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 mb-2">
                      <Clock className="w-3 h-3" />{formatDate(article.published_at)}<span>•</span>
                      <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${getSourceColor(article.source)}`}>{article.source}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">{article.title}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">{article.summary}</p>
                    
                    {/* Author & Read Time */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 mb-2">
                      {article.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {article.author}
                        </span>
                      )}
                      {article.readTime && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5" />
                          {article.readTime} min
                        </span>
                      )}
                    </div>

                    {article.tickers && article.tickers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                        {article.tickers.slice(0, 3).map(t => <button key={t} onClick={(e) => { e.stopPropagation(); setStockSearch(t); }} className="px-1.5 py-0.5 bg-slate-700 text-cyan-400 text-[10px] sm:text-xs rounded hover:bg-slate-600">${t}</button>)}
                        {article.tickers.length > 3 && <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-[10px] sm:text-xs rounded">+{article.tickers.length - 3}</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-700">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-cyan-400 group-hover:gap-2 transition-all">Read more <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" /></span>
                      {article.link && (
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Source</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No articles found</h3>
            <p className="text-slate-400 text-sm mb-6">{showSavedOnly ? "You haven't saved any articles yet" : "Try adjusting your search or filters"}</p>
            {showSavedOnly && <button onClick={() => setShowSavedOnly(false)} className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm">Browse All News</button>}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="relative h-48 sm:h-64 lg:h-80">
              <img src={selectedArticle.image_url || fallbackNews[0].image_url} alt={selectedArticle.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-slate-800/50 to-transparent" />
              <button onClick={() => setSelectedArticle(null)} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              {selectedArticle.isCustom && (
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                  <span className="px-2 py-1 bg-amber-500/20 backdrop-blur-sm text-amber-400 text-xs rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin Story
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan-500/20 text-cyan-400 text-xs sm:text-sm rounded-full capitalize">{selectedArticle.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${getSentimentColor(selectedArticle.sentiment || 'neutral')}`}>{getSentimentLabel(selectedArticle.sentiment || 'neutral')}</span>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{selectedArticle.title}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Article Meta Info */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-700">
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getSourceColor(selectedArticle.source)}`}>{selectedArticle.source}</span>
                <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {formatFullDate(selectedArticle.published_at)}
                </span>
                {selectedArticle.author && (
                  <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    {selectedArticle.author}
                  </span>
                )}
                {selectedArticle.readTime && (
                  <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    {selectedArticle.readTime} min read
                  </span>
                )}
              </div>

              {/* Article Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-cyan-400" />
                  Article Summary
                </h4>
                <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border-l-4 border-cyan-500">
                  <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed">{selectedArticle.summary}</p>
                </div>
              </div>

              {/* Key Details Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Sentiment Analysis */}
                <div className="bg-slate-900/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Market Sentiment</h4>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getSentimentColor(selectedArticle.sentiment || 'neutral')}`}>
                    {selectedArticle.sentiment === 'positive' && <TrendingUp className="w-4 h-4" />}
                    {selectedArticle.sentiment === 'negative' && <TrendingUp className="w-4 h-4 rotate-180" />}
                    {selectedArticle.sentiment === 'neutral' && <BarChart3 className="w-4 h-4" />}
                    {getSentimentLabel(selectedArticle.sentiment || 'neutral')}
                  </div>
                </div>

                {/* Category */}
                <div className="bg-slate-900/30 rounded-lg p-4">
                  <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Category</h4>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium capitalize">
                    {categories.find(c => c.id === selectedArticle.category)?.icon && 
                      React.createElement(categories.find(c => c.id === selectedArticle.category)!.icon, { className: "w-4 h-4" })
                    }
                    {selectedArticle.category}
                  </div>
                </div>
              </div>

              {/* Related Stocks */}
              {selectedArticle.tickers && selectedArticle.tickers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Related Stocks
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tickers.map(t => (
                      <button 
                        key={t} 
                        onClick={() => { setSelectedArticle(null); navigate(`/stocks/${t}`); }} 
                        className="px-3 sm:px-4 py-2 bg-slate-700 text-cyan-400 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-2 transition-colors"
                      >
                        <TrendingUp className="w-3 h-3" />
                        ${t}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link Prominent Section */}
              {selectedArticle.link && isValidUrl(selectedArticle.link) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Read the Full Article</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {getHostname(selectedArticle.link)}
                      </p>
                    </div>
                    <a 
                      href={selectedArticle.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Article
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}


              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-slate-700">
                <button onClick={() => toggleSaveArticle(selectedArticle.id)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${savedArticles.includes(selectedArticle.id) ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={savedArticles.includes(selectedArticle.id) ? 'currentColor' : 'none'} />
                  {savedArticles.includes(selectedArticle.id) ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={() => handleShareArticle(selectedArticle)} 
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-600 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Share
                </button>
                {/* Admin Delete Button - Shows on ALL stories in admin mode */}
                {isAdmin && (
                  <button 
                    onClick={() => setShowDeleteConfirm(selectedArticle)} 
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Delete
                  </button>
                )}
                <button onClick={() => setSelectedArticle(null)} className="ml-auto px-3 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-lg sm:rounded-xl text-xs sm:text-sm hover:bg-slate-600">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Add News Story</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">Create a new article for the news feed</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                  placeholder="Enter article title..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Summary *</label>
                <textarea
                  value={newStory.summary}
                  onChange={(e) => setNewStory({ ...newStory, summary: e.target.value })}
                  placeholder="Enter article summary..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Source & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <input
                    type="text"
                    value={newStory.source}
                    onChange={(e) => setNewStory({ ...newStory, source: e.target.value })}
                    placeholder="e.g., Admin, Internal"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={newStory.category}
                    onChange={(e) => setNewStory({ ...newStory, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-1" /> Image URL
                  </label>
                  <input
                    type="url"
                    value={newStory.image_url}
                    onChange={(e) => setNewStory({ ...newStory, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" /> Article Link
                  </label>
                  <input
                    type="url"
                    value={newStory.link}
                    onChange={(e) => setNewStory({ ...newStory, link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Tickers & Sentiment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Related Tickers</label>
                  <input
                    type="text"
                    value={newStory.tickers}
                    onChange={(e) => setNewStory({ ...newStory, tickers: e.target.value })}
                    placeholder="AAPL, MSFT, GOOGL"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Separate multiple tickers with commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sentiment</label>
                  <select
                    value={newStory.sentiment}
                    onChange={(e) => setNewStory({ ...newStory, sentiment: e.target.value as 'positive' | 'negative' | 'neutral' })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="positive">Positive (Bullish)</option>
                    <option value="negative">Negative (Bearish)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-slate-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStory}
                disabled={!newStory.title || !newStory.summary || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Story
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Story</h3>
                <p className="text-slate-400 text-sm">
                  {showDeleteConfirm.isCustom ? 'This will permanently delete the story' : 'This will hide the story from your feed'}
                </p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-300 line-clamp-2">{showDeleteConfirm.title}</p>
              <p className="text-xs text-slate-500 mt-1">Source: {showDeleteConfirm.source}</p>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              {showDeleteConfirm.isCustom 
                ? 'Are you sure you want to delete this admin-created news story? This action cannot be undone.'
                : 'Are you sure you want to remove this story from the news feed? You can refresh to see it again.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStory(showDeleteConfirm)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
