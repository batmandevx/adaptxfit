import { NextRequest, NextResponse } from 'next/server';

// ── Sample report data ─────────────────────────────────────────────────────────

const reportData = {
  user: {
    name: 'Alex Johnson',
    type: 'Adaptive Athlete',
    condition: 'Spinal Cord Injury (T12)',
  },
  exercise: {
    thisWeek: { weeklySessions: 4.2, avgFormAccuracy: 92, totalReps: 847, mostPerformed: 'Seated Shoulder Press', trend: 'improving' },
    lastWeek: { weeklySessions: 3.8, avgFormAccuracy: 88, totalReps: 712, mostPerformed: 'Seated Shoulder Press', trend: 'stable' },
  },
  mood: {
    thisWeek: { avgScore: 7.4, riskLevel: 'Low', trend: 'improving', topEmotion: 'Calm' },
    lastWeek: { avgScore: 6.8, riskLevel: 'Low', trend: 'stable', topEmotion: 'Neutral' },
  },
  nutrition: {
    thisWeek: { avgDailyCalories: 1935, macroBalance: 'Protein 35% · Carbs 40% · Fat 20% · Fiber 5%', mealsLogged: 14 },
    lastWeek: { avgDailyCalories: 1870, macroBalance: 'Protein 30% · Carbs 45% · Fat 20% · Fiber 5%', mealsLogged: 11 },
  },
  heart: {
    thisWeek: { avgRestingHR: 72, hrZones: 'Resting 45% · Light 25% · Moderate 20% · Vigorous 10%', spo2Avg: 97.8 },
    lastWeek: { avgRestingHR: 75, hrZones: 'Resting 40% · Light 30% · Moderate 20% · Vigorous 10%', spo2Avg: 97.2 },
  },
  achievements: [
    { title: '7-Day Streak', icon: '🔥', date: 'Mar 6, 2026' },
    { title: 'Form Master', icon: '✨', date: 'Mar 5, 2026' },
    { title: 'Mood Warrior', icon: '🧠', date: 'Mar 3, 2026' },
    { title: 'Nutrition Pro', icon: '🥗', date: 'Feb 27, 2026' },
    { title: 'Heart Hero', icon: '❤️', date: 'Feb 22, 2026' },
  ],
};

function trendArrow(trend: string) {
  if (trend === 'improving') return '↑ improving';
  if (trend === 'stable') return '→ stable';
  return '↓ declining';
}

// ── Generate comparison section ────────────────────────────────────────────────

function generateComparison(sections: string[]): string[] {
  const lines: string[] = [];

  if (sections.includes('exercise')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  EXERCISE — THIS WEEK vs LAST WEEK');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Weekly Sessions    : ${reportData.exercise.thisWeek.weeklySessions} (was ${reportData.exercise.lastWeek.weeklySessions}, ${reportData.exercise.thisWeek.weeklySessions > reportData.exercise.lastWeek.weeklySessions ? '+' : ''}${(reportData.exercise.thisWeek.weeklySessions - reportData.exercise.lastWeek.weeklySessions).toFixed(1)})`);
    lines.push(`  Avg Form Accuracy  : ${reportData.exercise.thisWeek.avgFormAccuracy}% (was ${reportData.exercise.lastWeek.avgFormAccuracy}%, ${reportData.exercise.thisWeek.avgFormAccuracy > reportData.exercise.lastWeek.avgFormAccuracy ? '+' : ''}${reportData.exercise.thisWeek.avgFormAccuracy - reportData.exercise.lastWeek.avgFormAccuracy}%)`);
    lines.push(`  Total Reps         : ${reportData.exercise.thisWeek.totalReps} (was ${reportData.exercise.lastWeek.totalReps}, +${reportData.exercise.thisWeek.totalReps - reportData.exercise.lastWeek.totalReps})`);
    lines.push(`  Trend              : ${trendArrow(reportData.exercise.thisWeek.trend)}`);
    lines.push('');
  }

  if (sections.includes('mood')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  MOOD — THIS WEEK vs LAST WEEK');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Average Mood Score : ${reportData.mood.thisWeek.avgScore}/10 (was ${reportData.mood.lastWeek.avgScore}/10, +${(reportData.mood.thisWeek.avgScore - reportData.mood.lastWeek.avgScore).toFixed(1)})`);
    lines.push(`  Risk Assessment    : ${reportData.mood.thisWeek.riskLevel}`);
    lines.push(`  Mood Trend         : ${trendArrow(reportData.mood.thisWeek.trend)}`);
    lines.push(`  Top Emotion        : ${reportData.mood.thisWeek.topEmotion} (was ${reportData.mood.lastWeek.topEmotion})`);
    lines.push('');
  }

  if (sections.includes('nutrition')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  NUTRITION — THIS WEEK vs LAST WEEK');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Avg Daily Calories : ${reportData.nutrition.thisWeek.avgDailyCalories} kcal (was ${reportData.nutrition.lastWeek.avgDailyCalories}, +${reportData.nutrition.thisWeek.avgDailyCalories - reportData.nutrition.lastWeek.avgDailyCalories})`);
    lines.push(`  Macro Balance      : ${reportData.nutrition.thisWeek.macroBalance}`);
    lines.push(`  Meals Logged       : ${reportData.nutrition.thisWeek.mealsLogged} (was ${reportData.nutrition.lastWeek.mealsLogged}, +${reportData.nutrition.thisWeek.mealsLogged - reportData.nutrition.lastWeek.mealsLogged})`);
    lines.push('');
  }

  if (sections.includes('heart')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  HEART HEALTH — THIS WEEK vs LAST WEEK');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Avg Resting HR     : ${reportData.heart.thisWeek.avgRestingHR} bpm (was ${reportData.heart.lastWeek.avgRestingHR}, ${reportData.heart.thisWeek.avgRestingHR < reportData.heart.lastWeek.avgRestingHR ? '' : '+'}${reportData.heart.thisWeek.avgRestingHR - reportData.heart.lastWeek.avgRestingHR})`);
    lines.push(`  SpO2 Average       : ${reportData.heart.thisWeek.spo2Avg}% (was ${reportData.heart.lastWeek.spo2Avg}%)`);
    lines.push('');
  }

  return lines;
}

