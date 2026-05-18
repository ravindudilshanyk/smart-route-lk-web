import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { searchAPI } from "../../services/api";
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
} from "lucide-react";
import toast from "react-hot-toast";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("best");
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
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!origin || !destination || !date) {
      navigate("/");
      return;
    }
    fetchResults();
  }, [origin, destination, date]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await searchAPI.search({ origin, destination, date, time });
      setResults(res.data.results || []);
    } catch (err) {
      toast.error("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    return t.substring(0, 5);
  };

  const formatDuration = (mins) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const busTypeLabel = {
    ctb: "CTB",
    private_normal: "Non-AC",
    private_ac: "AC",
    semi_luxury: "Semi Luxury",
    luxury: "Luxury",
    highway_normal: "Highway",
    highway_luxury: "Highway Luxury",
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "price") return a.total_fare - b.total_fare;
    if (sortBy === "fastest") return a.total_minutes - b.total_minutes;
    if (sortBy === "earliest")
      return a.legs[0]?.board_time?.localeCompare(b.legs[0]?.board_time);
    if (sortBy === "fewest") return a.transfers - b.transfers;
    // best — direct first then by time
    if (a.transfers !== b.transfers) return a.transfers - b.transfers;
    return a.total_minutes - b.total_minutes;
  });

  const handleBook = (result) => {
    if (!localStorage.getItem("token")) {
      toast.error("Please sign in to book a seat.");
      navigate("/login");
      return;
    }
    // Pass result data via state
    navigate(`/seats/${result.legs[0].bus_id}`, {
      state: { result, date, origin, destination },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* ── Search header bar ─────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Route summary */}
          <div className="flex items-center gap-2 flex-1">
            <span className="font-bold text-gray-900 text-sm">{origin}</span>
            <ArrowRight size={14} className="text-brand-500 flex-none" />
            <span className="font-bold text-gray-900 text-sm">
              {destination}
            </span>
            <span className="text-gray-400 text-xs ml-1">· {date}</span>
          </div>

          {/* Modify search */}
          <button
            onClick={() => navigate("/")}
            className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline flex-none"
          >
            <ArrowLeftRight size={12} /> Modify search
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Filters sidebar ── */}
          <div className="lg:w-56 flex-none">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 mb-3"
            >
              <span className="flex items-center gap-2">
                <Filter size={15} /> Filters
              </span>
              {showFilters ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>

            <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-5">
                <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <Filter size={14} className="text-brand-500" /> Filters
                </div>

                {/* Departure time */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Departure time
                  </div>
                  {[
                    { key: "morning", label: "Morning", sub: "6am – 12pm" },
                    { key: "afternoon", label: "Afternoon", sub: "12pm – 6pm" },
                    { key: "evening", label: "Evening", sub: "6pm – 10pm" },
                    { key: "night", label: "Night", sub: "10pm – 6am" },
                  ].map((t) => (
                    <label
                      key={t.key}
                      className="flex items-center gap-2 py-1.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={filters.time[t.key]}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            time: { ...f.time, [t.key]: e.target.checked },
                          }))
                        }
                        className="accent-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-600 group-hover:text-gray-900">
                        {t.label} <span className="text-gray-400">{t.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {/* Travel type */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Travel type
                  </div>
                  {[
                    { key: "direct", label: "Direct only" },
                    { key: "connecting", label: "With connections" },
                  ].map((t) => (
                    <label
                      key={t.key}
                      className="flex items-center gap-2 py-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.type[t.key]}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            type: { ...f.type, [t.key]: e.target.checked },
                          }))
                        }
                        className="accent-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-600">{t.label}</span>
                    </label>
                  ))}
                </div>

                {/* Bus type */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Bus type
                  </div>
                  {[
                    { key: "ac", label: "AC" },
                    { key: "nonac", label: "Non-AC" },
                    { key: "luxury", label: "Luxury" },
                    { key: "semiluxury", label: "Semi Luxury" },
                    { key: "ctb", label: "CTB" },
                  ].map((t) => (
                    <label
                      key={t.key}
                      className="flex items-center gap-2 py-1.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.busType[t.key]}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            busType: {
                              ...f.busType,
                              [t.key]: e.target.checked,
                            },
                          }))
                        }
                        className="accent-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-600">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Sort + count bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="text-sm text-gray-500">
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    <span className="font-bold text-gray-900">
                      {results.length}
                    </span>{" "}
                    options found
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Sort:</span>
                {[
                  { key: "best", label: "Best match" },
                  { key: "earliest", label: "Earliest" },
                  { key: "fastest", label: "Fastest" },
                  { key: "fewest", label: "Fewest transfers" },
                  { key: "price", label: "Lowest price" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sortBy === s.key
                        ? "bg-brand-500 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
                  >
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && results.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">🚌</div>
                <h3 className="font-bold text-gray-900 mb-2">No buses found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No buses found from <strong>{origin}</strong> to{" "}
                  <strong>{destination}</strong> on {date}.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
                >
                  Modify search
                </button>
              </div>
            )}

            {/* Result cards */}
            {!loading &&
              sortedResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4 hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div
                    className={`px-5 py-3 flex items-center justify-between ${
                      result.transfers === 0
                        ? "bg-brand-50 border-b border-brand-100"
                        : "bg-orange-50 border-b border-orange-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.transfers === 0 ? (
                        <span className="flex items-center gap-1.5 text-brand-500 font-bold text-sm">
                          <Zap size={14} /> Direct line
                        </span>
                      ) : (
                        <span className="text-orange-600 font-bold text-sm">
                          {result.transfers} transfer
                          {result.transfers > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">
                        {origin} → {destination}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">
                      Total:{" "}
                      <span className="text-brand-500">
                        {result.total_fare?.toLocaleString() || "—"} LKR
                      </span>
                    </div>
                  </div>

                  {/* Legs */}
                  {result.legs?.map((leg, legIdx) => (
                    <div key={legIdx}>
                      {/* Transfer badge between legs */}
                      {legIdx > 0 && (
                        <div className="flex items-center gap-3 px-5 py-2 bg-orange-50 border-y border-orange-100">
                          <div className="flex-1 h-px bg-orange-200" />
                          <span className="text-orange-600 text-xs font-semibold flex items-center gap-1">
                            <Clock size={12} />
                            Transfer at{" "}
                            {result.legs[legIdx - 1]?.drop_stop_name}
                          </span>
                          <div className="flex-1 h-px bg-orange-200" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {/* Bus info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {leg.reg_number}
                                  </span>
                                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {busTypeLabel[leg.bus_type] || leg.bus_type}
                                  </span>
                                  {leg.amenities?.ac && (
                                    <span className="flex items-center gap-0.5 text-blue-500 text-xs font-semibold">
                                      <Wind size={11} /> AC
                                    </span>
                                  )}
                                  {leg.amenities?.wifi && (
                                    <span className="flex items-center gap-0.5 text-green-500 text-xs font-semibold">
                                      <Wifi size={11} /> WiFi
                                    </span>
                                  )}
                                  {leg.amenities?.water && (
                                    <span className="flex items-center gap-0.5 text-cyan-500 text-xs font-semibold">
                                      <Droplets size={11} /> Water
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Route {leg.route_number} · {leg.route_name}
                                </div>
                              </div>
                              {leg.rating > 0 && (
                                <div className="flex items-center gap-1 bg-brand-50 text-brand-500 px-2 py-1 rounded-lg text-xs font-bold">
                                  <Star size={11} fill="currentColor" />{" "}
                                  {leg.rating}
                                </div>
                              )}
                            </div>

                            {/* Time row */}
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-lg font-extrabold text-gray-900">
                                  {formatTime(leg.board_time)}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {leg.board_stop_name}
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="text-xs text-gray-400">
                                  {formatDuration(result.total_minutes)}
                                </div>
                                <div className="w-full flex items-center gap-1">
                                  <div className="flex-1 h-px bg-gray-200" />
                                  <ArrowRight
                                    size={12}
                                    className="text-brand-500 flex-none"
                                  />
                                  <div className="flex-1 h-px bg-gray-200" />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Users size={11} />
                                  {leg.seats_available} seats
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-extrabold text-gray-900">
                                  {formatTime(leg.drop_time)}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {leg.drop_stop_name}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Fare + book button */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:min-w-28">
                            <div className="text-right">
                              <div className="text-xl font-extrabold text-brand-500">
                                {leg.fare?.toLocaleString() || "—"} LKR
                              </div>
                              <div className="text-xs text-gray-400">
                                per seat
                              </div>
                            </div>
                            {result.legs.length === 1 ||
                            legIdx === result.legs.length - 1 ? (
                              <button
                                onClick={() => handleBook(result)}
                                disabled={leg.seats_available === 0}
                                className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {leg.seats_available === 0
                                  ? "Full"
                                  : "View Seats"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 text-right">
                                Leg {legIdx + 1} of {result.legs.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Expand for multi-leg details */}
                  {result.transfers > 0 && (
                    <div className="border-t border-gray-50 px-5 py-2.5 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Total journey: {formatDuration(result.total_minutes)} ·{" "}
                        {result.transfers} transfer
                        {result.transfers > 1 ? "s" : ""}
                      </div>
                      <button
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [idx]: !e[idx] }))
                        }
                        className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline"
                      >
                        {expanded[idx]
                          ? "Hide details"
                          : "Full journey details"}
                        {expanded[idx] ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
