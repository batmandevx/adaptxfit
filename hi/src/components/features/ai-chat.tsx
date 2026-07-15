'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type AppSection } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import TTSSpeaker from '@/components/features/tts-speaker';
import VoiceInput from '@/components/features/voice-input';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// ─── Contextual Quick Prompts ────────────────────────────────────────────────

const quickPrompts: Record<string, string[]> = {
  home: [
    'How can I improve my form?',
    'Suggest an adaptive exercise',
    'Track my mood',
  ],
  dashboard: [
    'What should I focus on today?',
    'How am I doing this week?',
    'Set a new fitness goal',
  ],
  'body-scan': [
    'Is my form correct?',
    'What muscles am I targeting?',
    'How can I improve my squat?',
  ],
  exercises: [
    'Suggest a rehab exercise',
    'What exercises avoid knee strain?',
    'Show me seated alternatives',
  ],
  mood: [
    "I'm feeling anxious",
    'Help me relax',
    'How to improve my mood?',
  ],
  nutrition: [
    'What should I eat today?',
    'Analyze my meal',
    'High-protein snack ideas',
  ],
  community: [
    'How to stay motivated?',
    'Tips for sharing my journey',
    'Connect with others like me',
  ],
  wearable: [
    'What do my heart rate zones mean?',
    'Am I overtraining?',
    'Set up health alerts',
  ],
};

// ─── Simulated AI Responses ──────────────────────────────────────────────────

const aiResponses: Record<string, string[]> = {
  form: [
    "Great question about form! Focus on keeping your core engaged and maintaining a neutral spine. For adaptive exercises, modify the range of motion to what feels comfortable while still challenging your muscles. Remember: quality over quantity!",
    "Form is everything in rehabilitation. Start with smaller movements and gradually increase your range as your confidence builds. Use a mirror or record yourself to check alignment. Would you like me to suggest specific form cues for your current exercise?",
    "The key to good form is mind-muscle connection. Slow down your reps, breathe steadily, and focus on the target muscle group. If you feel any sharp pain, stop immediately and adjust. Consistent practice with proper form leads to faster recovery!",
  ],
  exercise: [
    "Here's a great adaptive exercise: Seated Resistance Band Rows. Sit upright with good posture, wrap a band around a sturdy anchor, and pull back squeezing your shoulder blades together. 3 sets of 12 reps with controlled tempo. This builds back strength without lower body strain!",
    "I recommend trying Wall Push-Ups as a starting point. Stand arm's length from a wall, place palms flat, and slowly lower your chest toward the wall. This builds upper body strength with minimal joint stress. Progress to incline push-ups as you get stronger!",
    "Try Seated Leg Extensions: Sit in a chair with back support, slowly extend one leg until straight, hold for 2 seconds, then lower with control. 3 sets of 10 per leg. This strengthens quads while being gentle on knees. Perfect for rehabilitation!",
  ],
  mood: [
    "It's completely normal to have tough days in your recovery journey. Here are some strategies: 1) Practice 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s), 2) Write down 3 things you're grateful for, 3) Take a gentle 10-minute walk. You're stronger than you think! 💚",
    "Your mental health is just as important as physical recovery. When anxiety strikes, try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you back to the present moment.",
    "Remember: healing isn't linear. Some days will be harder than others, and that's okay. Celebrate small victories, connect with your support system, and be gentle with yourself. Would you like me to guide you through a quick relaxation exercise?",
  ],
  nutrition: [
    "For optimal recovery, focus on: 1) Lean protein (chicken, fish, tofu) at every meal for muscle repair, 2) Colorful vegetables for antioxidants, 3) Whole grains for sustained energy, 4) Stay hydrated - aim for 8 glasses of water daily. Would you like a specific meal plan?",
    "Great nutrition question! Post-workout, aim for a 2:1 carb-to-protein ratio within 30 minutes. A banana with almond butter or a protein smoothie works great. For anti-inflammatory benefits, add turmeric, ginger, and omega-3 rich foods like salmon to your diet!",
    "Fueling your body right speeds up recovery! Try this balanced day: Oatmeal with berries for breakfast, grilled chicken salad for lunch, salmon with sweet potato for dinner. Snack on Greek yogurt, nuts, or hummus with veggies. Remember to adjust portions to your needs!",
  ],
  rehabilitation: [
    "Rehabilitation is a marathon, not a sprint. Key principles: 1) Progressive overload - gradually increase difficulty, 2) Consistency over intensity, 3) Rest days are growth days, 4) Listen to your body. Small daily improvements compound into major progress over time!",
    "For your rehabilitation journey, I recommend tracking three things daily: pain level (1-10), range of motion, and mood. This data helps identify patterns and adjust your program. Remember, setbacks are part of the process - they don't define your outcome!",
    "Rehabilitation tip: Focus on what you CAN do, not what you can't. Every adaptive exercise strengthens both body and mind. Set micro-goals (like 'hold for 5 more seconds') and celebrate achieving them. Your dedication inspires others on similar journeys!",
  ],
  motivation: [
    "You showed up today, and that's already a win! Remember: every rep, every stretch, every healthy meal is an investment in your future self. The road may be long, but you're already walking it. Keep going - your body and mind will thank you! 🌟",
    "Fun fact: Studies show that adaptive athletes often develop stronger mental resilience than their able-bodied peers. Your challenges are building incredible strength - not just physical, but mental. You're not just recovering; you're evolving into something even stronger!",
    "Here's your daily reminder: You are capable of amazing things. Your injury or disability does not define your limits - your determination does. Every step forward, no matter how small, is progress. I believe in you, and so does the AdaptiFit community! 💪",
  ],
  default: [
    "I'm AdaptiFit AI, your personal adaptive fitness assistant! I can help with exercise recommendations, form tips, mood support, nutrition advice, and rehabilitation guidance. What would you like to explore today?",
    "Thanks for reaching out! I'm here to support your fitness and rehabilitation journey. Whether you need exercise modifications, nutrition tips, or just some motivation - I've got you covered. What's on your mind?",
    "Hello! I'm your AdaptiFit AI companion. I can help with adaptive exercises, track your wellness, provide rehabilitation tips, and keep you motivated. How can I assist you on your journey today?",
  ],
};

