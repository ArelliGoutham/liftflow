import { computeWeekSchedule, isRestDay } from '@/lib/schedule';

const mockWorkoutDays = [
  { _id: 'd1', dayOfWeek: 1, title: 'Upper Body A', isRest: false },
  { _id: 'd2', dayOfWeek: 2, title: 'Lower Body A', isRest: false },
  { _id: 'd3', dayOfWeek: 3, title: 'Cardio', isRest: false },
  { _id: 'd4', dayOfWeek: 4, title: 'Upper Body B', isRest: false },
  { _id: 'd5', dayOfWeek: 5, title: 'Lower Body B', isRest: false },
  { _id: 'd6', dayOfWeek: 6, title: 'Long Cardio', isRest: false },
  { _id: 'd7', dayOfWeek: 7, title: 'Rest', isRest: false },
];

const noSessions: any[] = [];

describe('isRestDay', () => {
  it('identifies rest day titles case-insensitively', () => {
    expect(isRestDay('Rest')).toBe(true);
    expect(isRestDay('rest')).toBe(true);
    expect(isRestDay('Recovery')).toBe(true);
    expect(isRestDay('OFF')).toBe(true);
    expect(isRestDay('Complete Rest')).toBe(true);
  });

  it('rejects workout titles', () => {
    expect(isRestDay('Upper Body A')).toBe(false);
    expect(isRestDay('Cardio')).toBe(false);
  });
});

describe('computeWeekSchedule', () => {
  const plan = { startDate: '2026-01-01', endDate: '2026-01-31', weeklyAnchor: 1 };

  it('produces 7 days with correct day labels', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-12'));
    expect(result.days).toHaveLength(7);
    expect(result.days[0].dayLabel).toBe('Mon');
    expect(result.days[6].dayLabel).toBe('Sun');
  });

  it('identifies today correctly', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-12'));
    const today = result.days.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today!.dayOfWeek).toBe(1);
  });

  it('marks rest day as isRest', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-12'));
    const sunday = result.days.find((d) => d.dayOfWeek === 7);
    expect(sunday?.isRest).toBe(true);
  });

  it('marks past uncompleted non-rest days as missed', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-14'));
    const monday = result.days.find((d) => d.dayOfWeek === 1);
    expect(monday?.isPast).toBe(true);
    expect(monday?.isMissed).toBe(true);
    expect(monday?.isCatchUpEligible).toBe(true);
  });

  it('marks completed sessions within grace period', () => {
    const sessions = [
      { workoutDayId: 'd1', completedAt: '2026-01-12T14:00:00.000Z', startedAt: '2026-01-12T14:00:00.000Z' },
    ];
    const result = computeWeekSchedule(plan, mockWorkoutDays, sessions, new Date('2026-01-12'));
    const monday = result.days.find((d) => d.dayOfWeek === 1);
    expect(monday?.isCompleted).toBe(true);
  });

  it('detects plan expiry', () => {
    const expiredPlan = { startDate: '2025-01-01', endDate: '2025-01-31', weeklyAnchor: 1 };
    const result = computeWeekSchedule(expiredPlan, mockWorkoutDays, noSessions, new Date('2026-01-12'));
    expect(result.planExpired).toBe(true);
    expect(result.planExpiryMessage).toContain('ended on');
  });

  it('detects future plan start', () => {
    const futurePlan = { startDate: '2026-06-01', weeklyAnchor: 1 };
    const result = computeWeekSchedule(futurePlan, mockWorkoutDays, noSessions, new Date('2026-01-12'));
    expect(result.planExpired).toBe(false);
    expect(result.planExpiryMessage).toContain('starts in');
  });

  it('collects missed days for catch-up', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-15'));
    expect(result.missedDays.length).toBeGreaterThan(0);
    expect(result.missedDays.every((d) => d.isCatchUpEligible)).toBe(true);
  });

  it('does not mark rest days as missed', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-15'));
    const restMissed = result.missedDays.find((d) => d.isRest);
    expect(restMissed).toBeUndefined();
  });

  it('todayIndex points to correct day', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-01-14'));
    expect(result.days[result.todayIndex].isToday).toBe(true);
    expect(result.days[result.todayIndex].dayLabel).toBe('Wed');
  });
});
