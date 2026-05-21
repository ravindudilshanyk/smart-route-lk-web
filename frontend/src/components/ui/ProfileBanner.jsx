import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { X, AlertCircle } from "lucide-react";

export default function ProfileBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    sessionStorage.getItem("banner_dismissed") === "true",
  );

  // Only show for logged in users with incomplete profiles
  if (!user) return null;
  if (user.whatsapp_number && user.gender) return null; // profile complete enough
  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem("banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <AlertCircle size={15} className="text-amber-500 flex-none" />
        <p className="text-xs text-amber-700 flex-1">
          <span className="font-semibold">Complete your profile</span> — Add
          your WhatsApp number and gender to unlock seat booking.
        </p>
        <button
          onClick={() => navigate("/complete-profile")}
          className="text-xs bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors flex-none"
        >
          Complete now
        </button>
        <button
          onClick={dismiss}
          className="text-amber-400 hover:text-amber-600 flex-none"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
