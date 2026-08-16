import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  Bookmark, 
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  Link as LinkIcon,
  Shield,
  CheckCircle,
  AlertCircle,
  Newspaper,
  Zap,
  Timer
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import StoryCard from '@/components/ui/StoryCard';
import { Story } from '@/types';

// Real news articles from Yahoo Finance with actual thumbnails (December 2025)
const fallbackStories: Story[] = [
  {
    id: 'fallback-1',
    title: 'Stock market today: Dow, S&P 500 notch records, Nasdaq gains as Wall Street flies high into Christmas holiday',
    summary: 'U.S. stock markets rallied on Christmas Eve as investors embraced the "Santa Claus rally" period. The Dow and S&P 500 hit new record highs while the Nasdaq posted strong gains.',
    content: 'U.S. stock markets rallied on Christmas Eve as investors embraced the "Santa Claus rally" period, which spans the last five trading days of the year and the first two of January. The Dow Jones Industrial Average and S&P 500 both hit new record highs, while the Nasdaq Composite posted strong gains.',
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
    summary: 'Warren Buffett announced he is stepping down as CEO of Berkshire Hathaway but will remain chairman. The legendary investor once said retirement would be "unthinkable" and worse than death.',
    content: 'Warren Buffett, the legendary investor known as the "Oracle of Omaha," announced he is stepping down as CEO of Berkshire Hathaway but will remain chairman. Buffett, who has led the company for decades, once said retirement would be "unthinkable" and worse than death.',
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
    summary: 'Gold prices stabilized as traders took profits following a rally that pushed the precious metal to record highs. The commodity remains a popular hedge against economic uncertainty.',
    content: 'Gold prices steadied as traders booked profits after a rally that pushed the precious metal to record highs. Despite the pullback, gold remains a popular hedge against economic uncertainty and inflation concerns heading into 2026.',
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
    summary: 'Three companies that were among the biggest losers in 2022 - Carvana, Robinhood, and Coinbase - have made remarkable comebacks and are now part of the S&P 500 index.',
    content: 'In a remarkable turnaround, three companies that were among the biggest losers in 2022 - Carvana, Robinhood, and Coinbase - have made stunning comebacks this year. All three have now been added to the prestigious S&P 500 index, marking one of the most dramatic reversals in recent market history.',
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
    summary: 'Morgan Stanley analysts outline three potential surprises that could shake up financial markets in 2026, from unexpected Fed moves to geopolitical shocks.',
    content: 'Morgan Stanley analysts have outlined three potential surprises that could rattle financial markets in 2026. These include unexpected Federal Reserve policy shifts, geopolitical tensions, and potential disruptions in the AI sector that could impact tech valuations.',
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
    summary: 'A software company backed by Google is reportedly preparing for an IPO in 2026, joining a wave of AI-focused companies looking to go public.',
    content: 'A software company backed by Google is reportedly preparing for an initial public offering in 2026, joining a growing wave of AI-focused companies looking to capitalize on investor enthusiasm for artificial intelligence technology.',
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
    summary: 'Copper prices are on track for their best annual performance since 2009, driven by strong demand from the renewable energy sector and electric vehicle production.',
    content: 'Copper prices are poised for their best annual performance since 2009 following a December surge. The industrial metal has benefited from strong demand driven by the renewable energy transition and electric vehicle production, with analysts expecting continued strength into 2026.',
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
    summary: 'YouTube star Logan Paul advises young investors to look beyond traditional stocks, highlighting alternative assets like collectibles as he auctions a $5.3 million Pokémon card.',
    content: 'YouTube star and entrepreneur Logan Paul is advising young investors to consider nontraditional assets over stocks. The influencer made the comments while auctioning a rare Pokémon card valued at $5.3 million, highlighting the potential of collectibles and alternative investments.',
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
    summary: 'The fate of 119 JCPenney stores remains uncertain as a critical deal deadline approaches. The struggling retailer faces tough decisions about its store footprint.',
    content: 'The fate of 119 JCPenney stores hangs in the balance as a critical deal deadline approaches. The struggling department store chain faces tough decisions about its store footprint as it works to restructure its business and compete in an increasingly challenging retail environment.',
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
    summary: 'Chipotle has launched a new protein-focused menu as the fast-casual chain continues to innovate. Analysts weigh in on whether CMG stock is a buy heading into 2026.',
    content: 'Chipotle Mexican Grill has launched a new protein-packed menu as the fast-casual restaurant chain continues to innovate and attract health-conscious consumers. Analysts are weighing in on whether CMG stock is a buy heading into 2026, given the company\'s strong performance and growth prospects.',
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
    summary: 'NFT project Pudgy Penguins secured a spot on the Las Vegas Sphere after rival meme coin Dogwifhat failed to raise enough funds for the iconic display.',
    content: 'NFT project Pudgy Penguins has secured a coveted spot on the Las Vegas Sphere, the iconic spherical display that has become a symbol of cutting-edge advertising. The project succeeded where rival meme coin Dogwifhat failed, after the latter couldn\'t raise enough funds for the display.',
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
    summary: 'Oil prices stabilized as geopolitical tensions provided support despite concerns about oversupply in the global market heading into 2026.',
    content: 'Oil prices steadied as global geopolitical tensions helped offset concerns about oversupply in the market. Despite worries about excess production, ongoing conflicts and supply disruption risks have provided a floor for crude prices heading into 2026.',
    image_url: 'https://s.yimg.com/uu/api/res/1.2/P3tVxD0SQoBMp.duWVtWFQ--~B/Zmk9c3RyaW07aD0xMDk7cT04MDt3PTE5NDthcHBpZD15dGFjaHlvbg--/https://media.zenfs.com/en/bloomberg_holding_pen_162/9f10bfa4781fdbef35c5e58a0977867f.cf.webp',
    source: 'Bloomberg',
    category: 'Commodities',
    published_at: '2025-12-24T09:50:00Z',
    created_at: '2025-12-24T09:50:00Z',
    updated_at: '2025-12-24T09:50:00Z',
    link: 'https://finance.yahoo.com/news/oil-steadies-global-tensions-help-095045523.html'
  }
];

