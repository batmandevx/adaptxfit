// Mock data for dashboard
export const weeklyExerciseData = [
  { day: 'Mon', minutes: 25, calories: 150, target: 30 },
  { day: 'Tue', minutes: 35, calories: 210, target: 30 },
  { day: 'Wed', minutes: 20, calories: 120, target: 30 },
  { day: 'Thu', minutes: 45, calories: 270, target: 30 },
  { day: 'Fri', minutes: 30, calories: 180, target: 30 },
  { day: 'Sat', minutes: 40, calories: 240, target: 30 },
  { day: 'Sun', minutes: 15, calories: 90, target: 30 },
];

export const monthlyMoodData = [
  { week: 'W1', happy: 5, calm: 3, anxious: 2, sad: 1 },
  { week: 'W2', happy: 4, calm: 4, anxious: 1, sad: 1 },
  { week: 'W3', happy: 6, calm: 3, anxious: 1, sad: 0 },
  { week: 'W4', happy: 7, calm: 2, anxious: 1, sad: 0 },
];

export const nutritionData = [
  { name: 'Protein', value: 35, color: '#10b981' },
  { name: 'Carbs', value: 40, color: '#f59e0b' },
  { name: 'Fat', value: 20, color: '#ef4444' },
  { name: 'Fiber', value: 5, color: '#8b5cf6' },
];

export const heartRateData = [
  { time: '6AM', bpm: 68, zone: 'Resting' },
  { time: '7AM', bpm: 72, zone: 'Resting' },
  { time: '8AM', bpm: 95, zone: 'Light' },
  { time: '9AM', bpm: 120, zone: 'Moderate' },
  { time: '10AM', bpm: 145, zone: 'Vigorous' },
  { time: '11AM', bpm: 130, zone: 'Moderate' },
  { time: '12PM', bpm: 85, zone: 'Light' },
  { time: '1PM', bpm: 75, zone: 'Resting' },
  { time: '2PM', bpm: 110, zone: 'Moderate' },
  { time: '3PM', bpm: 135, zone: 'Vigorous' },
  { time: '4PM', bpm: 100, zone: 'Light' },
  { time: '5PM', bpm: 78, zone: 'Resting' },
];

export const progressData = [
  { month: 'Jan', strength: 20, flexibility: 15, endurance: 25, balance: 10 },
  { month: 'Feb', strength: 30, flexibility: 25, endurance: 30, balance: 20 },
  { month: 'Mar', strength: 40, flexibility: 35, endurance: 40, balance: 30 },
  { month: 'Apr', strength: 55, flexibility: 45, endurance: 50, balance: 40 },
  { month: 'May', strength: 65, flexibility: 55, endurance: 60, balance: 55 },
  { month: 'Jun', strength: 75, flexibility: 65, endurance: 70, balance: 65 },
];

export const calorieTrackingData = [
  { day: 'Mon', intake: 1800, burned: 450, target: 2000 },
  { day: 'Tue', intake: 2100, burned: 520, target: 2000 },
  { day: 'Wed', intake: 1900, burned: 380, target: 2000 },
  { day: 'Thu', intake: 2200, burned: 600, target: 2000 },
  { day: 'Fri', intake: 1750, burned: 420, target: 2000 },
  { day: 'Sat', intake: 2300, burned: 350, target: 2000 },
  { day: 'Sun', intake: 1600, burned: 280, target: 2000 },
];

export const exerciseCategories = [
  { id: 'adaptive', label: 'Adaptive Fitness', icon: '♿', count: 24 },
  { id: 'rehab', label: 'Rehabilitation', icon: '🩹', count: 18 },
  { id: 'strength', label: 'Strength Training', icon: '💪', count: 32 },
  { id: 'flexibility', label: 'Flexibility & Yoga', icon: '🧘', count: 15 },
  { id: 'cardio', label: 'Cardio', icon: '❤️', count: 20 },
  { id: 'balance', label: 'Balance & Stability', icon: '⚖️', count: 12 },
];

