'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, Settings, X, ChevronRight, Speaker,
  Minus, Plus, Accessibility,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useTTS, type TTSVoice } from '@/hooks/use-tts';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const voiceList: { id: TTSVoice; name: string; description: string; emoji: string }[] = [
  { id: 'tongtong', name: 'TongTong', description: 'Warm & Friendly', emoji: '🌤️' },
  { id: 'chuichui', name: 'ChuiChui', description: 'Lively & Cute', emoji: '🎉' },
  { id: 'xiaochen', name: 'XiaoChen', description: 'Calm & Professional', emoji: '💼' },
  { id: 'jam', name: 'Jam', description: 'British Gentleman', emoji: '🎩' },
  { id: 'kazi', name: 'Kazi', description: 'Clear & Standard', emoji: '📢' },
  { id: 'douji', name: 'DouJi', description: 'Natural & Smooth', emoji: '🌊' },
  { id: 'luodo', name: 'LuoDo', description: 'Rich & Expressive', emoji: '🎭' },
];

const speedPresets = [
  { label: 'Slow', value: 0.75 },
  { label: 'Normal', value: 1.0 },
  { label: 'Fast', value: 1.5 },
];

export default function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  const tts = useTTS({ voice: 'tongtong', speed: 1.0 });
  const [previewingVoice, setPreviewingVoice] = useState<TTSVoice | null>(null);

  const handleVoiceSelect = (voiceId: TTSVoice) => {
    tts.setVoice(voiceId);
  };

  const handleVoicePreview = (voiceId: TTSVoice) => {
    if (previewingVoice === voiceId && tts.isPlaying) {
      tts.stop();
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice(voiceId);
    const voiceName = voiceList.find(v => v.id === voiceId)?.name || voiceId;
    tts.speak(`Hello, I am ${voiceName}, your AdaptiFit assistant.`, { voice: voiceId });
  };

  const handleSpeedPreview = () => {
    if (tts.isPlaying) {
      tts.stop();
      return;
    }
    setPreviewingVoice(tts.voice);
    tts.speak('This is how I sound at the current speed setting.', {
      voice: tts.voice,
      speed: tts.playbackSpeed,
    });
  };

  // Compute volume bars for decorative indicator
  const volumeBars = Array.from({ length: 16 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full sm:w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-border/50 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-border/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Voice Settings</h2>
                    <p className="text-xs text-muted-foreground">Configure TTS voice & speed</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Voice Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Speaker className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">Voice Selection</h3>
                </div>
                <div className="space-y-2">
                  {voiceList.map((v) => {
                    const isSelected = tts.voice === v.id;
                    const isPreviewing = previewingVoice === v.id && tts.isPlaying;
                    return (
                      <motion.div
                        key={v.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVoiceSelect(v.id)}
                        className={`
                          relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                          ${isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500/50 shadow-sm'
                            : 'bg-muted/50 border-2 border-transparent hover:bg-muted hover:border-border'
                          }
                        `}
                      >
                        {/* Radio indicator */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${isSelected
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-muted-foreground/30'
                          }
                        `}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>

                        {/* Voice info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{v.emoji}</span>
                            <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                              {v.name}
                            </span>
                            {isSelected && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0 border-0">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                        </div>

                        {/* Preview button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            h-8 w-8 p-0 rounded-full shrink-0 transition-all
                            ${isPreviewing
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600'
                            }
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoicePreview(v.id);
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {isPreviewing ? (
                              <motion.div
                                key="playing"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                              >
                                <Volume2 className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="idle"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>

                        {/* Emerald highlight bar for selected */}
                        {isSelected && (
                          <motion.div
                            layoutId="voice-highlight"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-emerald-500"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Speed Control */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold">Speed Control</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {tts.playbackSpeed.toFixed(2)}x
                  </Badge>
                </div>

                {/* Speed slider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => tts.setPlaybackSpeed(Math.max(0.5, Math.round((tts.playbackSpeed - 0.1) * 100) / 100))}
                      disabled={tts.playbackSpeed <= 0.5}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="flex-1">
                      <Slider
                        value={[tts.playbackSpeed]}
                        min={0.5}
                        max={2.0}
                        step={0.05}
                        onValueChange={(val) => tts.setPlaybackSpeed(val[0])}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => tts.setPlaybackSpeed(Math.min(2.0, Math.round((tts.playbackSpeed + 0.1) * 100) / 100))}
                      disabled={tts.playbackSpeed >= 2.0}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Speed range labels */}
                  <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>1.5x</span>
                    <span>2.0x</span>
                  </div>

                  {/* Speed presets */}
                  <div className="flex gap-2">
                    {speedPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant={tts.playbackSpeed === preset.value ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 text-xs h-8 ${
                          tts.playbackSpeed === preset.value
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'hover:border-emerald-500/50'
                        }`}
                        onClick={() => tts.setPlaybackSpeed(preset.value)}
                      >
                        {preset.label}
                        <span className="ml-1 opacity-70">{preset.value}x</span>
                      </Button>
                    ))}
                  </div>

                  {/* Speed preview */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 h-9 text-xs mt-1 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                    onClick={handleSpeedPreview}
                  >
                    {tts.isPlaying ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </motion.div>
                        Stop Preview
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Preview Current Speed
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Volume Indicator (Decorative) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">Audio Level</h3>
                  {tts.isPlaying && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0 border-0 dot-pulse">
                      Playing
                    </Badge>
                  )}
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-end justify-center gap-1 h-12">
                    {volumeBars.map((i) => {
                      const isActive = tts.isPlaying;
                      const height = isActive
                        ? `${Math.max(15, Math.min(100, 20 + Math.sin((i + Date.now() / 200) * 0.8) * 40 + Math.random() * 20))}%`
                        : `${8 + (i % 3) * 4}%`;
                      return (
                        <motion.div
                          key={i}
                          className={`w-2 rounded-full transition-all duration-150 ${
                            isActive
                              ? 'bg-emerald-500'
                              : 'bg-muted-foreground/20'
                          }`}
                          animate={isActive ? {
                            height: [`${15 + (i % 4) * 10}%`, `${40 + (i % 3) * 15}%`, `${20 + (i % 5) * 10}%`],
                          } : {
                            height: `${8 + (i % 3) * 4}%`,
                          }}
                          transition={isActive ? {
                            repeat: Infinity,
                            duration: 0.4 + (i % 5) * 0.1,
                            ease: 'easeInOut',
                          } : { duration: 0.3 }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">
                    {tts.isPlaying ? 'Audio playing...' : 'Play a voice to see the level'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Accessibility Note */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Accessibility className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                      Accessibility
                    </h4>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 leading-relaxed">
                      Text-to-Speech helps users with visual impairments, reading difficulties, or those who prefer
                      audio guidance. Voice settings apply across all sections of AdaptiFit for a consistent experience.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {tts.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200/50 dark:border-red-800/30">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Error: {tts.error}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-border/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Voice: <span className="font-medium text-foreground">{voiceList.find(v => v.id === tts.voice)?.name}</span>
                  {' · '}
                  Speed: <span className="font-medium text-foreground">{tts.playbackSpeed.toFixed(2)}x</span>
                </p>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
