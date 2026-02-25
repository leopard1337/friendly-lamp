"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CopyButton } from "@/components/CopyButton";
import Link from "next/link";
import Image from "next/image";
import { WorkspaceCardSkeleton } from "@/components/Skeleton";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = trpc.auth.me.useQuery();
  const { data: workspaces, isLoading } = trpc.workspace.list.useQuery(undefined, {
    enabled: !!session,
  });

  useEffect(() => setMounted(true), []);

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8 text-center ring-1 ring-zinc-800/40">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-violet-400"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-medium text-zinc-200">Welcome</h2>
        <p className="mb-6 max-w-sm text-zinc-500">
          Sign in to access your workspaces.
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-white">
            {getGreeting()}, <span className="font-bold">{session.walletAddress.slice(0, 4)}...{session.walletAddress.slice(-4)}</span> 👋
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            Workspaces
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Token analytics and campaign tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/watchlist"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2.5 font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            Watchlist
          </Link>
          <Link
            href="/dashboard/workspace/new"
            className="btn-primary inline-flex items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New Workspace
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <WorkspaceCardSkeleton key={i} />
          ))}
        </div>
      ) : workspaces?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/20 py-20 px-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-zinc-200">No workspaces yet</h3>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-zinc-500">
            Create your first workspace to track holders, campaigns, and KOL attribution.
          </p>
          <div className="mb-8 w-full max-w-md rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 text-left">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">How it works</h4>
            <ol className="space-y-2 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-400">1</span>
                Create a workspace and add your token address
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-400">2</span>
                Capture snapshots to track holder count and health score over time
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-400">3</span>
                Add campaigns and KOL deals to measure attribution
              </li>
            </ol>
          </div>
          <Link
            href="/dashboard/workspace/new"
            className="btn-primary inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
          >
            Create Workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces?.map((ws) => {
            const holderCount = ws.latestSnapshot?.holderCount;
            const healthScore = ws.latestSnapshot?.healthScore;
            const healthColor =
              healthScore == null
                ? "text-zinc-400"
                : healthScore > 70
                  ? "text-emerald-400"
                  : healthScore >= 40
                    ? "text-amber-400"
                    : "text-red-400";
            return (
              <Link
                key={ws.id}
                href={`/dashboard/workspace/${ws.id}`}
                className="group flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 ring-1 ring-zinc-800/50 transition-all hover:border-violet-500/50 hover:bg-white/5 hover:ring-violet-500/30"
              >
                <h3 className="font-semibold text-zinc-100 transition-colors group-hover:text-violet-400">
                  {ws.name}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-sm text-zinc-500">
                  {ws.tokenSymbol && (
                    <>
                      <span className="font-semibold text-zinc-300">${ws.tokenSymbol}</span>
                      <span className="text-zinc-600">·</span>
                    </>
                  )}
                  <span>
                    {ws.tokenContract.length > 12
                      ? `${ws.tokenContract.slice(0, 8)}...${ws.tokenContract.slice(-4)}`
                      : ws.tokenContract}
                  </span>
                  <CopyButton
                    value={ws.tokenContract}
                    className="rounded p-0.5 opacity-60 transition-all hover:opacity-100 group-hover:text-zinc-400"
                  />
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5">
                  {ws.chain === "solana" ? (
                    <Image
                      src="https://cryptologos.cc/logos/solana-sol-logo.png"
                      alt="Solana"
                      width={20}
                      height={20}
                      className="rounded"
                    />
                  ) : (
                    <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                      {ws.chain}
                    </span>
                  )}
                </span>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-300">
                      {holderCount != null ? `${holderCount.toLocaleString()} holders` : "— holders"}
                    </span>
                    <span className={`inline-flex items-center rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-medium tabular-nums ${healthColor}`}>
                      {healthScore != null ? `Health ${Math.round(healthScore)}` : "Health —"}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                      {ws.campaignCount} campaign{ws.campaignCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="label-muted" suppressHydrationWarning>
                      {ws.latestSnapshot?.timestamp
                        ? `Updated ${formatTimeAgo(new Date(ws.latestSnapshot.timestamp))}`
                        : "Never synced"}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                      Open workspace →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
