import { ApiService } from '@/api/base';
import {
  ILLMProvider,
  ILLMProviderError,
  ImageChatMessageContent,
  LLMCompletion,
  LLMMessage,
  LLMMessageRole,
  LLMRequestMetadata,
  TextChatMessageContent,
} from '@/llm/provider/base';
import { Tool } from '@/llm/tool/base';
import { OpenAiEndpoint, OpenAiModelNames } from '@/llm/types/openai';

export class OpenAIProvider implements ILLMProvider {
  private apiService: ApiService;
  private defaultModel: OpenAiModelNames;

  constructor(defaultModel: OpenAiModelNames, apiKey: string) {
    this.apiService = new ApiService('https://api.openai.com', {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    });
    this.defaultModel = defaultModel;
  }

  private isToolCall(completion: any): any | undefined {
    return completion.choices[0].finish_reason === 'tool_calls'
      ? completion.choices[0]
      : undefined;
  }

  private parseToolCall<T extends Tool>(
    choice: any,
    tool: T
  ): { tool: T; args: any } | undefined {
    const toolNames = choice.message.tool_calls;
    if (!toolNames) {
      return undefined;
    }
    const toolCall = toolNames[0];
    if (toolCall.function.name === tool.name && toolCall.type === 'function') {
      return { tool: tool, args: JSON.parse(toolCall.function.arguments) };
    }

    return undefined;
  }

  async generateChatCompletion({
    messages,
    tools = undefined,
    maxTokens = 200,
    model = this.defaultModel,
  }: {
    messages: Array<LLMMessage>;
    tools?: Array<Tool>;
    maxTokens: number;
    model: OpenAiModelNames;
  }): Promise<OpenaiCompletion> {
    const openAiMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
      tool_calls: message.tool_calls,
    }));

    const openAiFunctions = tools?.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const payload = {
      model: model,
      messages: openAiMessages,
      max_tokens: maxTokens,
      tools: openAiFunctions,
    };

    const response = this.apiService.post('/v1/chat/completions', payload);
    const completion = JSON.parse(response.getContentText());

    const choice = this.isToolCall(completion);
    if (choice && tools) {
      for (const t of tools) {
        const parsed = this.parseToolCall(choice, t);
        if (!parsed) {
          continue;
        }

        const exec = parsed.tool.execute(parsed.args);
        const toolCall = choice.message.tool_calls
          ? choice.message.tool_calls[0]
          : undefined;
        if (!toolCall) {
          throw new OpenAiProviderError('Tool call not found in completion');
        }
        const functionCallResultMessage = {
          role: 'tool' as LLMMessageRole,
          content: JSON.stringify(exec),
          tool_call_id: toolCall?.id as string,
          tool_calls: undefined,
        };
        openAiMessages.push({
          content: choice.message.content ?? '',
          role: choice.message.role,
          tool_calls: choice.message.tool_calls,
        });
        openAiMessages.push(functionCallResultMessage);
        const finalResponse = this.apiService.post('/v1/chat/completions', {
          model: model,
          messages: openAiMessages,
          max_tokens: maxTokens,
        });
        const finalCompletion = JSON.parse(finalResponse.getContentText());

        return {
          text: finalCompletion.choices[0].message.content ?? '',
          usage: {
            total_tokens:
              (finalCompletion.usage?.total_tokens ?? 0) +
              (completion.usage?.total_tokens ?? 0),
            prompt_tokens:
              (finalCompletion.usage?.prompt_tokens ?? 0) +
              (completion.usage?.prompt_tokens ?? 0),
            completion_tokens:
              (finalCompletion.usage?.completion_tokens ?? 0) +
              (completion.usage?.completion_tokens ?? 0),
          },
          metadata: {
            model_endpoint: '/v1/chat/completions',
            model_name: model,
            model_provider: 'openai',
          },
        };
      }
    }

    return {
      text: completion.choices[0].message.content ?? '',
      usage: completion.usage,
      metadata: {
        model_endpoint: '/v1/chat/completions',
        model_name: model,
        model_provider: 'openai',
      },
    };
  }
}

interface OpenaiRequestMetadata extends LLMRequestMetadata {
  model_name: OpenAiModelNames;
  model_endpoint: OpenAiEndpoint;
  model_provider: 'openai';
}

interface OpenaiCompletion extends LLMCompletion {
  metadata: OpenaiRequestMetadata;
}

class OpenAiProviderError extends ILLMProviderError {}
