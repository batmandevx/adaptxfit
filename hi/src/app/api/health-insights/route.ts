import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/health-insights - Generate AI-powered health insights for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'default-user';

    // Fetch recent data from various sources in parallel
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [
      recentExerciseLogs,
      olderExerciseLogs,
      recentMoodLogs,
      olderMoodLogs,
      recentNutritionLogs,
      recentMoodEntries,
      recentBreathingSessions,
    ] = await Promise.all([
      // Exercise: this week vs last week
      db.exerciseLog.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      db.exerciseLog.findMany({
        where: {
          userId,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Mood logs (MoodLog model)
      db.moodLog.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      db.moodLog.findMany({
        where: {
          userId,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Nutrition logs
      db.nutritionLog.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      // Mood entries (MoodEntry model)
      db.moodEntry.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      // Breathing sessions
      db.breathingSession.findMany({
        where: { userId, createdAt: { gte: oneWeekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ── Calculate Statistics ──────────────────────────────────────────────

    // Exercise stats
    const recentExerciseCount = recentExerciseLogs.length;
    const olderExerciseCount = olderExerciseLogs.length;
    const recentTotalDuration = recentExerciseLogs.reduce(
      (sum, log) => sum + log.duration,
      0
    );
    const olderTotalDuration = olderExerciseLogs.reduce(
      (sum, log) => sum + log.duration,
      0
    );
    const exerciseFrequencyChange =
      olderExerciseCount > 0
        ? Math.round(
            ((recentExerciseCount - olderExerciseCount) / olderExerciseCount) *
              100
          )
        : recentExerciseCount > 0
          ? 100
          : 0;

    // Mood stats
    const recentAvgMoodScore =
      recentMoodLogs.length > 0
        ? recentMoodLogs.reduce((sum, log) => sum + log.moodScore, 0) /
          recentMoodLogs.length
        : 0;
    const olderAvgMoodScore =
      olderMoodLogs.length > 0
        ? olderMoodLogs.reduce((sum, log) => sum + log.moodScore, 0) /
          olderMoodLogs.length
        : 0;
    const moodScoreChange =
      olderAvgMoodScore > 0
        ? Math.round(
            ((recentAvgMoodScore - olderAvgMoodScore) / olderAvgMoodScore) *
              100
          )
        : 0;

    // Nutrition stats
    const recentAvgProtein =
      recentNutritionLogs.length > 0
        ? recentNutritionLogs.reduce((sum, log) => sum + (log.protein || 0), 0) /
          recentNutritionLogs.length
        : 0;
    const recentAvgCalories =
      recentNutritionLogs.length > 0
        ? recentNutritionLogs.reduce((sum, log) => sum + log.calories, 0) /
          recentNutritionLogs.length
        : 0;

    // Breathing / recovery stats
    const breathingSessionCount = recentBreathingSessions.length;

    // ── Generate Insights ────────────────────────────────────────────────

    const insights: Array<{
      id: string;
      category: 'Exercise' | 'Mood' | 'Nutrition' | 'Recovery';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      confidence: number;
      action: string;
    }> = [];

    // Exercise insight
    if (exerciseFrequencyChange < -15) {
      insights.push({
        id: 'insight-exercise-1',
        category: 'Exercise',
        title: 'Exercise Frequency Declining',
        description: `Your exercise frequency dropped ${Math.abs(exerciseFrequencyChange)}% this week. Consider adding short 10-min sessions to maintain your routine and prevent further decline.`,
        priority: 'high',
        confidence: Math.min(95, 70 + Math.abs(exerciseFrequencyChange)),
        action: 'View Exercises',
      });
    } else if (recentExerciseCount === 0) {
      insights.push({
        id: 'insight-exercise-2',
        category: 'Exercise',
        title: 'No Exercise This Week',
        description:
          'You haven\'t logged any exercise sessions this week. Even a short 5-minute stretch can help build momentum.',
        priority: 'high',
        confidence: 95,
        action: 'Start Exercising',
      });
    } else if (exerciseFrequencyChange > 10) {
      insights.push({
        id: 'insight-exercise-3',
        category: 'Exercise',
        title: 'Exercise Frequency Improving',
        description: `Great job! Your exercise frequency increased ${exerciseFrequencyChange}% this week. Keep up the consistent effort.`,
        priority: 'low',
        confidence: 85,
        action: 'View Exercises',
      });
    } else {
      insights.push({
        id: 'insight-exercise-4',
        category: 'Exercise',
        title: 'Exercise Routine Steady',
        description: `You logged ${recentExerciseCount} sessions totaling ${recentTotalDuration} min this week. Maintaining consistency is key.`,
        priority: 'low',
        confidence: 75,
        action: 'View Exercises',
      });
    }

    // Mood insight
    if (moodScoreChange > 5) {
      insights.push({
        id: 'insight-mood-1',
        category: 'Mood',
        title: 'Mood Scores Improving',
        description: `Your mood scores have improved ${moodScoreChange}% this week. Keep up your current routine — consistent activity is supporting your well-being.`,
        priority: 'low',
        confidence: 87,
        action: 'Track Mood',
      });
    } else if (moodScoreChange < -10) {
      insights.push({
        id: 'insight-mood-2',
        category: 'Mood',
        title: 'Mood Scores Declining',
        description:
          'Your mood scores have decreased this week. Consider trying a guided breathing exercise or a light activity to boost your well-being.',
        priority: 'high',
        confidence: 80,
        action: 'Try Breathing',
      });
    } else {
      insights.push({
        id: 'insight-mood-3',
        category: 'Mood',
        title: 'Mood Remains Stable',
        description:
          'Your mood has been relatively stable this week. Continue your current routine to maintain balance.',
        priority: 'low',
        confidence: 72,
        action: 'Track Mood',
      });
    }

    // Nutrition insight
    const proteinTarget = 50; // grams per day baseline
    if (recentAvgProtein < proteinTarget * 0.85) {
      insights.push({
        id: 'insight-nutrition-1',
        category: 'Nutrition',
        title: 'Protein Intake Below Target',
        description: `Your average protein intake (${Math.round(recentAvgProtein)}g) is below the recommended ${proteinTarget}g. Add lean protein sources like chicken, fish, or legumes to your meals.`,
        priority: 'medium',
        confidence: 78,
        action: 'Log Nutrition',
      });
    } else if (recentNutritionLogs.length === 0) {
      insights.push({
        id: 'insight-nutrition-2',
        category: 'Nutrition',
        title: 'No Nutrition Logs This Week',
        description:
          'Tracking your meals helps identify nutritional gaps. Start logging to get personalized recommendations.',
        priority: 'medium',
        confidence: 90,
        action: 'Log Nutrition',
      });
    } else {
      insights.push({
        id: 'insight-nutrition-3',
        category: 'Nutrition',
        title: 'Nutrition On Track',
        description: `Your protein intake looks good at ${Math.round(recentAvgProtein)}g average. Maintain balanced meals with varied protein sources.`,
        priority: 'low',
        confidence: 75,
        action: 'Log Nutrition',
      });
    }

    // Recovery insight
    const recentMoodEntryAvg =
      recentMoodEntries.length > 0
        ? recentMoodEntries.reduce((sum, e) => sum + e.mood, 0) /
          recentMoodEntries.length
        : 0;
    const highRiskCount = recentMoodEntries.filter(
      (e) => e.riskLevel === 'high' || e.riskLevel === 'crisis'
    ).length;

    if (highRiskCount > 0) {
      insights.push({
        id: 'insight-recovery-1',
        category: 'Recovery',
        title: 'Elevated Stress Detected',
        description: `You've had ${highRiskCount} high-stress entries this week. Try the 4-7-8 breathing pattern before bed to improve relaxation and sleep onset.`,
        priority: 'high',
        confidence: 85,
        action: 'Try Breathing',
      });
    } else if (breathingSessionCount === 0 && recentMoodEntryAvg < 3) {
      insights.push({
        id: 'insight-recovery-2',
        category: 'Recovery',
        title: 'Sleep Quality Declining',
        description:
          'Sleep quality scores declining over the past week. Try the 4-7-8 breathing pattern before bed to improve relaxation and sleep onset.',
        priority: 'medium',
        confidence: 83,
        action: 'Try Breathing',
      });
    } else {
      insights.push({
        id: 'insight-recovery-3',
        category: 'Recovery',
        title: 'Recovery Looking Good',
        description:
          'Your recovery metrics are stable. Continue with your breathing exercises and consistent sleep schedule.',
        priority: 'low',
        confidence: 70,
        action: 'Try Breathing',
      });
    }

    // ── Health Dimensions ────────────────────────────────────────────────

    const physicalFitness = Math.min(
      100,
      Math.max(0, 50 + recentExerciseCount * 5 + Math.floor(recentTotalDuration / 30))
    );
    const mentalWellness = Math.min(
      100,
      Math.max(0, Math.round(recentAvgMoodScore * 10 + breathingSessionCount * 3))
    );
    const nutritionBalance = Math.min(
      100,
      Math.max(0, 40 + Math.min(recentNutritionLogs.length * 5, 30) + (recentAvgProtein >= proteinTarget ? 20 : 5))
    );
    const recoveryQuality = Math.min(
      100,
      Math.max(0, 60 + breathingSessionCount * 4 - highRiskCount * 10)
    );
    const activityConsistency = Math.min(
      100,
      Math.max(0, 40 + recentExerciseCount * 8 + (recentMoodLogs.length > 0 ? 10 : 0) + (recentNutritionLogs.length > 0 ? 10 : 0))
    );

    const dimensions = [
      { label: 'Physical Fitness', score: physicalFitness, max: 100, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-400' },
      { label: 'Mental Wellness', score: mentalWellness, max: 100, color: 'text-violet-600', gradient: 'from-violet-500 to-purple-400' },
      { label: 'Nutrition Balance', score: nutritionBalance, max: 100, color: 'text-amber-600', gradient: 'from-amber-500 to-yellow-400' },
      { label: 'Recovery Quality', score: recoveryQuality, max: 100, color: 'text-cyan-600', gradient: 'from-cyan-500 to-teal-400' },
      { label: 'Activity Consistency', score: activityConsistency, max: 100, color: 'text-rose-600', gradient: 'from-rose-400 to-pink-400' },
    ];

    return NextResponse.json({
      insights,
      dimensions,
      stats: {
        exerciseFrequencyChange,
        recentExerciseCount,
        recentTotalDuration,
        olderTotalDuration,
        moodScoreChange,
        recentAvgMoodScore,
        recentAvgProtein,
        recentAvgCalories,
        breathingSessionCount,
        highRiskCount,
      },
    });
  } catch (error) {
    console.error('Error generating health insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate health insights' },
      { status: 500 }
    );
  }
}
