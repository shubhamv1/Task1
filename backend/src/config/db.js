const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return;
  } catch (err) {
    console.warn(`Could not connect to MongoDB at ${uri}: ${err.message}`);
  }

  // Dev fallback: spin up an in-memory MongoDB so the app runs without
  // a local MongoDB install or Docker. Not used in production.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Falling back to in-memory MongoDB (development only)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    const conn = await mongoose.connect(mem.getUri());
    console.log(`In-memory MongoDB connected: ${conn.connection.host}`);
    return;
  }

  throw new Error('MongoDB connection failed');
};

module.exports = connectDB;
