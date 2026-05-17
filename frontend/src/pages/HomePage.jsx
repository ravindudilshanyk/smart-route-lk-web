import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import { MapPin, Calendar, Clock, Search, ArrowLeftRight } from "lucide-react";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
  });
  const [shuffling, setShuffling] = useState(false);

  const handleShuffle = () => {
    setShuffling(true);
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
    setTimeout(() => setShuffling(false), 400);
  };

  const handleSearch = () => {
    if (!form.origin || !form.destination || !form.date) return;
    const params = new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      ...(form.time && { time: form.time }),
    });
    navigate(`/results?${params.toString()}`);
  };

  const handleClear = () => {
    setForm({ origin: "", destination: "", date: "", time: "" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero + Search wrapped together in pink bg ── */}
      <div className="bg-brand-50 pb-16 relative mb-48">
        {/* Hero content */}
        <section className="max-w-6xl mx-auto px-6 pt-10 pb-2 flex items-center justify-between gap-4 relative top-14">
          {/* Left — text + buttons */}
          <div className="flex-1 max-w-md relative z-10">
            <h1 className="text-4xl font-extrabold leading-tight mb-3 text-brand-500">
              Book Buses across
              <br />
              Sri Lanka
              <br />
              fast &amp; smart
            </h1>
            <p className="text-gray-500 text-sm mb-7 leading-relaxed">
              Find direct or connecting buses, pay only for the distance you
              travel.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/search")}
                className="bg-brand-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
              >
                Search Buses
              </button>
              <button
                onClick={() => navigate("/track")}
                className="border-2 border-gray-800 text-gray-800 px-6 py-2.5 rounded-lg text-sm font-bold hover:border-brand-500 hover:text-brand-500 transition-colors bg-transparent"
              >
                Track Buses
              </button>
            </div>
          </div>

          {/* Right — circle with bus inside */}
          <div
            className="hidden md:block relative flex-none"
            style={{ width: 540, height: 280 }}
          >
            {/* The white circle */}
            <div
              className="absolute bg-white rounded-full"
              style={{
                width: 320,
                height: 320,
                top: "50%",
                right: 0,
                transform: "translateY(-50%)",
                boxShadow: "0 8px 40px rgba(208,17,43,0.08)",
              }}
            />

            {/* Bus image centered on the circle */}
            <img
              src="/bus.png"
              alt="SmartRoute LK Bus"
              className="absolute object-contain drop-shadow-xl"
              style={{
                width: 540,
                height: "auto",
                top: "50%",
                right: -10,
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
          </div>
        </section>

        {/* ── Search card — still inside pink bg ─────── */}
        <section className="max-w-3xl mx-auto px-4 relative z-10 absolute transform -bottom-44 w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
            {/* Origin + shuffle + destination row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-brand-500 transition-colors">
                <MapPin size={15} className="text-gray-400 flex-none" />
                <input
                  type="text"
                  placeholder="Enter your origin"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
                />
              </div>

              {/* Shuffle */}
              <button
                onClick={handleShuffle}
                title="Swap origin and destination"
                className="w-9 h-9 flex-none rounded-full border-2 border-brand-500 flex items-center justify-center hover:bg-brand-500 group transition-all"
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

              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-brand-500 transition-colors">
                <MapPin size={15} className="text-brand-500 flex-none" />
                <input
                  type="text"
                  placeholder="Enter your Destination"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({ ...form, destination: e.target.value })
                  }
                  className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
            </div>

            {/* Date + time row */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-brand-500 transition-colors">
                <Calendar size={15} className="text-gray-400 flex-none" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="flex-1 text-sm outline-none text-gray-600 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-brand-500 transition-colors">
                <Clock size={15} className="text-gray-400 flex-none" />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="flex-1 text-sm outline-none text-gray-600 bg-transparent"
                />
              </div>
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={!form.origin || !form.destination || !form.date}
              className="w-full bg-brand-500 text-white py-3 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search size={15} />
              Search
            </button>
            <button
              onClick={handleClear}
              className="w-full mt-2 text-brand-500 text-sm font-semibold py-1 hover:underline"
            >
              Clear All
            </button>
          </div>
        </section>
      </div>
      {/* ── End pink bg ───────────────────────────────── */}

      {/* ── Features strip ───────────────────────────── */}
      <section className="bg-gray-50 py-8 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-6 flex-wrap justify-between">
            <div className="text-brand-500 font-bold text-sm leading-snug max-w-28">
              Pay only for the distance you travel
            </div>

            <div className="w-px h-10 bg-gray-200 hidden md:block" />

            {[
              {
                title: "Smart route & bus connections",
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D0112B"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                  </svg>
                ),
              },
              {
                title: "Seats reused after drop-off points",
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D0112B"
                    strokeWidth="1.8"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                title: "Live tracking & real-time updates",
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D0112B"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                ),
              },
              {
                title: "Works for government & private buses",
                svg: (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D0112B"
                    strokeWidth="1.8"
                  >
                    <rect x="1" y="3" width="22" height="13" rx="2" />
                    <path d="M5 3v13M19 3v13M1 9h22" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-center gap-2 text-center flex-1 min-w-24"
              >
                <div className="w-10 h-10 rounded-full border-2 border-brand-100 bg-brand-50 flex items-center justify-center">
                  {f.svg}
                </div>
                <span className="text-xs text-gray-500 leading-snug">
                  {f.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-center text-2xl font-bold mb-10">
          How <span className="text-brand-500">SmartRouteLK</span> Works?
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              step: "Step 1",
              desc: "Enter where you get in and where you get down — even if it's not the full route.",
            },
            {
              step: "Step 2",
              desc: "Select a direct bus or system-suggested connections based on time matching.",
            },
            {
              step: "Step 3",
              desc: "Track your bus live and check in using QR code.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="border border-gray-100 rounded-xl p-6 hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="text-sm font-semibold text-brand-500 mb-3">
                {s.step}
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why choose ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-center text-2xl font-bold mb-10">
          Why Choose <span className="text-brand-500">SmartRouteLK</span>?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-xl p-8">
            <div className="font-bold text-base mb-4">Traditional Systems</div>
            <ul className="space-y-3 text-sm text-gray-500">
              {[
                "Full-route payment",
                "Fixed seat usage",
                "No live updates",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-none" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-500 rounded-xl p-8">
            <div className="font-bold text-base mb-4 text-white">
              SmartRoute LK
            </div>
            <ul className="space-y-3 text-sm text-white">
              {[
                "Route-based pricing",
                "Flexible seat reuse",
                "Smart planning & tracking",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white flex-none" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── For bus owners ───────────────────────────── */}
      <section className="bg-brand-500 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-2xl overflow-hidden flex">
            <div className="bg-brand-500 p-10 flex items-center min-w-52">
              <h3 className="text-3xl font-extrabold text-white leading-tight">
                Built for
                <br />
                Bus Owners
                <br />
                Too
              </h3>
            </div>
            <div className="flex-1 p-10 flex items-center justify-between gap-8">
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "Add routes, stops, and seat layouts",
                  "Set prices per segment",
                  "Track passengers digitally",
                  "Reduce seat wastage",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-none" />
                    {i}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="bg-brand-500 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-brand-600 transition-colors border-2 border-white whitespace-nowrap flex-none"
              >
                Register your bus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <Footer />
    </div>
  );
}
