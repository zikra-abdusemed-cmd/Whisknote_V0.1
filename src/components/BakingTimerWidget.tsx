import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BakingTimerProps {
  initialSeconds?: number;
  label?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Web Audio API chime tone when timer completes
function playBakeChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Warm three-tone chime (C5, E5, G5)
    playTone(523.25, now, 0.4);
    playTone(659.25, now + 0.2, 0.4);
    playTone(783.99, now + 0.4, 0.8);
  } catch (e) {
    console.log('Audio chime not permitted or failed', e);
  }
}

export const BakingTimerWidget: React.FC<BakingTimerProps> = ({
  initialSeconds = 600, // 10 minutes default
  label = "Oven Timer",
  isOpen,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemainingSeconds(initialSeconds);
    setIsRunning(false);
    setIsFinished(false);
  }, [initialSeconds, label]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playBakeChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, remainingSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setCustomMinutes = (mins: number) => {
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(false);
    setIsFinished(false);
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-80 bg-[#FFFDF9] border border-[#E8DFD8] rounded-2xl shadow-xl p-4 overflow-hidden"
      >
        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F0EAE1]">
          <div
            className={`h-full transition-all duration-300 ${isFinished ? 'bg-[#588157]' : 'bg-[#C26343]'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-1 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isFinished ? 'bg-[#588157]/15 text-[#588157]' : 'bg-[#C26343]/15 text-[#C26343]'}`}>
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#8C7A70] uppercase tracking-wider">Baker's Timer</p>
              <h4 className="text-sm font-bold text-[#3B302A] truncate max-w-[170px]">{label}</h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C7A70] hover:text-[#3B302A] p-1 rounded-lg hover:bg-[#F2ECE4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-center my-3 py-2 bg-[#FBF8F5] rounded-xl border border-[#EFE8DF]">
          <div className={`text-4xl font-bold tracking-tight ${isFinished ? 'text-[#588157] animate-pulse' : 'text-[#2D2420]'}`}>
            {formatTime(remainingSeconds)}
          </div>
          {isFinished && (
            <p className="text-xs font-semibold text-[#588157] mt-1 flex items-center justify-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Bake ready! Check your oven
            </p>
          )}
        </div>

        {/* Quick presets */}
        <div className="flex items-center justify-center gap-1.5 mb-4 text-xs font-medium text-[#6E5D53]">
          <button
            onClick={() => setCustomMinutes(5)}
            className="px-2 py-1 rounded-md bg-[#F2ECE4] hover:bg-[#E8DFD5] transition-colors"
          >
            +5m
          </button>
          <button
            onClick={() => setCustomMinutes(12)}
            className="px-2 py-1 rounded-md bg-[#F2ECE4] hover:bg-[#E8DFD5] transition-colors"
          >
            +12m
          </button>
          <button
            onClick={() => setCustomMinutes(25)}
            className="px-2 py-1 rounded-md bg-[#F2ECE4] hover:bg-[#E8DFD5] transition-colors"
          >
            +25m
          </button>
          <button
            onClick={() => setCustomMinutes(45)}
            className="px-2 py-1 rounded-md bg-[#F2ECE4] hover:bg-[#E8DFD5] transition-colors"
          >
            +45m
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setRemainingSeconds(totalSeconds);
              setIsRunning(false);
              setIsFinished(false);
            }}
            title="Reset timer"
            className="p-2.5 rounded-xl border border-[#E5DDD4] text-[#6E5D53] hover:bg-[#F2ECE4] hover:text-[#2D2420] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (isFinished) {
                setRemainingSeconds(totalSeconds);
                setIsFinished(false);
              }
              setIsRunning(!isRunning);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm text-white shadow-sm transition-all ${
              isRunning
                ? 'bg-[#A35237] hover:bg-[#8D442C]'
                : isFinished
                ? 'bg-[#588157] hover:bg-[#466845]'
                : 'bg-[#C26343] hover:bg-[#AE5638]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> {isFinished ? 'Restart' : 'Start'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
