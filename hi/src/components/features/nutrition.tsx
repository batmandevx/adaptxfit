'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Utensils,
  Apple,
  Droplets,
  ShoppingCart,
  AlertCircle,
  Plus,
  Minus,
  Flame,
  Check,
  Leaf,
  Truck,
} from 'lucide-react';
import TTSSpeaker from '@/components/features/tts-speaker';
import HealthSearch from '@/components/features/health-search';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { nutritionData, calorieTrackingData } from '@/lib/mock-data';

// ── Types ──────────────────────────────────────────────────────────────
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
}

interface MealPlanItem {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  ingredients: string[];
  allergens: string[];
  nutritionBalance: number; // 0-100
  description: string;
}

// ── Mock data ──────────────────────────────────────────────────────────
const initialMealLog: FoodItem[] = [
  {
    id: '1',
    name: 'Oatmeal with Berries',
    calories: 310,
    protein: 12,
    carbs: 54,
    fat: 6,
    fiber: 8,
    vitamins: ['Vitamin C', 'Iron', 'B6'],
    mealType: 'breakfast',
    time: '8:00 AM',
  },
  {
    id: '2',
    name: 'Greek Yogurt Parfait',
    calories: 180,
    protein: 15,
    carbs: 22,
    fat: 4,
    fiber: 2,
    vitamins: ['Calcium', 'B12'],
    mealType: 'breakfast',
    time: '8:30 AM',
  },
  {
    id: '3',
    name: 'Grilled Chicken Salad',
    calories: 420,
    protein: 38,
    carbs: 18,
    fat: 22,
    fiber: 6,
    vitamins: ['Vitamin A', 'Vitamin K'],
    mealType: 'lunch',
    time: '12:30 PM',
  },
  {
    id: '4',
    name: 'Quinoa Power Bowl',
    calories: 380,
    protein: 24,
    carbs: 52,
    fat: 10,
    fiber: 8,
    vitamins: ['Magnesium', 'Folate'],
    mealType: 'lunch',
    time: '1:00 PM',
  },
  {
    id: '5',
    name: 'Salmon & Sweet Potato',
    calories: 520,
    protein: 42,
    carbs: 38,
    fat: 18,
    fiber: 6,
    vitamins: ['Omega-3', 'Vitamin D'],
    mealType: 'dinner',
    time: '7:00 PM',
  },
  {
    id: '6',
    name: 'Protein Smoothie',
    calories: 160,
    protein: 20,
    carbs: 18,
    fat: 3,
    fiber: 3,
    vitamins: ['Vitamin C', 'Potassium'],
    mealType: 'snack',
    time: '4:00 PM',
  },
];

const mealPlanData: MealPlanItem[] = [
  {
    id: 'mp1',
    name: 'Protein-Packed Pancakes',
    mealType: 'breakfast',
    calories: 350,
    ingredients: ['Oat flour', 'Egg whites', 'Banana', 'Whey protein', 'Almond milk'],
    allergens: ['Eggs', 'Milk'],
    nutritionBalance: 85,
    description: 'Fluffy pancakes with complete amino acid profile',
  },
  {
    id: 'mp2',
    name: 'Mediterranean Quinoa Bowl',
    mealType: 'lunch',
    calories: 480,
    ingredients: ['Quinoa', 'Chickpeas', 'Cucumber', 'Tomato', 'Feta cheese', 'Olive oil'],
    allergens: ['Dairy'],
    nutritionBalance: 92,
    description: 'Anti-inflammatory meal rich in plant protein',
  },
  {
    id: 'mp3',
    name: 'Adaptive Recovery Stew',
    mealType: 'dinner',
    calories: 520,
    ingredients: ['Lean beef', 'Sweet potato', 'Carrots', 'Spinach', 'Bone broth'],
    allergens: [],
    nutritionBalance: 95,
    description: 'Collagen-rich stew for joint recovery and muscle repair',
  },
  {
    id: 'mp4',
    name: 'Energy Bites',
    mealType: 'snack',
    calories: 180,
    ingredients: ['Dates', 'Almonds', 'Cocoa powder', 'Chia seeds', 'Coconut flakes'],
    allergens: ['Tree Nuts', 'Coconut'],
    nutritionBalance: 78,
    description: 'No-bake energy bites for sustained fuel',
  },
];

const detectedFoodData = {
  name: 'Grilled Chicken Breast',
  calories: 284,
  protein: 42,
  carbs: 0,
  fat: 12,
  fiber: 0,
  vitamins: ['B6', 'Niacin', 'Phosphorus', 'Selenium'],
};

