'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useASR } from '@/hooks/use-asr';
import { useAppStore, type AppSection } from '@/stores/app-store';

interface VoiceInputProps {
  /** Callback when transcription is ready */
  onTranscription: (text: string) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Whether to disable */
  disabled?: boolean;
}

// ── Voice command mapping ──────────────────────────────────────────────────────

const voiceCommands: { patterns: string[]; section: AppSection; label: string }[] = [
  { patterns: ['go to dashboard', 'open dashboard', 'show dashboard', 'dashboard'], section: 'dashboard', label: 'Dashboard' },
  { patterns: ['go to exercises', 'open exercises', 'show exercises', 'start exercise', 'exercises'], section: 'exercises', label: 'Exercises' },
  { patterns: ['log mood', 'open mood', 'show mood', 'mood tracker', 'mood'], section: 'mood', label: 'Mood Monitor' },
  { patterns: ['body scan', 'open body scan', 'start body scan', 'scan'], section: 'body-scan', label: 'Body Scan' },
  { patterns: ['nutrition', 'open nutrition', 'show nutrition', 'food', 'log food'], section: 'nutrition', label: 'Nutrition' },
  { patterns: ['community', 'open community', 'show community', 'forum'], section: 'community', label: 'Community' },
  { patterns: ['wearable', 'open wearable', 'show wearable', 'heart rate', 'watch'], section: 'wearable', label: 'Wearable' },
  { patterns: ['breathing', 'open breathing', 'start breathing', 'breathe'], section: 'breathing', label: 'Breathing' },
];

function matchVoiceCommand(text: string): { section: AppSection; label: string } | null {
  const lower = text.toLowerCase().trim();
  for (const cmd of voiceCommands) {
    for (const pattern of cmd.patterns) {
      if (lower.includes(pattern)) {
        return { section: cmd.section, label: cmd.label };
      }
    }
  }
  return null;
}

// ── Waveform bars component ────────────────────────────────────────────────────

function WaveformAnimation({ audioLevel, isActive }: { audioLevel: number; isActive: boolean }) {
  const barCount = 5;
  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {Array.from({ length: barCount }).map((_, i) => {
        const centerIdx = Math.floor(barCount / 2);
        const distance = Math.abs(i - centerIdx);
        const baseScale = 1 - distance * 0.2;
        const activeScale = isActive ? baseScale + audioLevel * (1 - distance * 0.3) : baseScale * 0.3;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-rose-500"
            animate={{
              scaleY: Math.max(0.2, activeScale),
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{ height: '24px', originY: 0.5 }}
          />
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VoiceInput({
  onTranscription,
  size = 'md',
  className = '',
  disabled = false,
}: VoiceInputProps) {
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const [commandDetected, setCommandDetected] = useState<string | null>(null);
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle transcription through the hook callback (no effect needed)
  const handleTranscription = useCallback((text: string) => {
    const command = matchVoiceCommand(text);
    if (command) {
      setCommandDetected(command.label);
      setActiveSection(command.section);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = setTimeout(() => setCommandDetected(null), 2000);
    }
    onTranscription(text);
  }, [onTranscription, setActiveSection]);

  const handleError = useCallback((err: string) => {
    console.warn('ASR Error:', err);
  }, []);

  const {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    audioLevel,
  } = useASR({
    onTranscription: handleTranscription,
    onError: handleError,
  });

  // Derive permission denied from error state (no effect needed)
  const permissionDenied = !!error && (
    error.includes('Permission') ||
    error.includes('NotAllowedError') ||
    error.includes('denied')
  );

  const handleClick = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      try {
        await startRecording();
      } catch (err) {
        console.warn('Recording start failed:', err);
      }
    }
  }, [isRecording, stopRecording, startRecording]);

  const sizeClasses = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex items-center gap-2">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={disabled || isTranscribing || permissionDenied}
            className={`relative rounded-full ${sizeClasses[size]} ${className}`}
            aria-label={
              permissionDenied
                ? 'Microphone access denied'
                : isTranscribing
                  ? 'Transcribing voice input'
                  : isRecording
                    ? 'Stop voice recording'
                    : 'Start voice input'
            }
          >
            <AnimatePresence mode="wait">
              {permissionDenied ? (
                <motion.div
                  key="denied"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertCircle className={`${iconSizes[size]} text-rose-500`} />
                </motion.div>
              ) : isTranscribing ? (
                <motion.div
                  key="transcribing"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Loader2 className={`${iconSizes[size]} animate-spin text-emerald-500`} />
                </motion.div>
              ) : isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex items-center justify-center"
                >
                  <MicOff className={`${iconSizes[size]} text-rose-500 relative z-10`} />
                  {/* Audio level ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-rose-400/30"
                    animate={{
                      scale: [1, 1 + audioLevel * 0.5, 1],
                      opacity: [0.6, 0.3, 0.6],
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Recording pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-rose-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mic className={`${iconSizes[size]} text-muted-foreground hover:text-emerald-500 transition-colors`} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {permissionDenied
            ? 'Microphone access denied — please allow in browser settings'
            : isTranscribing
              ? 'Transcribing...'
              : isRecording
                ? 'Tap to stop recording'
                : 'Tap to speak — try "go to dashboard"'}
        </TooltipContent>
      </Tooltip>

      {/* Recording indicator with waveform */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <WaveformAnimation audioLevel={audioLevel} isActive={isRecording} />
            <span className="text-xs text-rose-500 font-medium whitespace-nowrap">Recording...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcribing indicator */}
      <AnimatePresence>
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1.5 overflow-hidden"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">Transcribing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice command detected indicator */}
      <AnimatePresence>
        {commandDetected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">
              Opening {commandDetected}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission denied message */}
      <AnimatePresence>
        {permissionDenied && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1.5 overflow-hidden"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <span className="text-xs text-rose-500 whitespace-nowrap">
              Mic access denied
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
