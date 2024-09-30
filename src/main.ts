import { SheetsGPTError } from '@/common/utils';
import { LLMProviders } from '@/llm/provider/base';
import { OpenAIProvider } from '@/llm/provider/openai';

const MenuItemName = 'SheetsGPT Menu';

async function gpt(query: string) {
  const apiKey = new SecretService().getSecret('USER_OPENAI_KEY');
  if (!apiKey) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Your OpenAI key is not set! Please set it now in ' +
        MenuItemName +
        ' in the top nar (right of "Help")',
      ui.ButtonSet.OK_CANCEL
    );
    return;
  }

  try {
    const openai = new OpenAIProvider('gpt-4o-2024-08-06', apiKey);
    const completion = await openai.generateChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that is an expert in Google Sheets, and manipulating data into input/output formats that are useable therein. Follow instructions as closely as possible.',
        },
        { role: 'user', content: query },
      ],
    });
    return completion.text;
  } catch (error: Error | any) {
    console.error('Failed to make Open AI call: ' + error);
    throw new SheetsGPTError(
      'Failed to make Open AI call: please make sure your API key is correct!'
    );
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu(MenuItemName);
  menu
    .addItem('Authorize', 'authorizeApp')
    .addItem('Set API Keys', 'setLLmApiKeys')
    .addToUi();
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
  SpreadsheetApp.getUi().showModalDialog(html, 'Set LLM API Key(s)');
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
