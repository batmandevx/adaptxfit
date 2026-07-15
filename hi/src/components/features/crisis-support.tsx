'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Shield,
  Heart,
  AlertTriangle,
  Hand,
  Eye,
  Ear,
  Flower2,
  Brain,
  ClipboardList,
  Download,
  Volume2,
  VolumeX,
  ChevronRight,
  CheckCircle2,
  Plus,
  X,
  MessageSquare,
  Clock,
  User,
  Sparkles,
  Leaf,
  Waves,
  Flame,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import { useTTS } from '@/hooks/use-tts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// --- Types ---
type RiskLevel = 'low' | 'moderate' | 'high' | 'crisis';

interface CrisisHotline {
  name: string;
  phone: string;
  description: string;
  hours: string;
  icon: React.ReactNode;
  color: string;
}

interface CustomContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface GroundingStep {
  sense: string;
  count: number;
  prompt: string;
  icon: React.ReactNode;
  color: string;
  inputs: string[];
}

interface SafetyPlanData {
  warningSigns: string;
  copingStrategies: string;
  distractionPeople: string;
  helpPeople: string;
  professionalContacts: string;
  environmentSafety: string;
}

// --- Data ---
const CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: 'Free, confidential support for people in suicidal crisis or emotional distress',
    hours: '24/7',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-rose-500',
  },
  {
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 for free crisis counseling via text message',
    hours: '24/7',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'text-emerald-500',
  },
  {
    name: 'Veterans Crisis Line',
    phone: '988',
    description: 'Call 988 then press 1, or text 838255. For veterans and their families',
    hours: '24/7',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-teal-500',
  },
  {
    name: 'NAMI Helpline',
    phone: '1-800-950-6264',
    description: 'Information, resource referrals, and support for mental health conditions',
    hours: 'Mon–Fri 10am–10pm ET',
    icon: <Brain className="h-5 w-5" />,
    color: 'text-cyan-500',
  },
];

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; recommendation: string }> = {
  low: {
    label: 'Low Risk',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
    recommendation: "You're doing well! Keep up the great self-care practices. Stay connected with your support network and continue using the grounding exercises when needed.",
  },
  moderate: {
    label: 'Moderate Risk',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    recommendation: "It sounds like things are a bit tough right now. Try the grounding exercise below, reach out to someone you trust, or call a crisis line to talk. You don't have to face this alone.",
  },
  high: {
    label: 'High Risk',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
    recommendation: "Please reach out for support right now. Call 988 or text HOME to 741741. You matter, and there are people who want to help you through this. Consider using the safety plan to prepare your next steps.",
  },
  crisis: {
    label: 'Crisis',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <Phone className="h-6 w-6 text-rose-500" />,
    recommendation: "Please call 988 right now. You are not alone, and there is help available. If you are in immediate danger, call emergency services. A caring person is waiting to listen and support you.",
  },
};

const PHQ2_QUESTIONS = [
  {
    id: 'phq1',
    question: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
  {
    id: 'phq2',
    question: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
  },
];

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Great', value: 0 },
  { emoji: '🙂', label: 'Good', value: 1 },
  { emoji: '😐', label: 'Okay', value: 2 },
  { emoji: '😔', label: 'Low', value: 3 },
  { emoji: '😢', label: 'Struggling', value: 4 },
];

const GROUNDING_STEPS: Omit<GroundingStep, 'inputs'>[] = [
  {
    sense: 'SEE',
    count: 5,
    prompt: 'Name 5 things you can SEE right now',
    icon: <Eye className="h-6 w-6" />,
    color: 'from-cyan-400 to-teal-500',
  },
  {
    sense: 'TOUCH',
    count: 4,
    prompt: 'Name 4 things you can TOUCH right now',
    icon: <Hand className="h-6 w-6" />,
    color: 'from-emerald-400 to-green-500',
  },
  {
    sense: 'HEAR',
    count: 3,
    prompt: 'Name 3 things you can HEAR right now',
    icon: <Ear className="h-6 w-6" />,
    color: 'from-teal-400 to-cyan-500',
  },
  {
    sense: 'SMELL',
    count: 2,
    prompt: 'Name 2 things you can SMELL right now',
    icon: <Flower2 className="h-6 w-6" />,
    color: 'from-green-400 to-emerald-500',
  },
  {
    sense: 'TASTE',
    count: 1,
    prompt: 'Name 1 thing you can TASTE right now',
    icon: <Coffee className="h-6 w-6" />,
    color: 'from-teal-500 to-emerald-400',
  },
];

