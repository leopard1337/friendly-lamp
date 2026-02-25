"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CopyButton } from "@/components/CopyButton";
import { formatPrice } from "@/lib/format";

export default function KolAttributionPage({
  params,
}: {
  params: Promise<{ id: string; kolId: string }>;
}) {
  const { id, kolId } = use(params);
  const { data: session } = trpc.auth.me.useQuery();
  const { data: attribution, isLoading } = trpc.attribution.forKolDeal.useQuery(
    { kolDealId: kolId },
    { enabled: !!session }
  );

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8">
        <p className="mb-4 text-zinc-500">Sign in to view attribution</p>
        <ConnectWallet />
      </div>
    );
  }

  if (isLoading || !attribution) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/60" />
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-800/60" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-800/40" />
          ))}
        </div>
      </div>
    );
  }

  const hasHolderData =
    attribution.beforeHolders > 0 ||
    attribution.afterHolders > 0 ||
    attribution.snapshotsInWindow > 0;

  return (
    <div>
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-colors hover:text-zinc-300">
          Dashboard
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/workspace/${id}`} className="transition-colors hover:text-zinc-300">
          Workspace
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/dashboard/workspace/${id}`} className="transition-colors hover:text-zinc-300">
          KOL Deals
        </Link>
        <span aria-hidden>/</span>
        <span className="text-zinc-400">Deal</span>
      </nav>
      <h1 className="mb-1 text-2xl font-semibold text-zinc-100">
        KOL deal attribution
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Holder change around the deal date (±24h)
      </p>

      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Deal
          </h2>
          <p className="font-mono text-sm text-zinc-400">
            {attribution.deal.walletOfKol}
          </p>
          <p className="mt-1 text-zinc-300">
            ${attribution.deal.paidAmount} · {new Date(attribution.deal.date).toLocaleDateString()}
          </p>
          {attribution.deal.txid && (
            <p className="mt-2 flex items-center gap-2">
              {attribution.deal.chain === "solana" ? (
                <a
                  href={`https://solscan.io/tx/${attribution.deal.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-violet-400 hover:text-violet-300"
                >
                  {attribution.deal.txid.length > 20 ? `${attribution.deal.txid.slice(0, 16)}...` : attribution.deal.txid}
                </a>
              ) : (
                <span className="font-mono text-xs text-zinc-500">{attribution.deal.txid}</span>
              )}
              <CopyButton
                value={attribution.deal.txid}
                className="rounded p-0.5 text-zinc-500 transition-colors hover:text-violet-400"
              />
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Holder delta
          </h2>
          {hasHolderData ? (
            <>
              <p className="text-2xl font-semibold text-zinc-100">
                {attribution.holderDelta >= 0 ? "+" : ""}
                {attribution.holderDelta}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {attribution.beforeHolders} → {attribution.afterHolders} holders
              </p>
            </>
          ) : (
            <>
              <p className="text-zinc-400">No snapshot data yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Holder delta compares holder count before vs after the deal. Run &quot;Refresh holders&quot; on the workspace to capture snapshots over time.
              </p>
              <Link
                href={`/dashboard/workspace/${id}`}
                className="mt-3 inline-block text-sm text-amber-500/90 hover:text-amber-400"
              >
                Go to workspace →
              </Link>
            </>
          )}
        </div>

        {attribution.priceUsd != null && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Price
            </h2>
            <p className="text-zinc-300">${formatPrice(attribution.priceUsd)}</p>
          </div>
        )}
        {attribution.volume24h != null && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              24h volume
            </h2>
            <p className="text-zinc-300">${attribution.volume24h.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
