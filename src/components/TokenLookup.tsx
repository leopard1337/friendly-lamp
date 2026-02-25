"use client";

import { useState, useRef, useEffect } from "react";

type Result = {
  holderCount: number;
  healthScore: number;
  top10Concentration: number;
  totalSupply?: string;
};

type TokenLookupProps = {
  /** Compact mode: single-line search in header. Full mode: larger form. */
  variant?: "compact" | "full";
  /** Callback when lookup succeeds (e.g. to close a dropdown) */
  onResult?: (result: Result) => void;
};

export function TokenLookup({ variant = "compact", onResult }: TokenLookupProps) {
  const [mint, setMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResult(null);
        setError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = mint.trim();
    if (!trimmed) {
      setError("Paste a token address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tool/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lookup failed");
        return;
      }
      setResult(data);
      onResult?.(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-700/60 bg-zinc-900/40 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

  if (variant === "full") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          placeholder="e.g. So11111111111111111111111111111111111111112"
          className={`flex-1 px-4 py-3 ${inputClass}`}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex h-9 items-center gap-2">
        <input
          type="text"
          value={mint}
          onChange={(e) => {
            setMint(e.target.value);
            setError(null);
            setResult(null);
          }}
          placeholder="Look up token address…"
          className={`h-9 w-48 rounded-lg px-3 sm:w-64 ${inputClass}`}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 shrink-0 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "…" : "Look up"}
        </button>
      </form>
      {(error || result) && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-4 shadow-xl ring-1 ring-zinc-700/50 backdrop-blur-xl">
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {result && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Results
              </h3>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Holders</dt>
                  <dd className="font-semibold text-zinc-100">
                    {result.holderCount.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Health</dt>
                  <dd className="font-semibold text-zinc-100">
                    {result.healthScore}/100
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Top 10</dt>
                  <dd className="font-semibold text-zinc-100">
                    {(result.top10Concentration ?? 0).toFixed(1)}%
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
