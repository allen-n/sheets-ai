import { AnalyticsConstants } from '@/analytics/constants';
import { AnalyticsEvent, AnalyticsQueue } from './queue';
import { ApiService } from '@/api/base';

const acPH = new AnalyticsConstants();
/**
 * Main PostHog analytics implementation for SheetsAI
 */
export class PostHogAnalytics {
  private static instance: PostHogAnalytics;
  private readonly apiService: ApiService;
  private readonly userProps = PropertiesService.getUserProperties();
  private readonly scriptProps = PropertiesService.getScriptProperties();
  private readonly queue = AnalyticsQueue.getInstance();

  private constructor() {
    this.apiService = new ApiService(acPH.POSTHOG_API.BASE_URL, {
      'Content-Type': 'application/json',
    });
  }
  /**
   * Get the singleton instance of PostHogAnalytics
   */
  public static getInstance(): PostHogAnalytics {
    if (!PostHogAnalytics.instance) {
      PostHogAnalytics.instance = new PostHogAnalytics();
    }
    return PostHogAnalytics.instance;
  }

  /**
   * Track an event
   * @param eventName Name of the event to track
   * @param props Additional properties to include with the event
   */
  public track(eventName: string, props: Record<string, any> = {}): void {
    try {
      // Skip tracking if user opted out
      if (this.isOptedOut()) {
        return;
      }

      const distinctId = this.getUuid();
      const properties: Record<string, any> = {
        ...props,
        $lib: 'sheets-ai-addon',
        $lib_version: '1.0',
        hashedEmail: this.getHashedEmail(),
      };

      const event: AnalyticsEvent = {
        event: eventName,
        distinct_id: distinctId,
        properties,
        timestamp: new Date().toISOString(),
      };

      this.queue.addEvent(event);

      // If queue has reached threshold, trigger a flush
      if (
        this.queue.getQueueLength() >= acPH.QUEUE_CONFIG.MAX_BATCH_SIZE ||
        true
      ) {
        this.flushQueue();
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Flush the event queue to PostHog
   */
  public flushQueue(): void {
    try {
      const events = this.queue.getEvents();
      if (events.length === 0) {
        return;
      }

      const apiKey = this.getProjectKey();
      if (!apiKey) {
        console.warn('PostHog API key not found');
        return;
      }

      const batchUrl = `${acPH.POSTHOG_API.BASE_URL}${acPH.POSTHOG_API.BATCH_ENDPOINT}`;

      const payload = {
        api_key: apiKey,
        historical_migration: false,
        batch: events,
      };

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      };

      const response = UrlFetchApp.fetch(batchUrl, options);
      const responseCode = response.getResponseCode();

      if (responseCode >= 200 && responseCode < 300) {
        this.queue.clearQueue();
      } else {
        console.error(
          'Failed to send analytics batch:',
          responseCode,
          response.getContentText()
        );
      }
    } catch (error) {
      console.error('Error flushing analytics queue:', error);
    }
  }

  /**
   * Ensure time-driven triggers are set up for queue flushing
   */
  public ensureTriggers(): void {
    try {
      // First remove any existing triggers
      this.removeTriggers();

      // Then create a new one
      ScriptApp.newTrigger(acPH.QUEUE_CONFIG.TRIGGER_NAME)
        .timeBased()
        .everyMinutes(acPH.QUEUE_CONFIG.TRIGGER_INTERVAL_MINUTES)
        .create();
    } catch (error) {
      console.error('Failed to set up analytics triggers:', error);
    }
  }

  /**
   * Remove existing analytics triggers
   */
  public removeTriggers(): void {
    try {
      const triggers = ScriptApp.getProjectTriggers();
      for (const trigger of triggers) {
        if (trigger.getHandlerFunction() === acPH.QUEUE_CONFIG.TRIGGER_NAME) {
          ScriptApp.deleteTrigger(trigger);
        }
      }
    } catch (error) {
      console.error('Failed to remove analytics triggers:', error);
    }
  }

  /**
   * Set user's opt-out preference
   * @param optOut True to opt out, false to opt in
   */
  public setOptOut(optOut: boolean): void {
    this.userProps.setProperty(
      acPH.PROPERTIES.ANALYTICS_OPT_OUT,
      optOut.toString()
    );
    this.track(acPH.EVENTS.ANALYTICS_OPT_CHANGE, { optOut });
  }

  /**
   * Check if user has opted out of analytics
   */
  public isOptedOut(): boolean {
    const optOut = this.userProps.getProperty(
      acPH.PROPERTIES.ANALYTICS_OPT_OUT
    );
    return optOut === 'true';
  }

  /**
   * Get or create a persistent user UUID
   */
  public getUuid(): string {
    let uuid = this.userProps.getProperty(acPH.PROPERTIES.UUID);
    if (!uuid) {
      uuid = Utilities.getUuid();
      this.userProps.setProperty(acPH.PROPERTIES.UUID, uuid);
    }
    return uuid;
  }

  /**
   * Get SHA-256 hash of user email when available
   */
  public getHashedEmail(): string | null {
    try {
      const email = Session.getActiveUser().getEmail();
      if (!email || email.trim() === '') {
        return null;
      }

      // Only hash emails from the same domain (for Workspace rules)
      if (email.indexOf('@') === -1) {
        return null;
      }

      const hash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        email.toLowerCase().trim()
      );

      return this.byteArrayToHex(hash);
    } catch (error) {
      console.warn('Error getting hashed email:', error);
      return null;
    }
  }

  /**
   * Get the PostHog project key from ScriptProperties
   */
  private getProjectKey(): string | null {
    return this.scriptProps.getProperty(acPH.PROPERTIES.PH_PROJECT_KEY);
  }

  /**
   * Convert byte array to hexadecimal string
   */
  private byteArrayToHex(bytes: number[]): string {
    return Array.from(bytes)
      .map((byte) => ('0' + (byte & 0xff).toString(16)).slice(-2))
      .join('');
  }
}
