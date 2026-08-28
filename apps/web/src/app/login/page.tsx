"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { getStoredToken, storeSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getStoredToken()) router.replace("/admin");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, user } = await login(username, password);
      storeSession(token, user);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">Vessel Ticketing</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">Staff sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Admin and Owner access only.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            required
            autoFocus
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
