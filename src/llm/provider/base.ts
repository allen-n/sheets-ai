// llmProvider.ts
import { Tool } from '@/llm/tool/base';
export type LLMMessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type LLMProviders = 'openai';
export interface ChatMessageContent {
  type: 'text' | 'image_url' | 'tool';
}

export interface TextChatMessageContent extends ChatMessageContent {
  type: 'text';
  text: string;
}
export interface ImageChatMessageContent extends ChatMessageContent {
  type: 'image_url';
  image_url: { url: string };
}

export interface LLMMessage {
  role: LLMMessageRole;
  content: Array<TextChatMessageContent | ImageChatMessageContent> | string;
  name?: string;
  tool_calls?: any;
}

export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  duration_ms?: number;
}

export interface LLMRequestMetadata {
  model_name: string;
  model_endpoint: string;
  model_provider: LLMProviders;
}

export interface LLMCompletion {
  text: string;
  usage?: LLMUsage;
  metadata: LLMRequestMetadata;
  functionCall?: {
    name: string;
    arguments: any;
  };
}

export interface ILLMProvider {
  generateChatCompletion(args: {
    messages: Array<LLMMessage>;
    tools?: Array<Tool>;
    maxTokens?: number;
    model?: string;
  }): Promise<LLMCompletion>;
}

export class ILLMProviderError extends Error {}
