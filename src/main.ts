import { AnalyticsConstants } from '@/analytics/constants';
import { PostHogAnalytics } from '@/analytics/posthog';
import { SheetsAIError, Utils } from '@/common/utils';
import { LLMProviders } from '@/llm/provider/base';
import { OpenAIProvider } from '@/llm/provider/openai';
import {
  fetchAvailableModels,
  getDefaultModel,
  OpenAiTextModelNames,
} from '@/llm/types/openai';
import { SecretService } from '@/sheets/secrets';
import { LLMUsageService } from '@/sheets/storage/llm-usage';
import { UIManager } from '@/ui/UIManager';

const acMain = new AnalyticsConstants();
const getDefaultModelMain = getDefaultModel; // CLASP workaround
const fetchAvailableModelsMain = fetchAvailableModels; // CLASP workaround

const AppMenuName = 'SheetsAI Menu';
const AppMenuMapping = new Map<string, string>([
  ['Settings', setLLmApiKeys.name],
  ['Help', showHelpSidebar.name],
  ['Clear Cache', clearSheetsAICache.name],
]);

const CACHE_TTL_SECONDS = 21600; // 6 hours

/**
 * Generates text using a large language model. Uses the model configured in settings or defaults to gpt-4.1-nano. Requires API key to be set in the `SheetsAI Menu > Set API Keys` menu.
 * @param {string} query The query for the model, i.e. "What is the capital of the United States?" or "Is the animal in this cell a feline?"
 * @param {string | undefined} context [optional] If provided, will add this context into the query, i.e. if asking "Is the animal in this cell a feline?" and the context is a cell containing the word "Cat" or "dog".
 * @returns {string} The generated text from the model.
 * @customfunction
 */
export async function SHEETS_AI(
  query: string,
  context?: string
): Promise<string | void> {
  // Create a cache key based on input parameters
  const cacheKey = `SHEETS_AI_${Utils.cyrb64Hash(query)}_${Utils.cyrb64Hash(
    context || ''
  )}`;

  // Get the cache
  const cache = CacheService.getUserCache();
  const cachedResult = cache.get(cacheKey);
  let completionTextLength: number = 0;
  let selectedModel: string | null = null;

  // Return cached result if available
  if (cachedResult) {
    return cachedResult;
  }

  const secretService = new SecretService();
  const apiKey = secretService.getSecret('USER_OPENAI_KEY');
  if (!apiKey) {
    try {
      UIManager.showAlert(
        'API Key Required',
        'Your OpenAI key is not set! Please set it now in ' +
          AppMenuName +
          ' in the top menu (right of "Help")',
        SpreadsheetApp.getUi().ButtonSet.OK_CANCEL
      );
    } catch (error) {
      // Handle case when UI operations aren't allowed
      return 'Error: SheetsAI API key not set. Please set it via SheetsAI Menu.';
    } finally {
      // Track function call (without the query content)
      const analytics = PostHogAnalytics.getInstance();
      analytics.track(acMain.EVENTS.FUNCTION_CALL, {
        hasContext: !!context,
        missingApiKey: !apiKey,
      });
    }
    return;
  }
  if (context) {
    query = query + '\n' + context;
  }
  const usageService = new LLMUsageService();
  try {
    // Get user's preferred model or use default
    const userModel =
      (secretService.getSecret('USER_OPENAI_MODEL') as OpenAiTextModelNames) ||
      getDefaultModelMain('openai');

    const openai = new OpenAIProvider(userModel, apiKey);
    const completion = await openai.generateChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that is an expert in Google Sheets, and manipulating data into input/output formats that are useable therein. Follow instructions as closely as possible. Format all your answers in plain text, so they display correctly in Google Sheets cells. If the user asks you to perform some function, do only that and add no additional text or explanation.',
        },
        { role: 'user', content: query },
      ],
    });
    usageService.storeUsage(completion.metadata, completion.usage);

    // Cache the result for 6 hours
    cache.put(cacheKey, completion.text, CACHE_TTL_SECONDS);
    completionTextLength = completion.text.length;
    selectedModel = userModel;

    return completion.text;
  } catch (error: Error | any) {
    console.error('Failed to make Open AI call: ' + error);
    throw new SheetsAIError(
      'Failed to make Open AI call: please make sure your API key is correct!'
    );
  } finally {
    // Track function call (without the query content)
    const analytics = PostHogAnalytics.getInstance();
    analytics.track(acMain.EVENTS.FUNCTION_CALL, {
      hasContext: !!context,
      queryLength: query.length,
      responseLength: completionTextLength,
      selectedModel: selectedModel,
    });
  }
}

/**
 * Function to be called when the Google Sheets is opened.
 *
 * See: https://developers.google.com/apps-script/guides/triggers#getting_started
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu(AppMenuName);
  AppMenuMapping.forEach((value, key) => {
    menu.addItem(key, value);
  });
  menu.addToUi();

  // Track addon opened event
  const analytics = PostHogAnalytics.getInstance();
  analytics.track(acMain.EVENTS.ADDON_OPENED);
}

function onInstall() {
  // TODO @allen-n: Consider doing other onboarding tasks here
  try {
    // Track addon opened event
    const analytics = PostHogAnalytics.getInstance();
    analytics.track(acMain.EVENTS.ADDON_INSTALLED);
  } catch (e) {
    console.log('Install logging error:', e);
  }
  onOpen();
  UIManager.showAlert(
    'Installation Complete',
    `SheetsAI has been installed! You can now access the SheetsAI menu in the top navigation bar for help, under 'Extensions > ${AppMenuName}'.`
  );
  showHelpSidebar();
  try {
    PropertiesService.getUserProperties();
  } catch (e) {
    authorizeApp();
  }
}

/**
 * Handles edit events from the sheet.
 * This is called via the onEdit trigger set up in TriggerService.
 */
function fireOnEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  // We don't need to do anything on edit currently
  // This is a placeholder for future edit-related functionality
  // The mere existence of this function prevents errors related to the trigger
  console.log('Edit detected: ' + JSON.stringify(e.range.getA1Notation()));
}

function authorizeApp() {
  const response = UIManager.showAlert(
    'Authorization',
    'Please authorize the app to use the necessary permissions.',
    SpreadsheetApp.getUi().ButtonSet.OK_CANCEL
  );

  if (response == SpreadsheetApp.getUi().Button.OK) {
    try {
      PropertiesService.getUserProperties();
      UIManager.showAlert(
        'Authorization Successful',
        'Authorization successful!'
      );
    } catch (e) {
      UIManager.showAlert(
        'Authorization Failed',
        'Authorization failed. Please try again. Error: ' + e
      );
    }
  }
}

/**
 * Handles template includes for HTML files.
 * Used as <?!= include('path/to/file', data); ?> in HTML templates.
 * @param filename Path to the HTML template file
 * @param data Data to pass to the template
 * @returns HTML content
 */
export function include(filename: string, data?: any): string {
  const template = HtmlService.createTemplateFromFile(filename);

  if (data) {
    template.data = data;
  }

  return template.evaluate().getContent();
}

function showHelpSidebar() {
  UIManager.showHelpSidebar();

  // Track sidebar opened event
  const analytics = PostHogAnalytics.getInstance();
  analytics.track(acMain.EVENTS.SIDEBAR_OPENED);
}

// Function to open the Set Secrets modal
function setLLmApiKeys() {
  UIManager.showSetLLMApiKeysModal();
}

export function listLLMProviders(): Map<LLMProviders, string> {
  return new Map<LLMProviders, string>([['openai', 'OpenAI']]);
}

// Function to get the stored OpenAI API key (shows only the first 8 characters)
export function getStoredApiKey(provider: LLMProviders): {
  key: string;
  instructionUrl: string;
  model?: string;
} {
  const secretService = new SecretService();
  const instructionUrl = getApiKeyInstructions(provider);
  switch (provider) {
    case 'openai':
      const key = secretService.getSecret('USER_OPENAI_KEY');
      const model =
        secretService.getSecret('USER_OPENAI_MODEL') ||
        getDefaultModelMain(provider);
      const returnKey = key ? key.substring(0, 16) + '********' : '';
      return { key: returnKey, instructionUrl, model };
    default:
      throw new SheetsAIError('Invalid LLM Provider selected: ' + provider);
  }
}

// Function to set the OpenAI API key and model
export function saveApiKey(
  provider: LLMProviders,
  key?: string,
  model?: string
) {
  switch (provider) {
    case 'openai':
      const secretService = new SecretService();
      if (key) {
        secretService.setSecret('USER_OPENAI_KEY', key);
      }

      // Save model if provided
      if (model) {
        secretService.setSecret('USER_OPENAI_MODEL', model);
      }

      // Track API key set event (without the key itself)
      const analytics = PostHogAnalytics.getInstance();
      analytics.track(acMain.EVENTS.API_KEY_SET, {
        provider,
        modelChanged: !!model,
      });

      return `OpenAI API Key saved successfully!`;
    default:
      throw new SheetsAIError('Invalid LLM Provider selected: ' + provider);
  }
}

export function getApiKeyInstructions(provider: LLMProviders) {
  switch (provider) {
    case 'openai':
      return `https://trysheetsai.com/apikeys/openai`;
    default:
      throw new SheetsAIError('Invalid LLM Provider selected: ' + provider);
  }
}

/**
 * Clears the SHEETS_AI function cache to force fresh API calls.
 * Useful when you want to get updated responses from the LLM.
 */
export function clearSheetsAICache() {
  try {
    const cache = CacheService.getUserCache();
    cache.removeAll([]);
    UIManager.showAlert(
      'Cache Cleared',
      'SheetsAI cache has been cleared. Your AI functions will now make fresh API calls.'
    );
  } catch (error) {
    console.error('Failed to clear cache: ' + error);
  }
}

/**
 * Gets the current analytics opt-out status
 * Used by the sidebar toggle
 * @returns True if analytics are opted out (disabled)
 */
function getAnalyticsStatus() {
  const analytics = PostHogAnalytics.getInstance();
  return analytics.isOptedOut();
}

/**
 * Sets the analytics opt-out status
 * Used by the sidebar toggle
 * @param optOut True to opt out (disable), false to opt in (enable)
 */
function setAnalyticsStatus(optOut: boolean): boolean {
  const analytics = PostHogAnalytics.getInstance();
  analytics.setOptOut(optOut);

  return optOut;
}

// Get available models from OpenAI API
export async function getAvailableModels(
  provider: LLMProviders
): Promise<string[]> {
  return fetchAvailableModelsMain(provider);
}
