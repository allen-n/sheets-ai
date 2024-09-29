import { SheetsGPTError } from '@/common/utils';
import { LLMProviders } from '@/llm/provider/base';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('SheetsGPT Menu');
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
      PropertiesService.getDocumentProperties();
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
      return key ? key.substring(0, 8) + '********' : '';
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
