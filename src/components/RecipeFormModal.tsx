import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Clock,
  Flame,
  Users,
  AlertCircle,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Recipe, RecipeCategory, Ingredient, InstructionStep, AISuggestion, RecipeDifficulty } from '../types';

interface RecipeFormModalProps {
  recipeToEdit?: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CATEGORIES: RecipeCategory[] = [
  'Cookies',
  'Cakes',
  'Bread',
  'Pastries',
  'Desserts',
  'Pies & Tarts',
  'Other',
];

const PRESET_IMAGES = [
  { label: 'Chocolate Cookies', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Artisan Sourdough', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Lemon Layer Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Apple Galette', url: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Croissants & Pastry', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Fresh Berry Tart', url: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=1200&q=80' },
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  recipeToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(recipeToEdit?.title || '');
  const [description, setDescription] = useState(recipeToEdit?.description || '');
  const [category, setCategory] = useState<RecipeCategory>(recipeToEdit?.category || 'Cookies');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(recipeToEdit?.difficulty || 'Moderate');
  const [imageUrl, setImageUrl] = useState(recipeToEdit?.imageUrl || PRESET_IMAGES[0].url);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(recipeToEdit?.prepTimeMinutes || 20);
  const [bakeTimeMinutes, setBakeTimeMinutes] = useState(recipeToEdit?.bakeTimeMinutes || 15);
  const [ovenTemperatureF, setOvenTemperatureF] = useState(recipeToEdit?.ovenTemperatureF || 350);
  const [servings, setServings] = useState(recipeToEdit?.servings || 12);
  const [servingsLabel, setServingsLabel] = useState(recipeToEdit?.servingsLabel || '12 pieces');
  const [bakersNotes, setBakersNotes] = useState(recipeToEdit?.bakersNotes || '');
  const [isFavorite, setIsFavorite] = useState(recipeToEdit?.isFavorite || false);

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipeToEdit?.ingredients || [
      { id: '1', name: 'All-Purpose Flour', amount: '2', unit: 'cups', notes: '' },
      { id: '2', name: 'Granulated Sugar', amount: '1', unit: 'cup', notes: '' },
      { id: '3', name: 'Unsalted Butter', amount: '1/2', unit: 'cup', notes: 'softened' },
      { id: '4', name: 'Large Eggs', amount: '2', unit: 'pieces', notes: 'room temperature' },
    ]
  );

  // Instructions state
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    recipeToEdit?.instructions || [
      { id: 's1', stepNumber: 1, instruction: 'Preheat oven to 350°F (175°C) and line baking tray with parchment.', durationMinutes: 10 },
      { id: 's2', stepNumber: 2, instruction: 'In a large mixing bowl, cream butter and sugar until light and fluffy.', durationMinutes: 3 },
      { id: 's3', stepNumber: 3, instruction: 'Add eggs one at a time, followed by dry ingredients. Mix until smooth.' },
      { id: 's4', stepNumber: 4, instruction: 'Bake for 12-15 minutes until golden brown around edges.', durationMinutes: 15 },
    ]
  );

  // AI Suggestion state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiBakerTip, setAiBakerTip] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [addedSuggestionNames, setAddedSuggestionNames] = useState<Set<string>>(new Set());

  // Form error
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local image upload (converts to base64 DataURL for offline storage)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Ingredients operations
  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      {
        id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: '',
        amount: '1',
        unit: 'cup',
        notes: '',
      },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientRow = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Instructions operations
  const addInstructionRow = () => {
    setInstructions([
      ...instructions,
      {
        id: `step-${Date.now()}`,
        stepNumber: instructions.length + 1,
        instruction: '',
      },
    ]);
  };

  const removeInstructionRow = (index: number) => {
    if (instructions.length <= 1) return;
    const filtered = instructions
      .filter((_, i) => i !== index)
      .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    setInstructions(filtered);
  };

