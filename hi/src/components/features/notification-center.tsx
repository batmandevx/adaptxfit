'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Dumbbell, Brain, Trophy, AlertTriangle, Heart, Apple,
  X, CheckCheck, BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type NotificationType = 'exercise' | 'mood' | 'achievement' | 'alert' | 'heart' | 'meal';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  exercise: {
    icon: <Dumbbell className="w-4 h-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
    borderColor: 'border-l-emerald-500',
  },
  mood: {
    icon: <Brain className="w-4 h-4" />,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/50',
    borderColor: 'border-l-rose-500',
  },
  achievement: {
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
    borderColor: 'border-l-amber-500',
  },
  alert: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-l-red-500',
  },
  heart: {
    icon: <Heart className="w-4 h-4" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50',
    borderColor: 'border-l-teal-500',
  },
  meal: {
    icon: <Apple className="w-4 h-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    borderColor: 'border-l-orange-500',
  },
};

const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'exercise',
    title: 'Exercise Reminder',
    description: 'Time for your adaptive yoga session! 15 min remaining in your window.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'heart',
    title: 'Heart Rate Alert',
    description: 'Elevated heart rate detected (112 BPM). Consider taking a break.',
    time: '5 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'mood',
    title: 'Mood Check-In',
    description: "How are you feeling? Your daily mood check-in is due.",
    time: '18 min ago',
    read: false,
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    description: 'You completed 7 consecutive days of exercise. Amazing streak!',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '5',
    type: 'meal',
    title: 'Meal Reminder',
    description: "Don't forget to log your lunch. Staying on track helps your goals!",
    time: '2 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'alert',
    title: 'System Alert',
    description: 'Your wearable device battery is low (12%). Please charge soon.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'exercise',
    title: 'Exercise Completed',
    description: 'Great job! You finished your upper body strength routine.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '8',
    type: 'achievement',
    title: 'New Personal Best!',
    description: "You held the plank for 45 seconds — that's a new record!",
    time: '1 day ago',
    read: true,
  },
];

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge className="h-5 min-w-[20px] flex items-center justify-center text-[10px] font-bold bg-rose-500 text-white border-0 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={onClose}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <BellOff className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                  We&apos;ll alert you when something important comes up
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[380px]">
                <div className="flex flex-col py-1">
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => {
                      const config = typeConfig[notification.type];
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="group relative"
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            className={`
                              flex items-start gap-3 px-4 py-3 cursor-pointer
                              border-l-[3px] ${config.borderColor}
                              hover:bg-gray-50/80 dark:hover:bg-gray-800/50
                              transition-colors duration-200
                            `}
                            onClick={() => markAsRead(notification.id)}
                          >
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center ${config.color}`}>
                              {config.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium leading-tight ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {notification.description}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>

                            {/* Dismiss button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <Separator className="opacity-50" />
                <div className="p-3">
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-medium"
                    onClick={onClose}
                  >
                    View All Notifications
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
