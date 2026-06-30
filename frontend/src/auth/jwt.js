import { jwtDecode } from "jwt-decode";

export function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    const rawRole = payload.role || "";
    const role = rawRole.replace("ROLE_", "");
    return { ...payload, role };
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}
