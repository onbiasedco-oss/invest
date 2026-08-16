import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Save, 
  X, 
  TrendingUp,
  DollarSign,
  Target,
  Search,
  Heart,
  Activity,
  Star,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getTierColor, getOverallRatingColor, getSimulatedPrice } from '@/data/stockRatings';
import { useStockRatingsWithOverrides } from '@/hooks/useStockRatingsWithOverrides';

interface WeeklyStock {
  id: string;
  symbol: string;
  name: string;
  reason: string;
  target_price: number | null;
  current_price: number | null;
  industry: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const MAX_WEEKLY_STOCKS = 20;


const WeeklyStocksManagement: React.FC = () => {
  const { user } = useAuth();
  // Use merged stock ratings (static + DB overrides + custom stocks) so tier changes persist
  const { stockRatings } = useStockRatingsWithOverrides();

  const [stocks, setStocks] = useState<WeeklyStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search and filter state for add modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');

  const [formData, setFormData] = useState({
    id: '',
    symbol: '',
    name: '',
    reason: '',
    target_price: '',
    current_price: '',
    industry: '',
    is_active: true
  });

  // Fallback admin check based on email
  const isAdmin = user?.is_admin === true || user?.email === 'naccitheceo@gmail.com';

  useEffect(() => {
    fetchStocks();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_stock_picks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching weekly stocks:', error);
        setErrorMessage('Failed to load weekly stocks: ' + error.message);
      } else if (data) {
        setStocks(data);
      }
    } catch (e: any) {
      console.error('Error fetching weekly stocks:', e);
      setErrorMessage('Failed to load weekly stocks: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      symbol: '',
      name: '',
      reason: '',
      target_price: '',
      current_price: '',
      industry: '',
      is_active: true
    });
  };

  const openAddModal = () => {
    resetForm();
    setSearchQuery('');
    setSelectedIndustry('All Industries');
    setErrorMessage('');
    setShowAddModal(true);
  };

  const openEditModal = (stock: WeeklyStock) => {
    setFormData({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      reason: stock.reason || '',
      target_price: stock.target_price?.toString() || '',
      current_price: stock.current_price?.toString() || '',
      industry: stock.industry || '',
      is_active: stock.is_active
    });
    setErrorMessage('');
    setShowEditModal(true);
  };

