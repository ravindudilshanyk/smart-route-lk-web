import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ArrowRight, CheckCircle, Upload, Bus } from "lucide-react";
import Navbar from "../../components/layout/Navbar";

export default function ApplyOwnerPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1); // 1=details, 2=documents, 3=submitted
  const [form, setForm] = useState({
    business_name: "",
    business_reg_number: "",
    district: "",
    address: "",
    whatsapp_alerts: "",
  });
  const [files, setFiles] = useState({
    nic_front: null,
    nic_back: null,
    revenue_licence: null,
    bus_permit: null,
  });
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const districts = [
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Hambantota",
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Vavuniya",
    "Mullaitivu",
    "Batticaloa",
    "Ampara",
    "Trincomalee",
    "Kurunegala",
    "Puttalam",
    "Anuradhapura",
    "Polonnaruwa",
    "Badulla",
    "Monaragala",
    "Ratnapura",
    "Kegalle",
  ];

  const handleSubmit = async () => {
    if (!form.district || !form.address || !form.whatsapp_alerts) {
      toast.error("District, address and WhatsApp are required.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      Object.entries(files).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });

      await api.post("/owners/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || "Application failed.");
    } finally {
      setLoading(false);
    }
  };

  // If already an owner or admin, redirect to dashboard
  if (user?.role === "owner" || user?.role === "admin") {
    return <Navigate to="/owner" replace />;
  }

  // Success screen
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application submitted!
            </h1>
            <p className="text-sm text-gray-500 mb-2">
              Your bus owner application has been sent to our admin team.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Verification usually takes <strong>24–48 hours</strong>. You'll
              receive a WhatsApp message once approved.
            </p>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-left mb-6">
              <div className="text-xs font-bold text-brand-500 mb-2">
                What happens next?
              </div>
              {[
                "Admin reviews your documents",
                "Your account is upgraded to Owner role",
                "You can add buses and start accepting bookings",
              ].map((s) => (
                <div
                  key={s}
                  className="flex items-start gap-2 text-xs text-gray-600 mb-1"
                >
                  <CheckCircle
                    size={12}
                    className="text-brand-500 flex-none mt-0.5"
                  />{" "}
                  {s}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus size={24} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Apply as Bus Owner
          </h1>
          <p className="text-sm text-gray-500">
            Register your bus on SmartRoute LK and start accepting bookings from
            passengers across Sri Lanka.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {["Business details", "Documents"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i + 1
                      ? "bg-green-500 text-white"
                      : step === i + 1
                        ? "bg-brand-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold ${step === i + 1 ? "text-brand-500" : "text-gray-400"}`}
                >
                  {s}
                </span>
              </div>
              {i < 1 && <div className="flex-1 h-px bg-gray-200 mx-3" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Step 1 - Business details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 mb-4">
                Business information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Business / company name
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Jayawardena Transport Services"
                    value={form.business_name}
                    onChange={(e) => set("business_name", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Business reg. number
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="PV 12345"
                    value={form.business_reg_number}
                    onChange={(e) => set("business_reg_number", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  District <span className="text-brand-500">*</span>
                </label>
                <select
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors text-gray-600"
                >
                  <option value="">Select your district</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Address <span className="text-brand-500">*</span>
                </label>
                <textarea
                  placeholder="No. 45, Main Street, Colombo 10"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  WhatsApp for booking alerts{" "}
                  <span className="text-brand-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+94 71 234 5678"
                  value={form.whatsapp_alerts}
                  onChange={(e) => set("whatsapp_alerts", e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Daily passenger reports and booking alerts sent here
                </p>
              </div>

              <button
                onClick={() => {
                  if (
                    !form.district ||
                    !form.address ||
                    !form.whatsapp_alerts
                  ) {
                    toast.error("Please fill all required fields.");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                Continue to documents <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 - Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 mb-1">Upload documents</h2>
              <p className="text-xs text-gray-500 mb-4">
                These are required for identity verification. Accepted: JPG,
                PNG, PDF (max 5MB each).
              </p>

              {[
                { key: "nic_front", label: "NIC - Front side", required: true },
                { key: "nic_back", label: "NIC - Back side", required: true },
                {
                  key: "revenue_licence",
                  label: "Revenue licence",
                  required: false,
                },
                {
                  key: "bus_permit",
                  label: "Bus permit (SLTB/Private)",
                  required: false,
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {f.label}
                    {f.required ? (
                      <span className="text-brand-500 ml-1">*</span>
                    ) : (
                      <span className="text-gray-400 font-normal ml-1">
                        (optional)
                      </span>
                    )}
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                      files[f.key]
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:border-brand-300"
                    }`}
                  >
                    {files[f.key] ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm text-green-600 font-semibold">
                          {files[f.key].name}
                        </span>
                        <button
                          onClick={() =>
                            setFiles((p) => ({ ...p, [f.key]: null }))
                          }
                          className="text-gray-400 hover:text-red-400 ml-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload
                          size={20}
                          className="text-gray-400 mx-auto mb-1"
                        />
                        <div className="text-xs text-gray-500">
                          Click to upload or drag & drop
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0])
                              setFiles((p) => ({
                                ...p,
                                [f.key]: e.target.files[0],
                              }));
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                ⚠️ Your account will be reviewed by our admin team within 24–48
                hours after submission.
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !files.nic_front || !files.nic_back}
                  className="flex-1 bg-brand-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit application <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
