import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Bus,
  Users,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react";

export default function ConductorPage() {
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [todayPassengers, setTodayPassengers] = useState([]);
  const [busInfo, setBusInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const inputRef = useRef(null);

  const fetchTodayData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/conductor/today");
      setTodayPassengers(res.data.passengers || []);
      setBusInfo(res.data.bus);
    } catch {
      toast.error("Failed to load today's passengers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTodayData();
    }, 0);
    // Auto-focus the hidden QR input for scanner
    if (inputRef.current) inputRef.current.focus();
    return () => clearTimeout(timer);
  }, [fetchTodayData]);

  const validateQR = async (token) => {
    if (!token.trim()) return;
    setScanning(true);
    try {
      const res = await api.post("/conductor/scan", { token: token.trim() });
      setLastResult({ success: true, ...res.data });
      toast.success(
        `✅ ${res.data.passenger_name} — Seat ${res.data.seat_number} verified!`,
      );
      fetchTodayData();
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid QR code.";
      setLastResult({ success: false, error: msg });
      toast.error(msg);
    } finally {
      setScanning(false);
      setQrInput("");
      setManualInput("");
    }
  };

  // Handle physical QR scanner input (comes as keyboard input ending with Enter)
  const handleQrInput = (e) => {
    if (e.key === "Enter" && qrInput.trim()) {
      try {
        const parsed = JSON.parse(qrInput);
        validateQR(parsed.token || qrInput);
      } catch {
        validateQR(qrInput);
      }
    }
  };

  const boarded = todayPassengers.filter((p) => p.boarded).length;
  const pending = todayPassengers.filter(
    (p) => !p.boarded && !p.no_show,
  ).length;
  const noShow = todayPassengers.filter((p) => p.no_show).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hidden QR scanner input — captures physical scanner */}
      <input
        ref={inputRef}
        value={qrInput}
        onChange={(e) => setQrInput(e.target.value)}
        onKeyDown={handleQrInput}
        className="opacity-0 absolute -top-10 w-px h-px"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <QrCode size={20} className="text-brand-500" /> Conductor Panel
              </h1>
              {busInfo && (
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">
                    {busInfo.reg_number}
                  </span>
                  {" · "}
                  {busInfo.route_name}
                </div>
              )}
            </div>
            <button
              onClick={fetchTodayData}
              className="text-xs text-brand-500 font-semibold hover:underline mt-1"
            >
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              {
                label: "Boarded",
                value: boarded,
                color: "bg-green-50 border-green-200 text-green-600",
              },
              {
                label: "Pending",
                value: pending,
                color: "bg-amber-50 border-amber-200 text-amber-600",
              },
              {
                label: "No Show",
                value: noShow,
                color: "bg-red-50 border-red-200 text-red-500",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 text-center ${s.color}`}
              >
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1 space-y-4">
        {/* QR Scan result */}
        {lastResult && (
          <div
            className={`rounded-2xl border-2 p-5 flex items-start gap-4 ${
              lastResult.success
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-none ${
                lastResult.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle size={24} className="text-green-500" />
              ) : (
                <XCircle size={24} className="text-red-500" />
              )}
            </div>
            <div className="flex-1">
              {lastResult.success ? (
                <>
                  <div className="font-bold text-green-800 text-sm mb-1">
                    ✅ Valid ticket
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lastResult.passenger_name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Seat {lastResult.seat_number} · {lastResult.board_stop} →{" "}
                    {lastResult.drop_stop}
                  </div>
                  {lastResult.already_boarded && (
                    <div className="mt-2 text-xs text-orange-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> Already scanned — possible
                      duplicate
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-bold text-red-700 text-sm mb-1">
                    ❌ Invalid ticket
                  </div>
                  <div className="text-xs text-red-600">{lastResult.error}</div>
                </>
              )}
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="text-gray-400 hover:text-gray-600 flex-none text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Manual token entry */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Search size={13} className="text-brand-500" /> Manual token entry
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste QR token or scan with device camera..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validateQR(manualInput)}
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
            />
            <button
              onClick={() => validateQR(manualInput)}
              disabled={!manualInput.trim() || scanning}
              className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 flex-none"
            >
              {scanning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Verify"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 Physical QR scanners connected to this device will auto-validate
            when scanned.
          </p>
        </div>

        {/* Today's passengers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={15} className="text-brand-500" />
              Today's Passengers
              <span className="bg-brand-50 text-brand-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {todayPassengers.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : todayPassengers.length === 0 ? (
            <div className="p-10 text-center">
              <Bus size={32} className="text-gray-200 mx-auto mb-3" />
              <div className="text-sm text-gray-400">
                No passengers booked for today
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayPassengers.map((p, i) => (
                <div
                  key={i}
                  className={`px-5 py-3 flex items-center justify-between gap-3 ${
                    p.boarded ? "bg-green-50" : p.no_show ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-none ${
                        p.gender === "female"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {p.passenger_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {p.passenger_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Seat {p.seat_number} · {p.board_stop} → {p.drop_stop}
                      </div>
                    </div>
                  </div>
                  <div className="flex-none">
                    {p.boarded ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                        <CheckCircle size={11} /> Boarded
                      </span>
                    ) : p.no_show ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-full">
                        <XCircle size={11} /> No show
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
