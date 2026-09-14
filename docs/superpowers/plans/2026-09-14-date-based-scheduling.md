# Date-Based Workout Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dayOfWeek+weekNumber scheduling with date-based scheduling so each workout day has its own unique calendar date.

**Architecture:** WorkoutDay model gets a `date` field (YYYY-MM-DD) replacing `dayOfWeek` and `weekNumber`. Dashboard week strip computes from actual dates with prev/next navigation. Plan detail page shows a month calendar. AI tools accept `date` instead of `dayOfWeek`.

**Tech Stack:** Next.js 14, TypeScript, MongoDB/Mongoose, Tailwind CSS, Google Gemini AI

---

## File Structure

```
Files to create:
  lib/services/calendarService.ts    — month calendar grid generation
  components/plans/CalendarView.tsx  — month calendar for plan detail page
  components/dashboard/WeekNav.tsx   — prev/next week navigation for dashboard
  tests/unit/calendar.test.ts        — calendar grid logic tests

Files to modify:
  lib/db/models/WorkoutDay.ts        — replace dayOfWeek+weekNumber with date
  lib/db/repositories/workoutDayRepository.ts — query by date, sort by date
  lib/db/repositories/sessionRepository.ts — no changes needed
  lib/schedule.ts                    — rewrite computeWeekSchedule for dates + weekOffset
  lib/services/dashboardService.ts   — pass weekOffset param
  lib/ai/tools/createWorkoutDay.ts   — accept date instead of dayOfWeek
  lib/ai/tools/getWorkoutDays.ts     — return date field
  lib/ai/tools/markExerciseDone.ts   — find by date instead of dayOfWeek
  lib/ai/config.ts                   — update system prompt for date-based commands
  app/api/dashboard/route.ts         — accept weekOffset query param
  app/api/workout-days/route.ts       — accept date param in POST
  app/api/workout-days/[id]/route.ts — no changes needed
  app/plans/[id]/page.tsx            — replace flat list with CalendarView
  app/dashboard/page.tsx             — add prev/next week navigation
  app/workout/[workoutDayId]/page.tsx — minor: remove dayOfWeek references
  types/index.ts                     — update interfaces
  tests/integration/repositories.test.ts — update for date field
  tests/unit/schedule.test.ts        — update for date-based schedule
  components/plans/PlanForm.tsx      — no changes (date pickers exist)
  components/dashboard/WeekStrip.tsx — update to show actual dates
```

---

## Task 1: Update Types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Update IWorkoutDay interface**

Replace `weekNumber` and `dayOfWeek` with `date`:

```typescript
export interface IWorkoutDay {
  _id: ObjectId;
  planId: ObjectId;
  userId: ObjectId;
  date: string;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises?: IWorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}
```

Add `weekOffset` to `IWeekSchedule`:

```typescript
export interface IWeekSchedule {
  days: IDaySchedule[];
  todayIndex: number;
  missedDays: IDaySchedule[];
  planExpired: boolean;
  planExpiryMessage: string | null;
  weekOffset: number;
  weekStart: string;
  weekEnd: string;
}
```

Update `IDaySchedule` — remove `dayOfWeek`, add `dayNumber` (1-7 for display):

```typescript
export interface IDaySchedule {
  date: string;
  dayNumber: number;
  dayLabel: string;
  workoutDayId: string | null;
  workoutTitle: string | null;
  isRest: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
  isInGracePeriod: boolean;
  isMissed: boolean;
  isCatchUpEligible: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "refactor: update types for date-based scheduling"
```

---

## Task 2: Update WorkoutDay Model

**Files:**
- Modify: `lib/db/models/WorkoutDay.ts`

- [ ] **Step 1: Replace schema fields**

```typescript
import mongoose, { Schema } from 'mongoose';

const WorkoutExerciseSchema = new Schema(
  {
    exerciseId: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    trackingMode: { type: String, enum: ['reps', 'duration'], default: 'reps' },
    targetSets: { type: Number, required: true, default: 3 },
    targetRepetitions: { type: Number },
    targetDurationValue: { type: Number },
    durationUnit: { type: String, enum: ['seconds', 'minutes'], default: 'seconds' },
    restSeconds: { type: Number, default: 90 },
    notes: { type: String },
  }
);

const WorkoutDaySchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, required: true, ref: 'Plan' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    warmupInstructions: { type: String },
    cardioInstructions: { type: String },
    exercises: [WorkoutExerciseSchema],
  },
  { timestamps: true }
);

WorkoutDaySchema.index({ planId: 1, date: 1 }, { unique: true });

const WorkoutDay = mongoose.models.WorkoutDay || mongoose.model('WorkoutDay', WorkoutDaySchema);

export default WorkoutDay;
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/models/WorkoutDay.ts
git commit -m "refactor: WorkoutDay model — date field replaces dayOfWeek+weekNumber"
```

---

## Task 3: Update WorkoutDay Repository

**Files:**
- Modify: `lib/db/repositories/workoutDayRepository.ts`

- [ ] **Step 1: Update getPlanWorkoutDays to sort by date**

