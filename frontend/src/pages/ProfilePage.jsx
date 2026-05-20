import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { ownerAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Shield,
  ChevronRight,
  Bus,
  CheckCircle,
  Clock,
  Star,
  Edit3,
  Save,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data.user);
      setEditForm({
        whatsapp_number: res.data.user.whatsapp_number || "",
        email: res.data.user.email || "",
      });
      if (res.data.user.role === "owner" || res.data.user.role === "admin") {
        try {
          const ownerRes = await ownerAPI.getProfile();
          setOwnerProfile(ownerRes.data.owner);
        } catch {
          /* not an owner yet */
        }
      }
    } catch {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/users/update-profile", editForm);
      await refreshUser();
      await fetchProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const roleColors = {
    passenger: "bg-blue-100 text-blue-600",
    owner: "bg-purple-100 text-purple-600",
    conductor: "bg-orange-100 text-orange-600",
    admin: "bg-red-100 text-red-500",
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center flex-none shadow-md">
              <span className="text-white text-2xl font-extrabold">
                {profile?.first_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-extrabold text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${roleColors[profile?.role] || "bg-gray-100 text-gray-500"}`}
                >
                  {profile?.role}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-3">
                Member since{" "}
                {new Date(profile?.created_at).toLocaleDateString("en-LK", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {/* Quick stats */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1 bg-brand-50 text-brand-500 px-3 py-1.5 rounded-full font-semibold">
                  <CreditCard size={12} />{" "}
                  {parseFloat(profile?.wallet_balance || 0).toLocaleString()}{" "}
                  LKR wallet
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-3 py-1.5 rounded-full font-semibold">
                  <Star size={12} /> {profile?.loyalty_points || 0} points
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 w-full flex-1 space-y-4">
        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={15} className="text-brand-500" /> Personal Information
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold hover:underline"
              >
                <Edit3 size={13} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-semibold"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs text-brand-500 font-bold hover:underline disabled:opacity-50"
                >
                  <Save size={13} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Non-editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Full Name
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  NIC Number
                </div>
                <div className="text-sm font-semibold text-gray-900 font-mono">
                  {profile?.nic || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Date of Birth
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {profile?.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString(
                        "en-LK",
                      )
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Gender
                </div>
                <div className="text-sm font-semibold text-gray-900 capitalize">
                  {profile?.gender || "—"}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-3">
              {/* Editable: WhatsApp */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Phone size={11} /> WhatsApp Number
                </div>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.whatsapp_number}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        whatsapp_number: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                ) : (
                  <div className="text-sm font-semibold text-gray-900">
                    {profile?.whatsapp_number || "—"}
                  </div>
                )}
              </div>

              {/* Editable: Email */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Mail size={11} /> Email Address
                </div>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Add email address"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                ) : (
                  <div className="text-sm font-semibold text-gray-900">
                    {profile?.email || (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account & role */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Shield size={15} className="text-brand-500" /> Account & Role
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Current role */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Current Role
                </div>
                <div className="font-bold text-gray-900 capitalize">
                  {profile?.role}
                </div>
              </div>
              <span
                className={`text-sm font-bold px-3 py-1.5 rounded-xl capitalize ${roleColors[profile?.role]}`}
              >
                {profile?.role}
              </span>
            </div>

            {/* Upgrade to owner if passenger */}

            {profile?.role === "passenger" && (
              <button
                onClick={() => navigate("/owner/apply")}
                className="w-full flex items-center justify-between p-4 border-2 border-dashed border-brand-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Bus size={18} className="text-brand-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-900">
                      Become a Bus Owner
                    </div>
                    <div className="text-xs text-gray-500">
                      Register your bus and start accepting bookings
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-400 group-hover:text-brand-500 transition-colors"
                />
              </button>
            )}

            {/* Owner profile if owner */}
            {ownerProfile && (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-gray-900">
                    {ownerProfile.business_name || "Bus Owner"}
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ownerProfile.status === "verified"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {ownerProfile.status === "verified"
                      ? "✓ Verified"
                      : "⏳ Pending"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {ownerProfile.district} · {ownerProfile.address}
                </div>
                <button
                  onClick={() => navigate("/owner")}
                  className="mt-3 text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Go to Owner Dashboard <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Quick Actions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              {
                label: "My Bookings",
                sub: "View your travel history",
                path: "/bookings",
                icon: <CreditCard size={16} className="text-brand-500" />,
              },
              {
                label: "Search Buses",
                sub: "Find and book a bus",
                path: "/search",
                icon: <Bus size={16} className="text-blue-500" />,
              },
              {
                label: "Support",
                sub: "Get help with your account",
                path: "/support",
                icon: <Shield size={16} className="text-green-500" />,
              },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                    {a.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {a.label}
                    </div>
                    <div className="text-xs text-gray-400">{a.sub}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
