import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { bookingAPI } from "../../services/api";
import api from "../../services/api";
import {
  ArrowRight,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bus,
  QrCode,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-600 border-green-200",
    icon: <CheckCircle size={12} />,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
    icon: <AlertCircle size={12} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-500 border-red-200",
    icon: <XCircle size={12} />,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-600 border-blue-200",
    icon: <CheckCircle size={12} />,
  },
  no_show: {
    label: "No Show",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <XCircle size={12} />,
  },
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

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [details, setDetails] = useState({});
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, []);
  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      setBookings(res.data.bookings || []);
    } catch {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  const fetchDetails = async (id) => {
    if (details[id]) {
      setExpanded((e) => ({ ...e, [id]: !e[id] }));
      return;
    }
    try {
      const res = await bookingAPI.getById(id);
      setDetails((d) => ({ ...d, [id]: res.data }));
      setExpanded((e) => ({ ...e, [id]: true }));
    } catch {
      toast.error("Failed to load booking details.");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    setCancelling(id);
    try {
      const res = await bookingAPI.cancel(id);
      toast.success(res.data.message);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || "Cancellation failed.");
    } finally {
      setCancelling(null);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const res = await api.get(`/bookings/${id}/ticket-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SmartRouteLK-${id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF download failed.");
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming")
      return (
        b.booking_status === "confirmed" &&
        new Date(b.travel_date) >= new Date()
      );
    if (filter === "past")
      return (
        b.booking_status === "completed" || new Date(b.travel_date) < new Date()
      );
    if (filter === "cancelled") return b.booking_status === "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                My Bookings
              </h1>
              <p className="text-sm text-gray-500">
                Your travel history and upcoming trips
              </p>
            </div>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 text-sm text-brand-500 font-semibold hover:underline"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {[
              { key: "all", label: "All bookings" },
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
              { key: "cancelled", label: "Cancelled" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
                {f.key === "all" && bookings.length > 0 && (
                  <span className="ml-1.5 bg-white bg-opacity-30 px-1.5 py-0.5 rounded-full text-xs">
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full flex-1">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
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

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">🎫</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              No bookings found
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {filter === "all"
                ? "You haven't made any bookings yet."
                : `No ${filter} bookings.`}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              Search Buses
            </button>
          </div>
        )}

        {/* Bookings list */}
        <div className="space-y-4">
          {filtered.map((booking) => {
            const status =
              statusConfig[booking.booking_status] || statusConfig.pending;
            const isExpanded = expanded[booking.id];
            const detail = details[booking.id];
            const isPast = new Date(booking.travel_date) < new Date();
            const canCancel = booking.booking_status === "confirmed" && !isPast;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left info */}
                    <div className="flex-1">
                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-extrabold text-gray-900 text-base">
                          {booking.board_stop}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-brand-500 flex-none"
                        />
                        <span className="font-extrabold text-gray-900 text-base">
                          {booking.drop_stop}
                        </span>
                        <span
                          className={`flex items-center gap-1 border text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}
                        >
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* Bus info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Bus size={11} /> {booking.reg_number}
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                          {busTypeLabel[booking.bus_type] || booking.bus_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(booking.travel_date).toLocaleDateString(
                            "en-LK",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {booking.board_time?.substring(0, 5)} →{" "}
                          {booking.drop_time?.substring(0, 5)}
                        </span>
                      </div>

                      {/* Passengers count */}
                      <div className="mt-2 text-xs text-gray-400">
                        {booking.passenger_count} passenger
                        {booking.passenger_count > 1 ? "s" : ""} · Booking ID:{" "}
                        <span className="font-mono font-semibold text-gray-600">
                          {booking.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Right - fare + actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-brand-500">
                          {parseFloat(booking.total_fare || 0).toLocaleString()}{" "}
                          LKR
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {booking.payment_method?.replace("_", " ")}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleDownloadPDF(booking.id)}
                          className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                        >
                          <Download size={12} /> PDF
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelling === booking.id}
                            className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {cancelling === booking.id ? "..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  {/* <button
                    onClick={() => fetchDetails(booking.id)}
                    className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors font-semibold"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={13} /> Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown size={13} /> View tickets & passengers
                      </>
                    )}
                  </button> */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => fetchDetails(booking.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors font-semibold"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={13} /> Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} /> View passengers
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="text-xs text-brand-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      Full details <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && detail && (
                  <div className="border-t border-gray-50 bg-gray-50 p-5">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                      Passengers & Tickets
                    </div>
                    <div className="space-y-2">
                      {detail.passengers?.map((p, i) => (
                        <div
                          key={i}
                          className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-none ${
                                p.gender === "female"
                                  ? "bg-pink-100 text-pink-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {p.passenger_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {p.passenger_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Seat {p.seat_number} ·
                                {p.boarded ? (
                                  <span className="text-green-500 font-semibold ml-1">
                                    ✓ Boarded
                                  </span>
                                ) : p.no_show ? (
                                  <span className="text-red-500 font-semibold ml-1">
                                    No show
                                  </span>
                                ) : (
                                  <span className="text-gray-400 ml-1">
                                    Not yet boarded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-none">
                            <div className="text-xs text-gray-400 font-mono">
                              {p.qr_token?.substring(0, 8).toUpperCase()}
                            </div>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <QrCode size={14} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Refund info if cancelled */}
                    {booking.booking_status === "cancelled" &&
                      booking.refund_amount > 0 && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-600">
                          ✓ Refund of{" "}
                          <strong>
                            {parseFloat(booking.refund_amount).toLocaleString()}{" "}
                            LKR
                          </strong>{" "}
                          has been processed.
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
