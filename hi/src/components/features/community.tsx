'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { forumPosts } from '@/lib/mock-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Heart,
  ThumbsUp,
  UserPlus,
  Shield,
  Star,
  Plus,
  Send,
  Users,
  TrendingUp,
  Award,
  HelpCircle,
  Phone,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timeAgo: string;
  isExpert: boolean;
  likes: number;
}

interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  replies: number;
  isExpert: boolean;
  timeAgo: string;
  replyList?: Reply[];
}

// ── Extended mock data ─────────────────────────────────────────────────
const extendedPosts: ForumPost[] = forumPosts.map((post, idx) => ({
  ...post,
  replyList:
    idx === 2
      ? [
          {
            id: 'r1',
            author: 'Emma L.',
            avatar: '👩',
            content:
              'You are not alone, Raj. I had a similar setback last month and taking it one day at a time really helped.',
            timeAgo: '5h ago',
            isExpert: false,
            likes: 12,
          },
          {
            id: 'r2',
            author: 'Coach Williams',
            avatar: '👨‍🏫',
            content:
              'Remember: setbacks are part of the journey. Try reducing your exercise intensity by 30% for a week and gradually build back up. Your body is telling you something — listen to it.',
            timeAgo: '3h ago',
            isExpert: true,
            likes: 28,
          },
          {
            id: 'r3',
            author: 'Mike T.',
            avatar: '🧔',
            content: 'Sending you strength, brother. We are all in this together.',
            timeAgo: '1h ago',
            isExpert: false,
            likes: 8,
          },
        ]
      : idx === 1
        ? [
            {
              id: 'r4',
              author: 'Lisa R.',
              avatar: '👩‍🦰',
              content: 'This is so helpful! I just started and the breath work tip is gold.',
              timeAgo: '3h ago',
              isExpert: false,
              likes: 5,
            },
            {
              id: 'r5',
              author: 'Dr. Patel',
              avatar: '👩‍⚕️',
              content:
                'Great tips, Coach! I would also recommend starting with gentle neck rolls to release tension before each session.',
              timeAgo: '2h ago',
              isExpert: true,
              likes: 14,
            },
          ]
        : [],
}));

const expertCoaches = [
  {
    id: 'ec1',
    name: 'Coach Williams',
    avatar: '👨‍🏫',
    specialty: 'Adaptive Yoga & Flexibility',
    available: true,
    rating: 4.9,
    sessions: 340,
  },
  {
    id: 'ec2',
    name: 'Dr. Patel',
    avatar: '👩‍⚕️',
    specialty: 'Rehabilitation & Sports Medicine',
    available: true,
    rating: 5.0,
    sessions: 520,
  },
  {
    id: 'ec3',
    name: 'Sarah M.',
    avatar: '👩‍🦱',
    specialty: 'Paralympic Swimming & Mental Resilience',
    available: false,
    rating: 4.8,
    sessions: 210,
  },
];

const emergencyResources = [
  { name: 'Crisis Hotline', phone: '988', description: 'Suicide & Crisis Lifeline — 24/7 support' },
  { name: 'Veterans Crisis Line', phone: '988 (Press 1)', description: 'Support for veterans in crisis' },
  { name: 'Disability Support', phone: '1-800-526-7234', description: 'Job Accommodation Network' },
];

const communityStats = {
  members: 12847,
  postsToday: 89,
  activeNow: 342,
};

// ── Category helpers ───────────────────────────────────────────────────
type Category = 'all' | 'support' | 'tips' | 'motivation' | 'coaching';

