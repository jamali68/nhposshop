/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getTodayDateString } from '../data/initialData';

interface DateNavigatorProps {
  value: string;
  onChange: (newDate: string) => void;
  accentColor?: 'blue' | 'emerald' | 'amber';
}

/**
 * Shifts a YYYY-MM-DD date string by a number of days (+1 or -1)
 */
export const shiftDateString = (dateStr: string, days: number): string => {
  if (!dateStr) return getTodayDateString();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return getTodayDateString();
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  dateObj.setDate(dateObj.getDate() + days);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  value,
  onChange,
  accentColor = 'blue'
}) => {
  const todayStr = getTodayDateString();
  const isToday = value === todayStr;

  const handlePrev = () => {
    onChange(shiftDateString(value, -1));
  };

  const handleNext = () => {
    onChange(shiftDateString(value, 1));
  };

  const handleResetToday = () => {
    onChange(todayStr);
  };

  const focusRing =
    accentColor === 'emerald'
      ? 'focus:border-emerald-600'
      : accentColor === 'amber'
      ? 'focus:border-amber-600'
      : 'focus:border-blue-600';

  const todayBtnActive =
    accentColor === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
      : accentColor === 'amber'
      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
      : 'bg-[#2980b9] hover:bg-blue-700 text-white border-[#2980b9] shadow-sm';

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1">
      {/* Previous Day Arrow Button */}
      <button
        type="button"
        onClick={handlePrev}
        title="Pichli Tareekh (Previous Day)"
        aria-label="Previous Day"
        className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 shadow-xs flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Complete Date Picker - Full width to prevent any year truncation on mobile */}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={e => e.target.value && onChange(e.target.value)}
          className={`w-[160px] sm:w-[170px] py-1.5 px-3 bg-white border border-slate-300 font-bold text-xs text-center rounded-full shadow-xs cursor-pointer focus:outline-none ${focusRing} transition-colors`}
        />
      </div>

      {/* Next Day Arrow Button */}
      <button
        type="button"
        onClick={handleNext}
        title="Agli Tareekh (Next Day)"
        aria-label="Next Day"
        className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 shadow-xs flex items-center justify-center text-slate-700 transition-all cursor-pointer focus:outline-none"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Reset to Today Button */}
      <button
        type="button"
        onClick={handleResetToday}
        title={isToday ? 'Already on Today' : 'Aaj Ki Date (Reset to Today)'}
        aria-label="Reset to Today"
        className={`h-8 px-2.5 rounded-full border shadow-xs flex items-center gap-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer focus:outline-none ${
          isToday
            ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/70'
            : todayBtnActive
        }`}
      >
        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="text-[10px] sm:text-[11px]">Today</span>
      </button>
    </div>
  );
};
