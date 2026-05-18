import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* ── Logo ── */}
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2 flex-none"
          >
            <img src="/bus.png" alt="logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm tracking-tight">
              Smart<span className="text-brand-500">Route</span>LK
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              to="/#how"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              How it works?
            </Link>
            <Link
              to="/owner"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              For Owners
            </Link>
            <Link
              to="/support"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              Supports
            </Link>
          </div>

          {/* ── Desktop auth buttons ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/bookings"
                  className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
                >
                  My Bookings
                </Link>
                <span className="text-sm text-gray-400">
                  Hi, {user.first_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={22} className="text-gray-600" />
            ) : (
              <Menu size={22} className="text-gray-600" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      <div
        className={`
        md:hidden fixed top-14 left-0 right-0 z-40
        bg-white border-b border-gray-100 shadow-lg
        transition-all duration-300 ease-in-out overflow-hidden
        ${menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}
      `}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {/* Nav links */}
          {[
            { label: "How it works?", path: "/#how" },
            { label: "For Owners", path: "/owner" },
            { label: "Supports", path: "/support" },
            { label: "Search Buses", path: "/search" },
          ].map((l) => (
            <Link
              key={l.label}
              to={l.path}
              onClick={close}
              className="text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-3 rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 my-2" />

          {/* Auth section */}
          {user ? (
            <>
              <Link
                to="/bookings"
                onClick={close}
                className="text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-3 rounded-lg transition-colors"
              >
                My Bookings
              </Link>
              {user.role === "owner" && (
                <Link
                  to="/owner"
                  onClick={close}
                  className="text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-3 rounded-lg transition-colors"
                >
                  Owner Dashboard
                </Link>
              )}
              <div className="px-3 py-2 text-xs text-gray-400">
                Signed in as {user.first_name} · {user.role}
              </div>
              <button
                onClick={handleLogout}
                className="text-left text-sm font-semibold text-brand-500 hover:bg-brand-50 px-3 py-3 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/login"
                onClick={close}
                className="text-center border-2 border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="text-center bg-brand-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Backdrop — closes menu when tapping outside ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-30 bg-black/20"
          onClick={close}
        />
      )}
    </>
  );
}