export const adaptiveExercises = [
  {
    id: '1',
    name: 'Seated Shoulder Press',
    category: 'strength',
    targetMuscles: ['Shoulders', 'Triceps', 'Core'],
    difficulty: 'medium',
    duration: 10,
    calories: 45,
    description: 'Strengthen shoulders while seated. Perfect for wheelchair users or those with lower body limitations.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Use resistance bands for lighter resistance', 'One-arm variation for unilateral weakness'],
    thumbnailUrl: '/images/exercise-1.jpg',
  },
  {
    id: '2',
    name: 'Resisted Leg Extensions',
    category: 'rehab',
    targetMuscles: ['Quadriceps', 'Hip Flexors'],
    difficulty: 'easy',
    duration: 15,
    calories: 35,
    description: 'Gentle leg extensions with resistance band for knee rehabilitation and quad strengthening.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Reduce range of motion for acute injuries', 'Add ankle weights for progression'],
    thumbnailUrl: '/images/exercise-2.jpg',
  },
  {
    id: '3',
    name: 'Wheelchair Yoga Flow',
    category: 'flexibility',
    targetMuscles: ['Spine', 'Shoulders', 'Hips'],
    difficulty: 'easy',
    duration: 20,
    calories: 30,
    description: 'Gentle yoga flow adapted for seated practice. Improves flexibility and reduces stress.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Reduce hold times for beginners', 'Use chair with armrests for support'],
    thumbnailUrl: '/images/exercise-3.jpg',
  },
  {
    id: '4',
    name: 'Para Swimming Dry Land Training',
    category: 'cardio',
    targetMuscles: ['Lats', 'Shoulders', 'Core', 'Arms'],
    difficulty: 'hard',
    duration: 25,
    calories: 120,
    description: 'Dry land training for Paralympic swimmers. Simulates swim strokes with resistance bands.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Seated variation available', 'Resistance adjustable'],
    thumbnailUrl: '/images/exercise-4.jpg',
  },
  {
    id: '5',
    name: 'Balance Board Seated',
    category: 'balance',
    targetMuscles: ['Core', 'Stabilizers'],
    difficulty: 'medium',
    duration: 12,
    calories: 25,
    description: 'Seated balance exercises using an inflatable cushion to improve core stability.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Use chair with back support', 'Hand assistance for safety'],
    thumbnailUrl: '/images/exercise-5.jpg',
  },
  {
    id: '6',
    name: 'Upper Body Resistance Circuit',
    category: 'adaptive',
    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
    difficulty: 'hard',
    duration: 30,
    calories: 150,
    description: 'Complete upper body circuit using resistance bands. Designed for lower limb amputees.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    adaptations: ['Adjustable band resistance', 'One-sided variations'],
    thumbnailUrl: '/images/exercise-6.jpg',
  },
];

export const forumPosts = [
  {
    id: '1',
    author: 'Sarah M.',
    avatar: '👩‍🦱',
    title: 'My journey from injury to Paralympic swimming',
    content: 'After losing my leg in service, I thought my athletic career was over. AdaptiFit helped me discover adaptive swimming...',
    category: 'motivation',
    likes: 156,
    replies: 23,
    isExpert: true,
    timeAgo: '2h ago',
  },
  {
    id: '2',
    author: 'Coach Williams',
    avatar: '👨‍🏫',
    title: 'Tips for wheelchair yoga beginners',
    content: 'Start with 5-minute sessions and gradually increase. Focus on breath work first, then movement...',
    category: 'tips',
    likes: 89,
    replies: 15,
    isExpert: true,
    timeAgo: '4h ago',
  },
  {
    id: '3',
    author: 'Raj K.',
    avatar: '🧑',
    title: 'Struggling with motivation after setback',
    content: 'Had a rough week with my rehab exercises. The pain came back and I feel like giving up...',
    category: 'support',
    likes: 45,
    replies: 31,
    isExpert: false,
    timeAgo: '6h ago',
  },
  {
    id: '4',
    author: 'Dr. Patel',
    avatar: '👩‍⚕️',
    title: 'Understanding your body signals during exercise',
    content: 'Pain vs discomfort: Learn to differentiate between normal exercise fatigue and warning signs...',
    category: 'coaching',
    likes: 112,
    replies: 18,
    isExpert: true,
    timeAgo: '1d ago',
  },
];

export const recentAchievements = [
  { id: '1', title: '7-Day Streak', description: 'Completed exercises 7 days in a row', icon: '🔥', date: 'Today' },
  { id: '2', title: 'Form Master', description: '90%+ form accuracy for 5 exercises', icon: '✨', date: 'Yesterday' },
  { id: '3', title: 'Mood Warrior', description: 'Logged mood for 14 consecutive days', icon: '🧠', date: '3 days ago' },
  { id: '4', title: 'Nutrition Pro', description: 'Met calorie targets for 7 days', icon: '🥗', date: '1 week ago' },
];

export const youtubeExerciseVideos = [
  { id: '1', title: 'Seated Full Body Workout', channel: 'Adaptive Fitness Pro', views: '245K', duration: '15:32', thumbnail: '/images/hero.png' },
  { id: '2', title: 'Wheelchair Yoga for Beginners', channel: 'Inclusive Yoga', views: '189K', duration: '20:15', thumbnail: '/images/hero.png' },
  { id: '3', title: 'Upper Body Strength for Paraplegics', channel: 'ParaFit Training', views: '312K', duration: '25:48', thumbnail: '/images/hero.png' },
  { id: '4', title: 'Rehabilitation Exercises for Knee Injury', channel: 'Physio Recovery', views: '456K', duration: '18:22', thumbnail: '/images/hero.png' },
  { id: '5', title: 'Balance Training for Amputees', channel: 'Adaptive Fitness Pro', views: '178K', duration: '12:45', thumbnail: '/images/hero.png' },
  { id: '6', title: 'Stress Relief Breathing Techniques', channel: 'Mindful Recovery', views: '523K', duration: '10:30', thumbnail: '/images/hero.png' },
];
