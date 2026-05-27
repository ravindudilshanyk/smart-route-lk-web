import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { busAPI } from "../../services/api";
import api from "../../services/api";
import {
  ArrowRight,
  Clock,
  MapPin,
  Star,
  Wind,
  Wifi,
  Droplets,
  Users,
  Phone,
  Shield,
  ChevronRight,
  Bus,
  Calendar,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const busTypeLabel = {
  ctb: "CTB",
  private_normal: "Non-AC",
  private_ac: "AC",
  semi_luxury: "Semi-Luxury",
  luxury: "Luxury",
  highway_normal: "Highway",
  highway_luxury: "Luxury Highway",
};

export default function BusDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchBus();
  }, [id]);

  const fetchBus = async () => {
    setLoading(true);
    try {
      const [busRes, reviewRes] = await Promise.all([
        busAPI.getBusById(id),
        api
          .get(`/buses/${id}/reviews`)
          .catch(() => ({ data: { reviews: [] } })),
      ]);
      setData(busRes.data);
      setReviews(reviewRes.data.reviews || []);
    } catch {
      toast.error("Failed to load bus details.");
    } finally {
      setLoading(false);
    }
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

  if (!data)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Bus not found
        </div>
      </div>
    );

  const bus = data.bus;
  const stops = data.stops || [];
  const layout = data.layout;
  const seats = data.seats || [];
  const totalSeats = seats.length;

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              {/* Reg + type */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {bus.reg_number}
                </h1>
                <span className="bg-brand-50 text-brand-500 text-sm font-bold px-3 py-1 rounded-full">
                  {busTypeLabel[bus.bus_type] || bus.bus_type}
                </span>
                {bus.has_ac && (
                  <span className="bg-blue-50 text-blue-500 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Wind size={11} /> AC
                  </span>
                )}
                {bus.has_wifi && (
                  <span className="bg-green-50 text-green-500 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Wifi size={11} /> WiFi
                  </span>
                )}
                {bus.has_water && (
                  <span className="bg-cyan-50 text-cyan-500 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Droplets size={11} /> Water
                  </span>
                )}
              </div>

              <div className="text-gray-500 text-sm mb-1">
                Route {bus.route_number} · {bus.route_name}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                <Clock size={13} className="text-brand-500" />
                <span className="font-bold">
                  {bus.departure_time?.substring(0, 5)}
                </span>
                <ArrowRight size={13} className="text-brand-500" />
                <span className="font-bold">
                  {bus.arrival_time?.substring(0, 5)}
                </span>
              </div>

              {/* Operating days */}
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d) => (
                  <span
                    key={d}
                    className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                      bus.operating_days?.includes(d)
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - fare + book */}
            <div className="flex-none">
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-center min-w-44">
                <div className="text-xs text-gray-500 mb-1">Fare from</div>
                <div className="text-3xl font-extrabold text-brand-500">
                  {parseInt(bus.min_fare).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mb-1">LKR per seat</div>
                <div className="text-xs text-gray-400 mb-4">
                  up to {parseInt(bus.max_fare).toLocaleString()} LKR
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={13} className="text-gray-400 flex-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 text-xs outline-none text-gray-600 bg-transparent"
                  />
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/results?origin=${stops[0]?.stop_name}&destination=${stops[stops.length - 1]?.stop_name}&date=${date}`,
                    )
                  }
                  className="w-full bg-brand-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
                >
                  Book now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left */}
          <div className="flex-1 space-y-5">
            {/* Route stops */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-brand-500" /> Route & Stops
              </h2>
              <div className="space-y-0">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-none">
                      <div
                        className={`w-3 h-3 rounded-full border-2 flex-none mt-1 ${
                          i === 0
                            ? "bg-brand-500 border-brand-500"
                            : i === stops.length - 1
                              ? "bg-gray-700 border-gray-700"
                              : "bg-white border-gray-300"
                        }`}
                      />
                      {i < stops.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-0.5" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            i === 0 || i === stops.length - 1
                              ? "text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {stop.stop_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {stop.estimated_time?.substring(0, 5)}
                        </span>
                      </div>
                      {stop.distance_from_start_km > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {stop.distance_from_start_km} km from origin ·{" "}
                          <span className="text-brand-500 font-semibold">
                            ~
                            {Math.min(
                              Math.max(
                                Math.round(
                                  stop.distance_from_start_km *
                                    parseFloat(bus.price_per_km),
                                ),
                                parseInt(bus.min_fare),
                              ),
                              parseInt(bus.max_fare),
                            ).toLocaleString()}{" "}
                            LKR
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seat layout preview */}
            {layout && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  💺 Seat Layout
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  {totalSeats} seats · {layout.rows} rows · Aisle at column{" "}
                  {layout.aisle_col + 1}
                </p>
                <div className="flex justify-center overflow-x-auto">
                  <div className="border-2 border-gray-200 rounded-2xl p-4 bg-gray-50 inline-block">
                    {/* Driver */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-9 h-9 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center">
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
                    {/* Rows */}
                    {Array.from({ length: layout.rows }, (_, r) => r + 1).map(
                      (row) => (
                        <div
                          key={row}
                          className="flex gap-1.5 mb-1.5 items-center"
                        >
                          <span className="text-xs text-gray-300 w-3 text-right">
                            {row}
                          </span>
                          {Array.from({ length: layout.cols }, (_, c) => c).map(
                            (col) => {
                              if (col === layout.aisle_col)
                                return (
                                  <div
                                    key={col}
                                    className="w-4 flex items-center justify-center"
                                  >
                                    <div className="w-px h-8 border-l-2 border-dashed border-gray-200" />
                                  </div>
                                );
                              const seat = seats.find(
                                (s) =>
                                  s.row_index === row && s.col_index === col,
                              );
                              if (!seat)
                                return <div key={col} className="w-9 h-9" />;
                              return (
                                <div
                                  key={col}
                                  className="w-9 h-9 rounded-lg bg-green-100 border-2 border-green-300 flex items-center justify-center text-xs font-bold text-green-700"
                                >
                                  {seat.seat_number}
                                </div>
                              );
                            },
                          )}
                          <div className="w-1 h-9 bg-gray-200 rounded-r-full" />
                        </div>
                      ),
                    )}
                    <div className="flex items-center gap-1 mt-2 px-2 py-1 border-2 border-dashed border-green-300 rounded-lg bg-green-50 w-fit">
                      <span className="text-sm">🚪</span>
                      <span className="text-xs text-green-600 font-semibold">
                        Exit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={15} className="text-amber-500" /> Reviews
                {reviews.length > 0 && (
                  <span className="bg-amber-50 text-amber-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {(
                      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                    ).toFixed(1)}{" "}
                    ★
                  </span>
                )}
              </h2>
              {reviews.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  No reviews yet - be the first to review after your trip!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.reviewer_name}
                        </span>
                        <span className="text-xs text-amber-500 font-bold">
                          {"★".repeat(r.rating)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.comment}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {r.created_at?.substring(0, 10)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:w-72 flex-none space-y-4">
            {/* Bus info summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                Bus details
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: "Registration", value: bus.reg_number },
                  {
                    label: "Type",
                    value: busTypeLabel[bus.bus_type] || bus.bus_type,
                  },
                  { label: "Route no.", value: bus.route_number },
                  { label: "Total seats", value: `${totalSeats} seats` },
                  {
                    label: "Departure",
                    value: bus.departure_time?.substring(0, 5),
                  },
                  {
                    label: "Arrival",
                    value: bus.arrival_time?.substring(0, 5),
                  },
                  {
                    label: "Price/km",
                    value: `${parseFloat(bus.price_per_km).toFixed(2)} LKR`,
                  },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between">
                    <span className="text-gray-400">{f.label}</span>
                    <span className="font-semibold text-gray-900">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund policy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <Shield size={14} className="text-brand-500" /> Refund policy
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={12}
                    className="text-green-500 flex-none mt-0.5"
                  />
                  <span>
                    Cancel {bus.refund_hours_threshold}h before departure -{" "}
                    <strong>{bus.refund_pct_before}% refund</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={12}
                    className="text-amber-500 flex-none mt-0.5"
                  />
                  <span>
                    Cancel within {bus.refund_hours_threshold}h -{" "}
                    <strong>{bus.refund_pct_within}% refund</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Contact - shown after booking note */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-brand-500 flex-none mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Owner contact
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    Owner contact details are included in your PDF ticket after
                    booking for passenger support.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
