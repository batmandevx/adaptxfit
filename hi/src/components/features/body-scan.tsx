'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Timer,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Armchair,
  Hand,
  PersonStanding,
  CircleDot,
  Volume2,
} from 'lucide-react'
import TTSSpeaker from '@/components/features/tts-speaker'
import { useToastStore } from './toast-provider'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Types
interface JointAngle {
  name: string
  angle: number
  status: 'good' | 'caution' | 'danger'
}

interface FeedbackMessage {
  id: number
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  timestamp: Date
}

interface SkeletonPoint {
  x: number
  y: number
  label?: string
}

interface Exercise {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  targetAngles: Record<string, { min: number; max: number }>
  directionHint?: string
}

// Exercises data
const EXERCISES: Exercise[] = [
  {
    id: 'shoulder-rotation',
    name: 'Shoulder Rotation',
    description: 'Circular shoulder mobility exercise',
    icon: <RotateCw className="size-5" />,
    targetAngles: {
      'Left Shoulder': { min: 140, max: 180 },
      'Right Shoulder': { min: 140, max: 180 },
      'Left Elbow': { min: 150, max: 180 },
      'Right Elbow': { min: 150, max: 180 },
    },
    directionHint: 'Rotate →',
  },
  {
    id: 'seated-balance',
    name: 'Seated Balance',
    description: 'Core stability while seated',
    icon: <Armchair className="size-5" />,
    targetAngles: {
      'Left Hip': { min: 85, max: 100 },
      'Right Hip': { min: 85, max: 100 },
      'Left Shoulder': { min: 160, max: 180 },
      'Right Shoulder': { min: 160, max: 180 },
    },
    directionHint: 'Balance ↔',
  },
  {
    id: 'arm-extension',
    name: 'Arm Extension',
    description: 'Full arm extension with hold',
    icon: <Hand className="size-5" />,
    targetAngles: {
      'Left Shoulder': { min: 150, max: 180 },
      'Right Shoulder': { min: 150, max: 180 },
      'Left Elbow': { min: 160, max: 180 },
      'Right Elbow': { min: 160, max: 180 },
    },
    directionHint: 'Extend ↑',
  },
  {
    id: 'knee-flexion',
    name: 'Knee Flexion',
    description: 'Controlled knee bending exercise',
    icon: <PersonStanding className="size-5" />,
    targetAngles: {
      'Left Knee': { min: 70, max: 120 },
      'Right Knee': { min: 70, max: 120 },
      'Left Hip': { min: 80, max: 110 },
      'Right Hip': { min: 80, max: 110 },
    },
    directionHint: 'Bend ↓',
  },
  {
    id: 'lateral-lean',
    name: 'Lateral Lean',
    description: 'Side-leaning flexibility drill',
    icon: <ArrowLeft className="size-5" />,
    targetAngles: {
      'Left Shoulder': { min: 120, max: 180 },
      'Right Shoulder': { min: 120, max: 180 },
      'Left Hip': { min: 75, max: 105 },
      'Right Hip': { min: 75, max: 105 },
    },
    directionHint: '← Lean Right',
  },
]

// Feedback messages pool
const FEEDBACK_POOL = {
  success: [
    'Great Form!',
    'Perfect Hold!',
    'Excellent Alignment!',
    'Steady and Strong!',
    'Looking Great!',
    'Well Done!',
    'On Target!',
  ],
  warning: [
    'Lean Left Slightly',
    'Lean Right Slightly',
    'Adjust Shoulders',
    'Hold Position',
    'Slow Down a Bit',
    'Straighten Up',
    'Engage Core More',
  ],
  info: [
    'Tracking Active',
    'Hold for 3 More Seconds',
    'Breathe Steadily',
    'Almost There',
    'Keep Going',
    'Maintain Position',
  ],
  error: [
    'Out of Frame',
    'Adjust Position',
    'Too Much Strain',
    'Reset Form',
  ],
}

// Directional feedback mapping for the enhanced feedback bar
const DIRECTIONAL_FEEDBACK: Record<string, { text: string; arrow: 'left' | 'right' | 'up' | 'none'; color: 'green' | 'yellow' | 'red' }> = {
  'Lean Left Slightly': { text: 'Lean Left', arrow: 'left', color: 'yellow' },
  'Lean Right Slightly': { text: 'Lean Right', arrow: 'right', color: 'yellow' },
  'Adjust Shoulders': { text: 'Adjust Shoulders', arrow: 'up', color: 'yellow' },
  'Straighten Up': { text: 'Straighten Up', arrow: 'up', color: 'yellow' },
  'Great Form!': { text: 'Great Form', arrow: 'none', color: 'green' },
  'Perfect Hold!': { text: 'Perfect Hold', arrow: 'none', color: 'green' },
  'Excellent Alignment!': { text: 'Excellent', arrow: 'none', color: 'green' },
  'On Target!': { text: 'On Target', arrow: 'none', color: 'green' },
  'Out of Frame': { text: 'Out of Frame', arrow: 'none', color: 'red' },
  'Too Much Strain': { text: 'Too Much Strain', arrow: 'none', color: 'red' },
  'Reset Form': { text: 'Reset Form', arrow: 'none', color: 'red' },
  'Adjust Position': { text: 'Adjust Position', arrow: 'none', color: 'red' },
}

