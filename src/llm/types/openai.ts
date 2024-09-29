import {
  ImageChatMessageContent,
  TextChatMessageContent,
} from '@/llm/provider/base';
// https://platform.openai.com/docs/models/model-endpoint-compatibility
// Define a type for the acceptable model names
export type OpenAiModelNames =
  | 'chatgpt-4o-latest'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-mini'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo-preview'
  | 'gpt-3.5-turbo-1106'
  | 'whisper-1'
  | 'tts-1'
  | 'tts-1-hd'
  | 'gpt-3.5-turbo-instruct'
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

// Define an object that maps endpoints to acceptable models
export const EndpointModelMapping: Record<OpenAiEndpoint, OpenAiModelNames[]> =
  {
    '/v1/assistants': [
      'chatgpt-4o-latest',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-3.5-turbo-preview',
      'gpt-3.5-turbo-1106',
      'gpt-4o-2024-08-06',
    ],
    '/v1/audio/transcriptions': ['whisper-1'],
    '/v1/audio/translations': ['whisper-1'],
    '/v1/audio/speech': ['tts-1', 'tts-1-hd'],
    '/v1/chat/completions': [
      'chatgpt-4o-latest',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-4o-2024-08-06',
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
export const ModelEndpointMapping: Record<OpenAiModelNames, OpenAiEndpoint[]> =
  {
    'chatgpt-4o-latest': ['/v1/assistants', '/v1/chat/completions'],
    'gpt-4o-2024-08-06': ['/v1/assistants', '/v1/chat/completions'],
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
    'gpt-4o': [
      '/v1/assistants',
      '/v1/chat/completions',
      '/v1/fine_tuning/jobs',
    ],
    'gpt-3.5-turbo-preview': ['/v1/assistants'],
    'gpt-3.5-turbo-1106': ['/v1/assistants'],
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
