import {
  LLMProviders,
  LLMRequestMetadata,
  LLMUsage,
} from '@/llm/provider/base';
import { HierarchicalStorageService } from '@/sheets/storage/hierarchical';

export class LLMUsageService {
  private hierarchicalStorageService: HierarchicalStorageService =
    new HierarchicalStorageService();
  private basePath = 'llm/usage';
  constructor() {}

  private getPath(metadata: LLMRequestMetadata): string {
    return `${this.basePath}/${metadata.model_provider}/${metadata.model_name}/`;
  }

  storeUsage(metadata: LLMRequestMetadata, usage: LLMUsage | undefined): void {
    if (!usage) {
      return;
    }
    const prevUsage = this.getUsage(metadata);
    prevUsage.prompt_tokens += usage.prompt_tokens;
    prevUsage.completion_tokens += usage.completion_tokens;
    prevUsage.total_tokens += usage.total_tokens;
    this.hierarchicalStorageService.setValue(
      this.getPath(metadata),
      JSON.stringify(prevUsage)
    );
  }

  getUsage(metadata: LLMRequestMetadata): LLMUsage {
    const usageJson = this.hierarchicalStorageService.getValue(
      this.getPath(metadata)
    );
    if (!usageJson) {
      return {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      } as LLMUsage;
    }
    return JSON.parse(usageJson) as LLMUsage;
  }
}
