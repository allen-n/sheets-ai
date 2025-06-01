import { cyrb64Hash, SheetsAIError } from '@/common/utils';
import { LLMProviders } from '@/llm/provider/base';
import { OpenAIProvider } from '@/llm/provider/openai';
import { SecretService } from '@/sheets/secrets';
import { LLMUsageService } from '@/sheets/storage/llm-usage';
import { UIManager } from '@/ui/UIManager';

const AppMenuName = 'SheetsAI Menu';
const AppMenuMapping = new Map<string, string>([
  ['Set API Keys', setLLmApiKeys.name],
  ['Get Help', showHelpSidebar.name],
  ['Clear Cache', clearSheetsAICache.name],
]);

const CACHE_TTL_SECONDS = 21600; // 6 hours
const hash = cyrb64Hash;

/**
 * Generates text using a large language model. Defaults to GPT-4o. Requires API key to be set in the `SheetsAI Menu > Set API Keys` menu.
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
  const cacheKey = `SHEETS_AI_${hash(query)}_${hash(context || '')}`;

  // Get the cache
  const cache = CacheService.getUserCache();
  const cachedResult = cache.get(cacheKey);
  Logger.log('cacheKey: ' + cacheKey);
  Logger.log('cachedResult: ' + cachedResult);
  Logger.log('isCacheHit: ' + !!cachedResult);
  // Return cached result if available
  if (cachedResult) {
    return cachedResult;
  }

  const apiKey = new SecretService().getSecret('USER_OPENAI_KEY');
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
    }
    return;
  }
  if (context) {
    query = query + '\n' + context;
  }
  const usageService = new LLMUsageService();
  try {
    const openai = new OpenAIProvider('gpt-4o-mini', apiKey);
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

    return completion.text;
  } catch (error: Error | any) {
    console.error('Failed to make Open AI call: ' + error);
    throw new SheetsAIError(
      'Failed to make Open AI call: please make sure your API key is correct!'
    );
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
}

function onInstall() {
  // TODO @allen-n: Consider doing other onboarding tasks here
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
} {
  const secretService = new SecretService();
  const instructionUrl = getApiKeyInstructions(provider);
  switch (provider) {
    case 'openai':
      const key = secretService.getSecret('USER_OPENAI_KEY');
      const returnKey = key ? key.substring(0, 16) + '********' : '';
      return { key: returnKey, instructionUrl };
    default:
      throw new SheetsAIError('Invalid LLM Provider selected: ' + provider);
  }
}

// Function to set the OpenAI API key
export function saveApiKey(provider: LLMProviders, key: string) {
  switch (provider) {
    case 'openai':
      const secretService = new SecretService();
      secretService.setSecret('USER_OPENAI_KEY', key);
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
