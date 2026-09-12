import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import dns from 'node:dns/promises'; dns.setServers(['1.1.1.1', '8.8.8.8']);)

dns.setServers(['1.1.1.1', '8.8.8.8']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unboxarts';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: Cached;
}

let cached: Cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}