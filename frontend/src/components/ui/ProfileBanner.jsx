import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, X, ArrowRight } from "lucide-react";

export default function ProfileBanner() {
  const { user, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Only show if:
  // 1. User is logged in
  // 2. Profile is NOT complete (Google signup missing fields)
  // 3. Not dismissed
  if (!user) return null;
  if (isProfileComplete()) return null;
  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertCircle size={16} className="text-amber-500 flex-none" />
          <p className="text-sm text-amber-700 truncate">
            <span className="font-semibold">Complete your profile</span> —
            needed for NIC, WhatsApp, and gender to book buses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <button
            onClick={() => navigate("/complete-profile")}
            className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Complete now <ArrowRight size={12} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600 transition-colors p-1"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
