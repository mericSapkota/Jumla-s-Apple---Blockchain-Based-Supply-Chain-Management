import { createContext, useContext, useState, useCallback } from "react";
import { decodeToken, isTokenExpired } from "./jwt";
import { loginUser, registerUser } from "../api/authApi";

const AuthContext = createContext(null);

function readInitialUser() {
  const token = localStorage.getItem("jumla_token");
  if (!token || isTokenExpired(token)) return null;
  const decoded = decodeToken(token);
  return decoded
    ? {
        token,
        role: decoded.role,
        email: decoded.sub,
        fullName: localStorage.getItem("jumla_name") || "",
      }
    : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);

  const persist = (data) => {
    localStorage.setItem("jumla_token", data.token);
    localStorage.setItem("jumla_role", data.role);
    localStorage.setItem("jumla_name", data.fullName || "");
    const decoded = decodeToken(data.token);
    setUser({
      token: data.token,
      role: data.role,
      email: decoded?.sub,
      fullName: data.fullName,
    });
  };

  const login = useCallback(async (payload) => {
    const data = await loginUser(payload);
    persist(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    persist(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("jumla_token");
    localStorage.removeItem("jumla_role");
    localStorage.removeItem("jumla_name");
    setUser(null);
  }, []);

  const updateUserInfo = useCallback(({ fullName, email, token }) => {
    // Update localStorage with correct keys
    if (fullName !== undefined) {
      localStorage.setItem("jumla_name", fullName);
    }

    if (token) {
      localStorage.setItem("jumla_token", token);
    }

    // Update state by re-reading from localStorage or constructing new user object
    setUser((prevUser) => {
      if (!prevUser) return null;

      const decoded = token ? decodeToken(token) : decodeToken(prevUser.token);

      return {
        ...prevUser,
        token: token || prevUser.token,
        fullName: fullName || prevUser.fullName,
        email: email || decoded?.sub || prevUser.email,
        role: decoded?.role || prevUser.role,
      };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleHomePath(role) {
  switch (role) {
    case "FARMER":
      return "/farmer/dashboard";
    case "COOPERATIVE":
      return "/cooperative/dashboard";
    case "TRANSPORTER":
      return "/transporter/dashboard";
    case "CONSUMER":
      return "/consumer/scan";
    default:
      return "/login";
  }
}
