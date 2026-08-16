import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, Heart, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOverallRatingColor, getTierColor, StockRating } from '@/data/stockRatings';
import { useStockRatingsWithOverrides } from '@/hooks/useStockRatingsWithOverrides';

interface TickerStock extends StockRating {
  // No price-related fields needed
}

const MarketTicker: React.FC = () => {
  const navigate = useNavigate();
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerStocks, setTickerStocks] = useState<TickerStock[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Use the shared hook that applies all overrides + custom stocks
  const { stockRatings } = useStockRatingsWithOverrides();

  // Update stocks when merged ratings change
  useEffect(() => {
    if (stockRatings.length > 0) {
      const sorted = [...stockRatings].sort((a, b) => b.overall - a.overall);
      setTickerStocks(sorted);
      setLastUpdate(new Date());
    }
  }, [stockRatings]);

  // Triple the stocks for seamless infinite scroll
  const displayStocks = [...tickerStocks, ...tickerStocks, ...tickerStocks];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <section className="bg-slate-800/50 border-y border-slate-700/50 py-3 overflow-hidden">
      <div className="flex items-center">
        {/* Fixed label */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 bg-slate-800/80 py-3 z-10 border-r border-slate-700">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 text-sm font-medium whitespace-nowrap">Stock Rankings</span>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">TOP {tickerStocks.length}</span>
          <span className="hidden md:flex items-center gap-1 text-slate-500 text-xs">
            <Clock className="w-3 h-3" />
            {formatTime(lastUpdate)}
          </span>
        </div>
        
        {/* Scrolling ticker - MUCH SLOWER animation */}
        <div className="overflow-hidden flex-1">
          <div 
            ref={tickerRef}
            className="flex gap-1 animate-ticker-slow"
            style={{ width: 'fit-content' }}
          >
            {displayStocks.map((stock, index) => (
              <div
                key={`${stock.symbol}-${index}`}
                className="flex items-center gap-3 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/80 rounded-lg cursor-pointer transition-all whitespace-nowrap group"
                onClick={() => navigate(`/industries`)}
              >
                {/* Rank Badge */}
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  index % tickerStocks.length < 3 ? 'bg-amber-500/20 text-amber-400' : 
                  index % tickerStocks.length < 10 ? 'bg-cyan-500/20 text-cyan-400' : 
                  'bg-slate-700 text-slate-400'
                }`}>
                  {(index % tickerStocks.length) + 1}
                </span>
                
                {/* Symbol and Name */}
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{stock.symbol}</span>
                  <span className="text-slate-500 text-xs hidden lg:inline max-w-[100px] truncate">{stock.name}</span>
                </div>
                
                {/* Health Score */}
                <div className="flex items-center gap-1 text-xs">
                  <Heart className="w-3 h-3 text-pink-400" />
                  <span className="text-pink-400 font-medium">{stock.companyHealth.toFixed(1)}</span>
                </div>
                
                {/* Performance Score */}
                <div className="flex items-center gap-1 text-xs">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">{stock.companyPerformance.toFixed(1)}</span>
                </div>
                
                {/* Overall Rating */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  stock.overall >= 8 ? 'bg-emerald-500/20' : 
                  stock.overall >= 6 ? 'bg-blue-500/20' : 
                  'bg-red-500/20'
                } ${getOverallRatingColor(stock.overall)}`}>
                  <Star className="w-3 h-3" />
                  <span className="text-xs font-bold">{stock.overall.toFixed(1)}</span>
                </div>
                
                {/* Tier Badge */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getTierColor(stock.tier)}`}>
                  {stock.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker-slow {
          animation: ticker-slow 300s linear infinite;
        }
        .animate-ticker-slow:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default MarketTicker;
