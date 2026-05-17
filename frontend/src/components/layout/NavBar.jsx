import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bus } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Bus size={18} color="white" />
          </div>
          <span className="font-bold text-sm">
            Smart<span className="text-brand-500">Route</span>LK
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <Link
            to="/search"
            className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
          >
            Search Buses
          </Link>

          {user?.role === "owner" && (
            <Link
              to="/owner"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
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
                className="text-sm text-brand-500 font-semibold hover:text-brand-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
