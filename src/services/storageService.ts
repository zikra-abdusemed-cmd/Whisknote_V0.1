import { Recipe, UserProfile } from '../types';
import { INITIAL_RECIPES } from '../data/initialRecipes';
import { isSupabaseConfigured, supabase, type RecipeRow } from '../lib/supabase';

const STORAGE_KEY_RECIPES = 'whisknote_recipes_v1';
const STORAGE_KEY_USER = 'whisknote_user_v1';
const STORAGE_KEY_PENDING = 'whisknote_pending_ops_v1';
const STORAGE_KEY_DELETED = 'whisknote_deleted_ids_v1';
/** Pre-namespacing builds kept one shared notebook and recorded which account owned it here. */
const LEGACY_KEY_OWNER = 'whisknote_data_owner_v1';
const STORAGE_KEY_SEEDED = 'whisknote_samples_seeded_v1';
const IDB_NAME = 'whisknote_offline';
const IDB_STORE = 'kv';

/** Fired on window whenever the local recipe list changes (e.g. after a background cloud sync). */
export const RECIPES_CHANGED_EVENT = 'whisknote:recipes-changed';

export const DEFAULT_USER: UserProfile = {
  id: 'user-baker-1',
  name: 'Camille Laurent',
  email: 'camille@homebaker.co',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  bakingExperience: 'Home Baker',
  favoriteCategory: 'Cookies',
  joinedDate: 'March 2026',
};

type PendingOp =
  | { type: 'upsert'; recipeId: string; at: string }
  | { type: 'delete'; recipeId: string; at: string };

let syncInFlight: Promise<Recipe[]> | null = null;
let currentUserId: string | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/** IndexedDB mirror for larger offline payloads (falls back silently). */
function openIdb(): Promise<IDBDatabase | null> {
  if (!isBrowser() || !('indexedDB' in window)) return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  await new Promise<void>(resolve => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIdb();
  if (!db) return null;
  const result = await new Promise<T | null>(resolve => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => resolve(null);
  });
  db.close();
  return result;
}

/**
 * Every signed-in account gets its own on-device notebook (keys suffixed with the
 * user id), so accounts sharing a device never see or upload each other's recipes
 * and nothing is lost on sign-out. `null` is the guest/demo notebook.
 */
type Scope = string | null;

function scopedKey(base: string, scope: Scope): string {
  return scope ? `${base}::${scope}` : base;
}

