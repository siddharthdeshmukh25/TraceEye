import { db } from "./mongodb";

// Data types for backup/restore
interface BackupData {
  batches: any[];
  producers: any[];
  handovers: any[];
  alerts: any[];
  cardVisits: any[];
  timestamp: number;
  version: string;
}

interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
  source: 'database' | 'cache' | 'fallback';
  timestamp: number;
}

// Local storage keys
const CACHE_KEYS = {
  BATCHES: 'traceeye_cache_batches',
  PRODUCERS: 'traceeye_cache_producers',
  HANDOVERS: 'traceeye_cache_handovers',
  ALERTS: 'traceeye_cache_alerts',
  CARD_VISITS: 'traceeye_cache_card_visits',
  SYSTEM_STATUS: 'traceeye_system_status',
  BACKUP_DATA: 'traceeye_backup_data'
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

class DatabaseWrapper {
  private healthStatus: {
    database: 'healthy' | 'degraded' | 'down';
    lastCheck: number;
    errorCount: number;
  } = {
    database: 'healthy',
    lastCheck: Date.now(),
    errorCount: 0
  };

  /**
   * Get data with fallback to cache
   */
  async getDataWithFallback<T>(
    collectionName: string,
    query: any = {},
    cacheKey: string
  ): Promise<DatabaseResult<T[]>> {
    const timestamp = Date.now();
    
    try {
      // Try database first
      const database = await db();
      const data = await database.collection(collectionName).find(query).toArray();
      
      // Update health status
      this.healthStatus.database = 'healthy';
      this.healthStatus.errorCount = 0;
      this.healthStatus.lastCheck = timestamp;
      
      // Cache the successful result
      this.cacheData(cacheKey, data);
      
      return {
        data: data as T[],
        error: null,
        source: 'database',
        timestamp
      };
    } catch (error) {
      console.error(`Database error for ${collectionName}:`, error);
      
      // Update health status
      this.healthStatus.errorCount++;
      this.healthStatus.lastCheck = timestamp;
      
      if (this.healthStatus.errorCount > 3) {
        this.healthStatus.database = 'down';
      } else if (this.healthStatus.errorCount > 1) {
        this.healthStatus.database = 'degraded';
      }
      
      // Try cache fallback
      const cachedData = this.getCachedData<T[]>(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for ${collectionName}`);
        return {
          data: cachedData,
          error: error as Error,
          source: 'cache',
          timestamp
        };
      }
      
      // Return empty array as fallback
      return {
        data: [],
        error: error as Error,
        source: 'fallback',
        timestamp
      };
    }
  }

  /**
   * Get single document with fallback
   */
  async getDocumentWithFallback<T>(
    collectionName: string,
    query: any,
    cacheKey: string
  ): Promise<DatabaseResult<T>> {
    const timestamp = Date.now();
    
    try {
      const database = await db();
      const data = await database.collection(collectionName).findOne(query);
      
      this.healthStatus.database = 'healthy';
      this.healthStatus.errorCount = 0;
      this.healthStatus.lastCheck = timestamp;
      
      if (data) {
        this.cacheData(cacheKey, data);
      }
      
      return {
        data: data as T,
        error: null,
        source: 'database',
        timestamp
      };
    } catch (error) {
      console.error(`Database error for ${collectionName}:`, error);
      
      this.healthStatus.errorCount++;
      this.healthStatus.lastCheck = timestamp;
      
      if (this.healthStatus.errorCount > 3) {
        this.healthStatus.database = 'down';
      } else if (this.healthStatus.errorCount > 1) {
        this.healthStatus.database = 'degraded';
      }
      
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          error: error as Error,
          source: 'cache',
          timestamp
        };
      }
      
      return {
        data: null,
        error: error as Error,
        source: 'fallback',
        timestamp
      };
    }
  }

  /**
   * Cache data to localStorage (only in browser)
   */
  private cacheData(key: string, data: any): void {
    try {
      // Only use localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      const cacheItem = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data from localStorage (only in browser)
   */
  private getCachedData<T>(key: string): T | null {
    try {
      // Only use localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
      }
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const cacheItem = JSON.parse(cached);
      const age = Date.now() - cacheItem.timestamp;
      
      // Return data if still valid
      if (age < CACHE_DURATION) {
        return cacheItem.data as T;
      }
      
      // Remove expired cache
      localStorage.removeItem(key);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Create complete backup of all critical data
   */
  async createBackup(): Promise<BackupData> {
    const timestamp = Date.now();
    
    try {
      const database = await db();
      
      const [batches, producers, handovers, alerts, cardVisits] = await Promise.all([
        database.collection('batches').find({}).toArray(),
        database.collection('producers').find({}).toArray(),
        database.collection('handovers').find({}).toArray(),
        database.collection('alerts').find({}).toArray(),
        database.collection('card_visits').find({}).toArray()
      ]);
      
      const backupData: BackupData = {
        batches,
        producers,
        handovers,
        alerts,
        cardVisits,
        timestamp,
        version: '1.0'
      };
      
      // Save to localStorage
      this.cacheData(CACHE_KEYS.BACKUP_DATA, backupData);
      
      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(backupData: BackupData): Promise<boolean> {
    try {
      const database = await db();
      
      // Restore each collection
      const deletePromises = [
        backupData.batches.length > 0 ? database.collection('batches').deleteMany({}) : Promise.resolve(),
        backupData.producers.length > 0 ? database.collection('producers').deleteMany({}) : Promise.resolve(),
        backupData.handovers.length > 0 ? database.collection('handovers').deleteMany({}) : Promise.resolve(),
        backupData.alerts.length > 0 ? database.collection('alerts').deleteMany({}) : Promise.resolve(),
        backupData.cardVisits.length > 0 ? database.collection('card_visits').deleteMany({}) : Promise.resolve()
      ];
      
      await Promise.all(deletePromises);
      
      const insertPromises = [
        backupData.batches.length > 0 ? database.collection('batches').insertMany(backupData.batches) : Promise.resolve(),
        backupData.producers.length > 0 ? database.collection('producers').insertMany(backupData.producers) : Promise.resolve(),
        backupData.handovers.length > 0 ? database.collection('handovers').insertMany(backupData.handovers) : Promise.resolve(),
        backupData.alerts.length > 0 ? database.collection('alerts').insertMany(backupData.alerts) : Promise.resolve(),
        backupData.cardVisits.length > 0 ? database.collection('card_visits').insertMany(backupData.cardVisits) : Promise.resolve()
      ];
      
      await Promise.all(insertPromises);
      
      // Update health status
      this.healthStatus.database = 'healthy';
      this.healthStatus.errorCount = 0;
      
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      ...this.healthStatus,
      databaseUptime: Date.now() - this.healthStatus.lastCheck
    };
  }

  /**
   * Clear all cache (only in browser)
   */
  clearCache(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get cache statistics (only in browser)
   */
  getCacheStats() {
    const stats: { [key: string]: any } = {};
    
    // Only use localStorage in browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      Object.keys(CACHE_KEYS).forEach(name => {
        stats[name] = { exists: false };
      });
      return stats;
    }
    
    Object.entries(CACHE_KEYS).forEach(([name, key]) => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          stats[name] = {
            exists: true,
            age: Date.now() - cacheItem.timestamp,
            size: cached.length
          };
        } else {
          stats[name] = { exists: false };
        }
      } catch (error) {
        stats[name] = { exists: false, error: 'read_error' };
      }
    });
    
    return stats;
  }
}

// Export singleton instance
export const dbWrapper = new DatabaseWrapper();
export default dbWrapper;