export const AUTH_MODE_KEY = "operation-recode-auth-mode";
export const AUTH_MODE_EVENT = "operation-recode-auth-mode-change";

export type RecodeAuthMode = "locked" | "guest";

function notifyAuthModeChange() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_MODE_EVENT));
}

export function getAuthMode(): RecodeAuthMode {
  if (typeof window === "undefined") return "locked";

  return localStorage.getItem(AUTH_MODE_KEY) === "guest" ? "guest" : "locked";
}

export function enableGuestMode() {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_MODE_KEY, "guest");
  notifyAuthModeChange();
}

export function disableGuestMode() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_MODE_KEY);
  notifyAuthModeChange();
}

export function canSaveWithoutLogin() {
  return getAuthMode() === "guest";
}

export function getSaveLockMessage() {
  return "Please login or continue as Guest Mode before saving.";
}