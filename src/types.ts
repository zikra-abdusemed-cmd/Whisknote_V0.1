export type RecipeCategory =
  | 'Cakes'
  | 'Cookies'
  | 'Bread'
  | 'Pastries'
  | 'Desserts'
  | 'Pies & Tarts'
  | 'Other';

export type RecipeDifficulty = 'Easy' | 'Moderate' | 'Artisan';

export interface Ingredient {
  id: string;
  name: string;
  amount: string; // e.g. "2", "1/2", "250"
  unit: string;   // e.g. "cups", "g", "tsp", "tbsp", "ml", "pieces", "pinch"
  notes?: string; // e.g. "room temperature", "browned and cooled"
}

export interface InstructionStep {
  id: string;
  stepNumber: number;
  instruction: string;
  durationMinutes?: number; // Optional timer for this step
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  imageUrl?: string;
  prepTimeMinutes: number;
  bakeTimeMinutes: number;
  ovenTemperatureF?: number;
  servings: number;
  servingsLabel?: string; // e.g. "12 cookies", "1 loaf", "8 slices"
  difficulty: RecipeDifficulty;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  bakersNotes?: string;
  isFavorite: boolean;
  rating?: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bakingExperience: 'Beginner' | 'Home Baker' | 'Artisan Pastry';
  favoriteCategory: RecipeCategory;
  joinedDate: string;
}

export interface AISuggestion {
  name: string;
  amount: string;
  unit: string;
  reason: string;
}

export interface UnitConversionResult {
  convertedAmount: number;
  formattedResult: string;
  ingredientName?: string;
  notes?: string;
}
