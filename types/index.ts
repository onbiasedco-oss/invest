export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Stock {
  id: string;
  ticker: string;
  company_name: string;
  description?: string;
  website?: string;
  sector?: string;
  market_cap?: number;
  logo_url?: string;
  created_at: string;
}

export interface StockRating {
  id: string;
  stock_id: string;
  growth_score: number;
  value_score: number;
  profitability_score: number;
  financial_health_score: number;
  sentiment_score: number;
}

export interface StockHealthBreakdown {
  id: string;
  stock_id: string;
  eps: number;
  pe_ratio: number;
  debt_to_equity: number;
  free_cash_flow: number;
  profit_margin: number;
  eps_score: number;
  pe_score: number;
  de_score: number;
  fcf_score: number;
  margin_score: number;
}

export interface StockWithRating extends Stock {
  rating?: StockRating;
  health_breakdown?: StockHealthBreakdown;
  daily_change?: number;
  health_score?: number;
  performance_score?: number;
  rank_position?: number;
}

export interface Industry {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
}

export interface Story {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  source?: string;
  image_url?: string;
  category?: string;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  is_bookmarked?: boolean;
  link?: string;
}


export interface Course {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  is_published: boolean;
  sort_order: number;
  progress?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  video_url?: string;
  slide_url?: string;
  rich_text?: string;
  sort_order: number;
  is_completed?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  url?: string;
  content?: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  stock_id: string;
  stock?: Stock;
  list_name?: string;
}

export interface WatchlistGroup {
  id: string;
  name: string;
  stocks: StockWithRating[];
  color: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  story_id: string;
  story?: Story;
}

export interface NewsSource {
  name: string;
  icon: string;
  color: string;
}
