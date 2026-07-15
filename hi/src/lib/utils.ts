import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    happy: '😊',
    calm: '😌',
    anxious: '😰',
    sad: '😢',
    angry: '😠',
    neutral: '😐',
    excited: '🤩',
    tired: '😴',
  };
  return map[mood] || '😐';
}

export function getRiskColor(risk: string): string {
  const map: Record<string, string> = {
    low: 'text-emerald-500',
    medium: 'text-amber-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return map[risk] || 'text-gray-500';
}

export function getHeartRateZoneColor(zone: string): string {
  const map: Record<string, string> = {
    'Resting': '#10b981',
    'Light': '#22d3ee',
    'Moderate': '#f59e0b',
    'Vigorous': '#ef4444',
    'Peak': '#dc2626',
  };
  return map[zone] || '#6b7280';
}
