import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function CompleteProfilePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nic: "",
    date_of_birth: "",
    gender: "",
    whatsapp_number: "",
  });
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.nic ||
      !form.date_of_birth ||
      !form.gender ||
      !form.whatsapp_number
    ) {
      toast.error("All fields are required to complete your profile.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/users/complete-profile", form);
      await refreshUser(); // update local user state
      toast.success("Profile completed! Welcome to SmartRoute LK 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #D0112B 0%, #8b0012 100%)",
        }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white opacity-5 rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/bus.png" alt="logo" className="w-8 h-8 object-contain" />
          <span className="text-white font-bold text-lg">SmartRouteLK</span>
        </div>

        <div className="relative z-10">
          <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Almost there! 🎉
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Just a few
            <br />
            more details
            <br />
            <span className="opacity-80">needed.</span>
          </h2>
          <p className="text-white text-sm leading-relaxed mb-8 opacity-80">
            Google gave us your name and email. We just need a few more details
            to complete your SmartRoute LK profile.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Required for seat booking verification",
              "NIC used for identity on the bus",
              "WhatsApp for QR ticket delivery",
              "Gender for seat colour coding",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle
                  size={16}
                  className="text-white flex-none opacity-90"
                />
                <span className="text-white text-sm opacity-90">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white text-xs opacity-60">
          © 2025 SmartRoute LK · All rights reserved
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-12 h-12 bg-brand-50 border-2 border-brand-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Hi {user?.first_name}, complete your profile
            </h1>
            <p className="text-sm text-gray-500">
              We need a few more details before you can book buses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NIC */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                NIC number <span className="text-brand-500">*</span>
              </label>
              <input
                type="text"
                placeholder="200012345678 or 000012345V"
                value={form.nic}
                onChange={(e) => set("nic", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Used for identity verification on the bus
              </p>
            </div>

            {/* DOB + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Date of birth <span className="text-brand-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Gender <span className="text-brand-500">*</span>
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors text-gray-600"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                WhatsApp number <span className="text-brand-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+94 77 123 4567"
                value={form.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Your QR ticket will be sent here after every booking
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  Complete profile <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
