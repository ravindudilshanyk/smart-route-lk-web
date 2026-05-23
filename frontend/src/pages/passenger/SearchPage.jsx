import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LocationAutocomplete from "../../components/search/LocationAutocomplete";
import DatePickerField from "../../components/search/DatePickerField";
import TimePickerField from "../../components/search/TimePickerField";
import { Search, ArrowLeftRight } from "lucide-react";

const POPULAR = [
  { from: "Colombo Fort", to: "Kandy" },
  { from: "Colombo Fort", to: "Galle" },
  { from: "Colombo Fort", to: "Jaffna" },
  { from: "Colombo Fort", to: "Matara" },
  { from: "Kandy", to: "Badulla" },
  { from: "Galle", to: "Matara" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
  });
  const [shuffling, setShuffling] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSearch = () => {
    if (!form.origin || !form.destination || !form.date) {
      return;
    }
    const params = new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      ...(form.time && { time: form.time }),
    });
    navigate(`/results?${params.toString()}`);
  };

  const handleShuffle = () => {
    setShuffling(true);
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
    setTimeout(() => setShuffling(false), 400);
  };

  const handlePopular = (route) => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const date = today.toISOString().split("T")[0];
    setForm((f) => ({ ...f, origin: route.from, destination: route.to, date }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #D0112B 0%, #8b0012 100%)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white opacity-5 rounded-full" />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Find your bus
          </h1>
          <p className="text-white opacity-80 text-sm">
            Search direct and connecting buses across Sri Lanka
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none">
            <path
              d="M0 40L1440 40L1440 0C1440 0 1080 40 720 40C360 40 0 0 0 0L0 40Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 w-full -mt-2 pb-12">
        {/* Search card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          {/* Origin + Shuffle + Destination */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <LocationAutocomplete
              value={form.origin}
              onChange={(value) => set("origin", value)}
              onEnter={handleSearch}
              placeholder="From — Origin city or stop"
              iconTone="text-gray-400"
              inputClassName="placeholder-gray-400"
            />
            <button
              onClick={handleShuffle}
              className="w-10 h-10 flex-none rounded-full border-2 border-brand-500 flex items-center justify-center hover:bg-brand-500 group transition-all mx-auto"
              style={{
                transform: shuffling ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.4s ease",
              }}
            >
              <ArrowLeftRight
                size={15}
                className="text-brand-500 group-hover:text-white transition-colors"
              />
            </button>
            <LocationAutocomplete
              value={form.destination}
              onChange={(value) => set("destination", value)}
              onEnter={handleSearch}
              placeholder="To — Destination"
              iconTone="text-brand-500"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <DatePickerField value={form.date} onChange={(value) => set("date", value)} />
            <TimePickerField value={form.time} onChange={(value) => set("time", value)} />
          </div>

          <button
            onClick={handleSearch}
            disabled={!form.origin || !form.destination || !form.date}
            className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
          >
            <Search size={16} /> Search Buses
          </button>
        </div>

        {/* Popular routes */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Popular routes
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR.map((route) => (
              <button
                key={`${route.from}-${route.to}`}
                onClick={() => handlePopular(route)}
                className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-brand-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-700 truncate">
                    {route.from}
                  </span>
                  <span className="text-brand-500 flex-none">→</span>
                  <span className="font-semibold text-gray-700 truncate">
                    {route.to}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
