export interface CalendarCell {
  date: string | null;
  dayNumber: number;
  inMonth: boolean;
}

/**
 * Generates a calendar grid for a given month.
 * @param year - e.g., 2026
 * @param month - 0-indexed (0 = January)
 * @returns Array of weeks, each containing 7 day cells
 */
export function getMonthGrid(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null, dayNumber: 0, inMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date, dayNumber: d, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNumber: 0, inMonth: false });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month] || '';
}
