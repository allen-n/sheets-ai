import { AnalyticsConstants } from './constants';

// const getCacheKeysQ = getCacheKeys;
const acQueue = new AnalyticsConstants();
/**
 * Interface for analytics events to be tracked
 */
export interface AnalyticsEvent {
  event: string;
  distinct_id: string;
  properties: Record<string, any>;
  timestamp?: string;
}

/**
 * Manages a queue of analytics events both in memory and CacheService
 */
export class AnalyticsQueue {
  private static instance: AnalyticsQueue;
  private memoryQueue: AnalyticsEvent[] = [];
  private cache = CacheService.getUserCache();

  /**
   * Get the singleton instance of the queue
   */
  public static getInstance(): AnalyticsQueue {
    if (!AnalyticsQueue.instance) {
      AnalyticsQueue.instance = new AnalyticsQueue();
      AnalyticsQueue.instance.loadFromCache();
    }
    return AnalyticsQueue.instance;
  }

  /**
   * Add an event to the queue
   */
  public addEvent(event: AnalyticsEvent): void {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    this.memoryQueue.push(event);
    this.saveToCache();
  }

  /**
   * Get all events in the queue
   */
  public getEvents(): AnalyticsEvent[] {
    return [...this.memoryQueue];
  }

  /**
   * Clear all events from the queue
   */
  public clearQueue(): void {
    this.memoryQueue = [];
    this.cache.remove(acQueue.CACHE_KEYS.ANALYTICS_QUEUE);
  }

  /**
   * Get the current queue length
   */
  public getQueueLength(): number {
    return this.memoryQueue.length;
  }

  /**
   * Persist the queue to CacheService
   */
  private saveToCache(): void {
    try {
      // Store up to 100KB (CacheService limit) worth of events
      const queueStr = JSON.stringify(this.memoryQueue);
      this.cache.put(acQueue.CACHE_KEYS.ANALYTICS_QUEUE, queueStr, 21600); // 6 hour cache
    } catch (error) {
      console.warn('Failed to save analytics queue to cache:', error);
    }
  }

  /**
   * Load the queue from CacheService
   */
  private loadFromCache(): void {
    try {
      const cachedQueue = this.cache.get(acQueue.CACHE_KEYS.ANALYTICS_QUEUE);
      if (cachedQueue) {
        this.memoryQueue = JSON.parse(cachedQueue);
      }
    } catch (error) {
      console.warn('Failed to load analytics queue from cache:', error);
      this.memoryQueue = [];
    }
  }
}
