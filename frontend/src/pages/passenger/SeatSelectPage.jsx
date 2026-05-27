import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { busAPI } from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Info,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Download,
} from "lucide-react";

export default function SeatSelectPage() {
  useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const result = state?.result;
  const date = state?.date;
  const origin = state?.origin;
  const destination = state?.destination;
  const legs = useMemo(() => result?.legs || [], [result]);

  const [currentLegIdx, setCurrentLegIdx] = useState(0);
  const [legSelections, setLegSelections] = useState(
    legs.map((leg) => ({
      leg,
      busData: null,
      availability: {},
      selectedSeats: [],
      payOnBus: false,
      loaded: false,
    })),
  );
  const [passengers, setPassengers] = useState([
    { name: "", gender: "", nic: "" },
  ]);
  const [whatsapp, setWhatsapp] = useState("");
  const [step, setStep] = useState("seats");
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [partialConfirm, setPartialConfirm] = useState(null);

  const leg = legs[currentLegIdx];
  const ls = legSelections[currentLegIdx];

  const loadLeg = useCallback(
    async (idx) => {
      if (!legs[idx]) return;
      const l = legs[idx];
      try {
        const [busRes, availRes] = await Promise.all([
          busAPI.getBusById(l.bus_id),
          api
            .get("/seats/availability", {
              params: {
                bus_id: l.bus_id,
                travel_date: date,
                board_stop_order: l.board_stop_order || 1,
                drop_stop_order: l.drop_stop_order || 99,
              },
            })
            .catch(() => ({ data: { availability: {} } })),
        ]);
        setLegSelections((prev) =>
          prev.map((item, i) =>
            i === idx
              ? {
                  ...item,
                  busData: busRes.data,
                  availability: availRes.data.availability || {},
                  loaded: true,
                }
              : item,
          ),
        );
      } catch {
        toast.error("Failed to load bus layout.");
      }
    },
    [date, legs],
  );

  useEffect(() => {
    if (!result || legs.length === 0) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => {
      void loadLeg(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [legs.length, loadLeg, navigate, result]);

  const getSeatStatus = (seat, availability) => {
    const info = availability?.[seat.id];
    if (!info) return "available";
    if (info.fully_booked) return "booked";
    if (info.partially_booked) return "partial";
    return "available";
  };

  const getSeatTooltip = (seat, availability) => {
    const info = availability?.[seat.id];
    if (!info || (!info.fully_booked && !info.partially_booked)) return null;
    if (info.fully_booked) return "Fully booked for your journey";
    return "Partially booked - your segment is available";
  };

  const handleSeatClick = (seat) => {
    const status = getSeatStatus(seat, ls.availability);
    if (status === "booked") return;

    const isSelected = ls.selectedSeats.find((s) => s.id === seat.id);
    if (isSelected) {
      setLegSelections((prev) =>
        prev.map((l, i) =>
          i === currentLegIdx
            ? {
                ...l,
                selectedSeats: l.selectedSeats.filter((s) => s.id !== seat.id),
              }
            : l,
        ),
      );
      setPassengers((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
      return;
    }

    if (status === "partial") {
      // Show modal instead of window.confirm
      setPartialConfirm({ seat, availInfo: ls.availability[seat.id] });
      return;
    }

    confirmSeatSelect(seat, false);
  };

  const confirmSeatSelect = (seat, isPartial) => {
    setPartialConfirm(null);
    setLegSelections((prev) =>
      prev.map((l, i) =>
        i === currentLegIdx
          ? {
              ...l,
              selectedSeats: [...l.selectedSeats, { ...seat, isPartial }],
            }
          : l,
      ),
    );
    setPassengers((prev) => {
      const newCount = ls.selectedSeats.length + 1;
      if (newCount > prev.length)
        return [...prev, { name: "", gender: "", nic: "" }];
      return prev;
    });
  };

  const togglePayOnBus = () => {
    setLegSelections((prev) =>
      prev.map((l, i) => {
        if (i !== currentLegIdx) return l;
        const turningOn = !l.payOnBus;
        return {
          ...l,
          payOnBus: turningOn,
          // Clear selected seats when pay-on-bus is turned ON
          selectedSeats: turningOn ? [] : l.selectedSeats,
        };
      }),
    );
    // Also reset passengers to 1 when turning on pay-on-bus
    if (!ls?.payOnBus) {
      setPassengers([{ name: "", gender: "", nic: "" }]);
    }
  };

  // Seats selected = can proceed. Pay-on-bus alone = can proceed too.
  const canProceed = () => {
    return ls?.payOnBus || ls?.selectedSeats.length > 0;
  };

  // Check if ALL legs are pay-on-bus (nothing to pay online)
  const allPayOnBus = legSelections.every(
    (ls) => ls.payOnBus && ls.selectedSeats.length === 0,
  );

  const handleNextLeg = async () => {
    if (!canProceed()) {
      toast.error("Please select a seat or choose pay on bus.");
      return;
    }
    // Only check gender if seats are selected
    if (ls.selectedSeats.length > 0) {
      const missingGender = passengers
        .slice(0, ls.selectedSeats.length)
        .some((p) => !p.gender);
      if (missingGender) {
        toast.error("Please select gender for all passengers.");
        return;
      }
    }
    if (currentLegIdx < legs.length - 1) {
      const next = currentLegIdx + 1;
      setCurrentLegIdx(next);
      await loadLeg(next);
    } else {
      // All legs done - check if anything to pay
      if (allPayOnBus) {
        // Nothing to pay online - go straight to success with empty bookings
        setBookingResult([]);
        setStep("success");
      } else {
        setStep("payment");
      }
    }
  };

  const removePassenger = (idx) => {
    if (passengers.length === 1) return;
    setLegSelections((prev) =>
      prev.map((l, i) =>
        i === currentLegIdx
          ? { ...l, selectedSeats: l.selectedSeats.slice(0, -1) }
          : l,
      ),
    );
    setPassengers((prev) => prev.filter((_, i) => i !== idx));
  };

  const onlineFare = legSelections.reduce(
    (sum, ls) => sum + ls.selectedSeats.length * (ls.leg?.fare || 0),
    0,
  );
  const servicePct = (result?.transfers || 0) > 0 ? 0.08 : 0.05;
  const serviceFee = Math.round(onlineFare * servicePct);
  const totalPayable = onlineFare + serviceFee;
  const cashLegs = legSelections.filter(
    (ls) => ls.payOnBus && ls.selectedSeats.length === 0,
  );
  const cashFare = cashLegs.reduce(
    (sum, ls) => sum + passengers.length * (ls.leg?.fare || 0),
    0,
  );

  const busTypeLabel = {
    ctb: "CTB",
    private_normal: "Non-AC",
    private_ac: "AC",
    semi_luxury: "Semi-Luxury",
    luxury: "Luxury",
    highway_normal: "Highway",
    highway_luxury: "Luxury Highway",
  };

  const handleConfirmBooking = async () => {
    if (!whatsapp) {
      toast.error("Please enter your WhatsApp number.");
      return;
    }
    if (!passengers[0].name) {
      toast.error("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const bookingIds = [];
      const legSummary = [];

      for (const ls of legSelections) {
        if (ls.selectedSeats.length === 0) continue;
        const res = await api.post("/bookings", {
          bus_id: ls.leg.bus_id,
          travel_date: date,
          board_stop_id: ls.leg.board_stop_id,
          drop_stop_id: ls.leg.drop_stop_id,
          whatsapp_number: whatsapp,
          payment_method: "card",
          is_connecting: (result?.transfers || 0) > 0,
          passengers: passengers
            .slice(0, ls.selectedSeats.length)
            .map((p, i) => ({
              passenger_name: p.name || `Passenger ${i + 1}`,
              nic: p.nic || null,
              gender: p.gender || "other",
              seat_id: ls.selectedSeats[i]?.id,
              accept_partial_seat: ls.selectedSeats[i]?.isPartial || false, // ✅ ADD THIS
            })),
        });
        bookingIds.push(res.data.booking_id);
        legSummary.push({
          reg_number: ls.busData?.bus?.reg_number,
          board_stop: ls.leg.board_stop_name,
          drop_stop: ls.leg.drop_stop_name,
          seats: ls.selectedSeats.length,
          amount: ls.selectedSeats.length * (ls.leg?.fare || 0),
        });
      }

      // If all cash - skip payment
      if (bookingIds.length === 0) {
        setBookingResult([]);
        setStep("success");
        return;
      }

      // Navigate to payment page
      navigate("/payment", {
        state: {
          bookingIds,
          legSummary,
          totalPayable,
          whatsapp,
          origin,
          destination,
          date,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success")
    return (
      <SuccessScreen
        bookingResult={bookingResult}
        origin={origin}
        destination={destination}
        date={date}
        passengers={passengers}
        onGoHome={() => navigate("/")}
        onMyBookings={() => navigate("/bookings")}
      />
    );

  if (step === "payment")
    return (
      <PaymentStep
        legSelections={legSelections}
        passengers={passengers}
        whatsapp={whatsapp}
        setWhatsapp={setWhatsapp}
        onlineFare={onlineFare}
        serviceFee={serviceFee}
        totalPayable={totalPayable}
        cashFare={cashFare}
        servicePct={servicePct}
        result={result}
        origin={origin}
        destination={destination}
        date={date}
        onBack={() => setStep("seats")}
        onConfirm={handleConfirmBooking}
        submitting={submitting}
        busTypeLabel={busTypeLabel}
      />
    );

  const layout = ls?.busData?.layout;
  const seats = ls?.busData?.seats || [];
  const busInfo = ls?.busData?.bus;
  const rows = layout
    ? Array.from({ length: layout.rows }, (_, i) => i + 1)
    : [];
  const cols = layout ? Array.from({ length: layout.cols }, (_, i) => i) : [];
  const aisleCol = layout?.aisle_col ?? 2;
  const seatAt = (row, col) =>
    seats.find((s) => s.row_index === row && s.col_index === col);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm mb-2 flex-wrap">
            <MapPin size={13} className="text-brand-500 flex-none" />
            <span className="font-bold text-gray-900">{origin}</span>
            <ArrowRight size={13} className="text-brand-500" />
            <span className="font-bold text-gray-900">{destination}</span>
            <span className="text-gray-400 text-xs">· {date}</span>
          </div>
          {legs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {legs.map((l, i) => (
                <div key={i} className="flex items-center gap-2 flex-none">
                  <button
                    onClick={() => {
                      setCurrentLegIdx(i);
                      loadLeg(i);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      i === currentLegIdx
                        ? "bg-brand-500 text-white"
                        : legSelections[i]?.payOnBus
                          ? "bg-orange-100 text-orange-600 border border-orange-200"
                          : legSelections[i]?.selectedSeats.length > 0
                            ? "bg-green-100 text-green-600 border border-green-200"
                            : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {legSelections[i]?.payOnBus
                      ? "💵"
                      : legSelections[i]?.selectedSeats.length > 0
                        ? "✓"
                        : i + 1}
                    <span>
                      Bus {i + 1}: {l.board_stop_name} → {l.drop_stop_name}
                    </span>
                  </button>
                  {i < legs.length - 1 && (
                    <ChevronRight
                      size={12}
                      className="text-gray-400 flex-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* ══ LEFT COLUMN ══ */}
          <div className="flex-1 min-w-0">
            {/* Bus info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg font-extrabold text-gray-900">
                      {busInfo?.reg_number}
                    </span>
                    <span className="bg-brand-50 text-brand-500 text-xs font-bold px-2 py-0.5 rounded-full">
                      {busTypeLabel[busInfo?.bus_type] || busInfo?.bus_type}
                    </span>
                    {busInfo?.has_ac && (
                      <span className="bg-blue-50 text-blue-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        AC
                      </span>
                    )}
                    {busInfo?.has_wifi && (
                      <span className="bg-green-50 text-green-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        WiFi
                      </span>
                    )}
                    {busInfo?.has_water && (
                      <span className="bg-cyan-50 text-cyan-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Water
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    {busInfo?.route_name} · Route {busInfo?.route_number}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={12} className="text-brand-500" />
                    <span className="font-bold text-gray-900">
                      {leg?.board_time?.substring(0, 5)}
                    </span>
                    <ArrowRight size={12} className="text-brand-500" />
                    <span className="font-bold text-gray-900">
                      {leg?.drop_time?.substring(0, 5)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      · {leg?.board_stop_name} → {leg?.drop_stop_name}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-none">
                  <div className="text-xs text-gray-400">Fare per seat</div>
                  <div className="text-2xl font-extrabold text-brand-500">
                    {(leg?.fare || 0).toLocaleString()} LKR
                  </div>
                  <div className="text-xs text-gray-400">
                    {origin} → {destination}
                  </div>
                </div>
              </div>
            </div>

            {/* Pay on bus toggle */}
            <div
              className={`rounded-2xl border-2 p-4 mb-4 transition-all ${
                ls?.payOnBus
                  ? "bg-orange-50 border-orange-300"
                  : "bg-white border-gray-200 hover:border-orange-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
                    💵 Pay cash on this bus
                    {ls?.payOnBus && (
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    If this bus doesn't have a seat for your full journey, you
                    can skip online payment and pay the conductor directly. Your
                    trip continues seamlessly.
                  </div>
                  {ls?.payOnBus && (
                    <div className="mt-2 text-xs text-orange-600 font-semibold">
                      ✓ You will pay the conductor ~
                      {(passengers.length * (leg?.fare || 0)).toLocaleString()}{" "}
                      LKR on boarding
                    </div>
                  )}
                </div>
                <button
                  onClick={togglePayOnBus}
                  className={`flex-none w-12 h-6 rounded-full transition-all relative mt-1 ${ls?.payOnBus ? "bg-orange-500" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${ls?.payOnBus ? "left-6" : "left-0.5"}`}
                  />
                </button>
              </div>
            </div>

            {/* ══ PAY ON BUS = show confirmation, hide layout ══ */}
            {ls?.payOnBus ? (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">💵</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Pay cash on this bus
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
                  You'll board this bus and pay the conductor directly. Your
                  seat will be assigned on boarding. This option doesn't
                  guarantee a specific seat.
                </p>
                <div className="bg-white rounded-xl p-4 border border-orange-200 mb-4">
                  <div className="text-sm font-bold text-orange-600">
                    Estimated cash fare: ~
                    {(passengers.length * (leg?.fare || 0)).toLocaleString()}{" "}
                    LKR
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    for {passengers.length} passenger
                    {passengers.length > 1 ? "s" : ""} · paid directly to
                    conductor
                  </div>
                </div>
                <button
                  onClick={togglePayOnBus}
                  className="text-xs text-orange-500 hover:text-orange-700 underline transition-colors"
                >
                  ← Change my mind - select a seat instead
                </button>
              </div>
            ) : (
              <>
                {/* ══ Seat legend ══ */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                    Seat map legend
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        cls: "bg-green-100 border-green-300 text-green-700",
                        label: "Available",
                      },
                      {
                        cls: "bg-red-100 border-red-300 text-red-400",
                        label: "Booked",
                      },
                      {
                        cls: "bg-yellow-100 border-yellow-300 text-yellow-600",
                        label: "Partial",
                      },
                      {
                        cls: "bg-brand-500 border-brand-500 text-white",
                        label: "Your pick",
                      },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-none ${l.cls}`}
                        >
                          05
                        </div>
                        <span className="text-xs text-gray-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-200 rounded" /> Male
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-pink-200 rounded" /> Female
                    </span>
                    <span className="flex items-center gap-1">🚪 Door</span>
                    <span className="flex items-center gap-1">- Aisle</span>
                  </div>
                </div>

                {/* ══ Bus layout ══ */}
                {!ls?.loaded ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Loading seat layout...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-xs font-bold text-gray-400 text-center mb-3 uppercase tracking-widest">
                      🚌 Front
                    </div>
                    <div className="flex justify-center">
                      <div className="border-2 border-gray-200 rounded-2xl p-4 bg-gray-50 inline-block">
                        {/* Driver + door */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center flex-none">
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
                        {rows.map((row) => (
                          <div
                            key={row}
                            className="flex gap-1.5 mb-1.5 items-center"
                          >
                            <span className="text-xs text-gray-300 w-3 flex-none text-right">
                              {row}
                            </span>
                            {cols.map((col) => {
                              if (col === aisleCol) {
                                return (
                                  <div
                                    key={col}
                                    className="w-5 flex items-center justify-center flex-none"
                                  >
                                    <div className="w-px h-9 border-l-2 border-dashed border-gray-300" />
                                  </div>
                                );
                              }

                              const seat = seatAt(row, col);
                              if (!seat || !seat.is_active)
                                return (
                                  <div
                                    key={col}
                                    className="w-10 h-10 flex-none"
                                  />
                                );

                              const status = getSeatStatus(
                                seat,
                                ls.availability,
                              );
                              const isSelected = ls.selectedSeats.find(
                                (s) => s.id === seat.id,
                              );
                              const availInfo = ls.availability[seat.id];

                              // Determine button className as a plain string — NO JSX inside
                              let seatClass =
                                "w-10 h-10 rounded-lg text-xs font-bold transition-all border-2 ";
                              if (isSelected) {
                                seatClass +=
                                  "bg-brand-500 border-brand-600 text-white shadow-md";
                              } else if (status === "booked") {
                                seatClass +=
                                  "bg-red-100 border-red-200 text-red-400 cursor-not-allowed";
                              } else if (status === "partial") {
                                seatClass +=
                                  "bg-yellow-100 border-yellow-300 text-yellow-700 hover:border-yellow-400 cursor-pointer";
                              } else {
                                seatClass +=
                                  "bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400";
                              }

                              return (
                                <div
                                  key={col}
                                  className="relative group flex-none"
                                >
                                  <button
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={status === "booked"}
                                    className={seatClass}
                                  >
                                    {seat.seat_number}
                                  </button>

                                  {/* Tooltip — partial seat */}
                                  {status === "partial" && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                      <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                                        <div className="font-bold text-yellow-400 mb-1">
                                          ⚡ Partially available
                                        </div>
                                        <div>
                                          Free until:{" "}
                                          <span className="font-semibold">
                                            {availInfo?.taken_from}
                                          </span>
                                        </div>
                                        <div>
                                          Then taken:{" "}
                                          <span className="font-semibold">
                                            {availInfo?.taken_from}
                                          </span>
                                          {" → "}
                                          <span className="font-semibold">
                                            {availInfo?.taken_to}
                                          </span>
                                        </div>
                                        <div className="text-gray-400 text-xs mt-0.5">
                                          Click to book — you will move at{" "}
                                          {availInfo?.taken_from}
                                        </div>
                                      </div>
                                      <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                    </div>
                                  )}

                                  {/* Tooltip — booked seat */}
                                  {status === "booked" && availInfo && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                      <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-xl">
                                        <div className="font-bold text-red-400 mb-1">
                                          🔴 Booked
                                        </div>
                                        <div>
                                          Taken:{" "}
                                          <span className="font-semibold">
                                            {availInfo?.taken_from}
                                          </span>
                                          {" → "}
                                          <span className="font-semibold">
                                            {availInfo?.taken_to}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <div className="w-1 h-10 bg-gray-200 rounded-r-full flex-none" />
                          </div>
                        ))}

                        {/* Exit */}
                        <div className="flex items-center gap-1 mt-2 px-2 py-1 border-2 border-dashed border-green-300 rounded-lg bg-green-50 w-fit">
                          <span className="text-sm">🚪</span>
                          <span className="text-xs text-green-600 font-semibold">
                            Exit
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-400 text-center mt-3 uppercase tracking-widest">
                      Back
                    </div>
                  </div>
                )}
              </>
            )}
            {/* ══ END LEFT COLUMN ══ */}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="xl:w-72 flex-none space-y-4">
            {/* Passengers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-gray-900">
                  Passengers
                  <span className="ml-2 bg-brand-50 text-brand-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {passengers.length}
                  </span>
                </h3>
                <div className="text-xs text-gray-400">
                  {ls?.selectedSeats.length || 0} seat
                  {ls?.selectedSeats.length !== 1 ? "s" : ""} selected
                </div>
              </div>

              <div className="space-y-3">
                {passengers.map((p, idx) => {
                  const seatForThis = ls?.selectedSeats?.[idx];
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-3 transition-all ${seatForThis ? "border-brand-200 bg-brand-50" : "border-gray-100 bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700">
                          {idx === 0
                            ? "👤 You (Passenger 1)"
                            : `👥 Passenger ${idx + 1}`}
                          {idx > 0 && (
                            <span className="text-gray-400 font-normal ml-1">
                              (optional)
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {seatForThis && (
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                                  seatForThis.isPartial
                                    ? "bg-yellow-500"
                                    : "bg-brand-500"
                                }`}
                              >
                                Seat {seatForThis.seat_number}
                                {seatForThis.isPartial && " ⚡"}
                              </span>
                            </div>
                          )}
                          {seatForThis?.isPartial && (
                            <div className="text-xs text-yellow-600 font-semibold mt-1 flex items-center gap-1">
                              ⚠️ Temporary — must move mid-journey
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder={
                          idx === 0 ? "Full name *" : "Name (optional)"
                        }
                        value={p.name}
                        onChange={(e) =>
                          setPassengers((prev) =>
                            prev.map((pp, i) =>
                              i === idx ? { ...pp, name: e.target.value } : pp,
                            ),
                          )
                        }
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-500 mb-2 bg-white"
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
                          className={`border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand-500 bg-white text-gray-600 ${!p.gender && seatForThis ? "border-red-300" : "border-gray-200"}`}
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
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand-500 bg-white"
                        />
                      </div>
                      {!seatForThis && !ls?.payOnBus && (
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                          <Info size={10} /> Tap a green seat to assign
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-gray-400 flex items-start gap-1.5 bg-gray-50 rounded-xl p-2.5">
                <Info size={11} className="flex-none mt-0.5 text-brand-500" />
                Select seats on the map - passengers are added automatically.
              </div>
            </div>

            {/* Journey summary */}
            {legs.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-3">
                  Journey summary
                </h3>
                {legSelections.map((ls, i) => (
                  <div
                    key={i}
                    className={`flex items-start justify-between text-xs py-2 border-b border-gray-50 last:border-0 ${i === currentLegIdx ? "text-gray-900" : "text-gray-400"}`}
                  >
                    <div>
                      <div className="font-semibold">
                        Bus {i + 1}: {ls.leg.board_stop_name} →{" "}
                        {ls.leg.drop_stop_name}
                      </div>
                      <div className="mt-0.5">
                        {ls.payOnBus && ls.selectedSeats.length === 0 ? (
                          <span className="text-orange-500 font-semibold">
                            💵 Pay on bus
                          </span>
                        ) : ls.selectedSeats.length > 0 ? (
                          <span className="text-green-500 font-semibold">
                            ✓ Seats:{" "}
                            {ls.selectedSeats
                              .map((s) => s.seat_number)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            No seats selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold ml-2">
                      {(
                        ls.selectedSeats.length * (ls.leg.fare || 0)
                      ).toLocaleString()}{" "}
                      LKR
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fare preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  Fare ({ls?.selectedSeats.length || 0} seat
                  {ls?.selectedSeats.length !== 1 ? "s" : ""})
                </span>
                <span className="font-semibold">
                  {(
                    (ls?.selectedSeats.length || 0) * (leg?.fare || 0)
                  ).toLocaleString()}{" "}
                  LKR
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Service fee est.</span>
                <span className="font-semibold">
                  {Math.round(
                    (ls?.selectedSeats.length || 0) *
                      (leg?.fare || 0) *
                      servicePct,
                  ).toLocaleString()}{" "}
                  LKR
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-2">
              <button
                onClick={handleNextLeg}
                disabled={!canProceed()}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  canProceed()
                    ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentLegIdx < legs.length - 1 ? (
                  <>
                    Next bus <ChevronRight size={16} />
                  </>
                ) : (
                  <>
                    Continue to payment <ChevronRight size={16} />
                  </>
                )}
              </button>
              {!canProceed() && (
                <p className="text-xs text-center text-gray-400">
                  Select a seat or toggle pay on bus to continue
                </p>
              )}
              <button
                onClick={() =>
                  currentLegIdx === 0
                    ? navigate(-1)
                    : setCurrentLegIdx((i) => i - 1)
                }
                className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} />
                {currentLegIdx === 0 ? "Back to results" : "Previous bus"}
              </button>
            </div>
          </div>
          {/* ══ END RIGHT COLUMN ══ */}
        </div>
      </div>

      {/* Partial seat confirmation modal */}
      {partialConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                Temporary Seat
              </h3>
              <p className="text-sm text-gray-500">
                Seat {partialConfirm.seat.seat_number} is partially available
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800">
              <div className="font-semibold mb-2">What this means:</div>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold flex-none">✓</span>
                  <span>
                    Seat is free from <strong>{leg?.board_stop_name}</strong>{" "}
                    until{" "}
                    <strong>{partialConfirm.availInfo?.taken_from}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold flex-none">⚡</span>
                  <span>
                    Another passenger boards at{" "}
                    <strong>{partialConfirm.availInfo?.taken_from}</strong> —
                    you must move to another seat at that stop
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold flex-none">→</span>
                  <span>Conductor will help you find an available seat</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs text-gray-500">
              💡 Only choose this if you are comfortable moving during the
              journey. The conductor will assist you in finding an empty seat.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPartialConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:border-brand-500 transition-colors"
              >
                Choose another seat
              </button>
              <button
                onClick={() => confirmSeatSelect(partialConfirm.seat, true)}
                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors"
              >
                I understand, book it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payment ───────────────────────────────────────────
function PaymentStep({
  legSelections,
  passengers,
  whatsapp,
  setWhatsapp,
  onlineFare,
  serviceFee,
  totalPayable,
  cashFare,
  servicePct,

  origin,
  destination,
  date,
  onBack,
  onConfirm,
  submitting,
  busTypeLabel,
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={24} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Confirm & Pay
          </h1>
          <p className="text-sm text-gray-500">
            {origin} → {destination} · {date} · {passengers.length} passenger
            {passengers.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="font-bold text-sm text-gray-900 mb-4">
            Booking summary
          </h3>
          {legSelections.map((ls, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 mb-3 last:mb-0 ${ls.payOnBus && ls.selectedSeats.length === 0 ? "bg-orange-50 border border-orange-200" : "bg-brand-50 border border-brand-100"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-1">
                    Bus {i + 1}: {ls.busData?.bus?.reg_number}
                    <span className="text-xs font-normal bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {busTypeLabel[ls.busData?.bus?.bus_type]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {ls.leg.board_stop_name} → {ls.leg.drop_stop_name} ·{" "}
                    {ls.leg.board_time?.substring(0, 5)}
                  </div>
                  {ls.payOnBus && ls.selectedSeats.length === 0 ? (
                    <div className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                      💵 Pay cash to conductor on boarding
                    </div>
                  ) : (
                    <div className="text-xs text-brand-500 font-semibold flex items-center gap-1">
                      <CheckCircle size={11} /> Seats:{" "}
                      {ls.selectedSeats.map((s) => s.seat_number).join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-gray-900">
                    {(
                      ls.selectedSeats.length * (ls.leg?.fare || 0)
                    ).toLocaleString()}{" "}
                    LKR
                  </div>
                  <div className="text-xs text-gray-400">
                    {ls.payOnBus && ls.selectedSeats.length === 0
                      ? "cash"
                      : "online"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <label className="block text-sm font-bold text-gray-900 mb-1">
            WhatsApp for QR tickets *
          </label>
          <input
            type="tel"
            placeholder="+94 77 123 4567"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-brand-500 transition-colors"
          />
          <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
            <Info size={12} className="flex-none mt-0.5 text-brand-500" />
            Each bus gets its own QR. Conductors scan only their bus QR -
            tracked per leg automatically.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="font-bold text-sm text-gray-900 mb-4">
            Payment breakdown
          </h3>
          <div className="space-y-2.5 text-sm">
            {onlineFare > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  Online fare ({passengers.length} passenger
                  {passengers.length > 1 ? "s" : ""})
                </span>
                <span className="font-semibold">
                  {onlineFare.toLocaleString()} LKR
                </span>
              </div>
            )}
            {cashFare > 0 && (
              <div className="flex justify-between text-orange-500">
                <span>Cash on bus (estimated)</span>
                <span className="font-semibold">
                  ~{cashFare.toLocaleString()} LKR
                </span>
              </div>
            )}
            {onlineFare > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Service fee ({(servicePct * 100).toFixed(0)}%)</span>
                <span className="font-semibold">
                  {serviceFee.toLocaleString()} LKR
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Pay online now</span>
              <span className="font-extrabold text-brand-500 text-xl">
                {totalPayable.toLocaleString()} LKR
              </span>
            </div>
          </div>
          {cashFare > 0 && (
            <div className="mt-4 bg-orange-50 rounded-xl p-3 text-xs text-orange-600 border border-orange-200">
              ⚠️ Also pay ~{cashFare.toLocaleString()} LKR cash on the bus for
              legs without online booking.
            </div>
          )}
        </div>

        <button
          onClick={onConfirm}
          disabled={submitting || !whatsapp}
          className="w-full bg-brand-500 text-white py-4 rounded-2xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-200 mb-3"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={16} /> Pay {totalPayable.toLocaleString()} LKR &
              Confirm
            </>
          )}
        </button>
        <button
          onClick={onBack}
          className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronLeft size={16} /> Back to seat selection
        </button>
        <p className="text-xs text-gray-400 text-center mt-4">
          🔒 Secure payment · QR tickets sent immediately
        </p>
      </div>
    </div>
  );
}

// ── Success ───────────────────────────────────────────
function SuccessScreen({
  bookingResult,
  origin,
  destination,
  date,
  passengers,
  onGoHome,
  onMyBookings,
}) {
  const handleDownloadPDF = async (booking) => {
    try {
      const res = await api.get(`/bookings/${booking.booking_id}/ticket-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SmartRouteLK-${booking.booking_id.substring(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF download failed.");
    }
  };

  const allCash = !bookingResult || bookingResult.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center mb-4">
            <div
              className={`w-16 h-16 ${allCash ? "bg-orange-100" : "bg-green-100"} rounded-full flex items-center justify-center mx-auto mb-4`}
            >
              {allCash ? (
                <span className="text-3xl">💵</span>
              ) : (
                <CheckCircle size={32} className="text-green-500" />
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
              {allCash ? "Journey Noted! 🚌" : "Booking Confirmed! 🎉"}
            </h1>
            <p className="text-sm text-gray-500 mb-1">
              {origin} → {destination} · {date}
            </p>

            {allCash ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 text-left">
                <div className="font-bold text-orange-600 mb-2 text-sm">
                  💵 Pay cash on board
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  You've chosen to pay cash on all buses. No online payment was
                  collected. Please board the bus and pay the conductor
                  directly. Keep this page as a reference for your journey.
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  {origin} → {destination} · {date} · {passengers.length}{" "}
                  passenger{passengers.length > 1 ? "s" : ""}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-6">
                  QR tickets sent to your WhatsApp · Show to conductor when
                  boarding
                </p>
                <div className="space-y-3 text-left mb-6">
                  {bookingResult?.map((booking, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm text-gray-900">
                            Bus {i + 1}: {booking.bus}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            ID:{" "}
                            {booking.booking_id.substring(0, 8).toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadPDF(booking)}
                          className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                        >
                          <Download size={13} /> PDF Ticket
                        </button>
                      </div>
                      {booking.passengers?.map((p, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 mt-2 bg-white border border-gray-100 rounded-lg p-2"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-none text-xs font-bold text-gray-400">
                            QR
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-700">
                              {p.passenger_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              Seat {p.seat_number} · Token:{" "}
                              {p.qr_token?.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={onGoHome}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                Go home
              </button>
              <button
                onClick={onMyBookings}
                className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
              >
                My bookings
              </button>
            </div>
          </div>
          {!allCash && (
            <p className="text-xs text-gray-400 text-center">
              Each bus has its own QR · Conductors scan only their bus
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
