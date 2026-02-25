"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AddToWatchlistButton } from "@/components/Watchlist";
import { SolanaPrice } from "@/components/SolanaPrice";

const Squares = dynamic(() => import("@/components/Squares").then((m) => m.default), { ssr: false });

type Result = {
  holderCount: number;
  healthScore: number;
  top10Concentration: number;
  totalSupply?: string;
};

export default function ToolPage() {
  const [mint, setMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = mint.trim();
    if (!trimmed) {
      setError("Paste a token address to look up.");
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
        const msg = data.error ?? "Lookup failed";
        if (res.status === 429) setError("Too many requests. Please wait a moment and try again.");
        else if (res.status === 400) setError(msg);
        else if (msg.toLowerCase().includes("token not found") || msg.toLowerCase().includes("invalid")) setError(msg);
        else if (msg.toLowerCase().includes("rpc") || msg.toLowerCase().includes("helius")) setError("Token not found or RPC error. Check the address and try again.");
        else setError(msg);
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Squares
          direction="down"
          speed={0.5}
          squareSize={64}
          borderColor="#271E37"
          hoverFillColor="#222222"
        />
      </div>
      <header className="border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight text-zinc-100 hover:text-zinc-200"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-700/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </span>
            Token Analytics
          </Link>
          <div className="flex flex-1 justify-center">
            <SolanaPrice />
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Token Lookup
          </h1>
          <p className="mt-3 text-zinc-500">
            Paste any Solana token address to see holder count, health score, and top 10 concentration.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="e.g. So11111111111111111111111111111111111111112"
              className="flex-1 rounded-xl border border-zinc-700/60 bg-zinc-900/40 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Looking up…" : "Look up"}
            </button>
          </div>
        </form>
        {error && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-6 ring-1 ring-zinc-800/40">
              <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                Results
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-500">Holder count</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-100">
                    {result.holderCount.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Health score</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-100">
                    {result.healthScore}
                    <span className="ml-1 text-base font-normal text-zinc-500">/ 100</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Top 10 concentration</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-100">
                    {(result.top10Concentration ?? 0).toFixed(1)}%
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-violet-900/40 bg-violet-950/20 px-4 py-4 sm:flex-row sm:justify-center">
              <AddToWatchlistButton mint={mint.trim()} />
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
