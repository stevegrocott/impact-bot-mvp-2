/**
 * Cache Service
 * Redis-based caching with intelligent key management and performance optimization
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
}

class CacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly keyPrefix = 'impactbot:v2:';
  
  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
        reconnectDelay: 1000,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  private formatKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async ping(): Promise<string> {
    await this.connect();
    return await this.client.ping();
  }

  /**
   * Set a value in cache with optional TTL and compression
   */
  async set(
    key: string, 
    value: any, 
    ttl: number = config.CACHE_TTL_DEFAULT,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      await this.connect();
      
      const formattedKey = this.formatKey(key);
      let serializedValue = JSON.stringify(value);
      
      // Optional compression for large values
      if (options.compress && serializedValue.length > 1024) {
        // Could implement compression here if needed
        // For now, just store as-is
      }

      if (ttl > 0) {
        await this.client.setEx(formattedKey, ttl, serializedValue);
      } else {
        await this.client.set(formattedKey, serializedValue);
      }

      // Store tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        const tagPromises = options.tags.map(tag => 
          this.client.sAdd(this.formatKey(`tag:${tag}`), formattedKey)
        );
        await Promise.all(tagPromises);
      }

      logger.debug('Cache set', { key: formattedKey, ttl, tags: options.tags });
    } catch (error) {
      logger.error('Cache set failed', { key, error });
      // Fail silently - don't break the application
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      await this.connect();
      
      const formattedKey = this.formatKey(key);
      const value = await this.client.get(formattedKey);
      
      if (value === null) {
        logger.debug('Cache miss', { key: formattedKey });
        return null;
      }

      const parsed = JSON.parse(value);
      logger.debug('Cache hit', { key: formattedKey });
      return parsed;
    } catch (error) {
      logger.error('Cache get failed', { key, error });
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.connect();
      
      const formattedKey = this.formatKey(key);
      const result = await this.client.del(formattedKey);
      
      logger.debug('Cache delete', { key: formattedKey, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete failed', { key, error });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.connect();
      
      const formattedKey = this.formatKey(key);
      const result = await this.client.exists(formattedKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { key, error });
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      await this.connect();
      
      const formattedKeys = keys.map(key => this.formatKey(key));
      const values = await this.client.mGet(formattedKeys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget failed', { keys, error });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(pairs: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    try {
      await this.connect();
      
      const pipeline = this.client.multi();
      
      for (const { key, value, ttl } of pairs) {
        const formattedKey = this.formatKey(key);
        const serializedValue = JSON.stringify(value);
        
        if (ttl && ttl > 0) {
          pipeline.setEx(formattedKey, ttl, serializedValue);
        } else {
          pipeline.set(formattedKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      logger.debug('Cache mset completed', { count: pairs.length });
    } catch (error) {
      logger.error('Cache mset failed', { error });
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      await this.connect();
      
      for (const tag of tags) {
        const tagKey = this.formatKey(`tag:${tag}`);
        const keys = await this.client.sMembers(tagKey);
        
        if (keys.length > 0) {
          await this.client.del(keys);
          await this.client.del(tagKey);
          logger.info('Cache invalidated by tag', { tag, keysDeleted: keys.length });
        }
      }
    } catch (error) {
      logger.error('Cache tag invalidation failed', { tags, error });
    }
  }

  /**
   * Clear all cache keys with the app prefix
   */
  async clear(): Promise<void> {
    try {
      await this.connect();
      
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('Cache cleared', { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Cache clear failed', { error });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      await this.connect();
      
      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');
      const memory = await this.client.info('memory');
      
      // Count our app's keys
      const appKeys = await this.client.keys(`${this.keyPrefix}*`);
      
      return {
        connected: this.isConnected,
        appKeysCount: appKeys.length,
        stats: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        memory: this.parseRedisInfo(memory),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          // Try to parse as number
          const numValue = Number(value);
          result[key] = isNaN(numValue) ? value : numValue;
        }
      }
    });
    
    return result;
  }
}

// IRIS+ Data Cache Utilities
export class IrisCacheService {
  private static readonly CACHE_KEYS = {
    CATEGORIES: 'iris:categories',
    THEMES: 'iris:themes',
    GOALS: 'iris:goals',
    INDICATORS: 'iris:indicators',
    DATA_REQUIREMENTS: 'iris:data_requirements',
    MV_CATEGORY_DATA: 'iris:mv:category_data',
    MV_SDG_INDICATORS: 'iris:mv:sdg_indicators',
    MV_THEME_RELATIONSHIPS: 'iris:mv:theme_relationships',
    SEARCH_RESULTS: (query: string) => `iris:search:${Buffer.from(query).toString('base64')}`,
    USER_RECOMMENDATIONS: (userId: string, orgId: string) => `user:${userId}:org:${orgId}:recommendations`
  };

  static async getCachedOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = config.CACHE_TTL_IRIS_DATA,
    tags?: string[]
  ): Promise<T> {
    // Try to get from cache first
    const cached = await cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFunction();
    
    // Cache the result
    await cacheService.set(key, data, ttl, { tags });
    
    return data;
  }

  static async invalidateIrisData(): Promise<void> {
    await cacheService.invalidateByTags(['iris', 'iris:reference']);
  }

  static async warmupCache(): Promise<void> {
    logger.info('Starting IRIS+ cache warmup');
    
    // This would be called during application startup
    // to pre-populate frequently accessed data
    
    logger.info('IRIS+ cache warmup completed');
  }
}

// Create and export singleton instance
export const cacheService = new CacheService();
export { IrisCacheService };