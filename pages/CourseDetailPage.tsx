import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Lock,
  Download,
  Share2,
  AlertCircle,
  List
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  content: string;
  duration_minutes: number;
  order_index: number;
}

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor_name: string;
  instructor_avatar: string;
  duration_hours: number;
  difficulty_level: string;
  category: string;
}

// Course-specific lesson data with YouTube videos
const courseLessonsMap: Record<string, { course: Course; lessons: Lesson[] }> = {
  // Stock Market Fundamentals
  '11111111-1111-1111-1111-111111111111': {
    course: {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Stock Market Fundamentals',
      description: 'Learn the basics of stock market investing, from understanding market mechanics to reading financial statements.',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      instructor_name: 'Dr. Sarah Mitchell',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      duration_hours: 8.5,
      difficulty_level: 'beginner',
      category: 'Investing Basics'
    },
    lessons: [
      {
        id: 'smf-lesson-1',
        course_id: '11111111-1111-1111-1111-111111111111',
        title: 'Introduction to Stock Markets',
        description: 'Understanding what stocks are and how markets work',
        video_url: 'https://www.youtube.com/embed/W-Sx_9QElfw',
        content: `# Welcome to Stock Market Investing!

In this lesson, we will cover the fundamental concepts that every investor needs to understand.

## What is a Stock?

A stock represents ownership in a company. When you buy a stock, you become a partial owner (shareholder) of that company.

## Key Takeaways

- Understanding market basics
- How exchanges operate
- The role of buyers and sellers`,
        duration_minutes: 25,
        order_index: 1
      },
      {
        id: 'smf-lesson-2',
        course_id: '11111111-1111-1111-1111-111111111111',
        title: 'Understanding Stock Prices',
        description: 'Learn what drives stock prices up and down',
        video_url: 'https://www.youtube.com/embed/8yDmq03XAHQ',
        content: `# Understanding Stock Prices

Stock prices are determined by supply and demand in the market.

## Factors Affecting Stock Prices

- Company earnings and performance
- Economic conditions
- Market sentiment
- Industry trends`,
        duration_minutes: 30,
        order_index: 2
      },
      {
        id: 'smf-lesson-3',
        course_id: '11111111-1111-1111-1111-111111111111',
        title: 'Reading Financial Statements',
        description: 'How to analyze income statements, balance sheets, and cash flow',
        video_url: 'https://www.youtube.com/embed/3BOE1A8HXeE',
        content: `# Reading Financial Statements

Financial statements are the foundation of fundamental analysis.

## The Three Main Financial Statements

- Income Statement
- Balance Sheet
- Cash Flow Statement`,
        duration_minutes: 35,
        order_index: 3
      },
      {
        id: 'smf-lesson-4',
        course_id: '11111111-1111-1111-1111-111111111111',
        title: 'Fundamental Analysis Basics',
        description: 'Key ratios and metrics for evaluating stocks',
        video_url: 'https://www.youtube.com/embed/kXYvRR7gV2E',
        content: `# Fundamental Analysis

Learn to evaluate stocks using key financial metrics.

## Essential Valuation Ratios

- P/E Ratio: Price to Earnings
- P/B Ratio: Price to Book
- Debt-to-Equity: Financial leverage
- ROE: Return on Equity`,
        duration_minutes: 40,
        order_index: 4
      },
      {
        id: 'smf-lesson-5',
        course_id: '11111111-1111-1111-1111-111111111111',
        title: 'Building Your First Portfolio',
        description: 'How to construct a diversified investment portfolio',
        video_url: 'https://www.youtube.com/embed/Hbe-BSRBEeA',
        content: `# Building Your First Portfolio

Now it's time to put your knowledge into action!

## Diversification Principles

- Spread investments across sectors
- Mix different asset classes
- Consider geographic diversity`,
        duration_minutes: 30,
        order_index: 5
      }
    ]
  },
  // Technical Analysis Mastery
  '22222222-2222-2222-2222-222222222222': {
    course: {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis strategies used by professional traders.',
      thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
      instructor_name: 'Michael Chen',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      duration_hours: 12.0,
      difficulty_level: 'intermediate',
      category: 'Trading'
    },
    lessons: [
      {
        id: 'ta-lesson-1',
        course_id: '22222222-2222-2222-2222-222222222222',
        title: 'Introduction to Technical Analysis',
        description: 'Understanding the basics of chart analysis and price action',
        video_url: 'https://www.youtube.com/embed/R3lFBU0R76A',
        content: `# Introduction to Technical Analysis

Technical analysis is the study of past market data to forecast future price movements.

## Key Concepts

- Price action and trends
- Support and resistance levels
- Volume analysis`,
        duration_minutes: 35,
        order_index: 1
      },
      {
        id: 'ta-lesson-2',
        course_id: '22222222-2222-2222-2222-222222222222',
        title: 'Chart Patterns',
        description: 'Learn to identify and trade common chart patterns',
        video_url: 'https://www.youtube.com/embed/KLHmpcT0hXc',
        content: `# Chart Patterns

Recognizing chart patterns is essential for technical traders.

## Common Patterns

- Head and Shoulders
- Double Tops and Bottoms
- Triangles and Wedges
- Flags and Pennants`,
        duration_minutes: 40,
        order_index: 2
      },
      {
        id: 'ta-lesson-3',
        course_id: '22222222-2222-2222-2222-222222222222',
        title: 'Technical Indicators',
        description: 'Master the most important technical indicators',
        video_url: 'https://www.youtube.com/embed/eynxyoKgpng',
        content: `# Technical Indicators

Indicators help confirm trends and identify entry/exit points.

## Popular Indicators

- Moving Averages (SMA, EMA)
- RSI (Relative Strength Index)
- MACD
- Bollinger Bands`,
        duration_minutes: 45,
        order_index: 3
      },
      {
        id: 'ta-lesson-4',
        course_id: '22222222-2222-2222-2222-222222222222',
        title: 'Trend Analysis',
        description: 'How to identify and follow market trends',
        video_url: 'https://www.youtube.com/embed/2fWI9WesWAI',
        content: `# Trend Analysis

The trend is your friend - learn to identify and trade with trends.

## Trend Types

- Uptrends
- Downtrends
- Sideways/Range-bound markets`,
        duration_minutes: 35,
        order_index: 4
      },
      {
        id: 'ta-lesson-5',
        course_id: '22222222-2222-2222-2222-222222222222',
        title: 'Building a Trading Strategy',
        description: 'Combine technical tools into a complete trading system',
        video_url: 'https://www.youtube.com/embed/sWTnFS10tdQ',
        content: `# Building a Trading Strategy

Put all the pieces together to create your trading plan.

## Strategy Components

- Entry rules
- Exit rules
- Risk management
- Position sizing`,
        duration_minutes: 40,
        order_index: 5
      }
    ]
  },
  // Options Trading Strategies
  '33333333-3333-3333-3333-333333333333': {
    course: {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Options Trading Strategies',
      description: 'Comprehensive guide to options trading including calls, puts, spreads, and advanced strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
      instructor_name: 'Jennifer Williams',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      duration_hours: 15.0,
      difficulty_level: 'advanced',
      category: 'Options'
    },
    lessons: [
      {
        id: 'opt-lesson-1',
        course_id: '33333333-3333-3333-3333-333333333333',
        title: 'Options Basics',
        description: 'Understanding calls, puts, and options terminology',
        video_url: 'https://www.youtube.com/embed/NiWYzA6nx8w',
        content: `# Options Basics

Options give you the right, but not the obligation, to buy or sell an asset.

## Key Terms

- Call options
- Put options
- Strike price
- Expiration date
- Premium`,
        duration_minutes: 40,
        order_index: 1
      },
      {
        id: 'opt-lesson-2',
        course_id: '33333333-3333-3333-3333-333333333333',
        title: 'Buying Calls and Puts',
        description: 'Learn when and how to buy options',
        video_url: 'https://www.youtube.com/embed/ezBWSsShIFI',
        content: `# Buying Calls and Puts

Understanding when to buy options for maximum profit potential.

## Strategies

- Long call for bullish outlook
- Long put for bearish outlook
- Managing risk with options`,
        duration_minutes: 45,
        order_index: 2
      },
      {
        id: 'opt-lesson-3',
        course_id: '33333333-3333-3333-3333-333333333333',
        title: 'Selling Options',
        description: 'Generate income by selling options',
        video_url: 'https://www.youtube.com/embed/YT1mGblSFoQ',
        content: `# Selling Options

Learn to generate income through options selling strategies.

## Income Strategies

- Covered calls
- Cash-secured puts
- Understanding assignment risk`,
        duration_minutes: 50,
        order_index: 3
      },
      {
        id: 'opt-lesson-4',
        course_id: '33333333-3333-3333-3333-333333333333',
        title: 'Options Spreads',
        description: 'Advanced multi-leg options strategies',
        video_url: 'https://www.youtube.com/embed/KHVQjrq8lgw',
        content: `# Options Spreads

Combine multiple options for defined risk strategies.

## Spread Types

- Vertical spreads
- Horizontal spreads
- Diagonal spreads
- Iron condors`,
        duration_minutes: 55,
        order_index: 4
      },
      {
        id: 'opt-lesson-5',
        course_id: '33333333-3333-3333-3333-333333333333',
        title: 'Options Risk Management',
        description: 'Managing risk in your options portfolio',
        video_url: 'https://www.youtube.com/embed/CcWEVXooggM',
        content: `# Options Risk Management

Protect your capital with proper risk management.

## Risk Concepts

- Position sizing
- The Greeks (Delta, Gamma, Theta, Vega)
- Portfolio hedging
- Rolling positions`,
        duration_minutes: 45,
        order_index: 5
      }
    ]
  },
  // Dividend Investing for Passive Income
  '44444444-4444-4444-4444-444444444444': {
    course: {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Dividend Investing for Passive Income',
      description: 'Build a portfolio that generates consistent passive income through dividend-paying stocks.',
      thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
      instructor_name: 'Robert Johnson',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      duration_hours: 6.0,
      difficulty_level: 'beginner',
      category: 'Income Investing'
    },
    lessons: [
      {
        id: 'div-lesson-1',
        course_id: '44444444-4444-4444-4444-444444444444',
        title: 'Introduction to Dividend Investing',
        description: 'Understanding dividends and their importance',
        video_url: 'https://www.youtube.com/embed/-Lh_eSj6g_g',
        content: `# Introduction to Dividend Investing

Dividends are payments made by companies to shareholders.

## Why Dividends Matter

- Regular income stream
- Compound growth potential
- Sign of company health`,
        duration_minutes: 25,
        order_index: 1
      },
      {
        id: 'div-lesson-2',
        course_id: '44444444-4444-4444-4444-444444444444',
        title: 'Evaluating Dividend Stocks',
        description: 'Key metrics for selecting dividend stocks',
        video_url: 'https://www.youtube.com/embed/TLRVh81EFu4',
        content: `# Evaluating Dividend Stocks

Learn to identify quality dividend-paying companies.

## Key Metrics

- Dividend yield
- Payout ratio
- Dividend growth rate
- Dividend history`,
        duration_minutes: 30,
        order_index: 2
      },
      {
        id: 'div-lesson-3',
        course_id: '44444444-4444-4444-4444-444444444444',
        title: 'Dividend Aristocrats',
        description: 'Investing in companies with long dividend histories',
        video_url: 'https://www.youtube.com/embed/w9LQP0Ha2qI',
        content: `# Dividend Aristocrats

Companies that have increased dividends for 25+ consecutive years.

## Benefits

- Proven track record
- Financial stability
- Reliable income growth`,
        duration_minutes: 28,
        order_index: 3
      },
      {
        id: 'div-lesson-4',
        course_id: '44444444-4444-4444-4444-444444444444',
        title: 'Building a Dividend Portfolio',
        description: 'Creating a diversified income portfolio',
        video_url: 'https://www.youtube.com/embed/cwm95e8BpbQ',
        content: `# Building a Dividend Portfolio

Construct a portfolio for maximum income and growth.

## Portfolio Strategy

- Sector diversification
- Yield vs growth balance
- Reinvestment strategies`,
        duration_minutes: 35,
        order_index: 4
      },
      {
        id: 'div-lesson-5',
        course_id: '44444444-4444-4444-4444-444444444444',
        title: 'Tax Considerations for Dividends',
        description: 'Understanding dividend taxation',
        video_url: 'https://www.youtube.com/embed/4NV3SVmnfu4',
        content: `# Tax Considerations for Dividends

Understand how dividends are taxed.

## Tax Types

- Qualified dividends
- Ordinary dividends
- Tax-advantaged accounts`,
        duration_minutes: 25,
        order_index: 5
      }
    ]
  },
  // Cryptocurrency & Blockchain Investing
  '55555555-5555-5555-5555-555555555555': {
    course: {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Cryptocurrency & Blockchain Investing',
      description: 'Understand blockchain technology and learn how to invest in cryptocurrencies safely.',
      thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
      instructor_name: 'Alex Rivera',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      duration_hours: 10.0,
      difficulty_level: 'intermediate',
      category: 'Crypto'
    },
    lessons: [
      {
        id: 'crypto-lesson-1',
        course_id: '55555555-5555-5555-5555-555555555555',
        title: 'Introduction to Cryptocurrency',
        description: 'Understanding digital currencies and blockchain',
        video_url: 'https://www.youtube.com/embed/aaMFEk5Zuq4',
        content: `# Introduction to Cryptocurrency

Cryptocurrencies are digital assets secured by cryptography.

## Key Concepts

- What is blockchain?
- How cryptocurrencies work
- Bitcoin and altcoins`,
        duration_minutes: 35,
        order_index: 1
      },
      {
        id: 'crypto-lesson-2',
        course_id: '55555555-5555-5555-5555-555555555555',
        title: 'Blockchain Technology',
        description: 'Deep dive into blockchain fundamentals',
        video_url: 'https://www.youtube.com/embed/O59gLZZUQcg',
        content: `# Blockchain Technology

Understanding the technology behind cryptocurrencies.

## Core Components

- Distributed ledger
- Consensus mechanisms
- Smart contracts`,
        duration_minutes: 40,
        order_index: 2
      },
      {
        id: 'crypto-lesson-3',
        course_id: '55555555-5555-5555-5555-555555555555',
        title: 'Major Cryptocurrencies',
        description: 'Overview of Bitcoin, Ethereum, and other major coins',
        video_url: 'https://www.youtube.com/embed/h2zG0Roj9Bc',
        content: `# Major Cryptocurrencies

Learn about the most important cryptocurrencies.

## Top Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Other significant altcoins`,
        duration_minutes: 38,
        order_index: 3
      },
      {
        id: 'crypto-lesson-4',
        course_id: '55555555-5555-5555-5555-555555555555',
        title: 'Crypto Wallets and Security',
        description: 'Securing your cryptocurrency investments',
        video_url: 'https://www.youtube.com/embed/2ByOXdddmDM',
        content: `# Crypto Wallets and Security

Protect your digital assets with proper security.

## Wallet Types

- Hot wallets
- Cold wallets
- Hardware wallets
- Security best practices`,
        duration_minutes: 35,
        order_index: 4
      },
      {
        id: 'crypto-lesson-5',
        course_id: '55555555-5555-5555-5555-555555555555',
        title: 'Crypto Investment Strategies',
        description: 'Building a cryptocurrency portfolio',
        video_url: 'https://www.youtube.com/embed/14HIIUjOLGY',
        content: `# Crypto Investment Strategies

Develop a strategy for cryptocurrency investing.

## Strategies

- Dollar-cost averaging
- Portfolio allocation
- Risk management
- Long-term vs trading`,
        duration_minutes: 42,
        order_index: 5
      }
    ]
  },
  // Portfolio Management & Risk
  '66666666-6666-6666-6666-666666666666': {
    course: {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Portfolio Management & Risk',
      description: 'Learn professional portfolio management techniques and risk mitigation strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      instructor_name: 'Dr. Emily Thompson',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      duration_hours: 9.0,
      difficulty_level: 'advanced',
      category: 'Portfolio Management'
    },
    lessons: [
      {
        id: 'pm-lesson-1',
        course_id: '66666666-6666-6666-6666-666666666666',
        title: 'Introduction to Portfolio Management',
        description: 'Fundamentals of managing an investment portfolio',
        video_url: 'https://www.youtube.com/embed/JO62uKBW4J8',
        content: `# Introduction to Portfolio Management

Learn the basics of professional portfolio management.

## Key Concepts

- Asset allocation
- Diversification
- Rebalancing`,
        duration_minutes: 35,
        order_index: 1
      },
      {
        id: 'pm-lesson-2',
        course_id: '66666666-6666-6666-6666-666666666666',
        title: 'Understanding Risk',
        description: 'Types of investment risk and how to measure them',
        video_url: 'https://www.youtube.com/embed/o7OnkMdmjLg',
        content: `# Understanding Risk

Different types of risk affect your investments.

## Risk Types

- Market risk
- Credit risk
- Liquidity risk
- Inflation risk`,
        duration_minutes: 40,
        order_index: 2
      },
      {
        id: 'pm-lesson-3',
        course_id: '66666666-6666-6666-6666-666666666666',
        title: 'Modern Portfolio Theory',
        description: 'Scientific approach to portfolio construction',
        video_url: 'https://www.youtube.com/embed/DLKhsZvcD-c',
        content: `# Modern Portfolio Theory

Optimize your portfolio using MPT principles.

## Key Concepts

- Efficient frontier
- Risk-return tradeoff
- Correlation and diversification`,
        duration_minutes: 45,
        order_index: 3
      },
      {
        id: 'pm-lesson-4',
        course_id: '66666666-6666-6666-6666-666666666666',
        title: 'Risk Management Strategies',
        description: 'Techniques to protect your portfolio',
        video_url: 'https://www.youtube.com/embed/85JY7t-2D-Y',
        content: `# Risk Management Strategies

Protect your investments with proper risk management.

## Strategies

- Stop-loss orders
- Hedging techniques
- Position sizing
- Portfolio insurance`,
        duration_minutes: 42,
        order_index: 4
      },
      {
        id: 'pm-lesson-5',
        course_id: '66666666-6666-6666-6666-666666666666',
        title: 'Performance Measurement',
        description: 'Evaluating your portfolio performance',
        video_url: 'https://www.youtube.com/embed/qAYtN5MfmGA',
        content: `# Performance Measurement

Track and evaluate your investment performance.

## Key Metrics

- Total return
- Risk-adjusted returns
- Sharpe ratio
- Benchmark comparison`,
        duration_minutes: 38,
        order_index: 5
      }
    ]
  }
};

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showLessonList, setShowLessonList] = useState(false);

  // Get fallback data based on course ID
  const getFallbackData = () => {
    if (id && courseLessonsMap[id]) {
      return courseLessonsMap[id];
    }
    // Default to Stock Market Fundamentals if course not found
    return courseLessonsMap['11111111-1111-1111-1111-111111111111'];
  };

  useEffect(() => {
    if (id) fetchCourseData();
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseData) {
        setCourse(courseData);
      } else {
        const fallback = getFallbackData();
        setCourse(fallback.course);
      }

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index');

      if (lessonsData && lessonsData.length > 0) {
        setLessons(lessonsData);
      } else {
        const fallback = getFallbackData();
        setLessons(fallback.lessons);
      }

      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*');

      if (quizzesData) {
        const quizMap: Record<string, Quiz> = {};
        quizzesData.forEach(q => {
          quizMap[q.lesson_id] = q;
        });
        setQuizzes(quizMap);

        // Fetch quiz questions
        const quizIds = quizzesData.map(q => q.id);
        if (quizIds.length > 0) {
          const { data: questionsData } = await supabase
            .from('quiz_questions')
            .select('*')
            .in('quiz_id', quizIds)
            .order('order_index');

          if (questionsData) {
            const questionsMap: Record<string, QuizQuestion[]> = {};
            questionsData.forEach(q => {
              if (!questionsMap[q.quiz_id]) {
                questionsMap[q.quiz_id] = [];
              }
              questionsMap[q.quiz_id].push(q);
            });
            setQuizQuestions(questionsMap);
          }
        }
      }

      // Fetch user progress
      if (user) {
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (progressData) {
          setCompletedLessons(new Set(progressData.map(p => p.lesson_id)));
        }

        // Check for certificate
        const { data: certData } = await supabase
          .from('certificates')
          .select('certificate_number')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .maybeSingle();

        if (certData) {
          setHasCertificate(true);
          setCertificateNumber(certData.certificate_number);
        }

        // Get last lesson
        const fallback = getFallbackData();
        const { data: courseProgressData } = await supabase
          .from('user_course_progress')
          .select('last_lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .maybeSingle();

        if (courseProgressData?.last_lesson_id) {
          const lastIndex = (lessonsData || fallback.lessons).findIndex(l => l.id === courseProgressData.last_lesson_id);
          if (lastIndex >= 0) setCurrentLessonIndex(lastIndex);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      const fallback = getFallbackData();
      setCourse(fallback.course);
      setLessons(fallback.lessons);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async () => {
    const currentLesson = lessons[currentLessonIndex];
    if (!currentLesson || !user) return;

    try {
      // Update lesson progress
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });

      setCompletedLessons(prev => new Set([...prev, currentLesson.id]));

      // Calculate overall progress
      const newCompletedCount = completedLessons.size + 1;
      const progressPercentage = Math.round((newCompletedCount / lessons.length) * 100);

      // Update course progress
      await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: id,
          last_lesson_id: currentLesson.id,
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? new Date().toISOString() : null
        }, { onConflict: 'user_id,course_id' });

      // Check if course is complete and issue certificate
      if (progressPercentage === 100 && !hasCertificate) {
        const certNumber = `CLUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await supabase
          .from('certificates')
          .insert({
            user_id: user.id,
            course_id: id,
            certificate_number: certNumber
          });
        setHasCertificate(true);
        setCertificateNumber(certNumber);
        setShowCertificateModal(true);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleQuizSubmit = async () => {
    const currentLesson = lessons[currentLessonIndex];
    const quiz = quizzes[currentLesson?.id];
    const questions = quizQuestions[quiz?.id] || [];

    if (!quiz || !questions.length) return;

    let correct = 0;
    questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (user) {
      await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score,
          passed: score >= quiz.passing_score,
          answers: quizAnswers
        });
    }

    if (score >= quiz.passing_score) {
      await markLessonComplete();
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      setShowLessonList(false);
    }
  };

  const selectLesson = (index: number) => {
    setCurrentLessonIndex(index);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setShowLessonList(false);
  };

  const currentLesson = lessons[currentLessonIndex];
  const currentQuiz = currentLesson ? quizzes[currentLesson.id] : null;
  const currentQuestions = currentQuiz ? quizQuestions[currentQuiz.id] || [] : [];
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Course not found</h2>
          <button onClick={() => navigate('/courses')} className="text-cyan-400 hover:text-cyan-300">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 sm:mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 truncate">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-400 text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {course.duration_hours}h
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  {lessons.length} lessons
                </span>
                <span className="capitalize px-2 py-0.5 bg-slate-700 rounded text-[10px] sm:text-xs">
                  {course.difficulty_level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {hasCertificate && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 text-emerald-400 rounded-lg sm:rounded-xl border border-emerald-500/50 text-xs sm:text-sm"
                >
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View Certificate</span>
                  <span className="sm:hidden">Cert</span>
                </button>
              )}
              <div className="text-right">
                <p className="text-[10px] sm:text-sm text-slate-400">Progress</p>
                <p className="text-lg sm:text-xl font-bold text-cyan-400">{progressPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Lesson Selector */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowLessonList(!showLessonList)}
            className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <List className="w-5 h-5 text-cyan-400" />
              <span className="text-white text-sm font-medium">
                Lesson {currentLessonIndex + 1} of {lessons.length}
              </span>
            </div>
            {showLessonList ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Mobile Lesson List Dropdown */}
          {showLessonList && (
            <div className="mt-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 space-y-1">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id);
                const isCurrent = index === currentLessonIndex;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(index)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-900/50 border border-transparent hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-cyan-500'
                        : 'bg-slate-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-white text-xs">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        isCurrent ? 'text-cyan-400' : 'text-white'
                      }`}>
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Video Player */}
            {currentLesson && !showQuiz && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={currentLesson.video_url}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">{currentLesson.title}</h2>
                  <p className="text-slate-400 text-sm mb-3 sm:mb-4">{currentLesson.description}</p>
                  
                  {/* Lesson Content */}
                  <div className="prose prose-invert max-w-none text-sm">
                    {currentLesson.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-lg sm:text-2xl font-bold text-white mt-4 sm:mt-6 mb-2 sm:mb-4">{line.slice(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-base sm:text-xl font-semibold text-white mt-3 sm:mt-4 mb-2 sm:mb-3">{line.slice(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-sm sm:text-lg font-medium text-white mt-2 sm:mt-3 mb-1 sm:mb-2">{line.slice(4)}</h3>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="text-slate-300 ml-4 text-sm">{line.slice(2)}</li>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="text-white font-semibold text-sm">{line.slice(2, -2)}</p>;
                      }
                      if (line.trim()) {
                        return <p key={i} className="text-slate-300 mb-2 text-sm">{line}</p>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700">
                    {currentQuiz && currentQuestions.length > 0 ? (
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                      >
                        Take Quiz
                      </button>
                    ) : (
                      <button
                        onClick={markLessonComplete}
                        disabled={completedLessons.has(currentLesson.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all ${
                          completedLessons.has(currentLesson.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        {completedLessons.has(currentLesson.id) ? 'Completed' : 'Mark Complete'}
                      </button>
                    )}
                    
                    {currentLessonIndex < lessons.length - 1 && (
                      <button
                        onClick={goToNextLesson}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:bg-slate-600 transition-all"
                      >
                        Next Lesson
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Section */}
            {showQuiz && currentQuiz && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">{currentQuiz.title}</h2>

                {!quizSubmitted ? (
                  <div className="space-y-4 sm:space-y-6">
                    {currentQuestions.map((question, qIndex) => (
                      <div key={question.id} className="p-3 sm:p-4 bg-slate-900/50 rounded-lg sm:rounded-xl">
                        <p className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <label
                              key={oIndex}
                              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all text-sm ${
                                quizAnswers[question.id] === oIndex
                                  ? 'bg-cyan-500/20 border border-cyan-500/50'
                                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                checked={quizAnswers[question.id] === oIndex}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [question.id]: oIndex }))}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                quizAnswers[question.id] === oIndex
                                  ? 'border-cyan-500 bg-cyan-500'
                                  : 'border-slate-500'
                              }`}>
                                {quizAnswers[question.id] === oIndex && (
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="text-slate-300">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={() => setShowQuiz(false)}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:bg-slate-600 transition-all"
                      >
                        Back to Lesson
                      </button>
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length !== currentQuestions.length}
                        className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      quizScore! >= currentQuiz.passing_score
                        ? 'bg-emerald-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {quizScore! >= currentQuiz.passing_score ? (
                        <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-400" />
                      )}
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
                      {quizScore! >= currentQuiz.passing_score ? 'Congratulations!' : 'Keep Learning!'}
                    </h3>
                    <p className="text-slate-400 mb-4 text-sm">
                      You scored {quizScore}% (Passing: {currentQuiz.passing_score}%)
                    </p>

                    {/* Show answers */}
                    <div className="text-left space-y-3 sm:space-y-4 mt-6 sm:mt-8">
                      {currentQuestions.map((question, qIndex) => {
                        const userAnswer = quizAnswers[question.id];
                        const isCorrect = userAnswer === question.correct_answer;
                        return (
                          <div key={question.id} className="p-3 sm:p-4 bg-slate-900/50 rounded-lg sm:rounded-xl">
                            <p className="text-white font-medium mb-2 text-sm">
                              {qIndex + 1}. {question.question}
                            </p>
                            <p className={`text-xs sm:text-sm ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                              Your answer: {question.options[userAnswer]} {isCorrect ? '✓' : '✗'}
                            </p>
                            {!isCorrect && (
                              <p className="text-xs sm:text-sm text-emerald-400">
                                Correct answer: {question.options[question.correct_answer]}
                              </p>
                            )}
                            {question.explanation && (
                              <p className="text-xs sm:text-sm text-slate-400 mt-2">{question.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                      {quizScore! < currentQuiz.passing_score && (
                        <button
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="flex-1 py-2.5 sm:py-3 bg-slate-700 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:bg-slate-600 transition-all"
                        >
                          Retry Quiz
                        </button>
                      )}
                      {currentLessonIndex < lessons.length - 1 && quizScore! >= currentQuiz.passing_score && (
                        <button
                          onClick={goToNextLesson}
                          className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                        >
                          Next Lesson
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Lesson List (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Course Content</h3>
              <div className="space-y-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  const isCurrent = index === currentLessonIndex;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        isCurrent
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-900/50 border border-transparent hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-cyan-500'
                          : 'bg-slate-700'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-slate-400">{lesson.duration_minutes} min</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-lg w-full">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Certificate of Completion</h2>
              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">
                Congratulations on completing {course.title}!
              </p>
              
              <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Certificate Number</p>
                <p className="text-sm sm:text-lg font-mono text-cyan-400 break-all">{certificateNumber}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-slate-700 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(certificateNumber);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Number
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
