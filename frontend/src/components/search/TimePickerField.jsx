import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, ChevronDown } from "lucide-react";

function pad(number) {
  return String(number).padStart(2, "0");
}

function buildTimes(stepMinutes = 30) {
  const times = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      times.push(`${pad(hour)}:${pad(minute)}`);
    }
  }
  return times;
}

export default function TimePickerField({ value, onChange }) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const times = useMemo(() => buildTimes(30), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chooseTime = (time) => {
    onChange(time);
    setOpen(false);
  };

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-3 focus-within:border-brand-500 transition-colors text-left bg-white"
      >
        <Clock3 size={16} className="text-brand-500 flex-none" />
        <span className={`flex-1 text-sm ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value || "Select time"}
        </span>
        <ChevronDown size={14} className="text-gray-300 flex-none" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-100 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
            <div className="text-sm font-bold text-gray-800">Select time</div>
            <div className="text-xs text-gray-400 mt-0.5">30-minute intervals</div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 grid grid-cols-2 gap-2">
            {times.map((time) => {
              const isSelected = time === value;
              return (
                <button
                  type="button"
                  key={time}
                  onClick={() => chooseTime(time)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-brand-500 text-white shadow-md shadow-brand-200"
                      : "bg-gray-50 text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
