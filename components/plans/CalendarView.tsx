'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Dumbbell } from 'lucide-react';

interface WorkoutDayInfo {
  _id: string;
  date: string;
  title: string;
  exercises?: any[];
}

interface CalendarViewProps {
  workoutDays: WorkoutDayInfo[];
  planStartDate?: string;
  planEndDate?: string;
  onSelectDate: (date: string) => void;
  onOpenWorkout: (workoutDayId: string) => void;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ workoutDays, planStartDate, planEndDate, onSelectDate, onOpenWorkout }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const dayByDate = new Map<string, WorkoutDayInfo>();
  workoutDays.forEach((d) => dayByDate.set(d.date, d));

  const todayStr = toDateString(today);

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const cells: { date: string | null; day: number }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: 0 });

  const weeks: { date: string | null; day: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isInRange = (dateStr: string): boolean => {
    if (planStartDate && dateStr < planStartDate) return false;
    if (planEndDate && dateStr > planEndDate) return false;
    return true;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 min-h-[36px] min-w-[36px] flex items-center" aria-label="Previous month">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-lime">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <button onClick={nextMonth} className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 min-h-[36px] min-w-[36px] flex items-center" aria-label="Next month">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, di) => {
              if (!cell.date) {
                return <div key={di} className="min-h-[60px] rounded-lg bg-slate-800/20" />;
              }

              const workout = dayByDate.get(cell.date);
              const isToday = cell.date === todayStr;
              const inRange = isInRange(cell.date);

              if (workout) {
                return (
                  <button
                    key={di}
                    onClick={() => onOpenWorkout(workout._id)}
                    className={`min-h-[60px] rounded-lg border p-1.5 text-left transition-colors ${
                      isToday ? 'border-2 border-lime bg-slate-700/40' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isToday ? 'text-lime font-bold' : 'text-slate-400'}`}>{cell.day}</span>
                      <Dumbbell className="w-3 h-3 text-lime" />
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 truncate">{workout.title}</p>
                    {workout.exercises && workout.exercises.length > 0 && (
                      <p className="text-[9px] text-slate-500">{workout.exercises.length} exercises</p>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={di}
                  onClick={() => inRange && onSelectDate(cell.date!)}
                  disabled={!inRange}
                  className={`min-h-[60px] rounded-lg border p-1.5 text-left transition-colors ${
                    !inRange
                      ? 'border-slate-800 bg-slate-800/10 opacity-40 cursor-not-allowed'
                      : isToday
                        ? 'border-2 border-lime/50 bg-slate-800/30 hover:border-lime'
                        : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-lime font-bold' : 'text-slate-500'}`}>{cell.day}</span>
                  {inRange && <Plus className="w-3 h-3 text-slate-600 mt-1" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
