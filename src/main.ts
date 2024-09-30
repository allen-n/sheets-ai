import { SheetsGPTError } from '@/common/utils';
import { LLMProviders } from '@/llm/provider/base';
import { OpenAIProvider } from '@/llm/provider/openai';
import { SecretService } from '@/sheets/secrets';
import { LLMUsageService } from '@/sheets/storage/llm-usage';

const AppMenuName = 'SheetsGPT Menu';
const AppMenuMapping = new Map<string, string>([
  ['Authorize', authorizeApp.name],
  ['Set API Keys', setLLmApiKeys.name],
]);

/**
 * Generates text using a large language model. Defaults to GPT-4o. Requires API key to be set in the `SheetsGPT Menu > Set API Keys` menu.
 * @param {string} query The query for the model, i.e. "What is the capital of the United States?" or "Is the animal in this cell a feline?"
 * @param {string | undefined} context [optional] If provided, will add this context into the query, i.e. if asking "Is the animal in this cell a feline?" and the context is a cell containing the word "Cat" or "dog".
 * @returns {string} The generated text from the model.
 * @customfunction
 */
async function gpt(query: string, context?: string): Promise<string | void> {
  const apiKey = new SecretService().getSecret('USER_OPENAI_KEY');
  if (!apiKey) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Your OpenAI key is not set! Please set it now in ' +
        AppMenuName +
        ' in the top nar (right of "Help")',
      ui.ButtonSet.OK_CANCEL
    );

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
    return completion.text;
  } catch (error: Error | any) {
    console.error('Failed to make Open AI call: ' + error);
    throw new SheetsGPTError(
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
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'SheetsGPT has been installed! You can now access the SheetsGPT menu in the top navigation bar, under "' +
      AppMenuName +
      '".\n\nPlease head over there to authorize the app with the permissions it needs to run, under "' +
      AppMenuName +
      ' > ' +
      AppMenuMapping.keys().next() +
      '".'
  );
}

function authorizeApp() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Authorization',
    'Please authorize the app to use the necessary permissions.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response == ui.Button.OK) {
    try {
      PropertiesService.getUserProperties();
      ui.alert('Authorization successful!');
    } catch (e) {
      ui.alert('Authorization failed. Please try again. Error: ' + e);
    }
  }
}

// Function to open the Set Secrets modal
function setLLmApiKeys() {
  const html = HtmlService.createHtmlOutputFromFile(
    'ui/html/SetLLMProvider.html'
  )
    .setWidth(600)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Set you LLM API Key(s)');
}

function listLLMProviders(): Map<LLMProviders, string> {
  return new Map<LLMProviders, string>([['openai', 'OpenAI']]);
}
// Function to get the stored OpenAI API key (shows only the first 8 characters)
function getStoredApiKey(provider: LLMProviders): string {
  const secretService = new SecretService();
  switch (provider) {
    case 'openai':
      const key = secretService.getSecret('USER_OPENAI_KEY');
      return key ? key.substring(0, 16) + '********' : '';
    default:
      throw new SheetsGPTError('Invalid LLM Provider selected: ' + provider);
  }
}

// Function to set the OpenAI API key
function saveApiKey(provider: LLMProviders, key: string) {
  switch (provider) {
    case 'openai':
      const secretService = new SecretService();
      secretService.setSecret('USER_OPENAI_KEY', key);
      return `OpenAI API Key saved successfully!`;
    default:
      throw new SheetsGPTError('Invalid LLM Provider selected: ' + provider);
  }
}
