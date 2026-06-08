export const ADMIN_AUTH_STORAGE_KEY = "cup_store_admin_auth";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "123456";

export function isAdminAuthenticated() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
}

export function setAdminAuthenticated() {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
}

export function clearAdminAuthenticated() {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
