import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import { busAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  MapPin,
  DollarSign,
  Clock,
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

export default function EditBusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busInfo, setBusInfo] = useState(null);
  const [stops, setStops] = useState([]);
  const [pricing, setPricing] = useState({});

  useEffect(() => {
    fetchBus();
  }, [id]);

  const fetchBus = async () => {
    setLoading(true);
    try {
      const res = await busAPI.getBusById(id);
      const bus = res.data.bus;
      setBusInfo({
        reg_number: bus.reg_number,
        bus_type: bus.bus_type,
        route_number: bus.route_number,
        route_name: bus.route_name,
        departure_time: bus.departure_time?.substring(0, 5),
        arrival_time: bus.arrival_time?.substring(0, 5),
        operating_days: bus.operating_days || [],
        has_ac: bus.has_ac,
        has_wifi: bus.has_wifi,
        has_water: bus.has_water,
        status: bus.status,
      });
      setStops(res.data.stops || []);
      setPricing({
        price_per_km: bus.price_per_km,
        min_fare: bus.min_fare,
        max_fare: bus.max_fare,
        refund_pct_before: bus.refund_pct_before,
        refund_hours_threshold: bus.refund_hours_threshold,
        refund_pct_within: bus.refund_pct_within,
      });
    } catch {
      toast.error("Failed to load bus.");
    } finally {
      setLoading(false);
    }
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      await api.patch(`/buses/${id}`, busInfo);
      toast.success("Bus info updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const saveStops = async () => {
    setSaving(true);
    try {
      await api.put(`/buses/${id}/stops`, { stops });
      toast.success("Stops updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      await api.patch(`/buses/${id}/pricing`, pricing);
      toast.success("Pricing updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const addStop = () => {
    setStops((s) => [
      ...s,
      {
        stop_name: "",
        estimated_time: "",
        distance_from_start_km: "",
        stop_order: s.length + 1,
      },
    ]);
  };

  const removeStop = (idx) => {
    if (stops.length <= 2) {
      toast.error("Minimum 2 stops.");
      return;
    }
    setStops((s) =>
      s
        .filter((_, i) => i !== idx)
        .map((st, i) => ({ ...st, stop_order: i + 1 })),
    );
  };

  const updateStop = (idx, field, val) => {
    setStops((s) =>
      s.map((st, i) => (i === idx ? { ...st, [field]: val } : st)),
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  const TABS = [
    { key: "info", label: "Bus Info", icon: <Clock size={14} /> },
    { key: "stops", label: "Stops", icon: <MapPin size={14} /> },
    { key: "pricing", label: "Pricing", icon: <DollarSign size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/owner")}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">
                Edit Bus - {busInfo?.reg_number}
              </h1>
              <p className="text-xs text-gray-400">{busInfo?.route_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tab === t.key
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 w-full flex-1">
        {/* ── Bus Info ── */}
        {tab === "info" && busInfo && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Route number
                  </label>
                  <input
                    type="text"
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
                    Route name
                  </label>
                  <input
                    type="text"
                    value={busInfo.route_name}
                    onChange={(e) =>
                      setBusInfo((b) => ({ ...b, route_name: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Departure time
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
                    Arrival time
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
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Operating days
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setBusInfo((b) => ({
                          ...b,
                          operating_days: b.operating_days.includes(day)
                            ? b.operating_days.filter((d) => d !== day)
                            : [...b.operating_days, day],
                        }))
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        busInfo.operating_days?.includes(day)
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-4">
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
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Bus status
                </label>
                <div className="flex gap-2">
                  {["active", "inactive", "maintenance"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setBusInfo((b) => ({ ...b, status: s }))}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        busInfo.status === s
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveInfo}
              disabled={saving}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}

        {/* ── Stops ── */}
        {tab === "stops" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mb-4 text-xs text-brand-600">
                ℹ️ First stop = origin (distance 0). Changes to stops affect
                future bookings only.
              </div>
              <div className="space-y-3">
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-start gap-3">
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
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={stop.stop_name}
                        onChange={(e) =>
                          updateStop(idx, "stop_name", e.target.value)
                        }
                        className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <input
                        type="time"
                        value={stop.estimated_time?.substring(0, 5) || ""}
                        onChange={(e) =>
                          updateStop(idx, "estimated_time", e.target.value)
                        }
                        className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 text-gray-600"
                      />
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
                            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none focus:border-brand-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            km
                          </span>
                        </div>
                        {stops.length > 2 && (
                          <button
                            onClick={() => removeStop(idx)}
                            className="w-9 h-9 flex items-center justify-center border-2 border-red-100 text-red-400 rounded-xl hover:bg-red-50 flex-none"
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
            <button
              onClick={saveStops}
              disabled={saving}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save stops"}
            </button>
          </div>
        )}

        {/* ── Pricing ── */}
        {tab === "pricing" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Price per km (LKR)
                  </label>
                  <input
                    type="number"
                    value={pricing.price_per_km}
                    onChange={(e) =>
                      setPricing((p) => ({
                        ...p,
                        price_per_km: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                    step="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Minimum fare (LKR)
                  </label>
                  <input
                    type="number"
                    value={pricing.min_fare}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, min_fare: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Maximum fare (LKR)
                  </label>
                  <input
                    type="number"
                    value={pricing.max_fare}
                    onChange={(e) =>
                      setPricing((p) => ({ ...p, max_fare: e.target.value }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <div className="text-xs font-bold text-gray-600 mb-3">
                  Refund policy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Full refund before (hours)
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={savePricing}
              disabled={saving}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save pricing"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
