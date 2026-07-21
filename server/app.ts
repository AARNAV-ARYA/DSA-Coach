import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import {
  aiGenerationRequestSchema,
  aiGenerationResponseSchema,
} from '../src/features/ai/model/ai-contracts.js';
import { AiProviderError, type AiProvider } from './ai/ai-provider.js';

interface CreateServerOptions {
  aiProvider: AiProvider;
  logger?: boolean;
}

export async function createServer(options: CreateServerOptions): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 32 * 1024,
    requestTimeout: 30_000,
  });

  await server.register(cors, {
    origin: (origin, callback) => {
      const isAllowed = origin === undefined || isAllowedOrigin(origin);
      callback(null, isAllowed);
    },
    methods: ['GET', 'POST'],
  });
  await server.register(rateLimit, {
    max: 10,
    timeWindow: '1 minute',
    errorResponseBuilder: (request) => ({
      code: 'rate_limited',
      message: 'Too many AI requests. Please wait before trying again.',
      requestId: request.id,
      retryable: true,
    }),
  });

  server.get('/health', () => ({ status: 'ok' }));

  server.post('/v1/ai/problem-insights', async (request, reply) => {
    const parsedRequest = aiGenerationRequestSchema.parse(request.body);
    const insights = await options.aiProvider.generateProblemInsights(parsedRequest);
    return reply.send(aiGenerationResponseSchema.parse({ insights }));
  });

  server.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      void reply.status(400).send({
        code: 'invalid_request',
        message: 'The AI request contains invalid or unapproved context.',
        requestId: request.id,
        retryable: false,
        fieldErrors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    if (error instanceof AiProviderError) {
      const status = error.code === 'configuration_error' ? 503 : 502;
      void reply.status(status).send({
        code: error.code,
        message: publicProviderMessage(error),
        requestId: request.id,
        retryable: error.retryable,
      });
      return;
    }

    request.log.error({ error }, 'Unhandled API error');
    void reply.status(500).send({
      code: 'internal_error',
      message: 'The request could not be completed.',
      requestId: request.id,
      retryable: false,
    });
  });

  return server;
}

function isAllowedOrigin(origin: string): boolean {
  if (origin.startsWith('chrome-extension://')) return true;

  try {
    const url = new URL(origin);
    return (
      url.protocol === 'http:' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
    );
  } catch {
    return false;
  }
}

function publicProviderMessage(error: AiProviderError): string {
  if (error.code === 'configuration_error') {
    return 'The AI service is not configured.';
  }
  if (error.retryable) {
    return 'The AI provider is temporarily unavailable. Please try again.';
  }
  return 'The AI provider returned an unusable response.';
}
