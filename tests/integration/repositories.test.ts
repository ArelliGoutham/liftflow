const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/testDB.cjs');
const { getUserPlans, createPlan, getPlanById, deletePlan } = require('@/lib/db/repositories/planRepository');
const { createWorkoutDay, getPlanWorkoutDays, updateWorkoutDay, deleteWorkoutDay } = require('@/lib/db/repositories/workoutDayRepository');
const { createSession, getRecentSessions, completeSession } = require('@/lib/db/repositories/sessionRepository');
const { createLog, getLogsByExercise, updateLog, getLogsBySession } = require('@/lib/db/repositories/logRepository');
const { saveChatMessage, getChatHistory, clearChatHistory } = require('@/lib/db/repositories/chatRepository');

jest.mock('@/lib/db/connection', () => {
  const mongoose = require('mongoose');
  return { default: async () => mongoose, mongoose, __esModule: true };
});

const USER_A = '507f1f77bcf86cd799439011';
const USER_B = '507f1f77bcf86cd799439022';
const PLAN_ID = '507f1f77bcf86cd799439033';

describe('Repository Integration Tests (In-Memory MongoDB)', () => {
  beforeAll(async () => { await connectTestDB(); }, 30000);
  afterAll(async () => { await disconnectTestDB(); });
  beforeEach(async () => { await clearTestDB(); });

  describe('Plan Repository', () => {
    it('creates and retrieves a plan', async () => {
      const plan = await createPlan({ userId: USER_A, name: 'Test Plan', isActive: true });
      expect(plan._id).toBeDefined();
      const plans = await getUserPlans(USER_A);
      expect(plans).toHaveLength(1);
    });

    it('isolates plans by user', async () => {
      await createPlan({ userId: USER_A, name: 'A' });
      await createPlan({ userId: USER_B, name: 'B' });
      expect(await getUserPlans(USER_A)).toHaveLength(1);
      expect(await getUserPlans(USER_B)).toHaveLength(1);
    });

    it('gets plan by ID with user filter', async () => {
      const plan = await createPlan({ userId: USER_A, name: 'Test' });
      expect(await getPlanById(plan._id.toString(), USER_A)).toBeTruthy();
      expect(await getPlanById(plan._id.toString(), USER_B)).toBeNull();
    });

    it('deletes plan with user filter', async () => {
      const plan = await createPlan({ userId: USER_A, name: 'Test' });
      expect(await deletePlan(plan._id.toString(), USER_A)).toBeTruthy();
    });
  });

  describe('WorkoutDay Repository', () => {
    beforeEach(async () => {
      await createPlan({ _id: PLAN_ID, userId: USER_A, name: 'P', isActive: true });
    });

    it('creates and retrieves workout days', async () => {
      const day = await createWorkoutDay({ planId: PLAN_ID, userId: USER_A, title: 'Upper', date: '2026-09-14' });
      expect(day._id).toBeDefined();
      expect(await getPlanWorkoutDays(PLAN_ID)).toHaveLength(1);
    });

    it('updates workout day with user filter', async () => {
      const day = await createWorkoutDay({ planId: PLAN_ID, userId: USER_A, title: 'Legs', date: '2026-09-15' });
      expect((await updateWorkoutDay(day._id.toString(), USER_A, { title: 'Changed' }))?.title).toBe('Changed');
      expect(await updateWorkoutDay(day._id.toString(), USER_B, { title: 'Hack' })).toBeNull();
    });

    it('deletes workout day with user filter', async () => {
      const day = await createWorkoutDay({ planId: PLAN_ID, userId: USER_A, title: 'X', date: '2026-09-16' });
      expect(await deleteWorkoutDay(day._id.toString(), USER_B)).toBeNull();
      expect(await deleteWorkoutDay(day._id.toString(), USER_A)).toBeTruthy();
    });
  });

  describe('Session Repository', () => {
    it('creates and retrieves sessions', async () => {
      const s = await createSession({ userId: USER_A, planId: PLAN_ID, workoutDayId: '507f1f77bcf86cd799439044' });
      expect(s._id).toBeDefined();
      expect(await getRecentSessions(USER_A, 10)).toHaveLength(1);
    });

    it('completes a session', async () => {
      const s = await createSession({ userId: USER_A, planId: PLAN_ID, workoutDayId: '507f1f77bcf86cd799439044' });
      expect((await completeSession(s._id.toString(), USER_A))?.completedAt).toBeDefined();
    });

    it('isolates sessions by user', async () => {
      await createSession({ userId: USER_A, planId: PLAN_ID, workoutDayId: '507f1f77bcf86cd799439044' });
      await createSession({ userId: USER_B, planId: PLAN_ID, workoutDayId: '507f1f77bcf86cd799439044' });
      expect(await getRecentSessions(USER_A, 10)).toHaveLength(1);
      expect(await getRecentSessions(USER_B, 10)).toHaveLength(1);
    });
  });

  describe('Log Repository', () => {
    it('creates and retrieves logs', async () => {
      const log = await createLog({ userId: USER_A, sessionId: '507f1f77bcf86cd799439055', exerciseId: 'Squat', completed: true, sets: 3 });
      expect(log._id).toBeDefined();
      expect(await getLogsByExercise(USER_A, 'Squat')).toHaveLength(1);
    });

    it('updates log with user filter', async () => {
      const log = await createLog({ userId: USER_A, sessionId: '507f1f77bcf86cd799439055', exerciseId: 'Bench', completed: false });
      expect((await updateLog(log._id.toString(), USER_A, { completed: true }))?.completed).toBe(true);
    });

    it('retrieves logs by session', async () => {
      const sid = '507f1f77bcf86cd799439066';
      await createLog({ userId: USER_A, sessionId: sid, exerciseId: 'A', completed: true });
      await createLog({ userId: USER_A, sessionId: sid, exerciseId: 'B', completed: false });
      expect(await getLogsBySession(sid)).toHaveLength(2);
    });
  });

  describe('Chat Repository', () => {
    it('saves and retrieves chat history', async () => {
      await saveChatMessage(USER_A, 'user', 'Hello');
      await saveChatMessage(USER_A, 'assistant', 'Hi!');
      expect(await getChatHistory(USER_A)).toHaveLength(2);
    });

    it('clears chat history', async () => {
      await saveChatMessage(USER_A, 'user', 'Test');
      expect(await clearChatHistory(USER_A)).toBe(1);
      expect(await getChatHistory(USER_A)).toHaveLength(0);
    });

    it('isolates chat by user', async () => {
      await saveChatMessage(USER_A, 'user', 'A');
      await saveChatMessage(USER_B, 'user', 'B');
      expect(await getChatHistory(USER_A)).toHaveLength(1);
      expect(await getChatHistory(USER_B)).toHaveLength(1);
    });
  });
});
