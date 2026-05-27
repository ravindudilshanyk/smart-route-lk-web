import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    nic: "",
    date_of_birth: "",
    gender: "",
    whatsapp_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.first_name ||
      !form.last_name ||
      !form.nic ||
      !form.date_of_birth ||
      !form.gender ||
      !form.whatsapp_number ||
      !form.password
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        nic: form.nic,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        whatsapp_number: form.whatsapp_number,
        email: form.email || undefined,
        password: form.password,
      });
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const { googleLogin } = useAuth();

  const googleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );
        const userInfo = await response.json();

        // Send to backend - same endpoint handles both login and register
        const { user, profile_complete } = await googleLogin(userInfo);

        toast.success(`Welcome to SmartRoute LK, ${user.first_name}! 🎉`);

        // New Google users always go to complete profile
        if (!profile_complete) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      } catch (err) {
        toast.error("Google signup failed. Please try again.");
        console.error(err);
      }
    },
    onError: () => {
      toast.error("Google signup failed.");
    },
  });

  const handleGoogle = () => googleSignUp();

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT - Brand panel ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #D0112B 0%, #8b0012 100%)",
        }}
      >
        {/* Background decoration circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white opacity-5 rounded-full" />
        <div className="absolute top-1/2 -right-10 w-40 h-40 bg-white opacity-5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <img
                src="/bus.png"
                alt="logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              SmartRouteLK
            </span>
          </Link>
        </div>

        {/* Center greeting */}
        <div className="relative z-10">
          <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Sri Lanka's smartest bus platform
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Travel smarter,
            <br />
            pay only for
            <br />
            <span className="text-white opacity-80">what you travel.</span>
          </h2>
          <p className="text-white text-opacity-80 text-sm leading-relaxed mb-8 opacity-80">
            Join thousands of Sri Lankan travellers who book buses smarter -
            direct routes, connecting buses, and seat-by-segment pricing.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              "Find direct & connecting buses instantly",
              "Pay only for your actual travel distance",
              "Get QR ticket on WhatsApp instantly",
              "Track your bus live in real-time",
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

        {/* Bottom note */}
        <div className="relative z-10">
          <p className="text-white text-xs opacity-60">
            © 2025 SmartRoute LK · All rights reserved
          </p>
        </div>
      </div>

      {/* ── RIGHT - Form panel ───────────────────────── */}
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create account
          </h1>
          <p className="text-sm text-gray-500 mb-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-500 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:border-brand-300 hover:bg-brand-50 transition-all mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">
              or register with details
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  First name <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Kamal"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Last name <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Perera"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

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
                QR ticket sent here after booking
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Email{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="kamal@email.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password <span className="text-brand-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Confirm password <span className="text-brand-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirm_password}
                  onChange={(e) => set("confirm_password", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm_password && (
                <p
                  className={`text-xs mt-1 font-medium ${
                    form.password === form.confirm_password
                      ? "text-green-500"
                      : "text-brand-500"
                  }`}
                >
                  {form.password === form.confirm_password
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            By creating an account you agree to our{" "}
            <span className="text-brand-500 cursor-pointer hover:underline">
              Terms
            </span>{" "}
            &amp;{" "}
            <span className="text-brand-500 cursor-pointer hover:underline">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
