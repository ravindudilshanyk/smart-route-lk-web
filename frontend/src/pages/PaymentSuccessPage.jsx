import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";
import { CheckCircle, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) {
      navigate("/bookings", { replace: true });
      return;
    }

    let cancelled = false;

    const loadBookings = async () => {
      setLoading(true);
      try {
        let attempts = 0;
        const poll = async () => {
          const res = await api.get(`/payments/status/${orderId}`);
          if (res.data.status === "completed" || attempts > 10) {
            const bkRes = await api.get("/bookings/mine");
            const recent = (bkRes.data.bookings || []).slice(0, 3);
            if (!cancelled) {
              setBookings(recent);
              setLoading(false);
            }
          } else {
            attempts++;
            setTimeout(poll, 2000);
          }
        };
        await poll();
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [navigate, orderId]);

  const handleDownload = async (id) => {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Your booking is confirmed. QR tickets have been sent to your
              WhatsApp.
            </p>

            {loading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Loading your tickets...
              </div>
            ) : (
              <div className="space-y-3 text-left mb-6">
                {bookings.map((b, i) => (
                  <div
                    key={i}
                    className="bg-brand-50 border border-brand-100 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {b.board_stop} → {b.drop_stop}
                      </div>
                      <div className="text-xs text-gray-400">
                        {b.reg_number} · {b.travel_date?.substring(0, 10)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(b.id)}
                      className="flex items-center gap-1.5 bg-white border border-brand-200 text-brand-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors flex-none"
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/bookings")}
                className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
              >
                My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