// Base skeleton points (normalized 0-1, centered at 0.5)
const BASE_SKELETON: { joints: Record<string, SkeletonPoint>; connections: [string, string][] } = {
  joints: {
    head: { x: 0.5, y: 0.12, label: 'Head' },
    neck: { x: 0.5, y: 0.2 },
    leftShoulder: { x: 0.36, y: 0.28, label: 'L.Shoulder' },
    rightShoulder: { x: 0.64, y: 0.28, label: 'R.Shoulder' },
    leftElbow: { x: 0.28, y: 0.42, label: 'L.Elbow' },
    rightElbow: { x: 0.72, y: 0.42, label: 'R.Elbow' },
    leftWrist: { x: 0.24, y: 0.55, label: 'L.Wrist' },
    rightWrist: { x: 0.76, y: 0.55, label: 'R.Wrist' },
    torso: { x: 0.5, y: 0.45 },
    leftHip: { x: 0.42, y: 0.58, label: 'L.Hip' },
    rightHip: { x: 0.58, y: 0.58, label: 'R.Hip' },
    leftKnee: { x: 0.4, y: 0.73, label: 'L.Knee' },
    rightKnee: { x: 0.6, y: 0.73, label: 'R.Knee' },
    leftAnkle: { x: 0.38, y: 0.88, label: 'L.Ankle' },
    rightAnkle: { x: 0.62, y: 0.88, label: 'R.Ankle' },
  },
  connections: [
    ['head', 'neck'],
    ['neck', 'leftShoulder'],
    ['neck', 'rightShoulder'],
    ['leftShoulder', 'leftElbow'],
    ['rightShoulder', 'rightElbow'],
    ['leftElbow', 'leftWrist'],
    ['rightElbow', 'rightWrist'],
    ['neck', 'torso'],
    ['torso', 'leftHip'],
    ['torso', 'rightHip'],
    ['leftHip', 'leftKnee'],
    ['rightHip', 'rightKnee'],
    ['leftKnee', 'leftAnkle'],
    ['rightKnee', 'rightAnkle'],
    ['leftShoulder', 'rightShoulder'],
    ['leftHip', 'rightHip'],
  ],
}

// Joint name to SVG body diagram key mapping
const JOINT_DIAGRAM_MAP: Record<string, { cx: number; cy: number }> = {
  'Left Shoulder': { cx: 28, cy: 55 },
  'Right Shoulder': { cx: 72, cy: 55 },
  'Left Elbow': { cx: 18, cy: 68 },
  'Right Elbow': { cx: 82, cy: 68 },
  'Left Hip': { cx: 38, cy: 78 },
  'Right Hip': { cx: 62, cy: 78 },
  'Left Knee': { cx: 36, cy: 88 },
  'Right Knee': { cx: 64, cy: 88 },
}

function getAngleColor(status: 'good' | 'caution' | 'danger'): string {
  switch (status) {
    case 'good':
      return 'text-emerald-500'
    case 'caution':
      return 'text-amber-500'
    case 'danger':
      return 'text-red-500'
  }
}

function getAngleDotColor(status: 'good' | 'caution' | 'danger'): string {
  switch (status) {
    case 'good':
      return 'bg-emerald-500'
    case 'caution':
      return 'bg-amber-500'
    case 'danger':
      return 'bg-red-500'
  }
}

function getAngleGlow(status: 'good' | 'caution' | 'danger'): string {
  switch (status) {
    case 'good':
      return 'shadow-emerald-500/50'
    case 'caution':
      return 'shadow-amber-500/50'
    case 'danger':
      return 'shadow-red-500/50'
  }
}

function getAngleHex(status: 'good' | 'caution' | 'danger'): string {
  switch (status) {
    case 'good':
      return '#10b981'
    case 'caution':
      return '#f59e0b'
    case 'danger':
      return '#ef4444'
  }
}

