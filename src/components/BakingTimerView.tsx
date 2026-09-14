import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Bell,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { playBakeChime, triggerHaptic } from '../utils/timerAudio';

export interface BakingTimerViewProps {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  label: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetTime: (seconds: number, label?: string) => void;
  onAddSeconds: (seconds: number) => void;
  isFinished: boolean;
  onDismissFinished: () => void;
}

const PRESETS = [
  { label: 'Cookies', minutes: 10, category: 'Cookies', desc: 'Golden edges, soft center' },
  { label: 'Pastry / Muffins', minutes: 18, category: 'Pastry', desc: 'Flaky & puffed' },
  { label: 'Cake Layers', minutes: 25, category: 'Cake', desc: 'Toothpick comes out clean' },
  { label: 'Sourdough (Lidded)', minutes: 25, category: 'Bread', desc: 'Dutch oven steam phase' },
  { label: 'Bread (Uncovered)', minutes: 20, category: 'Bread', desc: 'Deep golden crust phase' },
  { label: 'Pie Crust (Blind)', minutes: 15, category: 'Pies', desc: 'Crisp bottom crust' },
  { label: 'Dough Proofing', minutes: 45, category: 'Proof', desc: 'Risen to double in bulk' },
];

const BAKER_TIPS = [
  'Do not open the oven door during the first 15 minutes of baking bread—it lets critical steam escape!',
  'Cookies continue to bake on the hot metal tray for 2–3 minutes after coming out of the oven.',
  'Rotate your baking sheet 180° halfway through baking for even browning across all cookies.',
  'Cakes are done when the center springs back lightly to a gentle touch and begins pulling away from the pan edges.',
  'Let artisan bread cool completely for at least 1 hour before slicing so the internal crumb sets.',
];

export const BakingTimerView: React.FC<BakingTimerViewProps> = ({
  totalSeconds,
  remainingSeconds,
  isRunning,
  label,
  onStart,
  onPause,
  onReset,
  onSetTime,
  onAddSeconds,
  isFinished,
  onDismissFinished,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tipIndex, setTipIndex] = useState<number>(0);

  // Rotate baker tips periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % BAKER_TIPS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress calculation
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleTogglePlay = () => {
    triggerHaptic(12);
    if (isRunning) {
      onPause();
    } else {
      if (isFinished) {
        onDismissFinished();
        onReset();
      }
      onStart();
    }
  };

  const handleTestChime = () => {
    triggerHaptic(20);
    playBakeChime();
  };

  return (
    <div className="p-4 space-y-6 pb-28 text-[#2E2520]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-[#C26343] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Oven Alarms
          </span>
          <h2 className="font-serif-display text-2xl font-bold text-[#2E2520] tracking-tight">
            Kitchen Bake Timer
          </h2>
        </div>

        {/* Sound toggle button */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            triggerHaptic(10);
          }}
          className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold ${
            soundEnabled
              ? 'bg-[#FAF5EE] border-[#C26343]/40 text-[#C26343]'
              : 'bg-white border-[#D9CFC7] text-[#8C7A70]'
          }`}
          title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[10px]">{soundEnabled ? 'Chime On' : 'Muted'}</span>
        </button>
      </div>

      {/* Finished Alert Banner */}
      {isFinished && (
        <div className="p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-300 shadow-md animate-bounce flex items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Bake Finished!</p>
              <p className="text-xs text-emerald-800">Check your oven now. "{label}"</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic(15);
              onDismissFinished();
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Circular Clock Display */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EE] border border-[#E8DFD8] shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
        {/* Active Timer Label Pill */}
        <div className="mb-2 px-3 py-1 rounded-full bg-white border border-[#EADBCC] text-xs font-bold text-[#66574F] shadow-2xs flex items-center gap-1.5">
          <Bell className={`w-3.5 h-3.5 ${isRunning ? 'text-[#C26343] animate-bounce' : 'text-[#8C7A70]'}`} />
          <span className="truncate max-w-[200px]">{label || 'Oven Timer'}</span>
        </div>

        {/* SVG Circular Dial */}
        <div className="relative w-60 h-60 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            {/* Background track circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="#EFE8DF"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke={isFinished ? '#10B981' : isRunning ? '#C26343' : '#8C7A70'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`font-mono text-4xl sm:text-5xl font-black tracking-tighter ${
                isFinished
                  ? 'text-emerald-600 animate-pulse'
                  : isRunning
                  ? 'text-[#2E2520]'
                  : 'text-[#66574F]'
              }`}
            >
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-[11px] font-semibold text-[#8C7A70] uppercase tracking-wider mt-1">
              {isRunning ? 'Baking in progress' : isFinished ? 'Time is up!' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Quick Adjustment Bumps */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => {
              triggerHaptic(8);
              onAddSeconds(-60);
            }}
            disabled={remainingSeconds <= 60}
            className="px-2.5 py-1 rounded-xl bg-white border border-[#D9CFC7] hover:bg-[#FAF6F1] disabled:opacity-40 text-xs font-bold text-[#66574F] flex items-center gap-1 transition-colors active:scale-95"
          >
            <Minus className="w-3 h-3" /> 1m
          </button>
          <button
            onClick={() => {
              triggerHaptic(8);
              onAddSeconds(60);
            }}
            className="px-2.5 py-1 rounded-xl bg-white border border-[#D9CFC7] hover:bg-[#FAF6F1] text-xs font-bold text-[#66574F] flex items-center gap-1 transition-colors active:scale-95"
          >
            <Plus className="w-3 h-3" /> 1m
          </button>
          <button
            onClick={() => {
              triggerHaptic(8);
              onAddSeconds(300);
            }}
            className="px-2.5 py-1 rounded-xl bg-white border border-[#D9CFC7] hover:bg-[#FAF6F1] text-xs font-bold text-[#66574F] flex items-center gap-1 transition-colors active:scale-95"
          >
            <Plus className="w-3 h-3" /> 5m
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
          <button
            onClick={onReset}
            className="p-3.5 rounded-2xl bg-white border border-[#D9CFC7] hover:bg-[#FAF6F1] text-[#6E5C53] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
            title="Reset to original duration"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-[#C26343] hover:bg-[#B05334] shadow-[#C26343]/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause Timer
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> {remainingSeconds === 0 ? 'Restart' : 'Start Baking'}
              </>
            )}
          </button>

          <button
            onClick={handleTestChime}
            className="p-3.5 rounded-2xl bg-white border border-[#D9CFC7] hover:bg-[#FAF6F1] text-[#6E5C53] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
            title="Test oven chime"
          >
            <Volume2 className="w-4 h-4 text-[#C26343]" />
          </button>
        </div>
      </div>

      {/* Popular Baking Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A61]">
            Common Baking Presets
          </span>
          <span className="text-[11px] text-[#9E8E84]">Tap to set timer</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map(preset => {
            const isSelected = totalSeconds === preset.minutes * 60 && label === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  triggerHaptic(10);
                  onSetTime(preset.minutes * 60, preset.label);
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-150 active:scale-98 ${
                  isSelected
                    ? 'bg-[#FAF3EA] border-[#C26343] ring-1 ring-[#C26343]/40'
                    : 'bg-white border-[#E8DFD8] hover:border-[#D9CFC7] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#2E2520]">{preset.label}</span>
                  <span className="text-xs font-black text-[#C26343]">{preset.minutes}m</span>
                </div>
                <p className="text-[10px] text-[#7A6A61] mt-0.5 leading-tight">{preset.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Baker's Golden Rule Rotating Tip */}
      <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
            Baker's Oven Tip
          </p>
          <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
            {BAKER_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
