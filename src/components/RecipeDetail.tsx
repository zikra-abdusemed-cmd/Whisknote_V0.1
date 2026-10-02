import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Edit3,
  Trash2,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  Circle,
  Timer,
  Sparkles,
  Scale,
  Minus,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Recipe } from '../types';
import { scaleIngredientAmount, convertFahrenheitToCelsius } from '../utils/conversions';
import { triggerHaptic, hapticSuccess } from '../utils/haptics';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenShare: (recipe: Recipe) => void;
  onOpenTimer: (seconds: number, label: string) => void;
  onOpenConverter: (ingredientName?: string) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenShare,
  onOpenTimer,
  onOpenConverter,
}) => {
  // State for servings scaler
  const [currentServings, setCurrentServings] = useState<number>(recipe.servings || 8);

  // State for oven temperature toggle (°F / °C)
  const [isCelsius, setIsCelsius] = useState<boolean>(false);

  // Checked ingredients (so the home baker can check off what they measured)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  // Completed instruction steps
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const toggleIngredientCheck = (id: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      void triggerHaptic(8);
    }
    setCheckedIngredients(next);
  };

  const toggleStepCheck = (id: string) => {
    const next = new Set(completedSteps);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      void hapticSuccess();
    }
    setCompletedSteps(next);
  };

  const ovenTempF = recipe.ovenTemperatureF || 350;
  const ovenTempC = convertFahrenheitToCelsius(ovenTempF).c;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex items-center justify-between py-4 mb-3 no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#66574F] hover:text-[#2E2520] px-3 py-1.5 rounded-xl hover:bg-[#EFE8DF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Recipes
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void triggerHaptic(12);
              onToggleFavorite(recipe.id);
            }}
            title="Toggle Favorite"
            className={`p-2 rounded-xl border transition-colors ${
              recipe.isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-[#E2D8CF] text-[#7A6A61] hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onOpenShare(recipe)}
            title="Share & Print"
            className="p-2 rounded-xl bg-white border border-[#E2D8CF] text-[#7A6A61] hover:text-[#2E2520] hover:bg-[#FAF6F0] transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(recipe)}
            title="Edit Recipe"
            className="p-2 rounded-xl bg-white border border-[#E2D8CF] text-[#7A6A61] hover:text-[#2E2520] hover:bg-[#FAF6F0] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Recipe"
            className="p-2 rounded-xl bg-white border border-[#E2D8CF] text-[#7A6A61] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs no-print">
          <div className="bg-[#FFFDF9] border border-[#E8DFD8] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#2E2520]">Delete Recipe?</h3>
            <p className="text-xs text-[#7A6A61] leading-relaxed">
              Are you sure you want to remove <strong>"{recipe.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-[#66574F] rounded-xl hover:bg-[#EFE8DF]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(recipe.id);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Photography & Header Container */}
      <div className="bg-[#FFFDF9] border border-[#E8DFD8] rounded-3xl overflow-hidden shadow-xs">
        {/* Photo */}
        <div className="relative h-72 sm:h-96 w-full bg-[#EDE5DC] overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#C26343] text-white text-xs font-bold shadow-xs">
                {recipe.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-semibold">
                {recipe.difficulty}
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {recipe.title}
            </h1>
          </div>
        </div>

        {/* Recipe Overview Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-base text-[#5C4F47] leading-relaxed italic">
            "{recipe.description}"
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF5EE] rounded-2xl border border-[#EAE1D7]">
            {/* Prep */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white text-[#C26343] shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#8C7A70] uppercase tracking-wider block">Prep Time</span>
                <span className="text-sm font-bold text-[#2E2520]">{recipe.prepTimeMinutes} mins</span>
              </div>
            </div>

            {/* Bake */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#C26343] shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C7A70] uppercase tracking-wider block">Bake Time</span>
                  <span className="text-sm font-bold text-[#2E2520]">{recipe.bakeTimeMinutes} mins</span>
                </div>
              </div>
              {recipe.bakeTimeMinutes > 0 && (
                <button
                  onClick={() => onOpenTimer(recipe.bakeTimeMinutes * 60, `${recipe.title} (Oven Bake)`)}
                  title="Start bake timer"
                  className="p-1.5 rounded-lg bg-[#C26343]/15 text-[#C26343] hover:bg-[#C26343] hover:text-white transition-colors"
                >
                  <Timer className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Oven Temp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#C26343] shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C7A70] uppercase tracking-wider block">Oven Temp</span>
                  <span className="text-sm font-bold text-[#2E2520]">
                    {isCelsius ? `${ovenTempC}°C` : `${ovenTempF}°F`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCelsius(!isCelsius)}
                className="text-[10px] font-bold text-[#C26343] bg-white px-1.5 py-0.5 rounded-md border border-[#D9CFC7] hover:bg-[#FAF5EE]"
              >
                {isCelsius ? '°F' : '°C'}
              </button>
            </div>

            {/* Servings scaler */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#C26343] shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C7A70] uppercase tracking-wider block">Yield</span>
                  <span className="text-sm font-bold text-[#2E2520]">{currentServings} servings</span>
                </div>
              </div>

              {/* Scaler controls */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#D9CFC7]">
                <button
                  onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                  className="p-0.5 text-[#66574F] hover:text-[#C26343]"
                  title="Scale down"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentServings(currentServings + 1)}
                  className="p-0.5 text-[#66574F] hover:text-[#C26343]"
                  title="Scale up"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Recipe Content Grid (Ingredients & Instructions) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {/* Ingredients Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#2E2520]">Ingredients</h3>
                  <p className="text-[11px] text-[#8C7A70]">Tap to cross off as you measure</p>
                </div>
                <button
                  onClick={() => onOpenConverter()}
                  className="text-xs text-[#C26343] font-bold flex items-center gap-1 hover:underline"
                >
                  <Scale className="w-3.5 h-3.5" /> Unit Converter
                </button>
              </div>

              <div className="space-y-2">
                {recipe.ingredients.map(ing => {
                  const isChecked = checkedIngredients.has(ing.id);
                  const scaledAmount = scaleIngredientAmount(ing.amount, recipe.servings, currentServings);

                  return (
                    <div
                      key={ing.id}
                      onClick={() => toggleIngredientCheck(ing.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#F2ECE4]/60 border-[#E5DDD4] text-[#948378]'
                          : 'bg-[#FAF6F1] border-[#EAE0D6] hover:border-[#C26343]/50 text-[#2E2520]'
                      }`}
                    >
                      <button className="mt-0.5 text-[#C26343]">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-[#588157]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#A39287]" />
                        )}
                      </button>
                      <div className="flex-1 text-xs">
                        <span className={`font-bold ${isChecked ? 'line-through text-[#948378]' : 'text-[#8D3B20]'}`}>
                          {scaledAmount} {ing.unit}
                        </span>{' '}
                        <span className={`font-medium ${isChecked ? 'line-through' : ''}`}>
                          {ing.name}
                        </span>
                        {ing.notes && (
                          <span className="block text-[11px] text-[#7A6A61] italic mt-0.5">
                            ({ing.notes})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#EAE1D7] text-xs text-[#66574F] flex items-center justify-between">
                <span>
                  Ingredients Prepared: {checkedIngredients.size} / {recipe.ingredients.length}
                </span>
                {checkedIngredients.size === recipe.ingredients.length && (
                  <span className="text-[#588157] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Mix!
                  </span>
                )}
              </div>
            </div>

            {/* Instructions Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DF]">
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[#2E2520]">Baking Instructions</h3>
                  <p className="text-[11px] text-[#8C7A70]">Step-by-step guidance & timing</p>
                </div>
                <span className="text-xs font-semibold text-[#8C7A70]">
                  {completedSteps.size} of {recipe.instructions.length} completed
                </span>
              </div>

              <div className="space-y-3.5">
                {recipe.instructions.map(step => {
                  const isDone = completedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-[#F2ECE4]/60 border-[#E5DDD4] text-[#948378]'
                          : 'bg-[#FFFDF9] border-[#E8DFD8] shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStepCheck(step.id)}
                            className="text-[#C26343] hover:scale-110 transition-transform"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-[#588157]" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#A39287]" />
                            )}
                          </button>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              isDone ? 'bg-[#E5DDD4] text-[#7A6A61]' : 'bg-[#C26343]/15 text-[#C26343]'
                            }`}
                          >
                            Step {step.stepNumber}
                          </span>
                        </div>

                        {step.durationMinutes && step.durationMinutes > 0 && (
                          <button
                            onClick={() =>
                              onOpenTimer(
                                (step.durationMinutes || 5) * 60,
                                `${recipe.title} - Step ${step.stepNumber}`
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#C26343] bg-[#FAF5EE] border border-[#EAE1D7] px-2.5 py-1 rounded-lg hover:bg-[#C26343] hover:text-white transition-colors"
                          >
                            <Timer className="w-3.5 h-3.5" />
                            {step.durationMinutes}m Timer
                          </button>
                        )}
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed pl-7 ${isDone ? 'line-through text-[#948378]' : 'text-[#332A24]'}`}>
                        {step.instruction}
                      </p>

                      {step.tip && (
                        <div className="mt-2.5 ml-7 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <p>
                            <strong>Baker's Tip:</strong> {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Baker's Notes Section */}
          {recipe.bakersNotes && (
            <div className="pt-4 border-t border-[#EFE8DF]">
              <div className="p-5 rounded-2xl bg-[#F6EDE3] border border-[#E2D4C6] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A5442] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C26343]" /> Baker's Notes & Artisan Secrets
                </h4>
                <p className="text-xs sm:text-sm text-[#4A3C34] leading-relaxed whitespace-pre-wrap">
                  {recipe.bakersNotes}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
