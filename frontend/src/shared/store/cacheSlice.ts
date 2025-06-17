import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  hitCount: number;
}

interface CacheState {
  searchResults: Record<string, CacheEntry>;
  vectorSimilarity: Record<string, CacheEntry>;
  irisContent: Record<string, CacheEntry>;
  userPreferences: Record<string, CacheEntry>;
  conversationContext: Record<string, CacheEntry>;
  lastCleanup: number;
  stats: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
  };
}

const initialState: CacheState = {
  searchResults: {},
  vectorSimilarity: {},
  irisContent: {},
  userPreferences: {},
  conversationContext: {},
  lastCleanup: Date.now(),
  stats: {
    totalHits: 0,
    totalMisses: 0,
    hitRate: 0,
  },
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    setCacheEntry: (state, action: PayloadAction<{
      category: keyof Omit<CacheState, 'lastCleanup' | 'stats'>;
      key: string;
      data: any;
      ttl?: number;
    }>) => {
      const { category, key, data, ttl = DEFAULT_TTL } = action.payload;
      const now = Date.now();
      
      state[category][key] = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        hitCount: 0,
      };
    },
    getCacheEntry: (state, action: PayloadAction<{
      category: keyof Omit<CacheState, 'lastCleanup' | 'stats'>;
      key: string;
    }>) => {
      const { category, key } = action.payload;
      const entry = state[category][key];
      const now = Date.now();
      
      if (entry && now < entry.expiresAt) {
        entry.hitCount++;
        state.stats.totalHits++;
      } else {
        state.stats.totalMisses++;
        if (entry) {
          delete state[category][key];
        }
      }
      
      // Update hit rate
      const total = state.stats.totalHits + state.stats.totalMisses;
      state.stats.hitRate = total > 0 ? state.stats.totalHits / total : 0;
    },
    invalidateCache: (state, action: PayloadAction<{
      category?: keyof Omit<CacheState, 'lastCleanup' | 'stats'>;
      key?: string;
    }>) => {
      const { category, key } = action.payload;
      
      if (category && key) {
        // Invalidate specific entry
        delete state[category][key];
      } else if (category) {
        // Invalidate entire category
        state[category] = {};
      } else {
        // Invalidate all cache
        state.searchResults = {};
        state.vectorSimilarity = {};
        state.irisContent = {};
        state.userPreferences = {};
        state.conversationContext = {};
      }
    },
    cleanupExpired: (state) => {
      const now = Date.now();
      
      // Only cleanup if enough time has passed
      if (now - state.lastCleanup < CLEANUP_INTERVAL) {
        return;
      }
      
      const categories: Array<keyof Omit<CacheState, 'lastCleanup' | 'stats'>> = [
        'searchResults',
        'vectorSimilarity', 
        'irisContent',
        'userPreferences',
        'conversationContext'
      ];
      
      categories.forEach(category => {
        Object.keys(state[category]).forEach(key => {
          const entry = state[category][key];
          if (now >= entry.expiresAt) {
            delete state[category][key];
          }
        });
      });
      
      state.lastCleanup = now;
    },
    resetStats: (state) => {
      state.stats = {
        totalHits: 0,
        totalMisses: 0,
        hitRate: 0,
      };
    },
  },
});

export const {
  setCacheEntry,
  getCacheEntry,
  invalidateCache,
  cleanupExpired,
  resetStats,
} = cacheSlice.actions;

export default cacheSlice.reducer;