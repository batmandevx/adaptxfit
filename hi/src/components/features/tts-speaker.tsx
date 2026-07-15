'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTTS, type TTSVoice } from '@/hooks/use-tts';

interface TTSSpeakerProps {
  /** The text to speak */
  text: string;
  /** Voice to use */
  voice?: TTSVoice;
  /** Speed of speech (0.5 - 2.0) */
  speed?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show as icon-only button or with label */
  variant?: 'icon' | 'button';
  /** Label text when variant is 'button' */
  label?: string;
  /** Custom className */
  className?: string;
  /** Whether to disable the speaker */
  disabled?: boolean;
}

export default function TTSSpeaker({
  text,
  voice = 'tongtong',
  speed = 1.0,
  size = 'sm',
  variant = 'icon',
  label = 'Listen',
  className = '',
  disabled = false,
}: TTSSpeakerProps) {
  const { isPlaying, isLoading, speak, stop } = useTTS({ voice, speed });

  const handleClick = () => {
    if (isPlaying) {
      stop();
    } else if (!isLoading) {
      speak(text, { voice, speed });
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={size === 'lg' ? 'default' : 'sm'}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`gap-1.5 ${className}`}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
            </motion.div>
          ) : isPlaying ? (
            <motion.div
              key="playing"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <VolumeX className={iconSizes[size]} />
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Volume2 className={iconSizes[size]} />
            </motion.div>
          )}
        </AnimatePresence>
        {label}
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={`relative rounded-full ${sizeClasses[size]} ${className}`}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Loader2 className={`${iconSizes[size]} animate-spin text-emerald-500`} />
                </motion.div>
              ) : isPlaying ? (
                <motion.div
                  key="playing"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="relative"
                >
                  <VolumeX className={`${iconSizes[size]} text-rose-500`} />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-rose-400/30"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-rose-400/20"
                    animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Volume2 className={`${iconSizes[size]} text-muted-foreground hover:text-emerald-500 transition-colors`} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isLoading ? 'Generating speech...' : isPlaying ? 'Stop speaking' : 'Listen aloud'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
