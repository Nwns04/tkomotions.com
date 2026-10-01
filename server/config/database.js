import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10_000,
  });

  if (env.ENSURE_DATABASE_INDEXES) {
    await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
