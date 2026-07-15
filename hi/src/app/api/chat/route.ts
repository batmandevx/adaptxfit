import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/chat - AI chat with streaming response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history,
      stream = true,
      context,
    } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array with history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
    ];

    // Add conversation history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current message
    messages.push({ role: 'user' as const, content: message });

    if (stream) {
      // Use streaming response
      const response = await zai.chat.completions.create({
        messages,
        stream: true,
        thinking: { type: 'disabled' },
      });

      // Create a ReadableStream from the streaming response
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // If response is a stream, iterate over chunks
            if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
              for await (const chunk of response) {
                const content = chunk.choices?.[0]?.delta?.content || '';
                if (content) {
                  const data = JSON.stringify({ content, done: false });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              }
            } else if (response?.choices?.[0]?.message?.content) {
              // Fallback: if streaming didn't work, send the full response
              const content = response.choices[0].message.content;
              const data = JSON.stringify({ content, done: false });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Send done signal
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          } catch (streamError) {
            console.error('Stream error:', streamError);
            const errorData = JSON.stringify({ error: 'Stream interrupted', done: true });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const content = response.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      data: {
        message: content,
        usage: response.usage || null,
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate chat response' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(context?: {
  disability?: string;
  injuryType?: string;
  athleteCategory?: string;
  currentExercise?: string;
  heartRate?: number;
  mood?: string;
}): string {
  let prompt = `You are AdaptiFit AI, an expert adaptive fitness and rehabilitation assistant. You specialize in:

1. **Adaptive Fitness**: Exercise modifications for people with disabilities, amputations, paralysis, and other physical limitations
2. **Rehabilitation**: Post-injury recovery exercises, physical therapy guidance, and gradual progression plans
3. **Nutrition**: Dietary advice tailored to specific health conditions, allergies, and fitness goals
4. **Mental Wellness**: Stress management, motivation techniques, and emotional support during recovery
5. **Wearable Data Interpretation**: Explaining heart rate, blood oxygen, and other health metrics

Guidelines:
- Always prioritize safety. If you suspect a medical emergency, recommend seeking immediate medical attention.
- Be encouraging but honest about limitations and risks.
- Provide specific, actionable advice rather than generic suggestions.
- When recommending exercises, always include adaptive modifications.
- Consider the user's specific condition and abilities when giving advice.
- If you're unsure about something, say so rather than guessing.
- Keep responses concise but thorough. Use bullet points for lists.
- Use a warm, supportive tone.`;

  if (context) {
    prompt += '\n\nUser Context:';
    if (context.disability) {
      prompt += `\n- Disability/Condition: ${context.disability}`;
    }
    if (context.injuryType) {
      prompt += `\n- Injury Type: ${context.injuryType}`;
    }
    if (context.athleteCategory) {
      prompt += `\n- Athlete Category: ${context.athleteCategory}`;
    }
    if (context.currentExercise) {
      prompt += `\n- Current Exercise: ${context.currentExercise}`;
    }
    if (context.heartRate) {
      prompt += `\n- Current Heart Rate: ${context.heartRate} BPM`;
    }
    if (context.mood) {
      prompt += `\n- Current Mood: ${context.mood}`;
    }
  }

  return prompt;
}
