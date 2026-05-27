import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  CreditCard,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initiated, setInitiated] = useState(false);
  const [payData, setPayData] = useState(null);

  const bookingIds = (state?.bookingIds || []).map((booking) =>
    typeof booking === "object" ? booking.booking_id ?? booking.id : booking,
  );
  const totalPayable = state?.totalPayable || 0;
  const legSummary = state?.legSummary || [];
  const whatsapp = state?.whatsapp || "";

  useEffect(() => {
    if (!bookingIds.length || !totalPayable) {
      navigate("/", { replace: true });
    }
  }, [bookingIds.length, navigate, totalPayable]);

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const res = await api.post("/payments/initiate", {
        booking_ids: bookingIds,
        total_amount: totalPayable,
        passenger_name: `${user.first_name} ${user.last_name}`,
        whatsapp,
      });
      setPayData(res.data);
      setInitiated(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Payment initiation failed.");
    } finally {
      setLoading(false);
    }
  };

  const submitToPayHere = () => {
    if (!payData) return;
    // Create and submit form to PayHere
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payData.payhere_url;

    const fields = {
      merchant_id: payData.merchant_id,
      return_url: payData.return_url,
      cancel_url: payData.cancel_url,
      notify_url: payData.notify_url,
      order_id: payData.order_id,
      items: payData.items,
      currency: payData.currency,
      amount: payData.amount,
      hash: payData.hash,
      first_name: payData.first_name,
      last_name: payData.last_name,
      email: payData.email,
      phone: payData.phone,
      address: "Sri Lanka",
      city: "Colombo",
      country: "Sri Lanka",
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value || "";
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-10 w-full flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={24} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Complete Payment
          </h1>
          <p className="text-sm text-gray-500">Secure payment via PayHere</p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h3 className="font-bold text-sm text-gray-900 mb-4">
            Order summary
          </h3>
          <div className="space-y-2">
            {legSummary.map((leg, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {leg.reg_number} · {leg.board_stop} → {leg.drop_stop}
                  <span className="text-gray-400 text-xs ml-1">
                    ({leg.seats} seat{leg.seats > 1 ? "s" : ""})
                  </span>
                </span>
                <span className="font-semibold">
                  {leg.amount.toLocaleString()} LKR
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-extrabold text-brand-500 text-xl">
              {totalPayable.toLocaleString()} LKR
            </span>
          </div>
        </div>

        {/* Security note */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield size={16} className="text-green-500 flex-none mt-0.5" />
          <div className="text-xs text-green-700">
            <strong>Secure payment</strong> - processed by PayHere, Sri Lanka's
            trusted payment gateway. Your card details are never stored on our
            servers.
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            Accepted payment methods
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              "Visa",
              "Mastercard",
              "AMEX",
              "Internet Banking",
              "eZ Cash",
              "mCash",
            ].map((m) => (
              <span
                key={m}
                className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!initiated ? (
          <button
            onClick={initiatePayment}
            disabled={loading}
            className="w-full bg-brand-500 text-white py-4 rounded-2xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                Preparing payment...
              </>
            ) : (
              <>
                <CreditCard size={16} /> Pay {totalPayable.toLocaleString()} LKR
                via PayHere
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle
                size={16}
                className="text-brand-500 flex-none mt-0.5"
              />
              <div className="text-xs text-brand-700">
                Payment order <strong>{payData?.order_id}</strong> created.
                Click below to complete payment on PayHere's secure gateway.
              </div>
            </div>
            <button
              onClick={submitToPayHere}
              className="w-full bg-brand-500 text-white py-4 rounded-2xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              Continue to PayHere <ArrowRight size={16} />
            </button>
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 text-gray-500 text-sm py-2 hover:text-brand-500 transition-colors"
        >
          ← Back to booking
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          After payment, QR tickets are sent to your WhatsApp immediately
        </p>
      </div>
    </div>
  );
}