// ── Meal type config ──────────────────────────────────────────────────
const mealTypeConfig = {
  breakfast: { label: 'Breakfast', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  lunch: { label: 'Lunch', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  dinner: { label: 'Dinner', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  snack: { label: 'Snack', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

// ── Sub-components ─────────────────────────────────────────────────────

function CircularCalorieTracker({ consumed, target }: { consumed: number; target: number }) {
  const percentage = Math.min((consumed / target) * 100, 100);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
          <defs>
            <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <motion.circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            fill="none"
            stroke="url(#calorieGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {consumed}
          </motion.span>
          <span className="text-xs text-muted-foreground">of {target} kcal</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="font-medium text-orange-600">
          {target - consumed > 0 ? target - consumed : 0} kcal remaining
        </span>
      </div>
    </div>
  );
}

function WaterTracker() {
  const [glasses, setGlasses] = useState(5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-500" />
          <span className="font-medium text-sm">Water Intake</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {glasses}/8 glasses
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setGlasses(i < glasses ? i : i + 1)}
            className="relative flex flex-col items-center"
            whileTap={{ scale: 0.9 }}
          >
            <div
              className={`relative h-10 w-7 rounded-b-full rounded-t-lg border-2 transition-colors duration-300 overflow-hidden ${
                i < glasses
                  ? 'border-sky-400'
                  : 'border-muted-foreground/30'
              }`}
            >
              <AnimatePresence>
                {i < glasses && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500 to-sky-300"
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setGlasses((g) => Math.max(0, g - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium">
          {(glasses * 250).toLocaleString()} ml
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setGlasses((g) => Math.min(8, g + 1))}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function AIFoodScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setScanned(false);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2000);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-base">AI Food Scanner</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Scan or upload food to get instant nutritional analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleScan}
            disabled={scanning}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
          >
            {scanning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Camera className="h-4 w-4 mr-2" />
              </motion.div>
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {scanning ? 'Analyzing...' : 'Scan Food'}
          </Button>
          <Button variant="outline" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>

        <AnimatePresence>
          {scanned && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-amber-50 p-4 space-y-3 dark:from-orange-950/30 dark:to-amber-950/30">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                    <Apple className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{detectedFoodData.name}</p>
                      <TTSSpeaker
                        text={`Detected food: ${detectedFoodData.name}. ${detectedFoodData.calories} calories. Protein: ${detectedFoodData.protein} grams. Carbs: ${detectedFoodData.carbs} grams. Fat: ${detectedFoodData.fat} grams. Fiber: ${detectedFoodData.fiber} grams.`}
                        size="sm"
                        voice="tongtong"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Flame className="inline h-3 w-3 text-orange-500 mr-1" />
                      {detectedFoodData.calories} kcal
                    </p>
                  </div>
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Detected
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Protein', value: detectedFoodData.protein, unit: 'g', color: 'text-emerald-600' },
                    { label: 'Carbs', value: detectedFoodData.carbs, unit: 'g', color: 'text-amber-600' },
                    { label: 'Fat', value: detectedFoodData.fat, unit: 'g', color: 'text-rose-600' },
                    { label: 'Fiber', value: detectedFoodData.fiber, unit: 'g', color: 'text-violet-600' },
                  ].map((macro) => (
                    <div key={macro.label}>
                      <p className={`text-lg font-bold ${macro.color}`}>
                        {macro.value}{macro.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{macro.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-medium mb-1">Vitamins & Minerals</p>
                  <div className="flex flex-wrap gap-1">
                    {detectedFoodData.vitamins.map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button size="sm" className="w-full text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add to Meal Log
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function MealLog({ meals }: { meals: FoodItem[] }) {
  const groupedMeals = meals.reduce<Record<string, FoodItem[]>>((acc, meal) => {
    if (!acc[meal.mealType]) acc[meal.mealType] = [];
    acc[meal.mealType].push(meal);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">Today's Meal Log</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Track everything you eat throughout the day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
            const items = groupedMeals[type] || [];
            if (items.length === 0) return null;
            const config = mealTypeConfig[type];
            return (
              <div key={type} className="space-y-2">
                <Badge className={`${config.color} text-xs font-medium`}>
                  {config.label}
                </Badge>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center shrink-0">
                      <Apple className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{item.calories}</p>
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DietPlan() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-base">Personalized Diet Plan</CardTitle>
        </div>
        <CardDescription className="text-xs">
          AI-curated meals based on your preferences &amp; allergies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {mealPlanData.map((meal, idx) => {
            const config = mealTypeConfig[meal.mealType];
            return (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge className={`${config.color} text-[10px] mb-1`}>
                      {config.label}
                    </Badge>
                    <p className="font-semibold text-sm">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">{meal.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-orange-600">{meal.calories}</p>
                    <p className="text-[10px] text-muted-foreground">kcal</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="flex flex-wrap gap-1">
                  {meal.ingredients.map((ing) => (
                    <Badge key={ing} variant="outline" className="text-[10px] px-1.5 py-0">
                      {ing}
                    </Badge>
                  ))}
                </div>

                {/* Allergen warnings */}
                {meal.allergens.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                    {meal.allergens.map((allergen) => (
                      <Badge
                        key={allergen}
                        className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0"
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Nutrition balance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Nutritional Balance</span>
                    <span className="font-medium">{meal.nutritionBalance}%</span>
                  </div>
                  <Progress value={meal.nutritionBalance} className="h-1.5" />
                </div>

                {/* Order integration */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-[11px] h-8 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Order on Swiggy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-[11px] h-8 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Order on Blinkit
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AllergyDietSettings() {
  const [allergies, setAllergies] = useState(['Peanuts', 'Shellfish', 'Gluten']);
  const [dietPref, setDietPref] = useState('High Protein Recovery');
  const [newAllergy, setNewAllergy] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Allergy &amp; Diet Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Allergy &amp; Diet Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Current Diet Preference</p>
            <Input
              value={dietPref}
              onChange={(e) => setDietPref(e.target.value)}
              className="text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Allergies &amp; Intolerances</p>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => (
                <Badge
                  key={a}
                  className="bg-red-100 text-red-700 border-red-200 text-xs pr-1"
                >
                  {a}
                  <button
                    onClick={() => setAllergies(allergies.filter((x) => x !== a))}
                    className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add allergy..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAllergy.trim()) {
                    setAllergies([...allergies, newAllergy.trim()]);
                    setNewAllergy('');
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newAllergy.trim()) {
                    setAllergies([...allergies, newAllergy.trim()]);
                    setNewAllergy('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function Nutrition() {
  const [mealLog, setMealLog] = useState<FoodItem[]>(initialMealLog);
  const totalConsumed = mealLog.reduce((s, m) => s + m.calories, 0);
  const calorieTarget = 2000;

  const totalProtein = mealLog.reduce((s, m) => s + m.protein, 0);
  const totalCarbs = mealLog.reduce((s, m) => s + m.carbs, 0);
  const totalFat = mealLog.reduce((s, m) => s + m.fat, 0);
  const totalFiber = mealLog.reduce((s, m) => s + m.fiber, 0);

  const macroData = [
    { name: 'Protein', value: totalProtein, color: '#10b981' },
    { name: 'Carbs', value: totalCarbs, color: '#f59e0b' },
    { name: 'Fat', value: totalFat, color: '#ef4444' },
    { name: 'Fiber', value: totalFiber, color: '#8b5cf6' },
  ];

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <Apple className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              AI Nutrition Hub
            </h2>
            <p className="text-sm text-muted-foreground">
              Smart food logging, calorie tracking &amp; diet planning
            </p>
          </div>
        </div>
        <AllergyDietSettings />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left column: Logging & Charts ── */}
        <div className="space-y-6">
          {/* AI Food Scanner */}
          <AIFoodScanner />

          {/* Calorie tracker + Macro breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Calorie Tracker */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Calories</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <CircularCalorieTracker consumed={totalConsumed} target={calorieTarget} />
              </CardContent>
            </Card>

            {/* Macro Breakdown Donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Macro Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value}g`, name]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {macroData.map((m) => (
                    <div key={m.name} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="text-muted-foreground">{m.name}</span>
                      <span className="font-medium ml-auto">{m.value}g</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Water Intake Tracker */}
          <Card>
            <CardContent className="pt-6">
              <WaterTracker />
            </CardContent>
          </Card>

          {/* Meal Log */}
          <MealLog meals={mealLog} />

          {/* Calorie Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Weekly Calorie Trend</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Daily intake vs burned vs target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieTrackingData} barGap={2}>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                    <Bar dataKey="intake" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Intake" />
                    <Bar dataKey="burned" fill="#10b981" radius={[4, 4, 0, 0]} name="Burned" />
                    <Bar dataKey="target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target" opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: Diet Plan ── */}
        <div className="space-y-6">
          {/* Hero illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-xl overflow-hidden"
          >
            <img
              src="/images/nutrition.png"
              alt="Nutrition illustration"
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 text-white">
              <p className="font-bold text-sm">Your Personalized Plan</p>
              <p className="text-xs opacity-80">Tailored for recovery &amp; performance</p>
            </div>
          </motion.div>

          {/* Diet Plan */}
          <DietPlan />

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Nutrition Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Protein', value: `${totalProtein}g`, target: '150g', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { label: 'Carbs', value: `${totalCarbs}g`, target: '250g', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  { label: 'Fat', value: `${totalFat}g`, target: '65g', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
                  { label: 'Fiber', value: `${totalFiber}g`, target: '30g', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-lg p-3 ${stat.bg} space-y-1`}
                  >
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">Target: {stat.target}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Search */}
          <HealthSearch defaultQuery="adaptive fitness nutrition" />
        </div>
      </div>
    </section>
  );
}
