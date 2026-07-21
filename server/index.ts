import { createServer } from './app.js';
import { GroqAiProvider } from './ai/groq-ai-provider.js';

const host = '127.0.0.1';
const port = parsePort(process.env.DSA_COACH_API_PORT);
const apiKey = process.env.GROQ_API_KEY;

if (apiKey === undefined || apiKey.trim().length === 0) {
  throw new Error('GROQ_API_KEY is required. Add it to the ignored .env file.');
}

const aiProvider = new GroqAiProvider({
  apiKey,
  ...(process.env.GROQ_MODEL === undefined ? {} : { model: process.env.GROQ_MODEL }),
});
const server = await createServer({ aiProvider, logger: true });

await server.listen({ host, port });

function parsePort(value: string | undefined): number {
  if (value === undefined) return 8787;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error('DSA_COACH_API_PORT must be a valid TCP port.');
  }
  return parsed;
}
