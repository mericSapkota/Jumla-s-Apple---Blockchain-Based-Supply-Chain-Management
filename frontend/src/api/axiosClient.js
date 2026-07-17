import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jumla_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isAuthCall = error?.config?.url?.includes("/api/auth/");
    const isProfileCall = error?.config?.url?.includes("/api/users/me");
    // Only an expired/invalid session (401/403) should bounce the user to
    // login. Business/server errors (400/404/500) — e.g. a failed certificate
    // generation — must surface to the caller as a toast, not log them out.
    const isAuthFailure = status === 401 || status === 403;
    if (isAuthFailure && !isAuthCall && !isProfileCall) {
      localStorage.removeItem("jumla_token");
      localStorage.removeItem("jumla_role");
      localStorage.removeItem("jumla_name");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
