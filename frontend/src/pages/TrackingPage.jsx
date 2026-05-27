import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { io } from "socket.io-client";
import { MapPin, Navigation, Clock, Bus, Radio } from "lucide-react";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get("bus_id");
  const bookingId = searchParams.get("booking_id");

  const [connected, setConnected] = useState(false);
  const [location, setLocation] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [status, setStatus] = useState("Waiting for bus location...");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!busId) return;

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("track_bus", { bus_id: busId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected from tracking server");
    });

    socket.on("bus_location", (data) => {
      setLocation({ lat: data.latitude, lng: data.longitude });
      setLastUpdate(new Date().toLocaleTimeString());
      setBusInfo(data.bus_info);
      setStatus(`Bus is moving - updated ${new Date().toLocaleTimeString()}`);
    });

    socket.on("bus_stopped", () => {
      setStatus("Bus has stopped");
    });

    socket.on("bus_arrived", (data) => {
      setStatus(`Bus has arrived at ${data.stop_name}`);
    });

    socket.on("tracking_error", (err) => {
      setStatus(err.message || "Tracking unavailable");
    });

    return () => {
      socket.disconnect();
    };
  }, [busId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <Navigation size={18} className="text-brand-500" /> Live Bus
                Tracking
              </h1>
              {busInfo && (
                <div className="text-sm text-gray-500">
                  {busInfo.reg_number} · {busInfo.route_name}
                </div>
              )}
            </div>
            <div
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                connected
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              {connected ? "Live" : "Offline"}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-none">
              <Radio size={18} className="text-brand-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {status}
              </div>
              {lastUpdate && (
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={11} /> Last update: {lastUpdate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          {location ? (
            <div>
              {/* In production, replace with Google Maps or Leaflet */}
              <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
                    <Bus size={24} color="white" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Bus located
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                </div>
                {/* Ping animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 border-4 border-brand-500 border-opacity-30 rounded-full animate-ping" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-400">Latitude</div>
                    <div className="font-mono font-semibold">
                      {location.lat.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Longitude</div>
                    <div className="font-mono font-semibold">
                      {location.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <Bus size={40} className="text-gray-200 mb-4" />
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Waiting for bus location
              </div>
              <div className="text-xs text-gray-400">
                Location updates appear here in real-time once the conductor
                starts sharing GPS
              </div>
            </div>
          )}
        </div>

        {/* How tracking works */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-xs text-brand-700">
          <div className="font-bold mb-1">How live tracking works</div>
          The conductor's device broadcasts GPS location every 30 seconds. Your
          browser receives updates instantly via WebSocket connection. Tracking
          is available from 30 minutes before departure until arrival.
        </div>
      </div>
    </div>
  );
}
