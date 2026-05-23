import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import LocationAutocomplete from "../components/search/LocationAutocomplete";
import DatePickerField from "../components/search/DatePickerField";
import TimePickerField from "../components/search/TimePickerField";
import {
  Search,
  ArrowLeftRight,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #D0112B 0%, #8b0012 60%, #6b000e 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute top-20 -left-20 w-64 h-64 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white opacity-5 rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Sri Lanka's smartest bus platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Book Buses
                <br />
                across Sri Lanka
                <br />
                <span className="opacity-80">fast &amp; smart.</span>
              </h1>
              <p className="text-white opacity-80 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Find direct or connecting buses, pay only for the distance you
                travel. Real-time tracking, QR tickets on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/search")}
                  className="bg-white text-brand-500 px-8 py-3 rounded-xl text-sm font-bold hover:bg-brand-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Search Buses
                </button>
                <button
                  onClick={() => navigate("/track")}
                  className="border-2 border-white border-opacity-50 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-white hover:bg-opacity-10 transition-colors flex items-center justify-center gap-2"
                >
                  Track Your Bus <ChevronRight size={16} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10 justify-center lg:justify-start">
                {[
                  { num: "500+", label: "Daily buses" },
                  { num: "50K+", label: "Passengers" },
                  { num: "25+", label: "Districts" },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-2xl font-extrabold text-white">
                      {s.num}
                    </div>
                    <div className="text-xs text-white opacity-60 mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — bus in white circle */}
            <div
              className="hidden lg:flex flex-none items-center justify-center relative"
              style={{ width: 420, height: 380 }}
            >
              <div
                className="absolute bg-white bg-opacity-10 rounded-full"
                style={{ width: 380, height: 380 }}
              />
              <div
                className="absolute bg-white bg-opacity-10 rounded-full"
                style={{ width: 300, height: 300 }}
              />
              <img
                src="/bus.png"
                alt="Bus"
                className="relative z-10 drop-shadow-2xl object-contain"
                style={{ width: 420 }}
              />
            </div>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ══ SEARCH CARD ══════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-4 w-full -mt-2 relative z-10 mb-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
          <div className="text-center mb-5">
            <h2 className="text-base font-bold text-gray-800">
              Where are you going?
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Search direct & connecting buses across Sri Lanka
            </p>
          </div>

          {/* Origin + Shuffle + Destination */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <LocationAutocomplete
              value={form.origin}
              onChange={(value) => setForm((f) => ({ ...f, origin: value }))}
              onEnter={handleSearch}
              placeholder="From — Origin"
              iconTone="text-gray-400"
              inputClassName="placeholder-gray-400"
            />

            <button
              onClick={handleShuffle}
              className="w-10 h-10 flex-none rounded-full border-2 border-brand-500 flex items-center justify-center hover:bg-brand-500 group transition-all mx-auto sm:mx-0"
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
              onChange={(value) =>
                setForm((f) => ({ ...f, destination: value }))
              }
              onEnter={handleSearch}
              placeholder="To — Destination"
              iconTone="text-brand-500"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <DatePickerField
              value={form.date}
              onChange={(value) => setForm((f) => ({ ...f, date: value }))}
            />
            <TimePickerField
              value={form.time}
              onChange={(value) => setForm((f) => ({ ...f, time: value }))}
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={!form.origin || !form.destination || !form.date}
            className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
          >
            <Search size={16} /> Search Buses
          </button>
          <button
            onClick={() =>
              setForm({ origin: "", destination: "", date: "", time: "" })
            }
            className="w-full mt-2 text-gray-400 text-xs py-1 hover:text-brand-500 transition-colors"
          >
            Clear all fields
          </button>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Why choose <span className="text-brand-500">SmartRouteLK?</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            We're reimagining how Sri Lankans travel by bus — smarter, cheaper,
            and more convenient.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "🗺️",
              title: "Smart Route Search",
              desc: "Find direct buses or perfectly timed connecting routes automatically.",
              color: "bg-blue-50 border-blue-100",
              iconBg: "bg-blue-100",
            },
            {
              icon: "💺",
              title: "Pay Per Distance",
              desc: "Only pay for the segment you travel — not the full route price.",
              color: "bg-brand-50 border-brand-100",
              iconBg: "bg-brand-100",
            },
            {
              icon: "📡",
              title: "Live Bus Tracking",
              desc: "See your bus on a live map and get real-time arrival estimates.",
              color: "bg-green-50 border-green-100",
              iconBg: "bg-green-100",
            },
            {
              icon: "📱",
              title: "QR Ticket on WhatsApp",
              desc: "Receive your ticket instantly on WhatsApp. No printing needed.",
              color: "bg-purple-50 border-purple-100",
              iconBg: "bg-purple-100",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`border rounded-2xl p-6 hover:shadow-md transition-all ${f.color}`}
            >
              <div
                className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">
                {f.title}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════ */}
      <section className="bg-gray-50 py-16 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              How <span className="text-brand-500">SmartRouteLK</span> works
            </h2>
            <p className="text-gray-500 text-sm">
              Three simple steps to your next journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connector line — desktop only */}
            <div className="hidden sm:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-brand-100 z-0" />

            {[
              {
                num: "01",
                title: "Enter your journey",
                desc: "Type your boarding point and destination — even if it's not the full route the bus travels.",
              },
              {
                num: "02",
                title: "Pick your bus",
                desc: "See direct buses first, then smart connecting options with timing and seat availability.",
              },
              {
                num: "03",
                title: "Board with QR",
                desc: "Book your seat, get a QR ticket on WhatsApp, and check in by scanning on the bus.",
              },
            ].map((s) => (
              <div key={s.num} className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white border-4 border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl font-extrabold text-brand-500">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Old way vs <span className="text-brand-500">Smart way</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <div className="border-2 border-gray-200 rounded-2xl p-8">
            <div className="text-gray-400 font-bold text-sm mb-4 flex items-center gap-2">
              <span className="text-lg">😓</span> Traditional booking
            </div>
            <ul className="space-y-3">
              {[
                "Pay full route even for short trips",
                "Fixed seats — no dynamic allocation",
                "No live bus tracking",
                "Paper tickets only",
                "No connecting bus suggestions",
              ].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-500"
                >
                  <span className="text-red-400 flex-none mt-0.5">✕</span> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-brand-500 rounded-2xl p-8 bg-brand-50 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Recommended
            </div>
            <div className="text-brand-500 font-bold text-sm mb-4 flex items-center gap-2">
              <span className="text-lg">🚀</span> SmartRoute LK
            </div>
            <ul className="space-y-3">
              {[
                "Pay only for distance you travel",
                "Dynamic seats — reused after drop-off",
                "Live GPS tracking on map",
                "QR ticket on WhatsApp instantly",
                "Smart connecting bus suggestions",
              ].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle
                    size={15}
                    className="text-brand-500 flex-none mt-0.5"
                  />{" "}
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ FOR BUS OWNERS ════════════════════════════ */}
      <section
        className="relative overflow-hidden py-16"
        style={{
          background: "linear-gradient(135deg, #D0112B 0%, #8b0012 100%)",
        }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white opacity-5 rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left">
              <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                For Bus Owners & Operators
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Built for Bus
                <br />
                Owners Too
              </h2>
              <p className="text-white opacity-80 text-sm leading-relaxed max-w-md">
                Manage your buses, routes, pricing, and passengers from one
                simple dashboard. Reduce seat wastage and increase revenue.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
              <div className="space-y-3 mb-6">
                {[
                  "Add buses with custom seat layouts",
                  "Set prices per route segment",
                  "Track passengers digitally",
                  "Auto-generate PDF passenger lists",
                  "Receive WhatsApp booking alerts",
                ].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <div className="w-5 h-5 bg-brand-50 border border-brand-200 rounded-full flex items-center justify-center flex-none">
                      <CheckCircle size={12} className="text-brand-500" />
                    </div>
                    {i}
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  user?.role === "owner" || user?.role === "admin"
                    ? navigate("/owner/add-bus")
                    : navigate("/owner/apply")
                }
                className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
              >
                Register your bus →
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                Free to join · Verified by admin
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