  // Quick add stock from the picker using edge function
  const handleQuickAdd = async (stockData: typeof stockRatings[0]) => {
    if (!isAdmin) {
      setErrorMessage('You do not have permission to add stocks.');
      return;
    }

    if (stocks.length >= MAX_WEEKLY_STOCKS) {
      setErrorMessage(`Maximum of ${MAX_WEEKLY_STOCKS} stocks allowed.`);
      return;
    }

    // Check if already added
    if (stocks.some(s => s.symbol.toUpperCase() === stockData.symbol.toUpperCase())) {
      setErrorMessage('This stock is already in your weekly picks.');
      return;
    }

    setAddingSymbol(stockData.symbol);
    setErrorMessage('');
    
    try {
      const maxOrder = stocks.length > 0 ? Math.max(...stocks.map(s => s.sort_order)) : 0;
      const simulatedPrice = getSimulatedPrice(stockData.currentPrice, stockData.symbol);
      
      console.log('Adding stock via edge function:', stockData.symbol);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'add_weekly_stock',
          data: {
            symbol: stockData.symbol.toUpperCase(),
            name: stockData.name,
            reason: '',
            target_price: null,
            current_price: simulatedPrice.price,
            industry: stockData.industry,
            is_active: true,
            sort_order: maxOrder + 1
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage(`Failed to add stock: ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Operation failed:', data.error);
        setErrorMessage(`Failed to add stock: ${data.error}`);
        return;
      }

      console.log('Successfully added stock:', data.data);
      setSuccessMessage(`${stockData.symbol} added to weekly picks!`);
      await fetchStocks();
    } catch (e: any) {
      console.error('Error adding stock:', e);
      setErrorMessage(`Failed to add stock: ${e.message || 'Unknown error'}`);
    } finally {
      setAddingSymbol(null);
    }
  };

  const handleUpdate = async () => {
    if (!formData.id || !formData.symbol || !formData.name) return;

    if (!isAdmin) {
      setErrorMessage('You do not have permission to update stocks.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'update_weekly_stock',
          data: {
            id: formData.id,
            symbol: formData.symbol.toUpperCase(),
            name: formData.name,
            reason: formData.reason,
            target_price: formData.target_price ? parseFloat(formData.target_price) : null,
            current_price: formData.current_price ? parseFloat(formData.current_price) : null,
            industry: formData.industry,
            is_active: formData.is_active
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage(`Failed to update stock: ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Operation failed:', data.error);
        setErrorMessage(`Failed to update stock: ${data.error}`);
        return;
      }

      setShowEditModal(false);
      resetForm();
      setSuccessMessage('Stock updated successfully!');
      fetchStocks();
    } catch (e: any) {
      console.error('Error updating stock:', e);
      setErrorMessage(`Failed to update stock: ${e.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock pick?')) return;

    if (!isAdmin) {
      setErrorMessage('You do not have permission to delete stocks.');
      return;
    }

    setDeletingId(id);
    setErrorMessage('');
    
    try {
      console.log('Deleting stock via edge function:', id);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_weekly_stock',
          data: { id }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage(`Failed to remove stock: ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Operation failed:', data.error);
        setErrorMessage(`Failed to remove stock: ${data.error}`);
        return;
      }

      setSuccessMessage('Stock deleted successfully!');
      fetchStocks();
    } catch (e: any) {
      console.error('Error deleting stock:', e);
      setErrorMessage(`Failed to remove stock: ${e.message || 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) {
      setErrorMessage('You do not have permission to update stocks.');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'toggle_weekly_stock_active',
          data: { id, is_active: !currentStatus }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage(`Failed to update status: ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Operation failed:', data.error);
        setErrorMessage(`Failed to update status: ${data.error}`);
        return;
      }

      fetchStocks();
    } catch (e: any) {
      console.error('Error toggling stock status:', e);
      setErrorMessage(`Failed to update status: ${e.message || 'Unknown error'}`);
    }
  };

  // Filter stocks for the picker modal - uses merged ratings with overrides
  const filteredStocks = useMemo(() => {
    let filtered = [...stockRatings];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.symbol.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by industry
    if (selectedIndustry !== 'All Industries') {
      filtered = filtered.filter(s => s.industry === selectedIndustry);
    }
    
    // Sort by overall rating
    filtered.sort((a, b) => b.overall - a.overall);
    
    return filtered;
  }, [searchQuery, selectedIndustry, stockRatings]);


  // Check if a stock is already in weekly picks
  const isStockAdded = (symbol: string) => {
    return stocks.some(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  };

  // Get stock rating data for a weekly stock
  const getStockRatingData = (symbol: string) => {
    return stockRatings.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage('')}
            className="p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')}
            className="p-1 hover:bg-emerald-500/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Weekly Stock Picks</h2>
          <p className="text-slate-400 text-sm">
            Manage the stocks displayed in the Weekly Stocks to Buy section 
            <span className="ml-2 text-cyan-400">({stocks.length}/{MAX_WEEKLY_STOCKS})</span>
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={stocks.length >= MAX_WEEKLY_STOCKS}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Stocks List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Stock</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400 hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    Health
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400 hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Perf
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400 hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    Overall
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400 hidden lg:table-cell">Current</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400 hidden lg:table-cell">Target</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stocks.map((stock, index) => {
                const currentPrice = stock.current_price ? Number(stock.current_price) : null;
                const targetPrice = stock.target_price ? Number(stock.target_price) : null;
                const upside = targetPrice && currentPrice 
                  ? ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1)
                  : null;
                const ratingData = getStockRatingData(stock.symbol);
                const isDeleting = deletingId === stock.id;
                
                return (
                  <tr key={stock.id} className={`hover:bg-slate-700/30 ${isDeleting ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                          <span className="font-mono font-bold text-cyan-400 text-sm">{stock.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{stock.symbol}</p>
                            {ratingData && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierColor(ratingData.tier)}`}>
                                {ratingData.tier.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">{stock.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {ratingData ? (
                        <span className="text-pink-400 font-medium">{ratingData.companyHealth.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {ratingData ? (
                        <span className="text-cyan-400 font-medium">{ratingData.companyPerformance.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {ratingData ? (
                        <span className={`font-bold ${getOverallRatingColor(ratingData.overall)}`}>
                          {ratingData.overall.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-white font-medium">
                        {currentPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-400 font-medium">
                          {targetPrice ? `$${targetPrice.toFixed(2)}` : '-'}
                        </span>
                        {upside && (
                          <span className={`text-xs ${parseFloat(upside) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {parseFloat(upside) > 0 ? '+' : ''}{upside}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(stock.id, stock.is_active)}
                        className={`px-2 py-1 text-xs rounded-full transition-all active:scale-95 ${
                          stock.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {stock.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(stock)}
                          disabled={isDeleting}
                          className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stock.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No weekly stock picks yet. Add your first recommendation!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal - Stock Picker Style */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div 
            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Stock to Weekly Picks</h3>
                  <p className="text-sm text-slate-400">
                    Tap the + icon to add a stock ({stocks.length}/{MAX_WEEKLY_STOCKS})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message in Modal */}
            {errorMessage && (
              <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Search and Filter */}
            <div className="p-4 border-b border-slate-700 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by symbol or name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              {/* Industry Filter */}
              <div className="flex flex-wrap gap-2">
                {['All Industries', 'Technology', 'Semiconductors', 'Financial Services', 'Healthcare', 'Software', 'Energy'].map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${
                      selectedIndustry === industry
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3 text-pink-400" />
                        Health
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        Perf
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        Overall
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 hidden md:table-cell">Tier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 hidden lg:table-cell">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Add</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredStocks.map((stock, index) => {
                    const isAdded = isStockAdded(stock.symbol);
                    const isAdding = addingSymbol === stock.symbol;
                    const simulatedPrice = getSimulatedPrice(stock.currentPrice, stock.symbol);
                    
                    return (
                      <tr 
                        key={stock.symbol} 
                        className={`hover:bg-slate-700/30 ${isAdded ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs font-medium">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                              <span className="font-mono font-bold text-cyan-400 text-xs">{stock.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{stock.symbol}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[120px]">{stock.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-pink-400 font-medium text-sm">{stock.companyHealth.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-cyan-400 font-medium text-sm">{stock.companyPerformance.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className={`font-bold text-sm ${getOverallRatingColor(stock.overall)}`}>
                            {stock.overall.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTierColor(stock.tier)}`}>
                            {stock.tier.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-white font-medium text-sm">${simulatedPrice.price.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAdded ? (
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
                              <Check className="w-5 h-5 text-emerald-400" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQuickAdd(stock)}
                              disabled={isAdding || stocks.length >= MAX_WEEKLY_STOCKS}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                              title="Add to weekly picks"
                            >
                              {isAdding ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Plus className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStocks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No stocks found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div 
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Pencil className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Edit Stock Pick</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message in Edit Modal */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    placeholder="AAPL"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Technology"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Apple Inc"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.current_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, current_price: e.target.value }))}
                      placeholder="150.00"
                      className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Price</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.target_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
                      placeholder="180.00"
                      className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason / Analysis</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why is this stock a good buy this week?"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="edit_is_active" className="text-sm text-slate-300">Show on homepage</label>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={submitting || !formData.symbol || !formData.name}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    handleDelete(formData.id);
                    setShowEditModal(false);
                  }}
                  className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyStocksManagement;
