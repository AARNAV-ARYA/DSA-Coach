import type { AiGenerationRequest, AiInsights } from '../../src/features/ai/model/ai-contracts.js';

export interface AiProvider {
  generateProblemInsights(request: AiGenerationRequest): Promise<AiInsights>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'configuration_error' | 'provider_error' | 'invalid_provider_response',
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
