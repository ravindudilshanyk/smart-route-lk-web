import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchResults from "./pages/passenger/SearchResults";
import SeatSelectPage from "./pages/passenger/SeatSelectPage";
import MyBookingsPage from "./pages/passenger/MyBookingsPage";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AddBusPage from "./pages/owner/AddBusPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import ProfilePage from "./pages/ProfilePage";
import ApplyOwnerPage from "./pages/owner/ApplyOwnerPage";
import AdminPanel from "./pages/admin/AdminPanel";
import ConductorPage from "./pages/conductor/ConductorPage";
import SearchPage from "./pages/passenger/SearchPage";
import SupportPage from "./pages/SupportPage";
import NotFoundPage from "./pages/NotFoundPage";
import BusDetailPage from "./pages/passenger/BusDetailPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import TrackingPage from "./pages/TrackingPage";
import BookingDetailPage from "./pages/passenger/BookingDetailPage";
import EditBusPage from "./pages/owner/EditBusPage";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/results" element={<SearchResults />} />
      {/* ── Passenger ── */}
      <Route
        path="/seats/:busId"
        element={
          <ProtectedRoute>
            <SeatSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      {/* ── Owner ── */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/add-bus"
        element={
          <ProtectedRoute role="owner">
            <AddBusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/apply"
        element={
          <ProtectedRoute>
            <ApplyOwnerPage />
          </ProtectedRoute>
        }
      />
      {/* ── Fallback — must be LAST ── */}
      <Route path="/search" element={<SearchPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conductor"
        element={
          <ProtectedRoute role="conductor">
            <ConductorPage />
          </ProtectedRoute>
        }
      />
      <Route path="/buses/:id" element={<BusDetailPage />} />
      <Route path="/track" element={<TrackingPage />} />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />

      <Route path="/buses/:id" element={<BusDetailPage />} />
      <Route path="/track" element={<TrackingPage />} />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <BookingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/bus/:id/edit"
        element={
          <ProtectedRoute role="owner">
            <EditBusPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily:
                "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#D0112B", secondary: "#fff" } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
