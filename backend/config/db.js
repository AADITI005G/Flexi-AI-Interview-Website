const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (process.env.USE_IN_MEMORY_DB === 'true' || !uri) {
    console.log('Using in-memory storage for users.');
    global.__USERS__ = global.__USERS__ || [];
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      // Keep pool small but stable for local dev
      maxPoolSize: 10,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to in-memory storage.', err.message);
    global.__USERS__ = global.__USERS__ || [];
    process.env.USE_IN_MEMORY_DB = 'true';
  }
};

const dbStatus = async () => {
  const readyState = mongoose.connection?.readyState ?? 0; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  let ping = false;
  try {
    if (readyState === 1 && mongoose.connection.db) {
      const admin = mongoose.connection.db.admin();
      const res = await admin.ping();
      ping = Boolean(res?.ok);
    }
  } catch (_) {
    ping = false;
  }
  return { readyState, ping };
};

module.exports = { connectDB, dbStatus };