import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

const FAQ = [
  {
    q: "How does seat-by-segment pricing work?",
    a: "You pay only for the distance you travel — not the full bus route. If a bus goes Colombo → Kandy → Badulla and you board at Colombo and alight at Kandy, you pay only the Colombo–Kandy fare. The same seat can then be booked by another passenger from Kandy to Badulla.",
  },
  {
    q: "What is a connecting bus journey?",
    a: "If no direct bus runs between your origin and destination, SmartRoute LK automatically finds two-bus routes with a valid transfer point. We ensure at least 30 minutes between your first bus arriving and your second bus departing so you have time to change.",
  },
  {
    q: "How do I receive my QR ticket?",
    a: "After completing your online payment, a QR code is sent to the WhatsApp number you provided during booking. Each bus on your journey has its own QR code. Show the relevant QR to the conductor when boarding each bus.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Go to My Bookings and click Cancel on any confirmed future booking. Your refund percentage depends on the bus owner's refund policy — typically 100% if cancelled more than 24 hours before departure and 50% if cancelled within 24 hours.",
  },
  {
    q: "What is the pay-on-bus option?",
    a: "If no seats are available for your segment, you can choose to pay cash directly to the conductor when you board. This does not guarantee a specific seat but ensures you can still travel. This option is only available on connecting journeys where at least one leg has online seats.",
  },
  {
    q: "How do I register my bus as an owner?",
    a: "Go to Profile → Become a Bus Owner → fill in your business details and upload your NIC and bus permit. Our admin team reviews applications within 24–48 hours. Once approved you can add buses, configure routes, and start accepting bookings.",
  },
  {
    q: "What is the service fee?",
    a: "SmartRoute LK charges a small service fee to maintain the platform. Direct bookings: 5% of fare. Connecting bookings: 8% of fare. This is shown clearly in the fare breakdown before you confirm payment.",
  },
];

export default function SupportPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            How can we help?
          </h1>
          <p className="text-gray-500 text-sm">
            Find answers to common questions or get in touch with our team.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <MessageCircle size={20} className="text-green-500" />,
              label: "WhatsApp",
              value: "+94 77 123 4567",
              bg: "bg-green-50 border-green-100",
              action: () => window.open("https://wa.me/94771234567"),
            },
            {
              icon: <Mail size={20} className="text-blue-500" />,
              label: "Email",
              value: "support@smartroutelk.com",
              bg: "bg-blue-50 border-blue-100",
              action: () => window.open("mailto:support@smartroutelk.com"),
            },
            {
              icon: <Clock size={20} className="text-amber-500" />,
              label: "Response time",
              value: "Within 24 hours",
              bg: "bg-amber-50 border-amber-100",
              action: null,
            },
          ].map((c) => (
            <button
              key={c.label}
              onClick={c.action}
              disabled={!c.action}
              className={`border rounded-2xl p-5 text-center transition-all ${c.bg} ${
                c.action ? "hover:shadow-md cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="flex justify-center mb-2">{c.icon}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                {c.label}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {c.value}
              </div>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 p-5 text-left"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {item.q}
                  </span>
                  {open === i ? (
                    <ChevronUp
                      size={16}
                      className="text-brand-500 flex-none mt-0.5"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="text-gray-400 flex-none mt-0.5"
                    />
                  )}
                </button>
                {open === i && (
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