```typescript
export async function getPlanWorkoutDays(planId: string): Promise<any[]> {
  await connectToDatabase();
  return WorkoutDay.find({ planId }).sort({ date: 1 }).lean() as unknown as Promise<any[]>;
}
```

- [ ] **Step 2: Update createWorkoutDay to accept date**

```typescript
export async function createWorkoutDay(data: any): Promise<any> {
  await connectToDatabase();
  const day = new WorkoutDay(data);
  await day.save();
  return day.toObject();
}
```

No change needed to function signature — it already accepts a generic data object.

- [ ] **Step 3: Update getWorkoutDayWithExerciseNames to not reference dayOfWeek**

The function already works with `_id` — no changes needed to the lookup logic. Just ensure it doesn't reference `dayOfWeek` in any map.

- [ ] **Step 4: Add getWorkoutDayByDate function**

```typescript
/**
 * Finds a workout day by plan ID and date.
 * @param planId - The plan ID
 * @param date - The date in YYYY-MM-DD format
 * @returns The workout day or null if not found
 */
export async function getWorkoutDayByDate(planId: string, date: string): Promise<any | null> {
  await connectToDatabase();
  return WorkoutDay.findOne({ planId, date }).lean() as unknown as Promise<any | null>;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/repositories/workoutDayRepository.ts
git commit -m "refactor: repository queries by date, sorted by date"
```

---

## Task 4: Rewrite computeWeekSchedule

**Files:**
- Modify: `lib/schedule.ts`

- [ ] **Step 1: Write the new computeWeekSchedule**

```typescript
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

  // Map workout days by date string
  const dayByDate = new Map<string, DateWorkoutDay>();
  for (const day of workoutDays) {
    dayByDate.set(day.date, { ...day, title: day.title });
  }

  // Calculate week start (Monday) from today + offset
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/schedule.ts
git commit -m "refactor: computeWeekSchedule uses date field + weekOffset navigation"
```

---

## Task 5: Update Schedule Unit Tests

**Files:**
- Modify: `tests/unit/schedule.test.ts`

- [ ] **Step 1: Write tests for date-based schedule**

```typescript
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
  it('identifies rest day titles case-insensitively', () => {
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
    expect(result.days[0].workoutTitle).toBeNull();
  });

  it('marks today correctly', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    const today = result.days.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today!.date).toBe('2026-09-15');
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
    const monday = result.days.find((d) => d.date === '2026-09-14');
    expect(monday?.isCompleted).toBe(true);
  });

  it('marks missed past days', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-16'), 0);
    const monday = result.days.find((d) => d.date === '2026-09-14');
    expect(monday?.isMissed).toBe(true);
    expect(monday?.isCatchUpEligible).toBe(true);
  });

  it('returns weekStart and weekEnd', () => {
    const result = computeWeekSchedule(plan, mockWorkoutDays, noSessions, new Date('2026-09-15'), 0);
    expect(result.weekStart).toBe('2026-09-14');
    expect(result.weekEnd).toBe('2026-09-20');
  });

  it('detects plan expiry', () => {
    const expiredPlan = { startDate: '2026-01-01', endDate: '2026-01-31' };
    const result = computeWeekSchedule(expiredPlan, [], noSessions, new Date('2026-09-15'), 0);
    expect(result.planExpired).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx jest tests/unit/schedule.test.ts --runInBand --forceExit
```
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/unit/schedule.test.ts
git commit -m "test: date-based schedule tests with weekOffset navigation"
```

---

## Task 6: Update Dashboard Service and API

**Files:**
- Modify: `lib/services/dashboardService.ts`
- Modify: `app/api/dashboard/route.ts`

- [ ] **Step 1: Add weekOffset parameter to dashboardService**

The service function `getDashboardData` should accept a `weekOffset` parameter and pass it to `computeWeekSchedule`. Update the workoutDays mapping to use `date` instead of `dayOfWeek`.

- [ ] **Step 2: Update dashboard API route to accept weekOffset query param**

```typescript
const weekOffset = parseInt(searchParams.get('weekOffset') || '0');
const data = await getDashboardData(session.user.id, weekOffset);
```

- [ ] **Step 3: Commit**

```bash
git add lib/services/dashboardService.ts app/api/dashboard/route.ts
git commit -m "feat: dashboard accepts weekOffset for week navigation"
```

---

## Task 7: Update Dashboard Page — Week Navigation

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/dashboard/WeekStrip.tsx`

- [ ] **Step 1: Add weekOffset state and prev/next buttons to dashboard page**

Add `weekOffset` state (default 0). Add Prev/Next/"This Week" buttons that change weekOffset and re-fetch dashboard data with `?weekOffset=${weekOffset}`.

- [ ] **Step 2: Update WeekStrip component**

Update to show actual dates (e.g., "Mon 14") instead of just weekday labels. Use `day.date` for display. Use `day.dayNumber` for the weekday label index.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/WeekStrip.tsx
git commit -m "feat: dashboard week navigation with actual dates"
```

---

## Task 8: Create Calendar View for Plan Detail

**Files:**
- Create: `lib/services/calendarService.ts`
- Create: `components/plans/CalendarView.tsx`
- Modify: `app/plans/[id]/page.tsx`

- [ ] **Step 1: Create calendarService.ts — month grid generation**

```typescript
/**
 * Generates a calendar grid for a given month.
 * @param year - e.g., 2026
 * @param month - 0-indexed (0 = January)
 * @returns Array of weeks, each containing 7 day cells
 */
