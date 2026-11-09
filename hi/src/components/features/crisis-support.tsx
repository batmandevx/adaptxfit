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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { GlassPanel, SectionHeader } from '@/components/ui/aurora';

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
    color: 'text-danger',
  },
  {
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 for free crisis counseling via text message',
    hours: '24/7',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'text-primary',
  },
  {
    name: 'Veterans Crisis Line',
    phone: '988',
    description: 'Call 988 then press 1, or text 838255. For veterans and their families',
    hours: '24/7',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-secondary',
  },
  {
    name: 'NAMI Helpline',
    phone: '1-800-950-6264',
    description: 'Information, resource referrals, and support for mental health conditions',
    hours: 'Mon–Fri 10am–10pm ET',
    icon: <Brain className="h-5 w-5" />,
    color: 'text-info',
  },
];

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; recommendation: string }> = {
  low: {
    label: 'Low Risk',
    color: 'text-success',
    bg: 'bg-success-soft',
    border: 'border-success/30',
    icon: <CheckCircle2 className="h-6 w-6 text-success" />,
    recommendation: "You're doing well! Keep up the great self-care practices. Stay connected with your support network and continue using the grounding exercises when needed.",
  },
  moderate: {
    label: 'Moderate Risk',
    color: 'text-warning',
    bg: 'bg-warning-soft',
    border: 'border-warning/30',
    icon: <AlertTriangle className="h-6 w-6 text-warning" />,
    recommendation: "It sounds like things are a bit tough right now. Try the grounding exercise below, reach out to someone you trust, or call a crisis line to talk. You don't have to face this alone.",
  },
  high: {
    label: 'High Risk',
    color: 'text-warning',
    bg: 'bg-warning-soft',
    border: 'border-warning/40',
    icon: <AlertTriangle className="h-6 w-6 text-warning" />,
    recommendation: "Please reach out for support right now. Call 988 or text HOME to 741741. You matter, and there are people who want to help you through this. Consider using the safety plan to prepare your next steps.",
  },
  crisis: {
    label: 'Crisis',
    color: 'text-danger',
    bg: 'bg-danger-soft',
    border: 'border-danger/40',
    icon: <Phone className="h-6 w-6 text-danger" />,
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
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
  },
  {
    key: 'copingStrategies',
    label: 'Coping Strategies',
    placeholder: 'What activities have helped you feel better in the past?',
    icon: <Leaf className="h-4 w-4 text-primary" />,
  },
  {
    key: 'distractionPeople',
    label: 'People & Places for Distraction',
    placeholder: 'People or places that help take your mind off things',
    icon: <Waves className="h-4 w-4 text-secondary" />,
  },
  {
    key: 'helpPeople',
    label: 'People I Can Ask for Help',
    placeholder: 'Friends, family, or others you can reach out to',
    icon: <Heart className="h-4 w-4 text-danger" />,
  },
  {
    key: 'professionalContacts',
    label: 'Professionals & Agencies',
    placeholder: 'Therapists, counselors, crisis lines, or agencies you can contact',
    icon: <Shield className="h-4 w-4 text-secondary" />,
  },
  {
    key: 'environmentSafety',
    label: 'Making My Environment Safe',
    placeholder: 'Steps you can take to make your surroundings safer',
    icon: <Flame className="h-4 w-4 text-warning" />,
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.14, delay: idx * 0.04 }}
          >
            <GlassPanel className="h-full">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`${hotline.color} mt-0.5`}>{hotline.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight">{hotline.name}</h4>
                    <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
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
                    aria-label={`Call ${hotline.name}`}
                  >
                    <Button className="h-12 gap-1.5 rounded-[14px] bg-primary px-4 text-primary-foreground hover:bg-primary-strong">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Custom contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-secondary" />
            My Emergency Contacts
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-11 gap-1 rounded-[14px] border-primary/40 text-primary hover:bg-primary-soft"
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
              <Card className="border border-dashed border-primary/40 bg-surface-raised/60">
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="min-h-11 text-sm"
                  />
                  <Input
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    type="tel"
                    className="min-h-11 text-sm"
                  />
                  <Input
                    placeholder="Relationship (optional)"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="min-h-11 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={addCustomContact}
                      className="h-11 gap-1 rounded-[14px] bg-primary px-4 text-primary-foreground hover:bg-primary-strong"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-11"
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
                <div className="flex items-center gap-3 rounded-[14px] border border-secondary/25 bg-secondary-soft/60 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-soft text-sm font-bold text-secondary">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {contact.relationship} · {contact.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} aria-label={`Call ${contact.name}`}>
                      <Button size="sm" variant="ghost" className="h-11 w-11 p-0 text-primary hover:bg-primary-soft">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-11 w-11 p-0 text-foreground-muted hover:bg-danger-soft hover:text-danger"
                      onClick={() => removeCustomContact(contact.id)}
                      aria-label={`Remove ${contact.name}`}
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
          className={`h-11 w-11 p-0 rounded-full ${voiceEnabled ? 'bg-primary-soft text-primary' : 'text-foreground-muted'}`}
          aria-label={voiceEnabled ? 'Turn voice guidance off' : 'Turn voice guidance on'}
          aria-pressed={voiceEnabled}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {!showResult ? (
        <div className="space-y-6">
          {/* Mood Check */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" />
              How are you feeling right now?
            </h4>
            <div className="flex gap-2 flex-wrap">
              {MOOD_EMOJIS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => {
                    setMoodValue(mood.value);
                    if (voiceEnabled) {
                      speak(`You selected ${mood.label}`, { voice: 'tongtong', speed: 0.75 });
                    }
                  }}
                  aria-pressed={moodValue === mood.value}
                  className={`flex min-h-[72px] min-w-[64px] flex-col items-center gap-1 rounded-[18px] border-2 p-3 transition-colors duration-150 ${
                    moodValue === mood.value
                      ? 'border-primary/60 bg-primary-soft'
                      : 'border-transparent bg-surface-raised hover:border-primary/30'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-foreground-muted">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* PHQ-2 */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-secondary" />
              Quick Wellness Check (PHQ-2)
            </h4>
            <div className="space-y-5">
              {PHQ2_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-foreground-muted">
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
                        className={`min-h-12 justify-start rounded-[14px] py-2 text-xs ${
                          phqAnswers[q.id] === opt.value
                            ? 'bg-primary text-primary-foreground hover:bg-primary-strong'
                            : 'hover:border-primary/40 hover:bg-primary-soft/50'
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
            className="h-12 w-full gap-2 rounded-[14px] bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary-strong"
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
                  ? '[&>div]:bg-danger'
                  : totalScore >= 3
                    ? '[&>div]:bg-warning'
                    : '[&>div]:bg-success'
              }`}
            />
          </div>

          {/* Recommendation */}
          <div className="rounded-[18px] border border-border/60 bg-surface-raised/60 p-4">
            <p className="text-sm leading-relaxed">{riskConfig.recommendation}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {getRiskLevel() !== 'low' && (
              <a href="tel:988">
                <Button variant="destructive" className="h-12 gap-1.5 rounded-[14px] px-5">
                  <Phone className="h-4 w-4" />
                  Call 988 Now
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              onClick={resetAssessment}
              className="h-12 gap-1 rounded-[14px] border-primary/40 hover:bg-primary-soft"
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

  // Static, calm visual stage — no pulsing or looping animation (crisis spec).
  const staticStage = (
    <div className="relative flex items-center justify-center my-6">
      <div className="absolute h-24 w-24 rounded-full bg-secondary-soft" aria-hidden="true" />
      <div className="absolute h-16 w-16 rounded-full bg-primary-soft" aria-hidden="true" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {step.icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Voice toggle */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          5-4-3-2-1 Grounding Technique
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">Voice</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className={`h-11 w-11 p-0 rounded-full ${voiceEnabled ? 'bg-primary-soft text-primary' : 'text-foreground-muted'}`}
            aria-label={voiceEnabled ? 'Turn voice guidance off' : 'Turn voice guidance on'}
            aria-pressed={voiceEnabled}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!isActive ? (
        <div className="text-center py-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute h-32 w-32 rounded-full bg-secondary-soft" aria-hidden="true" />
            <div className="absolute h-20 w-20 rounded-full bg-primary-soft" aria-hidden="true" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-foreground-muted mb-6 max-w-xs mx-auto">
            A calming sensory exercise to help you feel grounded and present. Focus on each of your five senses, one at a time.
          </p>
          <Button
            onClick={startExercise}
            className="h-12 gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-semibold text-primary-foreground hover:bg-primary-strong"
          >
            <Leaf className="h-4 w-4" />
            Start Grounding Exercise
          </Button>
        </div>
      ) : isComplete ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.14 }}
          className="text-center py-6 space-y-4"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h4 className="font-display text-lg font-semibold text-foreground">
            You did it!
          </h4>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto">
            Take a deep breath. You are here, you are safe, and you are doing well. Notice how you feel now compared to when you started.
          </p>
          <Button
            variant="outline"
            onClick={resetExercise}
            className="h-12 gap-2 rounded-[14px] border-primary/40 hover:bg-primary-soft"
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
            <Progress value={progressPercent} className="h-2 [&>div]:bg-primary" />
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 justify-center">
            {GROUNDING_STEPS.map((s, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-primary'
                    : (inputs[i]?.length || 0) >= s.count
                      ? 'w-2 bg-secondary'
                      : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="text-center"
            >
              {staticStage}

              <h4 className="font-display text-lg font-semibold text-foreground mb-1">
                {step.count} things you can {step.sense}
              </h4>
              <p className="text-sm text-foreground-muted mb-4">{step.prompt}</p>

              {/* Already entered items */}
              {stepInputs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {stepInputs.map((item, idx) => (
                    <Badge
                      key={idx}
                      className="gap-1 bg-primary-soft text-primary hover:bg-primary-soft"
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
                    className="min-h-12 rounded-[14px] text-sm"
                    autoFocus
                  />
                  <Button
                    onClick={addInput}
                    disabled={!currentInput.trim()}
                    className="h-12 w-12 shrink-0 rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-strong"
                    aria-label="Add item"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* All entered items summary */}
          {completedItems > 0 && (
            <div className="mt-4 rounded-[18px] border border-border/60 bg-surface-raised/60 p-3">
              <p className="text-xs font-medium text-foreground-muted mb-2">What you've noticed so far:</p>
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
            <Badge className="bg-success-soft text-success hover:bg-success-soft text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{filledFields}/6 sections</span>
      </div>

      <Progress value={(filledFields / 6) * 100} className="h-1.5 [&>div]:bg-primary" />

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
          className="h-12 gap-1.5 rounded-[14px] bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary-strong"
        >
          <CheckCircle2 className="h-4 w-4" />
          Save Plan
        </Button>
        <Button
          variant="outline"
          onClick={exportPlan}
          className="h-12 gap-1.5 rounded-[14px] border-secondary/40 hover:bg-secondary-soft"
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
    <div className="mx-auto w-full max-w-[920px] space-y-6">
      {/* Quiet, direct header — no gradients, no flourish (crisis spec) */}
      <SectionHeader
        eyebrow="CRISIS SUPPORT"
        title="You are not alone."
        description="Support, resources, and tools to help you through difficult moments. Reach out anytime — there are people who care."
      />

      {/* Urgent banner — always first, high-contrast, direct */}
      <div className="rounded-[18px] border border-danger/30 bg-danger-soft p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger/15">
            <Phone className="h-5 w-5 text-danger" />
          </div>
          <div className="min-w-[200px] flex-1">
            <p className="text-sm font-semibold text-danger">
              If you are in immediate danger or crisis
            </p>
            <p className="text-xs text-foreground-muted">
              Call <strong>988</strong> (Suicide &amp; Crisis Lifeline) or text <strong>HOME</strong> to <strong>741741</strong>
            </p>
          </div>
          <a href="tel:988">
            <Button className="h-12 shrink-0 gap-1.5 rounded-[14px] bg-danger px-5 text-[15px] font-semibold text-danger-foreground hover:bg-danger/90">
              <Phone className="h-4 w-4" />
              Call 988
            </Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="glass-panel grid h-auto w-full grid-cols-4 p-1">
          <TabsTrigger
            value="contacts"
            className="min-h-12 gap-1 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger
            value="assessment"
            className="min-h-12 gap-1 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary"
          >
            <Brain className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger
            value="grounding"
            className="min-h-12 gap-1 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary"
          >
            <Leaf className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grounding</span>
          </TabsTrigger>
          <TabsTrigger
            value="safety-plan"
            className="min-h-12 gap-1 rounded-[14px] text-xs data-[state=active]:bg-primary-soft data-[state=active]:text-primary"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Safety Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <GlassPanel className="p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Phone className="h-5 w-5 text-primary" />
              Emergency Contacts
            </h3>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              Crisis hotlines and your personal emergency contacts
            </p>
            <div className="mt-4">
              <EmergencyContactsCard />
            </div>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="assessment" className="mt-4">
          <GlassPanel className="p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Brain className="h-5 w-5 text-secondary" />
              Wellness Check
            </h3>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              A gentle check-in on how you are feeling. Your answers stay private on your device.
            </p>
            <div className="mt-4">
              <CrisisAssessmentCard />
            </div>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="grounding" className="mt-4">
          <GlassPanel className="p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Leaf className="h-5 w-5 text-primary" />
              Grounding Exercise
            </h3>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              5-4-3-2-1 sensory technique to help you feel calm and present
            </p>
            <div className="mt-4">
              <GroundingExerciseCard />
            </div>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="safety-plan" className="mt-4">
          <GlassPanel className="p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              My Safety Plan
            </h3>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              Create a personal plan to help you stay safe during tough times
            </p>
            <div className="mt-4">
              <SafetyPlanCard />
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <div className="py-2 text-center">
        <p className="text-xs text-foreground-subtle">
          All information stays on your device. Your privacy matters.
        </p>
      </div>
    </div>
  );
}
