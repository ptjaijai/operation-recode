export const AUTH_MODE_KEY = "operation-recode-auth-mode";

export type RecodeAuthMode = "locked" | "guest";

export function getAuthMode(): RecodeAuthMode {
  if (typeof window === "undefined") return "locked";

  return localStorage.getItem(AUTH_MODE_KEY) === "guest" ? "guest" : "locked";
}

export function enableGuestMode() {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_MODE_KEY, "guest");
}

export function disableGuestMode() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_MODE_KEY);
}

export function canSaveWithoutLogin() {
  return getAuthMode() === "guest";
}

export function getSaveLockMessage() {
  return "Please login or continue as Guest Mode before saving.";
}
