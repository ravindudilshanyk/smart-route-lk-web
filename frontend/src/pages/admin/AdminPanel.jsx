import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Users,
  Bus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Shield,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [owners, setOwners] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ownersRes, usersRes, bookingsRes, busesRes] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/owners"),
          api.get("/admin/users"),
          api.get("/admin/bookings"),
          api.get("/admin/buses"),
        ]);
      setStats(statsRes.data);
      setOwners(ownersRes.data.owners || []);
      setUsers(usersRes.data.users || []);
      setBookings(bookingsRes.data.bookings || []);
      setBuses(busesRes.data.buses || []);
    } catch (err) {
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOwner = async (ownerId, action) => {
    setProcessing(ownerId);
    try {
      await api.patch(`/admin/owners/${ownerId}/verify`, { action });
      toast.success(
        action === "approve" ? "Owner verified!" : "Owner rejected.",
      );
      fetchAll();
    } catch {
      toast.error("Action failed.");
    } finally {
      setProcessing(null);
    }
  };

  const toggleUserStatus = async (userId, current) => {
    setProcessing(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status: current === "active" ? "suspended" : "active",
      });
      toast.success("User status updated.");
      fetchAll();
    } catch {
      toast.error("Failed to update user.");
    } finally {
      setProcessing(null);
    }
  };

  const TABS = [
    { key: "overview", label: "Overview", icon: <TrendingUp size={15} /> },
    {
      key: "owners",
      label: "Owners",
      icon: <Bus size={15} />,
      badge:
        owners.filter((o) => o.status === "pending_verification").length ||
        null,
    },
    { key: "users", label: "Users", icon: <Users size={15} /> },
    { key: "buses", label: "Buses", icon: <Bus size={15} /> },
    { key: "bookings", label: "Bookings", icon: <CheckCircle size={15} /> },
  ];

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users || 0,
      icon: <Users size={20} />,
      color: "bg-blue-50 text-blue-500 border-blue-100",
    },
    {
      label: "Bus Owners",
      value: stats.total_owners || 0,
      icon: <Shield size={20} />,
      color: "bg-purple-50 text-purple-500 border-purple-100",
    },
    {
      label: "Active Buses",
      value: stats.total_buses || 0,
      icon: <Bus size={20} />,
      color: "bg-brand-50 text-brand-500 border-brand-100",
    },
    {
      label: "Total Bookings",
      value: stats.total_bookings || 0,
      icon: <CheckCircle size={20} />,
      color: "bg-green-50 text-green-500 border-green-100",
    },
    {
      label: "Revenue (LKR)",
      value: parseInt(stats.total_revenue || 0).toLocaleString(),
      icon: <TrendingUp size={20} />,
      color: "bg-amber-50 text-amber-500 border-amber-100",
    },
    {
      label: "Pending Owners",
      value: stats.pending_owners || 0,
      icon: <Clock size={20} />,
      color: "bg-orange-50 text-orange-500 border-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <Shield size={22} className="text-brand-500" /> Admin Panel
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                SmartRoute LK platform management
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 text-sm text-brand-500 font-semibold hover:underline"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {t.icon} {t.label}
                {t.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className={`border rounded-2xl p-4 ${s.color}`}
                >
                  <div className="mb-3">{s.icon}</div>
                  <div className="text-2xl font-extrabold text-gray-900">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pending owners alert */}
            {stats.pending_owners > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-orange-500 flex-none mt-0.5"
                />
                <div>
                  <div className="font-semibold text-sm text-orange-700">
                    {stats.pending_owners} owner application
                    {stats.pending_owners > 1 ? "s" : ""} waiting for review
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Review and verify bus owners so they can start listing
                    buses.
                  </div>
                  <button
                    onClick={() => setTab("owners")}
                    className="mt-2 text-xs text-orange-600 font-bold hover:underline"
                  >
                    Review now →
                  </button>
                </div>
              </div>
            )}

            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Recent Bookings</h2>
                <button
                  onClick={() => setTab("bookings")}
                  className="text-xs text-brand-500 font-semibold hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="px-6 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {b.first_name} {b.last_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {b.board_stop} → {b.drop_stop} · {b.reg_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-500">
                        {parseInt(b.total_fare).toLocaleString()} LKR
                      </div>
                      <div className="text-xs text-gray-400">
                        {b.travel_date?.substring(0, 10)}
                      </div>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">
                    No bookings yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── OWNERS ── */}
        {tab === "owners" && (
          <div className="space-y-4">
            {/* Pending */}
            {owners.filter((o) => o.status === "pending_verification").length >
              0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Clock size={11} /> Pending Review
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {owners
                    .filter((o) => o.status === "pending_verification")
                    .map((owner) => (
                      <OwnerCard
                        key={owner.id}
                        owner={owner}
                        processing={processing}
                        onApprove={() => verifyOwner(owner.id, "approve")}
                        onReject={() => verifyOwner(owner.id, "reject")}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Verified */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> Verified Owners
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-3">
                {owners.filter((o) => o.status === "verified").length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                    No verified owners yet
                  </div>
                )}
                {owners
                  .filter((o) => o.status === "verified")
                  .map((owner) => (
                    <OwnerCard
                      key={owner.id}
                      owner={owner}
                      processing={processing}
                      verified
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-brand-500 transition-colors">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or WhatsApp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {users
                .filter(
                  (u) =>
                    !search ||
                    `${u.first_name} ${u.last_name}`
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    u.whatsapp_number?.includes(search),
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center flex-none">
                        <span className="text-white text-xs font-bold">
                          {u.first_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {u.first_name} {u.last_name}
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                              u.role === "admin"
                                ? "bg-red-100 text-red-500"
                                : u.role === "owner"
                                  ? "bg-purple-100 text-purple-500"
                                  : u.role === "conductor"
                                    ? "bg-orange-100 text-orange-500"
                                    : "bg-blue-100 text-blue-500"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {u.whatsapp_number || u.email || "No contact"} ·
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          u.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-500"
                        }`}
                      >
                        {u.status}
                      </span>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => toggleUserStatus(u.id, u.status)}
                          disabled={processing === u.id}
                          className="text-xs text-gray-400 hover:text-brand-500 font-semibold transition-colors disabled:opacity-50"
                        >
                          {processing === u.id
                            ? "..."
                            : u.status === "active"
                              ? "Suspend"
                              : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── BUSES ── */}
        {tab === "buses" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                All Buses ({buses.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {buses.map((b) => (
                <div
                  key={b.id}
                  className="px-5 py-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900">
                        {b.reg_number}
                      </span>
                      <span className="bg-brand-50 text-brand-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {b.bus_type}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          b.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Route {b.route_number} · {b.route_name} · Owner:{" "}
                      {b.owner_name}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div className="font-semibold text-gray-700">
                      {b.seat_count} seats
                    </div>
                    <div>{b.booking_count || 0} bookings</div>
                  </div>
                </div>
              ))}
              {buses.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">
                  No buses registered yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab === "bookings" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900">
                All Bookings ({bookings.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {b.first_name} {b.last_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {b.board_stop} → {b.drop_stop} · {b.reg_number} ·{" "}
                      {b.travel_date?.substring(0, 10)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-500">
                      {parseInt(b.total_fare || 0).toLocaleString()} LKR
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        b.booking_status === "confirmed"
                          ? "bg-green-100 text-green-600"
                          : b.booking_status === "cancelled"
                            ? "bg-red-100 text-red-500"
                            : b.booking_status === "completed"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.booking_status}
                    </span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">
                  No bookings yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerCard({ owner, processing, onApprove, onReject, verified }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center flex-none">
              <span className="text-white font-bold">
                {owner.first_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">
                {owner.first_name} {owner.last_name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {owner.business_name || "Individual owner"} · {owner.district}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {owner.whatsapp_number} · Applied{" "}
                {new Date(owner.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-none">
            {!verified && (
              <>
                <button
                  onClick={onReject}
                  disabled={processing === owner.id}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle size={13} /> Reject
                </button>
                <button
                  onClick={onApprove}
                  disabled={processing === owner.id}
                  className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {processing === owner.id ? (
                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={13} />
                  )}{" "}
                  Verify
                </button>
              </>
            )}
            {verified && (
              <span className="flex items-center gap-1 bg-green-100 text-green-600 text-xs font-bold px-3 py-2 rounded-xl border border-green-200">
                <CheckCircle size={13} /> Verified
              </span>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-300 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {[
            { label: "Business name", value: owner.business_name || "-" },
            { label: "Reg. number", value: owner.business_reg_number || "-" },
            { label: "District", value: owner.district || "-" },
            { label: "Address", value: owner.address || "-" },
            { label: "WhatsApp alerts", value: owner.whatsapp_alerts || "-" },
            { label: "NIC", value: owner.nic || "-" },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-gray-400 mb-0.5">{f.label}</div>
              <div className="font-semibold text-gray-900">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
