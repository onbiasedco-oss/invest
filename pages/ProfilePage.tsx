import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Edit3, 
  Save, 
  X,
  Trophy,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Medal,
  Crown,
  Flame,
  GraduationCap,
  BarChart3,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface QuizResult {
  id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  earned: boolean;
  earnedDate?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name || '');
  const [tempName, setTempName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lesson mapping for display
  const lessonNames: Record<string, string> = {
    'lesson-1': 'What Are Stocks And Why Invest',
    'lesson-2': 'How The Stock Market Works',
    'lesson-3': 'Understand Risk to Reward',
    'lesson-4': 'How To Pick Stocks',
    'lesson-5': 'Building And Managing A Portfolio',
    'lesson-6': 'Practical Steps to Start Investing'
  };

  // Badge definitions
  const getBadges = (quizResults: QuizResult[]): Badge[] => {
    const totalQuizzes = quizResults.length;
    const uniqueLessons = new Set(quizResults.map(r => r.lesson_id)).size;
    const avgScore = totalQuizzes > 0 
      ? quizResults.reduce((acc, r) => acc + r.percentage, 0) / totalQuizzes 
      : 0;
    const perfectScores = quizResults.filter(r => r.percentage === 100).length;
    const passedQuizzes = quizResults.filter(r => r.percentage >= 60).length;

    return [
      {
        id: 'quiz-master',
        name: 'Quiz Master',
        description: 'Complete all 6 lesson quizzes with passing scores',
        icon: Crown,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        earned: passedQuizzes >= 6,
        earnedDate: passedQuizzes >= 6 ? quizResults[quizResults.length - 1]?.completed_at : undefined
      },
      {
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Score 100% on any quiz',
        icon: Star,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        earned: perfectScores > 0,
        earnedDate: quizResults.find(r => r.percentage === 100)?.completed_at
      },
      {
        id: 'expert',
        name: 'Expert Investor',
        description: 'Maintain an average score of 90% or higher',
        icon: Trophy,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        earned: avgScore >= 90 && totalQuizzes >= 3,
        earnedDate: avgScore >= 90 && totalQuizzes >= 3 ? quizResults[quizResults.length - 1]?.completed_at : undefined
      },
      {
        id: 'proficient',
        name: 'Proficient Learner',
        description: 'Maintain an average score of 80% or higher',
        icon: Award,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        earned: avgScore >= 80 && totalQuizzes >= 2,
        earnedDate: avgScore >= 80 && totalQuizzes >= 2 ? quizResults[quizResults.length - 1]?.completed_at : undefined
      },
      {
        id: 'dedicated',
        name: 'Dedicated Learner',
        description: 'Complete at least 3 quizzes',
        icon: Flame,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        earned: totalQuizzes >= 3,
        earnedDate: totalQuizzes >= 3 ? quizResults[2]?.completed_at : undefined
      },
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Complete your first quiz',
        icon: Zap,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/20',
        earned: totalQuizzes >= 1,
        earnedDate: quizResults[0]?.completed_at
      },
      {
        id: 'completionist',
        name: 'Completionist',
        description: 'Attempt all 6 lesson quizzes',
        icon: CheckCircle,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        earned: uniqueLessons >= 6,
        earnedDate: uniqueLessons >= 6 ? quizResults[quizResults.length - 1]?.completed_at : undefined
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Score 100% on 3 or more quizzes',
        icon: Shield,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
        earned: perfectScores >= 3,
        earnedDate: perfectScores >= 3 ? quizResults.filter(r => r.percentage === 100)[2]?.completed_at : undefined
      }
    ];
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch quiz results
      const { data: quizData, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: true });

      if (quizData && !error) {
        setQuizHistory(quizData);
      }

      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (userData) {
        setDisplayName(userData.full_name || user.full_name || '');
        setAvatarUrl(userData.avatar_url || user.avatar_url || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: use a data URL
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          setAvatarUrl(dataUrl);
          // Save to user profile
          await supabase
            .from('users')
            .update({ avatar_url: dataUrl })
            .eq('id', user.id);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Update user profile
      await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !tempName.trim()) return;
    
    setSavingName(true);
    try {
      await supabase
        .from('users')
        .update({ full_name: tempName.trim() })
        .eq('id', user.id);

      setDisplayName(tempName.trim());
      setIsEditingName(false);
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setSavingName(false);
    }
  };

  const startEditingName = () => {
    setTempName(displayName);
    setIsEditingName(true);
  };

  // Calculate statistics
  const stats = {
    totalQuizzes: quizHistory.length,
    uniqueLessons: new Set(quizHistory.map(r => r.lesson_id)).size,
    avgScore: quizHistory.length > 0 
      ? Math.round(quizHistory.reduce((acc, r) => acc + r.percentage, 0) / quizHistory.length) 
      : 0,
    bestScore: quizHistory.length > 0 
      ? Math.max(...quizHistory.map(r => r.percentage)) 
      : 0,
    perfectScores: quizHistory.filter(r => r.percentage === 100).length,
    passedQuizzes: quizHistory.filter(r => r.percentage >= 60).length
  };

  const badges = getBadges(quizHistory);
  const earnedBadges = badges.filter(b => b.earned);

  // Get best score per lesson for progress chart
  const lessonScores: Record<string, number> = {};
  quizHistory.forEach(result => {
    if (!lessonScores[result.lesson_id] || result.percentage > lessonScores[result.lesson_id]) {
      lessonScores[result.lesson_id] = result.percentage;
    }
  });

  if (loading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-800">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-lg shadow-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white">{displayName || 'Investor'}</h1>
                    <button
                      onClick={startEditingName}
                      className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-slate-400" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-slate-400 mb-4">{user?.email}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">{earnedBadges.length}</span>
                  <span className="text-slate-400 text-sm">Badges</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-medium">{stats.avgScore}%</span>
                  <span className="text-slate-400 text-sm">Avg Score</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">{stats.uniqueLessons}/6</span>
                  <span className="text-slate-400 text-sm">Lessons</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
                <p className="text-slate-400 text-xs">Quizzes Taken</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.passedQuizzes}</p>
                <p className="text-slate-400 text-xs">Quizzes Passed</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.uniqueLessons}</p>
                <p className="text-slate-400 text-xs">Lessons Done</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgScore}%</p>
                <p className="text-slate-400 text-xs">Average Score</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.bestScore}%</p>
                <p className="text-slate-400 text-xs">Best Score</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Crown className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.perfectScores}</p>
                <p className="text-slate-400 text-xs">Perfect Scores</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Badges & Progress */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Chart */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Lesson Progress</h2>
              </div>

              <div className="space-y-4">
                {Object.entries(lessonNames).map(([lessonId, lessonName]) => {
                  const score = lessonScores[lessonId];
                  const hasAttempted = score !== undefined;
                  const passed = score >= 60;
                  
                  return (
                    <div key={lessonId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300 truncate max-w-[200px] md:max-w-none">
                          {lessonName}
                        </span>
                        <span className={`text-sm font-medium ${
                          !hasAttempted ? 'text-slate-500' :
                          passed ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {hasAttempted ? `${score}%` : 'Not attempted'}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            !hasAttempted ? 'bg-slate-600' :
                            passed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                            'bg-gradient-to-r from-amber-500 to-amber-400'
                          }`}
                          style={{ width: hasAttempted ? `${score}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/courses"
                className="flex items-center justify-center gap-2 mt-6 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <GraduationCap className="w-5 h-5" />
                Continue Learning
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Badges Section */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Badges</h2>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                  {earnedBadges.length}/{badges.length} Earned
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border transition-all ${
                      badge.earned 
                        ? 'bg-slate-700/50 border-slate-600' 
                        : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl ${badge.bgColor}`}>
                        <badge.icon className={`w-6 h-6 ${badge.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{badge.name}</h3>
                          {badge.earned && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{badge.description}</p>
                        {badge.earned && badge.earnedDate && (
                          <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Earned {new Date(badge.earnedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quiz History */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Quiz History</h2>
              </div>

              {quizHistory.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {[...quizHistory].reverse().map((result, index) => (
                    <div
                      key={result.id || index}
                      className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">
                          {lessonNames[result.lesson_id] || result.lesson_id}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          result.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                          result.percentage >= 60 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{result.score}/{result.total_questions} correct</span>
                        <span>{new Date(result.completed_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            result.percentage >= 80 ? 'bg-emerald-500' :
                            result.percentage >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No quizzes completed yet</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium"
                  >
                    Start Learning
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Leaderboard CTA */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/30 rounded-lg">
                  <Medal className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Leaderboard</h3>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                See how you rank against other learners and compete for the top spot!
              </p>
              <Link
                to="/leaderboard"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
              >
                <Trophy className="w-5 h-5" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
