import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-extrabold text-brand-500 mb-2 opacity-20">
            404
          </div>
          <div className="text-6xl mb-6">🚌</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
            This bus doesn't stop here
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on the right route.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="border-2 border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              ← Go back
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
