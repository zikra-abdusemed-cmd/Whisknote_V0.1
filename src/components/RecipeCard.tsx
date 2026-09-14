import React from 'react';
import { Clock, Flame, Heart, Users, Star } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  viewMode: 'grid' | 'list';
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onToggleFavorite,
  viewMode,
}) => {
  const fallbackImage = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80';

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(recipe)}
        className="group bg-[#FFFDF9] hover:bg-[#FAF6F1] border border-[#E8DFD8] hover:border-[#C26343]/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        <div className="relative w-full sm:w-36 h-28 shrink-0 rounded-xl overflow-hidden bg-[#EDE5DC]">
          <img
            src={recipe.imageUrl || fallbackImage}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
          <button
            onClick={e => onToggleFavorite(e, recipe.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#C26343] uppercase tracking-wider">
              {recipe.category}
            </span>
            <span className="text-[10px] text-[#8C7A70]">•</span>
            <span className="text-[11px] font-semibold text-[#8C7A70]">
              {recipe.difficulty}
            </span>
          </div>

          <h3 className="font-serif-display text-base font-bold text-[#2E2520] group-hover:text-[#C26343] transition-colors truncate">
            {recipe.title}
          </h3>

          <p className="text-xs text-[#66574F] line-clamp-1 mt-1">
            {recipe.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#7A6A61]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C26343]" />
              {recipe.prepTimeMinutes + recipe.bakeTimeMinutes}m total
            </span>
            {recipe.ovenTemperatureF && (
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#C26343]" />
                {recipe.ovenTemperatureF}°F
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#C26343]" />
              {recipe.servings} servings
            </span>
            {recipe.rating && (
              <span className="flex items-center gap-1 text-amber-600 font-bold ml-auto">
                <Star className="w-3.5 h-3.5 fill-current" />
                {recipe.rating}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group bg-[#FFFDF9] hover:bg-[#FAF6F1] border border-[#E8DFD8] hover:border-[#C26343]/50 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col"
    >
      {/* Photo banner */}
      <div className="relative h-48 w-full bg-[#EDE5DC] overflow-hidden">
        <img
          src={recipe.imageUrl || fallbackImage}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />
        
        {/* Category tag */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-[#FFFDF9]/95 text-[#2E2520] text-[11px] font-bold shadow-xs backdrop-blur-xs">
            {recipe.category}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={e => onToggleFavorite(e, recipe.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
        >
          <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Oven temperature badge bottom right */}
        {recipe.ovenTemperatureF && (
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-white text-[11px] font-semibold bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Flame className="w-3 h-3 text-amber-400" /> {recipe.ovenTemperatureF}°F
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#8C7A70] mb-1">
            <span>{recipe.difficulty}</span>
            {recipe.rating && (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3 h-3 fill-current" /> {recipe.rating}
              </span>
            )}
          </div>

          <h3 className="font-serif-display text-base font-bold text-[#2E2520] group-hover:text-[#C26343] transition-colors line-clamp-1">
            {recipe.title}
          </h3>

          <p className="text-xs text-[#66574F] line-clamp-2 mt-1 leading-relaxed">
            {recipe.description}
          </p>
        </div>

        {/* Bottom stats */}
        <div className="pt-2 border-t border-[#EFE8DF] flex items-center justify-between text-xs text-[#7A6A61]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#C26343]" />
            {recipe.prepTimeMinutes + recipe.bakeTimeMinutes} mins
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#C26343]" />
            {recipe.servings} servings
          </span>
        </div>
      </div>
    </div>
  );
};
