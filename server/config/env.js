import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FINANCE_PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must contain at least 32 characters'),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  BUSINESS_TIME_ZONE: z.string().min(1).default('Africa/Lagos'),
  ENSURE_DATABASE_INDEXES: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  AI_PRIMARY_PROVIDER: z.enum(['gemini', 'groq']).default('gemini'),
  AI_FALLBACK_PROVIDER: z.enum(['gemini', 'groq']).default('groq'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
  AI_MAX_RETRIES_PER_PROVIDER: z.coerce.number().int().min(0).max(2).default(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${message}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