function getFeedbackIcon(type: FeedbackMessage['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle className="size-4 text-emerald-500" />
    case 'warning':
      return <AlertTriangle className="size-4 text-amber-500" />
    case 'info':
      return <Activity className="size-4 text-sky-500" />
    case 'error':
      return <AlertTriangle className="size-4 text-red-500" />
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Circular Progress Component
function CircularProgress({
  value,
  size = 140,
  strokeWidth = 10,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const getColor = () => {
    if (value >= 80) return { stroke: '#10b981', text: 'text-emerald-500', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' }
    if (value >= 60) return { stroke: '#f59e0b', text: 'text-amber-500', glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' }
    return { stroke: '#ef4444', text: 'text-red-500', glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' }
  }

  const colorInfo = getColor()

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={`-rotate-90 ${colorInfo.glow}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorInfo.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className={`text-3xl font-bold ${colorInfo.text}`}
          key={Math.round(value)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-xs text-muted-foreground mt-0.5">Form Accuracy</span>
      </div>
    </div>
  )
}

// Joint Health SVG Diagram Component
function JointHealthDiagram({ jointAngles }: { jointAngles: JointAngle[] }) {
  const angleMap = new Map(jointAngles.map((j) => [j.name, j.status]))

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[200px] mx-auto">
      {/* Body outline */}
      {/* Head */}
      <circle cx="50" cy="18" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Neck */}
      <line x1="50" y1="26" x2="50" y2="32" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Shoulders */}
      <line x1="28" y1="38" x2="72" y2="38" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Torso */}
      <line x1="28" y1="38" x2="38" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="72" y1="38" x2="62" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="38" y1="60" x2="62" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Left arm */}
      <line x1="28" y1="38" x2="18" y2="55" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="18" y1="55" x2="14" y2="72" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Right arm */}
      <line x1="72" y1="38" x2="82" y2="55" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="82" y1="55" x2="86" y2="72" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Left leg */}
      <line x1="38" y1="60" x2="36" y2="78" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="36" y1="78" x2="34" y2="96" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      {/* Right leg */}
      <line x1="62" y1="60" x2="64" y2="78" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />
      <line x1="64" y1="78" x2="66" y2="96" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40" />

      {/* Joint health indicators */}
      {Object.entries(JOINT_DIAGRAM_MAP).map(([name, pos]) => {
        const status = angleMap.get(name)
        if (!status) return null
        const color = getAngleHex(status)
        return (
          <g key={name}>
            {/* Glow */}
            <circle cx={pos.cx} cy={pos.cy} r="6" fill={color} opacity={0.15} />
            {/* Dot */}
            <motion.circle
              cx={pos.cx}
              cy={pos.cy}
              r="3.5"
              fill={color}
              stroke={color}
              strokeWidth="0.5"
              opacity={0.9}
              animate={{
                r: status === 'danger' ? [3.5, 4.5, 3.5] : status === 'caution' ? [3.5, 4, 3.5] : 3.5,
                opacity: status === 'danger' ? [0.9, 0.5, 0.9] : 0.9,
              }}
              transition={{
                duration: status === 'danger' ? 1 : 2,
                repeat: Infinity,
              }}
            />
            {/* Center bright */}
            <circle cx={pos.cx} cy={pos.cy} r="1.5" fill="white" opacity={0.7} />
            {/* Label */}
            <text
              x={pos.cx}
              y={pos.cy - 7}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="3.5"
              fontFamily="Inter, sans-serif"
            >
              {name.replace('Left ', 'L.').replace('Right ', 'R.')}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(2, 2)">
        <circle cx="2" cy="2" r="2" fill="#10b981" />
        <text x="6" y="3.5" fontSize="3" className="fill-muted-foreground" fontFamily="Inter, sans-serif">Good</text>
        <circle cx="20" cy="2" r="2" fill="#f59e0b" />
        <text x="24" y="3.5" fontSize="3" className="fill-muted-foreground" fontFamily="Inter, sans-serif">Caution</text>
        <circle cx="40" cy="2" r="2" fill="#ef4444" />
        <text x="44" y="3.5" fontSize="3" className="fill-muted-foreground" fontFamily="Inter, sans-serif">Danger</text>
      </g>
    </svg>
  )
}

// Animated Counter Component
function AnimatedCounter({ value, label, format }: { value: number; label: string; format?: (v: number) => string }) {
  const display = format ? format(value) : String(value)
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <motion.p
        className="text-2xl font-bold text-foreground"
        key={value}
        initial={{ scale: 1.2, y: -4 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {display}
      </motion.p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

// Rep Counter Component with large display and pulse
function RepCounter({ reps, pulseKey }: { reps: number; pulseKey: number }) {
  return (
    <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-b from-muted/80 to-muted/40 border border-border/50">
      {/* Pulse ring animation on each rep */}
      <AnimatePresence>
        <motion.div
          key={pulseKey}
          className="absolute inset-0 rounded-xl border-2 border-emerald-400"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </AnimatePresence>
      {/* Glow effect behind the number */}
      <div className="absolute size-16 rounded-full bg-emerald-500/10 blur-xl" />
      <motion.p
        className="relative text-5xl font-black text-foreground tabular-nums"
        key={reps}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {reps}
      </motion.p>
      <p className="relative text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">Reps</p>
    </div>
  )
}

// Directional Arrow Component for feedback bar
function DirectionalArrow({ direction, color }: { direction: 'left' | 'right' | 'up' | 'none'; color: 'green' | 'yellow' | 'red' }) {
  const colorClass = color === 'green' ? 'text-emerald-400' : color === 'yellow' ? 'text-amber-400' : 'text-red-400'
  const iconClass = `size-6 ${colorClass}`

  switch (direction) {
    case 'left':
      return <ArrowLeft className={iconClass} />
    case 'right':
      return <ArrowRight className={iconClass} />
    case 'up':
      return <ArrowUp className={iconClass} />
    default:
      return <CheckCircle className={iconClass} />
  }
}

export default function BodyScan() {
  const addToast = useToastStore((s) => s.addToast)
  // State
  const [isTracking, setIsTracking] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string>('shoulder-rotation')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [formAccuracy, setFormAccuracy] = useState(0)
  const [jointAngles, setJointAngles] = useState<JointAngle[]>([])
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackMessage[]>([])
  const [reps, setReps] = useState(0)
  const [holdTime, setHoldTime] = useState(0)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [skeletonPoints, setSkeletonPoints] = useState<Record<string, SkeletonPoint>>(BASE_SKELETON.joints)
  const [feedbackId, setFeedbackId] = useState(0)
  const [currentFeedback, setCurrentFeedback] = useState<string>('Ready to Start')
  const [currentFeedbackType, setCurrentFeedbackType] = useState<FeedbackMessage['type']>('info')
  const [repPulseKey, setRepPulseKey] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [placeholderTick, setPlaceholderTick] = useState(0)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const placeholderCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const skeletonAnimRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const placeholderAnimRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Camera setup
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch {
      setCameraError('Camera access denied or unavailable')
      setCameraActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  // Simulated joint angles based on exercise
  const generateSimulatedAngles = useCallback(
    (exercise: Exercise, tick: number): JointAngle[] => {
      const allJoints: JointAngle[] = [
        { name: 'Left Shoulder', angle: 170, status: 'good' },
        { name: 'Right Shoulder', angle: 168, status: 'good' },
        { name: 'Left Elbow', angle: 165, status: 'good' },
        { name: 'Right Elbow', angle: 170, status: 'good' },
        { name: 'Left Hip', angle: 92, status: 'good' },
        { name: 'Right Hip', angle: 90, status: 'good' },
        { name: 'Left Knee', angle: 95, status: 'good' },
        { name: 'Right Knee', angle: 93, status: 'good' },
      ]

      return allJoints.map((joint) => {
        const target = exercise.targetAngles[joint.name]
        const oscillation = Math.sin(tick * 0.08 + allJoints.indexOf(joint) * 1.2) * 25
        const noise = (Math.random() - 0.5) * 6
        let angle: number

        if (target) {
          const mid = (target.min + target.max) / 2
          const range = (target.max - target.min) / 2
          angle = mid + oscillation * 0.4 + noise
        } else {
          angle = joint.angle + oscillation * 0.6 + noise
        }

        angle = Math.max(0, Math.min(180, angle))

        let status: JointAngle['status'] = 'good'
        if (target) {
          if (angle >= target.min && angle <= target.max) {
            status = 'good'
          } else if (
            angle >= target.min - 15 &&
            angle <= target.max + 15
          ) {
            status = 'caution'
          } else {
            status = 'danger'
          }
        } else {
          if (angle >= 140) status = 'good'
          else if (angle >= 100) status = 'caution'
          else status = 'danger'
        }

        return { ...joint, angle: Math.round(angle), status }
      })
    },
    []
  )

  // Simulated skeleton animation
  const generateSkeletonPoints = useCallback(
    (tick: number): Record<string, SkeletonPoint> => {
      const points = { ...BASE_SKELETON.joints }
      const exerciseId = selectedExercise

      // Deep copy to avoid mutation
      const newPoints: Record<string, SkeletonPoint> = {}
      Object.keys(points).forEach((key) => {
        newPoints[key] = { ...points[key] }
      })

      // Different movement patterns per exercise
      const swayX = Math.sin(tick * 0.06) * 0.02
      const swayY = Math.cos(tick * 0.04) * 0.01

      // Apply base sway
      Object.keys(newPoints).forEach((key) => {
        newPoints[key] = {
          ...newPoints[key],
          x: newPoints[key].x + swayX,
          y: newPoints[key].y + swayY,
        }
      })

      // Exercise-specific movements
      switch (exerciseId) {
        case 'shoulder-rotation': {
          const armSwing = Math.sin(tick * 0.1) * 0.08
          newPoints.leftShoulder = { ...newPoints.leftShoulder, x: newPoints.leftShoulder.x + armSwing }
          newPoints.rightShoulder = { ...newPoints.rightShoulder, x: newPoints.rightShoulder.x - armSwing }
          newPoints.leftElbow = { ...newPoints.leftElbow, y: newPoints.leftElbow.y - Math.abs(armSwing) * 0.5 }
          newPoints.rightElbow = { ...newPoints.rightElbow, y: newPoints.rightElbow.y - Math.abs(armSwing) * 0.5 }
          break
        }
        case 'seated-balance': {
          const leanX = Math.sin(tick * 0.05) * 0.04
          const leanY = Math.sin(tick * 0.07) * 0.02
          newPoints.head = { ...newPoints.head, x: newPoints.head.x + leanX, y: newPoints.head.y + leanY }
          newPoints.neck = { ...newPoints.neck, x: newPoints.neck.x + leanX * 0.8 }
          newPoints.torso = { ...newPoints.torso, x: newPoints.torso.x + leanX * 0.5 }
          break
        }
        case 'arm-extension': {
          const extend = Math.sin(tick * 0.08) * 0.1
          newPoints.leftElbow = { ...newPoints.leftElbow, x: newPoints.leftElbow.x - extend }
          newPoints.rightElbow = { ...newPoints.rightElbow, x: newPoints.rightElbow.x + extend }
          newPoints.leftWrist = { ...newPoints.leftWrist, x: newPoints.leftWrist.x - extend * 1.2, y: newPoints.leftWrist.y + extend * 0.3 }
          newPoints.rightWrist = { ...newPoints.rightWrist, x: newPoints.rightWrist.x + extend * 1.2, y: newPoints.rightWrist.y + extend * 0.3 }
          break
        }
        case 'knee-flexion': {
          const kneeBend = Math.sin(tick * 0.06) * 0.06
          newPoints.leftKnee = { ...newPoints.leftKnee, y: newPoints.leftKnee.y - kneeBend }
          newPoints.rightKnee = { ...newPoints.rightKnee, y: newPoints.rightKnee.y - kneeBend }
          newPoints.leftAnkle = { ...newPoints.leftAnkle, y: newPoints.leftAnkle.y + kneeBend * 0.3 }
          newPoints.rightAnkle = { ...newPoints.rightAnkle, y: newPoints.rightAnkle.y + kneeBend * 0.3 }
          break
        }
        case 'lateral-lean': {
          const leanSide = Math.sin(tick * 0.05) * 0.06
          newPoints.head = { ...newPoints.head, x: newPoints.head.x + leanSide }
          newPoints.neck = { ...newPoints.neck, x: newPoints.neck.x + leanSide * 0.8 }
          newPoints.torso = { ...newPoints.torso, x: newPoints.torso.x + leanSide * 0.5 }
          newPoints.leftShoulder = { ...newPoints.leftShoulder, y: newPoints.leftShoulder.y - Math.abs(leanSide) * 0.3 }
          newPoints.rightShoulder = { ...newPoints.rightShoulder, y: newPoints.rightShoulder.y + Math.abs(leanSide) * 0.3 }
          break
        }
      }

      // Add micro-noise for realism
      Object.keys(newPoints).forEach((key) => {
        newPoints[key] = {
          ...newPoints[key],
          x: newPoints[key].x + (Math.random() - 0.5) * 0.005,
          y: newPoints[key].y + (Math.random() - 0.5) * 0.005,
        }
      })

      return newPoints
    },
    [selectedExercise]
  )

  // Generate feedback
  const generateFeedback = useCallback(
    (accuracy: number): { message: string; type: FeedbackMessage['type'] } => {
      const rand = Math.random()
      if (accuracy >= 80) {
        if (rand < 0.7) return { message: FEEDBACK_POOL.success[Math.floor(Math.random() * FEEDBACK_POOL.success.length)], type: 'success' }
        return { message: FEEDBACK_POOL.info[Math.floor(Math.random() * FEEDBACK_POOL.info.length)], type: 'info' }
      } else if (accuracy >= 50) {
        if (rand < 0.5) return { message: FEEDBACK_POOL.warning[Math.floor(Math.random() * FEEDBACK_POOL.warning.length)], type: 'warning' }
        if (rand < 0.8) return { message: FEEDBACK_POOL.info[Math.floor(Math.random() * FEEDBACK_POOL.info.length)], type: 'info' }
        return { message: FEEDBACK_POOL.success[Math.floor(Math.random() * FEEDBACK_POOL.success.length)], type: 'success' }
      } else {
        if (rand < 0.6) return { message: FEEDBACK_POOL.warning[Math.floor(Math.random() * FEEDBACK_POOL.warning.length)], type: 'warning' }
        if (rand < 0.9) return { message: FEEDBACK_POOL.error[Math.floor(Math.random() * FEEDBACK_POOL.error.length)], type: 'error' }
        return { message: FEEDBACK_POOL.info[Math.floor(Math.random() * FEEDBACK_POOL.info.length)], type: 'info' }
      }
    },
    []
  )

  // Draw skeleton on canvas
  const drawSkeleton = useCallback(
    (points: Record<string, SkeletonPoint>, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Draw connections
      BASE_SKELETON.connections.forEach(([from, to]) => {
        const p1 = points[from]
        const p2 = points[to]
        if (!p1 || !p2) return

        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Glow effect
        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'
        ctx.lineWidth = 6
        ctx.stroke()
      })

      // Draw joints
      Object.entries(points).forEach(([key, point]) => {
        const px = point.x * w
        const py = point.y * h
        const isMajor = ['head', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'].includes(key)

        // Outer glow
        ctx.beginPath()
        ctx.arc(px, py, isMajor ? 8 : 5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'
        ctx.fill()

        // Inner dot
        ctx.beginPath()
        ctx.arc(px, py, isMajor ? 5 : 3, 0, Math.PI * 2)
        ctx.fillStyle = isMajor ? 'rgba(16, 185, 129, 0.9)' : 'rgba(52, 211, 153, 0.7)'
        ctx.fill()

        // Center bright dot
        ctx.beginPath()
        ctx.arc(px, py, isMajor ? 2.5 : 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fill()

        // Label for major joints
        if (point.label && isMajor) {
          ctx.font = '10px Inter, sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.fillText(point.label, px + 10, py + 3)
        }
      })
    },
    []
  )

  // Draw the enhanced placeholder skeleton with grid
  const drawPlaceholderSkeleton = useCallback(
    (tick: number, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height

      // Dark background
      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, w, h)

      // Draw emerald grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Brighter center cross lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w / 2, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // Generate animated skeleton points
      const points = generateSkeletonPoints(tick)

      // Draw connections with neon glow
      BASE_SKELETON.connections.forEach(([from, to]) => {
        const p1 = points[from]
        const p2 = points[to]
        if (!p1 || !p2) return

        // Wide glow
        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)'
        ctx.lineWidth = 10
        ctx.stroke()

        // Medium glow
        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Core line
        ctx.beginPath()
        ctx.moveTo(p1.x * w, p1.y * h)
        ctx.lineTo(p2.x * w, p2.y * h)
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Draw joints with pulsing effect
      const pulseScale = 1 + Math.sin(tick * 0.15) * 0.15
      Object.entries(points).forEach(([key, point]) => {
        const px = point.x * w
        const py = point.y * h
        const isMajor = ['head', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'].includes(key)

        // Outer glow pulse
        const glowRadius = (isMajor ? 14 : 9) * pulseScale
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowRadius)
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
        ctx.beginPath()
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner dot
        ctx.beginPath()
        ctx.arc(px, py, isMajor ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'
        ctx.fill()

        // Bright center
        ctx.beginPath()
        ctx.arc(px, py, isMajor ? 3 : 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fill()

        // Label
        if (point.label && isMajor) {
          ctx.font = '11px Inter, sans-serif'
          ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'
          ctx.fillText(point.label, px + 12, py + 4)
        }
      })

      // Corner decorations
      const cornerSize = 20
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
      ctx.lineWidth = 2
      // Top-left
      ctx.beginPath()
      ctx.moveTo(8, 8 + cornerSize)
      ctx.lineTo(8, 8)
      ctx.lineTo(8 + cornerSize, 8)
      ctx.stroke()
      // Top-right
      ctx.beginPath()
      ctx.moveTo(w - 8 - cornerSize, 8)
      ctx.lineTo(w - 8, 8)
      ctx.lineTo(w - 8, 8 + cornerSize)
      ctx.stroke()
      // Bottom-left
      ctx.beginPath()
      ctx.moveTo(8, h - 8 - cornerSize)
      ctx.lineTo(8, h - 8)
      ctx.lineTo(8 + cornerSize, h - 8)
      ctx.stroke()
      // Bottom-right
      ctx.beginPath()
      ctx.moveTo(w - 8 - cornerSize, h - 8)
      ctx.lineTo(w - 8, h - 8)
      ctx.lineTo(w - 8, h - 8 - cornerSize)
      ctx.stroke()

      // Scan line effect
      const scanY = (tick * 3) % h
      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(w, scanY)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)'
      ctx.lineWidth = 2
      ctx.stroke()
    },
    [generateSkeletonPoints]
  )

  // Tracking tick counter
  const tickRef = useRef(0)

  // Start/stop tracking
  const startTracking = useCallback(() => {
    setIsTracking(true)
    addToast({ type: 'info', title: 'Tracking Started', description: 'Your exercise session has begun' })
    tickRef.current = 0
    setReps(0)
    setHoldTime(0)
    setSessionDuration(0)
    setFeedbackHistory([])
    setHoldProgress(0)

    // Session timer
    sessionTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)

    // Hold time timer (increments when accuracy > 75%)
    holdTimerRef.current = setInterval(() => {
      setFormAccuracy((prev) => {
        if (prev >= 75) {
          setHoldTime((h) => h + 1)
          setHoldProgress((p) => {
            const next = p + (100 / 30) // 30 second hold cycle
            return next >= 100 ? 0 : next
          })
        } else {
          setHoldProgress(0)
        }
        return prev
      })
    }, 1000)

    // Reps increment with pulse
    const repInterval = setInterval(() => {
      setReps((prev) => prev + 1)
      setRepPulseKey((k) => k + 1)
    }, 4000 + Math.random() * 3000)

    // Skeleton animation
    skeletonAnimRef.current = setInterval(() => {
      tickRef.current += 1
      const newPoints = generateSkeletonPoints(tickRef.current)
      setSkeletonPoints(newPoints)

      // Draw on canvas
      if (canvasRef.current) {
        drawSkeleton(newPoints, canvasRef.current)
      }

      // Update angles
      const exercise = EXERCISES.find((e) => e.id === selectedExercise) || EXERCISES[0]
      const angles = generateSimulatedAngles(exercise, tickRef.current)
      setJointAngles(angles)

      // Calculate accuracy
      const targetJoints = angles.filter((a) => exercise.targetAngles[a.name])
      if (targetJoints.length > 0) {
        const goodCount = targetJoints.filter((a) => a.status === 'good').length
        const cautionCount = targetJoints.filter((a) => a.status === 'caution').length
        const accuracy = (goodCount * 100 + cautionCount * 50) / (targetJoints.length * 100) * 100
        const smoothAccuracy = Math.round(accuracy + (Math.random() - 0.5) * 5)
        setFormAccuracy(Math.max(0, Math.min(100, smoothAccuracy)))
      }
    }, 100)

    // Feedback generation
    feedbackTimerRef.current = setInterval(() => {
      setFormAccuracy((currentAccuracy) => {
        const fb = generateFeedback(currentAccuracy)
        setCurrentFeedback(fb.message)
        setCurrentFeedbackType(fb.type)
        setFeedbackId((prev) => {
          const newId = prev + 1
          setFeedbackHistory((hist) => [
            { id: newId, message: fb.message, type: fb.type, timestamp: new Date() },
            ...hist.slice(0, 19),
          ])
          return newId
        })
        return currentAccuracy
      })
    }, 2500)

    // Store rep interval for cleanup
    return () => clearInterval(repInterval)
  }, [selectedExercise, generateSkeletonPoints, generateSimulatedAngles, generateFeedback, drawSkeleton, addToast])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    addToast({ type: 'success', title: 'Session Complete', description: `You completed ${reps} reps!` })
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
    if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    if (feedbackTimerRef.current) clearInterval(feedbackTimerRef.current)
    if (skeletonAnimRef.current) clearInterval(skeletonAnimRef.current)
  }, [reps, addToast])

  const resetSession = useCallback(() => {
    stopTracking()
    setReps(0)
    setHoldTime(0)
    setSessionDuration(0)
    setFormAccuracy(0)
    setFeedbackHistory([])
    setCurrentFeedback('Ready to Start')
    setCurrentFeedbackType('info')
    setJointAngles([])
    setSkeletonPoints(BASE_SKELETON.joints)
    setHoldProgress(0)
    setRepPulseKey(0)
    tickRef.current = 0

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [stopTracking])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
      stopCamera()
    }
  }, [stopTracking, stopCamera])

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          canvasRef.current.width = container.clientWidth
          canvasRef.current.height = container.clientHeight
        }
      }
      if (placeholderCanvasRef.current) {
        const container = placeholderCanvasRef.current.parentElement
        if (container) {
          placeholderCanvasRef.current.width = container.clientWidth
          placeholderCanvasRef.current.height = container.clientHeight
        }
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Draw initial skeleton if not tracking
  useEffect(() => {
    if (!isTracking && canvasRef.current) {
      drawSkeleton(BASE_SKELETON.joints, canvasRef.current)
    }
  }, [isTracking, drawSkeleton])

  // Animate placeholder canvas when camera is off
  useEffect(() => {
    if (!cameraActive) {
      let placeholderTick = 0
      placeholderAnimRef.current = setInterval(() => {
        placeholderTick += 1
        setPlaceholderTick(placeholderTick)
        if (placeholderCanvasRef.current) {
          drawPlaceholderSkeleton(placeholderTick, placeholderCanvasRef.current)
        }
      }, 50)
      return () => {
        if (placeholderAnimRef.current) clearInterval(placeholderAnimRef.current)
      }
    } else {
      if (placeholderAnimRef.current) clearInterval(placeholderAnimRef.current)
    }
  }, [cameraActive, drawPlaceholderSkeleton])

  const currentExercise = EXERCISES.find((e) => e.id === selectedExercise) || EXERCISES[0]

  // Get directional feedback info
  const directionalInfo = DIRECTIONAL_FEEDBACK[currentFeedback] || {
    text: currentFeedback,
    arrow: 'none' as const,
    color: currentFeedbackType === 'success' ? 'green' as const : currentFeedbackType === 'warning' ? 'yellow' as const : currentFeedbackType === 'error' ? 'red' as const : 'green' as const,
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with session timer */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <img
            src="/images/body-scan.png"
            alt="Body Scan Technology"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        </div>
        <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10">
              <Camera className="size-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Body Scan & Motion Tracking</h2>
              <p className="text-sm text-muted-foreground">Real-time pose analysis and form feedback</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Session Timer - Prominent */}
            <motion.div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                isTracking
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-muted/50 border-border/50'
              }`}
              animate={isTracking ? { boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 12px rgba(16,185,129,0.3)', '0 0 0px rgba(16,185,129,0)'] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Timer className={`size-4 ${isTracking ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <span className={`text-lg font-mono font-bold tabular-nums ${isTracking ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {formatTime(sessionDuration)}
              </span>
              {isTracking && (
                <motion.span
                  className="size-2 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>

            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Exercise" />
              </SelectTrigger>
              <SelectContent>
                {EXERCISES.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={resetSession}
              title="Reset Session"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout: Camera (2/3) + Feedback (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Camera View - 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  Camera Feed
                  {isTracking && (
                    <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <motion.span
                        className="inline-block size-2 rounded-full bg-emerald-500 mr-1.5"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      LIVE
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!cameraActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="gap-1.5"
                    >
                      <Camera className="size-3.5" />
                      Enable Camera
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopCamera}
                      className="gap-1.5"
                    >
                      <Camera className="size-3.5" />
                      Disable
                    </Button>
                  )}
                  {!isTracking ? (
                    <Button
                      size="sm"
                      onClick={startTracking}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Play className="size-3.5" />
                      Start Tracking
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopTracking}
                      className="gap-1.5"
                    >
                      <Pause className="size-3.5" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {/* Camera container */}
              <div
                className={`relative w-full aspect-[4/3] bg-black/90 rounded-xl overflow-hidden ${
                  isTracking ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20' : 'ring-1 ring-border'
                } transition-all duration-500`}
              >
                {/* Real-time feedback bar at top */}
                {isTracking && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 z-20"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`flex items-center justify-center gap-3 px-4 py-2.5 ${
                      directionalInfo.color === 'green' ? 'bg-emerald-500/20 border-b border-emerald-500/30' :
                      directionalInfo.color === 'yellow' ? 'bg-amber-500/20 border-b border-amber-500/30' :
                      'bg-red-500/20 border-b border-red-500/30'
                    }`}>
                      <DirectionalArrow direction={directionalInfo.arrow} color={directionalInfo.color} />
                      <span className={`text-base font-bold ${
                        directionalInfo.color === 'green' ? 'text-emerald-400' :
                        directionalInfo.color === 'yellow' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {directionalInfo.text}
                      </span>
                      {directionalInfo.arrow === 'left' && <ArrowLeft className={`size-5 ${directionalInfo.color === 'yellow' ? 'text-amber-400' : 'text-red-400'} animate-pulse`} />}
                      {directionalInfo.arrow === 'right' && <ArrowRight className={`size-5 ${directionalInfo.color === 'yellow' ? 'text-amber-400' : 'text-red-400'} animate-pulse`} />}
                    </div>
                  </motion.div>
                )}

                {/* Video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    cameraActive ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Enhanced placeholder when no camera - animated skeleton visualization */}
                {!cameraActive && (
                  <div className="absolute inset-0">
                    <canvas
                      ref={placeholderCanvasRef}
                      className="w-full h-full"
                    />
                    {/* Activate Camera overlay button with glow */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <motion.button
                        onClick={startCamera}
                        className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-semibold backdrop-blur-sm cursor-pointer"
                        animate={{
                          boxShadow: [
                            '0 0 10px rgba(16,185,129,0.2), 0 0 20px rgba(16,185,129,0.1)',
                            '0 0 20px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.2)',
                            '0 0 10px rgba(16,185,129,0.2), 0 0 20px rgba(16,185,129,0.1)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(16,185,129,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="size-5" />
                        Activate Camera
                      </motion.button>
                      <p className="text-zinc-500 text-xs mt-3">
                        {cameraError || 'Motion tracking overlay will appear here'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Canvas overlay for skeleton (when camera is on) */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Pulsing LIVE indicator when tracking is active */}
                {isTracking && (
                  <motion.div
                    className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/80 backdrop-blur-sm"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <span className="size-2 rounded-full bg-red-400 animate-ping" />
                    <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
                  </motion.div>
                )}

                {/* Exercise info overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <p className="text-white text-xs font-medium">{currentExercise.name}</p>
                    <p className="text-white/60 text-[10px]">{currentExercise.description}</p>
                  </div>
                  {isTracking && !(
                    <motion.div
                      className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <Target className="size-3" />
                        Tracking
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Hold progress bar at bottom when tracking */}
                {isTracking && (
                  <div className="absolute bottom-14 left-3 right-3 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/60 shrink-0">Hold</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-emerald-500"
                          animate={{ width: `${holdProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] text-emerald-400 shrink-0">{formatTime(holdTime)}</span>
                    </div>
                  </div>
                )}

                {/* Bottom feedback overlay */}
                {isTracking && (
                  <motion.div
                    className="absolute bottom-3 left-3 right-3 z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentFeedback}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className={`text-sm font-semibold ${
                            currentFeedbackType === 'success'
                              ? 'text-emerald-400'
                              : currentFeedbackType === 'warning'
                              ? 'text-amber-400'
                              : currentFeedbackType === 'error'
                              ? 'text-red-400'
                              : 'text-sky-400'
                          }`}
                        >
                          {currentFeedback}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exercise Quick Select - Circular buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CircleDot className="size-4 text-emerald-500" />
                Quick Select Exercise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <TooltipProvider>
                  {EXERCISES.map((exercise) => {
                    const isActive = selectedExercise === exercise.id
                    return (
                      <Tooltip key={exercise.id}>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={() => setSelectedExercise(exercise.id)}
                            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-colors cursor-pointer ${
                              isActive
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-emerald-500/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {/* Glow ring when active */}
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                                animate={{
                                  boxShadow: [
                                    '0 0 5px rgba(16,185,129,0.3)',
                                    '0 0 15px rgba(16,185,129,0.5)',
                                    '0 0 5px rgba(16,185,129,0.3)',
                                  ],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                            <div className={`size-10 rounded-full flex items-center justify-center ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-muted/50 text-muted-foreground'
                            }`}>
                              {exercise.icon}
                            </div>
                            <span className={`text-[10px] font-medium leading-tight text-center max-w-[70px] ${
                              isActive ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}>
                              {exercise.name}
                            </span>
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{exercise.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>

          {/* Joint Angles + Joint Health Diagram side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Joint Angles Display */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  Joint Angles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jointAngles.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Start tracking to view joint angle data
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {jointAngles.map((joint) => (
                      <motion.div
                        key={joint.name}
                        className="relative flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 border border-border/50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div
                          className={`size-3 rounded-full ${getAngleDotColor(joint.status)} shadow-md ${getAngleGlow(joint.status)}`}
                        />
                        <span className="text-[11px] text-muted-foreground text-center leading-tight">
                          {joint.name}
                        </span>
                        <span className={`text-lg font-bold ${getAngleColor(joint.status)}`}>
                          {joint.angle}°
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            joint.status === 'good'
                              ? 'border-emerald-500/30 text-emerald-600'
                              : joint.status === 'caution'
                              ? 'border-amber-500/30 text-amber-600'
                              : 'border-red-500/30 text-red-600'
                          }`}
                        >
                          {joint.status === 'good' ? 'Good' : joint.status === 'caution' ? 'Caution' : 'Danger'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Joint Health Diagram */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="size-4 text-emerald-500" />
                  Joint Health Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jointAngles.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Start tracking to view joint health
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <JointHealthDiagram jointAngles={jointAngles} />
                    <div className="w-full space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Good — Within target range</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="size-2.5 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Caution — Slightly off range</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="size-2.5 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Danger — Outside safe range</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Panel - 1/3 */}
        <div className="space-y-4">
          {/* Form Accuracy */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4 text-emerald-500" />
                Form Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-4">
              <CircularProgress value={formAccuracy} size={160} strokeWidth={12} />
              <div className="mt-3 w-full space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Good (80-100%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Caution (50-79%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Danger (0-49%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Stats with enhanced rep counter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="size-4 text-emerald-500" />
                Session Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Large Rep Counter */}
              <RepCounter reps={reps} pulseKey={repPulseKey} />

              {/* Other stats */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <AnimatedCounter value={holdTime} label="Hold Time" format={formatTime} />
                <AnimatedCounter value={sessionDuration} label="Duration" format={formatTime} />
              </div>

              {/* Progress bars */}
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Rep Progress</span>
                    <span>{Math.min(reps * 10, 100)}%</span>
                  </div>
                  <Progress value={Math.min(reps * 10, 100)} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Hold Time</span>
                    <span>{Math.min(holdTime * 2, 100)}%</span>
                  </div>
                  <Progress value={Math.min(holdTime * 2, 100)} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Session</span>
                    <span>{Math.min((sessionDuration / 300) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min((sessionDuration / 300) * 100, 100)} className="h-1.5" />
                </div>
              </div>

              {/* Current exercise info */}
              <div className="mt-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Target className="size-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">{currentExercise.name}</span>
                  </div>
                  <TTSSpeaker
                    text={`${currentExercise.name}. ${currentExercise.description}`}
                    size="sm"
                    voice="xiaochen"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{currentExercise.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.keys(currentExercise.targetAngles).map((joint) => (
                    <Badge
                      key={joint}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-emerald-500/20 text-emerald-600"
                    >
                      {joint}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                Feedback History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Start tracking to see feedback
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-2">
                    <AnimatePresence initial={false}>
                      {feedbackHistory.map((fb) => (
                        <motion.div
                          key={fb.id}
                          initial={{ opacity: 0, x: 20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex items-start gap-2 p-2 rounded-lg border ${
                            fb.type === 'success'
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : fb.type === 'warning'
                              ? 'border-amber-500/20 bg-amber-500/5'
                              : fb.type === 'error'
                              ? 'border-red-500/20 bg-red-500/5'
                              : 'border-sky-500/20 bg-sky-500/5'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{getFeedbackIcon(fb.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight">{fb.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {fb.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                          </div>
                          <TTSSpeaker
                            text={fb.message}
                            size="sm"
                            voice="xiaochen"
                            speed={1.1}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