// Auto-refresh interval in milliseconds (check every 30 minutes)
const AUTO_REFRESH_CHECK_INTERVAL = 30 * 60 * 1000;

const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.is_admin === true || user?.email === 'naccitheceo@gmail.com';
  
  const [stories, setStories] = useState<Story[]>([]);
  const [liveNews, setLiveNews] = useState<Story[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshingNews, setRefreshingNews] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // New story form state
  const [newStory, setNewStory] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    source: '',
    category: 'Market News',
    link: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Calculate time until next refresh
  const calculateNextRefresh = useCallback((lastUpdate: string) => {
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const nextRefreshTime = lastUpdateTime + (4 * 60 * 60 * 1000); // 4 hours after last update
    const now = Date.now();
    const diff = nextRefreshTime - now;
    
    if (diff <= 0) {
      return 'Due now';
    }
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Check if news needs refresh and trigger if needed
  const checkAndRefreshNews = useCallback(async (silent = true) => {
    if (!autoRefreshEnabled) return;
    
    try {
      console.log('Checking if news refresh is needed...');
      
      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { checkOnly: true }
      });
      
      if (error) {
        console.error('Error checking news status:', error);
        return;
      }
      
      if (data?.metadata?.last_updated_at) {
        setLastUpdated(data.metadata.last_updated_at);
        setNextRefreshIn(calculateNextRefresh(data.metadata.last_updated_at));
      }
      
      // If refresh is needed, trigger it
      if (data?.needsRefresh) {
        console.log('Auto-refresh triggered - news is stale');
        if (!silent) {
          setRefreshMessage({ type: 'success', text: 'Auto-refreshing news from Yahoo Finance...' });
        }
        await performNewsRefresh(silent);
      }
    } catch (error) {
      console.error('Error in auto-refresh check:', error);
    }
  }, [autoRefreshEnabled, calculateNextRefresh]);

  // Perform the actual news refresh
  const performNewsRefresh = async (silent = false) => {
    if (!silent) setRefreshingNews(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { 
          forceRefresh: true,
          saveToDatabase: true,
          isAdmin: isAdmin
        }
      });
      
      if (error) {
        console.error('Error fetching news:', error);
        if (!silent) {
          setRefreshMessage({ 
            type: 'error', 
            text: `Failed to fetch news: ${error.message || 'Unknown error'}` 
          });
        }
        return;
      }
      
      if (data?.news && Array.isArray(data.news)) {
        const formattedNews: Story[] = data.news.map((item: any, index: number) => ({
          id: `live-${item.id || Date.now()}-${index}`,
          title: item.title,
          summary: item.summary || item.description,
          content: item.content || item.summary || item.description,
          image_url: item.image_url || item.thumbnail || fallbackStories[index % fallbackStories.length]?.image_url,
          source: item.source || 'Yahoo Finance',
          category: item.category || 'Market News',
          published_at: item.published_at || item.pubDate || new Date().toISOString(),
          created_at: item.published_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          link: item.link || item.url
        }));
        
        setLiveNews(formattedNews);
        
        if (data.lastUpdated) {
          setLastUpdated(data.lastUpdated);
          setNextRefreshIn(calculateNextRefresh(data.lastUpdated));
        }
        
        if (!silent) {
          const savedCount = data.savedCount || 0;
          const source = data.fetchedFromRSS ? 'Yahoo Finance RSS' : 'cached data';
          setRefreshMessage({ 
            type: 'success', 
            text: `Fetched ${formattedNews.length} stories from ${source}!${data.savedToDatabase ? ` (${savedCount} new saved)` : ''}` 
          });
        }
        
        // Refresh stories from database
        await fetchData();
      }
    } catch (error: any) {
      console.error('Error refreshing news:', error);
      if (!silent) {
        setRefreshMessage({ 
          type: 'error', 
          text: `Error: ${error.message || 'Failed to fetch news'}` 
        });
      }
    } finally {
      if (!silent) setRefreshingNews(false);
    }
  };

  // Set up auto-refresh interval
  useEffect(() => {
    // Initial check
    checkAndRefreshNews(true);
    
    // Set up periodic checks
    if (autoRefreshEnabled) {
      autoRefreshIntervalRef.current = setInterval(() => {
        checkAndRefreshNews(true);
      }, AUTO_REFRESH_CHECK_INTERVAL);
    }
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, checkAndRefreshNews]);

  // Update next refresh countdown every minute
  useEffect(() => {
    if (!lastUpdated) return;
    
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(calculateNextRefresh(lastUpdated));
    }, 60000);
    
    return () => clearInterval(countdownInterval);
  }, [lastUpdated, calculateNextRefresh]);

  useEffect(() => {
    fetchData();
  }, [user]);

  // Clear refresh message after 5 seconds
  useEffect(() => {
    if (refreshMessage) {
      const timer = setTimeout(() => setRefreshMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [refreshMessage]);

  // Admin function to manually refresh news from Yahoo Finance
  const handleRefreshFromYahooFinance = async () => {
    setRefreshingNews(true);
    setRefreshMessage(null);
    await performNewsRefresh(false);
    setRefreshingNews(false);
  };

  const fetchData = async () => {
    try {
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .order('published_at', { ascending: false });

      if (storiesData && storiesData.length > 0) {
        setStories(storiesData);
      } else {
        setStories(fallbackStories);
      }

      // Fetch last updated metadata
      const { data: metaData } = await supabase
        .from('news_metadata')
        .select('*')
        .eq('id', 'main')
        .single();
      
      if (metaData?.last_updated_at) {
        setLastUpdated(metaData.last_updated_at);
        setNextRefreshIn(calculateNextRefresh(metaData.last_updated_at));
      }

      if (user) {
        const { data: bookmarksData } = await supabase
          .from('story_bookmarks')
          .select('story_id')
          .eq('user_id', user.id);

        if (bookmarksData) {
          setBookmarks(bookmarksData.map(b => b.story_id));
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories(fallbackStories);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (storyId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (storyId.startsWith('fallback-') || storyId.startsWith('live-') || storyId.startsWith('local-')) {
      if (bookmarks.includes(storyId)) {
        setBookmarks(prev => prev.filter(id => id !== storyId));
      } else {
        setBookmarks(prev => [...prev, storyId]);
      }
      return;
    }

    const isBookmarked = bookmarks.includes(storyId);
    
    if (isBookmarked) {
      await supabase
        .from('story_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('story_id', storyId);
      setBookmarks(prev => prev.filter(id => id !== storyId));
    } else {
      await supabase
        .from('story_bookmarks')
        .insert({ user_id: user.id, story_id: storyId });
      setBookmarks(prev => [...prev, storyId]);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStory.title || !newStory.summary) return;

    setSubmitting(true);
    try {
      const storyData = {
        ...newStory,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setStories(prev => [data, ...prev]);
      }

      setShowAddModal(false);
      setNewStory({ title: '', summary: '', content: '', image_url: '', source: '', category: 'Market News', link: '' });
    } catch (error) {
      console.error('Error adding story:', error);
      // Add to local state as fallback
      const localStory: Story = {
        id: `local-${Date.now()}`,
        ...newStory,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setStories(prev => [localStory, ...prev]);
      setShowAddModal(false);
      setNewStory({ title: '', summary: '', content: '', image_url: '', source: '', category: 'Market News', link: '' });

    } finally {
      setSubmitting(false);
    }
  };

  // Combine live news with stored stories, prioritizing live news
  const allStories = [...liveNews, ...stories].filter((story, index, self) => 
    index === self.findIndex(s => s.title === story.title)
  );

  const sources = ['all', ...new Set(allStories.map(s => s.source).filter(Boolean))];
  const categories = ['all', ...new Set(allStories.map(s => s.category).filter(Boolean))];

  const filteredStories = allStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (story.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = selectedSource === 'all' || story.source === selectedSource;
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    return matchesSearch && matchesSource && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Top Stories</h1>
              <p className="text-slate-400">Latest market news from Yahoo Finance</p>
              
              {/* Last Updated Info */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-400">Last updated:</span>
                    <span className="text-cyan-400 font-medium">{formatLastUpdated(lastUpdated)}</span>
                  </div>
                )}
                {nextRefreshIn && autoRefreshEnabled && (
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400">Next refresh:</span>
                    <span className="text-emerald-400 font-medium">{nextRefreshIn}</span>
                  </div>
                )}
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    autoRefreshEnabled 
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button (available to all users) */}
              <button
                onClick={handleRefreshFromYahooFinance}
                disabled={refreshingNews}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshingNews ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Newspaper className="w-4 h-4" />
                    <span>Refresh News</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Story
              </button>
            </div>
          </div>

          {/* Admin Badge */}
          {isAdmin && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Admin Mode</span>
              <span className="text-slate-400 text-sm">- News auto-refreshes every 4 hours from Yahoo Finance RSS feeds</span>
            </div>
          )}

          {/* Auto-Refresh Info Banner */}
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${autoRefreshEnabled ? 'animate-pulse' : ''}`} />
              <span className="text-cyan-400 text-sm font-medium">Automatic Updates</span>
            </div>
            <span className="text-slate-400 text-sm">
              News automatically refreshes every 4 hours from Yahoo Finance RSS feeds to keep you informed with the latest market news.
            </span>
          </div>

          {/* Refresh Message */}
          {refreshMessage && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              refreshMessage.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {refreshMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={refreshMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {refreshMessage.text}
              </span>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {sources.slice(0, 6).map((source) => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedSource === source
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {source === 'all' ? 'All Sources' : source}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredStories.length > 0 ? (
          <>
            {/* Featured Story */}
            <div className="mb-8">
              <div 
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => {
                  // Open external link if available, otherwise navigate to news page
                  const story = filteredStories[0];
                  if (story.link) {
                    window.open(story.link, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate('/news');
                  }
                }}
              >
                <img
                  src={filteredStories[0].image_url || 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg'}
                  alt={filteredStories[0].title}
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    {filteredStories[0].category && (
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full">
                        {filteredStories[0].category}
                      </span>
                    )}
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(filteredStories[0].published_at)}
                    </span>
                    {filteredStories[0].source && (
                      <span className="text-slate-400 text-sm">• {filteredStories[0].source}</span>
                    )}
                    {filteredStories[0].link && (
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                    {filteredStories[0].title}
                  </h2>
                  <p className="text-slate-300 text-lg max-w-3xl line-clamp-2">
                    {filteredStories[0].summary}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(filteredStories[0].id);
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
                    bookmarks.includes(filteredStories[0].id)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-5 h-5" fill={bookmarks.includes(filteredStories[0].id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Rest of Stories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.slice(1).map((story) => (
                <div
                  key={story.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer group hover:border-cyan-500/50 transition-all"
                  onClick={() => {
                    // Open external link if available, otherwise navigate to news page
                    if (story.link) {
                      window.open(story.link, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate('/news');
                    }
                  }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={story.image_url || 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg'}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    {story.category && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                        {story.category}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(story.id);
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${
                        bookmarks.includes(story.id)
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" fill={bookmarks.includes(story.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Calendar className="w-3 h-3" />
                      {formatDate(story.published_at)}
                      {story.source && (
                        <>
                          <span>•</span>
                          <span>{story.source}</span>
                        </>
                      )}
                      {story.link && <ExternalLink className="w-3 h-3" />}
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {story.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No stories found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>


      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Story</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newStory.title}
                  onChange={(e) => setNewStory(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter story title"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Summary *
                </label>
                <textarea
                  value={newStory.summary}
                  onChange={(e) => setNewStory(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief summary of the story"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content
                </label>
                <textarea
                  value={newStory.content}
                  onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Full story content"
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Article Link
                </label>
                <input
                  type="url"
                  value={newStory.link}
                  onChange={(e) => setNewStory(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newStory.image_url}
                    onChange={(e) => setNewStory(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                {newStory.image_url && (
                  <div className="mt-2 relative h-32 rounded-lg overflow-hidden">
                    <img
                      src={newStory.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newStory.source}
                    onChange={(e) => setNewStory(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., Yahoo Finance"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newStory.category}
                    onChange={(e) => setNewStory(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="Market News">Market News</option>
                    <option value="Technology">Technology</option>
                    <option value="Economy">Economy</option>
                    <option value="Cryptocurrency">Cryptocurrency</option>
                    <option value="Automotive">Automotive</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Markets">Markets</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newStory.title || !newStory.summary}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
