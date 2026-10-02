import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Maximize2,
  ChefHat,
  Sparkles,
  Heart,
  Timer,
  Download,
  Plus,
  Bell,
  Check,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorageService, RECIPES_CHANGED_EVENT } from './services/storageService';
import { Recipe } from './types';
import { AuthScreen } from './components/AuthScreen';
import { MobileStatusBar } from './components/MobileStatusBar';
import { MobileHeader } from './components/MobileHeader';
import { MobileTabBar, MobileTab } from './components/MobileTabBar';
import { KitchenToolsTab } from './components/KitchenToolsTab';
import { KitchenProfileTab } from './components/KitchenProfileTab';
import { BakingTimerView } from './components/BakingTimerView';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeFormModal } from './components/RecipeFormModal';
import { UnitConverterModal } from './components/UnitConverterModal';
import { ExportShareModal } from './components/ExportShareModal';
import { usePwaInstall } from './utils/pwa';
import { playBakeChime, triggerHaptic } from './utils/timerAudio';
import { cancelTimerNotification, scheduleTimerNotification } from './utils/timerNotifications';
import { useAndroidBackButton, useNativePlatformSetup } from './hooks/useNativeApp';

function WhiskNoteMobileApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isStandalone } = usePwaInstall();
  const isNative = Capacitor.isNativePlatform();

  useNativePlatformSetup();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MobileTab>('recipes');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals & widgets state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const [isConverterOpen, setIsConverterOpen] = useState<boolean>(false);
  const [converterIngredient, setConverterIngredient] = useState<string | undefined>(undefined);

  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [recipeToShare, setRecipeToShare] = useState<Recipe | null>(null);

  // Centralized Baking Timer State
  const [totalTimerSeconds, setTotalTimerSeconds] = useState<number>(600); // 10 mins default
  const [remainingTimerSeconds, setRemainingTimerSeconds] = useState<number>(600);
  const [timerLabel, setTimerLabel] = useState<string>('Bake Timer');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerFinished, setIsTimerFinished] = useState<boolean>(false);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Desktop Simulator presentation: 'phone-frame' (iPhone chassis) or 'fluid-mobile' (edge-to-edge mobile app)
  const [simulatorView, setSimulatorView] = useState<'phone-frame' | 'fluid-mobile'>(
    isNative ? 'fluid-mobile' : 'phone-frame'
  );
  const [phoneFinish, setPhoneFinish] = useState<'titanium-dark' | 'titanium-natural' | 'titanium-desert'>('titanium-dark');

  const handleNativeBack = useCallback((): boolean => {
    if (isFormOpen) {
      setIsFormOpen(false);
      setRecipeToEdit(null);
      return true;
    }
    if (isConverterOpen) {
      setIsConverterOpen(false);
      return true;
    }
    if (isShareOpen) {
      setIsShareOpen(false);
      setRecipeToShare(null);
      return true;
    }
    if (selectedRecipeId) {
      setSelectedRecipeId(null);
      return true;
    }
    if (activeTab !== 'recipes') {
      setActiveTab('recipes');
      return true;
    }
    return false;
  }, [isFormOpen, isConverterOpen, isShareOpen, selectedRecipeId, activeTab]);

  useAndroidBackButton({ onBack: handleNativeBack });

  // Load recipes on mount, keep in sync with background cloud syncs, and handle network state
  useEffect(() => {
    void StorageService.hydrateFromIndexedDb().then(() => refreshRecipes());

    const handleRecipesChanged = () => refreshRecipes();
    const handleOnline = () => {
      setIsOnline(true);
      void StorageService.syncWithCloud();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener(RECIPES_CHANGED_EVENT, handleRecipesChanged);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener(RECIPES_CHANGED_EVENT, handleRecipesChanged);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Centralized timer countdown. Tracks a wall-clock end time so the countdown stays
  // correct when the phone is locked or the app is backgrounded (JS timers pause there).
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);

  useEffect(() => {
    if (!isTimerRunning) {
      setTimerEndAt(null);
      return;
    }
    if (timerEndAt === null) {
      setTimerEndAt(Date.now() + remainingTimerSeconds * 1000);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
      setRemainingTimerSeconds(left);
      if (left === 0) {
        setIsTimerRunning(false);
        setIsTimerFinished(true);
        playBakeChime();
        triggerHaptic([300, 150, 300, 150, 400]);
        showToast('Ding! Your bake is ready in the oven.');
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isTimerRunning, timerEndAt]);

  // System notification so the alarm still arrives when the app is closed or the phone is locked
  useEffect(() => {
    if (isTimerRunning && timerEndAt !== null) {
      void scheduleTimerNotification(timerEndAt, timerLabel);
    } else {
      void cancelTimerNotification();
    }
  }, [isTimerRunning, timerEndAt, timerLabel]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshRecipes = () => {
    const data = StorageService.getRecipes();
    setRecipes([...data]);
  };

  // Find currently selected recipe
  const currentRecipe = recipes.find(r => r.id === selectedRecipeId) || null;
  const favoriteRecipes = recipes.filter(r => r.isFavorite);

  // Recipe actions
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (recipeToEdit) {
      const updated = StorageService.updateRecipe(recipeToEdit.id, recipeData);
      if (updated) {
        refreshRecipes();
        showToast(`Updated "${updated.title}"`);
      }
    } else {
      const created = StorageService.addRecipe(recipeData);
      refreshRecipes();
      setSelectedRecipeId(created.id);
      showToast(`Created "${created.title}"`);
    }
    setIsFormOpen(false);
    setRecipeToEdit(null);
  };

  const handleDeleteRecipe = (id: string) => {
    StorageService.deleteRecipe(id);
    refreshRecipes();
    if (selectedRecipeId === id) {
      setSelectedRecipeId(null);
    }
    showToast('Recipe deleted');
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newStatus = StorageService.toggleFavorite(id);
    refreshRecipes();
    triggerHaptic(10);
    showToast(newStatus ? 'Added to Favorites' : 'Removed from Favorites');
  };

  const handleOpenEdit = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsFormOpen(true);
  };

  // Timer controls
  const handleOpenTimer = (seconds = 600, label = 'Bake Timer', switchToTab = true) => {
    triggerHaptic(12);
    setTimerEndAt(Date.now() + seconds * 1000);
    setTotalTimerSeconds(seconds);
    setRemainingTimerSeconds(seconds);
    setTimerLabel(label);
    setIsTimerRunning(true);
    setIsTimerFinished(false);

    if (switchToTab) {
      setSelectedRecipeId(null);
      setActiveTab('timer');
    } else {
      showToast(`Timer started: ${Math.round(seconds / 60)}m for "${label}"`);
    }
  };

  const handleStartTimer = () => {
    if (remainingTimerSeconds <= 0) {
      setRemainingTimerSeconds(totalTimerSeconds);
    }
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    setRemainingTimerSeconds(totalTimerSeconds);
  };

  const handleSetTimerDuration = (seconds: number, newLabel?: string) => {
    setTotalTimerSeconds(seconds);
    setRemainingTimerSeconds(seconds);
    if (newLabel) setTimerLabel(newLabel);
    setIsTimerRunning(false);
    setIsTimerFinished(false);
  };

  const handleAddTimerSeconds = (secondsToAdd: number) => {
    if (timerEndAt !== null) {
      const left = Math.max(0, (timerEndAt - Date.now()) / 1000);
      setTimerEndAt(Date.now() + Math.max(10, left + secondsToAdd) * 1000);
    }
    setRemainingTimerSeconds(prev => Math.max(10, prev + secondsToAdd));
    setTotalTimerSeconds(prev => Math.max(10, prev + secondsToAdd));
  };

  const handleDismissFinished = () => {
    setIsTimerFinished(false);
  };

  const handleOpenConverter = (ingredientName?: string) => {
    setConverterIngredient(ingredientName);
    setIsConverterOpen(true);
  };

  const handleOpenShare = (recipe: Recipe) => {
    setRecipeToShare(recipe);
    setIsShareOpen(true);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F5] flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-3xl bg-[#C26343] text-white animate-bounce shadow-lg">
          <ChefHat className="w-9 h-9" />
        </div>
        <p className="text-xs font-bold text-[#7A6A61] tracking-wide">
          Launching WhiskNote Mobile App...
        </p>
      </div>
    );
  }

  // Prevent unauthenticated access
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const phoneBorderColor =
    phoneFinish === 'titanium-dark'
      ? 'border-[#29231E]'
      : phoneFinish === 'titanium-natural'
      ? 'border-[#736B63]'
      : 'border-[#C29D88]';

  return (
    <div
      className={`min-h-screen bg-[#EFE9E2] text-[#2E2724] flex flex-col items-center justify-center pt-safe ${
        simulatorView === 'phone-frame' && !isNative ? 'sm:py-4 sm:px-4' : 'p-0 bg-[#FBF8F5]'
      }`}
    >
      {/* Desktop Mobile Simulator Top Bar (hidden on mobile devices, standalone PWA, or native) */}
      {!isStandalone && !isNative && (
        <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2.5 px-3 py-1.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#D9CFC7] shadow-xs text-xs text-[#6E5C53] no-print">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C26343] animate-pulse" />
            <span className="font-bold text-[#2E2520]">WhiskNote Mobile</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Phone Finish Switcher */}
            {simulatorView === 'phone-frame' && (
              <div className="flex items-center gap-1 pr-1 border-r border-[#E2D8CF]">
                <button
                  onClick={() => setPhoneFinish('titanium-dark')}
                  className={`w-3.5 h-3.5 rounded-full bg-[#29231E] border border-white/60 transition-transform ${
                    phoneFinish === 'titanium-dark' ? 'scale-125 ring-2 ring-[#C26343]' : 'opacity-70'
                  }`}
                  title="Black Titanium"
                />
                <button
                  onClick={() => setPhoneFinish('titanium-natural')}
                  className={`w-3.5 h-3.5 rounded-full bg-[#8E867E] border border-white/60 transition-transform ${
                    phoneFinish === 'titanium-natural' ? 'scale-125 ring-2 ring-[#C26343]' : 'opacity-70'
                  }`}
                  title="Natural Titanium"
                />
                <button
                  onClick={() => setPhoneFinish('titanium-desert')}
                  className={`w-3.5 h-3.5 rounded-full bg-[#C29D88] border border-white/60 transition-transform ${
                    phoneFinish === 'titanium-desert' ? 'scale-125 ring-2 ring-[#C26343]' : 'opacity-70'
                  }`}
                  title="Desert Titanium"
                />
              </div>
            )}

            {/* View Mode Toggle */}
            <button
              onClick={() =>
                setSimulatorView(prev => (prev === 'phone-frame' ? 'fluid-mobile' : 'phone-frame'))
              }
              className="px-2 py-1 rounded-lg bg-[#FAF5EE] hover:bg-[#F2EAE0] text-[11px] font-bold text-[#52443D] flex items-center gap-1 transition-colors"
              title="Toggle Phone Frame"
            >
              {simulatorView === 'phone-frame' ? (
                <>
                  <Maximize2 className="w-3 h-3" /> Full View
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3" /> Phone Frame
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Mobile App Container */}
      <div
        className={`w-full bg-[#FBF8F5] flex flex-col overflow-hidden transition-all duration-300 relative ${
          simulatorView === 'phone-frame'
            ? 'sm:max-w-[420px] sm:h-[840px] sm:max-h-[calc(100vh-3.5rem)] sm:rounded-[50px] sm:border-[11px] ' +
              phoneBorderColor +
              ' sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.15)]'
            : 'max-w-md sm:max-w-lg min-h-screen shadow-md'
        }`}
      >
        {/* Hardware side button accents (Only visible in Phone Frame on Desktop) */}
        {simulatorView === 'phone-frame' && (
          <>
            <div className="hidden sm:block absolute -left-[14px] top-28 w-[3px] h-9 bg-neutral-400 rounded-l-sm pointer-events-none" />
            <div className="hidden sm:block absolute -left-[14px] top-42 w-[3px] h-14 bg-neutral-400 rounded-l-sm pointer-events-none" />
            <div className="hidden sm:block absolute -left-[14px] top-60 w-[3px] h-14 bg-neutral-400 rounded-l-sm pointer-events-none" />
            <div className="hidden sm:block absolute -right-[14px] top-36 w-[3px] h-18 bg-neutral-400 rounded-r-sm pointer-events-none" />
          </>
        )}

        {/* 1. Mobile Status Bar with Interactive Dynamic Island */}
        <MobileStatusBar
          showDynamicIsland={simulatorView === 'phone-frame' && !isNative}
          isOnline={isOnline}
          isTimerRunning={isTimerRunning}
          timerCountdown={formatCountdown(remainingTimerSeconds)}
          onTapDynamicIsland={() => {
            setSelectedRecipeId(null);
            setActiveTab('timer');
          }}
        />

        {/* In-app Toast Banner */}
        {toastMessage && (
          <div className="absolute top-11 left-3 right-3 z-50 animate-in slide-in-from-top-2 fade-in duration-200 pointer-events-none">
            <div className="bg-[#2E2520]/95 text-white px-3.5 py-2 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {toastMessage}
              </span>
            </div>
          </div>
        )}

        {/* 2. Mobile App Header (Only on home screens; hidden when viewing recipe detail) */}
        {!currentRecipe && (
          <MobileHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenTimer={() => {
              setSelectedRecipeId(null);
              setActiveTab('timer');
            }}
            isOnline={isOnline}
            isTimerRunning={isTimerRunning}
          />
        )}

        {/* 3. Main App Body (Scrollable Screen) */}
        <main className="flex-1 overflow-y-auto overscroll-contain relative">
          <AnimatePresence mode="wait">
            {/* A. If viewing a single recipe, show Recipe Detail */}
            {currentRecipe ? (
              <motion.div
                key={currentRecipe.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="px-4 py-3"
              >
                <RecipeDetail
                  recipe={currentRecipe}
                  onBack={() => setSelectedRecipeId(null)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteRecipe}
                  onToggleFavorite={id => {
                    StorageService.toggleFavorite(id);
                    refreshRecipes();
                  }}
                  onOpenShare={handleOpenShare}
                  onOpenTimer={(secs, lbl) => handleOpenTimer(secs, lbl, false)}
                  onOpenConverter={handleOpenConverter}
                />
              </motion.div>
            ) : activeTab === 'recipes' || activeTab === 'favorites' ? (
              /* B. Recipes or Favorites Tab */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="px-4 py-3 space-y-4 pb-12"
              >
                {/* Mobile Welcome Card */}
                {activeTab === 'recipes' && !searchQuery && (
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF3EA] via-[#FFF9F3] to-[#FAF5EE] border border-[#EADBCC] shadow-2xs relative overflow-hidden">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C26343] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Mobile Baking Book
                      </span>
                      <h2 className="font-serif-display text-xl font-bold text-[#2E2520] leading-snug">
                        What are we baking today?
                      </h2>
                      <p className="text-[11px] text-[#7A6A61] leading-relaxed">
                        Touch any recipe for step checklists, grams scaler, and timer.
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRecipeToEdit(null);
                          setIsFormOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> + New Recipe
                      </button>
                      <button
                        onClick={() => setActiveTab('timer')}
                        className="px-3 py-2 rounded-xl bg-white border border-[#D9CFC7] text-[#6E5C53] text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Timer className="w-3.5 h-3.5 text-[#C26343]" /> Timer
                      </button>
                    </div>
                  </div>
                )}

                {/* Favorites Tab Header */}
                {activeTab === 'favorites' && (
                  <div className="space-y-1">
                    <h2 className="font-serif-display text-2xl font-bold text-[#2E2520] flex items-center gap-2">
                      <Heart className="w-6 h-6 text-[#C26343] fill-[#C26343]" /> Favorite Bakes
                    </h2>
                    <p className="text-xs text-[#7A6A61]">
                      Your personal hall-of-fame recipes ({favoriteRecipes.length} saved)
                    </p>
                  </div>
                )}

                {/* Recipe Collection List */}
                <RecipeList
                  recipes={activeTab === 'favorites' ? favoriteRecipes : recipes}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectRecipe={recipe => setSelectedRecipeId(recipe.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenNewRecipe={() => {
                    setRecipeToEdit(null);
                    setIsFormOpen(true);
                  }}
                  onResetDefault={refreshRecipes}
                />
              </motion.div>
            ) : activeTab === 'timer' ? (
              /* C. Interactive Full-Screen Baking Timer View */
              <motion.div
                key="timer-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <BakingTimerView
                  totalSeconds={totalTimerSeconds}
                  remainingSeconds={remainingTimerSeconds}
                  isRunning={isTimerRunning}
                  label={timerLabel}
                  onStart={handleStartTimer}
                  onPause={handlePauseTimer}
                  onReset={handleResetTimer}
                  onSetTime={handleSetTimerDuration}
                  onAddSeconds={handleAddTimerSeconds}
                  isFinished={isTimerFinished}
                  onDismissFinished={handleDismissFinished}
                />
              </motion.div>
            ) : activeTab === 'tools' ? (
              /* D. Mobile Tools Tab */
              <motion.div
                key="tools-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <KitchenToolsTab onOpenTimer={(s, l) => handleOpenTimer(s, l, true)} />
              </motion.div>
            ) : (
              /* E. My Kitchen Profile Tab */
              <motion.div
                key="kitchen-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <KitchenProfileTab
                  recipes={recipes}
                  onRefreshData={refreshRecipes}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Native Mobile Bottom Tab Bar (Cleanly docked at bottom of container without timer) */}
        <MobileTabBar
          activeTab={activeTab}
          onSelectTab={tab => {
            setSelectedRecipeId(null);
            setActiveTab(tab);
          }}
          onOpenNewRecipe={() => {
            setRecipeToEdit(null);
            setIsFormOpen(true);
          }}
          recipeCount={recipes.length}
          favoriteCount={favoriteRecipes.length}
          isTimerRunning={isTimerRunning}
        />

        {/* Mobile Home Bar Indicator (Phone Chassis bottom bar) */}
        {simulatorView === 'phone-frame' && !isNative && (
          <div className="w-32 h-1 bg-[#2E2520]/60 rounded-full mx-auto mb-1 shrink-0 z-40 pointer-events-none no-print" />
        )}

        {/* Mobile Sheet Modals */}
        <RecipeFormModal
          isOpen={isFormOpen}
          recipeToEdit={recipeToEdit}
          onClose={() => {
            setIsFormOpen(false);
            setRecipeToEdit(null);
          }}
          onSave={handleSaveRecipe}
        />

        <UnitConverterModal
          isOpen={isConverterOpen}
          initialIngredient={converterIngredient}
          onClose={() => setIsConverterOpen(false)}
        />

        {recipeToShare && (
          <ExportShareModal
            isOpen={isShareOpen}
            recipe={recipeToShare}
            onClose={() => {
              setIsShareOpen(false);
              setRecipeToShare(null);
            }}
          />
        )}
      </div>

      {/* Hidden Print Card View (Active when window.print() is called) */}
      {currentRecipe && (
        <div className="hidden print:block print-only p-8 max-w-2xl mx-auto font-serif-display text-black">
          <div className="border-b-2 border-black pb-4 mb-4">
            <h1 className="text-3xl font-bold">{currentRecipe.title}</h1>
            <p className="text-sm italic mt-1">{currentRecipe.description}</p>
            <div className="text-xs mt-2 flex gap-4">
              <span>Category: {currentRecipe.category}</span>
              <span>Prep: {currentRecipe.prepTimeMinutes}m</span>
              <span>Bake: {currentRecipe.bakeTimeMinutes}m</span>
              <span>Oven: {currentRecipe.ovenTemperatureF || 350}°F</span>
              <span>Yield: {currentRecipe.servingsLabel || `${currentRecipe.servings} servings`}</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-gray-300">
              Ingredients
            </h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {currentRecipe.ingredients.map(ing => (
                <li key={ing.id}>
                  <strong>
                    {ing.amount} {ing.unit}
                  </strong>{' '}
                  {ing.name} {ing.notes ? `(${ing.notes})` : ''}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-gray-300">
              Instructions
            </h2>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              {currentRecipe.instructions.map(step => (
                <li key={step.id}>
                  {step.instruction}
                  {step.tip ? ` (Tip: ${step.tip})` : ''}
                </li>
              ))}
            </ol>
          </div>

          {currentRecipe.bakersNotes && (
            <div className="border-t border-gray-300 pt-3">
              <h3 className="text-sm font-bold">Baker's Notes:</h3>
              <p className="text-xs italic">{currentRecipe.bakersNotes}</p>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-500">
            WhiskNote Mobile App — Cozy Home Baking Assistant
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WhiskNoteMobileApp />
    </AuthProvider>
  );
}