export function getMonthGrid(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday-based
  const daysInMonth = lastDay.getDate();

  const cells: CalendarCell[] = [];

  // Leading empty cells
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null, dayNumber: 0, inMonth: false });
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date, dayNumber: d, inMonth: true });
  }

  // Trailing empty cells to fill the grid
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNumber: 0, inMonth: false });
  }

  // Split into weeks
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export interface CalendarCell {
  date: string | null;
  dayNumber: number;
  inMonth: boolean;
}
```

- [ ] **Step 2: Create CalendarView.tsx component**

A month calendar grid that:
- Shows month name + Prev/Next buttons
- Renders weeks as rows, days as cells
- Cells with workout days show lime dot + truncated title
- Click a date to open the workout day editor (or create new)
- Today's date highlighted
- Out-of-plan-range dates greyed out

- [ ] **Step 3: Replace flat workout day list in app/plans/[id]/page.tsx with CalendarView**

Remove the existing workout day list rendering. Import and render CalendarView instead. Pass workout days mapped by date.

- [ ] **Step 4: Commit**

```bash
git add lib/services/calendarService.ts components/plans/CalendarView.tsx app/plans/[id]/page.tsx
git commit -m "feat: calendar view on plan detail page"
```

---

## Task 9: Update AI Tools for Date-Based Scheduling

**Files:**
- Modify: `lib/ai/tools/createWorkoutDay.ts`
- Modify: `lib/ai/tools/getWorkoutDays.ts`
- Modify: `lib/ai/tools/markExerciseDone.ts`
- Modify: `lib/ai/config.ts`

- [ ] **Step 1: Update createWorkoutDay tool**

Replace `dayOfWeek` + `weekNumber` parameters with `date`:

```typescript
parameters: z.object({
    planId: z.string().describe('The plan ID from createPlan or getUserPlans'),
    title: z.string().min(1).describe('Day title (e.g., "Upper Body A", "Leg Day")'),
    date: z.string().describe('Date in YYYY-MM-DD format (e.g., "2026-09-15")'),
}),
async execute(params: any, context) {
    const planId = params.planId || params.plan_id;
    const date = params.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: 'Invalid date format, use YYYY-MM-DD (e.g., 2026-09-15)' };
    }
    // ... rest unchanged except createWorkoutDay call uses date instead of dayOfWeek/weekNumber
}
```

- [ ] **Step 2: Update getWorkoutDays tool**

Replace `dayOfWeek` and `weekNumber` in the return with `date`:

```typescript
return days.map((d: any) => ({
    id: d._id?.toString(),
    title: d.title,
    date: d.date,
    exerciseCount: d.exercises?.length || 0,
    exercises: ...,
}));
```

- [ ] **Step 3: Update markExerciseDone auto-detection**

Replace dayOfWeek-based detection with date-based:

```typescript
// Find the day that has today's date
const dayWithExercise = days.find((d: any) => d.date === todayStr);
if (dayWithExercise) {
    workoutDayId = dayWithExercise._id.toString();
}
```

- [ ] **Step 4: Update system prompt in config.ts**

Replace day-of-week references with date references:

```
- **createWorkoutDay**: Add a workout day for a specific date (YYYY-MM-DD format)
- When a user says "add to next Tuesday", calculate the actual date and pass it as the date parameter
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/tools/ app/api/workout-days/route.ts
git commit -m "feat: AI tools accept date instead of dayOfWeek"
```

---

## Task 10: Update Workout Days API

**Files:**
- Modify: `app/api/workout-days/route.ts`

- [ ] **Step 1: Update POST to accept date field**

The POST handler already passes body through to createWorkoutDay. Just ensure it accepts `date` instead of `dayOfWeek` + `weekNumber`. Add validation:

```typescript
if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
  return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/workout-days/route.ts
git commit -m "feat: workout-days API accepts date field"
```

---

## Task 11: Update Repository Integration Tests

**Files:**
- Modify: `tests/integration/repositories.test.ts`

- [ ] **Step 1: Update workout day tests to use date instead of dayOfWeek/weekNumber**

Replace all `dayOfWeek: 1, weekNumber: 1` with `date: '2026-09-14'`. Update assertions accordingly.

- [ ] **Step 2: Run tests**

```bash
npm run test:db
```
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/repositories.test.ts
git commit -m "test: repository tests updated for date-based scheduling"
```

---

## Task 12: Build, Full Test, and Commit

- [ ] **Step 1: Run build**

```bash
npm run build
```
Expected: Compiled successfully

- [ ] **Step 2: Run all tests**

```bash
npm run test:all
```
Expected: All tests pass

- [ ] **Step 3: Fix any remaining references to dayOfWeek or weekNumber**

Search the codebase for any remaining references and remove or update them.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: date-based workout scheduling — calendar view, week navigation, AI date commands"
```