function getResponseCategory(message: string): string {
  const lower = message.toLowerCase();
  if (/form|posture|alignment|technique|correct/i.test(lower)) return 'form';
  if (/exercise|workout|routine|movement|stretch/i.test(lower)) return 'exercise';
  if (/mood|anxious|relax|stress|sad|happy|calm|feeling/i.test(lower)) return 'mood';
  if (/nutrition|eat|food|meal|diet|protein|calorie/i.test(lower)) return 'nutrition';
  if (/rehab|recovery|injury|healing|therapy|pain/i.test(lower)) return 'rehabilitation';
  if (/motivat|inspire|encourage|keep going|give up/i.test(lower)) return 'motivation';
  return 'default';
}

function getSimulatedResponse(message: string): string {
  const category = getResponseCategory(message);
  const responses = aiResponses[category];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ─── Typing Effect Hook ──────────────────────────────────────────────────────

function useTypingEffect(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
}

// ─── Typing Message Component ────────────────────────────────────────────────

function TypingMessage({ content, onComplete }: { content: string; onComplete: () => void }) {
  const { displayedText, isComplete } = useTypingEffect(content, 18);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 align-middle rounded-sm"
        />
      )}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AIChat() {
  const { activeSection } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTab);
    return () => panel.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      // Simulate AI response with delay
      const aiId = `ai-${Date.now()}`;
      setTimeout(() => {
        const response = getSimulatedResponse(text);
        const aiMessage: ChatMessage = {
          id: aiId,
          role: 'ai',
          content: response,
          timestamp: new Date(),
          isTyping: true,
        };

        setMessages((prev) => [...prev, aiMessage]);
        setTypingMessageId(aiId);

        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }, 800 + Math.random() * 700);
    },
    [isOpen]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleTypingComplete = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isTyping: false } : m
        )
      );
      setTypingMessageId((prev) => (prev === messageId ? null : prev));
    },
    []
  );

  const currentPrompts = quickPrompts[activeSection] || quickPrompts.home;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => { setIsOpen(true); setUnreadCount(0); }}
                  className="relative w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center hover:shadow-2xl hover:shadow-emerald-500/30 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                  aria-label="Open AdaptiFit AI Chat"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Pulse ring */}
                  <motion.span
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'easeInOut',
                    }}
                  />

                  <Sparkles className="w-6 h-6 relative z-10" />

                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 z-20"
                    >
                      <Badge className="bg-rose-500 text-white border-0 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    </motion.span>
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                <p>Ask AdaptiFit AI</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="AdaptiFit AI Chat"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[500px] rounded-2xl shadow-2xl border border-white/20 bg-white/80 backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-2 ring-emerald-200">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    AdaptiFit AI
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">
                      Always here for you
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-3 min-h-0">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Hi! I&apos;m AdaptiFit AI
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                      Your personal adaptive fitness assistant. Ask me about exercises, form, nutrition, or anything on your mind!
                    </p>
                  </motion.div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-2 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    {message.role === 'ai' ? (
                      <div className="flex-shrink-0">
                        <Avatar className="w-7 h-7 ring-2 ring-emerald-300 ring-offset-1">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <Avatar className="w-7 h-7 ring-2 ring-gray-200 ring-offset-1">
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">
                            <User className="w-3.5 h-3.5" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-tr-md'
                          : 'bg-gradient-to-br from-emerald-50 to-teal-50 text-foreground border border-emerald-200/60 rounded-2xl rounded-tl-md'
                      }`}
                    >
                      {message.role === 'ai' && message.isTyping && typingMessageId === message.id ? (
                        <TypingMessage
                          content={message.content}
                          onComplete={() => handleTypingComplete(message.id)}
                        />
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                    {/* TTS Speaker for AI messages */}
                    {message.role === 'ai' && !message.isTyping && (
                      <div className="flex-shrink-0 mt-1">
                        <TTSSpeaker
                          text={message.content}
                          size="sm"
                          voice="tongtong"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* AI typing indicator */}
                {messages.length > 0 &&
                  messages[messages.length - 1].role === 'user' &&
                  !messages.some((m) => m.id.startsWith('ai-') && m.isTyping) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2"
                    >
                      <Avatar className="w-7 h-7 ring-2 ring-emerald-300 ring-offset-1">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl rounded-tl-md px-3 py-2">
                        <div className="flex items-center gap-1">
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-emerald-100/60">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {currentPrompts.map((prompt) => (
                  <motion.button
                    key={prompt}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-emerald-100/60 bg-white/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <VoiceInput
                  onTranscription={(text) => setInputValue(text)}
                  size="sm"
                  className="flex-shrink-0"
                />
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask AdaptiFit AI..."
                    className="rounded-full pr-10 h-9 text-sm bg-muted/50 border-emerald-200/50 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                    aria-label="Chat message input"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