  const updateInstructionRow = (index: number, field: keyof InstructionStep, value: string | number) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: value };
    setInstructions(updated);
  };

  const moveInstruction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === instructions.length - 1) return;

    const newIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...instructions];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;

    const updated = reordered.map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    setInstructions(updated);
  };

  // AI Ingredient Suggestions
  const handleFetchAiSuggestions = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const currentList = ingredients.map(i => i.name.trim()).filter(Boolean);
      const res = await fetch('/api/ai/suggest-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeTitle: title || 'Untitled Bake',
          category,
          currentIngredients: currentList,
        }),
      });

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
        setAiBakerTip(data.bakerTip || null);
      } else {
        setAiError('Could not fetch suggestions at this moment.');
      }
    } catch (e) {
      console.error('Failed to get AI suggestions', e);
      setAiError('Offline or network unavailable. Showing curated recommendations.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddAiSuggestion = (suggestion: AISuggestion) => {
    setIngredients(prev => [
      ...prev,
      {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: suggestion.name,
        amount: suggestion.amount || '1',
        unit: suggestion.unit || 'tsp',
        notes: suggestion.reason,
      },
    ]);
    setAddedSuggestionNames(prev => new Set(prev).add(suggestion.name));
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a recipe title.');
      return;
    }

    const cleanIngredients = ingredients.filter(i => i.name.trim().length > 0);
    if (cleanIngredients.length === 0) {
      setFormError('Please add at least one ingredient.');
      return;
    }

    const cleanInstructions = instructions.filter(s => s.instruction.trim().length > 0);
    if (cleanInstructions.length === 0) {
      setFormError('Please add at least one instruction step.');
      return;
    }

    setFormError(null);
    onSave({
      title: title.trim(),
      description: description.trim() || 'A delicious homemade recipe.',
      category,
      difficulty,
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      prepTimeMinutes: Number(prepTimeMinutes) || 15,
      bakeTimeMinutes: Number(bakeTimeMinutes) || 15,
      ovenTemperatureF: Number(ovenTemperatureF) || 350,
      servings: Number(servings) || 8,
      servingsLabel: servingsLabel.trim() || `${servings} servings`,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      bakersNotes: bakersNotes.trim(),
      isFavorite,
      rating: recipeToEdit?.rating || 5,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] border border-[#E8DFD8] rounded-t-3xl sm:rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#D9CFC7] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#EFE8DF] flex items-center justify-between bg-[#FAF5EE]">
          <div>
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#2E2520]">
              {recipeToEdit ? 'Edit Recipe' : 'New Baking Recipe'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A6A61]">Add your baking measurements, steps, and baker's secret touches</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#85766E] hover:text-[#2E2520] hover:bg-[#EDE5DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Brown Butter Chocolate Chunk Cookies"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-base font-semibold text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">
                Description & Flavor Profile
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="What makes this bake special? (e.g. Crisp edges, chewy molten center with caramelized toffee...)"
                className="w-full px-4 py-2 rounded-xl border border-[#D9CFC7] bg-white text-xs text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as RecipeCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC7] bg-white text-xs font-semibold text-[#2E2520]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider mb-1">Difficulty</label>
                <div className="flex gap-2">
                  {(['Easy', 'Moderate', 'Artisan'] as RecipeDifficulty[]).map(diff => (
                    <button
                      type="button"
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                        difficulty === diff
                          ? 'bg-[#C26343] text-white border-[#C26343]'
                          : 'bg-white text-[#66574F] border-[#D9CFC7] hover:bg-[#FAF5EE]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Oven & Timing Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF5EE] p-4 rounded-2xl border border-[#EAE1D7]">
              <div>
                <label className="text-[11px] font-bold text-[#7A6A61] flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#C26343]" /> Prep (mins)
                </label>
                <input
                  type="number"
                  min="1"
                  value={prepTimeMinutes}
                  onChange={e => setPrepTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#7A6A61] flex items-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-[#C26343]" /> Bake (mins)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bakeTimeMinutes}
                  onChange={e => setBakeTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#7A6A61] flex items-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-[#C26343]" /> Oven Temp (°F)
                </label>
                <input
                  type="number"
                  step="25"
                  value={ovenTemperatureF}
                  onChange={e => setOvenTemperatureF(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#7A6A61] flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#C26343]" /> Servings / Yield
                </label>
                <input
                  type="text"
                  value={servingsLabel}
                  onChange={e => {
                    setServingsLabel(e.target.value);
                    const match = e.target.value.match(/\d+/);
                    if (match) setServings(parseInt(match[0], 10));
                  }}
                  placeholder="e.g. 12 cookies"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Photography & Image */}
          <div className="space-y-3 pt-2 border-t border-[#EFE8DF]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider">
                Recipe Image & Photography
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#C26343] font-bold hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Upload from Device
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Preview Banner */}
            <div className="relative h-44 rounded-2xl overflow-hidden border border-[#E5DDD4] bg-[#F2ECE4] group">
              <img
                src={imageUrl}
                alt="Recipe preview"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs font-medium text-white/90">
                  Image preview (stored safely for offline use)
                </span>
              </div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-semibold text-[#8C7A70] block mb-1.5">Or choose a bakery preset photo:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map(preset => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setImageUrl(preset.url)}
                    className={`p-1 rounded-xl border text-left transition-all ${
                      imageUrl === preset.url
                        ? 'border-[#C26343] ring-2 ring-[#C26343]/30 bg-[#FAF5EE]'
                        : 'border-[#E2D8CF] hover:border-[#C26343] bg-white'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-12 rounded-lg object-cover mb-1" />
                    <span className="block text-[10px] font-medium text-[#443831] truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Ingredients with AI Suggester */}
          <div className="space-y-3 pt-2 border-t border-[#EFE8DF]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#66574F] uppercase tracking-wider">Ingredients List *</h3>
                <p className="text-[11px] text-[#8C7A70]">Specify quantity, unit, ingredient, and notes</p>
              </div>

              {/* AI Suggestion Button */}
              <button
                type="button"
                onClick={handleFetchAiSuggestions}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    Analyzing dough & spices...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    AI Ingredient Suggestions
                  </>
                )}
              </button>
            </div>

            {/* AI Suggestions Drawer if available */}
            {aiSuggestions.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Suggested Flavor Pairings
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiSuggestions([])}
                    className="text-xs text-amber-700 hover:text-amber-900"
                  >
                    Dismiss
                  </button>
                </div>

                {aiBakerTip && (
                  <p className="text-xs text-amber-800 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 italic">
                    💡 {aiBakerTip}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiSuggestions.map(sugg => {
                    const isAdded = addedSuggestionNames.has(sugg.name);
                    return (
                      <div
                        key={sugg.name}
                        className="bg-white/90 p-2.5 rounded-xl border border-amber-200/70 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#2E2520]">
                            {sugg.amount} {sugg.unit} {sugg.name}
                          </div>
                          <p className="text-[11px] text-[#7A6A61] mt-0.5">{sugg.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddAiSuggestion(sugg)}
                          disabled={isAdded}
                          className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                              : 'bg-[#C26343] hover:bg-[#AE5638] text-white'
                          }`}
                        >
                          {isAdded ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" /> Added
                            </span>
                          ) : (
                            '+ Add'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-2.5 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-center justify-between">
                <span>{aiError}</span>
                <button
                  type="button"
                  onClick={() => setAiError(null)}
                  className="text-amber-900 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Ingredients table inputs */}
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id}
                  className="flex items-center gap-2 bg-[#FAF6F1] p-2 rounded-xl border border-[#E7DDD3]"
                >
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={e => updateIngredientRow(idx, 'amount', e.target.value)}
                    placeholder="2 or 1/2"
                    className="w-16 sm:w-20 px-2.5 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-bold text-[#2E2520]"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={e => updateIngredientRow(idx, 'unit', e.target.value)}
                    placeholder="cup / g / tsp"
                    className="w-20 sm:w-24 px-2.5 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-medium text-[#2E2520]"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={e => updateIngredientRow(idx, 'name', e.target.value)}
                    placeholder="Ingredient (e.g. Unsalted Butter)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs font-semibold text-[#2E2520]"
                  />
                  <input
                    type="text"
                    value={ing.notes || ''}
                    onChange={e => updateIngredientRow(idx, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="hidden sm:block w-36 px-2.5 py-1.5 rounded-lg border border-[#D9CFC7] bg-white text-xs text-[#7A6A61]"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    disabled={ingredients.length <= 1}
                    className="p-1.5 text-[#A8988F] hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addIngredientRow}
                className="w-full py-2 border-2 border-dashed border-[#D9CFC7] hover:border-[#C26343] rounded-xl text-xs font-bold text-[#7A6A61] hover:text-[#C26343] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Another Ingredient
              </button>
            </div>
          </div>

          {/* Section 4: Instructions / Steps */}
          <div className="space-y-3 pt-2 border-t border-[#EFE8DF]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#66574F] uppercase tracking-wider">Step-by-Step Instructions *</h3>
                <p className="text-[11px] text-[#8C7A70]">Clear guidance for mixing, proofing, and baking</p>
              </div>
            </div>

            <div className="space-y-3">
              {instructions.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-[#FAF6F1] p-3.5 rounded-xl border border-[#E7DDD3] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C26343] bg-[#C26343]/10 px-2 py-0.5 rounded-md">
                      Step {step.stepNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveInstruction(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-[#8C7A70] hover:text-[#2E2520] disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveInstruction(idx, 'down')}
                        disabled={idx === instructions.length - 1}
                        className="p-1 text-[#8C7A70] hover:text-[#2E2520] disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeInstructionRow(idx)}
                        disabled={instructions.length <= 1}
                        className="p-1 text-[#A8988F] hover:text-red-600 disabled:opacity-30 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={e => updateInstructionRow(idx, 'instruction', e.target.value)}
                    placeholder="Describe this step clearly..."
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC7] bg-white text-xs text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
                  />

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-[#7A6A61]">
                      <Clock className="w-3.5 h-3.5 text-[#C26343]" />
                      <span>Timer (mins):</span>
                      <input
                        type="number"
                        min="0"
                        value={step.durationMinutes || ''}
                        onChange={e =>
                          updateInstructionRow(
                            idx,
                            'durationMinutes',
                            e.target.value ? parseInt(e.target.value, 10) : 0
                          )
                        }
                        placeholder="Optional"
                        className="w-16 px-2 py-1 rounded-md border border-[#D9CFC7] bg-white text-xs font-semibold text-[#2E2520]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addInstructionRow}
                className="w-full py-2 border-2 border-dashed border-[#D9CFC7] hover:border-[#C26343] rounded-xl text-xs font-bold text-[#7A6A61] hover:text-[#C26343] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Next Step
              </button>
            </div>
          </div>

          {/* Section 5: Baker's Notes */}
          <div className="space-y-2 pt-2 border-t border-[#EFE8DF]">
            <label className="block text-xs font-bold text-[#66574F] uppercase tracking-wider">
              Baker's Notes & Artisan Secrets
            </label>
            <textarea
              rows={2}
              value={bakersNotes}
              onChange={e => setBakersNotes(e.target.value)}
              placeholder="e.g. Dough hydration tips, chilling times, high-altitude oven adjustments, brand recommendations..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9CFC7] bg-white text-xs text-[#2E2520] focus:ring-2 focus:ring-[#C26343]/30 focus:outline-hidden"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EFE8DF] bg-[#FAF5EE] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A6A61] hover:bg-[#EDE5DC] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold shadow-sm transition-all"
          >
            {recipeToEdit ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
};
