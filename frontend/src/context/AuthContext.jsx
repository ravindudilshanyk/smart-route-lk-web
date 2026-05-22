/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import api from "../services/api";
import { hasCompleteProfile } from "../utils/profile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");
    const loadSession = async () => {
      if (token && saved) {
        try {
          setUser(JSON.parse(saved));
          const res = await authAPI.me();
          const current = res.data.user;
          localStorage.setItem("user", JSON.stringify(current));
          setUser(current);
          localStorage.setItem(
            "profile_complete",
            hasCompleteProfile(current) ? "true" : "false",
          );
        } catch {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("profile_complete");
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const login = async (whatsapp_number, password) => {
    const res = await authAPI.login({ whatsapp_number, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    const me = await authAPI.me();
    const current = me.data.user;
    localStorage.setItem("user", JSON.stringify(current));
    localStorage.setItem(
      "profile_complete",
      hasCompleteProfile(current) ? "true" : "false",
    );
    setUser(current);
    return current;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    const me = await authAPI.me();
    const current = me.data.user;
    localStorage.setItem("user", JSON.stringify(current));
    localStorage.setItem(
      "profile_complete",
      hasCompleteProfile(current) ? "true" : "false",
    );
    setUser(current);
    return current;
  };

  const googleLogin = async (userInfo) => {
    const res = await api.post("/auth/google", userInfo);
    const { token, user, profile_complete } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem(
      "profile_complete",
      profile_complete ? "true" : "false",
    );
    const me = await authAPI.me();
    const current = me.data.user;
    localStorage.setItem("user", JSON.stringify(current));
    localStorage.setItem(
      "profile_complete",
      hasCompleteProfile(current) ? "true" : "false",
    );
    setUser(current);
    return { user: current, profile_complete: hasCompleteProfile(current) };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile_complete");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const updated = res.data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      // Recheck profile completeness
      localStorage.setItem(
        "profile_complete",
        hasCompleteProfile(updated) ? "true" : "false",
      );
      return updated;
    } catch {
      logout();
    }
  };

  const isProfileComplete = () => {
    return hasCompleteProfile(user);
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
        isProfileComplete,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
