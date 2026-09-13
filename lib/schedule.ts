import type { IDaySchedule, IWeekSchedule } from '@/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const GRACE_PERIOD_HOURS = 24;
export const REST_DAY_TITLES = ['rest', 'recovery', 'off', 'rest day', 'complete rest'];

function getMondayBasedDay(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

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

/**
 * Determines whether a workout day title indicates a rest day.
 * @param title - The workout day title to check
 * @returns True if the title matches a known rest day label (case-insensitive), false otherwise
 */
export function isRestDay(title: string): boolean {
  return REST_DAY_TITLES.some((r) => title.toLowerCase().trim() === r);
}

interface WorkoutDayInfo {
  _id: string;
  dayOfWeek: number;
  title: string;
  isRest: boolean;
}

interface SessionInfo {
  workoutDayId: string;
  completedAt: string | null;
  startedAt: string;
}

/**
 * Computes a week schedule for a fitness plan, mapping workout days to calendar dates with completion status.
 * @param plan - The plan metadata including optional start/end dates and weekly anchor
 * @param workoutDays - Array of workout day info (id, dayOfWeek, title) for the plan
 * @param sessions - Array of completed session info for the plan
 * @param today - The reference date for the current week (default: now)
 * @returns Week schedule with per-day status (completed, missed, rest, catch-up eligible) and plan expiry info
 */
export function computeWeekSchedule(
  plan: {
    startDate?: string;
    endDate?: string;
    weeklyAnchor?: number;
  },
  workoutDays: WorkoutDayInfo[],
  sessions: SessionInfo[],
  today: Date = new Date()
): IWeekSchedule {
  const todayStr = toDateString(today);
  const todayDayOfWeek = getMondayBasedDay(today);

  const dayByNumber = new Map<number, WorkoutDayInfo>();
  for (const day of workoutDays) {
    if (!dayByNumber.has(day.dayOfWeek)) {
      dayByNumber.set(day.dayOfWeek, {
        ...day,
        isRest: isRestDay(day.title),
      });
    }
  }

  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);

  const days: IDaySchedule[] = [];
  let todayIndex = -1;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = toDateString(date);
    const dayOfWeek = i + 1;
    const workoutDay = dayByNumber.get(dayOfWeek);

    const isToday = dateStr === todayStr;
    if (isToday) todayIndex = i;

    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    let isCompleted = false;
    let isInGracePeriod = false;

    if (workoutDay && !workoutDay.isRest) {
      for (const session of sessions) {
        if (session.workoutDayId === workoutDay._id && session.completedAt) {
          // If the session was completed within 24h of the scheduled date, it's on-time
          // Otherwise it's still completed but within grace period (catch-up)
          const sessionDate = parseDate(session.completedAt.split('T')[0]);
          const gap = hoursBetween(sessionDate, date);
          isCompleted = true;
          if (gap > GRACE_PERIOD_HOURS) {
            // Completed late — still counts as done, mark as catch-up completion
            isInGracePeriod = true;
          } else if (gap > 0) {
            isInGracePeriod = true;
          }
          break;
        }
      }
    }

    const isMissed = isPast && !isCompleted && workoutDay !== undefined && !workoutDay.isRest;
    const isCatchUpEligible = isMissed && !workoutDay?.isRest;

    days.push({
      date: dateStr,
      dayOfWeek,
      dayLabel: DAY_LABELS[i],
      workoutDayId: workoutDay?._id ?? null,
      workoutTitle: workoutDay?.title ?? null,
      isRest: workoutDay?.isRest ?? false,
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
      planExpiryMessage = `This plan ended on ${plan.endDate}. Extend it, switch to a new plan, or stop scheduling.`;
    }
  }

  if (plan.startDate) {
    const startDate = parseDate(plan.startDate);
    if (today < startDate) {
      const diff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      planExpiryMessage = `This plan starts in ${diff} day${diff === 1 ? '' : 's'} (${plan.startDate}).`;
    }
  }

  return {
    days,
    todayIndex: todayIndex >= 0 ? todayIndex : 0,
    missedDays,
    planExpired,
    planExpiryMessage,
  };
}

export { DAY_LABELS, DAY_FULL_LABELS };
