import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Clock, ExternalLink, Share2, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Story } from '@/types';

// December 2025 fallback stories data with unique thumbnails and links
const fallbackStories: Story[] = [
  {
    id: 'fallback-1',
    title: 'Federal Reserve Signals Cautious Approach to 2026 Rate Policy',
    summary: 'The Federal Reserve maintained its benchmark interest rate, signaling a data-dependent approach as inflation shows signs of stabilization heading into the new year.',
    content: `The Federal Reserve has announced that it will keep interest rates unchanged at 4.25-4.50%, marking a period of stability after years of adjustments. Fed Chair Jerome Powell emphasized that the economy continues to show remarkable resilience with strong employment numbers and moderating inflation.

Markets responded positively to the news, with major indices posting gains across the board. The S&P 500 rose 1.2% following the announcement, while the Nasdaq Composite gained 1.5%.

Economists are now pricing in a higher probability of rate cuts beginning in the first quarter of 2026. "The Fed's tone has clearly shifted," said Sarah Chen, chief economist at Capital Markets Research. "We're seeing a more balanced approach that acknowledges both the progress on inflation and the need to support economic growth."

The central bank's preferred inflation measure, the Personal Consumption Expenditures (PCE) price index, has declined steadily over the past several months, approaching the Fed's 2% target.

Bond markets rallied on the news, with the 10-year Treasury yield falling to its lowest level in months. This has positive implications for mortgage rates and corporate borrowing costs.

However, Fed officials emphasized that any policy changes will be data-dependent. "We will continue to make decisions meeting by meeting," the Fed Chair stated.`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg',
    source: 'Bloomberg',
    category: 'Economy',
    published_at: '2025-12-22T10:30:00Z',
    created_at: '2025-12-22T10:30:00Z',
    updated_at: '2025-12-22T10:30:00Z',
    link: 'https://www.bloomberg.com/markets'
  },
  {
    id: 'fallback-2',
    title: 'NVIDIA Hits Record High on AI Chip Demand Surge',
    summary: 'NVIDIA shares reached an all-time high as enterprise demand for AI accelerators continues to outpace supply, with data center revenue up 200% year-over-year.',
    content: `NVIDIA Corporation (NVDA) stock surged to new all-time highs of $185.50 per share as the company reported unprecedented demand for its AI chips. Data center revenue grew 200% year-over-year to $28.5 billion, driven by enterprise AI adoption.

CEO Jensen Huang announced plans to expand manufacturing capacity through partnerships with TSMC and Samsung. The company also unveiled its next-generation Blackwell Ultra architecture, promising 3x performance improvements for AI training workloads.

"This is shaping up to be the strongest holiday season for tech in years," said Mark Thompson, senior analyst at Tech Insights Research. "The integration of AI into consumer products has created a new upgrade cycle that's driving purchases across categories."

Analysts have raised price targets across the board, with some projecting $250 per share by end of 2026. The company's dominance in AI accelerators shows no signs of slowing, with enterprise customers lining up for next-generation chips.

Key highlights from the earnings call:
- Data center revenue: $28.5 billion (+200% YoY)
- Gaming revenue: $3.2 billion (+15% YoY)
- Automotive revenue: $450 million (+50% YoY)
- Gross margin: 74.5%
- Next-gen Blackwell Ultra shipping Q1 2026`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374378127_dc649748.png',
    source: 'Reuters',
    category: 'Technology',
    published_at: '2025-12-22T09:15:00Z',
    created_at: '2025-12-22T09:15:00Z',
    updated_at: '2025-12-22T09:15:00Z',
    link: 'https://www.reuters.com/technology/'
  },
  {
    id: 'fallback-3',
    title: 'Apple Unveils Revolutionary AI Features in iOS 19 Preview',
    summary: 'Apple showcased upcoming AI capabilities for iPhone, including advanced on-device processing and seamless integration with enterprise workflows.',
    content: `Apple Inc. (AAPL) previewed iOS 19 at a special event, showcasing groundbreaking AI features that process entirely on-device, ensuring privacy while delivering powerful capabilities for both consumers and enterprises.

The new Apple Intelligence 2.0 includes real-time document analysis, advanced photo editing with generative AI, and seamless enterprise workflow integration. Tim Cook emphasized that all AI processing happens on the device, with no data sent to the cloud.

"Privacy is a fundamental human right," said Apple's CEO during the presentation. "Our approach to AI ensures that your personal data never leaves your device."

Enterprise customers showed particular interest in the new security-focused AI capabilities for document management and communication. The features will be available on iPhone 16 and later models.

Key new features in iOS 19:
- Apple Intelligence 2.0 with on-device processing
- Advanced photo editing with generative AI
- Real-time document analysis and summarization
- Enhanced Siri with contextual understanding
- Enterprise workflow automation
- Improved privacy controls for AI features

The announcement sent Apple shares higher, with analysts raising price targets based on the potential for increased iPhone upgrade cycles.`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374371009_dc6d6a7e.jpg',
    source: 'TechCrunch',
    category: 'Technology',
    published_at: '2025-12-21T16:45:00Z',
    created_at: '2025-12-21T16:45:00Z',
    updated_at: '2025-12-21T16:45:00Z',
    link: 'https://techcrunch.com/'
  },
  {
    id: 'fallback-4',
    title: 'Microsoft Azure Revenue Surpasses AWS for First Time',
    summary: 'Microsoft reported that Azure cloud services revenue exceeded Amazon Web Services in Q4, driven by enterprise AI adoption and hybrid cloud solutions.',
    content: `In a historic shift in the cloud computing landscape, Microsoft Azure has overtaken Amazon Web Services in quarterly revenue for the first time. Azure reported $32.1 billion in Q4 revenue compared to AWS's $31.8 billion.

The growth was primarily driven by enterprise customers adopting Azure for AI workloads, particularly those integrating with Microsoft 365 and Dynamics. CEO Satya Nadella credited the company's early investment in OpenAI and the integration of Copilot across Microsoft products.

"Enterprises are choosing Azure for its comprehensive AI capabilities and seamless integration with existing Microsoft tools," said Microsoft's cloud chief. "We're seeing accelerated migration from on-premises infrastructure."

AWS remains the leader in total market share, but the gap is narrowing rapidly. Industry analysts expect the cloud market to continue growing rapidly, with AI workloads driving much of the expansion.

Cloud market breakdown:
- Azure Q4 revenue: $32.1 billion
- AWS Q4 revenue: $31.8 billion
- Google Cloud Q4 revenue: $11.2 billion
- Total cloud market growth: 22% YoY`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374368791_f0802509.jpg',
    source: 'Wall Street Journal',
    category: 'Business',
    published_at: '2025-12-21T14:20:00Z',
    created_at: '2025-12-21T14:20:00Z',
    updated_at: '2025-12-21T14:20:00Z',
    link: 'https://www.wsj.com/tech'
  },
  {
    id: 'fallback-5',
    title: 'Tesla Cybertruck Deliveries Exceed 500,000 Units in 2025',
    summary: 'Tesla announced record Cybertruck deliveries, cementing its position in the electric pickup market despite increased competition from legacy automakers.',
    content: `Tesla (TSLA) has delivered over 500,000 Cybertrucks in 2025, exceeding analyst expectations and establishing the electric pickup as a mainstream vehicle category.

The company reported strong demand across all variants, with the tri-motor Cyberbeast accounting for 35% of sales. CEO Elon Musk announced plans for a more affordable dual-motor version starting at $59,990, coming in Q2 2026.

Production efficiency at the Austin Gigafactory has improved significantly, with the company now producing 5,000 units per week. Competition from Ford's F-150 Lightning and Rivian's R1T has intensified, but Tesla maintains its lead in the segment.

Cybertruck sales breakdown:
- Cyberbeast (tri-motor): 35% of sales
- AWD (dual-motor): 55% of sales
- RWD (single-motor): 10% of sales
- Average selling price: $78,500
- Customer satisfaction: 94%

Looking ahead, Tesla plans to introduce new Cybertruck variants, including a more affordable model targeting mainstream consumers.`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374374324_c1cdc246.jpg',
    source: "Barron's",
    category: 'Automotive',
    published_at: '2025-12-21T11:00:00Z',
    created_at: '2025-12-21T11:00:00Z',
    updated_at: '2025-12-21T11:00:00Z',
    link: 'https://www.barrons.com/topics/tesla'
  },
  {
    id: 'fallback-6',
    title: 'Bitcoin ETFs See Record Inflows as Institutional Adoption Grows',
    summary: 'Spot Bitcoin ETFs recorded their highest weekly inflows since launch, with institutional investors increasingly viewing crypto as a portfolio diversifier.',
    content: `Bitcoin exchange-traded funds experienced record inflows of $4.2 billion this week as institutional investors continue to allocate capital to digital assets. BlackRock's iShares Bitcoin Trust (IBIT) led the way with $1.8 billion in new investments.

Total assets under management across all Bitcoin ETFs now exceed $120 billion. The surge comes as Bitcoin prices hover near $105,000, with analysts predicting potential moves to $150,000 in 2026.

"We're seeing a fundamental shift in how institutional investors view digital assets," said Michael Roberts, head of digital assets at a major investment bank. "The approval of spot Bitcoin ETFs was a watershed moment that opened the door to broader adoption."

Bitcoin ETF inflows breakdown:
- BlackRock IBIT: $1.8 billion
- Fidelity FBTC: $1.1 billion
- Grayscale GBTC: $450 million
- Other ETFs: $850 million
- Total weekly inflows: $4.2 billion

Regulatory developments have also supported the rally. Clearer guidance on cryptocurrency regulations has been provided, while progress on comprehensive digital asset legislation continues.`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374373624_edf089d2.jpg',
    source: 'Yahoo Finance',
    category: 'Cryptocurrency',
    published_at: '2025-12-20T15:30:00Z',
    created_at: '2025-12-20T15:30:00Z',
    updated_at: '2025-12-20T15:30:00Z',
    link: 'https://finance.yahoo.com/crypto/'
  },
  {
    id: 'fallback-7',
    title: 'Amazon Expands Same-Day Delivery to 100 New Cities',
    summary: 'Amazon announced aggressive logistics expansion, bringing same-day delivery to 100 additional metropolitan areas ahead of the 2026 holiday season.',
    content: `Amazon (AMZN) is expanding its same-day delivery network to 100 new cities across the United States, investing $8 billion in logistics infrastructure. The expansion will bring same-day delivery to over 90% of the US population by Q4 2026.

CEO Andy Jassy emphasized the company's commitment to customer convenience and competitive advantage. The investment includes new fulfillment centers, delivery stations, and an expanded fleet of electric delivery vehicles.

Amazon is also piloting drone delivery in 15 additional markets, with plans for broader rollout in 2026.

Logistics expansion details:
- Investment: $8 billion
- New fulfillment centers: 25
- New delivery stations: 150
- Electric delivery vehicles: 100,000
- Drone delivery markets: 15 new cities
- Coverage: 90% of US population by Q4 2026`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg',
    source: 'Bloomberg',
    category: 'E-Commerce',
    published_at: '2025-12-20T12:00:00Z',
    created_at: '2025-12-20T12:00:00Z',
    updated_at: '2025-12-20T12:00:00Z',
    link: 'https://www.bloomberg.com/news/amazon'
  },
  {
    id: 'fallback-8',
    title: 'Alphabet Launches Gemini 3.0 with Breakthrough Reasoning Capabilities',
    summary: 'Google parent Alphabet unveiled Gemini 3.0, featuring advanced reasoning and multimodal capabilities that rival human-level performance on complex tasks.',
    content: `Alphabet (GOOGL) has released Gemini 3.0, its most advanced AI model yet, demonstrating near-human performance on complex reasoning tasks and multimodal understanding.

The new model outperforms GPT-5 on several benchmarks, including mathematical reasoning, code generation, and scientific analysis. CEO Sundar Pichai announced that Gemini 3.0 will be integrated across all Google products, including Search, Workspace, and Cloud.

Enterprise customers can access the model through Google Cloud's Vertex AI platform. The launch reinforces Alphabet's position as a leader in the AI race, with shares rising 5% on the news.

Gemini 3.0 capabilities:
- Mathematical reasoning: 95% accuracy (vs 89% for GPT-5)
- Code generation: 40% faster than previous version
- Multimodal understanding: Images, video, audio, text
- Context window: 2 million tokens
- Available via: Google Cloud Vertex AI`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374378127_dc649748.png',
    source: 'TechCrunch',
    category: 'Technology',
    published_at: '2025-12-20T09:45:00Z',
    created_at: '2025-12-20T09:45:00Z',
    updated_at: '2025-12-20T09:45:00Z',
    link: 'https://techcrunch.com/tag/google/'
  },
  {
    id: 'fallback-9',
    title: 'JPMorgan Predicts S&P 500 to Reach 6,500 by End of 2026',
    summary: 'JPMorgan strategists raised their S&P 500 target, citing strong corporate earnings, AI-driven productivity gains, and resilient consumer spending.',
    content: `JPMorgan Chase (JPM) has issued a bullish outlook for 2026, predicting the S&P 500 could reach 6,500 by year-end, representing a 12% upside from current levels.

Chief Market Strategist Marko Kolanovic cited AI-driven productivity gains, strong corporate earnings growth of 10-12%, and resilient consumer spending as key drivers. The bank expects technology and healthcare sectors to lead gains, with particular strength in AI-related stocks.

JPMorgan also raised its GDP growth forecast to 2.8% for 2026, above consensus estimates. The optimistic outlook comes despite concerns about elevated valuations in some market segments.

JPMorgan 2026 forecasts:
- S&P 500 target: 6,500 (+12%)
- GDP growth: 2.8%
- Corporate earnings growth: 10-12%
- Inflation: 2.3%
- Fed funds rate: 3.75-4.00%`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374371009_dc6d6a7e.jpg',
    source: 'Wall Street Journal',
    category: 'Markets',
    published_at: '2025-12-19T17:00:00Z',
    created_at: '2025-12-19T17:00:00Z',
    updated_at: '2025-12-19T17:00:00Z',
    link: 'https://www.wsj.com/market-data'
  },
  {
    id: 'fallback-10',
    title: 'Semiconductor Stocks Rally on Strong Holiday Demand Forecasts',
    summary: 'Chip stocks including NVIDIA, AMD, and TSMC surged as analysts project record semiconductor demand driven by AI infrastructure and consumer electronics.',
    content: `The semiconductor sector posted strong gains as analysts raised demand forecasts for 2026, citing AI infrastructure buildout and recovering consumer electronics markets.

NVIDIA led the rally with a 4% gain, followed by AMD (+3.5%) and TSMC (+3.2%). Industry analysts project global semiconductor revenue to exceed $700 billion in 2026, up 15% from 2025.

The growth is driven by data center expansion for AI workloads, 5G infrastructure deployment, and automotive chip demand. Memory chip makers also saw gains as DRAM and NAND prices stabilized after a prolonged downturn.

Semiconductor market outlook:
- 2026 revenue forecast: $700+ billion
- AI chip growth: 45% YoY
- Memory market recovery: 20% YoY
- Automotive chips: 25% YoY
- Top performers: NVIDIA, AMD, TSMC, ASML`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374368791_f0802509.jpg',
    source: 'Reuters',
    category: 'Technology',
    published_at: '2025-12-19T14:30:00Z',
    created_at: '2025-12-19T14:30:00Z',
    updated_at: '2025-12-19T14:30:00Z',
    link: 'https://www.reuters.com/technology/semiconductors/'
  },
  {
    id: 'fallback-11',
    title: 'Palantir Technologies Secures $2B Defense Contract',
    summary: 'Palantir announced a major defense contract worth $2 billion over five years, reinforcing its position as a key government technology partner.',
    content: `Palantir Technologies (PLTR) announced a landmark $2 billion defense contract with the U.S. Department of Defense, spanning five years.

The contract includes AI-powered analytics, cybersecurity solutions, and battlefield intelligence systems. CEO Alex Karp emphasized the company's unique position in providing enterprise AI solutions for government and defense applications.

The deal represents one of the largest software contracts in DoD history and validates Palantir's strategy of focusing on government clients. Shares rose 8% on the news, with analysts raising price targets.

Contract details:
- Total value: $2 billion over 5 years
- Annual revenue: ~$400 million
- Services: AI analytics, cybersecurity, intelligence
- Start date: Q1 2026
- Expansion options: Additional $500 million`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374374324_c1cdc246.jpg',
    source: "Barron's",
    category: 'Defense',
    published_at: '2025-12-19T11:15:00Z',
    created_at: '2025-12-19T11:15:00Z',
    updated_at: '2025-12-19T11:15:00Z',
    link: 'https://www.barrons.com/topics/palantir'
  },
  {
    id: 'fallback-12',
    title: 'Meta Platforms Reports Record VR Headset Sales This Holiday Season',
    summary: 'Meta Platforms announced record sales of its Quest VR headsets, with the new Quest 4 becoming the best-selling consumer electronics device of the holiday season.',
    content: `Meta Platforms (META) announced record sales of its Quest VR headsets during the 2025 holiday season. The Quest 4, launched in October, has become the best-selling consumer electronics device of the season, surpassing gaming consoles and tablets.

CEO Mark Zuckerberg revealed that the Reality Labs division is now profitable for the first time, marking a major milestone in Meta's metaverse strategy. The company also announced partnerships with major game studios to bring AAA titles to the platform.

Analysts project VR headset sales could reach 50 million units annually by 2027.

Quest 4 sales highlights:
- Units sold: 5+ million in Q4
- Revenue: $2.5 billion
- Market share: 72% of VR market
- Customer satisfaction: 4.7/5 stars
- Top games: Beat Saber, Horizon Worlds, Asgard's Wrath 2`,
    image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374373624_edf089d2.jpg',
    source: 'Yahoo Finance',
    category: 'Technology',
    published_at: '2025-12-18T16:00:00Z',
    created_at: '2025-12-18T16:00:00Z',
    updated_at: '2025-12-18T16:00:00Z',
    link: 'https://finance.yahoo.com/quote/META/'
  }
];

