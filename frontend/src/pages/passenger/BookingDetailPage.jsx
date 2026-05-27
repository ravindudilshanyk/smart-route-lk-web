import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { bookingAPI } from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bus,
  QrCode,
  Phone,
  ChevronLeft,
  Navigation,
} from "lucide-react";

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    color: "bg-green-100 text-green-600",
    icon: <CheckCircle size={14} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-500",
    icon: <XCircle size={14} />,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-100 text-blue-600",
    icon: <CheckCircle size={14} />,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-600",
    icon: <AlertCircle size={14} />,
  },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await bookingAPI.getById(id);
      setBooking(res.data);
    } catch {
      toast.error("Failed to load booking.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    setCancelling(true);
    try {
      const res = await bookingAPI.cancel(id);
      toast.success(res.data.message);
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.error || "Cancellation failed.");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadPDF = async () => {
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
    } catch {
      toast.error("PDF download failed.");
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

  if (!booking)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Booking not found
        </div>
      </div>
    );

  const b = booking.booking || booking;
  const pax = booking.passengers || [];
  const status = statusConfig[b.booking_status] || statusConfig.pending;
  const isPast = new Date(b.travel_date) < new Date();
  const canCancel = b.booking_status === "confirmed" && !isPast;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/bookings")}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Booking Details</h1>
              <p className="text-xs text-gray-400 font-mono">
                ID: {id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors"
            >
              <Download size={13} /> Download PDF Ticket
            </button>
            <button
              onClick={() =>
                navigate(`/track?bus_id=${b.bus_id}&booking_id=${id}`)
              }
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Navigation size={13} /> Track Bus Live
            </button>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle size={13} />{" "}
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1 space-y-4">
        {/* Journey card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-extrabold text-gray-900">
                  {b.board_stop}
                </span>
                <ArrowRight size={16} className="text-brand-500" />
                <span className="text-lg font-extrabold text-gray-900">
                  {b.drop_stop}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Bus size={12} /> {b.reg_number} · {b.route_name}
              </div>
            </div>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${status.color}`}
            >
              {status.icon} {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {[
              {
                label: "Travel date",
                value: new Date(b.travel_date).toLocaleDateString("en-LK", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              },
              { label: "Departure", value: b.board_time?.substring(0, 5) },
              { label: "Arrival", value: b.drop_time?.substring(0, 5) },
              {
                label: "Passengers",
                value: `${pax.length} passenger${pax.length > 1 ? "s" : ""}`,
              },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-gray-400 mb-0.5">{f.label}</div>
                <div className="font-semibold text-gray-900">{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers & QR codes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <QrCode size={15} className="text-brand-500" /> Passengers & Tickets
          </h3>
          <div className="space-y-3">
            {pax.map((p, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-none ${
                      p.gender === "female"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {p.passenger_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {p.passenger_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Seat <strong>{p.seat_number}</strong>
                      {p.nic && ` · NIC: ${p.nic}`}
                    </div>
                    <div className="text-xs mt-1">
                      {p.boarded ? (
                        <span className="text-green-500 font-semibold flex items-center gap-1">
                          <CheckCircle size={11} /> Boarded
                          {p.boarded_at
                            ? ` at ${new Date(p.boarded_at).toLocaleTimeString()}`
                            : ""}
                        </span>
                      ) : b.booking_status === "confirmed" && !isPast ? (
                        <span className="text-amber-500 font-semibold">
                          ⏳ Awaiting boarding
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <QrCode size={18} className="text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {p.qr_token?.substring(0, 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-3">Payment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                Fare ({pax.length} passenger{pax.length > 1 ? "s" : ""})
              </span>
              <span className="font-semibold">
                {parseFloat(b.total_fare || 0).toLocaleString()} LKR
              </span>
            </div>
            {b.service_fee > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Service fee</span>
                <span>{parseFloat(b.service_fee).toLocaleString()} LKR</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total paid</span>
              <span className="font-extrabold text-brand-500">
                {parseFloat(b.total_fare || 0).toLocaleString()} LKR
              </span>
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {b.payment_method?.replace("_", " ")} ·{" "}
              {b.payment_status === "paid" ? (
                <span className="text-green-500 font-semibold">✓ Paid</span>
              ) : (
                <span className="text-amber-500 font-semibold">Pending</span>
              )}
            </div>
          </div>

          {/* Refund info */}
          {b.booking_status === "cancelled" && b.refund_amount > 0 && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-600">
              ✓ Refund of{" "}
              <strong>
                {parseFloat(b.refund_amount).toLocaleString()} LKR
              </strong>{" "}
              has been processed.
            </div>
          )}
        </div>

        {/* Owner contact */}
        {b.booking_status === "confirmed" && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-orange-500 flex-none mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-orange-700 mb-1">
                  Bus owner contact
                </div>
                <div className="text-xs text-orange-600">
                  {b.owner_name && <div>{b.owner_name}</div>}
                  {b.owner_whatsapp ? (
                    <div>WhatsApp: {b.owner_whatsapp}</div>
                  ) : (
                    <div>Contact details available in your PDF ticket.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
