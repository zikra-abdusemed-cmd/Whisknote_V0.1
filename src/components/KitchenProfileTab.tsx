import React, { useRef } from 'react';
import {
  User,
  ChefHat,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Heart,
  BookOpen,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storageService';
import { Recipe } from '../types';
import { saveTextFile } from '../utils/fileExport';

interface KitchenProfileTabProps {
  recipes: Recipe[];
  onRefreshData: () => void;
}

export const KitchenProfileTab: React.FC<KitchenProfileTabProps> = ({
  recipes,
  onRefreshData,
}) => {
  const { user, logout } = useAuth();
  const fileImportRef = useRef<HTMLInputElement>(null);

  const favoriteCount = recipes.filter(r => r.isFavorite).length;

  const handleExportBackup = () => {
    saveTextFile(`whisknote-recipes-${new Date().toISOString().split('T')[0]}.json`, StorageService.exportJSON()).catch(err => {
      console.warn('Backup export cancelled or failed', err);
    });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      if (typeof evt.target?.result === 'string') {
        const res = StorageService.importJSON(evt.target.result);
        if (res.success) {
          alert(`Successfully restored ${res.count} recipes to your mobile notebook!`);
          onRefreshData();
        } else {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSampleRecipes = () => {
    if (
      confirm(
        'Reset your notebook to default artisan recipes? This will restore classic sourdough, cookies, and brioche.'
      )
    ) {
      StorageService.resetToDefault();
      onRefreshData();
    }
  };

  return (
    <div className="p-4 space-y-5 pb-24 text-[#2E2520]">
      {/* Baker Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#FAF3EA] to-[#FFFDF9] border border-[#E8DFD8] shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#EADFD6] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif-display text-2xl font-bold text-[#C26343]">
              {user?.name?.[0] || 'B'}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="inline-block px-2 py-0.5 rounded-md bg-white border border-[#EADBCC] text-[10px] font-bold text-[#C26343] uppercase tracking-wider">
            {user?.bakingExperience || 'Home Baker'}
          </div>
          <h3 className="font-serif-display text-lg font-bold text-[#2E2520] leading-tight">
            {user?.name || 'Artisan Baker'}
          </h3>
          <p className="text-xs text-[#7A6A61]">{user?.email || 'baker@whisknote.app'}</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFD8] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A6A61]">
            <BookOpen className="w-4 h-4 text-[#C26343]" />
            <span>Total Recipes</span>
          </div>
          <p className="font-serif-display text-2xl font-bold text-[#2E2520] mt-1">
            {recipes.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFD8] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A6A61]">
            <Heart className="w-4 h-4 text-[#C26343] fill-[#C26343]" />
            <span>Favorites</span>
          </div>
          <p className="font-serif-display text-2xl font-bold text-[#2E2520] mt-1">
            {favoriteCount}
          </p>
        </div>
      </div>

      {/* Data & Backup Settings */}
      <div className="bg-white border border-[#E8DFD8] rounded-3xl overflow-hidden shadow-2xs divide-y divide-[#EFE8DF] text-xs">
        <div className="p-3.5 bg-[#FAF6F1]/70 font-bold text-[#7A6A61] uppercase tracking-wider text-[10px]">
          Notebook Data & Storage
        </div>

        <button
          onClick={handleExportBackup}
          className="w-full p-3.5 flex items-center justify-between hover:bg-[#FAF6F1] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-[#C26343]" />
            <div>
              <p className="font-bold text-[#2E2520]">Export Backup (JSON)</p>
              <p className="text-[11px] text-[#7A6A61]">Save all recipes and notes offline</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => fileImportRef.current?.click()}
          className="w-full p-3.5 flex items-center justify-between hover:bg-[#FAF6F1] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Upload className="w-4 h-4 text-[#C26343]" />
            <div>
              <p className="font-bold text-[#2E2520]">Import Backup File</p>
              <p className="text-[11px] text-[#7A6A61]">Restore recipes from a saved JSON file</p>
            </div>
          </div>
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
          className="w-full p-3.5 flex items-center justify-between hover:bg-[#FAF6F1] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 text-[#8C7A70]">
            <RotateCcw className="w-4 h-4" />
            <div>
              <p className="font-bold">Reset Sample Recipes</p>
              <p className="text-[11px]">Restore standard artisan sample collection</p>
            </div>
          </div>
        </button>
      </div>

      {/* Offline Guarantee Info */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Offline Ready:</strong> All your custom bakes, ingredients, and instructions are securely stored in your device's browser memory and cached by the Service Worker for kitchen counter use without internet.
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={logout}
        className="w-full py-3 px-4 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out of WhiskNote
      </button>
    </div>
  );
};
