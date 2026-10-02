import React, { useState } from 'react';
import { ChefHat, Search, Timer, Wifi, WifiOff, X, Sparkles } from 'lucide-react';

interface MobileHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenTimer: () => void;
  isOnline: boolean;
  isTimerRunning?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenTimer,
  isOnline,
  isTimerRunning = false,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8DFD8] pt-safe no-print">
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C26343] to-[#D97753] text-white flex items-center justify-center shadow-xs">
            <ChefHat className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-serif-display text-base font-extrabold text-[#2E2520] tracking-tight leading-none">
              WhiskNote
            </h1>
            <span className="text-[9px] font-semibold text-[#8C7A70] tracking-wider uppercase">
              Baking App
            </span>
          </div>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-1.5">
          {/* Online/Offline Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={isOnline ? 'Online' : 'Offline Cached'}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-2.5 h-2.5 text-amber-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className={`p-1.5 rounded-xl border transition-colors ${
              isSearchExpanded || searchQuery
                ? 'bg-[#FAF5EE] border-[#C26343] text-[#C26343]'
                : 'bg-white border-[#D9CFC7] text-[#6E5C53]'
            }`}
            title="Search recipes"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Timer Quick Glance */}
          <button
            onClick={onOpenTimer}
            className={`relative p-1.5 rounded-xl border transition-colors ${
              isTimerRunning
                ? 'bg-[#C26343] border-[#C26343] text-white animate-pulse'
                : 'bg-white border-[#D9CFC7] text-[#6E5C53] hover:bg-[#FAF5EE]'
            }`}
            title="Kitchen Bake Timer"
            aria-label="Open kitchen bake timer"
          >
            <Timer className="w-4 h-4" />
            {isTimerRunning && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Search Bar */}
      {(isSearchExpanded || searchQuery) && (
        <div className="px-4 pb-2.5 pt-0.5 max-w-md mx-auto animate-in fade-in duration-150">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search recipes, sourdough, cookies..."
              autoFocus={isSearchExpanded && !searchQuery}
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-[#D9CFC7] bg-[#FAF6F1] text-xs text-[#2E2520] focus:bg-white focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C7A70] hover:text-[#2E2520]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
