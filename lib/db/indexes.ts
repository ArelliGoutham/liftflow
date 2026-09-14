import mongoose from 'mongoose';

/**
 * Creates required MongoDB indexes on plans, workoutdays, workoutsessions, exerciselogs, and exercises collections.
 * @returns Promise that resolves when all indexes have been created
 */
const createIndexes = async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  await db.collection('plans').createIndex({ userId: 1, updatedAt: -1 });
  await db.collection('workoutdays').createIndex({ planId: 1, date: 1 });
  await db.collection('workoutsessions').createIndex({ userId: 1, startedAt: -1 });
  await db.collection('exerciselogs').createIndex({ userId: 1, exerciseId: 1, loggedAt: -1 });
  await db.collection('exercises').createIndex({ isShared: 1, name: 1 });
};

export default createIndexes;