function readLocalRecipes(scope: Scope = currentUserId): Recipe[] {
  if (!isBrowser()) return INITIAL_RECIPES;
  try {
    const data = localStorage.getItem(scopedKey(STORAGE_KEY_RECIPES, scope));
    if (!data) {
      // Guests start with the sample collection; accounts start empty and are
      // filled (or seeded once) by the first cloud sync.
      if (scope) return [];
      writeLocalRecipes(INITIAL_RECIPES, scope);
      return INITIAL_RECIPES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch (e) {
    console.error('Error loading recipes from localStorage', e);
    return scope ? [] : INITIAL_RECIPES;
  }
}

function writeLocalRecipes(recipes: Recipe[], scope: Scope = currentUserId): void {
  if (!isBrowser()) return;
  try {
    const key = scopedKey(STORAGE_KEY_RECIPES, scope);
    localStorage.setItem(key, JSON.stringify(recipes));
    void idbSet(key, recipes);
    if (scope === currentUserId) {
      window.dispatchEvent(new Event(RECIPES_CHANGED_EVENT));
    }
  } catch (e) {
    console.error('Error saving recipes to localStorage', e);
  }
}

function moveKey(from: string, to: string): void {
  const value = localStorage.getItem(from);
  if (value !== null && localStorage.getItem(to) === null) {
    localStorage.setItem(to, value);
  }
  localStorage.removeItem(from);
}

/**
 * One-time migration from the single shared notebook: if it was bound to an
 * account, move it into that account's own notebook.
 */
function migrateLegacyOwnedNotebook(): void {
  const owner = localStorage.getItem(LEGACY_KEY_OWNER);
  if (!owner) return;
  for (const base of [STORAGE_KEY_RECIPES, STORAGE_KEY_PENDING, STORAGE_KEY_DELETED]) {
    moveKey(base, scopedKey(base, owner));
  }
  localStorage.removeItem(LEGACY_KEY_OWNER);
}

/**
 * First sign-in of an account on this device: carry over recipes the person
 * created as a guest (but not the bundled samples) so trying the app before
 * signing up doesn't lose anything.
 */
function adoptGuestRecipes(userId: string): void {
  if (localStorage.getItem(scopedKey(STORAGE_KEY_RECIPES, userId)) !== null) return;
  const guest = readLocalRecipes(null);
  const sampleIds = new Set(INITIAL_RECIPES.map(r => r.id));
  const custom = guest.filter(r => !sampleIds.has(r.id));
  if (!custom.length) return;
  writeLocalRecipes(custom, userId);
  writeLocalRecipes(guest.filter(r => sampleIds.has(r.id)), null);
}

/** Fresh copies of the sample recipes with real UUIDs, for seeding a new account once. */
function freshSampleRecipes(): Recipe[] {
  const now = new Date().toISOString();
  return INITIAL_RECIPES.map(r => ({ ...r, id: newId(), createdAt: now, updatedAt: now }));
}

const SAFE_IMAGE_URL = /^(https:\/\/|data:image\/(png|jpe?g|webp|gif|heic);base64,)/i;

function str(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback;
}

function num(v: unknown, fallback: number, min = 0, max = 100000): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

const CATEGORIES: Recipe['category'][] = ['Cakes', 'Cookies', 'Bread', 'Pastries', 'Desserts', 'Pies & Tarts', 'Other'];
const DIFFICULTIES: Recipe['difficulty'][] = ['Easy', 'Moderate', 'Artisan'];

/** Coerce untrusted (imported) data into a well-formed Recipe, or null if unusable. */
function sanitizeImportedRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title, 200).trim();
  if (!title || !Array.isArray(r.ingredients)) return null;

  const ingredients = r.ingredients
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
    .slice(0, 200)
    .map((i, idx) => ({
      id: str(i.id, 100) || `ing-${idx}-${Date.now()}`,
      name: str(i.name, 300),
      amount: str(String(i.amount ?? ''), 50),
      unit: str(i.unit, 50),
      notes: str(i.notes, 500) || undefined,
    }));
  const instructions = (Array.isArray(r.instructions) ? r.instructions : [])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .slice(0, 200)
    .map((s, idx) => ({
      id: str(s.id, 100) || `step-${idx}-${Date.now()}`,
      stepNumber: num(s.stepNumber, idx + 1, 1, 1000),
      instruction: str(s.instruction, 5000),
      durationMinutes: s.durationMinutes == null ? undefined : num(s.durationMinutes, 0, 0, 10000),
      tip: str(s.tip, 1000) || undefined,
    }));
  const imageUrl = str(r.imageUrl, 3_000_000);
  const now = new Date().toISOString();

  return {
    id: typeof r.id === 'string' && isUuid(r.id) ? r.id : newId(),
    title,
    description: str(r.description, 2000),
    category: CATEGORIES.includes(r.category as Recipe['category']) ? (r.category as Recipe['category']) : 'Other',
    imageUrl: SAFE_IMAGE_URL.test(imageUrl) ? imageUrl : undefined,
    prepTimeMinutes: num(r.prepTimeMinutes, 0, 0, 10000),
    bakeTimeMinutes: num(r.bakeTimeMinutes, 0, 0, 10000),
    ovenTemperatureF: r.ovenTemperatureF == null ? undefined : num(r.ovenTemperatureF, 350, 0, 1000),
    servings: num(r.servings, 1, 1, 1000),
    servingsLabel: str(r.servingsLabel, 100) || undefined,
    difficulty: DIFFICULTIES.includes(r.difficulty as Recipe['difficulty']) ? (r.difficulty as Recipe['difficulty']) : 'Easy',
    ingredients,
    instructions,
    bakersNotes: str(r.bakersNotes, 5000) || undefined,
    isFavorite: r.isFavorite === true,
    rating: r.rating == null ? undefined : num(r.rating, 5, 1, 5),
    createdAt: typeof r.createdAt === 'string' && !isNaN(Date.parse(r.createdAt)) ? r.createdAt : now,
    updatedAt: now,
  };
}