// ── Generate coach summary ─────────────────────────────────────────────────────

function generateCoachSummary(sections: string[]): string[] {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  ADAPTIFIT — COACH SUMMARY');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Athlete: ${reportData.user.name}`);
  lines.push(`  Type: ${reportData.user.type}`);
  lines.push(`  Condition: ${reportData.user.condition}`);
  lines.push('');

  if (sections.includes('exercise')) {
    const diff = reportData.exercise.thisWeek.weeklySessions - reportData.exercise.lastWeek.weeklySessions;
    lines.push(`  🏋️ Exercise: ${diff >= 0 ? 'Improving' : 'Needs attention'} — ${reportData.exercise.thisWeek.weeklySessions} sessions/week, ${reportData.exercise.thisWeek.avgFormAccuracy}% form accuracy`);
  }
  if (sections.includes('mood')) {
    const diff = reportData.mood.thisWeek.avgScore - reportData.mood.lastWeek.avgScore;
    lines.push(`  🧠 Mood: ${diff >= 0 ? 'Positive trend' : 'Monitor closely'} — Avg ${reportData.mood.thisWeek.avgScore}/10, Risk: ${reportData.mood.thisWeek.riskLevel}`);
  }
  if (sections.includes('nutrition')) {
    const diff = reportData.nutrition.thisWeek.mealsLogged - reportData.nutrition.lastWeek.mealsLogged;
    lines.push(`  🥗 Nutrition: ${diff >= 0 ? 'On track' : 'Inconsistent logging'} — ${reportData.nutrition.thisWeek.mealsLogged} meals logged, ${reportData.nutrition.thisWeek.avgDailyCalories} kcal/day avg`);
  }
  if (sections.includes('heart')) {
    lines.push(`  ❤️ Heart: ${reportData.heart.thisWeek.avgRestingHR <= 75 ? 'Healthy range' : 'Elevated'} — Resting HR ${reportData.heart.thisWeek.avgRestingHR} bpm, SpO2 ${reportData.heart.thisWeek.spo2Avg}%`);
  }

  lines.push('');
  lines.push('  Key Recommendation: Continue current exercise routine.');
  lines.push('  Next Review: In 7 days');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines;
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dateFrom,
      dateTo,
      sections = ['exercise', 'mood', 'nutrition', 'heart', 'achievements'],
      includeComparison = true,
      includeCoachSummary = false,
      coachNotes = '',
    } = body;

    // Validate sections
    const validSections = ['exercise', 'mood', 'nutrition', 'heart', 'achievements'];
    const filteredSections = sections.filter((s: string) => validSections.includes(s));

    const dateRange = dateFrom && dateTo
      ? `${new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Feb 4, 2026 – Mar 6, 2026';

    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      at: undefined as unknown as string,
      hour: 'numeric',
      minute: '2-digit',
    });

    // Build report
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('           ADAPTIFIT PROGRESS REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Report Period : ${dateRange}`);
    lines.push(`Generated     : ${generatedAt}`);
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  USER PROFILE');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Name       : ${reportData.user.name}`);
    lines.push(`  User Type  : ${reportData.user.type}`);
    lines.push(`  Condition  : ${reportData.user.condition}`);
    lines.push('');

    // Add comparison section if requested
    if (includeComparison && filteredSections.length > 0) {
      const comparisonLines = generateComparison(filteredSections);
      lines.push(...comparisonLines);
    }

    // Achievements
    if (filteredSections.includes('achievements')) {
      lines.push('───────────────────────────────────────────────────────────');
      lines.push('  ACHIEVEMENTS UNLOCKED');
      lines.push('───────────────────────────────────────────────────────────');
      reportData.achievements.forEach((a) => {
        lines.push(`  ${a.icon} ${a.title.padEnd(20)} — ${a.date}`);
      });
      lines.push('');
    }

    // Coach notes
    if (coachNotes.trim()) {
      lines.push('───────────────────────────────────────────────────────────');
      lines.push('  COACH / THERAPIST NOTES');
      lines.push('───────────────────────────────────────────────────────────');
      coachNotes.split('\n').forEach((l: string) => lines.push(`  ${l}`));
      lines.push('');
    }

    // Coach summary
    if (includeCoachSummary) {
      lines.push('');
      const summaryLines = generateCoachSummary(filteredSections);
      lines.push(...summaryLines);
    }

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  Report generated by AdaptiFit — AI-Powered Adaptive Fitness');
    lines.push('═══════════════════════════════════════════════════════════');

    const reportText = lines.join('\n');

    // Also return structured data for preview
    const structuredData: Record<string, unknown> = {
      dateRange,
      generatedAt,
      user: reportData.user,
    };

    if (filteredSections.includes('exercise')) {
      structuredData.exercise = {
        thisWeek: reportData.exercise.thisWeek,
        lastWeek: reportData.exercise.lastWeek,
        change: {
          weeklySessions: +(reportData.exercise.thisWeek.weeklySessions - reportData.exercise.lastWeek.weeklySessions).toFixed(1),
          avgFormAccuracy: reportData.exercise.thisWeek.avgFormAccuracy - reportData.exercise.lastWeek.avgFormAccuracy,
          totalReps: reportData.exercise.thisWeek.totalReps - reportData.exercise.lastWeek.totalReps,
        },
      };
    }

    if (filteredSections.includes('mood')) {
      structuredData.mood = {
        thisWeek: reportData.mood.thisWeek,
        lastWeek: reportData.mood.lastWeek,
        change: {
          avgScore: +(reportData.mood.thisWeek.avgScore - reportData.mood.lastWeek.avgScore).toFixed(1),
        },
      };
    }

    if (filteredSections.includes('nutrition')) {
      structuredData.nutrition = {
        thisWeek: reportData.nutrition.thisWeek,
        lastWeek: reportData.nutrition.lastWeek,
        change: {
          avgDailyCalories: reportData.nutrition.thisWeek.avgDailyCalories - reportData.nutrition.lastWeek.avgDailyCalories,
          mealsLogged: reportData.nutrition.thisWeek.mealsLogged - reportData.nutrition.lastWeek.mealsLogged,
        },
      };
    }

    if (filteredSections.includes('heart')) {
      structuredData.heart = {
        thisWeek: reportData.heart.thisWeek,
        lastWeek: reportData.heart.lastWeek,
        change: {
          avgRestingHR: reportData.heart.thisWeek.avgRestingHR - reportData.heart.lastWeek.avgRestingHR,
          spo2Avg: +(reportData.heart.thisWeek.spo2Avg - reportData.heart.lastWeek.spo2Avg).toFixed(1),
        },
      };
    }

    if (filteredSections.includes('achievements')) {
      structuredData.achievements = reportData.achievements;
    }

    return NextResponse.json({
      success: true,
      report: reportText,
      structured: structuredData,
      sections: filteredSections,
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
