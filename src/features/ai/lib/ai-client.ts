import {
  aiGenerationResponseSchema,
  type AiGenerationRequest,
  type AiInsights,
} from '@/features/ai/model/ai-contracts';

const DEFAULT_AI_API_BASE_URL = 'http://127.0.0.1:8787';
const LOCAL_API_PERMISSION = 'http://127.0.0.1:8787/*';
const REQUEST_TIMEOUT_MS = 30_000;

export class AiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiClientError';
  }
}

export async function generateAiInsights(request: AiGenerationRequest): Promise<AiInsights> {
  await ensureApiPermission();

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/v1/ai/problem-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new AiClientError(
      'DSA Coach could not reach the local AI service. Start it with npm run dev:api.',
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = extractApiErrorMessage(body);
    throw new AiClientError(message ?? 'The AI request could not be completed.');
  }

  const parsed = aiGenerationResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AiClientError('The AI service returned an invalid response.');
  }

  return parsed.data.insights;
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_AI_API_BASE_URL as string | undefined;
  return (configured ?? DEFAULT_AI_API_BASE_URL).replace(/\/$/, '');
}

async function ensureApiPermission(): Promise<void> {
  if (
    getApiBaseUrl() !== DEFAULT_AI_API_BASE_URL ||
    typeof chrome === 'undefined' ||
    chrome.permissions === undefined
  ) {
    return;
  }

  const hasPermission = await chrome.permissions.contains({ origins: [LOCAL_API_PERMISSION] });
  if (hasPermission) return;

  const granted = await chrome.permissions.request({ origins: [LOCAL_API_PERMISSION] });
  if (!granted) {
    throw new AiClientError('Local AI service access was not granted.');
  }
}

function extractApiErrorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const message = (value as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}
