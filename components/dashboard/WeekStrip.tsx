'use client';

import Link from 'next/link';
import { Check, Dumbbell, Moon } from 'lucide-react';
import type { IDaySchedule } from '@/types';

interface WeekStripProps {
  days: IDaySchedule[];
  todayIndex: number;
}

export default function WeekStrip({ days, todayIndex }: WeekStripProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <DayCell key={day.date} day={day} />
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-lime" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-600" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-700" /> Rest
        </span>
      </div>
    </div>
  );
}

function DayCell({ day }: { day: IDaySchedule }) {
  const dotColor = day.isCompleted
    ? 'bg-lime'
    : day.isMissed
      ? 'bg-amber-500'
      : day.isRest
        ? 'bg-slate-700'
        : 'bg-slate-600';

  if (day.isRest) {
    return (
      <div
        className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all ${
          day.isToday
            ? 'border-2 border-lime bg-slate-700/40'
            : 'border border-slate-700 bg-slate-800/30'
        }`}
      >
        <span className="text-xs font-semibold text-slate-400">{day.dayLabel}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <Moon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] text-slate-500 leading-tight">Rest</span>
      </div>
    );
  }

  if (!day.workoutDayId) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-center border border-slate-800 bg-slate-800/20 opacity-50">
        <span className="text-xs font-semibold text-slate-500">{day.dayLabel}</span>
        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
        <span className="text-[10px] text-slate-600 leading-tight">—</span>
      </div>
    );
  }

  const content = (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all ${
        day.isToday
          ? 'border-2 border-lime bg-slate-700/40'
          : day.isMissed
            ? 'border border-amber-500/50 bg-amber-500/5'
            : 'border border-slate-700 bg-slate-800/30 hover:border-slate-600'
      }`}
    >
      <span className={`text-xs font-semibold ${day.isToday ? 'text-lime' : 'text-slate-300'}`}>
        {day.dayLabel}
      </span>
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      {day.isCompleted ? (
        <Check className="w-3.5 h-3.5 text-lime" />
      ) : (
        <Dumbbell className="w-3.5 h-3.5 text-slate-500" />
      )}
      <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">
        {truncateTitle(day.workoutTitle)}
      </span>
      {day.isToday && !day.isCompleted && (
        <span className="text-[9px] text-lime font-bold uppercase">Today</span>
      )}
      {day.isMissed && <span className="text-[9px] text-amber-500 font-bold uppercase">Missed</span>}
      {day.isCompleted && day.isInGracePeriod && (
        <span className="text-[9px] text-lime/70 font-medium" title="Completed within grace period">
          +24h
        </span>
      )}
    </div>
  );

  if (day.workoutDayId) {
    return (
      <Link href={`/workout/${day.workoutDayId}`} aria-label={`${day.dayLabel}: ${day.workoutTitle}`}>
        {content}
      </Link>
    );
  }

  return content;
}

function truncateTitle(title: string | null): string {
  if (!title) return '—';
  if (title.length <= 12) return title;
  return title.substring(0, 10) + '…';
}
