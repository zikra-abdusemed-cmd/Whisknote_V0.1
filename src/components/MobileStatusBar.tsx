import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Flame } from 'lucide-react';

interface MobileStatusBarProps {
  showDynamicIsland?: boolean;
  isOnline?: boolean;
  isTimerRunning?: boolean;
  timerCountdown?: string;
  onTapDynamicIsland?: () => void;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  showDynamicIsland = true,
  isOnline = true,
  isTimerRunning = false,
  timerCountdown = '',
  onTapDynamicIsland,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full px-6 pt-2 pb-1.5 flex items-center justify-between text-[13px] font-semibold text-[#2E2520] select-none shrink-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-xs border-b border-[#F0EAE1]">
      {/* Time */}
      <span className="font-bold tracking-tight text-xs sm:text-[13px] z-10">
        {timeStr || '9:41 AM'}
      </span>

      {/* Dynamic Island / Hardware notch (iPhone 16 Pro styling centered absolutely) */}
      {showDynamicIsland && (
        <div
          onClick={onTapDynamicIsland}
          className={`hidden sm:flex items-center gap-1.5 bg-[#1C1613] text-white px-3 py-1 rounded-full text-[10px] tracking-wide shadow-md absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
            isTimerRunning ? 'ring-1 ring-amber-500/50 bg-[#291E18]' : ''
          }`}
          title={isTimerRunning ? 'Timer active - tap to view' : 'WhiskNote'}
        >
          {isTimerRunning ? (
            <>
              <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
              <span className="font-mono text-[9px] text-amber-300 font-bold">
                {timerCountdown || 'BAKING'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#110D0B] border border-neutral-700/60" />
              <span className="font-mono text-[9px] text-amber-200/90 font-medium">WhiskNote</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C26343]" />
            </>
          )}
        </div>
      )}

      {/* Status Icons */}
      <div className="flex items-center gap-1.5 text-xs text-[#4A3E37] z-10">
        <Signal className="w-3.5 h-3.5" />
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1 rounded">OFF</span>
        )}
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-bold">100%</span>
          <Battery className="w-4 h-4 fill-emerald-600 text-[#4A3E37]" />
        </div>
      </div>
    </div>
  );
};
