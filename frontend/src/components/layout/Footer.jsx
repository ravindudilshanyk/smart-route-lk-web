import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
        {/* Links */}
        <div className="flex gap-8 text-sm text-gray-400 flex-wrap">
          {[
            { label: "About", path: "/about" },
            { label: "Contact", path: "/contact" },
            { label: "Terms & Condition", path: "/terms" },
            { label: "Privacy Policy", path: "/privacy" },
            { label: "Help Center", path: "/help" },
          ].map((l) => (
            <span
              key={l.label}
              onClick={() => navigate(l.path)}
              className="hover:text-brand-500 cursor-pointer transition-colors"
            >
              {l.label}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-xs text-gray-400">
          © 2025 SmartRoute LK. All rights reserved
        </div>

        {/* Social icons */}
        <div className="flex gap-3">
          {/* Facebook */}
          <a
            href="#"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* X */}
          <a
            href="#"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
            >
              <path d="M4 4l16 16M20 4 4 20" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="#"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="#9ca3af" />
            </svg>
          </a>
          {/* TikTok */}
          <a
            href="#"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-brand-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