function getPendingOps(scope: Scope = currentUserId): PendingOp[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(scopedKey(STORAGE_KEY_PENDING, scope)) || '[]') as PendingOp[];
  } catch {
    return [];
  }
}

function setPendingOps(ops: PendingOp[], scope: Scope = currentUserId): void {
  if (!isBrowser()) return;
  localStorage.setItem(scopedKey(STORAGE_KEY_PENDING, scope), JSON.stringify(ops));
}

function queuePending(op: PendingOp, scope: Scope = currentUserId): void {
  const ops = getPendingOps(scope).filter(existing => {
    if (op.type === 'delete') return existing.recipeId !== op.recipeId;
    return !(existing.type === 'upsert' && existing.recipeId === op.recipeId);
  });
  ops.push(op);
  setPendingOps(ops, scope);
}

function getDeletedIds(scope: Scope = currentUserId): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(scopedKey(STORAGE_KEY_DELETED, scope)) || '[]') as string[]);
  } catch {
    return new Set();
  }
}

function setDeletedIds(ids: Set<string>, scope: Scope): void {
  localStorage.setItem(scopedKey(STORAGE_KEY_DELETED, scope), JSON.stringify([...ids]));
}

function markDeleted(id: string, scope: Scope = currentUserId): void {
  if (!isBrowser()) return;
  const ids = getDeletedIds(scope);
  ids.add(id);
  setDeletedIds(ids, scope);
}

function clearDeleted(id: string, scope: Scope = currentUserId): void {
  if (!isBrowser()) return;
  const ids = getDeletedIds(scope);
  ids.delete(id);
  setDeletedIds(ids, scope);
}

function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category as Recipe['category'],
    imageUrl: row.image_url || undefined,
    prepTimeMinutes: row.prep_time,
    bakeTimeMinutes: row.bake_time,
    ovenTemperatureF: row.oven_temperature_f || undefined,
    servings: row.servings,
    servingsLabel: row.servings_label || undefined,
    difficulty: (row.difficulty as Recipe['difficulty']) || 'Easy',
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    bakersNotes: row.notes || undefined,
    isFavorite: row.is_favorite,
    rating: row.rating ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function recipeToRow(recipe: Recipe, userId: string): RecipeRow {
  return {
    id: isUuid(recipe.id) ? recipe.id : newId(),
    user_id: userId,
    title: recipe.title,
    description: recipe.description || null,
    category: recipe.category,
    prep_time: recipe.prepTimeMinutes,
    bake_time: recipe.bakeTimeMinutes,
    oven_temperature_f: recipe.ovenTemperatureF ?? null,
    servings: recipe.servings,
    servings_label: recipe.servingsLabel ?? null,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.bakersNotes ?? null,
    is_favorite: recipe.isFavorite,
    image_url: recipe.imageUrl ?? null,
    rating: recipe.rating ?? null,
    is_sample: false,
    created_at: recipe.createdAt,
    updated_at: recipe.updatedAt,
  };
}

function newer(a: string, b: string): boolean {
  return new Date(a).getTime() >= new Date(b).getTime();
}

