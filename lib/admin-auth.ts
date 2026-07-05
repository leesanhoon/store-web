export const ADMIN_AUTH_TOKEN_KEY = "cup_store_admin_token";

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  return !!token;
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
}
