import mongoose from 'mongoose';

/**
 * The Sales Engine runs inside the Next.js process, which is separate from the
 * Express finance API process. Both talk to the same MongoDB deployment, so this
 * module owns its own connection and caches it on the global object to survive
 * Next.js hot-module reloading in development.
 */
type ConnectionCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & {
  __tkoSalesEngineMongo?: ConnectionCache;
};

const cache: ConnectionCache = globalCache.__tkoSalesEngineMongo ?? { connection: null, promise: null };
globalCache.__tkoSalesEngineMongo = cache;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured. The Sales Engine cannot reach the database.');
  }

  if (cache.connection && cache.connection.connection.readyState === 1) {
    return cache.connection;
  }

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(uri, {
        autoIndex: process.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error) => {
        // Clear the cached promise so a later request can retry instead of
        // permanently reusing a rejected promise.
        cache.promise = null;
        throw error;
      });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
