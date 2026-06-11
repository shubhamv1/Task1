const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProd = process.env.NODE_ENV === 'production';

  if (uri) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error(`Could not connect to MongoDB: ${err.message}`);
      if (isProd) throw err; // never fall back in production
    }
  } else if (isProd) {
    throw new Error('MONGODB_URI is not set. Configure it in your environment.');
  }

  // Dev-only fallback: in-memory MongoDB so the app runs without a local
  // MongoDB install or Docker. Skipped entirely in production.
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error(
      'No MongoDB available. Set MONGODB_URI, or install mongodb-memory-server for local dev.'
    );
  }
  console.warn('Falling back to in-memory MongoDB (development only)...');
  const mem = await MongoMemoryServer.create();
  const conn = await mongoose.connect(mem.getUri());
  console.log(`In-memory MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
