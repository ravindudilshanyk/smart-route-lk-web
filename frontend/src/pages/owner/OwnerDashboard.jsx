import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { busAPI, ownerAPI } from "../../services/api";
import api from "../../services/api";
import {
  Bus,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  BarChart3,
  Wifi,
  Wind,
  Droplets,
} from "lucide-react";
import toast from "react-hot-toast";

const busTypeLabel = {
  ctb: "CTB",
  private_normal: "Non-AC",
  private_ac: "AC",
  semi_luxury: "Semi-Luxury",
  luxury: "Luxury",
  highway_normal: "Highway",
  highway_luxury: "Luxury Highway",
};

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_buses: 0,
    total_bookings: 0,
    total_revenue: 0,
    active_buses: 0,
  });

  async function fetchData() {
    setLoading(true);
    try {
      const [busRes, ownerRes] = await Promise.all([
        busAPI.getMyBuses(),
        ownerAPI.getProfile(),
      ]);
      const busData = busRes.data.buses || [];
      setBuses(busData);
      setOwner(ownerRes.data.owner);

      // Calculate stats from bus data
      setStats({
        total_buses: busData.length,
        active_buses: busData.filter((b) => b.status === "active").length,
        total_bookings: busData.reduce(
          (s, b) => s + (parseInt(b.booking_count) || 0),
          0,
        ),
        total_revenue: busData.reduce(
          (s, b) => s + (parseFloat(b.total_revenue) || 0),
          0,
        ),
      });
    } catch {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Defer to next microtask to avoid synchronous setState inside effect
    Promise.resolve().then(fetchData);
  }, []);

  const handleDownloadReport = async (busId, regNumber) => {
    try {
      const res = await api.get(`/reports/bus/${busId}/passengers`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Passengers-${regNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Report generation failed.");
    }
  };

  const statusColors = {
    active: "bg-green-100 text-green-600 border-green-200",
    inactive: "bg-gray-100 text-gray-500 border-gray-200",
    maintenance: "bg-orange-100 text-orange-500 border-orange-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Owner Dashboard
                </h1>
                {owner?.status === "verified" && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
                {owner?.status === "pending_verification" && (
                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                    <Clock size={11} /> Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {owner?.business_name || "Your transport business"} ·{" "}
                {owner?.district}
              </p>
            </div>
            <button
              onClick={() => navigate("/owner/add-bus")}
              className="flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add New Bus
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        {/* Pending verification warning */}
        {owner?.status === "pending_verification" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-yellow-500 flex-none mt-0.5"
            />
            <div>
              <div className="font-semibold text-sm text-yellow-700 mb-1">
                Account under verification
              </div>
              <div className="text-xs text-yellow-600">
                Your account is being reviewed by our admin team. You can add
                buses now, but they won't be visible to passengers until
                verification is complete.
              </div>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Buses",
              value: stats.total_buses,
              sub: `${stats.active_buses} active`,
              icon: <Bus size={20} className="text-brand-500" />,
              bg: "bg-brand-50 border-brand-100",
            },
            {
              label: "Total Bookings",
              value: stats.total_bookings,
              sub: "all time",
              icon: <Users size={20} className="text-blue-500" />,
              bg: "bg-blue-50 border-blue-100",
            },
            {
              label: "Revenue",
              value: `${stats.total_revenue.toLocaleString()} LKR`,
              sub: "online payments",
              icon: <TrendingUp size={20} className="text-green-500" />,
              bg: "bg-green-50 border-green-100",
            },
            {
              label: "Avg Occupancy",
              value:
                buses.length > 0
                  ? `${Math.round(buses.reduce((s, b) => s + (parseFloat(b.avg_occupancy) || 0), 0) / buses.length)}%`
                  : "—",
              sub: "per trip",
              icon: <BarChart3 size={20} className="text-purple-500" />,
              bg: "bg-purple-50 border-purple-100",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  {s.icon}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mb-0.5">
                {s.value}
              </div>
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Bus list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Your Buses</h2>
            <span className="text-xs text-gray-400">
              {buses.length} bus{buses.length !== 1 ? "es" : ""}
            </span>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : buses.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">🚌</div>
              <h3 className="font-bold text-gray-900 mb-2">No buses yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Add your first bus to start accepting bookings.
              </p>
              <button
                onClick={() => navigate("/owner/add-bus")}
                className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
              >
                Add your first bus
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Bus info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-gray-900">
                          {bus.reg_number}
                        </span>
                        <span className="bg-brand-50 text-brand-500 text-xs font-bold px-2 py-0.5 rounded-full">
                          {busTypeLabel[bus.bus_type] || bus.bus_type}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[bus.status] || statusColors.active}`}
                        >
                          {bus.status}
                        </span>
                        {bus.has_ac && (
                          <span className="bg-blue-50 text-blue-500 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Wind size={10} /> AC
                          </span>
                        )}
                        {bus.has_wifi && (
                          <span className="bg-green-50 text-green-500 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Wifi size={10} /> WiFi
                          </span>
                        )}
                        {bus.has_water && (
                          <span className="bg-cyan-50 text-cyan-500 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Droplets size={10} /> Water
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 font-semibold mb-1">
                        Route {bus.route_number} · {bus.route_name}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />{" "}
                          {bus.departure_time?.substring(0, 5)} →{" "}
                          {bus.arrival_time?.substring(0, 5)}
                        </span>
                        <span>{bus.stop_count} stops</span>
                        <span>{bus.seat_count} seats</span>
                        <span>
                          Max: {parseFloat(bus.max_fare).toLocaleString()} LKR
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap mt-1">
                        {(bus.operating_days || []).map((d) => (
                          <span
                            key={d}
                            className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap flex-none">
                      <button
                        onClick={() =>
                          handleDownloadReport(bus.id, bus.reg_number)
                        }
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl hover:border-brand-300 hover:text-brand-500 transition-colors"
                      >
                        <Download size={13} /> Report
                      </button>
                      <button
                        onClick={() => navigate(`/owner/bus/${bus.id}`)}
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl hover:border-brand-300 hover:text-brand-500 transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => navigate(`/owner/bus/${bus.id}/edit`)}
                        className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-500 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                      >
                        <Settings size={13} /> Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick tips if new owner */}
        {!loading && owner?.status === "verified" && buses.length === 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🚌",
                title: "Add your bus",
                desc: "Register your bus with registration number, type, and route details.",
              },
              {
                icon: "💺",
                title: "Set seat layout",
                desc: "Build your exact seat layout so passengers see the real bus.",
              },
              {
                icon: "💰",
                title: "Set pricing",
                desc: "Configure price per km and minimum/maximum fares for your route.",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm"
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <div className="font-bold text-sm text-gray-900 mb-1">
                  {t.title}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  {t.desc}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
