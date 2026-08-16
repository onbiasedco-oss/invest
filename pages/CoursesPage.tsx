import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Presentation, 
  ClipboardList,
  Play,
  Download,
  ExternalLink,
  ChevronRight,
  Clock,
  Users,
  Award,
  CheckCircle,
  BarChart,
  Layers,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Medal,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import LessonQuiz from '@/components/ui/LessonQuiz';
import { lessonQuizzes } from '@/data/quizQuestions';
import CourseProgressCard from '@/components/ui/CourseProgressCard';
import SlideProgressCard from '@/components/ui/SlideProgressCard';
import useCourseProgress from '@/hooks/useCourseProgress';

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
  is_published: boolean;
}

interface SlideLesson {
  id: string;
  title: string;
  slideCount: number;
  presentationId: string;
  description: string;
}

interface LessonVideoUrl {
  lesson_id: string;
  video_url: string;
  video_title: string | null;
}

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'lessons' | 'all' | 'in-progress' | 'completed'>('lessons');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState<string | null>(null);
  const [lessonVideoUrls, setLessonVideoUrls] = useState<Record<string, LessonVideoUrl>>({});

  // Use the course progress hook
  const {
    courseProgress,
    quizScores,
    slideProgress,
    loading: progressLoading,
    markSlideViewed,
    getResumeSlideLessonId,
    getSlideCourseProgress,
    getSlideLessonsViewed,
    refreshProgress
  } = useCourseProgress();

  // Slide deck lessons
  const slideLessons: SlideLesson[] = [
    {
      id: 'lesson-1',
      title: 'Lesson 1: What Are Stocks And Why Invest',
      slideCount: 9,
      presentationId: '1woW6zyMuKHLS_677iCrwK_EGO5fEtpprwEuzQJXNQnM',
      description: 'Learn the fundamentals of stocks and discover why investing is essential for building wealth.'
    },
    {
      id: 'lesson-2',
      title: 'Lesson 2: How The Stock Market Works',
      slideCount: 13,
      presentationId: '1c8AiQGlVq5tUrp10fQiM5uQ-VVO3qS0iR_NuDFU_010',
      description: 'Understand the mechanics of the stock market, including exchanges, trading, and market participants.'
    },
    {
      id: 'lesson-3',
      title: 'Lesson 3: Understand Risk to Reward',
      slideCount: 14,
      presentationId: '19MR0MUBhK_aHxYq7Xjjcy0wGnbhhT5G0nXMVdJvI-aM',
      description: 'Master the concept of risk vs. reward and learn how to evaluate investment opportunities.'
    },
    {
      id: 'lesson-4',
      title: 'Lesson 4: How To Pick Stocks',
      slideCount: 16,
      presentationId: '1QKwkJocqTkpIXGh0HtrEbEkYICSf8M9_JnCOsX96xFc',
      description: 'Discover proven strategies and criteria for selecting winning stocks for your portfolio.'
    },
    {
      id: 'lesson-5',
      title: 'Lesson 5: Building And Managing A Portfolio',
      slideCount: 10,
      presentationId: '1tKLQ0rzUaE7iukU9LVSIXDRE4XBFQuXddXapTB5-9DQ',
      description: 'Learn how to construct a diversified portfolio and manage it effectively over time.'
    },
    {
      id: 'lesson-6',
      title: 'Lesson 6: Practical Steps to Start Investing',
      slideCount: 8,
      presentationId: '1c6UVqvvGwDxTJvr-k-x7urqRGpLqC0XOnDX54SyWGAw',
      description: 'Get actionable steps to begin your investing journey today with confidence.'
    }
  ];

  // Fallback courses if database is empty
  const fallbackCourses: Course[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Stock Market Fundamentals',
      description: 'Learn the basics of stock market investing, from understanding market mechanics to reading financial statements.',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      instructor_name: 'Dr. Sarah Mitchell',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      duration_hours: 8.5,
      difficulty_level: 'beginner',
      category: 'Investing Basics',
      is_published: true
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis strategies used by professional traders.',
      thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
      instructor_name: 'Michael Chen',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      duration_hours: 12.0,
      difficulty_level: 'intermediate',
      category: 'Trading',
      is_published: true
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Options Trading Strategies',
      description: 'Comprehensive guide to options trading including calls, puts, spreads, and advanced strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
      instructor_name: 'Jennifer Williams',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      duration_hours: 15.0,
      difficulty_level: 'advanced',
      category: 'Options',
      is_published: true
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Dividend Investing for Passive Income',
      description: 'Build a portfolio that generates consistent passive income through dividend-paying stocks.',
      thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
      instructor_name: 'Robert Johnson',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      duration_hours: 6.0,
      difficulty_level: 'beginner',
      category: 'Income Investing',
      is_published: true
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Cryptocurrency & Blockchain Investing',
      description: 'Understand blockchain technology and learn how to invest in cryptocurrencies safely.',
      thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
      instructor_name: 'Alex Rivera',
      instructor_avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      duration_hours: 10.0,
      difficulty_level: 'intermediate',
      category: 'Crypto',
      is_published: true
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Portfolio Management & Risk',
      description: 'Learn professional portfolio management techniques and risk mitigation strategies.',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      instructor_name: 'Dr. Emily Thompson',
      instructor_avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      duration_hours: 9.0,
      difficulty_level: 'advanced',
      category: 'Portfolio Management',
      is_published: true
    }
  ];

  useEffect(() => {
    fetchData();
    fetchLessonVideoUrls();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at');

      if (coursesData && coursesData.length > 0) {
        setCourses(coursesData);
      } else {
        setCourses(fallbackCourses);
      }

      // Fetch certificates
      if (user) {
        const { data: certsData } = await supabase
          .from('certificates')
          .select('course_id')
          .eq('user_id', user.id);

        if (certsData) {
          setCertificates(certsData.map(c => c.course_id));
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  };

  // Fetch video URLs for all lessons
  const fetchLessonVideoUrls = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_video_urls')
        .select('lesson_id, video_url, video_title');

      if (data && !error) {
        const urlMap: Record<string, LessonVideoUrl> = {};
        data.forEach((item: any) => {
          urlMap[item.lesson_id] = {
            lesson_id: item.lesson_id,
            video_url: item.video_url,
            video_title: item.video_title
          };
        });
        setLessonVideoUrls(urlMap);
      }
    } catch (error) {
      console.error('Error fetching lesson video URLs:', error);
    }
  };

  // Save a video URL for a lesson (manual check-then-insert/update to avoid ON CONFLICT issues)

  const handleVideoUrlSave = async (lessonId: string, url: string, title: string) => {
    try {
      // First check if a record already exists for this lesson
      const { data: existing, error: selectError } = await supabase
        .from('lesson_video_urls')
        .select('id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('lesson_video_urls')
          .update({
            video_url: url,
            video_title: title,
            updated_at: new Date().toISOString()
          })
          .eq('lesson_id', lessonId);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('lesson_video_urls')
          .insert({
            lesson_id: lessonId,
            video_url: url,
            video_title: title,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setLessonVideoUrls(prev => ({
        ...prev,
        [lessonId]: {
          lesson_id: lessonId,
          video_url: url,
          video_title: title
        }
      }));
    } catch (error) {
      console.error('Error saving video URL:', error);
      throw error;
    }
  };


  // Delete a video URL for a lesson
  const handleVideoUrlDelete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_video_urls')
        .delete()
        .eq('lesson_id', lessonId);

      if (error) throw error;

      // Update local state
      setLessonVideoUrls(prev => {
        const updated = { ...prev };
        delete updated[lessonId];
        return updated;
      });
    } catch (error) {
      console.error('Error deleting video URL:', error);
    }
  };

  const categories = ['all', ...new Set(courses.map(c => c.category))];

  const filteredCourses = courses.filter(course => {
    const progress = courseProgress[course.id];
    
    if (activeTab === 'in-progress' && (!progress || progress.progress_percentage === 0 || progress.completed_at)) {
      return false;
    }
    if (activeTab === 'completed' && (!progress || !progress.completed_at)) {
      return false;
    }
    if (selectedCategory !== 'all' && course.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Calculate slide course stats
  const completedQuizzes = Object.keys(quizScores).filter(
    lessonId => slideLessons.some(l => l.id === lessonId) && quizScores[lessonId]?.passed
  ).length;
  const totalQuizzes = slideLessons.length;
  const slideLessonsViewed = getSlideLessonsViewed(slideLessons);
  const slideCourseProgress = getSlideCourseProgress(slideLessons);
  const averageScore = completedQuizzes > 0 
    ? Object.entries(quizScores)
        .filter(([lessonId]) => slideLessons.some(l => l.id === lessonId))
        .reduce((acc, [, r]) => acc + r.percentage, 0) / completedQuizzes 
    : 0;

  const stats = {
    total: courses.length,
    inProgress: Object.values(courseProgress).filter(p => p.progress_percentage > 0 && !p.completed_at).length,
    completed: certificates.length,
    lessons: slideLessons.length,
    quizzesPassed: completedQuizzes,
    lessonsViewed: slideLessonsViewed
  };

  const toggleLesson = (lessonId: string) => {
    if (expandedLesson === lessonId) {
      setExpandedLesson(null);
      setShowQuiz(null);
    } else {
      setExpandedLesson(lessonId);
      setShowQuiz(null);
      // Mark as viewed when expanded
      if (user) {
        const lesson = slideLessons.find(l => l.id === lessonId);
        if (lesson) {
          markSlideViewed(lessonId, lesson.slideCount);
        }
      }
    }
  };

  const handleQuizComplete = (lessonId: string, score: number, total: number) => {
    // Refresh progress data after quiz completion
    refreshProgress();
  };

  const handleResumeCourse = (courseId: string, lessonId: string | null) => {
    navigate(`/courses/${courseId}${lessonId ? `?lesson=${lessonId}` : ''}`);
  };

  const handleResumeSlides = () => {
    const resumeId = getResumeSlideLessonId(slideLessons);
    if (resumeId) {
      setExpandedLesson(resumeId);
      setShowQuiz(null);
      // Scroll to the lesson
      setTimeout(() => {
        document.getElementById(`lesson-${resumeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  if (loading || progressLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Learning Center</h1>
              <p className="text-slate-400 text-sm sm:text-base">Master investing with our comprehensive courses</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
                  <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.lessons}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">Slide Lessons</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.quizzesPassed}/{totalQuizzes}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">Quizzes Passed</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.lessonsViewed}/{stats.lessons}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">Viewed</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">Video Courses</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg">
                  <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stats.inProgress}</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">In Progress</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{averageScore.toFixed(0)}%</p>
                  <p className="text-slate-400 text-[10px] sm:text-sm">Avg Quiz Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
            {[
              { id: 'lessons', label: 'Slides', icon: Presentation },
              { id: 'all', label: 'Courses', icon: BookOpen },
              { id: 'in-progress', label: 'Progress', icon: BarChart },
              { id: 'completed', label: 'Done', icon: Award }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {activeTab !== 'lessons' && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-16">
        {/* Slide Lessons Section */}
        {activeTab === 'lessons' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Investment Fundamentals Course</h2>
              </div>
              
              {/* Resume Button */}
              {user && slideLessonsViewed > 0 && completedQuizzes < totalQuizzes && (
                <button
                  onClick={handleResumeSlides}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Resume Course
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">
              Complete this 6-lesson course to build a solid foundation in stock market investing. 
              Each lesson includes interactive slides and a quiz to test your knowledge.
            </p>

            {/* Overall Progress Bar for Slide Course */}
            {user && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">Your Progress</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{slideCourseProgress}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${slideCourseProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{slideLessonsViewed} of {slideLessons.length} lessons viewed</span>
                  <span>{completedQuizzes} of {totalQuizzes} quizzes passed</span>
                </div>
              </div>
            )}

            {slideLessons.map((lesson, index) => {
              const quiz = lessonQuizzes.find(q => q.lessonId === lesson.id);
              const quizResult = quizScores[lesson.id];
              const lessonSlideProgress = slideProgress[lesson.id];
              const videoData = lessonVideoUrls[lesson.id];
              
              return (
                <div key={lesson.id} id={`lesson-${lesson.id}`}>
                  <SlideProgressCard
                    lesson={lesson}
                    index={index}
                    isExpanded={expandedLesson === lesson.id}
                    onToggle={() => toggleLesson(lesson.id)}
                    quizResult={quizResult ? {
                      score: quizResult.score,
                      total_questions: quizResult.total_questions,
                      percentage: quizResult.percentage,
                      passed: quizResult.passed,
                      completed_at: quizResult.completed_at
                    } : undefined}
                    slideProgress={lessonSlideProgress}
                    onStartQuiz={() => setShowQuiz(lesson.id)}
                    showQuiz={showQuiz === lesson.id}
                    onMarkViewed={() => markSlideViewed(lesson.id, lesson.slideCount)}
                    videoUrl={videoData?.video_url}
                    videoTitle={videoData?.video_title || undefined}
                    isAdmin={user?.is_admin || false}
                    onVideoUrlSave={handleVideoUrlSave}
                    onVideoUrlDelete={handleVideoUrlDelete}
                    quizComponent={
                      showQuiz === lesson.id && quiz ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                              Knowledge Check
                            </h4>
                            <button
                              onClick={() => setShowQuiz(null)}
                              className="text-slate-400 hover:text-white text-xs sm:text-sm"
                            >
                              Back to Slides
                            </button>
                          </div>
                          <LessonQuiz 
                            quiz={quiz} 
                            onComplete={(score, total) => handleQuizComplete(lesson.id, score, total)}
                          />
                        </div>
                      ) : null
                    }
                  />
                </div>
              );
            })}

            {/* Course Completion CTA */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl sm:rounded-2xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-500/30 rounded-lg sm:rounded-xl">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Course Progress</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {completedQuizzes === totalQuizzes 
                        ? 'Congratulations! You\'ve completed all quizzes!'
                        : `Complete all ${totalQuizzes} quizzes. ${completedQuizzes}/${totalQuizzes} done.`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
                  <div className="text-left sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                      {slideLessons.reduce((acc, l) => acc + l.slideCount, 0)}
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm">Total Slides</p>
                  </div>
                  <Link
                    to="/leaderboard"
                    className="flex items-center justify-center gap-2 flex-1 lg:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
                  >
                    <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">View Leaderboard</span>
                    <span className="sm:hidden">Leaderboard</span>
                  </Link>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-slate-400">Quiz Completion</span>
                  <span className="text-purple-400">{completedQuizzes}/{totalQuizzes} quizzes</span>
                </div>
                <div className="h-2 sm:h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedQuizzes / totalQuizzes) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {activeTab !== 'lessons' && (
          <>
            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCourses.map((course) => {
                  const progress = courseProgress[course.id];
                  const hasCertificate = certificates.includes(course.id);

                  return (
                    <CourseProgressCard
                      key={course.id}
                      course={course}
                      progress={progress ? {
                        progress_percentage: progress.progress_percentage,
                        completed_at: progress.completed_at,
                        last_lesson_id: progress.last_lesson_id,
                        lessons_viewed: progress.lessons_viewed,
                        lessons_completed: progress.lessons_completed,
                        total_lessons: progress.total_lessons
                      } : undefined}
                      hasCertificate={hasCertificate}
                      onResume={handleResumeCourse}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No courses found</h3>
                <p className="text-slate-400 text-sm">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
