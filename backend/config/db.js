const mongoose = require('mongoose');
const { MemoryModel } = require('./memoryStore');

let isMongooseConnected = false;
const memoryModels = {};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log(`Connecting to MongoDB URI: ${mongoUri}...`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      isMongooseConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`Could not connect to configured MongoDB (${err.message}). Falling back to in-memory database.`);
    }
  }

  // Attempt local MongoDB instance
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/saas_db', {
      serverSelectionTimeoutMS: 1500
    });
    isMongooseConnected = true;
    console.log(`MongoDB Connected locally: ${conn.connection.host}`);
  } catch (localErr) {
    console.log('MongoDB service not found on local port 27017. Initializing High-Performance In-Memory Multi-Tenant Store.');
    isMongooseConnected = false;
  }
};

const getModel = (name, mongooseModel) => {
  if (isMongooseConnected) {
    return mongooseModel;
  }
  if (!memoryModels[name]) {
    memoryModels[name] = new MemoryModel(name);
  }
  return memoryModels[name];
};

module.exports = { connectDB, getModel, isConnected: () => isMongooseConnected };
