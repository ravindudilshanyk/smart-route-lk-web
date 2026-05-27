import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally - token expired, force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ── Search ───────────────────────────────────────────
export const searchAPI = {
  search: (params) => api.get("/search", { params }),
};

// ── Buses ────────────────────────────────────────────
export const busAPI = {
  addBus: (data) => api.post("/buses", data),
  getMyBuses: () => api.get("/buses/mine"),
  getBusById: (id) => api.get(`/buses/${id}`),
};

// ── Bookings ─────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: () => api.get("/bookings/mine"),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
};

// ── Owners ───────────────────────────────────────────
export const ownerAPI = {
  apply: (data) => api.post("/owners/apply", data),
  getProfile: () => api.get("/owners/profile"),
};

export default api;
