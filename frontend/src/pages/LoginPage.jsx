import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [form, setForm] = useState({ whatsapp_number: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Normal login ─────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.whatsapp_number || !form.password) {
      toast.error("Please enter your WhatsApp number and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.whatsapp_number, form.password);
      toast.success(`Welcome back, ${user.first_name}! 👋`);
      if (user.role === "owner") navigate("/owner");
      else if (user.role === "conductor") navigate("/conductor");
      else navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Login failed. Check your details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ─────────────────────────────────
  const googleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1. Fetch user info from Google
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const userInfo = await res.json();

        // 2. Send to backend
        const { user, profile_complete } = await googleLogin(userInfo);

        toast.success(`Welcome back, ${user.first_name}! 👋`);

        // 3. Redirect
        if (!profile_complete) navigate("/complete-profile");
        else if (user.role === "owner") navigate("/owner");
        else if (user.role === "conductor") navigate("/conductor");
        else navigate("/");
      } catch (err) {
        console.error(err);
        toast.error("Google login failed. Please try again.");
      }
    },
    onError: () => toast.error("Google login failed."),
  });

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT — Brand panel ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #D0112B 0%, #8b0012 100%)",
        }}
      >
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
            <span className="text-white font-bold text-lg">SmartRouteLK</span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Sri Lanka's smartest bus platform
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Welcome back
            <br />
            to smarter
            <br />
            <span className="opacity-80">bus travel.</span>
          </h2>
          <p className="text-white text-sm leading-relaxed mb-8 opacity-80">
            Your bookings, tickets, and travel history — all in one place. Sign
            in and continue your journey.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Your QR tickets always available",
              "Track booked buses in real-time",
              "Manage and cancel bookings easily",
              "Earn loyalty points every trip",
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

        <div className="relative z-10">
          <p className="text-white text-xs opacity-60">
            © 2025 SmartRoute LK · All rights reserved
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form panel ───────────────────────── */}
      <div className="flex-1 bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10">
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-7">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-500 font-semibold hover:underline"
            >
              Create one free
            </Link>
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={() => googleSignIn()}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:border-red-300 hover:bg-brand-50 transition-all mb-5"
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
              or sign in with details
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                WhatsApp number <span className="text-brand-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+94 77 123 4567"
                value={form.whatsapp_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatsapp_number: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">
                  Password <span className="text-brand-500">*</span>
                </label>
                <span className="text-xs text-brand-500 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  {" "}
                  Sign in <ArrowRight size={16} />{" "}
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
            By signing in you agree to our{" "}
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
