'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Activity,
  Watch,
  Smartphone,
  Bluetooth,
  BluetoothOff,
  AlertTriangle,
  Battery,
  Zap,
  TrendingUp,
  Droplets,
  Thermometer,
  Shield,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { heartRateData } from '@/lib/mock-data';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  battery: number;
  pairing: boolean;
}

interface HRZone {
  name: string;
  color: string;
  min: number;
  max: number;
  bgColor: string;
  glowColor: string;
}

interface AlertConfig {
  id: string;
  label: string;
  enabled: boolean;
  threshold: number;
  min: number;
  max: number;
  unit: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HR_ZONES: HRZone[] = [
  { name: 'Resting', color: 'text-emerald-400', min: 0, max: 80, bgColor: 'bg-emerald-500', glowColor: 'shadow-emerald-500/50' },
  { name: 'Light', color: 'text-cyan-400', min: 80, max: 110, bgColor: 'bg-cyan-500', glowColor: 'shadow-cyan-500/50' },
  { name: 'Moderate', color: 'text-amber-400', min: 110, max: 135, bgColor: 'bg-amber-500', glowColor: 'shadow-amber-500/50' },
  { name: 'Vigorous', color: 'text-orange-400', min: 135, max: 165, bgColor: 'bg-orange-500', glowColor: 'shadow-orange-500/50' },
  { name: 'Peak', color: 'text-red-400', min: 165, max: 220, bgColor: 'bg-red-500', glowColor: 'shadow-red-500/50' },
];

const INITIAL_DEVICES: Device[] = [
  { id: 'apple-watch', name: 'Apple Watch', icon: <Watch className="size-5" />, connected: true, battery: 78, pairing: false },
  { id: 'fitbit', name: 'Fitbit', icon: <Activity className="size-5" />, connected: false, battery: 45, pairing: false },
  { id: 'garmin', name: 'Garmin', icon: <Watch className="size-5" />, connected: false, battery: 62, pairing: false },
  { id: 'manual', name: 'Manual Input', icon: <Smartphone className="size-5" />, connected: true, battery: 100, pairing: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getZoneForBPM(bpm: number): HRZone {
  return HR_ZONES.find(z => bpm >= z.min && bpm < z.max) || HR_ZONES[HR_ZONES.length - 1];
}

function getSpO2Color(spo2: number): { text: string; bg: string; glow: string } {
  if (spo2 >= 95) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', glow: 'shadow-emerald-500/40' };
  if (spo2 >= 90) return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', glow: 'shadow-yellow-500/40' };
  return { text: 'text-red-400', bg: 'bg-red-500/20', glow: 'shadow-red-500/40' };
}

function getBPStatus(sys: number, dia: number): { label: string; color: string } {
  if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-400' };
  if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-yellow-400' };
  if (sys < 140 || dia < 90) return { label: 'High Stage 1', color: 'text-orange-400' };
  return { label: 'High Stage 2', color: 'text-red-400' };
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function DeviceConnectionPanel({
  devices,
  onToggleConnect,
}: {
  devices: Device[];
  onToggleConnect: (id: string) => void;
}) {
  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Bluetooth className="size-5 text-cyan-400" />
          Device Connection
        </CardTitle>
        <CardDescription className="text-slate-400">
          Connect your wearable devices for real-time monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map(device => (
            <motion.div
              key={device.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-3 rounded-lg border p-3 transition-all ${
                device.connected
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-700/50 bg-slate-800/50'
              }`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${
                  device.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                }`}
              >
                {device.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">{device.name}</span>
                  {device.connected && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Battery
                    className={`size-3 ${
                      device.battery > 50
                        ? 'text-emerald-400'
                        : device.battery > 20
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  />
                  <span className="text-xs text-slate-500">{device.battery}%</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={device.connected ? 'outline' : 'default'}
                onClick={() => onToggleConnect(device.id)}
                disabled={device.pairing}
                className={`text-xs ${
                  device.connected
                    ? 'border-slate-600 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {device.pairing ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Bluetooth className="size-3.5" />
                  </motion.span>
                ) : device.connected ? (
                  'Disconnect'
                ) : (
                  <>
                    <Bluetooth className="size-3.5 mr-1" />
                    Pair
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveHeartRateDisplay({ bpm, zone }: { bpm: number; zone: HRZone }) {
  // Calculate pulse animation duration based on BPM
  const pulseDuration = 60 / bpm;

  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden relative">
      {/* Animated background glow */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            zone.name === 'Resting'
              ? '#10b981'
              : zone.name === 'Light'
                ? '#06b6d4'
                : zone.name === 'Moderate'
                  ? '#f59e0b'
                  : zone.name === 'Vigorous'
                    ? '#f97316'
                    : '#ef4444'
          } 0%, transparent 70%)`,
        }}
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Activity className="size-5 text-red-400" />
          Live Heart Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-col items-center justify-center py-6">
        <div className="flex items-center gap-4">
          {/* Pulsing heart icon */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Heart className={`size-12 ${zone.color} fill-current drop-shadow-lg`} style={{
              filter: `drop-shadow(0 0 12px ${
                zone.name === 'Resting'
                  ? '#10b981'
                  : zone.name === 'Light'
                    ? '#06b6d4'
                    : zone.name === 'Moderate'
                      ? '#f59e0b'
                      : zone.name === 'Vigorous'
                        ? '#f97316'
                        : '#ef4444'
              })`,
            }} />
          </motion.div>

          {/* BPM number */}
          <div className="flex items-baseline gap-1">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={bpm}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`text-6xl font-bold tabular-nums ${zone.color}`}
                style={{
                  textShadow: `0 0 20px ${
                    zone.name === 'Resting'
                      ? '#10b98180'
                      : zone.name === 'Light'
                        ? '#06b6d480'
                        : zone.name === 'Moderate'
                          ? '#f59e0b80'
                          : zone.name === 'Vigorous'
                            ? '#f9731680'
                            : '#ef444480'
                  }`,
                }}
              >
                {bpm}
              </motion.span>
            </AnimatePresence>
            <span className="text-lg font-medium text-slate-400">BPM</span>
          </div>
        </div>

        {/* Zone indicator */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2"
        >
          <Badge
            variant="outline"
            className={`${zone.color} border-current/30 ${zone.bgColor} px-3 py-1 text-sm font-semibold`}
          >
            {zone.name} Zone
          </Badge>
          <span className="text-xs text-slate-500">
            {zone.min}–{zone.max} BPM
          </span>
        </motion.div>

        {/* Zone bar */}
        <div className="mt-4 w-full max-w-xs">
          <div className="flex h-2 overflow-hidden rounded-full">
            {HR_ZONES.map(z => {
              const width = ((z.max - z.min) / (HR_ZONES[HR_ZONES.length - 1].max - HR_ZONES[0].min)) * 100;
              const isActive = z.name === zone.name;
              return (
                <div
                  key={z.name}
                  className={`${z.bgColor} transition-opacity duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeartRateChart({ data }: { data: { time: string; bpm: number }[] }) {
  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <TrendingUp className="size-5 text-cyan-400" />
          Heart Rate Over Time
        </CardTitle>
        <CardDescription className="text-slate-400">Real-time heart rate monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
              <YAxis domain={[50, 180]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: number) => [`${value} BPM`, 'Heart Rate']}
              />
              <Area
                type="monotone"
                dataKey="bpm"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#hrGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#0e7490', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function BloodOxygenDisplay({ spo2 }: { spo2: number }) {
  const colors = getSpO2Color(spo2);

  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-slate-300">
          <Droplets className="size-4 text-cyan-400" />
          Blood Oxygen (SpO2)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-3 py-2">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`flex size-16 items-center justify-center rounded-2xl ${colors.bg} shadow-lg ${colors.glow}`}
          >
            <Droplets className={`size-7 ${colors.text}`} />
          </motion.div>
          <div>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={spo2}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -5, opacity: 0 }}
                className={`text-4xl font-bold tabular-nums ${colors.text}`}
              >
                {spo2}
              </motion.span>
            </AnimatePresence>
            <span className="text-lg text-slate-400">%</span>
            <div className="mt-0.5">
              <Badge variant="outline" className={`${colors.text} border-current/30 text-xs`}>
                {spo2 >= 95 ? 'Normal' : spo2 >= 90 ? 'Low' : 'Critical'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={spo2}
            className="h-2"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>90%</span>
            <span>95%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BloodPressureDisplay({ systolic, diastolic }: { systolic: number; diastolic: number }) {
  const status = getBPStatus(systolic, diastolic);

  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-slate-300">
          <Thermometer className="size-4 text-rose-400" />
          Blood Pressure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-1 py-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={systolic}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              className="text-4xl font-bold tabular-nums text-slate-100"
            >
              {systolic}
            </motion.span>
          </AnimatePresence>
          <span className="text-2xl text-slate-500">/</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={diastolic}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              className="text-3xl font-bold tabular-nums text-slate-300"
            >
              {diastolic}
            </motion.span>
          </AnimatePresence>
          <span className="ml-1 text-sm text-slate-500">mmHg</span>
        </div>
        <div className="mt-2 flex items-center justify-center">
          <Badge variant="outline" className={`${status.color} border-current/30`}>
            {status.label}
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-slate-800/50 p-2">
            <div className="text-xs text-slate-500">Systolic</div>
            <div className="text-sm font-semibold text-slate-200">{systolic}</div>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-2">
            <div className="text-xs text-slate-500">Diastolic</div>
            <div className="text-sm font-semibold text-slate-200">{diastolic}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthMetricsSummary({
  avgRestingHR,
  maxHR,
  zoneTimes,
  recoveryTime,
  stressLevel,
}: {
  avgRestingHR: number;
  maxHR: number;
  zoneTimes: { zone: string; minutes: number; color: string }[];
  recoveryTime: number;
  stressLevel: number;
}) {
  const stressLabel = stressLevel < 30 ? 'Low' : stressLevel < 60 ? 'Moderate' : stressLevel < 80 ? 'High' : 'Very High';
  const stressColor =
    stressLevel < 30
      ? 'text-emerald-400'
      : stressLevel < 60
        ? 'text-yellow-400'
        : stressLevel < 80
          ? 'text-orange-400'
          : 'text-red-400';

  const metrics = [
    {
      label: 'Avg Resting HR',
      value: avgRestingHR,
      unit: 'BPM',
      icon: <Heart className="size-4 text-emerald-400" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Max HR Today',
      value: maxHR,
      unit: 'BPM',
      icon: <Zap className="size-4 text-red-400" />,
      color: 'text-red-400',
    },
    {
      label: 'Recovery Time',
      value: recoveryTime,
      unit: 'hrs',
      icon: <Battery className="size-4 text-cyan-400" />,
      color: 'text-cyan-400',
    },
    {
      label: 'Stress Level',
      value: stressLevel,
      unit: '% ' + stressLabel,
      icon: <AlertTriangle className={`size-4 ${stressColor}`} />,
      color: stressColor,
    },
  ];

  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Activity className="size-5 text-amber-400" />
          Health Metrics Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(m => (
            <div
              key={m.label}
              className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {m.icon}
                <span className="text-xs text-slate-400">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={m.value}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    className={`text-2xl font-bold tabular-nums ${m.color}`}
                  >
                    {m.value}
                  </motion.span>
                </AnimatePresence>
                <span className="text-xs text-slate-500">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Zone time breakdown */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-slate-400">Time in Heart Rate Zones</div>
          {zoneTimes.map(z => (
            <div key={z.zone} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${z.color}`} />
              <span className="text-xs text-slate-400 w-20">{z.zone}</span>
              <div className="flex-1">
                <Progress
                  value={(z.minutes / 120) * 100}
                  className="h-1.5"
                />
              </div>
              <span className="text-xs text-slate-300 tabular-nums w-12 text-right">{z.minutes}min</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityZones({ zoneTimes }: { zoneTimes: { zone: string; minutes: number; color: string; barColor: string }[] }) {
  const chartData = [
    {
      name: 'Today',
      ...Object.fromEntries(zoneTimes.map(z => [z.zone, z.minutes])),
    },
  ];

  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Zap className="size-5 text-orange-400" />
          Activity Zones
        </CardTitle>
        <CardDescription className="text-slate-400">Time spent in each heart rate zone</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                }}
                formatter={(value: number, name: string) => [`${value} min`, name]}
              />
              {zoneTimes.map(z => (
                <Bar key={z.zone} dataKey={z.zone} stackId="a" fill={z.barColor} radius={0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visual stacked bar */}
        <div className="mt-4">
          <div className="flex h-6 overflow-hidden rounded-full">
            {zoneTimes.map(z => {
              const total = zoneTimes.reduce((s, zt) => s + zt.minutes, 0);
              const pct = (z.minutes / total) * 100;
              return (
                <div
                  key={z.zone}
                  className={`${z.barColor} transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 12 && <span className="text-[10px] font-medium text-white/90">{Math.round(pct)}%</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {zoneTimes.map(z => (
              <div key={z.zone} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${z.barColor}`} />
                <span className="text-xs text-slate-400">{z.zone}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsSettings({
  alerts,
  onToggleAlert,
  onThresholdChange,
}: {
  alerts: AlertConfig[];
  onToggleAlert: (id: string) => void;
  onThresholdChange: (id: string, value: number) => void;
}) {
  return (
    <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <AlertTriangle className="size-5 text-yellow-400" />
          Alert Settings
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure heart rate alert thresholds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 transition-colors ${
                alert.enabled
                  ? 'border-slate-600/50 bg-slate-800/50'
                  : 'border-slate-700/30 bg-slate-800/20 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`size-4 ${
                      alert.enabled ? 'text-yellow-400' : 'text-slate-600'
                    }`}
                  />
                  <span className="text-sm font-medium text-slate-200">{alert.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={`${alert.id}-${alert.threshold}`}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -5, opacity: 0 }}
                      className="text-sm font-semibold tabular-nums text-slate-300"
                    >
                      {alert.threshold} {alert.unit}
                    </motion.span>
                  </AnimatePresence>
                  <Switch checked={alert.enabled} onCheckedChange={() => onToggleAlert(alert.id)} />
                </div>
              </div>
              <Slider
                value={[alert.threshold]}
                min={alert.min}
                max={alert.max}
                step={1}
                onValueChange={([val]) => onThresholdChange(alert.id, val)}
                disabled={!alert.enabled}
                className="mt-1"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-600">
                <span>{alert.min} {alert.unit}</span>
                <span>{alert.max} {alert.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Active alerts preview */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium text-slate-400">Active Alerts</div>
          {alerts.filter(a => a.enabled).length === 0 ? (
            <div className="text-xs text-slate-600 italic">No active alerts configured</div>
          ) : (
            alerts
              .filter(a => a.enabled)
              .map(a => (
                <Alert key={a.id} className="border-yellow-500/20 bg-yellow-500/5 py-2">
                  <AlertTriangle className="size-4 text-yellow-400" />
                  <AlertDescription className="text-xs text-yellow-200">
                    Alert when {a.label.toLowerCase()} exceeds {a.threshold} {a.unit}
                  </AlertDescription>
                </Alert>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Wearable() {
  // Device state
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  // Live metrics state
  const [currentBPM, setCurrentBPM] = useState(78);
  const [spo2, setSpo2] = useState(97);
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(76);

  // Chart data - initialize with mock data and append live data
  const [chartData, setChartData] = useState<{ time: string; bpm: number }[]>(
    heartRateData.map(d => ({ time: d.time, bpm: d.bpm }))
  );

  // Health metrics
  const [avgRestingHR] = useState(68);
  const [maxHRToday] = useState(145);
  const [recoveryTime] = useState(4.5);
  const [stressLevel, setStressLevel] = useState(35);

  const [zoneTimes] = useState([
    { zone: 'Resting', minutes: 45, color: 'bg-emerald-500', barColor: '#10b981' },
    { zone: 'Light', minutes: 30, color: 'bg-cyan-500', barColor: '#06b6d4' },
    { zone: 'Moderate', minutes: 25, color: 'bg-amber-500', barColor: '#f59e0b' },
    { zone: 'Vigorous', minutes: 15, color: 'bg-orange-500', barColor: '#f97316' },
    { zone: 'Peak', minutes: 5, color: 'bg-red-500', barColor: '#ef4444' },
  ]);

  // Alert configurations
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: 'high-hr', label: 'High Heart Rate', enabled: true, threshold: 160, min: 100, max: 220, unit: 'BPM' },
    { id: 'low-hr', label: 'Low Heart Rate', enabled: true, threshold: 50, min: 30, max: 80, unit: 'BPM' },
    { id: 'low-spo2', label: 'Low SpO2', enabled: true, threshold: 92, min: 80, max: 100, unit: '%' },
    { id: 'high-bp', label: 'High Blood Pressure', enabled: false, threshold: 140, min: 100, max: 200, unit: 'mmHg' },
  ]);

  // Time counter for chart labels
  const timeCounter = useRef(0);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate BPM fluctuation
      const baseBPM = 78;
      const variation = Math.sin(Date.now() / 10000) * 30 + Math.random() * 20 - 10;
      const newBPM = Math.round(Math.max(55, Math.min(180, baseBPM + variation)));
      setCurrentBPM(newBPM);

      // Simulate SpO2 fluctuation
      setSpo2(prev => {
        const delta = Math.random() * 2 - 1;
        return Math.round(Math.max(88, Math.min(100, prev + delta)));
      });

      // Simulate BP fluctuation
      setSystolic(prev => {
        const delta = Math.round(Math.random() * 4 - 2);
        return Math.max(90, Math.min(180, prev + delta));
      });
      setDiastolic(prev => {
        const delta = Math.round(Math.random() * 3 - 1.5);
        return Math.max(60, Math.min(120, prev + delta));
      });

      // Simulate stress level
      setStressLevel(prev => {
        const delta = Math.random() * 6 - 3;
        return Math.round(Math.max(5, Math.min(95, prev + delta)));
      });

      // Add data point to chart
      timeCounter.current += 1;
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      setChartData(prev => {
        const newData = [...prev, { time: timeLabel, bpm: newBPM }];
        // Keep last 20 data points
        return newData.slice(-20);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Device toggle handler
  const handleToggleConnect = useCallback((id: string) => {
    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        if (d.connected) {
          return { ...d, connected: false };
        }
        // Simulate pairing process
        return { ...d, pairing: true };
      })
    );

    // Simulate pairing delay
    const device = devices.find(d => d.id === id);
    if (device && !device.connected) {
      setTimeout(() => {
        setDevices(prev =>
          prev.map(d => (d.id === id ? { ...d, pairing: false, connected: true } : d))
        );
      }, 2000);
    }
  }, [devices]);

  const handleToggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }, []);

  const handleThresholdChange = useCallback((id: string, value: number) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, threshold: value } : a)));
  }, []);

  const currentZone = getZoneForBPM(currentBPM);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Watch className="size-6 text-cyan-400" />
            Smart Wearable Integration
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time health monitoring from your connected devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            <span className="relative flex size-2 mr-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {devices.filter(d => d.connected).length} Device{devices.filter(d => d.connected).length !== 1 ? 's' : ''} Connected
          </Badge>
        </div>
      </div>

      {/* Illustration */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/80">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-transparent z-10" />
        <img
          src="/images/wearable.png"
          alt="Wearable device integration illustration"
          className="w-full h-48 object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 z-20 flex items-center px-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Connected Health Monitoring</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Sync your smartwatch or fitness tracker to get real-time heart rate, blood oxygen, and blood pressure data during workouts.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Bluetooth className="size-3.5 text-cyan-400" />
                BLE Connected
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="size-3.5 text-amber-400" />
                Real-time Sync
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Shield className="size-3.5 text-emerald-400" />
                HIPAA Compliant
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for organizing content */}
      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
            <Activity className="size-4 mr-1" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="devices" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
            <Watch className="size-4 mr-1" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
            <TrendingUp className="size-4 mr-1" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
            <AlertTriangle className="size-4 mr-1" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Heart Rate */}
            <LiveHeartRateDisplay bpm={currentBPM} zone={currentZone} />

            {/* Heart Rate Chart */}
            <HeartRateChart data={chartData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Oxygen */}
            <BloodOxygenDisplay spo2={spo2} />

            {/* Blood Pressure */}
            <BloodPressureDisplay systolic={systolic} diastolic={diastolic} />
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="mt-4">
          <DeviceConnectionPanel devices={devices} onToggleConnect={handleToggleConnect} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Metrics Summary */}
            <HealthMetricsSummary
              avgRestingHR={avgRestingHR}
              maxHR={maxHRToday}
              zoneTimes={zoneTimes}
              recoveryTime={recoveryTime}
              stressLevel={stressLevel}
            />

            {/* Activity Zones */}
            <ActivityZones zoneTimes={zoneTimes} />
          </div>

          {/* Full-width heart rate chart */}
          <HeartRateChart data={chartData} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <AlertsSettings
            alerts={alerts}
            onToggleAlert={handleToggleAlert}
            onThresholdChange={handleThresholdChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
