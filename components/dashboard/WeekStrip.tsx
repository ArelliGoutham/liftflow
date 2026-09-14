'use client';

import Link from 'next/link';
import { Check, Dumbbell, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySchedule {
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

interface WeekStripProps {
  days: DaySchedule[];
  todayIndex: number;
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
}

export default function WeekStrip({ days, todayIndex, weekStart, weekEnd, weekOffset, onPrevWeek, onNextWeek, onThisWeek }: WeekStripProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevWeek}
          className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors min-h-[36px] min-w-[36px] flex items-center"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {weekStart} — {weekEnd}
          </p>
          {weekOffset !== 0 && (
            <button onClick={onThisWeek} className="text-xs text-lime hover:text-lime/80 mt-0.5">
              Back to this week
            </button>
          )}
        </div>

        <button
          onClick={onNextWeek}
          className="rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors min-h-[36px] min-w-[36px] flex items-center"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => <DayCell key={day.date} day={day} />)}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-lime" /> Completed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-600" /> Scheduled</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-700" /> Rest</span>
      </div>
    </div>
  );
}

function DayCell({ day }: { day: DaySchedule }) {
  const dotColor = day.isCompleted ? 'bg-lime' : day.isMissed ? 'bg-amber-500' : day.isRest ? 'bg-slate-700' : day.workoutDayId ? 'bg-slate-600' : 'bg-slate-800';
  const dayNum = day.date.split('-')[2];

  if (day.isRest) {
    return (
      <div className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center ${day.isToday ? 'border-2 border-lime bg-slate-700/40' : 'border border-slate-700 bg-slate-800/30'}`}>
        <span className="text-xs font-semibold text-slate-400">{day.dayLabel} {dayNum}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <Moon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-500">Rest</span>
      </div>
    );
  }

  if (!day.workoutDayId) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-center border border-slate-800 bg-slate-800/20 opacity-50">
        <span className="text-xs font-semibold text-slate-500">{day.dayLabel} {dayNum}</span>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
        <span className="text-[10px] text-slate-600">—</span>
      </div>
    );
  }

  const content = (
    <div className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center ${day.isToday ? 'border-2 border-lime bg-slate-700/40' : day.isMissed ? 'border border-amber-500/50 bg-amber-500/5' : 'border border-slate-700 bg-slate-800/30 hover:border-slate-600'}`}>
      <span className={`text-xs font-semibold ${day.isToday ? 'text-lime' : 'text-slate-300'}`}>{day.dayLabel} {dayNum}</span>
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      {day.isCompleted ? <Check className="w-3.5 h-3.5 text-lime" /> : <Dumbbell className="w-3.5 h-3.5 text-slate-500" />}
      <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">{day.workoutTitle?.slice(0, 10)}</span>
      {day.isToday && !day.isCompleted && <span className="text-[9px] text-lime font-bold uppercase">Today</span>}
      {day.isMissed && <span className="text-[9px] text-amber-500 font-bold uppercase">Missed</span>}
    </div>
  );

  if (day.workoutDayId) {
    return <Link href={`/workout/${day.workoutDayId}`} aria-label={`${day.dayLabel}: ${day.workoutTitle}`}>{content}</Link>;
  }
  return content;
}
