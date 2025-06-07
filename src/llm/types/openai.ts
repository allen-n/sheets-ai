import {
  ImageChatMessageContent,
  LLMProviders,
  TextChatMessageContent,
} from '@/llm/provider/base';
import { getStoredApiKey } from '@/main';
// https://platform.openai.com/docs/models/model-endpoint-compatibility
// Define a type for the acceptable model names
export type OpenAiTextModelNames =
  | 'gpt-4.1-nano'
  | 'gpt-4.1-preview'
  | 'gpt-4.1'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-instruct';

export type OpenAiModelNames =
  | OpenAiTextModelNames
  | 'whisper-1'
  | 'tts-1'
  | 'tts-1-hd'
  | 'babbage-002'
  | 'davinci-002'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002'
  | 'text-moderation-stable'
  | 'text-moderation-latest'
  | 'dall-e-2'
  | 'dall-e-3';

export type OpenAiEndpoint =
  | '/v1/assistants'
  | '/v1/audio/transcriptions'
  | '/v1/audio/translations'
  | '/v1/audio/speech'
  | '/v1/chat/completions'
  | '/v1/completions (Legacy)'
  | '/v1/embeddings'
  | '/v1/fine_tuning/jobs'
  | '/v1/moderations'
  | '/v1/images/generations';

// Function to fetch available models from OpenAI API
export async function fetchAvailableModels(
  provider: LLMProviders
): Promise<string[]> {
  try {
    const apiKey = getStoredApiKey(provider);
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      muteHttpExceptions: true,
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      console.error(`Failed to fetch models: ${responseCode}`);
      return getDefaultChatModels(provider);
    }

    const jsonResponse = JSON.parse(response.getContentText());
    const models = jsonResponse.data
      .map((model: any) => model.id)
      .filter(
        (modelId: string) =>
          modelId.startsWith('gpt-') &&
          !modelId.includes('instruct') &&
          !modelId.includes('vision') &&
          !modelId.includes('embedding')
      );

    return models.length > 0 ? models : getDefaultChatModels(provider);
  } catch (error) {
    console.error('Error fetching models:', error);
    return getDefaultChatModels(provider);
  }
}

// Default chat models if API call fails
export function getDefaultChatModels(
  provider: LLMProviders
): OpenAiTextModelNames[] {
  switch (provider) {
    case 'openai':
      return [
        'gpt-4.1-nano',
        'gpt-4.1-preview',
        'gpt-4.1',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4',
        'gpt-3.5-turbo',
      ];
    default:
      return ['gpt-4.1-nano'];
  }
}
/**
 * Get the default model for a given provider
 * @param provider The provider to get the default model for
 * @returns The default model for the given provider
 */
export function getDefaultModel(provider: LLMProviders): OpenAiTextModelNames {
  switch (provider) {
    case 'openai':
      return 'gpt-4.1-nano';
    default:
      return 'gpt-4.1-nano';
  }
}

// Define an object that maps endpoints to acceptable models
export const EndpointModelMapping: Record<OpenAiEndpoint, OpenAiModelNames[]> =
  {
    '/v1/assistants': [
      'gpt-4.1-nano',
      'gpt-4.1-preview',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-3.5-turbo',
    ],
    '/v1/audio/transcriptions': ['whisper-1'],
    '/v1/audio/translations': ['whisper-1'],
    '/v1/audio/speech': ['tts-1', 'tts-1-hd'],
    '/v1/chat/completions': [
      'gpt-4.1-nano',
      'gpt-4.1-preview',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-3.5-turbo',
    ],
    '/v1/completions (Legacy)': [
      'gpt-3.5-turbo-instruct',
      'babbage-002',
      'davinci-002',
    ],
    '/v1/embeddings': [
      'text-embedding-3-small',
      'text-embedding-3-large',
      'text-embedding-ada-002',
    ],
    '/v1/fine_tuning/jobs': [
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-3.5-turbo',
      'babbage-002',
      'davinci-002',
    ],
    '/v1/moderations': ['text-moderation-stable', 'text-moderation-latest'],
    '/v1/images/generations': ['dall-e-2', 'dall-e-3'],
  };

export const ModelEndpointMapping: Record<string, OpenAiEndpoint[]> = {
  'gpt-4.1-nano': ['/v1/assistants', '/v1/chat/completions'],
  'gpt-4.1-preview': ['/v1/assistants', '/v1/chat/completions'],
  'gpt-4.1': ['/v1/assistants', '/v1/chat/completions', '/v1/fine_tuning/jobs'],
  'gpt-4o-mini': [
    '/v1/assistants',
    '/v1/chat/completions',
    '/v1/fine_tuning/jobs',
  ],
  'gpt-4': ['/v1/assistants', '/v1/chat/completions', '/v1/fine_tuning/jobs'],
  'gpt-3.5-turbo': [
    '/v1/assistants',
    '/v1/chat/completions',
    '/v1/fine_tuning/jobs',
  ],
  'gpt-4o': ['/v1/assistants', '/v1/chat/completions', '/v1/fine_tuning/jobs'],
  'whisper-1': ['/v1/audio/transcriptions', '/v1/audio/translations'],
  'tts-1': ['/v1/audio/speech'],
  'tts-1-hd': ['/v1/audio/speech'],
  'gpt-3.5-turbo-instruct': ['/v1/completions (Legacy)'],
  'babbage-002': ['/v1/completions (Legacy)', '/v1/fine_tuning/jobs'],
  'davinci-002': ['/v1/completions (Legacy)', '/v1/fine_tuning/jobs'],
  'text-embedding-3-small': ['/v1/embeddings'],
  'text-embedding-3-large': ['/v1/embeddings'],
  'text-embedding-ada-002': ['/v1/embeddings'],
  'text-moderation-stable': ['/v1/moderations'],
  'text-moderation-latest': ['/v1/moderations'],
  'dall-e-2': ['/v1/images/generations'],
  'dall-e-3': ['/v1/images/generations'],
};

export type OpenAiChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: Array<TextChatMessageContent | ImageChatMessageContent> | string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any;
};
