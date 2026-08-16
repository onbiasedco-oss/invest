import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  latestTradingDay: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

// Client-side cache with localStorage persistence - 24 hours for daily updates
const CACHE_PREFIX = 'stock_cache_';
const CACHE_DURATIONS = {
  quote: 24 * 60 * 60 * 1000,      // 24 hours
  history: 24 * 60 * 60 * 1000,    // 24 hours
  intraday: 24 * 60 * 60 * 1000,   // 24 hours
  batch: 24 * 60 * 60 * 1000       // 24 hours
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  date: string; // Track which date this cache is for
}

function getCacheKey(type: string, symbol: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${CACHE_PREFIX}${type}_${symbol.toUpperCase()}_${today}`;
}

function getFromLocalCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      const today = new Date().toISOString().split('T')[0];
      // Check if cache is from today and not expired
      if (entry.date === today && Date.now() < entry.expiresAt) {
        return entry.data;
      }
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

function setLocalCache<T>(key: string, data: T, duration: number): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
      date: today
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

function getCacheAge(key: string): number | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const entry = JSON.parse(cached);
      return Date.now() - entry.timestamp;
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export function useStockQuote(symbol: string | undefined) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const fetchQuote = useCallback(async (forceRefresh = false) => {
    if (!symbol) return;
    
    const cacheKey = getCacheKey('quote', symbol);
    
    // Check local cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromLocalCache<StockQuote>(cacheKey);
      if (cached) {
        setQuote(cached);
        setIsCached(true);
        setCacheAge(getCacheAge(cacheKey));
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-market-data', {
        body: { action: 'quote', symbol, forceRefresh }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setQuote(data.data);
        setIsCached(data.cached || false);
        setCacheAge(data.cacheAge || null);
        
        // Cache locally for 24 hours
        setLocalCache(cacheKey, data.data, CACHE_DURATIONS.quote);
      } else if (data?.rateLimited) {
        setError('API rate limit reached. Using cached data if available.');
      } else {
        setError(data?.error || 'Failed to fetch quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stock quote');
      
      // Try to use stale cache on error
      const staleCache = getFromLocalCache<StockQuote>(cacheKey);
      if (staleCache) {
        setQuote(staleCache);
        setIsCached(true);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, loading, error, isCached, cacheAge, refetch: () => fetchQuote(true) };
}

export function useStockHistory(symbol: string | undefined) {
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!symbol) return;
    
    const cacheKey = getCacheKey('history', symbol);
    
    if (!forceRefresh) {
      const cached = getFromLocalCache<HistoricalDataPoint[]>(cacheKey);
      if (cached) {
        setHistory(cached);
        setIsCached(true);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-market-data', {
        body: { action: 'history', symbol, forceRefresh }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setHistory(data.data);
        setIsCached(data.cached || false);
        setLocalCache(cacheKey, data.data, CACHE_DURATIONS.history);
      } else if (data?.rateLimited) {
        setError('API rate limit reached. Please try again in a minute.');
      } else {
        setError(data?.error || 'Failed to fetch history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stock history');
      
      const staleCache = getFromLocalCache<HistoricalDataPoint[]>(cacheKey);
      if (staleCache) {
        setHistory(staleCache);
        setIsCached(true);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, isCached, refetch: () => fetchHistory(true) };
}

export function useStockIntraday(symbol: string | undefined) {
  const [intraday, setIntraday] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchIntraday = useCallback(async (forceRefresh = false) => {
    if (!symbol) return;
    
    const cacheKey = getCacheKey('intraday', symbol);
    
    if (!forceRefresh) {
      const cached = getFromLocalCache<HistoricalDataPoint[]>(cacheKey);
      if (cached) {
        setIntraday(cached);
        setIsCached(true);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-market-data', {
        body: { action: 'intraday', symbol, forceRefresh }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setIntraday(data.data);
        setIsCached(data.cached || false);
        setLocalCache(cacheKey, data.data, CACHE_DURATIONS.intraday);
      } else if (data?.rateLimited) {
        setError('API rate limit reached. Please try again in a minute.');
      } else {
        setError(data?.error || 'Failed to fetch intraday data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch intraday data');
      
      const staleCache = getFromLocalCache<HistoricalDataPoint[]>(cacheKey);
      if (staleCache) {
        setIntraday(staleCache);
        setIsCached(true);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchIntraday();
  }, [fetchIntraday]);

  return { intraday, loading, error, isCached, refetch: () => fetchIntraday(true) };
}

export function useBatchQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ fromCache: number; fromApi: number; total: number } | null>(null);
  const symbolsRef = useRef(symbols.join(','));

  const fetchQuotes = useCallback(async (forceRefresh = false) => {
    if (!symbols.length) return;
    
    // Check local cache for each symbol
    const cachedQuotes: StockQuote[] = [];
    const uncachedSymbols: string[] = [];
    
    if (!forceRefresh) {
      for (const symbol of symbols) {
        const cacheKey = getCacheKey('quote', symbol);
        const cached = getFromLocalCache<StockQuote>(cacheKey);
        if (cached) {
          cachedQuotes.push(cached);
        } else {
          uncachedSymbols.push(symbol);
        }
      }
      
      // If all symbols are cached, return immediately
      if (uncachedSymbols.length === 0) {
        setQuotes(cachedQuotes);
        setMeta({ fromCache: cachedQuotes.length, fromApi: 0, total: cachedQuotes.length });
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-market-data', {
        body: { action: 'batch', symbols: forceRefresh ? symbols : uncachedSymbols }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        // Cache each quote locally
        for (const quote of data.data) {
          const cacheKey = getCacheKey('quote', quote.symbol);
          setLocalCache(cacheKey, quote, CACHE_DURATIONS.batch);
        }
        
        // Combine cached and new quotes
        const allQuotes = forceRefresh ? data.data : [...cachedQuotes, ...data.data];
        setQuotes(allQuotes);
        
        setMeta({
          fromCache: forceRefresh ? (data.meta?.fromCache || 0) : cachedQuotes.length + (data.meta?.fromCache || 0),
          fromApi: data.meta?.fromApi || 0,
          total: allQuotes.length
        });
        
        if (data.errors?.length) {
          setError(data.errors.join(', '));
        }
      } else {
        setError(data?.error || 'Failed to fetch quotes');
        // Use cached quotes on error
        if (cachedQuotes.length > 0) {
          setQuotes(cachedQuotes);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stock quotes');
      if (cachedQuotes.length > 0) {
        setQuotes(cachedQuotes);
      }
    } finally {
      setLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    if (symbolsRef.current !== symbols.join(',')) {
      symbolsRef.current = symbols.join(',');
      fetchQuotes();
    } else {
      fetchQuotes();
    }
  }, [fetchQuotes]);

  return { quotes, loading, error, meta, refetch: () => fetchQuotes(true) };
}

export function useStockSearch() {
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }
    
    // Check cache
    const cacheKey = getCacheKey('search', query);
    const cached = getFromLocalCache<StockSearchResult[]>(cacheKey);
    if (cached) {
      setResults(cached);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-market-data', {
        body: { action: 'search', symbol: query }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setResults(data.data);
        // Cache search results for 24 hours
        setLocalCache(cacheKey, data.data, 24 * 60 * 60 * 1000);
      } else {
        setError(data?.error || 'Failed to search');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search stocks');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

// Utility function to clear all stock cache
export function clearStockCache(): void {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

// Utility function to get cache statistics
export function getStockCacheStats(): { entries: number; size: string } {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  let totalSize = 0;
  
  for (const key of keys) {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length * 2; // UTF-16 encoding
    }
  }
  
  return {
    entries: keys.length,
    size: totalSize > 1024 ? `${(totalSize / 1024).toFixed(2)} KB` : `${totalSize} bytes`
  };
}
