import { Recipe, UserProfile } from '../types';
import { INITIAL_RECIPES } from '../data/initialRecipes';

const STORAGE_KEY_RECIPES = 'whisknote_recipes_v1';
const STORAGE_KEY_USER = 'whisknote_user_v1';

export const DEFAULT_USER: UserProfile = {
  id: 'user-baker-1',
  name: 'Camille Laurent',
  email: 'camille@homebaker.co',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  bakingExperience: 'Home Baker',
  favoriteCategory: 'Cookies',
  joinedDate: 'March 2026',
};

export const StorageService = {
  getRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RECIPES);
      if (!data) {
        this.saveRecipes(INITIAL_RECIPES);
        return INITIAL_RECIPES;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveRecipes(INITIAL_RECIPES);
        return INITIAL_RECIPES;
      }
      return parsed;
    } catch (e) {
      console.error('Error loading recipes from localStorage', e);
      return INITIAL_RECIPES;
    }
  },

  saveRecipes(recipes: Recipe[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
    } catch (e) {
      console.error('Error saving recipes to localStorage', e);
    }
  },

  addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe {
    const existing = this.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newRecipe, ...existing];
    this.saveRecipes(updated);
    return newRecipe;
  },

  updateRecipe(id: string, updates: Partial<Recipe>): Recipe | null {
    const existing = this.getRecipes();
    const idx = existing.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const updatedRecipe: Recipe = {
      ...existing[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    existing[idx] = updatedRecipe;
    this.saveRecipes(existing);
    return updatedRecipe;
  },

  deleteRecipe(id: string): boolean {
    const existing = this.getRecipes();
    const filtered = existing.filter(r => r.id !== id);
    if (filtered.length === existing.length) return false;
    this.saveRecipes(filtered);
    return true;
  },

  toggleFavorite(id: string): boolean {
    const existing = this.getRecipes();
    let newFavStatus = false;
    const updated = existing.map(item => {
      if (item.id === id) {
        newFavStatus = !item.isFavorite;
        return {
          ...item,
          isFavorite: newFavStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    this.saveRecipes(updated);
    return newFavStatus;
  },

  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (!data) {
        this.saveUser(DEFAULT_USER);
        return DEFAULT_USER;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_USER;
    }
  },

  saveUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user profile', e);
    }
  },

  exportJSON(): string {
    const recipes = this.getRecipes();
    return JSON.stringify(
      {
        whiskNoteExportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        recipes,
      },
      null,
      2
    );
  },

  importJSON(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const incoming = parsed.recipes || parsed;
      if (!Array.isArray(incoming)) {
        return { success: false, count: 0, error: 'Invalid JSON format: expected an array of recipes.' };
      }
      const existing = this.getRecipes();
      const existingIds = new Set(existing.map(r => r.id));
      let count = 0;

      const merged = [...existing];
      for (const item of incoming) {
        if (item.title && Array.isArray(item.ingredients)) {
          if (existingIds.has(item.id)) {
            item.id = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          }
          merged.unshift(item);
          count++;
        }
      }
      this.saveRecipes(merged);
      return { success: true, count };
    } catch (err) {
      return { success: false, count: 0, error: (err as Error).message };
    }
  },

  resetToDefault(): Recipe[] {
    this.saveRecipes(INITIAL_RECIPES);
    return INITIAL_RECIPES;
  },
};
