# Date-Based Workout Scheduling — Design

## Problem

The current scheduling system uses `dayOfWeek` (1-7) + `weekNumber` to map workout days. This causes every week to repeat the same workouts. Multi-week plans with different exercises each week are not supported. Users cannot schedule workouts for specific dates.

## Solution

Replace `dayOfWeek` + `weekNumber` with a single `date` field (YYYY-MM-DD) on each WorkoutDay. Plans keep `startDate` + `endDate` for range definition. Users pick specific dates on a calendar to create workout days.

## Approach

Approach A: Date field on WorkoutDay — each workout day has its own unique date. Calendar UI in plan detail page. Week strip in dashboard with prev/next navigation.

## Data Model

### WorkoutDay (clean break — no migration, existing data deleted)

```typescript
interface IWorkoutDay {
  _id: ObjectId;
  planId: ObjectId;
  userId: ObjectId;
  date: string;              // "2026-09-15" (YYYY-MM-DD)
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises?: IWorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}
```

Remove: `weekNumber`, `dayOfWeek`
Add: `date` (unique per plan)
Index: `{ planId: 1, date: 1 }` unique

### Plan (unchanged)

```typescript
interface IPlan {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  goal?: string;
  description?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  weeklyAnchor?: number;    // kept but unused in new system — can remove later
  createdAt: Date;
  updatedAt: Date;
}
```

### Existing data

Delete all existing workout days and plans before deploying. No migration script. Single user testing only.

## UI Changes

### Plan Detail Page — Calendar View

Replace flat workout day list with a month calendar grid.

- Month calendar showing dates from plan start/end range
- Dates with workout days show lime dot + truncated title
- Click any date to add a workout day (modal or inline form)
- Click existing workout day to expand and edit exercises
- Out-of-range dates greyed out
- Today highlighted with border
- Month navigation: [< Prev] [Month Year] [Next >]

### Dashboard — Week Strip with Date Navigation

- Shows 7 days for the current week with actual dates (e.g., "Mon 9", "Tue 10")
- Each day shows workout title or "empty" (no workout scheduled)
- Prev/Next buttons navigate to adjacent weeks
- "This Week" button to jump back to current week
- Today highlighted
- Completion checkmarks from sessions
- Empty days shown but not interactive
- Week calculated from calendar dates, not plan start date
- Out-of-plan-range weeks dimmed

### Plan Form — Date Pickers (already exists)

Start date and end date pickers already in PlanForm. No changes needed.

## Schedule Logic

### computeWeekSchedule (rewrite)

```
Input: plan (startDate, endDate), workoutDays (with date field), sessions, today, weekOffset (0 = current, -1 = prev, 1 = next)

1. Calculate current week's Monday from today
2. Apply weekOffset: weekStart = Monday + (weekOffset * 7) days
3. For each day i in 0..6:
   - date = weekStart + i days
   - Find workout day where workoutDay.date === date
   - Check if any session completed for that workoutDayId
   - Set completion status
4. Return days array with dates, workout info, and completion status
```

### Completion check (unchanged)

Any completed session for a workoutDayId counts as done. Late completions marked as grace period. Same logic as current.

## AI Tool Changes

### createWorkoutDay

```
Before: { planId, title, dayOfWeek: 1, weekNumber: 1 }
After:  { planId, title, date: "2026-09-15" }
```

AI can compute dates from natural language:
- "next Tuesday" → AI computes the date
- "September 15th" → AI formats as YYYY-MM-DD
- "every Monday for 4 weeks" → AI calls createWorkoutDay for each date in the range

### getWorkoutDays

Returns days with `date` field instead of `dayOfWeek` + `weekNumber`.

### markExerciseDone

Auto-detects workout day by today's date (finds workoutDay where `date === todayStr`).

### finishWorkout

Unchanged — auto-detects active session.

### removeExerciseFromDay, deleteWorkoutDay, addExerciseToDay

Unchanged — work with workoutDayId as before.

## Error Handling

| Scenario | Behavior |
|---|---|
| Two workouts on same date | Reject second — unique constraint on `{planId, date}` |
| Date outside plan start/end | Warning shown but allowed |
| No workout day for today | Dashboard shows "No workout scheduled today" + link to add |
| Plan has no start date | Workouts show in calendar, no date range boundaries |
| AI sends invalid date | Tool returns error: "Invalid date format, use YYYY-MM-DD" |

## Testing

| Test | What it verifies |
|---|---|
| computeWeekSchedule | Correct dates for current week, prev/next navigation, empty days |
| Duplicate date rejected | Creating two workout days with same date fails |
| AI createWorkoutDay | Accepts date parameter, rejects invalid format |
| AI markExerciseDone | Finds workout day by today's date |
| Repository getPlanWorkoutDays | Returns days sorted by date |
| Existing repository tests | Updated for new date field instead of dayOfWeek/weekNumber |

## Migration

No migration script. Delete all existing plans and workout days from MongoDB before deploying. Single user only.
