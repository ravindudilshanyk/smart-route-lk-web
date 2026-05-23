import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function pad(number) {
  return String(number).padStart(2, "0");
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getMonthMatrix(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function DatePickerField({ value, onChange }) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value) || new Date());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const parsed = parseDateValue(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const monthCells = getMonthMatrix(year, month);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const chooseDate = (date) => {
    onChange(formatDateValue(date));
    setOpen(false);
  };

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-3 focus-within:border-brand-500 transition-colors text-left bg-white"
      >
        <CalendarDays size={16} className="text-brand-500 flex-none" />
        <span className={`flex-1 text-sm ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value || "Select date"}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-100 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-full border border-brand-100 bg-white flex items-center justify-center text-brand-500 hover:bg-brand-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-bold text-gray-800">{monthLabel}</div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-full border border-brand-100 bg-white flex items-center justify-center text-brand-500 hover:bg-brand-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-center py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-3 pb-3 pt-1">
            {monthCells.map((date, index) => {
              const isSelected = selectedDate && date && formatDateValue(date) === formatDateValue(selectedDate);
              const isToday = date && formatDateValue(date) === formatDateValue(new Date());

              if (!date) {
                return <div key={`blank-${index}`} className="h-10" />;
              }

              return (
                <button
                  type="button"
                  key={formatDateValue(date)}
                  onClick={() => chooseDate(date)}
                  className={`h-10 rounded-xl text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-brand-500 text-white shadow-md shadow-brand-200"
                      : isToday
                        ? "bg-brand-50 text-brand-600 border border-brand-100"
                        : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
