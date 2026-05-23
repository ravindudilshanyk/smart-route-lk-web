import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { searchAPI } from "../../services/api";
import LocationAutocomplete from "../../components/search/LocationAutocomplete";
import DatePickerField from "../../components/search/DatePickerField";
import {
  ArrowRight,
  Clock,
  Users,
  Star,
  Zap,
  ArrowLeftRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Wifi,
  Wind,
  Droplets,
  Search,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Filter checkbox component ────────────────────────
function FilterCheck({ checked, onChange, label, badge, extra }) {
  return (
    <label className="flex items-center gap-2 py-1.5 cursor-pointer group select-none">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors cursor-pointer flex-none ${
          checked
            ? "bg-brand-500 border-brand-500"
            : "border-gray-300 group-hover:border-brand-300"
        }`}
      >
        {checked && (
          <span className="text-white text-xs leading-none font-bold">✓</span>
        )}
      </div>
      <span className="text-xs text-gray-600 flex-1">{label}</span>
      {badge && <span className="text-xs text-gray-400">{badge}</span>}
      {extra && (
        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
          {extra}
        </span>
      )}
    </label>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState({
    origin: searchParams.get("origin") || "",
    destination: searchParams.get("destination") || "",
    date: searchParams.get("date") || "",
    time: searchParams.get("time") || "",
  });
  const [shuffling, setShuffling] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("best");
  const [showFilters, setShowFilters] = useState(false);
  // expanded state removed (unused)

  const [filters, setFilters] = useState({
    time: { morning: true, afternoon: true, evening: true, night: true },
    type: { direct: true, connecting: true },
    busType: {
      ac: true,
      nonac: true,
      luxury: true,
      semiluxury: true,
      ctb: true,
    },
  });

  const fetchResults = useCallback(
    async (overrides = {}) => {
      const q = { ...search, ...overrides };
      if (!q.origin || !q.destination || !q.date) return;
      setLoading(true);
      try {
        const res = await searchAPI.search({
          origin: q.origin,
          destination: q.destination,
          date: q.date,
          time: q.time || undefined,
        });
        setResults(res.data.results || []);
      } catch {
        toast.error("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    if (search.origin && search.destination && search.date) {
      const timer = setTimeout(() => {
        void fetchResults();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fetchResults, search.origin, search.destination, search.date]);

  const handleSearch = () => {
    if (!search.origin || !search.destination || !search.date) {
      toast.error("Please fill origin, destination and date.");
      return;
    }
    setSearchParams({
      origin: search.origin,
      destination: search.destination,
      date: search.date,
      ...(search.time && { time: search.time }),
    });
    fetchResults();
  };

  const handleShuffle = () => {
    setShuffling(true);
    setSearch((s) => ({ ...s, origin: s.destination, destination: s.origin }));
    setTimeout(() => setShuffling(false), 400);
  };

  const toggleFilter = (category, key) => {
    setFilters((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: !prev[category][key] },
    }));
  };

  const resetFilters = () =>
    setFilters({
      time: { morning: true, afternoon: true, evening: true, night: true },
      type: { direct: true, connecting: true },
      busType: {
        ac: true,
        nonac: true,
        luxury: true,
        semiluxury: true,
        ctb: true,
      },
    });

  const getTimeSlot = (timeStr) => {
    if (!timeStr) return "morning";
    const h = parseInt(timeStr.substring(0, 2));
    if (h >= 6 && h < 12) return "morning";
    if (h >= 12 && h < 18) return "afternoon";
    if (h >= 18 && h < 22) return "evening";
    return "night";
  };

  const getBusTypeKey = (busType) => {
    if (!busType) return "nonac";
    if (busType.includes("luxury") || busType === "luxury") return "luxury";
    if (busType.includes("semi")) return "semiluxury";
    if (busType.includes("ac")) return "ac";
    if (busType === "ctb") return "ctb";
    return "nonac";
  };

  // Apply filters dynamically
  const filtered = results.filter((result) => {
    const firstLeg = result.legs?.[0];
    const timeSlot = getTimeSlot(firstLeg?.board_time);
    if (!filters.time[timeSlot]) return false;
    if (result.transfers === 0 && !filters.type.direct) return false;
    if (result.transfers > 0 && !filters.type.connecting) return false;
    const busKey = getBusTypeKey(firstLeg?.bus_type);
    if (!filters.busType[busKey]) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price") return (a.total_fare || 0) - (b.total_fare || 0);
    if (sortBy === "fastest")
      return (a.total_minutes || 0) - (b.total_minutes || 0);
    if (sortBy === "earliest")
      return (a.legs[0]?.board_time || "").localeCompare(
        b.legs[0]?.board_time || "",
      );
    if (sortBy === "fewest") return a.transfers - b.transfers;
    if (a.transfers !== b.transfers) return a.transfers - b.transfers;
    return (a.total_minutes || 0) - (b.total_minutes || 0);
  });

  const direct = sorted.filter((r) => r.transfers === 0);
  const connecting = sorted.filter((r) => r.transfers > 0);

  const formatTime = (t) => (t ? t.substring(0, 5) : "");
  const formatDur = (m) => {
    if (!m) return "";
    const h = Math.floor(m / 60);
    const mn = m % 60;
    return h > 0 ? `${h}h ${mn}m` : `${mn}m`;
  };

  const busTypeLabel = {
    ctb: "CTB",
    private_normal: "Non-AC",
    private_ac: "AC",
    semi_luxury: "Semi-Luxury",
    luxury: "Luxury",
    highway_normal: "Highway",
    highway_luxury: "Luxury Highway",
  };

  // const { user, canBook } = useAuth();

  const handleBook = (result) => {
    if (!localStorage.getItem("token")) {
      toast.error("Please sign in to book a seat.");
      navigate("/login");
      return;
    }
    navigate(`/seats/${result.legs[0].bus_id}`, {
      state: {
        result,
        date: search.date,
        origin: search.origin,
        destination: search.destination,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* ── Inline search bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <div className="flex-1 min-w-0">
              <LocationAutocomplete
                value={search.origin}
                onChange={(value) => setSearch((s) => ({ ...s, origin: value }))}
                onEnter={handleSearch}
                placeholder="From"
                iconTone="text-gray-400"
                inputClassName="placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleShuffle}
              className="w-9 h-9 flex-none rounded-full border-2 border-brand-500 flex items-center justify-center hover:bg-brand-500 group transition-all mx-auto sm:mx-0"
              style={{
                transform: shuffling ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.4s ease",
              }}
            >
              <ArrowLeftRight
                size={14}
                className="text-brand-500 group-hover:text-white transition-colors"
              />
            </button>
            <div className="flex-1 min-w-0">
              <LocationAutocomplete
                value={search.destination}
                onChange={(value) =>
                  setSearch((s) => ({ ...s, destination: value }))
                }
                onEnter={handleSearch}
                placeholder="To"
                iconTone="text-brand-500"
              />
            </div>
            <div className="flex-1 min-w-0">
              <DatePickerField
                value={search.date}
                onChange={(value) => setSearch((s) => ({ ...s, date: value }))}
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-brand-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center gap-2 flex-none"
            >
              <Search size={14} /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Filters ── */}
          <div className="lg:w-56 flex-none">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 mb-3 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Filter size={14} className="text-brand-500" /> Filters
              </span>
              {showFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            <div
              className={`${showFilters ? "block" : "hidden"} lg:block space-y-3`}
            >
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Clock size={12} className="text-brand-500" /> Departure time
                </div>
                {[
                  { key: "morning", label: "🌅 Morning", badge: "6am–12pm" },
                  {
                    key: "afternoon",
                    label: "☀️ Afternoon",
                    badge: "12pm–6pm",
                  },
                  { key: "evening", label: "🌆 Evening", badge: "6pm–10pm" },
                  { key: "night", label: "🌙 Night", badge: "10pm–6am" },
                ].map((t) => (
                  <FilterCheck
                    key={t.key}
                    checked={filters.time[t.key]}
                    onChange={() => toggleFilter("time", t.key)}
                    label={t.label}
                    badge={t.badge}
                  />
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Zap size={12} className="text-brand-500" /> Route type
                </div>
                {[
                  { key: "direct", label: "Direct only", extra: "Faster" },
                  {
                    key: "connecting",
                    label: "With connections",
                    extra: "More options",
                  },
                ].map((t) => (
                  <FilterCheck
                    key={t.key}
                    checked={filters.type[t.key]}
                    onChange={() => toggleFilter("type", t.key)}
                    label={t.label}
                    extra={t.extra}
                  />
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Wind size={12} className="text-brand-500" /> Bus type
                </div>
                {[
                  { key: "luxury", label: "Luxury" },
                  { key: "ac", label: "AC" },
                  { key: "semiluxury", label: "Semi-Luxury" },
                  { key: "nonac", label: "Non-AC" },
                  { key: "ctb", label: "CTB" },
                ].map((t) => (
                  <FilterCheck
                    key={t.key}
                    checked={filters.busType[t.key]}
                    onChange={() => toggleFilter("busType", t.key)}
                    label={t.label}
                  />
                ))}
              </div>

              <button
                onClick={resetFilters}
                className="w-full text-xs text-gray-400 hover:text-brand-500 transition-colors py-1 text-center"
              >
                Reset all filters
              </button>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Count + sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div className="text-sm text-gray-600">
                {loading ? (
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="font-bold text-gray-900 text-lg">
                      {filtered.length}
                    </span>{" "}
                    options ·{" "}
                    <span className="text-brand-500 font-semibold">
                      {direct.length} direct
                    </span>{" "}
                    · {connecting.length} with transfer
                  </>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "best", label: "Best" },
                  { key: "earliest", label: "Earliest" },
                  { key: "fastest", label: "Fastest" },
                  { key: "fewest", label: "Fewest stops" },
                  { key: "price", label: "Cheapest" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      sortBy === s.key
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
                  >
                    <div className="h-3 bg-gray-100 rounded w-20 mb-4" />
                    <div className="flex justify-between">
                      <div className="space-y-2 flex-1 mr-8">
                        <div className="h-4 bg-gray-100 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-8 bg-gray-100 rounded w-full" />
                      </div>
                      <div className="space-y-2 w-28">
                        <div className="h-6 bg-gray-100 rounded" />
                        <div className="h-9 bg-gray-100 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="text-6xl mb-4">🚌</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  No buses found
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  {results.length > 0
                    ? "Try adjusting your filters to see more results."
                    : `No buses from ${search.origin} to ${search.destination} on ${search.date}.`}
                </p>
                {results.length > 0 ? (
                  <button
                    onClick={resetFilters}
                    className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/")}
                    className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
                  >
                    Back to search
                  </button>
                )}
              </div>
            )}

            {/* Direct section */}
            {!loading && direct.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    <Zap size={11} /> Direct buses
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {direct.length} found
                  </span>
                </div>
                <div className="space-y-3">
                  {direct.map((result, idx) => (
                    <ResultCard
                      key={idx}
                      result={result}
                      isDirect
                      formatTime={formatTime}
                      formatDur={formatDur}
                      busTypeLabel={busTypeLabel}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Connecting section */}
            {!loading && connecting.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    🔄 With transfers
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {connecting.length} found
                  </span>
                </div>
                <div className="space-y-3">
                  {connecting.map((result, idx) => (
                    <ResultCard
                      key={`c-${idx}`}
                      result={result}
                      isDirect={false}
                      formatTime={formatTime}
                      formatDur={formatDur}
                      busTypeLabel={busTypeLabel}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Result card ──────────────────────────────────────
function ResultCard({
  result,
  isDirect,
  formatTime,
  formatDur,
  busTypeLabel,
  onBook,
}) {
  const totalSeats = result.legs?.reduce(
    (min, l) => Math.min(min, l.seats_available || 0),
    999,
  );
  const isFull = totalSeats === 0;

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 ${
        isDirect
          ? "border-l-brand-500 border border-gray-100"
          : "border-l-amber-400 border border-gray-100"
      }`}
    >
      {/* Header row */}
      <div
        className={`px-5 pt-4 pb-3 flex items-center justify-between ${
          isDirect
            ? "bg-gradient-to-r from-brand-50 to-white"
            : "bg-gradient-to-r from-amber-50 to-white"
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isDirect ? (
            <span className="flex items-center gap-1 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap size={11} /> Direct
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              🔄 {result.transfers} transfer{result.transfers > 1 ? "s" : ""}
            </span>
          )}
          {!isDirect && (
            <span className="text-xs text-gray-500 hidden sm:block">
              via{" "}
              {result.legs
                ?.slice(0, -1)
                .map((l) => l.drop_stop_name)
                .join(" → ")}
            </span>
          )}
          {totalSeats > 0 && totalSeats <= 5 && (
            <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
              <AlertCircle size={11} /> Only {totalSeats} seats left
            </span>
          )}
        </div>
        <div className="text-right flex-none ml-4">
          <div className="text-xs text-gray-400">from</div>
          <div className="text-lg font-extrabold text-brand-500">
            {(result.total_fare || 0).toLocaleString()}{" "}
            <span className="text-xs font-semibold">LKR</span>
          </div>
        </div>
      </div>

      {/* Journey path for connecting */}
      {!isDirect && (
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-1 text-xs text-amber-700 overflow-x-auto flex-nowrap">
            {result.legs?.map((leg, i) => (
              <span key={i} className="flex items-center gap-1 flex-none">
                {i === 0 && (
                  <span className="font-semibold">{leg.board_stop_name}</span>
                )}
                <ArrowRight size={10} />
                <span
                  className={`font-semibold ${i < result.legs.length - 1 ? "text-amber-600" : "text-gray-700"}`}
                >
                  {leg.drop_stop_name}
                </span>
                {i < result.legs.length - 1 && (
                  <span className="bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full text-xs mx-1 flex-none">
                    change
                  </span>
                )}
              </span>
            ))}
            <span className="text-amber-600 ml-1 flex-none">
              · {formatDur(result.total_minutes)}
            </span>
          </div>
        </div>
      )}

      {/* Legs */}
      {result.legs?.map((leg, legIdx) => (
        <div key={legIdx}>
          {legIdx > 0 && (
            <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-y border-amber-100">
              <div className="flex-1 h-px bg-amber-200" />
              <span className="text-amber-600 text-xs font-semibold flex-none">
                🚏 Change bus at {result.legs[legIdx - 1]?.drop_stop_name}
              </span>
              <div className="flex-1 h-px bg-amber-200" />
            </div>
          )}

          <div className="px-5 py-4">
            <div className="flex items-start gap-4">
              {/* Left — bus info + timeline */}
              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="font-bold text-gray-900 text-sm">
                    {leg.reg_number}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {busTypeLabel[leg.bus_type] || leg.bus_type}
                  </span>
                  {leg.amenities?.ac && (
                    <span className="flex items-center gap-0.5 bg-blue-50 text-blue-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      <Wind size={10} /> AC
                    </span>
                  )}
                  {leg.amenities?.wifi && (
                    <span className="flex items-center gap-0.5 bg-green-50 text-green-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      <Wifi size={10} /> WiFi
                    </span>
                  )}
                  {leg.amenities?.water && (
                    <span className="flex items-center gap-0.5 bg-cyan-50 text-cyan-500 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      <Droplets size={10} /> Water
                    </span>
                  )}
                  {leg.rating > 0 && (
                    <span className="flex items-center gap-0.5 bg-amber-50 text-amber-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      <Star size={10} fill="currentColor" />{" "}
                      {parseFloat(leg.rating).toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Time visual */}
                <div className="flex items-center gap-3">
                  <div className="text-center flex-none">
                    <div className="text-2xl font-extrabold text-gray-900 leading-none">
                      {formatTime(leg.board_time)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-16 leading-tight truncate">
                      {leg.board_stop_name}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-gray-400">
                      {formatDur(result.total_minutes)}
                    </div>
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 h-0.5 bg-gray-200" />
                      <ArrowRight
                        size={12}
                        className={
                          isDirect ? "text-brand-500" : "text-amber-500"
                        }
                      />
                      <div className="flex-1 h-0.5 bg-gray-200" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users size={11} />
                      <span
                        className={
                          leg.seats_available <= 5 && leg.seats_available > 0
                            ? "text-orange-500 font-semibold"
                            : ""
                        }
                      >
                        {leg.seats_available} seats
                      </span>
                    </div>
                  </div>
                  <div className="text-center flex-none">
                    <div className="text-2xl font-extrabold text-gray-900 leading-none">
                      {formatTime(leg.drop_time)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-16 leading-tight truncate">
                      {leg.drop_stop_name}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  Route {leg.route_number} · {leg.route_name}
                </div>
              </div>

              {/* Right — fare */}
              <div className="flex-none text-right border-l border-gray-100 pl-4 flex flex-col items-end justify-between min-h-16">
                <div>
                  <div className="text-xl font-extrabold text-brand-500 leading-none">
                    {(leg.fare || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">LKR / seat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom action row — full width */}
      <div
        className={`px-5 py-3 flex items-center justify-between border-t ${
          isDirect
            ? "border-brand-50 bg-brand-50"
            : "border-amber-50 bg-amber-50"
        }`}
      >
        <div className="text-xs text-gray-500">
          {result.transfers === 0
            ? `${result.legs?.[0]?.board_stop_name} → ${result.legs?.[0]?.drop_stop_name}`
            : `${result.legs?.length} buses · ${formatDur(result.total_minutes)} total`}
        </div>
        <button
          onClick={() => onBook(result)}
          disabled={isFull}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isDirect
                ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
          }`}
        >
          {isFull ? "Bus full" : "Select seats →"}
        </button>
      </div>
    </div>
  );
}
