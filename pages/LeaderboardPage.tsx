import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Star, 
  Zap, 
  BookOpen, 
  Rocket, 
  GraduationCap,
  CheckCircle,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  ChevronDown,
  Loader2,
  User,
  Target,
  Sparkles,
  RefreshCw,
  Clock,
  UserCheck,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { lessonQuizzes } from '@/data/quizQuestions';
import GuestGate from '@/components/ui/GuestGate';




interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_email: string;
  user_name: string;
  avatar_url: string | null;
  total_quizzes: number;
  avg_score: number;
  total_score: number;
  total_points: number;
  lessons_passed: number;
  badges: Badge[];
  last_quiz_at?: string;
  has_completed_quiz: boolean;
}

const BadgeIcon: React.FC<{ badge: Badge; size?: 'sm' | 'md' | 'lg' }> = ({ badge, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses: Record<string, string> = {
    gold: 'text-yellow-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-300',
    indigo: 'text-indigo-400',
    teal: 'text-teal-400',
    amber: 'text-amber-400',
    pink: 'text-pink-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400'
  };

  const iconMap: Record<string, React.ReactNode> = {
    'crown': <Crown className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'star': <Star className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'award': <Award className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'check-circle': <CheckCircle className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'book': <BookOpen className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'book-open': <BookOpen className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'rocket': <Rocket className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'zap': <Zap className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'graduation-cap': <GraduationCap className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'trophy': <Trophy className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'target': <Target className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'sparkles': <Sparkles className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />,
    'trending-up': <TrendingUp className={`${sizeClasses[size]} ${colorClasses[badge.color]}`} />
  };

  return iconMap[badge.icon] || <Award className={`${sizeClasses[size]} ${colorClasses[badge.color] || 'text-slate-400'}`} />;
};


const RankBadge: React.FC<{ rank: number; hasPoints: boolean }> = ({ rank, hasPoints }) => {
  if (!hasPoints) {
    return (
      <div className="flex items-center justify-center w-10 h-10 bg-slate-700/50 rounded-full">
        <span className="text-sm font-medium text-slate-500">-</span>
      </div>
    );
  }
  
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg shadow-yellow-500/30">
        <Trophy className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full shadow-lg shadow-slate-400/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full shadow-lg shadow-amber-600/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 bg-slate-700 rounded-full">
      <span className="text-sm font-bold text-slate-300">{rank}</span>
    </div>
  );
};

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'weekly'>('all');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);
  const [totalVerifiedUsers, setTotalVerifiedUsers] = useState(0);
  const [usersWithPoints, setUsersWithPoints] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalQuizAttempts, setTotalQuizAttempts] = useState(0);

  // Calculate total quizzes available on the platform
  const totalQuizzesOnPlatform = lessonQuizzes.length;
  const totalQuestionsOnPlatform = lessonQuizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const maxPointsPerQuiz = totalQuestionsOnPlatform * 10; // 10 points per question

  const lessons = [
    { id: 'all', name: 'All Lessons' },
    ...lessonQuizzes.map(q => ({ id: q.lessonId, name: q.title }))
  ];

  // Generate badges based on user stats
  const generateBadges = (totalPoints: number, totalQuizzes: number, lessonsPassed: number): Badge[] => {
    const badges: Badge[] = [];
    
    if (totalPoints >= 500) {
      badges.push({ id: 'points-master', name: 'Points Master', icon: 'trophy', color: 'gold' });
    } else if (totalPoints >= 300) {
      badges.push({ id: 'points-expert', name: 'Points Expert', icon: 'star', color: 'purple' });
    } else if (totalPoints >= 150) {
      badges.push({ id: 'points-achiever', name: 'Points Achiever', icon: 'award', color: 'blue' });
    }
    
    if (totalQuizzes >= 6) {
      badges.push({ id: 'completionist', name: 'Completionist', icon: 'check-circle', color: 'green' });
    } else if (totalQuizzes >= 3) {
      badges.push({ id: 'dedicated', name: 'Dedicated Learner', icon: 'book', color: 'cyan' });
    }
    
    if (lessonsPassed >= 6) {
      badges.push({ id: 'graduate', name: 'Graduate', icon: 'graduation-cap', color: 'indigo' });
    }
    
    return badges;
  };

  const fetchLeaderboard = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Step 1: Fetch ALL verified users
      const { data: verifiedUsers, error: verifiedError } = await supabase
        .from('verified_users')
        .select('email, created_at')
        .order('created_at', { ascending: true });

      if (verifiedError) {
        console.error('Error fetching verified users:', verifiedError);
        setLeaderboard([]);
        return;
      }

      // Step 2: Fetch all users with their profile info
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url');

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create a map of email to user profile
      const userProfileMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {};
      (allUsers || []).forEach((u: any) => {
        if (u.email) {
          userProfileMap[u.email.toLowerCase()] = {
            id: u.id,
            full_name: u.full_name || u.email.split('@')[0],
            avatar_url: u.avatar_url
          };
        }
      });

      // Step 3: Fetch all quiz results
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_results')
        .select('user_id, lesson_id, score, percentage, completed_at')
        .order('completed_at', { ascending: false });

      if (quizError) {
        console.error('Error fetching quiz results:', quizError);
      }

      // Count total quiz attempts across the platform
      setTotalQuizAttempts(quizResults?.length || 0);

      // Create a map of user_id to their quiz stats
      const userQuizStatsMap: Record<string, {
        total_quizzes: number;
        total_score: number;
        total_points: number;
        lessons_passed: number;
        passed_lessons: Set<string>;
        last_quiz_at: string;
      }> = {};

      (quizResults || []).forEach((result: any) => {
        const userId = result.user_id;
        const points = (result.score || 0) * 10; // 10 points per correct answer
        
        if (!userQuizStatsMap[userId]) {
          userQuizStatsMap[userId] = {
            total_quizzes: 0,
            total_score: 0,
            total_points: 0,
            lessons_passed: 0,
            passed_lessons: new Set(),
            last_quiz_at: result.completed_at
          };
        }
        
        userQuizStatsMap[userId].total_quizzes += 1;
        userQuizStatsMap[userId].total_score += result.score || 0;
        userQuizStatsMap[userId].total_points += points;
        
        if (result.percentage >= 60) {
          userQuizStatsMap[userId].passed_lessons.add(result.lesson_id);
        }
        
        if (result.completed_at > userQuizStatsMap[userId].last_quiz_at) {
          userQuizStatsMap[userId].last_quiz_at = result.completed_at;
        }
      });

      // Step 4: Build leaderboard entries for ALL verified users
      const leaderboardEntries: LeaderboardEntry[] = (verifiedUsers || []).map((verifiedUser: any) => {
        const email = verifiedUser.email.toLowerCase();
        const userProfile = userProfileMap[email];
        const userId = userProfile?.id || '';
        const quizStats = userId ? userQuizStatsMap[userId] : null;
        
        const totalPoints = quizStats?.total_points || 0;
        const totalQuizzes = quizStats?.total_quizzes || 0;
        const lessonsPassed = quizStats?.passed_lessons?.size || 0;
        
        return {
          rank: 0, // Will be assigned after sorting
          user_id: userId,
          user_email: email,
          user_name: userProfile?.full_name || email.split('@')[0],
          avatar_url: userProfile?.avatar_url || null,
          total_quizzes: totalQuizzes,
          avg_score: totalQuizzes > 0 ? Math.round((quizStats!.total_score / totalQuizzes) * 100) / 100 : 0,
          total_score: quizStats?.total_score || 0,
          total_points: totalPoints,
          lessons_passed: lessonsPassed,
          badges: generateBadges(totalPoints, totalQuizzes, lessonsPassed),
          last_quiz_at: quizStats?.last_quiz_at,
          has_completed_quiz: totalQuizzes > 0
        };
      });

      // Step 5: Sort by total points (descending), then by name for users with 0 points
      leaderboardEntries.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        // If both have same points, sort alphabetically by name
        return a.user_name.localeCompare(b.user_name);
      });

      // Step 6: Assign ranks (only for users with points)
      let currentRank = 1;
      leaderboardEntries.forEach((entry, index) => {
        if (entry.total_points > 0) {
          // Check if same points as previous entry
          if (index > 0 && entry.total_points === leaderboardEntries[index - 1].total_points) {
            entry.rank = leaderboardEntries[index - 1].rank;
          } else {
            entry.rank = currentRank;
          }
          currentRank++;
        } else {
          entry.rank = 0; // No rank for users with 0 points
        }
      });

      setLeaderboard(leaderboardEntries);
      setTotalVerifiedUsers(leaderboardEntries.length);
      setUsersWithPoints(leaderboardEntries.filter(e => e.total_points > 0).length);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter, lessonFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh every 30 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboard(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Note: Realtime subscription removed to fix "n is not iterable" binary decode error.
  // The 30-second polling interval above already handles live updates reliably.


  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const currentUserRank = leaderboard.find(entry => entry.user_id === user?.id)?.rank || 0;
  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id);

  // Get users with points for podium display
  const usersWithPointsList = leaderboard.filter(e => e.total_points > 0);
  const topThree = usersWithPointsList.slice(0, 3);
  
  // Get the top scorer's points for display
  const topPoints = usersWithPointsList.length > 0 ? usersWithPointsList[0]?.total_points || 0 : 0;

  // Calculate total points across all users
  const totalPointsAllUsers = leaderboard.reduce((sum, entry) => sum + (entry.total_points || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full border border-yellow-500/30 mb-6">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Quiz Champions</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Leaders Dashboard
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Earn 10 points for each correct answer. All verified users are ranked by total points!
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalVerifiedUsers}</p>
                  <p className="text-sm text-slate-400">Verified Users</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileQuestion className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalQuizzesOnPlatform}</p>
                  <p className="text-sm text-slate-400">Total Quizzes</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalQuestionsOnPlatform}</p>
                  <p className="text-sm text-slate-400">Total Questions</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {topPoints > 0 ? topPoints : '-'}
                  </p>
                  <p className="text-sm text-slate-400">Top Points</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {currentUserRank > 0 ? `#${currentUserRank}` : '-'}
                  </p>
                  <p className="text-sm text-slate-400">Your Rank</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuestGate showPreview={true} preMessage="Sign up to access the full Leaderboard and quiz rankings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Quiz Stats Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Platform Quiz Statistics</h3>
                <p className="text-slate-400 text-sm">
                  <span className="text-purple-400 font-semibold">{totalQuizzesOnPlatform} quizzes</span> available with{' '}
                  <span className="text-cyan-400 font-semibold">{totalQuestionsOnPlatform} total questions</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Max per quiz: <span className="text-amber-400 font-bold">{maxPointsPerQuiz} pts</span></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Attempts: <span className="text-emerald-400 font-bold">{totalQuizAttempts}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Info Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Points System</h3>
                <p className="text-slate-400 text-sm">
                  Earn <span className="text-yellow-400 font-semibold">10 points</span> for each correct quiz answer. 
                  Rankings update automatically after every quiz!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Total: <span className="text-yellow-400 font-bold">{totalPointsAllUsers.toLocaleString()}</span> points earned</span>
            </div>
          </div>
        </div>

        {/* Filters and Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Time Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTimeDropdown(!showTimeDropdown);
                  setShowLessonDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{timeFilter === 'all' ? 'All Time' : 'This Week'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTimeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTimeDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTimeDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setTimeFilter('all');
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                        timeFilter === 'all' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter('weekly');
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                        timeFilter === 'weekly' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      This Week
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Lesson Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLessonDropdown(!showLessonDropdown);
                  setShowTimeDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
              >
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="max-w-[200px] truncate">
                  {lessonFilter === 'all' ? 'All Lessons' : lessons.find(l => l.id === lessonFilter)?.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showLessonDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLessonDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLessonDropdown(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden max-h-80 overflow-y-auto">
                    {lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setLessonFilter(lesson.id);
                          setShowLessonDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                          lessonFilter === lesson.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                        }`}
                      >
                        {lesson.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <Clock className="w-3 h-3" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Verified Users Yet</h3>
            <p className="text-slate-400 mb-6">Add verified users to see them on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium - Only show if there are users with points */}
            {topThree.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Second Place */}
                <div className="order-1 md:order-1">
                  <div className="bg-gradient-to-b from-slate-700/50 to-slate-800/50 rounded-2xl p-6 border border-slate-600 text-center transform md:translate-y-8">
                    <div className="relative inline-block mb-4">
                      {topThree[1]?.avatar_url ? (
                        <img
                          src={topThree[1].avatar_url}
                          alt={topThree[1].user_name}
                          className="w-16 h-16 rounded-full object-cover border-4 border-slate-400"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center border-4 border-slate-400">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        2
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate">{topThree[1]?.user_name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <p className="text-2xl font-bold text-yellow-400">{topThree[1]?.total_points || 0}</p>
                    </div>
                    <p className="text-sm text-slate-400">{topThree[1]?.total_quizzes} quiz attempts</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {topThree[1]?.badges.slice(0, 3).map(badge => (
                        <div key={badge.id} className="p-1 bg-slate-700 rounded-lg" title={badge.name}>
                          <BadgeIcon badge={badge} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* First Place */}
                <div className="order-2 md:order-2">
                  <div className="bg-gradient-to-b from-yellow-500/20 to-amber-500/10 rounded-2xl p-6 border border-yellow-500/30 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl" />
                    <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="relative inline-block mb-4">
                      {topThree[0]?.avatar_url ? (
                        <img
                          src={topThree[0].avatar_url}
                          alt={topThree[0].user_name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-lg shadow-yellow-500/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center border-4 border-yellow-400 shadow-lg shadow-yellow-500/30">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        1
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-lg truncate">{topThree[0]?.user_name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <p className="text-3xl font-bold text-yellow-400">{topThree[0]?.total_points || 0}</p>
                    </div>
                    <p className="text-sm text-slate-400">{topThree[0]?.total_quizzes} quiz attempts</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {topThree[0]?.badges.slice(0, 4).map(badge => (
                        <div key={badge.id} className="p-1.5 bg-yellow-500/20 rounded-lg" title={badge.name}>
                          <BadgeIcon badge={badge} size="md" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Third Place */}
                <div className="order-3 md:order-3">
                  <div className="bg-gradient-to-b from-amber-700/30 to-slate-800/50 rounded-2xl p-6 border border-amber-700/30 text-center transform md:translate-y-12">
                    <div className="relative inline-block mb-4">
                      {topThree[2]?.avatar_url ? (
                        <img
                          src={topThree[2].avatar_url}
                          alt={topThree[2].user_name}
                          className="w-14 h-14 rounded-full object-cover border-4 border-amber-600"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center border-4 border-amber-600">
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        3
                      </div>
                    </div>
                    <h3 className="font-semibold text-white truncate text-sm">{topThree[2]?.user_name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <p className="text-xl font-bold text-yellow-400">{topThree[2]?.total_points || 0}</p>
                    </div>
                    <p className="text-sm text-slate-400">{topThree[2]?.total_quizzes} quiz attempts</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {topThree[2]?.badges.slice(0, 2).map(badge => (
                        <div key={badge.id} className="p-1 bg-amber-700/30 rounded-lg" title={badge.name}>
                          <BadgeIcon badge={badge} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current User Highlight (if not in top 3) */}
            {currentUserEntry && currentUserRank > 3 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Your Position</h3>
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
                  <div className="flex items-center gap-4">
                    <RankBadge rank={currentUserRank} hasPoints={currentUserEntry.total_points > 0} />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {currentUserEntry.avatar_url ? (
                        <img
                          src={currentUserEntry.avatar_url}
                          alt={currentUserEntry.user_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{currentUserEntry.user_name}</p>
                        <p className="text-sm text-slate-400">
                          {currentUserEntry.total_quizzes > 0 
                            ? `${currentUserEntry.total_quizzes} quiz attempts` 
                            : 'No quizzes completed yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {currentUserEntry.badges.slice(0, 3).map(badge => (
                          <div key={badge.id} className="p-1 bg-slate-700 rounded-lg" title={badge.name}>
                            <BadgeIcon badge={badge} size="sm" />
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <p className="text-2xl font-bold text-yellow-400">{currentUserEntry.total_points || 0}</p>
                        </div>
                        <p className="text-xs text-slate-400">total points</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard Table - ALL Verified Users */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">All Verified Users Rankings</h3>
                  <p className="text-sm text-slate-400">Showing all {totalVerifiedUsers} verified users with their total points</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                    <span>{totalVerifiedUsers} verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span>{usersWithPoints} with points</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-700/50">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user_email}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors ${
                      entry.user_id === user?.id ? 'bg-cyan-500/5' : ''
                    } ${!entry.has_completed_quiz ? 'opacity-60' : ''}`}
                  >
                    <RankBadge rank={entry.rank} hasPoints={entry.total_points > 0} />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.user_name}
                          className={`w-10 h-10 rounded-full object-cover border-2 ${
                            entry.user_id === user?.id ? 'border-cyan-500' : 'border-slate-600'
                          }`}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                          entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                          entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                          entry.total_points > 0 ? 'bg-gradient-to-br from-slate-600 to-slate-700' :
                          'bg-slate-700/50'
                        }`}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${entry.user_id === user?.id ? 'text-cyan-400' : 'text-white'}`}>
                          {entry.user_name}
                          {entry.user_id === user?.id && <span className="text-xs ml-2 text-cyan-400">(You)</span>}
                        </p>
                        <p className="text-sm text-slate-400">
                          {entry.has_completed_quiz 
                            ? `${entry.total_quizzes} quiz attempts • ${entry.lessons_passed} lessons passed`
                            : 'No quizzes completed yet'}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      {entry.badges.length > 0 ? (
                        <>
                          {entry.badges.slice(0, 4).map(badge => (
                            <div 
                              key={badge.id} 
                              className="p-1.5 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-help"
                              title={badge.name}
                            >
                              <BadgeIcon badge={badge} size="sm" />
                            </div>
                          ))}
                          {entry.badges.length > 4 && (
                            <span className="text-xs text-slate-400 ml-1">+{entry.badges.length - 4}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">No badges yet</span>
                      )}
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="flex items-center gap-1 justify-end">
                        <Zap className={`w-5 h-5 ${
                          entry.rank === 1 ? 'text-yellow-400' :
                          entry.rank === 2 ? 'text-slate-300' :
                          entry.rank === 3 ? 'text-amber-400' :
                          entry.total_points > 0 ? 'text-yellow-400' :
                          'text-slate-500'
                        }`} />
                        <p className={`text-xl font-bold ${
                          entry.rank === 1 ? 'text-yellow-400' :
                          entry.rank === 2 ? 'text-slate-300' :
                          entry.rank === 3 ? 'text-amber-400' :
                          entry.total_points > 0 ? 'text-white' :
                          'text-slate-500'
                        }`}>
                          {entry.total_points}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How Points Work */}
            <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                How Points Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">10 Points Per Correct Answer</p>
                    <p className="text-sm text-slate-400">Each correct quiz answer earns you 10 points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Unlimited Retakes</p>
                    <p className="text-sm text-slate-400">Retake any quiz to earn more points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Cumulative Points</p>
                    <p className="text-sm text-slate-400">All points from all attempts count toward your rank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Overview */}
            <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Available Quizzes ({totalQuizzesOnPlatform})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessonQuizzes.map((quiz, index) => (
                  <div key={quiz.lessonId} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{quiz.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{quiz.questions.length} questions</span>
                          <span className="text-xs text-yellow-400">• {quiz.questions.length * 10} pts max</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Legend */}
            <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-4">Available Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'points-master', name: 'Points Master', icon: 'trophy', color: 'gold', desc: 'Earn 500+ total points' },
                  { id: 'points-expert', name: 'Points Expert', icon: 'star', color: 'purple', desc: 'Earn 300+ total points' },
                  { id: 'points-achiever', name: 'Points Achiever', icon: 'award', color: 'blue', desc: 'Earn 150+ total points' },
                  { id: 'perfect', name: 'Perfect Score', icon: 'zap', color: 'yellow', desc: '100% on any quiz' },
                  { id: 'master', name: 'Quiz Master', icon: 'crown', color: 'gold', desc: '95%+ average score' },
                  { id: 'completionist', name: 'Completionist', icon: 'check-circle', color: 'green', desc: 'Complete all 6 quizzes' },
                  { id: 'dedicated', name: 'Dedicated Learner', icon: 'book', color: 'cyan', desc: 'Complete 3+ quizzes' },
                  { id: 'graduate', name: 'Graduate', icon: 'graduation-cap', color: 'indigo', desc: 'Pass all 6 quizzes' }
                ].map(badge => (
                  <div key={badge.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <BadgeIcon badge={badge as Badge} size="md" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{badge.name}</p>
                      <p className="text-xs text-slate-400">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      </GuestGate>

    </div>
  );
};

export default LeaderboardPage;
