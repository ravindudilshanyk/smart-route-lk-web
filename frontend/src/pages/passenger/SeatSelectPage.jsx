import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { busAPI, bookingAPI } from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Plus,
  Minus,
  Info,
  Clock,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function SeatSelectPage() {
  const { busId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const result = state?.result;
  const date = state?.date;
  const origin = state?.origin;
  const destination = state?.destination;
  const leg = result?.legs?.[0];

  const [busData, setBusData] = useState(null);
  const [seatAvailability, setSeatAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([
    { name: "", nic: "", gender: "", seat_id: null, seat_number: null },
  ]);
  const [step, setStep] = useState(1); // 1=seats, 2=details, 3=payment
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!busId || !leg) {
      navigate("/");
      return;
    }
    fetchBusData();
  }, [busId]);

  const fetchBusData = async () => {
    setLoading(true);
    try {
      const res = await busAPI.getBusById(busId);
      setBusData(res.data);

      // Fetch seat availability for this date and segment
      const availRes = await api.get(`/seats/availability`, {
        params: {
          bus_id: busId,
          travel_date: date,
          board_stop_order: leg.board_stop_order || 1,
          drop_stop_order: leg.drop_stop_order || 99,
        },
      });
      setSeatAvailability(availRes.data.availability || {});
    } catch (err) {
      toast.error("Failed to load bus details.");
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seat) => {
    const info = seatAvailability[seat.id];
    if (!info) return "available";
    if (info.fully_booked) return "booked";
    if (info.partially_booked) return "partial";
    return "available";
  };

  const getSeatTooltip = (seat) => {
    const info = seatAvailability[seat.id];
    if (!info) return null;
    if (info.fully_booked) return `Fully booked for your journey`;
    if (info.partially_booked)
      return `Partially booked — available for your segment (${origin} → ${destination})`;
    return null;
  };

  const handleSeatClick = (seat) => {
    const status = getSeatStatus(seat);
    if (status === "booked") return;

    const isSelected = selectedSeats.find((s) => s.id === seat.id);

    if (isSelected) {
      // Deselect
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
      setPassengers((prev) =>
        prev.map((p) =>
          p.seat_id === seat.id
            ? { ...p, seat_id: null, seat_number: null }
            : p,
        ),
      );
    } else {
      // Select — assign to first unassigned passenger
      const unassigned = passengers.findIndex((p) => !p.seat_id);
      if (unassigned === -1) {
        toast.error("Add more passengers first before selecting more seats.");
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
      setPassengers((prev) =>
        prev.map((p, i) =>
          i === unassigned
            ? { ...p, seat_id: seat.id, seat_number: seat.seat_number }
            : p,
        ),
      );
    }
  };

  const addPassenger = () => {
    if (passengers.length >= 6) {
      toast.error("Maximum 6 passengers per booking.");
      return;
    }
    setPassengers((prev) => [
      ...prev,
      { name: "", nic: "", gender: "", seat_id: null, seat_number: null },
    ]);
  };

  const removePassenger = (idx) => {
    if (passengers.length === 1) return;
    const removed = passengers[idx];
    if (removed.seat_id) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== removed.seat_id));
    }
    setPassengers((prev) => prev.filter((_, i) => i !== idx));
  };

  const farePerSeat = leg?.fare || 0;
  const serviceFee = Math.round(
    farePerSeat * passengers.length * (result?.transfers > 0 ? 0.08 : 0.05),
  );
  const totalFare = farePerSeat * passengers.length;
  const totalPayable = totalFare + serviceFee;

  const handleProceed = () => {
    if (selectedSeats.length !== passengers.length) {
      toast.error("Please select a seat for every passenger.");
      return;
    }
    const allFilled = passengers.every((p) => p.name && p.gender);
    if (!allFilled) {
      toast.error("Please fill in name and gender for all passengers.");
      return;
    }
    setStep(3);
  };

  const handleBooking = async () => {
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        bus_id: busId,
        travel_date: date,
        board_stop_id: leg.board_stop_id,
        drop_stop_id: leg.drop_stop_id,
        whatsapp_number: passengers[0].whatsapp || "",
        payment_method: "card",
        is_connecting: (result?.transfers || 0) > 0,
        passengers: passengers.map((p) => ({
          passenger_name: p.name,
          nic: p.nic || null,
          gender: p.gender,
          seat_id: p.seat_id,
        })),
      });

      toast.success("Booking confirmed! QR ticket sent to WhatsApp 🎉");
      navigate(`/bookings/${res.data.booking_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const layout = busData?.layout;
  const seats = busData?.seats || [];
  const rows = layout
    ? Array.from({ length: layout.rows }, (_, i) => i + 1)
    : [];
  const cols = layout ? Array.from({ length: layout.cols }, (_, i) => i) : [];
  const aisleCol = layout?.aisle_col ?? 2;

  const seatAt = (row, col) =>
    seats.find((s) => s.row_index === row && s.col_index === col);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading seat map...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* ── Journey header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin size={14} className="text-brand-500" />
              {leg?.board_stop_name}
              <ArrowRight size={14} className="text-brand-500" />
              {leg?.drop_stop_name}
            </div>
            <span className="text-gray-400 text-xs">·</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {leg?.board_time?.substring(0, 5)} →{" "}
              {leg?.drop_time?.substring(0, 5)}
            </div>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-xs text-gray-500">{date}</span>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-xs font-semibold text-brand-500">
              {busData?.bus?.reg_number}
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mt-3">
            {["Select seats", "Passenger details", "Payment"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                    step === i + 1
                      ? "bg-brand-500 text-white"
                      : step > i + 1
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span>{step > i + 1 ? "✓" : i + 1}</span>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Seat map ── */}
          <div className="flex-1">
            {/* Legend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="text-xs font-semibold text-gray-500 mb-3">
                Know your seat types
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  {
                    color: "bg-green-100 border-green-300 text-green-700",
                    label: "Available",
                  },
                  {
                    color: "bg-red-100 border-red-300 text-red-700",
                    label: "Fully booked",
                  },
                  {
                    color: "bg-yellow-100 border-yellow-300 text-yellow-700",
                    label: "Partial — hover for details",
                  },
                  {
                    color: "bg-brand-500 border-brand-500 text-white",
                    label: "Your selection",
                  },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${l.color}`}
                    >
                      01
                    </div>
                    <span className="text-xs text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bus layout */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 text-center mb-4 uppercase tracking-wider">
                Front of bus
              </div>

              {/* Driver row */}
              <div className="flex justify-end mb-3 pr-1">
                <div className="w-10 h-10 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 font-semibold">
                  DRV
                </div>
              </div>

              {/* Seat grid */}
              <div className="overflow-x-auto">
                <div className="inline-block">
                  {rows.map((row) => (
                    <div key={row} className="flex gap-1.5 mb-1.5">
                      {cols.map((col) => {
                        if (col === aisleCol) {
                          return <div key={col} className="w-8" />;
                        }
                        const seat = seatAt(row, col);
                        if (!seat || !seat.is_active) {
                          return <div key={col} className="w-10 h-10" />;
                        }
                        const status = getSeatStatus(seat);
                        const isSelected = selectedSeats.find(
                          (s) => s.id === seat.id,
                        );
                        const tooltip = getSeatTooltip(seat);

                        return (
                          <div key={col} className="relative group">
                            <button
                              onClick={() => handleSeatClick(seat)}
                              disabled={status === "booked"}
                              className={`w-10 h-10 rounded-xl border-2 text-xs font-bold transition-all ${
                                isSelected
                                  ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-200"
                                  : status === "booked"
                                    ? "bg-red-100 border-red-300 text-red-700 cursor-not-allowed"
                                    : status === "partial"
                                      ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:border-yellow-400"
                                      : "bg-green-100 border-green-300 text-green-700 hover:border-green-500 hover:shadow-sm"
                              }`}
                            >
                              {seat.seat_number}
                            </button>

                            {/* Tooltip */}
                            {tooltip && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg">
                                {tooltip}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs font-semibold text-gray-400 text-center mt-4 uppercase tracking-wider">
                Back of bus
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:w-80 flex-none space-y-4">
            {/* Passengers */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-gray-900">Passengers</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removePassenger(passengers.length - 1)}
                    disabled={passengers.length === 1}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 transition-colors disabled:opacity-40"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {passengers.length}
                  </span>
                  <button
                    onClick={addPassenger}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {passengers.map((p, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">
                        Passenger {idx + 1}
                        {idx === 0 && " (You)"}
                      </span>
                      <div className="flex items-center gap-2">
                        {p.seat_number && (
                          <span className="bg-brand-50 text-brand-500 text-xs font-bold px-2 py-0.5 rounded-full">
                            Seat {p.seat_number}
                          </span>
                        )}
                        {idx > 0 && (
                          <button
                            onClick={() => removePassenger(idx)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Full name *"
                      value={p.name}
                      onChange={(e) =>
                        setPassengers((prev) =>
                          prev.map((pp, i) =>
                            i === idx ? { ...pp, name: e.target.value } : pp,
                          ),
                        )
                      }
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-brand-500 mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={p.gender}
                        onChange={(e) =>
                          setPassengers((prev) =>
                            prev.map((pp, i) =>
                              i === idx
                                ? { ...pp, gender: e.target.value }
                                : pp,
                            ),
                          )
                        }
                        className="border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-brand-500 text-gray-600"
                      >
                        <option value="">Gender *</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="NIC (optional)"
                        value={p.nic}
                        onChange={(e) =>
                          setPassengers((prev) =>
                            prev.map((pp, i) =>
                              i === idx ? { ...pp, nic: e.target.value } : pp,
                            ),
                          )
                        }
                        className="border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {!p.seat_number && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <Info size={11} /> Select a seat from the map
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* WhatsApp for tickets */}
              <div className="mt-3 border-t border-gray-50 pt-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  WhatsApp for tickets *
                </label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={passengers[0].whatsapp || ""}
                  onChange={(e) =>
                    setPassengers((prev) =>
                      prev.map((pp, i) =>
                        i === 0 ? { ...pp, whatsapp: e.target.value } : pp,
                      ),
                    )
                  }
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  QR tickets sent here after payment
                </p>
              </div>
            </div>

            {/* Fare breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-gray-900 mb-3">
                Fare breakdown
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Fare × {passengers.length} seat
                    {passengers.length > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold">
                    {totalFare.toLocaleString()} LKR
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    Service fee ({result?.transfers > 0 ? "8" : "5"}%)
                    <Info size={11} className="text-gray-400" />
                  </span>
                  <span className="font-semibold">
                    {serviceFee.toLocaleString()} LKR
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total payable</span>
                  <span className="font-extrabold text-brand-500 text-base">
                    {totalPayable.toLocaleString()} LKR
                  </span>
                </div>
              </div>

              <div className="mt-3 bg-brand-50 rounded-xl p-3 text-xs text-gray-500 flex items-start gap-2">
                <Info size={12} className="text-brand-500 flex-none mt-0.5" />
                <span>
                  You pay for your full route{" "}
                  <strong className="text-gray-700">
                    {origin} → {destination}
                  </strong>
                  , not just the seat segment. Seats may be shared for different
                  route sections.
                </span>
              </div>
            </div>

            {/* Confirm button */}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={selectedSeats.length === 0}
                className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue to details
                <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceed}
                className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue to payment
                <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard size={15} className="text-brand-500" /> Payment
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500 mb-3">
                    💳 Secure online payment only
                    <div className="text-xs text-gray-400 mt-1">
                      Card payments accepted · Safe & encrypted
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 mb-4">
                    <span>Total to pay</span>
                    <span className="text-brand-500">
                      {totalPayable.toLocaleString()} LKR
                    </span>
                  </div>
                  <button
                    onClick={handleBooking}
                    disabled={submitting}
                    className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} /> Pay & Confirm Booking
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    QR ticket sent to WhatsApp after payment
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full text-gray-500 text-sm py-2 hover:text-brand-500 transition-colors"
                >
                  ← Back to passenger details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
