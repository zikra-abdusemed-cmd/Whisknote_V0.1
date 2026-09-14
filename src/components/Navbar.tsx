import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Scale,
  Timer,
  Plus,
  Wifi,
  WifiOff,
  LogOut,
  User,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storageService';

interface NavbarProps {
  onOpenNewRecipe: () => void;
  onOpenConverter: () => void;
  onOpenTimer: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewRecipe,
  onOpenConverter,
  onOpenTimer,
  searchQuery,
  onSearchChange,
  onRefreshData,
}) => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportBackup = () => {
    const json = StorageService.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whisknote-recipes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShowProfileMenu(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      if (typeof evt.target?.result === 'string') {
        const res = StorageService.importJSON(evt.target.result);
        if (res.success) {
          alert(`Successfully imported ${res.count} recipes into your WhiskNote!`);
          onRefreshData();
        } else {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    setShowProfileMenu(false);
  };

  const handleResetSampleRecipes = () => {
    if (confirm('Reset all recipes to default sample baking collection? Your custom recipes will be replaced.')) {
      StorageService.resetToDefault();
      onRefreshData();
      setShowProfileMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E8DFD8] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-2 rounded-xl bg-[#C26343] text-white shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif-display text-lg font-extrabold text-[#2E2520] tracking-tight block leading-none">
              WhiskNote
            </span>
            <span className="text-[10px] font-semibold text-[#8C7A70] uppercase tracking-wider">
              Baking Notebook
            </span>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search recipes, ingredients, techniques..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#D9CFC7] bg-[#FAF6F1] hover:bg-white text-xs text-[#2E2520] focus:bg-white focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C7A70] hover:text-[#2E2520]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Offline/Online Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                : 'bg-amber-50 text-amber-800 border-amber-200/60'
            }`}
            title={isOnline ? 'Online mode active' : 'Offline mode active – cached recipes are fully functional'}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span>Offline Cached</span>
              </>
            )}
          </div>

          {/* Unit Converter Tool */}
          <button
            onClick={onOpenConverter}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#D9CFC7] bg-white hover:bg-[#FAF6F1] text-[#66574F] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Open Unit Converter"
          >
            <Scale className="w-4 h-4 text-[#C26343]" />
            <span className="hidden sm:inline">Converter</span>
          </button>

          {/* In-app Timer */}
          <button
            onClick={onOpenTimer}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#D9CFC7] bg-white hover:bg-[#FAF6F1] text-[#66574F] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Open Oven Timer"
          >
            <Timer className="w-4 h-4 text-[#C26343]" />
            <span className="hidden sm:inline">Timer</span>
          </button>

          {/* Create New Recipe */}
          <button
            onClick={onOpenNewRecipe}
            className="py-1.5 px-3.5 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Recipe</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1 rounded-full border border-[#D9CFC7] hover:border-[#C26343] transition-colors focus:outline-hidden"
              title="Baker Profile & Settings"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#EADFD6] flex items-center justify-center text-xs font-bold text-[#66574F]">
                  {user?.name?.[0] || 'B'}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#FFFDF9] border border-[#E8DFD8] rounded-2xl shadow-xl p-3 z-50 text-xs text-[#332A24] space-y-2 animate-in fade-in">
                <div className="p-2 border-b border-[#EFE8DF]">
                  <p className="font-bold text-[#2E2520] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#8C7A70] truncate">{user?.email}</p>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-[#FAF5EE] text-[#C26343] font-semibold text-[10px]">
                    {user?.bakingExperience || 'Home Baker'}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={handleExportBackup}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FAF6F1] flex items-center gap-2 font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C26343]" /> Export Recipe Backup (JSON)
                  </button>

                  <button
                    onClick={() => fileImportRef.current?.click()}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FAF6F1] flex items-center gap-2 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C26343]" /> Import Backup File
                  </button>
                  <input
                    ref={fileImportRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />

                  <button
                    onClick={handleResetSampleRecipes}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FAF6F1] flex items-center gap-2 font-medium text-[#7A6A61]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#7A6A61]" /> Reset Sample Recipes
                  </button>
                </div>

                <div className="pt-2 border-t border-[#EFE8DF]">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search row below header */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#948378] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search recipes, ingredients..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#D9CFC7] bg-[#FAF6F1] text-xs text-[#2E2520] focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>
    </header>
  );
};