const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchStory();
  }, [id, user]);

  const fetchStory = async () => {
    try {
      // Check if this is a fallback or live story
      if (id?.startsWith('fallback-') || id?.startsWith('local-') || id?.startsWith('live-')) {
        const fallbackStory = fallbackStories.find(s => s.id === id);
        if (fallbackStory) {
          setStory(fallbackStory);
        } else if (id?.startsWith('live-')) {
          // For live stories, show a generic message
          setStory({
            id: id,
            title: 'Live News Story',
            summary: 'This is a live news story from our news feed.',
            content: 'Please visit the original source for the full article.',
            image_url: 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg',
            source: 'Live News',
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setStory(data);
      }

      if (user && id) {
        const { data: bookmarkData } = await supabase
          .from('story_bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('story_id', id)
          .maybeSingle();

        setIsBookmarked(!!bookmarkData);
      }
    } catch (error) {
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Don't try to bookmark fallback/live stories in the database
    if (id?.startsWith('fallback-') || id?.startsWith('local-') || id?.startsWith('live-')) {
      setIsBookmarked(!isBookmarked);
      return;
    }

    if (isBookmarked) {
      await supabase
        .from('story_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('story_id', id);
      setIsBookmarked(false);
    } else {
      await supabase
        .from('story_bookmarks')
        .insert({ user_id: user.id, story_id: id });
      setIsBookmarked(true);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Economy': return 'bg-blue-500/20 text-blue-400';
      case 'Technology': return 'bg-purple-500/20 text-purple-400';
      case 'Automotive': return 'bg-emerald-500/20 text-emerald-400';
      case 'Crypto': case 'Cryptocurrency': return 'bg-amber-500/20 text-amber-400';
      case 'Market News': case 'Markets': return 'bg-cyan-500/20 text-cyan-400';
      case 'Business': return 'bg-indigo-500/20 text-indigo-400';
      case 'E-Commerce': return 'bg-pink-500/20 text-pink-400';
      case 'Defense': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'Bloomberg': return 'text-orange-400';
      case 'Reuters': return 'text-blue-400';
      case 'TechCrunch': return 'text-emerald-400';
      case 'Wall Street Journal': return 'text-slate-300';
      case "Barron's": return 'text-red-400';
      case 'Yahoo Finance': return 'text-purple-400';
      default: return 'text-cyan-400';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: story?.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Story not found</h2>
          <button onClick={() => navigate('/stories')} className="text-cyan-400 hover:text-cyan-300">
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Image */}
      <div className="relative h-[400px] lg:h-[500px]">
        <img
          src={story.image_url || 'https://d64gsuwffb70l.cloudfront.net/6948a05a290b9817834305fb_1766374369391_3b20e84a.jpg'}
          alt={story.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-sm text-white rounded-xl hover:bg-black/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 lg:p-12">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {story.category && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(story.category)}`}>
                {story.category}
              </span>
            )}
            <span className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(story.published_at)}
            </span>
            <span className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              {formatTime(story.published_at)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
            {story.title}
          </h1>

          {/* Source & Actions */}
          <div className="flex items-center justify-between pb-8 mb-8 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Source:</span>
                <span className={`font-medium ${getSourceColor(story.source)}`}>{story.source}</span>
              </div>
              {story.link && (
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-all text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Read Original
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 hover:text-white transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isBookmarked
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-700 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>

          {/* Summary */}
          {story.summary && (
            <div className="bg-slate-900/50 rounded-xl p-6 mb-8 border-l-4 border-cyan-500">
              <p className="text-xl text-slate-300 leading-relaxed font-medium">
                {story.summary}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          {/* Read More Link */}
          {story.link && (
            <div className="mt-8 pt-8 border-t border-slate-700">
              <a
                href={story.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                Read Full Article on {story.source}
              </a>
            </div>
          )}

          {/* Related Info */}
          <div className="mt-8 p-4 bg-slate-900/50 rounded-xl">
            <p className="text-sm text-slate-400">
              This article was sourced from <span className={`font-medium ${getSourceColor(story.source)}`}>{story.source}</span> and is provided for informational purposes. 
              For the most up-to-date information, please visit the original source.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;
