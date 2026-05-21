import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { CheckCircle, ArrowRight, Phone, User, Shield } from "lucide-react";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState(1); // 1 = essential, 2 = full
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    whatsapp_number: "",
    gender: "",
    nic: "",
    date_of_birth: "",
  });

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!form.whatsapp_number || !form.gender) {
      toast.error("WhatsApp number and gender are required.");
      return;
    }
    setLoading(true);
    try {
      await api.patch("/users/complete-profile", {
        whatsapp_number: form.whatsapp_number,
        gender: form.gender,
      });
      await refreshUser();
      toast.success("Profile updated! You can now book seats.");
      // Offer to complete full profile or continue
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!form.nic || !form.date_of_birth) {
      // Skip is allowed for step 2
      navigate(redirectTo);
      return;
    }
    setLoading(true);
    try {
      await api.patch("/users/complete-profile", {
        whatsapp_number: form.whatsapp_number,
        gender: form.gender,
        nic: form.nic,
        date_of_birth: form.date_of_birth,
      });
      await refreshUser();
      toast.success("Profile fully completed! 🎉");
      navigate(redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update.");
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
            {step === 1 ? "⚡ Almost there!" : "🎉 Nearly done!"}
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            {step === 1 ? (
              <>
                Just two
                <br />
                quick details
                <br />
                <span className="opacity-80">needed.</span>
              </>
            ) : (
              <>
                Complete
                <br />
                your full
                <br />
                <span className="opacity-80">profile.</span>
              </>
            )}
          </h2>
          <p className="text-white text-sm leading-relaxed mb-8 opacity-80">
            {step === 1
              ? "We need your WhatsApp number to send QR tickets, and gender for seat colour coding."
              : "Add your NIC and DOB for identity verification. This helps conductors verify you on the bus."}
          </p>

          {/* Progress */}
          <div className="space-y-3">
            {[
              { label: "WhatsApp & gender", done: step >= 2 },
              {
                label: "NIC & date of birth",
                done: false,
                current: step === 2,
              },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-none border-2 transition-all ${
                    s.done
                      ? "bg-white border-white"
                      : s.current
                        ? "border-white"
                        : "border-white border-opacity-40"
                  }`}
                >
                  {s.done ? (
                    <CheckCircle size={14} className="text-brand-500" />
                  ) : (
                    <span
                      className={`text-xs font-bold ${s.current ? "text-white" : "text-white opacity-40"}`}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm ${s.done || s.current ? "text-white" : "text-white opacity-40"}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white text-xs opacity-60">
          © 2025 SmartRoute LK
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src="/bus.png"
                alt="logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-base">
                Smart<span className="text-brand-500">Route</span>LK
              </span>
            </Link>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl">{step === 1 ? "👋" : "📋"}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {step === 1
                ? `Hi ${user?.first_name}, complete your profile`
                : "Add your ID details"}
            </h1>
            <p className="text-sm text-gray-500">
              {step === 1
                ? "Two quick fields and you're ready to book buses."
                : "Optional but recommended for full verification."}
            </p>
          </div>

          {/* Step 1 — WhatsApp + gender */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  WhatsApp number <span className="text-brand-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Phone size={15} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={form.whatsapp_number}
                    onChange={(e) => set("whatsapp_number", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Your QR ticket will be sent here after every booking
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Gender <span className="text-brand-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gender", g)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                        form.gender === g
                          ? "bg-brand-500 border-brand-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-brand-300"
                      }`}
                    >
                      {g === "male"
                        ? "👨 Male"
                        : g === "female"
                          ? "👩 Female"
                          : "🙂 Other"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Used for seat colour coding on the bus map
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    {" "}
                    Continue <ArrowRight size={16} />{" "}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-gray-400 text-xs py-2 hover:text-gray-600 transition-colors"
              >
                Skip for now — I'll complete later
              </button>
            </form>
          )}

          {/* Step 2 — NIC + DOB (optional) */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              {/* Success of step 1 */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-600 font-semibold mb-2">
                <CheckCircle size={16} /> WhatsApp and gender saved — you can
                now book seats!
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  NIC number{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Shield size={15} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="200012345678 or 000012345V"
                    value={form.nic}
                    onChange={(e) => set("nic", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Used for identity verification on the bus
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Date of birth{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-brand-500 transition-colors text-gray-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    {" "}
                    Complete profile <ArrowRight size={16} />{" "}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(redirectTo)}
                className="w-full text-gray-400 text-xs py-2 hover:text-gray-600 transition-colors"
              >
                Skip — continue to{" "}
                {redirectTo === "/" ? "home" : "my destination"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
