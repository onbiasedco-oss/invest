import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  RotateCcw, 
  Trophy,
  AlertCircle,
  Lightbulb,
  Award,
  Target,
  Loader2,
  TrendingUp,
  Zap,
  Star,
  Users,
  Crown,
  Medal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { QuizQuestion, LessonQuiz as LessonQuizType } from '@/data/quizQuestions';

interface LessonQuizProps {
  quiz: LessonQuizType;
  onComplete?: (score: number, total: number) => void;
}

interface QuizResult {
  id: string;
  lesson_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  total_points: number;
}

// Points per correct answer
const POINTS_PER_CORRECT = 10;

const LessonQuiz: React.FC<LessonQuizProps> = ({ quiz, onComplete }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: number; correct: boolean }>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaderboardUpdated, setLeaderboardUpdated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [miniLeaderboard, setMiniLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userTotalPoints, setUserTotalPoints] = useState<number>(0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100;

  useEffect(() => {
    fetchPreviousResult();
  }, [user, quiz.lessonId]);

  const fetchPreviousResult = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get all quiz results for this lesson to count attempts
      const { data: allResults, error: allError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', quiz.lessonId)
        .order('completed_at', { ascending: false });

      if (allResults && !allError) {
        setTotalAttempts(allResults.length);
        // Calculate total points earned from all attempts on this lesson
        const totalPts = allResults.reduce((sum, r) => sum + (r.score * POINTS_PER_CORRECT), 0);
        setTotalPointsEarned(totalPts);
        
        if (allResults.length > 0) {
          setPreviousResult(allResults[0]); // Most recent result
        }
      }
    } catch (error) {
      // No previous result found, that's okay
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        correct: isCorrect
      }
    }));

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      completeQuiz();
    }
  };

  // Fetch leaderboard directly from quiz_results - this is the most accurate method
  const fetchLeaderboardFromQuizResults = async () => {
    try {
      // Step 1: Fetch all quiz results
      const { data: quizResults, error: quizError } = await supabase
        .from('quiz_results')
        .select('user_id, score');

      if (quizError || !quizResults) {
        console.error('Error fetching quiz results:', quizError);
        return;
      }

      // Step 2: Get unique user IDs from quiz results
      const userIds = [...new Set(quizResults.map((r: any) => r.user_id))];
      
      if (userIds.length === 0) {
        setMiniLeaderboard([]);
        return;
      }

      // Step 3: Fetch user profiles separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create a map of user_id to user profile
      const userProfileMap: Record<string, { full_name: string; email: string; avatar_url: string | null }> = {};
      (usersData || []).forEach((u: any) => {
        userProfileMap[u.id] = {
          full_name: u.full_name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          avatar_url: u.avatar_url || null
        };
      });

      // Step 4: Calculate total points per user
      const userPointsMap: Record<string, { 
        user_id: string; 
        user_name: string; 
        avatar_url: string | null;
        total_points: number 
      }> = {};

      quizResults.forEach((result: any) => {
        const userId = result.user_id;
        const points = (result.score || 0) * POINTS_PER_CORRECT;
        const userProfile = userProfileMap[userId];
        
        if (!userPointsMap[userId]) {
          userPointsMap[userId] = {
            user_id: userId,
            user_name: userProfile?.full_name || 'User',
            avatar_url: userProfile?.avatar_url || null,
            total_points: 0
          };
        }
        userPointsMap[userId].total_points += points;
      });

      // Step 5: Convert to array and sort by total points
      const leaderboardArray = Object.values(userPointsMap)
        .sort((a, b) => b.total_points - a.total_points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      setMiniLeaderboard(leaderboardArray.slice(0, 5));

      // Find current user's rank and points
      if (user) {
        const userEntry = leaderboardArray.find(e => e.user_id === user.id);
        if (userEntry) {
          setUserRank(userEntry.rank);
          setUserTotalPoints(userEntry.total_points);
        }
      }
    } catch (error) {
      console.error('Error calculating leaderboard from quiz results:', error);
    }
  };


  const fetchMiniLeaderboard = async () => {
    try {
      // Try edge function first
      const { data, error } = await supabase.functions.invoke('get-leaderboard', {
        body: { timeFilter: 'all', lessonFilter: 'all', limit: 10 }
      });

      if (data?.success && data.leaderboard) {
        setMiniLeaderboard(data.leaderboard.slice(0, 5));
        
        // Find user's rank and total points
        if (user) {
          const userEntry = data.leaderboard.find((e: LeaderboardEntry) => e.user_id === user.id);
          if (userEntry) {
            setUserRank(userEntry.rank);
            setUserTotalPoints(userEntry.total_points || 0);
          }
        }
        return;
      }
      
      // Fallback: Calculate from quiz_results directly
      await fetchLeaderboardFromQuizResults();
    } catch (error) {
      console.error('Error fetching leaderboard from edge function:', error);
      // Fallback to direct query
      await fetchLeaderboardFromQuizResults();
    }
  };

  const updateLeaderboard = async () => {
    if (!user) return false;
    
    try {
      // Add a small delay to ensure the database has committed the new result
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the updated leaderboard after quiz completion
      await fetchLeaderboardFromQuizResults();
      return true;
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return true;
    }
  };

  const saveSlideProgress = async () => {
    if (!user) return;

    try {
      // First try to get existing record
      const { data: existing } = await supabase
        .from('slide_lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', quiz.lessonId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('slide_lesson_progress')
          .update({
            viewed: true,
            viewed_at: new Date().toISOString(),
            quiz_completed: true,
            quiz_completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('slide_lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: quiz.lessonId,
            viewed: true,
            viewed_at: new Date().toISOString(),
            quiz_completed: true,
            quiz_completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving slide progress:', error);
    }
  };

  // Ensure user exists in users table before saving quiz result
  const ensureUserExists = async () => {
    if (!user) return false;
    
    try {
      // First, check if user exists by email (to handle ID mismatch)
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      
      if (existingUserByEmail) {
        // User exists with this email, we're good
        return true;
      }
      
      // Check if user exists by ID
      const { data: existingUserById } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingUserById) {
        // User exists with this ID, we're good
        return true;
      }
      
      // User doesn't exist, create them
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.avatar_url
        });
      
      if (error) {
        console.warn('Could not create user:', error);
        // Continue anyway - the foreign key constraint has been removed
      }
      return true;
    } catch (error) {
      console.warn('Error ensuring user exists:', error);
      return true; // Continue anyway
    }
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);
    const finalScore = score;
    const percentage = (finalScore / totalQuestions) * 100;
    const pointsEarned = finalScore * POINTS_PER_CORRECT;
    setSaveError(null);

    // Save result to database if user is logged in
    if (user) {
      setSaving(true);
      try {
        // Ensure user exists in users table first
        await ensureUserExists();
        
        // Save the quiz result (each attempt is saved separately)
        const { data: insertedResult, error: insertError } = await supabase
          .from('quiz_results')
          .insert({
            user_id: user.id,
            lesson_id: quiz.lessonId,
            score: finalScore,
            total_questions: totalQuestions,
            percentage: percentage,
            answers: answers,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving quiz result:', insertError);
          setSaveError('Failed to save quiz result. Please try again.');
        } else {
          console.log('Quiz result saved successfully:', insertedResult);
          
          // Update total attempts and points for THIS quiz
          setTotalAttempts(prev => prev + 1);
          setTotalPointsEarned(prev => prev + pointsEarned);
          
          // Save slide progress
          await saveSlideProgress();
          
          // Update the leaderboard after saving the quiz result
          // This will now fetch fresh data including the new result
          const leaderboardSuccess = await updateLeaderboard();
          setLeaderboardUpdated(leaderboardSuccess);
        }
      } catch (error) {
        console.error('Error saving quiz result:', error);
        setSaveError('An error occurred while saving. Your progress may not be saved.');
      } finally {
        setSaving(false);
      }
    }

    if (onComplete) {
      onComplete(finalScore, totalQuestions);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers({});
    setQuizCompleted(false);
    setLeaderboardUpdated(false);
    setSaveError(null);
    setMiniLeaderboard([]);
    setUserRank(null);
  };

  const startQuiz = () => {
    // Reset all state to start fresh
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers({});
    setQuizCompleted(false);
    setLeaderboardUpdated(false);
    setSaveError(null);
    setMiniLeaderboard([]);
    setUserRank(null);
    setPreviousResult(null); // Clear previous result to show quiz
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
    if (percentage >= 60) return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
    return 'from-red-500/20 to-red-600/20 border-red-500/30';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage === 100) return 'Perfect Score! Outstanding!';
    if (percentage >= 80) return 'Excellent Work! You\'ve mastered this lesson!';
    if (percentage >= 60) return 'Good Job! Review the material to improve.';
    return 'Keep Learning! Review the lesson and try again.';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-bold text-slate-400">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Show previous result summary if quiz not started
  if (!quizCompleted && currentQuestionIndex === 0 && !isAnswered && previousResult) {
    const previousPoints = previousResult.score * POINTS_PER_CORRECT;
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Lesson Quiz</h3>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Last Attempt Score</span>
            <span className={`text-lg font-bold ${getScoreColor(Number(previousResult.percentage))}`}>
              {previousResult.score}/{previousResult.total_questions} ({Number(previousResult.percentage).toFixed(0)}%)
            </span>
          </div>
          
          {/* Points Display */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Points (Last Attempt)</span>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">{previousPoints} pts</span>
            </div>
          </div>

          {/* Total Stats */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-sm">Total Attempts</span>
              <span className="text-white font-medium">{totalAttempts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Total Points (This Quiz)</span>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{totalPointsEarned} pts</span>
              </div>
            </div>
          </div>
          
          <p className="text-slate-500 text-xs mt-3">
            Last completed on {new Date(previousResult.completed_at).toLocaleDateString()}
          </p>
          {Number(previousResult.percentage) >= 60 && (
            <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Quiz Passed</span>
            </div>
          )}
        </div>

        {/* Retake Info */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cyan-400 font-medium text-sm">Retake to Earn More Points!</p>
              <p className="text-slate-400 text-xs mt-1">
                Each correct answer earns you <span className="text-yellow-400 font-semibold">10 points</span>. 
                Retake quizzes to climb the leaderboard!
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={startQuiz}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
        </div>

        <p className="text-slate-400 text-sm mt-4 text-center">
          {totalQuestions} questions • {totalQuestions * POINTS_PER_CORRECT} points possible per attempt
        </p>
      </div>
    );
  }

  // Quiz completed view
  if (quizCompleted) {
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 60;
    const pointsEarned = score * POINTS_PER_CORRECT;
    const maxPoints = totalQuestions * POINTS_PER_CORRECT;

    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className={`bg-gradient-to-r ${getScoreBgColor(percentage)} border rounded-xl p-6 text-center mb-6`}>
          <div className="flex justify-center mb-4">
            {percentage >= 80 ? (
              <div className="p-4 bg-emerald-500/30 rounded-full">
                <Trophy className="w-12 h-12 text-emerald-400" />
              </div>
            ) : percentage >= 60 ? (
              <div className="p-4 bg-amber-500/30 rounded-full">
                <Award className="w-12 h-12 text-amber-400" />
              </div>
            ) : (
              <div className="p-4 bg-red-500/30 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            )}
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
          <p className={`text-4xl font-bold ${getScoreColor(percentage)} mb-2`}>
            {score}/{totalQuestions}
          </p>
          <p className="text-slate-300 text-lg mb-1">{percentage.toFixed(0)}% Correct</p>
          
          {/* Points Earned Display */}
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-3xl font-bold text-yellow-400">+{pointsEarned}</span>
              <span className="text-yellow-400 font-medium">points</span>
            </div>
            <p className="text-yellow-300/70 text-sm">
              {score} correct × {POINTS_PER_CORRECT} points each
            </p>
            {percentage === 100 && (
              <div className="flex items-center justify-center gap-1 mt-2 text-yellow-300">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Maximum points achieved!</span>
              </div>
            )}
          </div>
          
          <p className="text-slate-400 mt-3">{getScoreMessage(percentage)}</p>

          {/* Saving Status */}
          {saving && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-cyan-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving your result and updating leaderboard...
              </p>
            </div>
          )}

          {/* Save Error */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {saveError}
              </p>
            </div>
          )}

          {/* Success Message with User Stats */}
          {!saving && leaderboardUpdated && user && !saveError && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 text-sm flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" />
                Points added to leaderboard!
              </p>
              {userRank && (
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">Your Rank</p>
                    <p className="text-xl font-bold text-white">#{userRank}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-600" />
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">Total Points</p>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <p className="text-xl font-bold text-yellow-400">{userTotalPoints}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pass/Fail Badge */}
          {!saving && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              passed 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {passed ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Quiz Passed!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">60% required to pass</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mini Leaderboard */}
        {miniLeaderboard.length > 0 && (
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h4 className="text-white font-medium">Top Leaders</h4>
              </div>
              <a 
                href="/leaderboard" 
                className="text-cyan-400 text-sm hover:underline flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-2">
              {miniLeaderboard.map((entry) => (
                <div 
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    entry.user_id === user?.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-slate-800/50'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      entry.user_id === user?.id ? 'text-cyan-400' : 'text-white'
                    }`}>
                      {entry.user_name}
                      {entry.user_id === user?.id && <span className="text-xs ml-1">(You)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-sm">{entry.total_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Summary */}
        <div className="space-y-3 mb-6">
          <h4 className="text-white font-medium">Answer Summary</h4>
          {quiz.questions.map((q, index) => {
            const answer = answers[q.id];
            const questionPoints = answer?.correct ? POINTS_PER_CORRECT : 0;
            return (
              <div
                key={q.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  answer?.correct
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                {answer?.correct ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span className="text-slate-300 text-sm flex-1">
                  Q{index + 1}: {q.question.substring(0, 50)}...
                </span>
                <span className={`text-sm font-medium ${answer?.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                  +{questionPoints} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Retake Button */}
        <div className="space-y-3">
          <button
            onClick={handleRetakeQuiz}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz for More Points
          </button>
          
          <a
            href="/leaderboard"
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            View Full Leaderboard
          </a>
        </div>

        {!user && (
          <p className="text-amber-400 text-sm mt-4 text-center">
            Sign in to save your quiz progress and appear on the leaderboard!
          </p>
        )}
      </div>
    );
  }

  // Active quiz view
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Lesson Quiz</h3>
            <p className="text-slate-400 text-sm">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-cyan-400 font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>{score} correct</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <Zap className="w-3 h-3" />
            <span>{score * POINTS_PER_CORRECT} pts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-xl font-medium text-white mb-4">{currentQuestion.question}</h4>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let optionStyle = 'bg-slate-700/50 border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700';
            
            if (isAnswered) {
              if (index === currentQuestion.correctAnswer) {
                optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
              } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                optionStyle = 'bg-red-500/20 border-red-500 text-red-400';
              } else {
                optionStyle = 'bg-slate-700/30 border-slate-700 opacity-50';
              }
            } else if (selectedAnswer === index) {
              optionStyle = 'bg-cyan-500/20 border-cyan-500 text-cyan-400';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${optionStyle}`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                  isAnswered && index === currentQuestion.correctAnswer
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : isAnswered && index === selectedAnswer
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : selectedAnswer === index
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                    : 'border-slate-500 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={isAnswered ? '' : 'text-slate-200'}>{option}</span>
                {isAnswered && index === currentQuestion.correctAnswer && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-emerald-400 text-sm font-medium">+{POINTS_PER_CORRECT} pts</span>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
                {isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation (shown after answering) */}
      {isAnswered && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium mb-1">Explanation</p>
              <p className="text-slate-300 text-sm">{currentQuestion.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isAnswered ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              selectedAnswer !== null
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            {currentQuestionIndex < totalQuestions - 1 ? (
              <>
                Next Question
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                See Results
                <Trophy className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;
