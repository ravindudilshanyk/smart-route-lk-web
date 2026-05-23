import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileBanner from "../ui/ProfileBanner";
import {
  Menu,
  X,
  Bus,
  ChevronDown,
  User,
  BookOpen,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const close = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2 flex-none"
          >
            <div className="w-10 h-10 bg-brand-500 bg-opacity-10 rounded-xl flex items-center justify-center">
              <img
                src="/bus.png"
                alt="logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-bold text-sm tracking-tight">
              Smart<span className="text-brand-500">Route</span>LK
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link
              to="/#how"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              How it works?
            </Link>
            <Link
              to="/search"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              Search Buses
            </Link>
            {(user?.role === "owner" || user?.role === "admin") && (
              <Link
                to="/owner"
                className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
              >
                For Owners
              </Link>
            )}
            <Link
              to="/support"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3 flex-none">
            {user ? (
              <div className="relative">
                {/* User dropdown trigger */}
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all"
                >
                  <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center flex-none">
                    <span className="text-white text-xs font-bold">
                      {user.first_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 max-w-24 truncate">
                    {user.first_name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 bg-brand-50 border-b border-brand-100">
                        <div className="font-bold text-sm text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        <Link
                          to="/bookings"
                          onClick={close}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                        >
                          <BookOpen size={15} /> My Bookings
                        </Link>
                        {(user.role === "owner" || user.role === "admin") && (
                          <Link
                            to="/owner"
                            onClick={close}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                          >
                            <LayoutDashboard size={15} /> Owner Dashboard
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={close}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                        >
                          <User size={15} /> My Profile
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-brand-500 transition-colors font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-600 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors flex-none"
          >
            {menuOpen ? (
              <X size={20} className="text-gray-600" />
            ) : (
              <Menu size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </nav>

      <ProfileBanner />

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 py-4">
          {/* User info if logged in */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl mb-4">
              <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center flex-none">
                <span className="text-white font-bold">
                  {user.first_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user.role}
                </div>
              </div>
            </div>
          )}

          {/* Nav links */}
          <div className="space-y-1 mb-4">
            {[
              { label: "How it works?", path: "/#how" },
              { label: "Search Buses", path: "/search" },
              { label: "Support", path: "/support" },
            ].map((l) => (
              <Link
                key={l.label}
                to={l.path}
                onClick={close}
                className="flex items-center text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-2.5 rounded-xl transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4">
            {user ? (
              <div className="space-y-1">
                <Link
                  to="/bookings"
                  onClick={close}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-2.5 rounded-xl transition-colors"
                >
                  <BookOpen size={15} /> My Bookings
                </Link>
                {(user.role === "owner" || user.role === "admin") && (
                  <Link
                    to="/owner"
                    onClick={close}
                    className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-2.5 rounded-xl transition-colors"
                  >
                    <LayoutDashboard size={15} /> Owner Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={close}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand-500 hover:bg-brand-50 px-3 py-2.5 rounded-xl transition-colors"
                >
                  <User size={15} /> My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 text-sm text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl transition-colors"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={close}
                  className="text-center border-2 border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:border-brand-500 hover:text-brand-500 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="text-center bg-brand-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-brand-600 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-30 bg-black/20"
          onClick={close}
        />
      )}
    </>
  );
}
