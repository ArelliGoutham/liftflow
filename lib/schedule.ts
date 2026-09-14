import type { IDaySchedule, IWeekSchedule } from '@/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GRACE_PERIOD_HOURS = 24;
export const REST_DAY_TITLES = ['rest', 'recovery', 'off', 'rest day', 'complete rest'];

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function hoursBetween(from: Date, to: Date): number {
  return Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

export function isRestDay(title: string): boolean {
  return REST_DAY_TITLES.some((r) => title.toLowerCase().trim() === r);
}

interface DateWorkoutDay {
  _id: string;
  date: string;
  title: string;
}

interface SessionInfo {
  workoutDayId: string;
  completedAt: string | null;
  startedAt: string;
}

/**
 * Computes a week schedule based on actual calendar dates.
 * @param plan - Plan metadata with optional start/end dates
 * @param workoutDays - Workout days with date field
 * @param sessions - Completed sessions
 * @param today - Reference date (default: now)
 * @param weekOffset - 0 for current week, -1 for prev, 1 for next
 * @returns Week schedule with per-day status and navigation info
 */
export function computeWeekSchedule(
  plan: { startDate?: string; endDate?: string },
  workoutDays: DateWorkoutDay[],
  sessions: SessionInfo[],
  today: Date = new Date(),
  weekOffset: number = 0
): IWeekSchedule {
  const todayStr = toDateString(today);

  const dayByDate = new Map<string, DateWorkoutDay>();
  for (const day of workoutDays) {
    dayByDate.set(day.date, day);
  }

  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + (weekOffset * 7));

  const days: IDaySchedule[] = [];
  let todayIndex = -1;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = toDateString(date);
    const workoutDay = dayByDate.get(dateStr);
    const isRest = workoutDay ? isRestDay(workoutDay.title) : false;

    const isToday = dateStr === todayStr;
    if (isToday) todayIndex = i;

    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    let isCompleted = false;
    let isInGracePeriod = false;

    if (workoutDay && !isRest) {
      for (const session of sessions) {
        if (session.workoutDayId === workoutDay._id && session.completedAt) {
          isCompleted = true;
          const sessionDate = parseDate(session.completedAt.split('T')[0]);
          const gap = hoursBetween(sessionDate, date);
          if (gap > 0) isInGracePeriod = true;
          break;
        }
      }
    }

    const isMissed = isPast && !isCompleted && workoutDay !== undefined && !isRest;
    const isCatchUpEligible = isMissed && !isRest;

    days.push({
      date: dateStr,
      dayNumber: i + 1,
      dayLabel: DAY_LABELS[i],
      workoutDayId: workoutDay?._id ?? null,
      workoutTitle: workoutDay?.title ?? null,
      isRest,
      isToday,
      isPast,
      isFuture,
      isCompleted,
      isInGracePeriod,
      isMissed,
      isCatchUpEligible,
    });
  }

  const missedDays = days.filter((d) => d.isCatchUpEligible);

  let planExpired = false;
  let planExpiryMessage: string | null = null;

  if (plan.endDate) {
    const endDate = parseDate(plan.endDate);
    if (today > endDate) {
      planExpired = true;
      planExpiryMessage = `This plan ended on ${plan.endDate}.`;
    }
  }

  if (plan.startDate) {
    const startDate = parseDate(plan.startDate);
    if (today < startDate) {
      const diff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      planExpiryMessage = `This plan starts in ${diff} day${diff === 1 ? '' : 's'} (${plan.startDate}).`;
    }
  }

  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekStart.getDate() + 6);

  return {
    days,
    todayIndex: todayIndex >= 0 ? todayIndex : 0,
    missedDays,
    planExpired,
    planExpiryMessage,
    weekOffset,
    weekStart: toDateString(weekStart),
    weekEnd: toDateString(weekEndDate),
  };
}

export { DAY_LABELS };
