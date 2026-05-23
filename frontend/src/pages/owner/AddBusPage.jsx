import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowRight,
  ChevronLeft,
  Plus,
  Trash2,
  Bus,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const BUS_TYPES = [
  { value: "ctb", label: "CTB", desc: "Ceylon Transport Board" },
  {
    value: "private_normal",
    label: "Private Non-AC",
    desc: "Regular private bus",
  },
  { value: "private_ac", label: "Private AC", desc: "Air conditioned" },
  { value: "semi_luxury", label: "Semi Luxury", desc: "Semi luxury coach" },
  { value: "luxury", label: "Luxury", desc: "Luxury coach" },
  { value: "highway_normal", label: "Highway", desc: "Highway express" },
  { value: "highway_luxury", label: "Highway Luxury", desc: "Luxury highway" },
];

export default function AddBusPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=info, 2=stops, 3=seats, 4=pricing
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  // Step 1 — Bus info
  const [busInfo, setBusInfo] = useState({
    reg_number: "",
    bus_type: "",
    route_number: "",
    route_name: "",
    departure_time: "",
    arrival_time: "",
    operating_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    has_ac: false,
    has_wifi: false,
    has_water: false,
  });

  // Step 2 — Stops
  const [stops, setStops] = useState([
    { stop_name: "", estimated_time: "", distance_from_start_km: "" },
    { stop_name: "", estimated_time: "", distance_from_start_km: "" },
  ]);

  // Step 3 — Seat layout
  const [layout, setLayout] = useState({ rows: 10, cols: 5, aisle_col: 2 });

  // Step 4 — Pricing
  const [pricing, setPricing] = useState({
    price_per_km: "",
    min_fare: "",
    max_fare: "",
    refund_pct_before: 100,
    refund_hours_threshold: 24,
    refund_pct_within: 50,
  });

  const toggleDay = (day) => {
    setBusInfo((b) => ({
      ...b,
      operating_days: b.operating_days.includes(day)
        ? b.operating_days.filter((d) => d !== day)
        : [...b.operating_days, day],
    }));
  };

  const addStop = () => {
    setStops((s) => [
      ...s,
      { stop_name: "", estimated_time: "", distance_from_start_km: "" },
    ]);
  };

  const removeStop = (idx) => {
    if (stops.length <= 2) {
      toast.error("Minimum 2 stops required.");
      return;
    }
    setStops((s) => s.filter((_, i) => i !== idx));
  };

  const updateStop = (idx, field, val) => {
    setStops((s) =>
      s.map((stop, i) => (i === idx ? { ...stop, [field]: val } : stop)),
    );
  };

  // Preview seat grid
  const previewSeats = () => {
    const rows = Array.from({ length: layout.rows }, (_, r) => r + 1);
    const cols = Array.from({ length: layout.cols }, (_, c) => c);
    let num = 1;
    return rows.map((row) => ({
      row,
      seats: cols.map((col) => {
        if (col === layout.aisle_col) return { aisle: true };
        return { num: String(num++).padStart(2, "0"), col };
      }),
    }));
  };

  const handleSubmit = async () => {
    // Validate
    if (
      !busInfo.reg_number ||
      !busInfo.bus_type ||
      !busInfo.route_number ||
      !busInfo.route_name ||
      !busInfo.departure_time ||
      !busInfo.arrival_time
    ) {
      toast.error("Please fill all bus info fields.");
      return;
    }
    if (
      stops.some(
        (s) => !s.stop_name || !s.estimated_time || !s.distance_from_start_km,
      )
    ) {
      toast.error("Please fill all stop details.");
      return;
    }
    if (!pricing.price_per_km || !pricing.min_fare || !pricing.max_fare) {
      toast.error("Please fill all pricing fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/buses", {
        ...busInfo,
        ...pricing,
        stops: stops.map((s, i) => ({ ...s, stop_order: i + 1 })),
        layout: { ...layout },
      });
      setCreated(res.data);
      setStep(5); // success
      toast.success("Bus added successfully! 🚌");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add bus.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 5)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bus added! 🚌
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Your bus <strong>{busInfo.reg_number}</strong> is now live on
              SmartRoute LK. Passengers can search and book seats immediately.
            </p>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-left mb-6 space-y-2">
              {[
                `Registration: ${busInfo.reg_number}`,
                `Route: ${busInfo.route_name}`,
                `Stops: ${stops.length}`,
                `Seats: ${layout.rows * (layout.cols - 1)} (${layout.rows} rows)`,
                `Price: ${pricing.price_per_km} LKR/km`,
              ].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <CheckCircle size={12} className="text-brand-500 flex-none" />{" "}
                  {s}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setBusInfo({
                    reg_number: "",
                    bus_type: "",
                    route_number: "",
                    route_name: "",
                    departure_time: "",
                    arrival_time: "",
                    operating_days: [
                      "mon",
                      "tue",
                      "wed",
                      "thu",
                      "fri",
                      "sat",
                      "sun",
                    ],
                    has_ac: false,
                    has_wifi: false,
                    has_water: false,
                  });
                  setStops([
                    {
                      stop_name: "",
                      estimated_time: "",
                      distance_from_start_km: "",
                    },
                    {
                      stop_name: "",
                      estimated_time: "",
                      distance_from_start_km: "",
                    },
                  ]);
                  setPricing({
                    price_per_km: "",
                    min_fare: "",
                    max_fare: "",
                    refund_pct_before: 100,
                    refund_hours_threshold: 24,
                    refund_pct_within: 50,
                  });
                  setCreated(null);
                }}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                Add another bus
              </button>
              <button
                onClick={() => navigate("/owner")}
                className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const stepLabels = ["Bus info", "Stops", "Seat layout", "Pricing"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() =>
                step === 1 ? navigate("/owner") : setStep((s) => s - 1)
              }
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Add New Bus</h1>
              <p className="text-xs text-gray-400">
                Step {step} of 4 — {stepLabels[step - 1]}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 <= step ? "bg-brand-500" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`text-xs mt-1 font-semibold ${
                    i + 1 === step ? "text-brand-500" : "text-gray-400"
                  }`}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 w-full flex-1">
        {/* ── STEP 1: Bus Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bus size={16} className="text-brand-500" /> Basic Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Registration number{" "}
                    <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="NB-1234"
                    value={busInfo.reg_number}
                    onChange={(e) =>
                      setBusInfo((b) => ({
                        ...b,
                        reg_number: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Bus type <span className="text-brand-500">*</span>
                  </label>
                  <select
                    value={busInfo.bus_type}
                    onChange={(e) =>
                      setBusInfo((b) => ({ ...b, bus_type: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 text-gray-600"
                  >
                    <option value="">Select type</option>
                    {BUS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} — {t.desc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Route number <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="48/1"
                    value={busInfo.route_number}
                    onChange={(e) =>
                      setBusInfo((b) => ({
                        ...b,
                        route_number: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Route name <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Colombo - Kandy"
                    value={busInfo.route_name}
                    onChange={(e) =>
                      setBusInfo((b) => ({ ...b, route_name: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Departure time <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={busInfo.departure_time}
                    onChange={(e) =>
                      setBusInfo((b) => ({
                        ...b,
                        departure_time: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Arrival time <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={busInfo.arrival_time}
                    onChange={(e) =>
                      setBusInfo((b) => ({
                        ...b,
                        arrival_time: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 text-gray-600"
                  />
                </div>
              </div>

              {/* Operating days */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Operating days <span className="text-brand-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        busInfo.operating_days.includes(day)
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setBusInfo((b) => ({
                        ...b,
                        operating_days:
                          b.operating_days.length === 7 ? [] : [...DAYS],
                      }))
                    }
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-brand-500 border border-gray-200 hover:border-brand-300 transition-all"
                  >
                    {busInfo.operating_days.length === 7
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Amenities
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { key: "has_ac", label: "❄️ AC" },
                    { key: "has_wifi", label: "📶 WiFi" },
                    { key: "has_water", label: "💧 Water" },
                  ].map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() =>
                        setBusInfo((b) => ({ ...b, [a.key]: !b[a.key] }))
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        busInfo[a.key]
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (
                  !busInfo.reg_number ||
                  !busInfo.bus_type ||
                  !busInfo.route_number ||
                  !busInfo.route_name ||
                  !busInfo.departure_time ||
                  !busInfo.arrival_time
                ) {
                  toast.error("Please fill all required fields.");
                  return;
                }
                if (busInfo.operating_days.length === 0) {
                  toast.error("Select at least one operating day.");
                  return;
                }
                setStep(2);
              }}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
            >
              Continue to stops <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Stops ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-brand-500" /> Route Stops
                </h2>
                <span className="text-xs text-gray-400">
                  {stops.length} stops
                </span>
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mb-4 text-xs text-brand-600">
                ℹ️ First stop = origin (distance 0). Last stop = final
                destination. Add all intermediate stops in order.
              </div>

              <div className="space-y-3">
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Stop number */}
                    <div className="flex flex-col items-center flex-none pt-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? "bg-brand-500 text-white"
                            : idx === stops.length - 1
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < stops.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200 mt-1" />
                      )}
                    </div>

                    {/* Stop fields */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder={
                            idx === 0
                              ? "Origin stop name"
                              : idx === stops.length - 1
                                ? "Final destination"
                                : "Stop name"
                          }
                          value={stop.stop_name}
                          onChange={(e) =>
                            updateStop(idx, "stop_name", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          value={stop.estimated_time}
                          onChange={(e) =>
                            updateStop(idx, "estimated_time", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors text-gray-600"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            placeholder="0"
                            value={stop.distance_from_start_km}
                            onChange={(e) =>
                              updateStop(
                                idx,
                                "distance_from_start_km",
                                e.target.value,
                              )
                            }
                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:border-brand-500 transition-colors"
                            min="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            km
                          </span>
                        </div>
                        {stops.length > 2 && (
                          <button
                            onClick={() => removeStop(idx)}
                            className="w-9 h-9 flex items-center justify-center border-2 border-red-100 text-red-400 rounded-xl hover:bg-red-50 transition-colors flex-none"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addStop}
                className="mt-4 w-full border-2 border-dashed border-gray-200 text-gray-500 py-3 rounded-xl text-sm font-semibold hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add stop
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (
                    stops.some(
                      (s) =>
                        !s.stop_name ||
                        !s.estimated_time ||
                        !s.distance_from_start_km,
                    )
                  ) {
                    toast.error("Please fill all stop details.");
                    return;
                  }
                  setStep(3);
                }}
                className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue to seat layout <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Seat Layout ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                💺 Seat Layout
              </h2>

              {/* Layout controls */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Rows", field: "rows", min: 5, max: 20 },
                  { label: "Cols", field: "cols", min: 3, max: 6 },
                  {
                    label: "Aisle col",
                    field: "aisle_col",
                    min: 1,
                    max: layout.cols - 2,
                  },
                ].map((c) => (
                  <div key={c.field}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {c.label}
                    </label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-brand-500">
                      <button
                        onClick={() =>
                          setLayout((l) => ({
                            ...l,
                            [c.field]: Math.max(c.min, l[c.field] - 1),
                          }))
                        }
                        className="px-3 py-2.5 text-gray-500 hover:text-brand-500 font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-bold">
                        {layout[c.field]}
                      </span>
                      <button
                        onClick={() =>
                          setLayout((l) => ({
                            ...l,
                            [c.field]: Math.min(c.max, l[c.field] + 1),
                          }))
                        }
                        className="px-3 py-2.5 text-gray-500 hover:text-brand-500 font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
                <span className="bg-brand-50 text-brand-500 px-2 py-1 rounded-lg font-semibold">
                  {layout.rows * (layout.cols - 1)} seats total
                </span>
                <span>
                  ({layout.rows} rows × {layout.cols - 1} seats + aisle)
                </span>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                <div className="text-xs font-bold text-gray-400 text-center mb-3 uppercase tracking-widest">
                  🚌 Preview
                </div>
                <div className="flex justify-center">
                  <div className="inline-block border-2 border-gray-200 rounded-2xl p-3 bg-white">
                    {/* Driver + door */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-9 h-9 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        <span className="text-xs text-gray-400 font-bold">
                          DRV
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                        <span className="text-sm">🚪</span>
                        <span className="text-xs text-green-600 font-semibold">
                          Entry
                        </span>
                      </div>
                    </div>

                    {previewSeats().map(({ row, seats }) => (
                      <div key={row} className="flex gap-1.5 mb-1 items-center">
                        <span className="text-xs text-gray-300 w-3 text-right">
                          {row}
                        </span>
                        {seats.map((s, ci) =>
                          s.aisle ? (
                            <div
                              key={ci}
                              className="w-4 flex items-center justify-center"
                            >
                              <div className="w-px h-8 border-l-2 border-dashed border-gray-200" />
                            </div>
                          ) : (
                            <div
                              key={ci}
                              className="w-9 h-9 rounded-lg bg-green-100 border-2 border-green-300 flex items-center justify-center text-xs font-bold text-green-700"
                            >
                              {s.num}
                            </div>
                          ),
                        )}
                        <div className="w-1 h-9 bg-gray-200 rounded-r-full" />
                      </div>
                    ))}

                    <div className="flex items-center gap-1 mt-2 px-2 py-1 border-2 border-dashed border-green-300 rounded-lg bg-green-50 w-fit">
                      <span className="text-sm">🚪</span>
                      <span className="text-xs text-green-600 font-semibold">
                        Exit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue to pricing <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Pricing ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-brand-500" /> Pricing &
                Refund Policy
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Price per km (LKR) <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="3.50"
                    value={pricing.price_per_km}
                    onChange={(e) =>
                      setPricing((p) => ({
                        ...p,
                        price_per_km: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    step="0.50"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Minimum fare (LKR) <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={pricing.min_fare}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, min_fare: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Maximum fare (LKR) <span className="text-brand-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={pricing.max_fare}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, max_fare: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Fare preview */}
              {pricing.price_per_km &&
                stops.length >= 2 &&
                stops[stops.length - 1].distance_from_start_km && (
                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
                    <div className="text-xs font-bold text-brand-500 mb-2">
                      Fare preview for your route
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {stops.slice(1).map((stop, i) => {
                        const dist =
                          parseFloat(stop.distance_from_start_km) || 0;
                        const fare = Math.min(
                          Math.max(
                            Math.round(dist * parseFloat(pricing.price_per_km)),
                            parseFloat(pricing.min_fare) || 0,
                          ),
                          parseFloat(pricing.max_fare) || 9999,
                        );
                        return (
                          <div key={i} className="text-xs">
                            <div className="text-gray-500">
                              {stops[0].stop_name || "Origin"} →{" "}
                              {stop.stop_name || `Stop ${i + 2}`}
                            </div>
                            <div className="font-bold text-gray-900">
                              {fare.toLocaleString()} LKR
                            </div>
                            <div className="text-gray-400">{dist} km</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Refund policy */}
              <div>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                  Refund policy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Full refund if cancelled before (hours)
                    </label>
                    <input
                      type="number"
                      value={pricing.refund_hours_threshold}
                      onChange={(e) =>
                        setPricing((p) => ({
                          ...p,
                          refund_hours_threshold: e.target.value,
                        }))
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                      min="1"
                      max="72"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Refund % before threshold
                    </label>
                    <input
                      type="number"
                      value={pricing.refund_pct_before}
                      onChange={(e) =>
                        setPricing((p) => ({
                          ...p,
                          refund_pct_before: e.target.value,
                        }))
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Refund % within threshold
                    </label>
                    <input
                      type="number"
                      value={pricing.refund_pct_within}
                      onChange={(e) =>
                        setPricing((p) => ({
                          ...p,
                          refund_pct_within: e.target.value,
                        }))
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Example: Cancel {pricing.refund_hours_threshold}h before →{" "}
                  {pricing.refund_pct_before}% refund. Cancel within{" "}
                  {pricing.refund_hours_threshold}h →{" "}
                  {pricing.refund_pct_within}% refund.
                </p>
              </div>
            </div>

            {/* Summary before submit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Summary before submission
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {[
                  { label: "Bus", value: busInfo.reg_number },
                  { label: "Route", value: busInfo.route_name },
                  { label: "Stops", value: `${stops.length} stops` },
                  {
                    label: "Seats",
                    value: `${layout.rows * (layout.cols - 1)} seats`,
                  },
                  {
                    label: "Type",
                    value: BUS_TYPES.find((t) => t.value === busInfo.bus_type)
                      ?.label,
                  },
                  {
                    label: "Days",
                    value:
                      busInfo.operating_days.length === 7
                        ? "Every day"
                        : busInfo.operating_days
                            .map((d) => DAY_LABELS[d])
                            .join(", "),
                  },
                  { label: "Price", value: `${pricing.price_per_km} LKR/km` },
                  {
                    label: "Fare",
                    value: `${pricing.min_fare}–${pricing.max_fare} LKR`,
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-gray-400">{s.label}</div>
                    <div className="font-bold text-gray-900 mt-0.5 truncate">
                      {s.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Adding bus...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Add this bus
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