const SAFETY_PLAN_FIELDS: { key: keyof SafetyPlanData; label: string; placeholder: string; icon: React.ReactNode }[] = [
  {
    key: 'warningSigns',
    label: 'Warning Signs',
    placeholder: 'What thoughts, feelings, or situations tell you a crisis might be coming?',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  },
  {
    key: 'copingStrategies',
    label: 'Coping Strategies',
    placeholder: 'What activities have helped you feel better in the past?',
    icon: <Leaf className="h-4 w-4 text-emerald-500" />,
  },
  {
    key: 'distractionPeople',
    label: 'People & Places for Distraction',
    placeholder: 'People or places that help take your mind off things',
    icon: <Waves className="h-4 w-4 text-cyan-500" />,
  },
  {
    key: 'helpPeople',
    label: 'People I Can Ask for Help',
    placeholder: 'Friends, family, or others you can reach out to',
    icon: <Heart className="h-4 w-4 text-rose-500" />,
  },
  {
    key: 'professionalContacts',
    label: 'Professionals & Agencies',
    placeholder: 'Therapists, counselors, crisis lines, or agencies you can contact',
    icon: <Shield className="h-4 w-4 text-teal-500" />,
  },
  {
    key: 'environmentSafety',
    label: 'Making My Environment Safe',
    placeholder: 'Steps you can take to make your surroundings safer',
    icon: <Flame className="h-4 w-4 text-orange-500" />,
  },
];

// --- Sub-components ---

