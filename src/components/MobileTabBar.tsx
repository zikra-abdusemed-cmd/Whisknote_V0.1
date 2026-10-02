import React from 'react';
import { ChefHat, Heart, Plus, Scale, User } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type MobileTab = 'recipes' | 'favorites' | 'timer' | 'tools' | 'kitchen';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  onOpenNewRecipe: () => void;
  recipeCount: number;
  favoriteCount: number;
  isTimerRunning?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewRecipe,
  recipeCount,
  favoriteCount,
  isTimerRunning = false,
}) => {
  const handleTabClick = (tab: MobileTab) => {
    void triggerHaptic(10);
    onSelectTab(tab);
  };

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 w-full bg-[#FFFDF9]/95 backdrop-blur-lg border-t border-[#E8DFD8] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] shrink-0 no-print">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Tab 1: Recipes */}
        <button
          onClick={() => handleTabClick('recipes')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all duration-150 active:scale-90 ${
            activeTab === 'recipes'
              ? 'text-[#C26343]'
              : 'text-[#8C7A70] hover:text-[#52443D]'
          }`}
          aria-label="Recipes tab"
        >
          <div className="relative">
            <ChefHat className={`w-5 h-5 ${activeTab === 'recipes' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {recipeCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-[#FAF5EE] border border-[#E8DFD8] text-[#6E5C53] rounded-full min-w-3.5 text-center">
                {recipeCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-semibold ${activeTab === 'recipes' ? 'font-bold' : ''}`}>
            Recipes
          </span>
        </button>

        {/* Tab 2: Favorites */}
        <button
          onClick={() => handleTabClick('favorites')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all duration-150 active:scale-90 ${
            activeTab === 'favorites'
              ? 'text-[#C26343]'
              : 'text-[#8C7A70] hover:text-[#52443D]'
          }`}
          aria-label="Favorites tab"
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                activeTab === 'favorites' ? 'fill-[#C26343] stroke-[#C26343] stroke-[2.2]' : 'stroke-[1.8]'
              }`}
            />
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-[#C26343] text-white rounded-full min-w-3.5 text-center">
                {favoriteCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-semibold ${activeTab === 'favorites' ? 'font-bold' : ''}`}>
            Favorites
          </span>
        </button>

        {/* Tab Center: Floating Action Button (+ New Recipe) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => {
              triggerHaptic();
              onOpenNewRecipe();
            }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#B25333] to-[#D97753] text-white flex items-center justify-center shadow-lg shadow-[#C26343]/35 active:scale-90 transition-transform focus:outline-hidden ring-4 ring-[#FFFDF9]"
            title="Create New Recipe"
            aria-label="Add new baking recipe"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* Tab 3: Tools (Unit Converter & Calculators) */}
        <button
          onClick={() => handleTabClick('tools')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all duration-150 active:scale-90 ${
            activeTab === 'tools'
              ? 'text-[#C26343]'
              : 'text-[#8C7A70] hover:text-[#52443D]'
          }`}
          aria-label="Baker Tools tab"
        >
          <Scale className={`w-5 h-5 ${activeTab === 'tools' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-1 font-semibold ${activeTab === 'tools' ? 'font-bold' : ''}`}>
            Tools
          </span>
        </button>

        {/* Tab 4: My Kitchen (Profile, Backup, PWA Install) */}
        <button
          onClick={() => handleTabClick('kitchen')}
          className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all duration-150 active:scale-90 ${
            activeTab === 'kitchen'
              ? 'text-[#C26343]'
              : 'text-[#8C7A70] hover:text-[#52443D]'
          }`}
          aria-label="My Kitchen tab"
        >
          <User className={`w-5 h-5 ${activeTab === 'kitchen' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-1 font-semibold ${activeTab === 'kitchen' ? 'font-bold' : ''}`}>
            Kitchen
          </span>
        </button>
      </div>
    </nav>
  );
};
