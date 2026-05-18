import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — restore user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // ── Normal login ─────────────────────────────────
  const login = async (whatsapp_number, password) => {
    const res = await authAPI.login({ whatsapp_number, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  // ── Normal register ──────────────────────────────
  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  // ── Google login / register ──────────────────────
  // Receives userInfo object fetched from Google
  const googleLogin = async (userInfo) => {
    const res = await api.post("/auth/google", userInfo);
    const { token, user, profile_complete } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return { user, profile_complete };
  };

  // ── Logout ───────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ── Refresh user from backend ────────────────────
  // Call this after completing profile to update local state
  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const updated = res.data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
