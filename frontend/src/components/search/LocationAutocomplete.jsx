import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import api from "../../services/api";

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  iconTone = "text-gray-400",
  inputClassName = "",
  onEnter,
}) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/search/stops", {
          params: { q: query },
        });
        if (active) setSuggestions(res.data.stops || []);
      } catch {
        if (active) setSuggestions([]);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  const showSuggestions = focused && suggestions.length > 0;

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-3 focus-within:border-brand-500 transition-colors">
        <MapPin size={16} className={`${iconTone} flex-none`} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          className={`flex-1 text-sm outline-none bg-transparent ${inputClassName}`}
        />
        <ChevronDown size={14} className="text-gray-300 flex-none" />
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-30">
          {suggestions.map((stop) => (
            <button
              type="button"
              key={stop}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(stop);
                setFocused(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              {stop}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
