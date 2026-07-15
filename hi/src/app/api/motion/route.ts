import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  name?: string;
}

// POST /api/motion - Accept motion/pose data, analyze form accuracy, return feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      exerciseName,
      poseData,
      userId,
      category,
      duration,
    } = body;

    if (!exerciseName || !poseData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: exerciseName, poseData' },
        { status: 400 }
      );
    }

    // Perform basic form analysis on pose data
    const formAnalysis = analyzePoseData(poseData, exerciseName);

    // Use LLM to generate personalized feedback
    const zai = await ZAI.create();

    const poseSummary = summarizePoseForLLM(poseData, formAnalysis);

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are AdaptiFit Motion Analysis AI, an expert in adaptive fitness, rehabilitation exercises, and biomechanical analysis. You analyze exercise form data and provide:
1. Specific form corrections with clear instructions
2. Adaptive modifications for users with disabilities or injuries
3. Safety warnings for potentially harmful movements
4. Encouragement and progress recognition

Always be supportive, specific, and actionable. Consider that the user may have physical limitations, injuries, or disabilities. Format your response as JSON with keys: "accuracyScore" (0-100), "feedback" (array of feedback items), "corrections" (array of specific corrections), "encouragement" (string), "safetyWarnings" (array of warnings if any).`,
        },
        {
          role: 'user',
          content: `Analyze this exercise form data for "${exerciseName}":

${poseSummary}

Provide a detailed form analysis with accuracy score, feedback, corrections, encouragement, and any safety warnings. Return ONLY valid JSON.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const content = response.choices?.[0]?.message?.content || '';

    // Parse the LLM response
    let aiAnalysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        aiAnalysis = {
          accuracyScore: formAnalysis.estimatedAccuracy,
          feedback: [content],
          corrections: [],
          encouragement: 'Keep up the great work!',
          safetyWarnings: [],
        };
      }
    } catch {
      aiAnalysis = {
        accuracyScore: formAnalysis.estimatedAccuracy,
        feedback: [content],
        corrections: [],
        encouragement: 'Keep up the great work!',
        safetyWarnings: [],
      };
    }

    // Merge local analysis with AI analysis
    const result = {
      exerciseName,
      accuracyScore: aiAnalysis.accuracyScore ?? formAnalysis.estimatedAccuracy,
      feedback: [
        ...formAnalysis.localFeedback,
        ...(aiAnalysis.feedback || []),
      ],
      corrections: [
        ...formAnalysis.localCorrections,
        ...(aiAnalysis.corrections || []),
      ],
      encouragement: aiAnalysis.encouragement || 'Keep up the great work!',
      safetyWarnings: [
        ...formAnalysis.safetyWarnings,
        ...(aiAnalysis.safetyWarnings || []),
      ],
      landmarks: formAnalysis.keyFindings,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error analyzing motion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze motion data' },
      { status: 500 }
    );
  }
}

