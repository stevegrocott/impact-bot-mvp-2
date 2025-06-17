import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setCacheEntry, getCacheEntry } from '../store/cacheSlice';
import { apiClient, SearchResult, HybridSearchParams } from '../services/apiClient';
import { useAuth } from './useAuth';

interface UseHybridSearchOptions {
  enableCache?: boolean;
  cacheTTL?: number;
  debounceMs?: number;
  autoSearch?: boolean;
  minQueryLength?: number;
}

interface SearchState {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  searchTime: number;
  query: string;
  lastSearchParams?: HybridSearchParams;
}

export const useHybridSearch = (options: UseHybridSearchOptions = {}) => {
  const {
    enableCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    debounceMs = 300,
    autoSearch = false,
    minQueryLength = 2,
  } = options;

  const dispatch = useDispatch();
  const { getOrganizationContext } = useAuth();
  const cacheState = useSelector((state: RootState) => state.cache);
  
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    totalResults: 0,
    searchTime: 0,
    query: '',
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController>();

  // Generate cache key for search params
  const generateCacheKey = useCallback((params: HybridSearchParams): string => {
    return btoa(JSON.stringify(params)).replace(/[/+=]/g, '');
  }, []);

  // Get cached results
  const getCachedResults = useCallback((params: HybridSearchParams): SearchResult[] | null => {
    if (!enableCache) return null;
    
    const cacheKey = generateCacheKey(params);
    dispatch(getCacheEntry({ category: 'searchResults', key: cacheKey }));
    
    const entry = cacheState.searchResults[cacheKey];
    const now = Date.now();
    
    if (entry && now < entry.expiresAt) {
      return entry.data;
    }
    
    return null;
  }, [enableCache, generateCacheKey, dispatch, cacheState.searchResults]);

  // Cache search results
  const cacheResults = useCallback((params: HybridSearchParams, results: SearchResult[]) => {
    if (!enableCache) return;
    
    const cacheKey = generateCacheKey(params);
    dispatch(setCacheEntry({
      category: 'searchResults',
      key: cacheKey,
      data: results,
      ttl: cacheTTL,
    }));
  }, [enableCache, generateCacheKey, dispatch, cacheTTL]);

  // Perform hybrid search
  const performSearch = useCallback(async (searchParams: HybridSearchParams): Promise<SearchResult[]> => {
    // Check cache first
    const cachedResults = getCachedResults(searchParams);
    if (cachedResults) {
      return cachedResults;
    }

    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const startTime = Date.now();
    
    try {
      const response = await apiClient.hybridSearch(searchParams);
      const searchTime = Date.now() - startTime;
      
      if (response.success) {
        const results = response.data;
        
        // Cache results
        cacheResults(searchParams, results);
        
        // Update search state
        setSearchState(prev => ({
          ...prev,
          results,
          totalResults: response.meta?.total || results.length,
          searchTime,
          error: null,
          lastSearchParams: searchParams,
        }));
        
        return results;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return []; // Request was aborted, don't update state
      }
      
      const errorMessage = error.message || 'Search failed';
      setSearchState(prev => ({
        ...prev,
        error: errorMessage,
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      }));
      
      throw error;
    }
  }, [getCachedResults, cacheResults]);

  // Main search function
  const search = useCallback(async (
    query: string,
    searchIntent?: string,
    customContext?: Record<string, any>
  ): Promise<SearchResult[]> => {
    if (!query || query.length < minQueryLength) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        totalResults: 0,
        error: null,
        query,
      }));
      return [];
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query,
    }));

    try {
      const userContext = {
        ...getOrganizationContext(),
        ...customContext,
      };

      const searchParams: HybridSearchParams = {
        query,
        userContext,
        searchIntent,
        limit: 10,
      };

      const results = await performSearch(searchParams);
      
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return results;
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return [];
    }
  }, [minQueryLength, getOrganizationContext, performSearch]);

  // Debounced search
  const debouncedSearch = useCallback((
    query: string,
    searchIntent?: string,
    customContext?: Record<string, any>
  ) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      search(query, searchIntent, customContext);
    }, debounceMs);
  }, [search, debounceMs]);

  // Clear search results
  const clearResults = useCallback(() => {
    setSearchState({
      results: [],
      isLoading: false,
      error: null,
      totalResults: 0,
      searchTime: 0,
      query: '',
    });
    
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await apiClient.getSearchSuggestions(query);
      return response.success ? response.data : [];
    } catch (error) {
      console.warn('Failed to get search suggestions:', error);
      return [];
    }
  }, []);

  // Retry last search
  const retryLastSearch = useCallback(() => {
    if (searchState.lastSearchParams) {
      setSearchState(prev => ({ ...prev, isLoading: true, error: null }));
      performSearch(searchState.lastSearchParams);
    }
  }, [searchState.lastSearchParams, performSearch]);

  // Auto-search effect
  useEffect(() => {
    if (autoSearch && searchState.query && searchState.query.length >= minQueryLength) {
      debouncedSearch(searchState.query);
    }
  }, [autoSearch, searchState.query, minQueryLength, debouncedSearch]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    // State
    results: searchState.results,
    isLoading: searchState.isLoading,
    error: searchState.error,
    totalResults: searchState.totalResults,
    searchTime: searchState.searchTime,
    query: searchState.query,
    
    // Actions
    search,
    debouncedSearch,
    clearResults,
    getSuggestions,
    retryLastSearch,
    
    // Cache stats
    cacheStats: cacheState.stats,
  };
};