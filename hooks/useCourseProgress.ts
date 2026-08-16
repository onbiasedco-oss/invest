import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface LessonProgress {
  lesson_id: string;
  viewed: boolean;
  viewed_at: string | null;
  completed: boolean;
  completed_at: string | null;
  time_spent_seconds: number;
}

export interface QuizScore {
  lesson_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
  passed: boolean;
}

export interface CourseProgress {
  course_id: string;
  progress_percentage: number;
  completed_at: string | null;
  last_lesson_id: string | null;
  last_accessed_at: string | null;
  lessons_viewed: number;
  lessons_completed: number;
  total_lessons: number;
}

export interface SlideProgress {
  lesson_id: string;
  viewed: boolean;
  viewed_at: string | null;
  slides_viewed: number;
  total_slides: number;
}

export interface ProgressData {
  courseProgress: Record<string, CourseProgress>;
  lessonProgress: Record<string, LessonProgress>;
  quizScores: Record<string, QuizScore>;
  slideProgress: Record<string, SlideProgress>;
  certificates: string[];
}

export const useCourseProgress = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData>({
    courseProgress: {},
    lessonProgress: {},
    quizScores: {},
    slideProgress: {},
    certificates: []
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch all progress data
  const fetchProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch course progress
      const { data: courseData } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);

      // Fetch lesson progress
      const { data: lessonData } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      // Fetch quiz results (best scores)
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('percentage', { ascending: false });

      // Fetch slide lesson progress
      const { data: slideData } = await supabase
        .from('slide_lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      // Fetch certificates
      const { data: certData } = await supabase
        .from('certificates')
        .select('course_id')
        .eq('user_id', user.id);

      // Process course progress
      const courseProgress: Record<string, CourseProgress> = {};
      if (courseData) {
        courseData.forEach(p => {
          courseProgress[p.course_id] = {
            course_id: p.course_id,
            progress_percentage: p.progress_percentage || 0,
            completed_at: p.completed_at,
            last_lesson_id: p.last_lesson_id,
            last_accessed_at: p.last_accessed_at || p.updated_at,
            lessons_viewed: p.lessons_viewed || 0,
            lessons_completed: p.lessons_completed || 0,
            total_lessons: p.total_lessons || 0
          };
        });
      }

      // Process lesson progress
      const lessonProgress: Record<string, LessonProgress> = {};
      if (lessonData) {
        lessonData.forEach(p => {
          lessonProgress[p.lesson_id] = {
            lesson_id: p.lesson_id,
            viewed: p.viewed || p.completed,
            viewed_at: p.viewed_at || p.completed_at,
            completed: p.completed || false,
            completed_at: p.completed_at,
            time_spent_seconds: p.time_spent_seconds || 0
          };
        });
      }

      // Process quiz scores (keep best score per lesson)
      const quizScores: Record<string, QuizScore> = {};
      if (quizData) {
        quizData.forEach(q => {
          if (!quizScores[q.lesson_id] || q.percentage > quizScores[q.lesson_id].percentage) {
            quizScores[q.lesson_id] = {
              lesson_id: q.lesson_id,
              score: q.score,
              total_questions: q.total_questions,
              percentage: q.percentage,
              completed_at: q.completed_at,
              passed: q.percentage >= 60
            };
          }
        });
      }

      // Process slide progress
      const slideProgress: Record<string, SlideProgress> = {};
      if (slideData) {
        slideData.forEach(s => {
          slideProgress[s.lesson_id] = {
            lesson_id: s.lesson_id,
            viewed: s.viewed || false,
            viewed_at: s.viewed_at,
            slides_viewed: s.slides_viewed || 0,
            total_slides: s.total_slides || 0
          };
        });
      }

      // Process certificates
      const certificates = certData?.map(c => c.course_id) || [];

      setProgressData({
        courseProgress,
        lessonProgress,
        quizScores,
        slideProgress,
        certificates
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Mark a lesson as viewed
  const markLessonViewed = useCallback(async (lessonId: string, courseId?: string) => {
    if (!user) return;

    setSyncing(true);
    try {
      const now = new Date().toISOString();

      // Upsert lesson progress
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          viewed: true,
          viewed_at: now
        }, { onConflict: 'user_id,lesson_id' });

      // Update local state
      setProgressData(prev => ({
        ...prev,
        lessonProgress: {
          ...prev.lessonProgress,
          [lessonId]: {
            ...prev.lessonProgress[lessonId],
            lesson_id: lessonId,
            viewed: true,
            viewed_at: now,
            completed: prev.lessonProgress[lessonId]?.completed || false,
            completed_at: prev.lessonProgress[lessonId]?.completed_at || null,
            time_spent_seconds: prev.lessonProgress[lessonId]?.time_spent_seconds || 0
          }
        }
      }));

      // Update course progress if courseId provided
      if (courseId) {
        await updateCourseProgress(courseId, lessonId);
      }
    } catch (error) {
      console.error('Error marking lesson viewed:', error);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // Mark a slide lesson as viewed
  const markSlideViewed = useCallback(async (lessonId: string, totalSlides: number) => {
    if (!user) return;

    setSyncing(true);
    try {
      const now = new Date().toISOString();

      // First check if record exists
      const { data: existing } = await supabase
        .from('slide_lesson_progress')
        .select('id, slides_viewed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('slide_lesson_progress')
          .update({
            viewed: true,
            viewed_at: now,
            total_slides: totalSlides,
            slides_viewed: Math.max(existing.slides_viewed || 0, 1)
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('slide_lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            viewed: true,
            viewed_at: now,
            total_slides: totalSlides,
            slides_viewed: 1
          });
      }

      // Update local state
      setProgressData(prev => ({
        ...prev,
        slideProgress: {
          ...prev.slideProgress,
          [lessonId]: {
            lesson_id: lessonId,
            viewed: true,
            viewed_at: now,
            slides_viewed: Math.max(prev.slideProgress[lessonId]?.slides_viewed || 0, 1),
            total_slides: totalSlides
          }
        }
      }));
    } catch (error) {
      console.error('Error marking slide viewed:', error);
    } finally {
      setSyncing(false);
    }
  }, [user]);


  // Mark a lesson as completed
  const markLessonCompleted = useCallback(async (lessonId: string, courseId?: string) => {
    if (!user) return;

    setSyncing(true);
    try {
      const now = new Date().toISOString();

      // Upsert lesson progress
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          viewed: true,
          viewed_at: now,
          completed: true,
          completed_at: now
        }, { onConflict: 'user_id,lesson_id' });

      // Update local state
      setProgressData(prev => ({
        ...prev,
        lessonProgress: {
          ...prev.lessonProgress,
          [lessonId]: {
            lesson_id: lessonId,
            viewed: true,
            viewed_at: prev.lessonProgress[lessonId]?.viewed_at || now,
            completed: true,
            completed_at: now,
            time_spent_seconds: prev.lessonProgress[lessonId]?.time_spent_seconds || 0
          }
        }
      }));

      // Update course progress if courseId provided
      if (courseId) {
        await updateCourseProgress(courseId, lessonId);
      }
    } catch (error) {
      console.error('Error marking lesson completed:', error);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // Update course progress
  const updateCourseProgress = useCallback(async (courseId: string, lastLessonId: string, totalLessons?: number) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      // Get current progress for this course's lessons
      const { data: lessonData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, viewed, completed')
        .eq('user_id', user.id)
        .like('lesson_id', `%${courseId.split('-')[0]}%`);

      const lessonsViewed = lessonData?.filter(l => l.viewed).length || 0;
      const lessonsCompleted = lessonData?.filter(l => l.completed).length || 0;
      const total = totalLessons || 5; // Default to 5 lessons per course
      const progressPercentage = Math.round((lessonsCompleted / total) * 100);

      // Upsert course progress
      await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_lesson_id: lastLessonId,
          last_accessed_at: now,
          lessons_viewed: lessonsViewed,
          lessons_completed: lessonsCompleted,
          total_lessons: total,
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? now : null
        }, { onConflict: 'user_id,course_id' });

      // Update local state
      setProgressData(prev => ({
        ...prev,
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: {
            course_id: courseId,
            progress_percentage: progressPercentage,
            completed_at: progressPercentage === 100 ? now : null,
            last_lesson_id: lastLessonId,
            last_accessed_at: now,
            lessons_viewed: lessonsViewed,
            lessons_completed: lessonsCompleted,
            total_lessons: total
          }
        }
      }));
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  }, [user]);

  // Get the next incomplete lesson for a course
  const getNextLesson = useCallback((courseId: string, lessons: { id: string }[]): string | null => {
    const courseData = progressData.courseProgress[courseId];
    
    // If there's a last lesson, find the next one
    if (courseData?.last_lesson_id) {
      const lastIndex = lessons.findIndex(l => l.id === courseData.last_lesson_id);
      if (lastIndex >= 0 && lastIndex < lessons.length - 1) {
        // Check if the next lesson is incomplete
        const nextLesson = lessons[lastIndex + 1];
        if (!progressData.lessonProgress[nextLesson.id]?.completed) {
          return nextLesson.id;
        }
      }
    }

    // Find the first incomplete lesson
    for (const lesson of lessons) {
      if (!progressData.lessonProgress[lesson.id]?.completed) {
        return lesson.id;
      }
    }

    // All lessons completed, return the first one
    return lessons[0]?.id || null;
  }, [progressData]);

  // Get the resume lesson for slide lessons
  const getResumeSlideLessonId = useCallback((slideLessons: { id: string }[]): string | null => {
    // Find the first lesson without a passing quiz score
    for (const lesson of slideLessons) {
      const quizScore = progressData.quizScores[lesson.id];
      if (!quizScore || !quizScore.passed) {
        return lesson.id;
      }
    }
    
    // All quizzes passed, return the first one
    return slideLessons[0]?.id || null;
  }, [progressData]);

  // Calculate overall slide course progress
  const getSlideCourseProgress = useCallback((slideLessons: { id: string }[]): number => {
    if (slideLessons.length === 0) return 0;
    
    const passedQuizzes = slideLessons.filter(
      lesson => progressData.quizScores[lesson.id]?.passed
    ).length;
    
    return Math.round((passedQuizzes / slideLessons.length) * 100);
  }, [progressData]);

  // Get lessons viewed count for slide lessons
  const getSlideLessonsViewed = useCallback((slideLessons: { id: string }[]): number => {
    return slideLessons.filter(
      lesson => progressData.slideProgress[lesson.id]?.viewed
    ).length;
  }, [progressData]);

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    setLoading(true);
    fetchProgress();
  }, [fetchProgress]);

  return {
    ...progressData,
    loading,
    syncing,
    markLessonViewed,
    markSlideViewed,
    markLessonCompleted,
    updateCourseProgress,
    getNextLesson,
    getResumeSlideLessonId,
    getSlideCourseProgress,
    getSlideLessonsViewed,
    refreshProgress
  };
};

export default useCourseProgress;