const categoryConfig: Record<
  Exclude<Category, 'all'>,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  support: {
    label: 'Support',
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/50',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  tips: {
    label: 'Tips',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  motivation: {
    label: 'Motivation',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  coaching: {
    label: 'Expert Coaching',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/50',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
};

function getCategoryStyle(cat: string) {
  return (
    categoryConfig[cat as Exclude<Category, 'all'>] ?? {
      label: cat,
      color: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-950/50',
      borderColor: 'border-gray-200 dark:border-gray-800',
    }
  );
}

// ── Animated counter hook ──────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

function StatCounter({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  const count = useAnimatedCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="text-center p-4 sm:p-6">
        <CardContent className="p-0 flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold tabular-nums">{count.toLocaleString()}</span>
          <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Like button with heart animation ───────────────────────────────────
function LikeButton({ initialCount, postId }: { initialCount: number; postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  const toggle = () => {
    setLiked((prev) => !prev);
    setCount((c) => (liked ? c - 1 : c + 1));
    // postId available for future API integration
    void postId;
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 group transition-colors"
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <motion.div whileTap={{ scale: 1.4 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
        <Heart
          className={`h-4 w-4 transition-colors ${
            liked ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground group-hover:text-rose-400'
          }`}
        />
      </motion.div>
      <span className={`text-xs ${liked ? 'text-rose-500 font-medium' : 'text-muted-foreground'}`}>{count}</span>
    </button>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────
function PostCard({
  post,
  onExpand,
  isExpanded,
}: {
  post: ForumPost;
  onExpand: (id: string) => void;
  isExpanded: boolean;
}) {
  const catStyle = getCategoryStyle(post.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`transition-shadow duration-300 hover:shadow-lg cursor-pointer ${
          isExpanded ? 'ring-2 ring-primary/20' : ''
        }`}
        onClick={() => onExpand(post.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className={`h-10 w-10 ${post.isExpert ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background' : ''}`}>
                <AvatarFallback className="text-lg bg-muted">{post.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{post.author}</span>
                  {post.isExpert && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] px-1.5 py-0 h-5 gap-0.5"
                    >
                      <Award className="h-3 w-3" />
                      Expert
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
              </div>
            </div>
            <Badge variant="outline" className={`${catStyle.bgColor} ${catStyle.color} ${catStyle.borderColor} text-[10px] shrink-0`}>
              {catStyle.label}
            </Badge>
          </div>
          <CardTitle className="text-base mt-2 leading-snug">{post.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm line-clamp-2">{post.content}</CardDescription>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <LikeButton initialCount={post.likes} postId={post.id} />
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{post.replies}</span>
            </div>
          </div>
        </CardContent>

        {/* Expanded reply thread */}
        <AnimatePresence>
          {isExpanded && post.replyList && post.replyList.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-4">
                <Separator className="mb-3" />
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Replies ({post.replyList.length})
                </p>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {post.replyList.map((reply) => (
                      <div
                        key={reply.id}
                        className="border-l-2 border-primary/30 pl-3 py-1"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-muted">{reply.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{reply.author}</span>
                          {reply.isExpert && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[9px] px-1 py-0 h-4 gap-0.5"
                            >
                              <Award className="h-2.5 w-2.5" />
                              Expert
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{reply.timeAgo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{reply.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{reply.likes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {/* Quick reply */}
                <div className="flex items-center gap-2 mt-3">
                  <Input placeholder="Write a reply..." className="text-xs h-8" onClick={(e) => e.stopPropagation()} />
                  <Button size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function Community() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<string>('support');

  const filteredPosts =
    activeCategory === 'all' ? extendedPosts : extendedPosts.filter((p) => p.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedPostId((prev) => (prev === id ? null : id));
  };

  const handleNewPost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    extendedPosts.unshift({
      id: `new-${Date.now()}`,
      author: 'You',
      avatar: '😊',
      title: newTitle,
      content: newContent,
      category: newCategory,
      likes: 0,
      replies: 0,
      isExpert: false,
      timeAgo: 'Just now',
      replyList: [],
    });
    setNewTitle('');
    setNewContent('');
    setNewCategory('support');
    setNewPostOpen(false);
  };

  return (
    <section className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="relative z-10 bg-gradient-to-br from-primary/90 to-primary/70 dark:from-primary/80 dark:to-primary/60 text-primary-foreground p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Community Forum</h2>
              <p className="text-primary-foreground/80 text-sm sm:text-base max-w-lg">
                Connect, share, and grow with a community that understands your journey. Get peer support and expert
                coaching every step of the way.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                  <Users className="h-3 w-3 mr-1" />
                  Peer Support
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Expert Coaching
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                  <Star className="h-3 w-3 mr-1" />
                  Safe Space
                </Badge>
              </div>
            </div>
            <div className="shrink-0 hidden sm:block">
              <img
                src="/images/community.png"
                alt="Community illustration"
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Community Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCounter value={communityStats.members} label="Members" icon={Users} />
        <StatCounter value={communityStats.postsToday} label="Posts Today" icon={TrendingUp} />
        <StatCounter value={communityStats.activeNow} label="Active Now" icon={MessageCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Forum */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs + New Post */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)} className="w-full sm:w-auto">
              <TabsList className="flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="support" className="text-xs">Support</TabsTrigger>
                <TabsTrigger value="tips" className="text-xs">Tips</TabsTrigger>
                <TabsTrigger value="motivation" className="text-xs">Motivation</TabsTrigger>
                <TabsTrigger value="coaching" className="text-xs">Coaching</TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0 gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Create a New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input
                    placeholder="Post title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Share your thoughts, questions, or tips..."
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {(['support', 'tips', 'motivation', 'coaching'] as const).map((cat) => {
                        const style = getCategoryStyle(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => setNewCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              newCategory === cat
                                ? `${style.bgColor} ${style.color} ${style.borderColor} ring-2 ring-offset-1 ring-current/30`
                                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                            }`}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button onClick={handleNewPost} className="w-full gap-2" disabled={!newTitle.trim() || !newContent.trim()}>
                    <Send className="h-4 w-4" />
                    Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Post list */}
          <ScrollArea className="max-h-[700px] pr-1">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onExpand={toggleExpand}
                    isExpanded={expandedPostId === post.id}
                  />
                ))}
              </AnimatePresence>
              {filteredPosts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No posts in this category yet.</p>
                  <p className="text-xs mt-1">Be the first to start a conversation!</p>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right column: Sidebar */}
        <div className="space-y-4">
          {/* Expert Coaching */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-violet-50 to-amber-50 dark:from-violet-950/40 dark:to-amber-950/40 border-violet-200/60 dark:border-violet-800/40 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-200/40 to-transparent dark:from-violet-700/20 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  Expert Coaching
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expertCoaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur-sm"
                  >
                    <Avatar className={`h-9 w-9 shrink-0 ${coach.available ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-background' : 'ring-2 ring-muted ring-offset-1 ring-offset-background'}`}>
                      <AvatarFallback className="text-sm bg-muted">{coach.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{coach.name}</span>
                        {coach.available && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{coach.specialty}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {coach.rating}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{coach.sessions} sessions</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-7 w-7 p-0"
                      disabled={!coach.available}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2 text-xs gap-1.5" size="sm">
                  <UserPlus className="h-3.5 w-3.5" />
                  View All Coaches
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Support — Emergency Resources */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card className="border-rose-200/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-background overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-200/30 to-transparent dark:from-rose-700/15 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <Phone className="h-4 w-4" />
                  Quick Support
                </CardTitle>
                <CardDescription className="text-xs">
                  You are never alone. Reach out if you need help.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {emergencyResources.map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/70 dark:bg-white/5"
                  >
                    <div className="rounded-full bg-rose-100 dark:bg-rose-900/50 p-1.5 shrink-0">
                      <HelpCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{resource.name}</p>
                      <p className="text-[10px] text-muted-foreground">{resource.description}</p>
                      <p className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-300 mt-0.5">
                        {resource.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Be respectful and supportive of all members
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Share your experience — it may help someone
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Report any harmful or discriminatory content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    Consult professionals for medical advice
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
