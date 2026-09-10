import type { DaySchedule, WeekSchedule } from '@/types';

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

export function computeWeekSchedule(
  plan: {
    startDate?: string;
    endDate?: string;
    weeklyAnchor?: number;
  },
  workoutDays: WorkoutDayInfo[],
  sessions: SessionInfo[],
  today: Date = new Date()
): WeekSchedule {
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

  const days: DaySchedule[] = [];
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
          const sessionDate = parseDate(session.completedAt.split('T')[0]);
          const gap = hoursBetween(sessionDate, date);
          if (gap <= GRACE_PERIOD_HOURS) {
            isCompleted = true;
            if (gap > 0) isInGracePeriod = true;
            break;
          }
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
