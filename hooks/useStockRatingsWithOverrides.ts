import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { stockRatings as staticStockRatings, StockRating } from '@/data/stockRatings';

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

interface UseStockRatingsResult {
  stockRatings: StockRating[];
  ratingOverrides: Record<string, StockRatingOverride>;
  customStocks: CustomStock[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useStockRatingsWithOverrides(): UseStockRatingsResult {
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, StockRatingOverride>>({});
  const [customStocks, setCustomStocks] = useState<CustomStock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatingOverrides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stock_rating_overrides')
        .select('*');

      if (data && !error) {
        const overridesMap: Record<string, StockRatingOverride> = {};
        data.forEach((override: any) => {
          overridesMap[override.symbol] = {
            ...override,
            // DB tier is the primary source of truth
            tier: override.tier || null
          };
        });

        setRatingOverrides(overridesMap);
      }
    } catch (e) {
      console.warn('Failed to fetch rating overrides:', e);
    }
  }, []);

  const fetchCustomStocks = useCallback(async () => {
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
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRatingOverrides(), fetchCustomStocks()]);
    setLoading(false);
  }, [fetchRatingOverrides, fetchCustomStocks]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Build merged stock ratings: static stocks with overrides applied + custom stocks
  const validTiers = ['top', 'high', 'mid-high', 'mid', 'lower', 'lowest'] as const;

  const mergedStockRatings: StockRating[] = [
    // Static stocks with overrides applied
    ...staticStockRatings.map(stock => {
      const override = ratingOverrides[stock.symbol];
      if (override) {
        // Use the DB tier if it's a valid tier value, otherwise fall back to static tier
        const overrideTier = override.tier && validTiers.includes(override.tier as any)
          ? (override.tier as typeof validTiers[number])
          : null;
        return {
          ...stock,
          companyHealth: override.company_health != null ? Number(override.company_health) : stock.companyHealth,
          companyPerformance: override.company_performance != null ? Number(override.company_performance) : stock.companyPerformance,
          overall: override.overall != null ? Number(override.overall) : stock.overall,
          // CRITICAL: Use override tier if available, never revert to static tier when an override exists
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
        tier: cs.tier as typeof validTiers[number],
        industry: cs.industry,
        currentPrice: cs.current_price || 0,
        healthMetrics: {
          epsScore: cs.eps_score ?? 3,
          peScore: cs.pe_score ?? 3,
          deScore: cs.de_score ?? 3,
          fcfScore: cs.fcf_score ?? 3,
          marginScore: cs.margin_score ?? 3
        },
        companyInfo: {
          description: 'Custom stock added by admin',
          founded: 'N/A',
          headquarters: 'N/A',
          ceo: 'N/A',
          employees: 'N/A',
          website: ''
        }
      }))
  ].sort((a, b) => b.overall - a.overall);

  return {
    stockRatings: mergedStockRatings,
    ratingOverrides,
    customStocks,
    loading,
    refresh
  };
}
