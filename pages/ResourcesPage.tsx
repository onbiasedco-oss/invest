import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  Wrench, 
  ExternalLink,
  Search,
  Play,
  ShoppingCart,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Plus,
  X,
  Trash2,
  Edit2,
  Loader2,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronRight,
  ListVideo
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Resource } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Interface for roundtable talk
interface RoundtableTalk {
  id: string;
  title: string;
  description: string;
  topics: string[];
  video_url: string;
  date: string;
  duration: string;
  is_featured: boolean;
  created_at?: string;
}

// Interface for video tutorial
interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  category: string;
  created_at?: string;
}

// Interface for book
interface Book {
  id: string;
  title: string;
  description: string;
  author: string;
  url: string;
  image_url: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

// Default video tutorials (fallback if database is empty)
const defaultVideos: VideoTutorial[] = [
  {
    id: 'video-tradingview',
    title: 'How To Use TradingView',
    description: 'A comprehensive guide to using TradingView for technical analysis, charting, and market research.',
    youtube_id: 'JQuz0DWakIg',
    category: 'Platform Tutorials',
  },
  {
    id: 'video-robinhood',
    title: 'Beginners Guide to Robinhood',
    description: 'Everything you need to know to get started with Robinhood.',
    youtube_id: '5tR348z_c5E',
    category: 'Platform Tutorials',
  },
  {
    id: 'video-webull',
    title: 'Webull Tutorial for Complete Beginners',
    description: 'A complete walkthrough of the Webull trading platform.',
    youtube_id: 'vakxWroLvJo',
    category: 'Platform Tutorials',
  },
  {
    id: 'video-fidelity',
    title: 'How to Invest on Fidelity for Beginners',
    description: 'Learn how to use Fidelity Investments to build your portfolio.',
    youtube_id: 'wU2212mKoak',
    category: 'Platform Tutorials',
  },
];

// Default books (fallback if database is empty)
const defaultBooks: Book[] = [
  {
    id: 'book-investing-smart',
    title: 'Investing For Smart Beginners',
    description: 'A practical guide to financial investments for those just starting their investment journey.',
    author: 'Various',
    url: 'https://www.amazon.com/Investing-Smart-Beginners-Financial-investments/dp/B0F7FTK5M5/',
    image_url: 'https://m.media-amazon.com/images/I/61iuiahx0OL._SY466_.jpg',
    category: 'Investing',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'book-richest-man',
    title: 'The Richest Man in Babylon',
    description: 'The timeless classic that reveals the secrets to wealth through parables set in ancient Babylon.',
    author: 'George S. Clason',
    url: 'https://www.amazon.com/Richest-Man-Babylon-Original-Classics/dp/1954839499/',
    image_url: 'https://m.media-amazon.com/images/I/71VZub0QnLL._SY466_.jpg',
    category: 'Investing',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'book-think-grow-rich',
    title: 'Think and Grow Rich',
    description: 'Napoleon Hill\'s legendary masterpiece on the philosophy of success.',
    author: 'Napoleon Hill',
    url: 'https://www.amazon.com/Think-Grow-Rich-Landmark-Bestseller/dp/1585424331/',
    image_url: 'https://m.media-amazon.com/images/I/61IxJuRI39L._SY466_.jpg',
    category: 'Mindset',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'book-rich-dad',
    title: 'Rich Dad Poor Dad',
    description: 'Robert Kiyosaki\'s #1 personal finance book of all time.',
    author: 'Robert Kiyosaki',
    url: 'https://www.amazon.com/Rich-Dad-Poor-Teach-Middle/dp/1612681131/',
    image_url: 'https://m.media-amazon.com/images/I/81BE7eeKzAL._SY466_.jpg',
    category: 'Investing',
    sort_order: 4,
    is_active: true
  },
  {
    id: 'book-ten-pillars',
    title: 'The Ten Pillars of Wealth',
    description: 'Alex Becker reveals the mind-sets of the world\'s richest people.',
    author: 'Alex Becker',
    url: 'https://www.amazon.com/10-Pillars-Wealth-Mind-Sets-Richest/dp/1612549209/',
    image_url: 'https://m.media-amazon.com/images/I/417ROKN8xkL._SY466_.jpg',
    category: 'Mindset',
    sort_order: 5,
    is_active: true
  },
];

const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.is_admin || user?.email === 'naccitheceo@gmail.com';
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [roundtableTalks, setRoundtableTalks] = useState<RoundtableTalk[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorial[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  // Past roundtable talks playlist modal state
  const [showPastTalksModal, setShowPastTalksModal] = useState(false);
  
  // Modal states
  const [showRoundtableModal, setShowRoundtableModal] = useState(false);
  const [editingTalk, setEditingTalk] = useState<RoundtableTalk | null>(null);
  const [roundtableFormData, setRoundtableFormData] = useState({
    title: '', description: '', topics: '', video_url: '', date: '', duration: '60+ minutes', is_featured: false
  });
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoTutorial | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '', description: '', youtube_id: '', category: 'Platform Tutorials'
  });
  
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: '', description: '', author: '', url: '', image_url: '', category: 'Investing'
  });
  
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Resource | null>(null);
  const [toolFormData, setToolFormData] = useState({
    title: '', description: '', url: ''
  });
  
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceFormData, setResourceFormData] = useState({
    title: '', description: '', url: '', category: 'Articles'
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchResources();
    fetchRoundtableTalks();
    fetchVideoTutorials();
    fetchBooks();
  }, []);

  const fetchResources = async () => {
    try {
      const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
      if (data) setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoundtableTalks = async () => {
    try {
      const { data } = await supabase.from('roundtable_talks').select('*').order('created_at', { ascending: false });
      if (data) setRoundtableTalks(data);
    } catch (error) {
      console.error('Error fetching roundtable talks:', error);
    }
  };

  const fetchVideoTutorials = async () => {
    try {
      const { data, error } = await supabase.from('video_tutorials').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        setVideoTutorials(defaultVideos);
      } else {
        setVideoTutorials(data);
      }
    } catch (error) {
      setVideoTutorials(defaultVideos);
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase.from('recommended_books').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (error || !data || data.length === 0) {
        setBooks(defaultBooks);
      } else {
        setBooks(data);
      }
    } catch (error) {
      setBooks(defaultBooks);
    }
  };

  // Generic admin action handler
  const handleAdminAction = async (action: string, data: any) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('admin-operations', {
        body: { action, data }
      });
      if (fnError) throw new Error(fnError.message);
      if (!result?.success) throw new Error(result?.error || 'Operation failed');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Roundtable handlers
  const handleOpenRoundtableModal = (talk?: RoundtableTalk) => {
    if (talk) {
      setEditingTalk(talk);
      setRoundtableFormData({
        title: talk.title, description: talk.description || '', topics: talk.topics?.join('\n') || '',
        video_url: talk.video_url, date: talk.date, duration: talk.duration || '60+ minutes', is_featured: talk.is_featured || false
      });
    } else {
      setEditingTalk(null);
      setRoundtableFormData({ title: '', description: '', topics: '', video_url: '', date: '', duration: '60+ minutes', is_featured: false });
    }
    setError(null);
    setShowRoundtableModal(true);
  };

  const handleRoundtableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const topicsArray = roundtableFormData.topics.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    const payload = { ...roundtableFormData, topics: topicsArray, ...(editingTalk ? { id: editingTalk.id } : {}) };
    const action = editingTalk ? 'update_roundtable_talk' : 'add_roundtable_talk';
    if (await handleAdminAction(action, payload)) {
      setShowRoundtableModal(false);
      fetchRoundtableTalks();
    }
  };

  const handleDeleteRoundtable = async (id: string) => {
    if (!confirm('Delete this roundtable talk?')) return;
    if (await handleAdminAction('delete_roundtable_talk', { id })) fetchRoundtableTalks();
  };

  // Video handlers
  const handleOpenVideoModal = (video?: VideoTutorial) => {
    if (video) {
      setEditingVideo(video);
      setVideoFormData({ title: video.title, description: video.description || '', youtube_id: video.youtube_id, category: video.category || 'Platform Tutorials' });
    } else {
      setEditingVideo(null);
      setVideoFormData({ title: '', description: '', youtube_id: '', category: 'Platform Tutorials' });
    }
    setError(null);
    setShowVideoModal(true);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let youtubeId = videoFormData.youtube_id.trim();
    if (youtubeId.includes('youtube.com') || youtubeId.includes('youtu.be')) {
      const urlMatch = youtubeId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (urlMatch?.[1]) youtubeId = urlMatch[1];
    }
    const payload = { ...videoFormData, youtube_id: youtubeId, ...(editingVideo ? { id: editingVideo.id } : {}) };
    const action = editingVideo ? 'update_video_tutorial' : 'add_video_tutorial';
    if (await handleAdminAction(action, payload)) {
      setShowVideoModal(false);
      fetchVideoTutorials();
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (id.startsWith('video-')) { alert('Default videos cannot be deleted.'); return; }
    if (!confirm('Delete this video?')) return;
    if (await handleAdminAction('delete_video_tutorial', { id })) fetchVideoTutorials();
  };

  // Book handlers
  const handleOpenBookModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setBookFormData({ title: book.title, description: book.description || '', author: book.author || '', url: book.url || '', image_url: book.image_url || '', category: book.category || 'Investing' });
    } else {
      setEditingBook(null);
      setBookFormData({ title: '', description: '', author: '', url: '', image_url: '', category: 'Investing' });
    }
    setError(null);
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...bookFormData, ...(editingBook ? { id: editingBook.id } : {}) };
    const action = editingBook ? 'update_book' : 'add_book';
    if (await handleAdminAction(action, payload)) {
      setShowBookModal(false);
      fetchBooks();
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (id.startsWith('book-')) { alert('Default books cannot be deleted. Add your own books to manage them.'); return; }
    if (!confirm('Delete this book?')) return;
    if (await handleAdminAction('delete_book', { id })) fetchBooks();
  };

  // Tool handlers
  const handleOpenToolModal = (tool?: Resource) => {
    if (tool) {
      setEditingTool(tool);
      setToolFormData({ title: tool.title, description: tool.description || '', url: tool.url || '' });
    } else {
      setEditingTool(null);
      setToolFormData({ title: '', description: '', url: '' });
    }
    setError(null);
    setShowToolModal(true);
  };

  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...toolFormData, ...(editingTool ? { id: editingTool.id } : {}) };
    const action = editingTool ? 'update_tool' : 'add_tool';
    if (await handleAdminAction(action, payload)) {
      setShowToolModal(false);
      fetchResources();
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    if (await handleAdminAction('delete_tool', { id })) fetchResources();
  };

  // Resource handlers
  const handleOpenResourceModal = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setResourceFormData({ title: resource.title, description: resource.description || '', url: resource.url || '', category: resource.category || 'Articles' });
    } else {
      setEditingResource(null);
      setResourceFormData({ title: '', description: '', url: '', category: 'Articles' });
    }
    setError(null);
    setShowResourceModal(true);
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...resourceFormData, ...(editingResource ? { id: editingResource.id } : {}) };
    const action = editingResource ? 'update_resource' : 'add_resource';
    if (await handleAdminAction(action, payload)) {
      setShowResourceModal(false);
      fetchResources();
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    if (await handleAdminAction('delete_resource', { id })) fetchResources();
  };

  const categories = [
    { id: 'Roundtable', label: 'Roundtable', icon: Users, color: 'purple' },
    { id: 'Videos', label: 'Videos', icon: Video, color: 'red' },
    { id: 'Books', label: 'Books', icon: BookOpen, color: 'blue' },
    { id: 'Tools', label: 'Tools', icon: Wrench, color: 'green' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Roundtable': return 'bg-purple-500/20 text-purple-400';
      case 'Videos': return 'bg-red-500/20 text-red-400';
      case 'Books': return 'bg-blue-500/20 text-blue-400';
      case 'Tools': return 'bg-green-500/20 text-green-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const videoCategories = ['Platform Tutorials', 'Trading Strategies', 'Technical Analysis', 'Fundamental Analysis', 'Market News', 'Beginner Guides', 'Advanced Topics', 'Other'];
  const bookCategories = ['Investing', 'Mindset', 'Personal Finance', 'Trading', 'Economics', 'Business', 'Other'];
  const resourceCategories = ['Articles', 'Guides', 'Podcasts', 'Newsletters', 'Communities', 'Other'];

  const filteredVideos = videoTutorials.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDbResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const toolResources = filteredDbResources.filter(r => r.category === 'Tools');
  const otherResources = filteredDbResources.filter(r => r.category !== 'Tools');
  const filteredRoundtableTalks = roundtableTalks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Separate featured and past (non-featured) roundtable talks
  const featuredRoundtableTalks = filteredRoundtableTalks.filter(t => t.is_featured);
  const pastRoundtableTalks = filteredRoundtableTalks.filter(t => !t.is_featured);

  const showRoundtable = !selectedCategory || selectedCategory === 'Roundtable';
  const showVideos = !selectedCategory || selectedCategory === 'Videos';
  const showBooks = !selectedCategory || selectedCategory === 'Books';
  const showTools = !selectedCategory || selectedCategory === 'Tools';



  // Modal component
  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
            <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Resources</h1>
              <p className="text-slate-400 text-sm sm:text-base">Curated tools, books, and videos for investors</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search resources..." className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button onClick={() => setSelectedCategory(null)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${!selectedCategory ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>All</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                <cat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Roundtable Section */}
        {showRoundtable && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${getCategoryColor('Roundtable')}`}><Users className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Monthly Roundtable Talks</h2>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs sm:text-sm rounded-full font-medium">{filteredRoundtableTalks.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenRoundtableModal()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Recording</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
            
            {/* Featured Talks */}
            {featuredRoundtableTalks.length === 0 && pastRoundtableTalks.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">No roundtable talks found</h3>
                <p className="text-slate-400 text-sm">{searchQuery ? 'Try adjusting your search' : 'Check back later for new recordings'}</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Show featured talks */}
                {featuredRoundtableTalks.map((talk) => (
                  <div key={talk.id} className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" />{talk.date}</span>
                            <span className="px-2 sm:px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs sm:text-sm flex items-center gap-1"><Clock className="w-3 h-3 sm:w-4 sm:h-4" />{talk.duration}</span>
                            <span className="px-2 sm:px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs sm:text-sm font-medium">Featured</span>
                          </div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">{talk.title}</h3>
                          <p className="text-slate-300 text-sm sm:text-base mb-4 sm:mb-6">{talk.description}</p>
                          {talk.topics && talk.topics.length > 0 && (
                            <div className="mb-4 sm:mb-6">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3">Topics Covered</h4>
                              <div className="space-y-2">
                                {talk.topics.map((topic, index) => (
                                  <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/50 rounded-lg">
                                    {index === 0 && <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />}
                                    {index === 1 && <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />}
                                    {index === 2 && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />}
                                    {index > 2 && <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />}
                                    <span className="text-white text-sm sm:text-base">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <a href={talk.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                              <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="white" />Watch Recording<ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </a>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleOpenRoundtableModal(talk)} className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg sm:rounded-xl text-sm font-medium"><Edit2 className="w-4 h-4" /><span className="hidden sm:inline">Edit</span></button>
                                <button onClick={() => handleDeleteRoundtable(talk.id)} className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-sm font-medium"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Delete</span></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center justify-center w-64">
                          <div className="relative">
                            <div className="w-48 h-48 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full flex items-center justify-center">
                              <div className="w-36 h-36 bg-gradient-to-br from-purple-500/40 to-indigo-500/40 rounded-full flex items-center justify-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                                  <Users className="w-12 h-12 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* View More Past Talks Link */}
                {pastRoundtableTalks.length > 0 && (
                  <button 
                    onClick={() => setShowPastTalksModal(true)}
                    className="w-full p-4 sm:p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-purple-500/50 hover:bg-slate-800/70 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl">
                          <ListVideo className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                            View Past Roundtable Talks
                          </h3>
                          <p className="text-slate-400 text-xs sm:text-sm">
                            {pastRoundtableTalks.length} recording{pastRoundtableTalks.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}


        {/* Videos Section */}
        {showVideos && filteredVideos.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${getCategoryColor('Videos')}`}><Video className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Video Tutorials</h2>
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs sm:text-sm rounded-full">{filteredVideos.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenVideoModal()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Video</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all group">
                  <div className="relative aspect-video bg-slate-900">
                    {activeVideo === video.id ? (
                      <iframe src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 cursor-pointer group/video" onClick={() => setActiveVideo(video.id)}>
                        <img src={`https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 group-hover/video:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center group-hover/video:scale-110 transition-transform shadow-lg">
                            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-lg font-semibold text-white">{video.title}</h3>
                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenVideoModal(video); }} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between mt-3 sm:mt-4">
                      <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">{video.category}</span>
                      <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 sm:gap-2 text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium">
                        Watch on YouTube<ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Books Section */}
        {showBooks && filteredBooks.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${getCategoryColor('Books')}`}><BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Recommended Books</h2>
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs sm:text-sm rounded-full">{filteredBooks.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenBookModal()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Book</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {filteredBooks.map((book) => (
                <div key={book.id} className="group bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10 relative">
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.preventDefault(); handleOpenBookModal(book); }} className="p-1.5 bg-slate-800/80 text-cyan-400 hover:bg-cyan-500/20 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.preventDefault(); handleDeleteBook(book.id); }} className="p-1.5 bg-slate-800/80 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <a href={book.url} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-[2/3] bg-slate-900 overflow-hidden">
                      <img src={book.image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-2 sm:p-4">
                      <h3 className="text-white font-semibold text-xs sm:text-base mb-1 sm:mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">{book.title}</h3>
                      {book.author && <p className="text-slate-500 text-[10px] sm:text-xs mb-1">by {book.author}</p>}
                      <p className="text-slate-400 text-[10px] sm:text-xs line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3 hidden sm:block">{book.description}</p>
                      <div className="flex items-center gap-1 sm:gap-2 text-amber-500 text-[10px] sm:text-sm font-medium">
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">View on Amazon</span><span className="sm:hidden">Amazon</span>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools Section */}
        {showTools && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${getCategoryColor('Tools')}`}><Wrench className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Tools</h2>
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs sm:text-sm rounded-full">{toolResources.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenToolModal()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Tool</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
            {toolResources.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">No tools found</h3>
                <p className="text-slate-400 text-sm">{isAdmin ? 'Click "Add Tool" to add your first tool' : 'Check back later for new tools'}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {toolResources.map((resource) => (
                  <div key={resource.id} className="group p-4 sm:p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-cyan-500/50 transition-all relative">
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenToolModal(resource)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTool(resource.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 sm:gap-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${getCategoryColor('Tools')}`}><Wrench className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-cyan-400 transition-colors">{resource.title}</h3>
                        <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">{resource.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Resources Section */}
        {otherResources.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 text-purple-400"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Additional Resources</h2>
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs sm:text-sm rounded-full">{otherResources.length}</span>
              </div>
              {isAdmin && (
                <button onClick={() => handleOpenResourceModal()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Resource</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {otherResources.map((resource) => (
                <div key={resource.id} className="group p-4 sm:p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl hover:border-cyan-500/50 transition-all relative">
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenResourceModal(resource)} className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteResource(resource.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${getCategoryColor(resource.category)}`}>
                      {resource.category === 'Videos' ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-cyan-400 transition-colors">{resource.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">{resource.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded-full">{resource.category}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVideos.length === 0 && filteredBooks.length === 0 && filteredDbResources.length === 0 && filteredRoundtableTalks.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-16">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">No resources found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Roundtable Modal */}
      <Modal show={showRoundtableModal} onClose={() => setShowRoundtableModal(false)} title={editingTalk ? 'Edit Roundtable Talk' : 'Add Roundtable Talk'}>
        <form onSubmit={handleRoundtableSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label><input type="text" value={roundtableFormData.title} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, title: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea value={roundtableFormData.description} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Topics (one per line)</label><textarea value={roundtableFormData.topics} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, topics: e.target.value })} rows={4} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Video URL *</label><input type="text" value={roundtableFormData.video_url} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, video_url: e.target.value })} required placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" /><p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Date *</label><input type="text" value={roundtableFormData.date} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, date: e.target.value })} placeholder="December 2025" required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Duration</label><input type="text" value={roundtableFormData.duration} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, duration: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" /></div>
          </div>
          <div className="flex items-center gap-3"><input type="checkbox" id="is_featured" checked={roundtableFormData.is_featured} onChange={(e) => setRoundtableFormData({ ...roundtableFormData, is_featured: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-500" /><label htmlFor="is_featured" className="text-sm text-slate-300">Mark as Featured</label></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowRoundtableModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg text-sm font-medium">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingTalk ? 'Update' : 'Add Recording'}</button>
          </div>
        </form>
      </Modal>

      {/* Video Modal */}
      <Modal show={showVideoModal} onClose={() => setShowVideoModal(false)} title={editingVideo ? 'Edit Video Tutorial' : 'Add Video Tutorial'}>
        <form onSubmit={handleVideoSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label><input type="text" value={videoFormData.title} onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea value={videoFormData.description} onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">YouTube Video ID or URL *</label><input type="text" value={videoFormData.youtube_id} onChange={(e) => setVideoFormData({ ...videoFormData, youtube_id: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500" /><p className="text-xs text-slate-500 mt-1">Paste video ID or full YouTube URL</p></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label><select value={videoFormData.category} onChange={(e) => setVideoFormData({ ...videoFormData, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500">{videoCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowVideoModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg text-sm font-medium">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingVideo ? 'Update Video' : 'Add Video'}</button>
          </div>
        </form>
      </Modal>

      {/* Book Modal */}
      <Modal show={showBookModal} onClose={() => setShowBookModal(false)} title={editingBook ? 'Edit Book' : 'Add Book'}>
        <form onSubmit={handleBookSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label><input type="text" value={bookFormData.title} onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Author</label><input type="text" value={bookFormData.author} onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea value={bookFormData.description} onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5"><LinkIcon className="w-4 h-4 inline mr-1" />Amazon/Purchase URL</label><input type="text" value={bookFormData.url} onChange={(e) => setBookFormData({ ...bookFormData, url: e.target.value })} placeholder="https://amazon.com/..." className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" /><p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5"><ImageIcon className="w-4 h-4 inline mr-1" />Cover Image URL</label><input type="text" value={bookFormData.image_url} onChange={(e) => setBookFormData({ ...bookFormData, image_url: e.target.value })} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" /><p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p></div>

          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label><select value={bookFormData.category} onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">{bookCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-sm font-medium">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingBook ? 'Update Book' : 'Add Book'}</button>
          </div>
        </form>
      </Modal>

      {/* Tool Modal */}
      <Modal show={showToolModal} onClose={() => setShowToolModal(false)} title={editingTool ? 'Edit Tool' : 'Add Tool'}>
        <form onSubmit={handleToolSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label><input type="text" value={toolFormData.title} onChange={(e) => setToolFormData({ ...toolFormData, title: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea value={toolFormData.description} onChange={(e) => setToolFormData({ ...toolFormData, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 resize-none" /></div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5"><LinkIcon className="w-4 h-4 inline mr-1" />URL</label>
            <input type="text" value={toolFormData.url} onChange={(e) => setToolFormData({ ...toolFormData, url: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500" />
            <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowToolModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg text-sm font-medium">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingTool ? 'Update Tool' : 'Add Tool'}</button>
          </div>
        </form>
      </Modal>


      {/* Resource Modal */}
      <Modal show={showResourceModal} onClose={() => setShowResourceModal(false)} title={editingResource ? 'Edit Resource' : 'Add Resource'}>
        <form onSubmit={handleResourceSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label><input type="text" value={resourceFormData.title} onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })} required className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea value={resourceFormData.description} onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none" /></div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5"><LinkIcon className="w-4 h-4 inline mr-1" />URL</label>
            <input type="text" value={resourceFormData.url} onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500" />
            <p className="text-xs text-slate-500 mt-1">Enter the full URL including https://</p>
          </div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label><select value={resourceFormData.category} onChange={(e) => setResourceFormData({ ...resourceFormData, category: e.target.value })} className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">{resourceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowResourceModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-lg text-sm font-medium">{submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingResource ? 'Update Resource' : 'Add Resource'}</button>
          </div>
        </form>
      </Modal>

      {/* Past Roundtable Talks Playlist Modal */}
      {showPastTalksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ListVideo className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Past Roundtable Talks</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">{pastRoundtableTalks.length} recording{pastRoundtableTalks.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowPastTalksModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {pastRoundtableTalks.map((talk, index) => (
                  <div 
                    key={talk.id} 
                    className="group p-4 sm:p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-purple-500/50 hover:bg-slate-900/70 transition-all"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-purple-400 font-semibold text-sm sm:text-base">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{talk.date}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />{talk.duration}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-purple-400 transition-colors">
                          {talk.title}
                        </h3>
                        {talk.description && (
                          <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-3">{talk.description}</p>
                        )}
                        
                        {/* Topics Preview */}
                        {talk.topics && talk.topics.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Topics Covered</h4>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {talk.topics.slice(0, 4).map((topic, topicIndex) => (
                                <div 
                                  key={topicIndex} 
                                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded-md border border-slate-700/50"
                                >
                                  {topicIndex === 0 && <TrendingUp className="w-3 h-3 text-cyan-400 flex-shrink-0" />}
                                  {topicIndex === 1 && <BarChart3 className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                  {topicIndex === 2 && <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                                  {topicIndex === 3 && <TrendingUp className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                                  <span className="text-slate-300 text-[10px] sm:text-xs line-clamp-1">{topic}</span>
                                </div>
                              ))}
                              {talk.topics.length > 4 && (
                                <div className="flex items-center px-2 py-1 bg-slate-800/50 rounded-md border border-slate-700/50">
                                  <span className="text-slate-500 text-[10px] sm:text-xs">+{talk.topics.length - 4} more</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <a 
                            href={talk.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="white" />
                            Watch
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => { setShowPastTalksModal(false); handleOpenRoundtableModal(talk); }} 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs sm:text-sm font-medium"
                              >
                                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteRoundtable(talk.id)} 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs sm:text-sm font-medium"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              
              {pastRoundtableTalks.length === 0 && (
                <div className="text-center py-12">
                  <ListVideo className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No past recordings</h3>
                  <p className="text-slate-400 text-sm">All roundtable talks are currently featured</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResourcesPage;
