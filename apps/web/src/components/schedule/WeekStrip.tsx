'use client';

/**
 * WeekStrip — 7-day horizontal header with date labels, today highlight, navigation arrows
 */

import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface WeekStripProps {
  weekStart: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekStrip({ weekStart, selectedDate, onSelectDate, onPrevWeek, onNextWeek, onToday }: WeekStripProps) {
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Week nav */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onPrevWeek}
          className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          &larr;
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {format(monday, 'MMM d')} — {format(addDays(monday, 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={onToday}
            className="px-2 py-0.5 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={onNextWeek}
          className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          &rarr;
        </button>
      </div>

      {/* Day pills */}
      <div className="flex px-2 pb-2 gap-1">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const isWeekend = i >= 5;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex-1 flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-gray-900 text-white'
                  : isToday
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : isWeekend
                  ? 'text-gray-400 hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '44px' }}
            >
              <span className="text-[10px] font-medium">{DAY_LABELS[i]}</span>
              <span className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
