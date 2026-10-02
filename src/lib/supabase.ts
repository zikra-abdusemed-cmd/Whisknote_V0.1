import { createClient } from '@supabase/supabase-js';
import type { Ingredient, InstructionStep, RecipeCategory, RecipeDifficulty } from '../types';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  baking_experience: string | null;
  favorite_category: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  prep_time: number;
  bake_time: number;
  oven_temperature_f: number | null;
  servings: number;
  servings_label: string | null;
  difficulty: string | null;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  notes: string | null;
  is_favorite: boolean;
  image_url: string | null;
  rating: number | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>> & {
  id: string;
};

export type RecipeInsert = Omit<RecipeRow, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseUrl = rawUrl
  ? rawUrl.startsWith('http')
    ? rawUrl
    : `https://${rawUrl}`
  : undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey !== 'your-anon-key'
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

export type AppRecipeCategory = RecipeCategory;
export type AppRecipeDifficulty = RecipeDifficulty;
