"use client";

import Link from "next/link";
import { WatchlistPanel } from "@/components/Watchlist";

export default function WatchlistPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Watchlist
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Quick-add tokens without creating full workspaces. Look up any token to add it.
        </p>
      </div>
      <WatchlistPanel />
      <div className="mt-8 rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6 text-center">
        <p className="text-sm text-zinc-500">
          Add tokens from the{" "}
          <Link href="/tool" className="font-medium text-violet-400 hover:text-violet-300">
            Token Lookup
          </Link>{" "}
          page after a successful lookup.
        </p>
      </div>
    </div>
  );
}
