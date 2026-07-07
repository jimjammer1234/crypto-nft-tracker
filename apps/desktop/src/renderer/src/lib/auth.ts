const STORAGE_KEY = "api_token";

// The Electron desktop build bakes its token in at build time (a private local install, lower
// risk). The web build intentionally does NOT bake a token into the public JS bundle — anyone
// visiting the URL could view-source it and hit the API. Instead the web build prompts the user
// to enter it once, storing it only in that browser's localStorage.
const BUILT_IN_TOKEN = import.meta.env.VITE_API_TOKEN as string | undefined;

export function getStoredToken(): string | null {
  if (BUILT_IN_TOKEN) return BUILT_IN_TOKEN;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEY);
}
