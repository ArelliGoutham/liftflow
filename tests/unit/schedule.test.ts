import { computeWeekSchedule, isRestDay } from '@/lib/schedule';

const mockWorkoutDays = [
  { _id: 'd1', date: '2026-09-14', title: 'Upper Body A' },
  { _id: 'd2', date: '2026-09-15', title: 'Lower Body A' },
  { _id: 'd3', date: '2026-09-16', title: 'Rest' },
  { _id: 'd4', date: '2026-09-17', title: 'Upper Body B' },
  { _id: 'd5', date: '2026-09-18', title: 'Lower Body B' },
  { _id: 'd6', date: '2026-09-19', title: 'Long Cardio' },
  { _id: 'd7', date: '2026-09-20', title: 'Rest' },
];

const noSessions: any[] = [];

describe('isRestDay', () => {
  it('identifies rest day titles', () => {
    expect(isRestDay('Rest')).toBe(true);
    expect(isRestDay('rest')).toBe(true);
    expect(isRestDay('Recovery')).toBe(true);
    expect(isRestDay('OFF')).toBe(true);
    expect(isRestDay('Upper Body A')).toBe(false);
  });
});

describe('computeWeekSchedule with dates', () => {
  const plan = { startDate: '2026-09-14', endDate: '2026-10-11' };

  it('produces 7 days with correct dates', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    expect(result.days).toHaveLength(7);
    expect(result.days[0].date).toBe('2026-09-14');
    expect(result.days[6].date).toBe('2026-09-20');
  });

  it('maps workout days by date', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    expect(result.days[0].workoutTitle).toBe('Upper Body A');
    expect(result.days[2].isRest).toBe(true);
    expect(result.days[3].workoutTitle).toBe('Upper Body B');
  });

  it('shows empty day when no workout scheduled', () => {
    const result = computeWeekSchedule(plan, [], noSessions, new Date('2026-09-15'), 0);
    expect(result.days[0].workoutDayId).toBeNull();
  });

  it('marks today correctly', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    expect(result.days[result.todayIndex].isToday).toBe(true);
    expect(result.days[result.todayIndex].date).toBe('2026-09-15');
  });

  it('navigates to next week with weekOffset=1', () => {
    const result = computeWeekSchedule(plan, [], noSessions, new Date('2026-09-15'), 1);
    expect(result.days[0].date).toBe('2026-09-21');
    expect(result.days[6].date).toBe('2026-09-27');
  });

  it('navigates to previous week with weekOffset=-1', () => {
    const result = computeWeekSchedule(plan, [], noSessions, new Date('2026-09-15'), -1);
    expect(result.days[0].date).toBe('2026-09-07');
    expect(result.days[6].date).toBe('2026-09-13');
  });

  it('marks completed sessions', () => {
    const sessions = [
      { workoutDayId: 'd1', completedAt: '2026-09-14T14:00:00.000Z', startedAt: '2026-09-14T14:00:00.000Z' },
    ];
    const result = computeWeekSchedule(plan, mockWorkoutDays, sessions, new Date('2026-09-15'), 0);
    expect(result.days[0].isCompleted).toBe(true);
  });

  it('marks missed past days', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-16'), 0);
    expect(result.days[0].isMissed).toBe(true);
  });

  it('returns weekStart and weekEnd', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    expect(result.weekStart).toBe('2026-09-14');
    expect(result.weekEnd).toBe('2026-09-20');
    expect(result.weekOffset).toBe(0);
  });

  it('detects plan expiry', () => {
    const expiredPlan = { startDate: '2026-01-01', endDate: '2026-01-31' };
    const result = computeWeekSchedule(expiredPlan, [], noSessions, new Date('2026-09-15'), 0);
    expect(result.planExpired).toBe(true);
  });
});