function mergeRecipes(local: Recipe[], remote: Recipe[], deleted: Set<string>): Recipe[] {
  const map = new Map<string, Recipe>();

  for (const r of remote) {
    if (!deleted.has(r.id)) map.set(r.id, r);
  }

  for (const l of local) {
    if (deleted.has(l.id)) continue;
    const existing = map.get(l.id);
    if (!existing) {
      map.set(l.id, l);
    } else {
      // Last-write-wins by updated_at
      map.set(l.id, newer(l.updatedAt, existing.updatedAt) ? l : existing);
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function pushRecipe(recipe: Recipe, userId: string): Promise<Recipe | null> {
  const row = recipeToRow(recipe, userId);
  // If local id was not a UUID, rewrite locally to the new UUID
  if (row.id !== recipe.id) {
    const all = readLocalRecipes(userId).map(r => (r.id === recipe.id ? { ...r, id: row.id } : r));
    writeLocalRecipes(all, userId);
  }

  const { data, error } = await supabase
    .from('recipes')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.warn('Supabase upsert failed, queued for later', error.message);
    queuePending({ type: 'upsert', recipeId: row.id, at: new Date().toISOString() }, userId);
    return null;
  }
  return data ? recipeFromRow(data as RecipeRow) : null;
}

async function pushDelete(recipeId: string, userId: string): Promise<boolean> {
  if (!isUuid(recipeId)) {
    clearDeleted(recipeId, userId);
    return true;
  }
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  if (error) {
    console.warn('Supabase delete failed, queued for later', error.message);
    queuePending({ type: 'delete', recipeId, at: new Date().toISOString() }, userId);
    return false;
  }
  clearDeleted(recipeId, userId);
  return true;
}

async function flushPending(userId: string): Promise<void> {
  const ops = getPendingOps(userId);
  if (!ops.length) return;
  // pushRecipe/pushDelete re-queue failures themselves; start from a clean queue
  setPendingOps([], userId);

  const remaining: PendingOp[] = [];
  const local = readLocalRecipes(userId);

  for (const op of ops) {
    if (op.type === 'delete') {
      const ok = await pushDelete(op.recipeId, userId);
      if (!ok) remaining.push(op);
    } else {
      const recipe = local.find(r => r.id === op.recipeId);
      if (!recipe) continue;
      const pushed = await pushRecipe(recipe, userId);
      if (!pushed) remaining.push(op);
    }
  }
  for (const op of remaining) queuePending(op, userId);
}

export const StorageService = {
  /** Switch the active on-device notebook (null = guest/demo). */
  setAuthUserId(userId: string | null): void {
    if (isBrowser()) {
      migrateLegacyOwnedNotebook();
      if (userId) adoptGuestRecipes(userId);
    }
    const changed = currentUserId !== userId;
    currentUserId = userId;
    if (changed && isBrowser()) {
      window.dispatchEvent(new Event(RECIPES_CHANGED_EVENT));
    }
  },

  /** Drop the cached profile (name/email) of a signed-out account. Recipes are kept per account. */
  forgetUser(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getRecipes(): Recipe[] {
    return readLocalRecipes();
  },

  saveRecipes(recipes: Recipe[]): void {
    writeLocalRecipes(recipes);
  },

  addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe {
    const existing = readLocalRecipes();
    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      ...recipe,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    };
    writeLocalRecipes([newRecipe, ...existing]);

    if (currentUserId && isSupabaseConfigured && isOnline()) {
      void pushRecipe(newRecipe, currentUserId);
    } else if (currentUserId) {
      queuePending({ type: 'upsert', recipeId: newRecipe.id, at: now });
    }

    return newRecipe;
  },

  updateRecipe(id: string, updates: Partial<Recipe>): Recipe | null {
    const existing = readLocalRecipes();
    const idx = existing.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const updatedRecipe: Recipe = {
      ...existing[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    existing[idx] = updatedRecipe;
    writeLocalRecipes(existing);

    if (currentUserId && isSupabaseConfigured && isOnline()) {
      void pushRecipe(updatedRecipe, currentUserId);
    } else if (currentUserId) {
      queuePending({ type: 'upsert', recipeId: id, at: updatedRecipe.updatedAt });
    }

    return updatedRecipe;
  },

  deleteRecipe(id: string): boolean {
    const existing = readLocalRecipes();
    const filtered = existing.filter(r => r.id !== id);
    if (filtered.length === existing.length) return false;
    writeLocalRecipes(filtered);
    markDeleted(id);

    if (currentUserId && isSupabaseConfigured && isOnline()) {
      void pushDelete(id, currentUserId);
    } else if (currentUserId) {
      queuePending({ type: 'delete', recipeId: id, at: new Date().toISOString() });
    }

    return true;
  },

  toggleFavorite(id: string): boolean {
    const existing = readLocalRecipes();
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
    writeLocalRecipes(updated);

    const recipe = updated.find(r => r.id === id);
    if (recipe && currentUserId) {
      if (isSupabaseConfigured && isOnline()) {
        void pushRecipe(recipe, currentUserId);
      } else {
        queuePending({ type: 'upsert', recipeId: id, at: recipe.updatedAt });
      }
    }

    return newFavStatus;
  },

  getUser(): UserProfile {
    if (!isBrowser()) return DEFAULT_USER;
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (!data) {
        this.saveUser(DEFAULT_USER);
        return DEFAULT_USER;
      }
      return JSON.parse(data) as UserProfile;
    } catch {
      return DEFAULT_USER;
    }
  },

  saveUser(user: UserProfile): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      void idbSet(STORAGE_KEY_USER, user);
    } catch (e) {
      console.error('Error saving user profile', e);
    }
  },

  /**
   * Bi-directional sync: pulls remote recipes, merges with local (last-write-wins),
   * pushes local-only / newer recipes, flushes pending offline ops.
   */
  async syncWithCloud(userId?: string): Promise<Recipe[]> {
    const uid = currentUserId;
    // Only ever sync the active account's notebook (guards against stale callers after sign-out)
    if (!uid || (userId && userId !== uid) || !isSupabaseConfigured || !isOnline()) {
      return readLocalRecipes();
    }

    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      try {
        await flushPending(uid);

        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', uid)
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Supabase pull failed', error.message);
          return readLocalRecipes(uid);
        }

        const remote = (data || []).map(r => recipeFromRow(r as RecipeRow));
        let local = readLocalRecipes(uid);

        // Brand-new account: seed the sample collection once (never on later devices,
        // where the account already has recipes in the cloud)
        const seededKey = scopedKey(STORAGE_KEY_SEEDED, uid);
        if (remote.length === 0 && !localStorage.getItem(seededKey)) {
          local = [...local, ...freshSampleRecipes()];
        }
        localStorage.setItem(seededKey, '1');

        const deleted = getDeletedIds(uid);
        const merged = mergeRecipes(local, remote, deleted);
        writeLocalRecipes(merged, uid);

        // Push local winners / local-only (non-sample) recipes
        for (const recipe of merged) {
          const remoteMatch = remote.find(r => r.id === recipe.id);
          const shouldPush =
            !remoteMatch || newer(recipe.updatedAt, remoteMatch.updatedAt);
          if (shouldPush && isUuid(recipe.id)) {
            await pushRecipe(recipe, uid);
          } else if (shouldPush && !isUuid(recipe.id)) {
            // Migrate legacy local IDs to UUID on first sync
            const migrated = { ...recipe, id: newId() };
            const withoutOld = readLocalRecipes(uid).filter(r => r.id !== recipe.id);
            writeLocalRecipes([migrated, ...withoutOld], uid);
            await pushRecipe(migrated, uid);
          }
        }

        return readLocalRecipes(uid);
      } finally {
        syncInFlight = null;
      }
    })();

    return syncInFlight;
  },

  /** Hydrate from IndexedDB if localStorage was cleared (rare). */
  async hydrateFromIndexedDb(): Promise<Recipe[] | null> {
    const key = scopedKey(STORAGE_KEY_RECIPES, currentUserId);
    if (!isBrowser() || localStorage.getItem(key)) return null;
    const fromIdb = await idbGet<Recipe[]>(key);
    if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
      writeLocalRecipes(fromIdb);
      return fromIdb;
    }
    return null;
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
      for (const raw of incoming) {
        const item = sanitizeImportedRecipe(raw);
        if (!item) continue;
        if (existingIds.has(item.id)) item.id = newId();
        existingIds.add(item.id);
        merged.unshift(item);
        count++;
        if (currentUserId) {
          queuePending({ type: 'upsert', recipeId: item.id, at: item.updatedAt });
        }
      }
      this.saveRecipes(merged);
      if (currentUserId && isSupabaseConfigured && isOnline()) {
        void this.syncWithCloud(currentUserId);
      }
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
