"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8 text-center ring-1 ring-zinc-800/40">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-medium text-zinc-200">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-sm text-zinc-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-600/80 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
