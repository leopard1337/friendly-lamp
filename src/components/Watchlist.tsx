"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist";

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getWatchlist());
  }, []);

  useEffect(() => {
    refresh();
    const handleStorage = () => refresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  return {
    items,
    add: (item: Omit<WatchlistItem, "addedAt">) => {
      addToWatchlist(item);
      refresh();
    },
    remove: (mint: string) => {
      removeFromWatchlist(mint);
      refresh();
    },
    has: (mint: string) => isInWatchlist(mint),
    refresh,
  };
}

export function AddToWatchlistButton({
  mint,
  symbol,
  name,
  onAdded,
}: {
  mint: string;
  symbol?: string;
  name?: string;
  onAdded?: () => void;
}) {
  const { add, has } = useWatchlist();
  const inList = has(mint);

  if (inList) {
    return (
      <Link
        href="/dashboard/watchlist"
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        In watchlist
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add({ mint, symbol, name });
        onAdded?.();
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-600/60 bg-zinc-800/40 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 hover:text-zinc-100"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add to watchlist
    </button>
  );
}

type WatchlistRowProps = {
  item: WatchlistItem;
  holderCount?: number;
  healthScore?: number;
  loading?: boolean;
  onRemove: () => void;
};

function WatchlistRow({ item, holderCount, healthScore, loading, onRemove }: WatchlistRowProps) {
  const healthColor =
    healthScore == null ? "text-zinc-500" : healthScore >= 70 ? "text-emerald-400" : healthScore >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700/60">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm text-zinc-200">
          {item.mint.length > 20 ? `${item.mint.slice(0, 8)}...${item.mint.slice(-8)}` : item.mint}
        </p>
        {(item.symbol || item.name) && (
          <p className="mt-0.5 text-xs text-zinc-500">
            {item.symbol && `$${item.symbol}`}
            {item.symbol && item.name && " · "}
            {item.name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {loading ? (
          <span className="text-xs text-zinc-500">Loading…</span>
        ) : (
          <>
            <span className="text-sm font-medium tabular-nums text-zinc-300">
              {holderCount != null ? holderCount.toLocaleString() : "—"} holders
            </span>
            <span className={`text-sm font-medium tabular-nums ${healthColor}`}>
              {healthScore != null ? `Health ${Math.round(healthScore)}` : "—"}
            </span>
          </>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={`/tool?mint=${encodeURIComponent(item.mint)}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-zinc-800 hover:text-violet-300"
          >
            Look up
          </Link>
          <Link
            href={`/dashboard/workspace/new?mint=${encodeURIComponent(item.mint)}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            Create workspace
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
            aria-label="Remove from watchlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function WatchlistPanel() {
  const { items, remove, refresh } = useWatchlist();
  const [stats, setStats] = useState<Record<string, { holderCount: number; healthScore: number }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const mintList = items.map((i) => i.mint).join(",");
  useEffect(() => {
    if (items.length === 0) return;
    items.forEach((item) => {
      setLoading((l) => ({ ...l, [item.mint]: true }));
      fetch("/api/tool/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint: item.mint }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.holderCount != null) {
            setStats((s) => ({
              ...s,
              [item.mint]: { holderCount: data.holderCount, healthScore: data.healthScore ?? 0 },
            }));
          }
        })
        .finally(() => setLoading((l) => ({ ...l, [item.mint]: false })));
    });
  }, [mintList]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-12 text-center">
        <p className="text-sm text-zinc-500">No tokens in watchlist</p>
        <p className="mt-1 text-xs text-zinc-600">Add tokens from Token Lookup</p>
        <Link
          href="/tool"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Token Lookup
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WatchlistRow
          key={item.mint}
          item={item}
          holderCount={stats[item.mint]?.holderCount}
          healthScore={stats[item.mint]?.healthScore}
          loading={loading[item.mint]}
          onRemove={() => remove(item.mint)}
        />
      ))}
    </div>
  );
}