function EmergencyContactsCard() {
  const [customContacts, setCustomContacts] = useState<CustomContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');

  const addCustomContact = useCallback(() => {
    if (!newName.trim() || !newPhone.trim()) return;
    const contact: CustomContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRelationship.trim() || 'Contact',
    };
    setCustomContacts((prev) => [...prev, contact]);
    setNewName('');
    setNewPhone('');
    setNewRelationship('');
    setShowAddForm(false);
  }, [newName, newPhone, newRelationship]);

  const removeCustomContact = useCallback((id: string) => {
    setCustomContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Pre-configured hotlines */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CRISIS_HOTLINES.map((hotline, idx) => (
          <motion.div
            key={hotline.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border border-white/20 dark:border-gray-700/30 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`${hotline.color} mt-0.5`}>{hotline.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight">{hotline.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {hotline.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Phone className="h-3 w-3" />
                        {hotline.phone}
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        {hotline.hours}
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={`tel:${hotline.phone.replace(/[^0-9+]/g, '')}`}
                    className="shrink-0"
                  >
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Custom contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-teal-500" />
            My Emergency Contacts
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <Card className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 border border-dashed border-emerald-300 dark:border-emerald-700">
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    type="tel"
                    className="text-sm"
                  />
                  <Input
                    placeholder="Relationship (optional)"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={addCustomContact}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {customContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No custom contacts added yet. Add someone you trust.
          </p>
        ) : (
          <div className="space-y-2">
            {customContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900">
                  <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs font-bold">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.relationship} · {contact.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                      onClick={() => removeCustomContact(contact.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CrisisAssessmentCard() {
  const [phqAnswers, setPhqAnswers] = useState<Record<string, number>>({});
  const [moodValue, setMoodValue] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { speak, stop, isPlaying } = useTTS({ voice: 'tongtong', speed: 0.75 });
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const phqScore = Object.values(phqAnswers).reduce((a, b) => a + b, 0);
  const totalScore = phqScore + (moodValue !== null ? moodValue : 0);

  const getRiskLevel = useCallback((): RiskLevel => {
    if (totalScore >= 7) return 'crisis';
    if (totalScore >= 5) return 'high';
    if (totalScore >= 3) return 'moderate';
    return 'low';
  }, [totalScore]);

  const riskConfig = RISK_CONFIG[getRiskLevel()];

  const handlePhqAnswer = (questionId: string, value: number) => {
    setPhqAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAssessment = () => {
    setShowResult(true);
    if (voiceEnabled) {
      speak(`Your assessment shows ${riskConfig.label}. ${riskConfig.recommendation}`, { voice: 'tongtong', speed: 0.75 });
    }
  };

  const resetAssessment = () => {
    setPhqAnswers({});
    setMoodValue(null);
    setShowResult(false);
    stop();
  };

  const toggleVoice = () => {
    if (isPlaying) stop();
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className="space-y-6">
      {/* Voice toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Voice Guidance</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleVoice}
          className={`h-8 w-8 p-0 ${voiceEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {!showResult ? (
        <div className="space-y-6">
          {/* Mood Check */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              How are you feeling right now?
            </h4>
            <div className="flex gap-2 flex-wrap">
              {MOOD_EMOJIS.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setMoodValue(mood.value);
                    if (voiceEnabled) {
                      speak(`You selected ${mood.label}`, { voice: 'tongtong', speed: 0.75 });
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    moodValue === mood.value
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-emerald-200'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* PHQ-2 */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-teal-500" />
              Quick Wellness Check (PHQ-2)
            </h4>
            <div className="space-y-5">
              {PHQ2_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={phqAnswers[q.id] === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          handlePhqAnswer(q.id, opt.value);
                          if (voiceEnabled) {
                            speak(q.question, { voice: 'tongtong', speed: 0.75 });
                          }
                        }}
                        className={`text-xs justify-start h-auto py-2 ${
                          phqAnswers[q.id] === opt.value
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'hover:border-emerald-300'
                        }`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAssessment}
            disabled={moodValue === null || Object.keys(phqAnswers).length < 2}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Heart className="h-4 w-4" />
            See My Results
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Risk indicator */}
          <div className={`p-4 rounded-xl border-2 ${riskConfig.bg} ${riskConfig.border}`}>
            <div className="flex items-center gap-3 mb-3">
              {riskConfig.icon}
              <div>
                <h4 className={`font-bold ${riskConfig.color}`}>{riskConfig.label}</h4>
                <p className="text-xs text-muted-foreground">Score: {totalScore}/10</p>
              </div>
            </div>
            <Progress
              value={Math.min(100, (totalScore / 10) * 100)}
              className={`h-2 ${
                totalScore >= 7
                  ? '[&>div]:bg-rose-500'
                  : totalScore >= 5
                    ? '[&>div]:bg-orange-500'
                    : totalScore >= 3
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-emerald-500'
              }`}
            />
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-emerald-100 dark:border-emerald-900">
            <p className="text-sm leading-relaxed">{riskConfig.recommendation}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {getRiskLevel() !== 'low' && (
              <a href="tel:988">
                <Button variant="destructive" size="sm" className="gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Call 988 Now
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAssessment}
              className="gap-1 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800"
            >
              Retake Assessment
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function GroundingExerciseCard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<Record<number, string[]>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { speak, stop, isPlaying } = useTTS({ voice: 'tongtong', speed: 0.75 });
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const step = GROUNDING_STEPS[currentStep];
  const stepInputs = inputs[currentStep] || [];
  const totalItems = GROUNDING_STEPS.reduce((sum, s) => sum + s.count, 0);
  const completedItems = Object.values(inputs).reduce((sum, arr) => sum + arr.length, 0);
  const progressPercent = (completedItems / totalItems) * 100;

  const startExercise = () => {
    setIsActive(true);
    setCurrentStep(0);
    setInputs({});
    setCurrentInput('');
    setIsComplete(false);
    if (voiceEnabled) {
      speak(GROUNDING_STEPS[0].prompt, { voice: 'tongtong', speed: 0.75 });
    }
  };

  const addInput = () => {
    if (!currentInput.trim()) return;
    const currentStepInputs = inputs[currentStep] || [];
    if (currentStepInputs.length >= step.count) return;

    setInputs((prev) => ({
      ...prev,
      [currentStep]: [...(prev[currentStep] || []), currentInput.trim()],
    }));
    setCurrentInput('');

    // Check if step is complete
    const newStepInputs = [...currentStepInputs, currentInput.trim()];
    if (newStepInputs.length >= step.count) {
      if (currentStep < GROUNDING_STEPS.length - 1) {
        setTimeout(() => {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          if (voiceEnabled) {
            speak(GROUNDING_STEPS[nextStep].prompt, { voice: 'tongtong', speed: 0.75 });
          }
        }, 600);
      } else {
        setIsComplete(true);
        if (voiceEnabled) {
          speak("Great job! You've completed the grounding exercise. Take a deep breath. You are here, you are safe, and you are doing well.", { voice: 'tongtong', speed: 0.75 });
        }
      }
    }
  };

  const resetExercise = () => {
    setIsActive(false);
    setCurrentStep(0);
    setInputs({});
    setCurrentInput('');
    setIsComplete(false);
    stop();
  };

  const toggleVoice = () => {
    if (isPlaying) stop();
    setVoiceEnabled(!voiceEnabled);
  };

  // Pulsing circle animation - defined outside render
  const pulsingCircle = (
    <div className="relative flex items-center justify-center my-6">
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-400/30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/40 to-emerald-400/40"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
        {step.icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Voice toggle */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Leaf className="h-4 w-4 text-emerald-500" />
          5-4-3-2-1 Grounding Technique
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Voice</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className={`h-7 w-7 p-0 ${voiceEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {!isActive ? (
        <div className="text-center py-8">
          <div className="relative flex items-center justify-center mb-6">
            <motion.div
              className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 dark:from-emerald-800/30 dark:to-teal-800/30"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-cyan-200/50 to-emerald-200/50 dark:from-cyan-800/30 dark:to-emerald-800/30"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Leaf className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            A calming sensory exercise to help you feel grounded and present. Focus on each of your five senses, one at a time.
          </p>
          <Button
            onClick={startExercise}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Leaf className="h-4 w-4" />
            Start Grounding Exercise
          </Button>
        </div>
      ) : isComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </motion.div>
          <h4 className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            You did it!
          </h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Take a deep breath. You are here, you are safe, and you are doing well. Notice how you feel now compared to when you started.
          </p>
          <Button
            variant="outline"
            onClick={resetExercise}
            className="gap-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800"
          >
            Start Again
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedItems}/{totalItems} items</span>
            </div>
            <Progress value={progressPercent} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 justify-center">
            {GROUNDING_STEPS.map((s, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-emerald-500'
                    : (inputs[i]?.length || 0) >= s.count
                      ? 'w-2 bg-teal-400'
                      : 'w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              {pulsingCircle}

              <h4 className="font-bold text-lg mb-1 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {step.count} things you can {step.sense}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">{step.prompt}</p>

              {/* Already entered items */}
              {stepInputs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {stepInputs.map((item, idx) => (
                    <Badge
                      key={idx}
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input */}
              {stepInputs.length < step.count && (
                <div className="flex gap-2 max-w-xs mx-auto">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInput()}
                    placeholder={`${step.count - stepInputs.length} more...`}
                    className="text-sm"
                    autoFocus
                  />
                  <Button
                    onClick={addInput}
                    disabled={!currentInput.trim()}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* All entered items summary */}
          {completedItems > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-white/40 dark:bg-gray-900/40 border border-emerald-100 dark:border-emerald-900">
              <p className="text-xs font-medium text-muted-foreground mb-2">What you've noticed so far:</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(inputs).map(([stepIdx, items]) =>
                  items.map((item, itemIdx) => (
                    <Badge
                      key={`${stepIdx}-${itemIdx}`}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      {GROUNDING_STEPS[Number(stepIdx)].icon}
                      {item}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Reset button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetExercise}
              className="text-xs text-muted-foreground"
            >
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SafetyPlanCard() {
  const [plan, setPlan] = useState<SafetyPlanData>(() => {
    try {
      const saved = localStorage.getItem('adaptifit-safety-plan');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      warningSigns: '',
      copingStrategies: '',
      distractionPeople: '',
      helpPeople: '',
      professionalContacts: '',
      environmentSafety: '',
    };
  });
  const [isSaved, setIsSaved] = useState(true);

  const updateField = (key: keyof SafetyPlanData, value: string) => {
    setPlan((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const savePlan = () => {
    try {
      localStorage.setItem('adaptifit-safety-plan', JSON.stringify(plan));
      setIsSaved(true);
    } catch {
      // ignore
    }
  };

  const exportPlan = () => {
    const lines = [
      '=== MY SAFETY PLAN ===',
      '',
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      '--- Warning Signs ---',
      plan.warningSigns || '(Not filled in)',
      '',
      '--- Coping Strategies ---',
      plan.copingStrategies || '(Not filled in)',
      '',
      '--- People & Places for Distraction ---',
      plan.distractionPeople || '(Not filled in)',
      '',
      '--- People I Can Ask for Help ---',
      plan.helpPeople || '(Not filled in)',
      '',
      '--- Professionals & Agencies ---',
      plan.professionalContacts || '(Not filled in)',
      '',
      '--- Making My Environment Safe ---',
      plan.environmentSafety || '(Not filled in)',
      '',
      '=== If you are in crisis, call 988 ===',
    ];

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-plan-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filledFields = Object.values(plan).filter((v) => v.trim() !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">My Safety Plan</h4>
          {isSaved && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{filledFields}/6 sections</span>
      </div>

      <Progress value={(filledFields / 6) * 100} className="h-1.5 [&>div]:bg-emerald-500" />

      <div className="space-y-4">
        {SAFETY_PLAN_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-2">
              {field.icon}
              {field.label}
            </label>
            <Textarea
              value={plan[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="text-sm min-h-[60px] resize-none"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={savePlan}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
        >
          <CheckCircle2 className="h-4 w-4" />
          Save Plan
        </Button>
        <Button
          variant="outline"
          onClick={exportPlan}
          className="gap-1 border-teal-200 hover:bg-teal-50 dark:border-teal-800"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function CrisisSupport() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border border-emerald-200 dark:border-emerald-800 mb-3">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Crisis Support & Safety
          </span>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
          You Are Not Alone
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Support, resources, and tools to help you through difficult moments. Reach out anytime — there are people who care.
        </p>
      </motion.div>

      {/* Urgent banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
              If you are in immediate danger or crisis
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
              Call <strong>988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME</strong> to <strong>741741</strong>
            </p>
          </div>
          <a href="tel:988">
            <Button variant="destructive" size="sm" className="gap-1 shrink-0">
              <Phone className="h-3.5 w-3.5" />
              Call 988
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 dark:bg-gray-800/80 h-auto p-1">
          <TabsTrigger
            value="contacts"
            className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1 py-2"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger
            value="assessment"
            className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white gap-1 py-2"
          >
            <Brain className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger
            value="grounding"
            className="text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white gap-1 py-2"
          >
            <Leaf className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grounding</span>
          </TabsTrigger>
          <TabsTrigger
            value="safety-plan"
            className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1 py-2"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Safety Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-500" />
                Emergency Contacts
              </CardTitle>
              <CardDescription className="text-xs">
                Crisis hotlines and your personal emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmergencyContactsCard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="mt-4">
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-teal-500" />
                Wellness Check
              </CardTitle>
              <CardDescription className="text-xs">
                A gentle check-in on how you are feeling. Your answers stay private on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CrisisAssessmentCard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grounding" className="mt-4">
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Leaf className="h-5 w-5 text-cyan-500" />
                Grounding Exercise
              </CardTitle>
              <CardDescription className="text-xs">
                5-4-3-2-1 sensory technique to help you feel calm and present
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroundingExerciseCard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety-plan" className="mt-4">
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-500" />
                My Safety Plan
              </CardTitle>
              <CardDescription className="text-xs">
                Create a personal plan to help you stay safe during tough times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SafetyPlanCard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">
          💚 All information stays on your device. Your privacy matters.
        </p>
      </div>
    </div>
  );
}
