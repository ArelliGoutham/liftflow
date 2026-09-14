// Use require to avoid jsdom ESM transform issues
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer: any = null;

export async function connectTestDB(): Promise<void> {
  if (mongoServer) return;

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.disconnect();
  await mongoose.connect(uri, { bufferCommands: false });

  const modelNames = Object.keys(mongoose.models);
  modelNames.forEach((name: string) => delete mongoose.models[name]);
}

export async function disconnectTestDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearTestDB(): Promise<void> {
  if (!mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}
