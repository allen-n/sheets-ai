/**
 * PostHog analytics constants
 */

// Event names
const _EVENTS = {
  ADDON_OPENED: 'addon_opened',
  SIDEBAR_OPENED: 'sidebar_opened',
  MENU_ACTION: 'menu_action',
  API_KEY_SET: 'api_key_set',
  FUNCTION_CALL: 'function_call',
  ERROR: 'error',
  ANALYTICS_OPT_CHANGE: 'analytics_opt_change',
};

// Properties service keys
const _PROPERTIES = {
  UUID: 'sheetsai_user_uuid',
  ANALYTICS_OPT_OUT: 'analytics_opt_out',
  PH_PROJECT_KEY: 'PH_PROJECT_KEY',
};

// PostHog API endpoints
const _POSTHOG_API = {
  BASE_URL: 'https://e.trysheetsai.com',
  BATCH_ENDPOINT: '/batch/',
};

// Cache keys
const _CACHE_KEYS = {
  ANALYTICS_QUEUE: 'analytics_queue',
};

// Queue settings
const _QUEUE_CONFIG = {
  MAX_BATCH_SIZE: 20,
  TRIGGER_NAME: 'SheetsAI_AnalyticsFlush',
  TRIGGER_INTERVAL_MINUTES: 1,
};

/**
 * Get event name constants
 */
export const getEvents = () => {
  return _EVENTS;
};

/**
 * Get property name constants
 */
export const getProperties = () => {
  return _PROPERTIES;
};

/**
 * Get PostHog API constants
 */
export const getPosthogApi = () => {
  return _POSTHOG_API;
};

/**
 * Get cache key constants
 */
export const getCacheKeys = () => {
  return _CACHE_KEYS;
};

/**
 * Get queue configuration constants
 */
export const getQueueConfig = () => {
  return _QUEUE_CONFIG;
};
