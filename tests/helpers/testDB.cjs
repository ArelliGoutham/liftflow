const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer = null;

async function connectTestDB() {
  if (mongoServer) return;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(uri, { bufferCommands: false });
  const modelNames = Object.keys(mongoose.models);
  modelNames.forEach((name) => delete mongoose.models[name]);
}

async function disconnectTestDB() {
  await mongoose.disconnect();
  if (mongoServer) { await mongoServer.stop(); mongoServer = null; }
}

async function clearTestDB() {
  if (!mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) { await collection.deleteMany({}); }
}

module.exports = { connectTestDB, disconnectTestDB, clearTestDB, mongoose };