function analyzePoseData(poseData: PoseLandmark[], exerciseName: string) {
  const localFeedback: string[] = [];
  const localCorrections: string[] = [];
  const safetyWarnings: string[] = [];
  const keyFindings: Record<string, unknown> = {};

  // Check visibility of key landmarks
  const visibleLandmarks = poseData.filter(
    (lm) => lm.visibility !== undefined && lm.visibility > 0.5
  );
  const visibilityRatio = visibleLandmarks.length / Math.max(poseData.length, 1);

  keyFindings.totalLandmarks = poseData.length;
  keyFindings.visibleLandmarks = visibleLandmarks.length;
  keyFindings.visibilityRatio = Math.round(visibilityRatio * 100);

  if (visibilityRatio < 0.5) {
    localFeedback.push('Limited body visibility detected. Consider adjusting camera angle for better tracking.');
    localCorrections.push('Position yourself so your full body is visible in the camera frame.');
  }

  // Basic symmetry check - compare left vs right side landmarks
  const leftLandmarks = poseData.filter(
    (lm) => lm.name?.toLowerCase().includes('left')
  );
  const rightLandmarks = poseData.filter(
    (lm) => lm.name?.toLowerCase().includes('right')
  );

  if (leftLandmarks.length > 0 && rightLandmarks.length > 0) {
    const leftAvgY = leftLandmarks.reduce((sum, lm) => sum + lm.y, 0) / leftLandmarks.length;
    const rightAvgY = rightLandmarks.reduce((sum, lm) => sum + lm.y, 0) / rightLandmarks.length;
    const asymmetry = Math.abs(leftAvgY - rightAvgY);

    keyFindings.asymmetryIndex = Math.round(asymmetry * 1000) / 1000;

    if (asymmetry > 0.1) {
      localFeedback.push('Noticeable left-right asymmetry detected in your posture.');
      localCorrections.push('Try to maintain balanced positioning on both sides of your body.');
    }
  }

  // Check for stability (low variance in position = stable)
  const yPositions = poseData.map((lm) => lm.y);
  const yVariance = computeVariance(yPositions);
  keyFindings.stabilityIndex = Math.round((1 - Math.min(yVariance * 10, 1)) * 100);

  if (yVariance > 0.05) {
    localFeedback.push('Some instability detected in your movement. Focus on controlled, steady motions.');
  }

  // Estimate accuracy based on various factors
  let estimatedAccuracy = 70; // base score
  if (visibilityRatio > 0.8) estimatedAccuracy += 10;
  if (visibilityRatio < 0.5) estimatedAccuracy -= 20;
  if (keyFindings.asymmetryIndex !== undefined && (keyFindings.asymmetryIndex as number) < 0.05) estimatedAccuracy += 5;
  if (keyFindings.stabilityIndex !== undefined && (keyFindings.stabilityIndex as number) > 70) estimatedAccuracy += 5;
  estimatedAccuracy = Math.max(0, Math.min(100, estimatedAccuracy));

  // Exercise-specific warnings
  const exerciseLower = exerciseName.toLowerCase();
  if (exerciseLower.includes('overhead') || exerciseLower.includes('press')) {
    if (visibilityRatio < 0.7) {
      safetyWarnings.push('Cannot clearly see shoulder position. Ensure proper overhead form to avoid shoulder injury.');
    }
  }
  if (exerciseLower.includes('squat') || exerciseLower.includes('lunge')) {
    if (keyFindings.asymmetryIndex !== undefined && (keyFindings.asymmetryIndex as number) > 0.08) {
      safetyWarnings.push('Knee alignment appears uneven. Be cautious to avoid knee strain.');
    }
  }

  return {
    estimatedAccuracy,
    localFeedback,
    localCorrections,
    safetyWarnings,
    keyFindings,
  };
}

function summarizePoseForLLM(
  poseData: PoseLandmark[],
  analysis: ReturnType<typeof analyzePoseData>
): string {
  const landmarkSummary = poseData
    .slice(0, 33) // Limit to standard MediaPipe landmarks
    .map((lm, i) => ({
      index: i,
      name: lm.name || `landmark_${i}`,
      x: Math.round(lm.x * 1000) / 1000,
      y: Math.round(lm.y * 1000) / 1000,
      z: Math.round(lm.z * 1000) / 1000,
      visibility: lm.visibility ? Math.round(lm.visibility * 100) : null,
    }));

  return `Pose Landmarks (summarized):
${JSON.stringify(landmarkSummary, null, 2)}

Preliminary Analysis:
- Estimated Accuracy: ${analysis.estimatedAccuracy}%
- Visibility: ${analysis.keyFindings.visibilityRatio}%
- Stability Index: ${analysis.keyFindings.stabilityIndex}%
- Asymmetry Index: ${analysis.keyFindings.asymmetryIndex ?? 'N/A'}
- Local Feedback: ${analysis.localFeedback.join('; ') || 'None'}
- Safety Warnings: ${analysis.safetyWarnings.join('; ') || 'None'}`;
}

function computeVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map((n) => (n - mean) ** 2);
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}
