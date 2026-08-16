import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';

interface CourseProgressCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    instructor_name: string;
    instructor_avatar: string;
    duration_hours: number;
    difficulty_level: string;
    category: string;
  };
  progress?: {
    progress_percentage: number;
    completed_at: string | null;
    last_lesson_id: string | null;
    lessons_viewed: number;
    lessons_completed: number;
    total_lessons: number;
  };
  hasCertificate?: boolean;
  lessonQuizScores?: Record<string, { score: number; total: number; percentage: number; passed: boolean }>;
  onResume?: (courseId: string, lessonId: string | null) => void;
}

const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  course,
  progress,
  hasCertificate,
  lessonQuizScores,
  onResume
}) => {
  const navigate = useNavigate();

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 50) return 'from-cyan-500 to-blue-500';
    if (percentage > 0) return 'from-amber-500 to-orange-500';
    return 'from-slate-600 to-slate-500';
  };

  const progressPercentage = progress?.progress_percentage || 0;
  const isCompleted = progress?.completed_at !== null;
  const hasStarted = progressPercentage > 0;

  // Calculate quiz completion for this course
  const quizCount = lessonQuizScores ? Object.keys(lessonQuizScores).length : 0;
  const passedQuizzes = lessonQuizScores 
    ? Object.values(lessonQuizScores).filter(q => q.passed).length 
    : 0;

  const handleClick = () => {
    if (onResume && progress?.last_lesson_id) {
      onResume(course.id, progress.last_lesson_id);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  return (
    <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
      {/* Thumbnail */}
      <div className="relative h-36 sm:h-48 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        {/* Difficulty Badge */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getDifficultyColor(course.difficulty_level)}`}>
            {course.difficulty_level}
          </span>
        </div>

        {/* Certificate Badge */}
        {hasCertificate && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>
        )}

        {/* Progress Indicator Overlay */}
        {hasStarted && !isCompleted && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">{progressPercentage}%</span>
            </div>
          </div>
        )}

        {/* Course Stats */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {course.duration_hours}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              {progress?.total_lessons || 5} lessons
            </span>
            {quizCount > 0 && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                {passedQuizzes}/{quizCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Instructor */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <img
            src={course.instructor_avatar}
            alt={course.instructor_name}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
          />
          <span className="text-slate-400 text-xs sm:text-sm">{course.instructor_name}</span>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
          {course.title}
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{course.description}</p>

        {/* Progress Bar */}
        {hasStarted && (
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between text-xs sm:text-sm mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Completed</span>
                  </>
                ) : (
                  <>Progress</>
                )}
              </span>
              <span className={isCompleted ? 'text-emerald-400' : 'text-cyan-400'}>
                {progressPercentage}%
              </span>
            </div>
            <div className="h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColor(progressPercentage)} rounded-full transition-all duration-500`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Lesson Progress Detail */}
            {progress && progress.lessons_completed > 0 && (
              <div className="flex items-center justify-between mt-2 text-[10px] sm:text-xs text-slate-500">
                <span>{progress.lessons_completed}/{progress.total_lessons} lessons completed</span>
                {progress.lessons_viewed > progress.lessons_completed && (
                  <span>{progress.lessons_viewed - progress.lessons_completed} in progress</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quiz Scores Summary */}
        {lessonQuizScores && Object.keys(lessonQuizScores).length > 0 && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Quiz Scores
              </span>
              <span className="text-xs text-cyan-400">
                {passedQuizzes}/{quizCount} passed
              </span>
            </div>
            <div className="flex gap-1">
              {Object.entries(lessonQuizScores).slice(0, 5).map(([lessonId, score], index) => (
                <div
                  key={lessonId}
                  className={`flex-1 h-1.5 rounded-full ${
                    score.passed ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={`Lesson ${index + 1}: ${score.percentage}%`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClick}
          className={`flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
              : hasStarted
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
          }`}
        >
          {isCompleted ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Review Course
            </>
          ) : hasStarted ? (
            <>
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Resume
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Start Course
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CourseProgressCard;
