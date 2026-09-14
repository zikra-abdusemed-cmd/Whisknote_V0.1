import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Grid,
  List,
  Sparkles,
  Plus,
  RotateCcw,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Recipe, RecipeCategory, RecipeDifficulty } from '../types';
import { RecipeCard } from './RecipeCard';

interface RecipeListProps {
  recipes: Recipe[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onOpenNewRecipe: () => void;
  onResetDefault: () => void;
}

const CATEGORIES: Array<RecipeCategory | 'All'> = [
  'All',
  'Cookies',
  'Cakes',
  'Bread',
  'Pastries',
  'Desserts',
  'Pies & Tarts',
  'Other',
];

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  searchQuery,
  onSearchChange,
  onSelectRecipe,
  onToggleFavorite,
  onOpenNewRecipe,
  onResetDefault,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'All'>('All');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<RecipeDifficulty | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'time' | 'alphabetical' | 'rating'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { All: recipes.length };
    for (const cat of CATEGORIES) {
      if (cat !== 'All') map[cat] = 0;
    }
    for (const r of recipes) {
      map[r.category] = (map[r.category] || 0) + 1;
    }
    return map;
  }, [recipes]);

  // Filtered & sorted recipes
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(recipe => {
        // Category filter
        if (selectedCategory !== 'All' && recipe.category !== selectedCategory) {
          return false;
        }
        // Favorites filter
        if (favoritesOnly && !recipe.isFavorite) {
          return false;
        }
        // Difficulty filter
        if (selectedDifficulty !== 'All' && recipe.difficulty !== selectedDifficulty) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = recipe.title.toLowerCase().includes(q);
          const matchDesc = recipe.description.toLowerCase().includes(q);
          const matchCat = recipe.category.toLowerCase().includes(q);
          const matchIng = recipe.ingredients.some(i => i.name.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchCat && !matchIng) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'time') {
          const timeA = a.prepTimeMinutes + a.bakeTimeMinutes;
          const timeB = b.prepTimeMinutes + b.bakeTimeMinutes;
          return timeA - timeB;
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        return 0;
      });
  }, [recipes, selectedCategory, favoritesOnly, selectedDifficulty, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-print">
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat] || 0;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#C26343] text-white shadow-xs'
                  : 'bg-[#FFFDF9] hover:bg-[#FAF6F1] border border-[#E8DFD8] text-[#66574F]'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#FAF5EE] text-[#8C7A70]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and View Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFDF9] border border-[#E8DFD8] p-3 rounded-2xl shadow-2xs no-print">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Favorites toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-colors ${
              favoritesOnly
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-[#D9CFC7] text-[#66574F] hover:bg-[#FAF6F1]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Difficulty selector */}
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value as RecipeDifficulty | 'All')}
            className="px-3 py-1.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-semibold text-[#66574F] focus:outline-hidden"
          >
            <option value="All">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Artisan">Artisan</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-xl border border-[#D9CFC7] bg-white text-xs font-semibold text-[#66574F] focus:outline-hidden"
          >
            <option value="recent">Newest First</option>
            <option value="time">Shortest Total Time</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* View mode toggle & recipe count */}
        <div className="flex items-center gap-2 ml-auto text-xs text-[#7A6A61]">
          <span className="font-semibold">{filteredRecipes.length} recipes</span>
          <div className="flex border border-[#D9CFC7] rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#C26343] text-white' : 'text-[#66574F] hover:bg-[#FAF5EE]'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-[#C26343] text-white' : 'text-[#66574F] hover:bg-[#FAF5EE]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recipes Grid / List */}
      {filteredRecipes.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
          }
        >
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
              onToggleFavorite={onToggleFavorite}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        /* Friendly empty state */
        <div className="text-center py-16 px-4 bg-[#FFFDF9] border border-[#E8DFD8] rounded-3xl space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-[#FAF3EA] text-[#C26343] mb-1 shadow-2xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-serif-display text-xl font-bold text-[#2E2520]">
            {searchQuery ? 'No baking recipes found' : 'No recipes in this section'}
          </h3>
          <p className="text-xs text-[#7A6A61] max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `We couldn't find any recipes matching "${searchQuery}". Check your spelling or create a fresh recipe!`
              : 'Add your favorite cookies, sourdough, or celebration cakes to your digital notebook.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 rounded-xl border border-[#D9CFC7] text-xs font-bold text-[#66574F] hover:bg-[#FAF5EE]"
              >
                Clear Search Query
              </button>
            ) : null}
            <button
              onClick={onOpenNewRecipe}
              className="px-5 py-2.5 rounded-xl bg-[#C26343] hover:bg-[#AE5638] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Recipe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
