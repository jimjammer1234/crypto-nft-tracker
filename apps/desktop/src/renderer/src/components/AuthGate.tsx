import { useState, type ReactNode } from "react";
import { getStoredToken, setStoredToken } from "../lib/auth.js";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

/** Gates the app behind a one-time access-code prompt when no token is baked in (the web build).
 * The Electron build always has a built-in token, so this renders its children immediately there. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => !!getStoredToken());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/mining/sources`, {
        headers: { Authorization: `Bearer ${input}` },
      });
      if (!res.ok) {
        setError("That code was rejected. Check it and try again.");
        return;
      }
      setStoredToken(input);
      setUnlocked(true);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <form onSubmit={submit} className="w-full max-w-xs rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 text-center text-lg font-semibold text-purple-400">Crypto &amp; NFT Tracker</div>
        <label className="mb-1 block text-xs text-gray-400">Access code</label>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-white"
        />
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
        <button
          type="submit"
          disabled={checking || !input}
          className="mt-4 w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {checking ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
