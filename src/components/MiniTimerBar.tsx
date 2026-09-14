import React from 'react';
import { Play, Pause, Bell, ChevronRight, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/timerAudio';

interface MiniTimerBarProps {
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
  label: string;
  onTogglePlay: () => void;
  onOpenTimerTab: () => void;
}

export const MiniTimerBar: React.FC<MiniTimerBarProps> = ({
  remainingSeconds,
  isRunning,
  isFinished,
  label,
  onTogglePlay,
  onOpenTimerTab,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-3 pt-1 pb-1 shrink-0 z-30 animate-in slide-in-from-bottom-2 duration-200">
      <div
        onClick={onOpenTimerTab}
        className={`w-full p-2.5 rounded-2xl border shadow-md flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
          isFinished
            ? 'bg-emerald-600 text-white border-emerald-700 animate-bounce'
            : isRunning
            ? 'bg-[#2E2520] text-white border-[#1F1916]'
            : 'bg-[#FAF5EE] text-[#2E2520] border-[#EADBCC]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-xl shrink-0 ${
              isFinished
                ? 'bg-white text-emerald-700'
                : isRunning
                ? 'bg-[#C26343] text-white'
                : 'bg-white text-[#6E5C53]'
            }`}
          >
            {isFinished ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Bell className={`w-4 h-4 ${isRunning ? 'animate-bounce' : ''}`} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate opacity-90">{label || 'Oven Timer'}</p>
            <p
              className={`font-mono text-xs font-black tracking-tight ${
                isFinished ? 'text-white' : isRunning ? 'text-amber-300' : 'text-[#C26343]'
              }`}
            >
              {isFinished ? 'TIME IS UP!' : formatTime(remainingSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => {
              e.stopPropagation();
              triggerHaptic(10);
              onTogglePlay();
            }}
            className={`p-2 rounded-xl transition-colors ${
              isFinished
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : isRunning
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white text-[#2E2520] border border-[#D9CFC7]'
            }`}
            title={isRunning ? 'Pause' : 'Resume'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="text-xs opacity-75 pr-1 flex items-center">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
