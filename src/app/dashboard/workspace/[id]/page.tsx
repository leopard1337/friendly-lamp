"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { CampaignWizard } from "@/components/CampaignWizard";
import { KolDealWizard } from "@/components/KolDealWizard";
import { CommunityStatsWizard } from "@/components/CommunityStatsWizard";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CopyButton } from "@/components/CopyButton";
import { HolderChart } from "@/components/HolderChart";
import { TeamDropdown } from "@/components/TeamDropdown";
import { ListItemSkeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";

function CampaignIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactElement> = {
    launch: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    kol: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    community: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    other: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  };
  return icons[type] ?? icons.other;
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showKolForm, setShowKolForm] = useState(false);
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [openKolMenuId, setOpenKolMenuId] = useState<string | null>(null);
  const [kolMenuPosition, setKolMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingKolId, setEditingKolId] = useState<string | null>(null);
  const [openCampaignMenuId, setOpenCampaignMenuId] = useState<string | null>(null);
  const [campaignMenuPosition, setCampaignMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.me.useQuery();
  const { data: workspace, isLoading } = trpc.workspace.getById.useQuery(
    { id },
    { enabled: !!session }
  );
  const { data: campaigns } = trpc.campaign.list.useQuery(
    { workspaceId: id },
    { enabled: !!session && !!workspace }
  );
  const { data: kolDeals } = trpc.kol.list.useQuery(
    { workspaceId: id },
    { enabled: !!session && !!workspace }
  );
  const { data: snapshots } = trpc.snapshot.list.useQuery(
    { workspaceId: id, limit: 30 },
    { enabled: !!session && !!workspace }
  );
  const sortedSnapshots = useMemo(
    () =>
      snapshots?.length
        ? [...snapshots].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        : undefined,
    [snapshots]
  );
  const { data: communityStats } = trpc.community.list.useQuery(
    { workspaceId: id, limit: 30 },
    { enabled: !!session && !!workspace }
  );
  const { data: teamData } = trpc.team.list.useQuery(
    { workspaceId: id },
    { enabled: !!session && !!workspace }
  );
  const { data: tokenMeta, isLoading: tokenMetaLoading } = trpc.token.getMetadata.useQuery(
    { mint: workspace?.tokenContract ?? "", chain: (workspace?.chain ?? "solana") as "solana" | "evm" },
    { enabled: !!session && !!workspace && workspace?.chain === "solana" && !!workspace.tokenContract }
  );
  const createCampaign = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate({ workspaceId: id });
      setShowCampaignForm(false);
    },
  });
  const updateCampaign = trpc.campaign.update.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate({ workspaceId: id });
      setEditingCampaignId(null);
    },
  });
  const deleteCampaign = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate({ workspaceId: id });
      setOpenCampaignMenuId(null);
    },
  });
  const createKol = trpc.kol.create.useMutation({
    onSuccess: () => {
      utils.kol.list.invalidate({ workspaceId: id });
      setShowKolForm(false);
    },
  });
  const updateKol = trpc.kol.update.useMutation({
    onSuccess: () => {
      utils.kol.list.invalidate({ workspaceId: id });
      setEditingKolId(null);
    },
  });
  const deleteKol = trpc.kol.delete.useMutation({
    onSuccess: () => {
      utils.kol.list.invalidate({ workspaceId: id });
      setOpenKolMenuId(null);
    },
  });
  const runSnapshot = trpc.snapshot.run.useMutation({
    onSuccess: () => {
      utils.snapshot.list.invalidate({ workspaceId: id });
    },
  });
  const createCommunityStat = trpc.community.create.useMutation({
    onSuccess: () => {
      utils.community.list.invalidate({ workspaceId: id });
      setShowCommunityForm(false);
    },
  });

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
        <p className="mb-4 text-zinc-400">Sign in to view workspace</p>
        <ConnectWallet />
      </div>
    );
  }

  if (isLoading || !workspace) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-800/50" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="min-w-0 pr-0 lg:pr-72">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-all hover:text-zinc-300 active:scale-[0.98]"
          >
            <span className="text-zinc-600" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
            Back to Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            {workspace.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 font-mono text-sm text-zinc-500">
            <span>
              {workspace.tokenContract.length > 20
                ? `${workspace.tokenContract.slice(0, 10)}...${workspace.tokenContract.slice(-8)}`
                : workspace.tokenContract}
            </span>
            <CopyButton
              value={workspace.tokenContract}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            />
            <span className="rounded-lg bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-zinc-700/50">
              {workspace.chain}
            </span>
          </p>
        </div>
        <TeamDropdown workspaceId={id} isAdmin={teamData?.isAdmin ?? false} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="stat-card rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 ring-1 ring-zinc-800/40 transition-colors hover:border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Holders</span>
            {workspace.chain === "solana" && (
              <button
                onClick={() => runSnapshot.mutate({ workspaceId: id })}
                disabled={runSnapshot.isPending}
                className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
                title="Refresh holders"
                aria-label="Refresh holders"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-white">
            {sortedSnapshots?.[0]?.holderCount?.toLocaleString() ?? "—"}
          </p>
          {sortedSnapshots && sortedSnapshots.length >= 2 && (() => {
            const latest = sortedSnapshots[0]?.holderCount ?? 0;
            const prev = sortedSnapshots[1]?.holderCount ?? 0;
            const delta = latest - prev;
            if (delta === 0) return null;
            return (
              <p className={`mt-0.5 text-[11px] font-medium tabular-nums ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
              </p>
            );
          })()}
        </div>
        <div className="stat-card rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 ring-1 ring-zinc-800/40 transition-colors hover:border-zinc-700/60">
          <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Health Score</span>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-emerald-400">
            {sortedSnapshots?.[0]?.healthScore ?? "—"}
          </p>
        </div>
        <div className="stat-card rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 ring-1 ring-zinc-800/40 transition-colors hover:border-zinc-700/60">
          <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Campaigns</span>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-white">
            {campaigns?.length ?? 0}
          </p>
        </div>
        <div className="stat-card rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 ring-1 ring-zinc-800/40 transition-colors hover:border-zinc-700/60">
          <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">KOL Deals</span>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-white">
            {kolDeals?.length ?? 0}
          </p>
        </div>
        <div className="stat-card col-span-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 ring-1 ring-zinc-800/40 transition-colors hover:border-zinc-700/60 sm:col-span-1">
          <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Community</span>
          <p className="mt-1.5 text-sm font-bold tabular-nums text-white">
            {communityStats?.length ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0">
                <span className="text-sky-400">TG {communityStats[0]?.telegramCount?.toLocaleString() ?? "—"}</span>
                <span className="text-indigo-400">DC {communityStats[0]?.discordCount?.toLocaleString() ?? "—"}</span>
              </span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200">Holder Growth & Health Score</h2>
          {workspace.chain === "solana" && (
            <button
              onClick={() => runSnapshot.mutate({ workspaceId: id })}
              disabled={runSnapshot.isPending}
              className="rounded-xl border border-zinc-600/80 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98] disabled:opacity-50"
            >
              {runSnapshot.isPending ? "Capturing…" : "Refresh holders"}
            </button>
          )}
        </div>
        <HolderChart data={snapshots ?? []} />
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-panel flex min-w-0 flex-col self-stretch rounded-2xl border border-zinc-800/60 bg-zinc-900/30 ring-1 ring-zinc-800/40">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">Campaigns</h2>
            {teamData?.canEdit && (
              <button
                onClick={() => {
                  if (showCampaignForm || editingCampaignId) {
                    setShowCampaignForm(false);
                    setEditingCampaignId(null);
                  } else {
                    setShowCampaignForm(true);
                  }
                }}
                className="btn-panel-add shrink-0 rounded-xl border border-zinc-600/60 bg-zinc-800/40 px-3.5 py-2 text-sm font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-[0.98]"
              >
                {showCampaignForm || editingCampaignId ? "Cancel" : "+ Add Campaign"}
              </button>
            )}
          </div>
          {(showCampaignForm || editingCampaignId) && (
            <>
              {(createCampaign.error || updateCampaign.error) && (
                <p className="mb-3 text-sm text-red-400">{(createCampaign.error ?? updateCampaign.error)?.message}</p>
              )}
              <CampaignWizard
                key={editingCampaignId ?? "new"}
                workspaceId={id}
                campaignId={editingCampaignId ?? undefined}
                initialData={(() => {
                  const c = campaigns?.find((x) => x.id === editingCampaignId);
                  return c ? { type: c.type, startedAt: c.startedAt, notes: c.notes } : undefined;
                })()}
                onSubmit={!editingCampaignId ? (data) => createCampaign.mutate(data) : undefined}
                onUpdate={editingCampaignId ? (data) => updateCampaign.mutate(data) : undefined}
                onCancel={() => { setShowCampaignForm(false); setEditingCampaignId(null); }}
                loading={createCampaign.isPending || updateCampaign.isPending}
              />
            </>
          )}
          {campaigns?.length === 0 && !showCampaignForm && !editingCampaignId ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-700/80 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/60 ring-1 ring-zinc-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">No campaigns yet</p>
              <p className="mt-1 text-xs text-zinc-600">Track launches, KOL pushes, and community efforts</p>
              {teamData?.canEdit && (
                <button
                  onClick={() => setShowCampaignForm(true)}
                  className="mt-4 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Add your first campaign
                </button>
              )}
            </div>
          ) : (
            <div className="dashboard-panel-list">
              <ul className="space-y-2">
              {campaigns?.map((c) => (
                <li key={c.id} className="relative flex min-w-0 items-stretch gap-1 rounded-xl border border-zinc-800/80 transition-colors hover:border-zinc-700/80">
                  <Link
                    href={`/dashboard/workspace/${id}/campaign/${c.id}`}
                    className="group card-interactive flex min-w-0 flex-1 items-center gap-3 p-3 transition-all hover:bg-zinc-800/30"
                  >
                    <span className="flex-shrink-0">
                      <CampaignIcon type={c.type} />
                    </span>
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-medium capitalize text-zinc-300 transition-colors group-hover:text-violet-400">{c.type}</span>
                      <span className="mx-2 text-zinc-600">·</span>
                      <span className="text-zinc-500">{new Date(c.startedAt).toLocaleDateString()}</span>
                      {c.notes && <span className="ml-2 text-zinc-500">· {c.notes}</span>}
                    </div>
                    <span className="flex-shrink-0 text-zinc-500" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
                  {teamData?.canEdit && (
                    <div className="flex items-center pr-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (openCampaignMenuId === c.id) {
                            setOpenCampaignMenuId(null);
                            setCampaignMenuPosition(null);
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setCampaignMenuPosition({ top: rect.bottom + 4, left: rect.left });
                            setOpenCampaignMenuId(c.id);
                          }
                        }}
                        className="rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        aria-label="Options"
                        aria-expanded={openCampaignMenuId === c.id}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {openCampaignMenuId === c.id && campaignMenuPosition && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            aria-hidden
                            onClick={() => { setOpenCampaignMenuId(null); setCampaignMenuPosition(null); }}
                          />
                          <div
                            className="fixed z-20 min-w-[120px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl ring-1 ring-zinc-800"
                            style={{ top: campaignMenuPosition.top, left: campaignMenuPosition.left }}
                          >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenCampaignMenuId(null);
                                  setCampaignMenuPosition(null);
                                  setEditingCampaignId(c.id);
                                  setShowCampaignForm(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (confirm("Delete this campaign? This cannot be undone.")) {
                                    deleteCampaign.mutate({ id: c.id });
                                    setOpenCampaignMenuId(null);
                                    setCampaignMenuPosition(null);
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                              >
                                Delete
                              </button>
                            </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            </div>
          )}
        </section>
        <section className="dashboard-panel flex min-w-0 flex-col self-stretch rounded-2xl border border-zinc-800/60 bg-zinc-900/30 ring-1 ring-zinc-800/40">
          <div className="mb-5 flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">KOL Deals</h2>
            {teamData?.canEdit && (
              <button
                onClick={() => {
                  if (showKolForm) {
                    setShowKolForm(false);
                  } else {
                    setEditingKolId(null);
                    setShowKolForm(true);
                  }
                }}
                className="btn-panel-add shrink-0 rounded-xl border border-zinc-600/60 bg-zinc-800/40 px-3.5 py-2 text-sm font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-[0.98]"
              >
                {showKolForm || editingKolId ? "Cancel" : "+ Add KOL Deal"}
              </button>
            )}
          </div>
          {(showKolForm || editingKolId) && (
            <>
              {(createKol.error || updateKol.error) && (
                <p className="mb-2 text-sm text-red-400">{(createKol.error ?? updateKol.error)?.message}</p>
              )}
              <KolDealWizard
                workspaceId={id}
                dealId={editingKolId ?? undefined}
                campaigns={campaigns ?? []}
                initialData={(() => {
                  const k = kolDeals?.find((x) => x.id === editingKolId);
                  return k
                    ? {
                        walletOfKol: k.walletOfKol,
                        paidAmount: Number(k.paidAmount),
                        date: k.date,
                        txid: k.txid ?? undefined,
                        platform: k.platform ?? undefined,
                        notes: k.notes ?? undefined,
                        campaignId: k.campaignId ?? undefined,
                      }
                    : undefined;
                })()}
                onSubmit={!editingKolId ? (data) => createKol.mutate(data) : undefined}
                onUpdate={editingKolId ? (data) => updateKol.mutate(data) : undefined}
                onCancel={() => { setShowKolForm(false); setEditingKolId(null); }}
                loading={createKol.isPending || updateKol.isPending}
              />
            </>
          )}
          {kolDeals?.length === 0 && !showKolForm && !editingKolId ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-700/80 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/60 ring-1 ring-zinc-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">No KOL deals yet</p>
              <p className="mt-1 text-xs text-zinc-600">Track paid promotions and measure attribution</p>
              {teamData?.canEdit && (
                <button
                  onClick={() => setShowKolForm(true)}
                  className="mt-4 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Add your first KOL deal
                </button>
              )}
            </div>
          ) : (
            <div className="dashboard-panel-list min-h-0 flex-1">
              <ul className="space-y-2">
                {kolDeals?.map((k) => (
                <li key={k.id} className="relative flex items-stretch gap-1 rounded-xl border border-zinc-800/60 transition-colors hover:border-zinc-700/70">
                  <Link
                    href={`/dashboard/workspace/${id}/kol/${k.id}`}
                    className="card-interactive flex-1 p-4 transition-all hover:bg-zinc-800/30"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium text-zinc-200">{k.walletOfKol.slice(0, 8)}...</span>
                      <CopyButton
                        value={k.walletOfKol}
                        className="rounded p-1 text-zinc-500 opacity-70 transition-all hover:bg-zinc-700/50 hover:opacity-100 hover:text-zinc-300"
                      />
                      {k.platform && (
                        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-zinc-700/50">
                          {k.platform}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold text-emerald-400">${Number(k.paidAmount)}</span>
                      <span className="text-zinc-500">{new Date(k.date).toLocaleDateString()}</span>
                      {k.txid && (
                        <span className="flex items-center gap-1">
                          {workspace.chain === "solana" ? (
                            <a
                              href={`https://solscan.io/tx/${k.txid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-xs text-zinc-500 hover:text-violet-400"
                              title={k.txid}
                            >
                              {k.txid.length > 12 ? `${k.txid.slice(0, 8)}...` : k.txid}
                            </a>
                          ) : (
                            <span className="font-mono text-xs text-zinc-500" title={k.txid}>
                              {k.txid.length > 12 ? `${k.txid.slice(0, 8)}...` : k.txid}
                            </span>
                          )}
                          <CopyButton
                            value={k.txid}
                            className="rounded p-0.5 text-zinc-500 opacity-70 transition-all hover:opacity-100 hover:text-violet-400"
                          />
                        </span>
                      )}
                    </div>
                  </Link>
                  {teamData?.canEdit && (
                    <div className="flex items-center pr-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (openKolMenuId === k.id) {
                            setOpenKolMenuId(null);
                            setKolMenuPosition(null);
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setKolMenuPosition({ top: rect.bottom + 4, left: rect.left });
                            setOpenKolMenuId(k.id);
                          }
                        }}
                        className="rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        aria-label="Options"
                        aria-expanded={openKolMenuId === k.id}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {openKolMenuId === k.id && kolMenuPosition && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            aria-hidden
                            onClick={() => { setOpenKolMenuId(null); setKolMenuPosition(null); }}
                          />
                          <div
                            className="fixed z-20 min-w-[120px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl ring-1 ring-zinc-800"
                            style={{ top: kolMenuPosition.top, left: kolMenuPosition.left }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setOpenKolMenuId(null);
                                setKolMenuPosition(null);
                                setEditingKolId(k.id);
                                setShowKolForm(true);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm("Delete this KOL deal? This cannot be undone.")) {
                                  deleteKol.mutate({ id: k.id });
                                  setOpenKolMenuId(null);
                                  setKolMenuPosition(null);
                                }
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="flex min-w-0 flex-col self-stretch rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/40">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">Community stats</h2>
            {teamData?.canEdit && (
              <button
                onClick={() => setShowCommunityForm(!showCommunityForm)}
                className="rounded-xl border border-zinc-600/60 bg-zinc-800/40 px-3.5 py-2 text-sm font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-[0.98]"
              >
                {showCommunityForm ? "Cancel" : "+ Add snapshot"}
              </button>
            )}
          </div>
          {showCommunityForm && (
            <>
              {createCommunityStat.error && (
                <p className="mb-2 text-sm text-red-400">{createCommunityStat.error.message}</p>
              )}
              <CommunityStatsWizard
                workspaceId={id}
                onSubmit={(data) => createCommunityStat.mutate(data)}
                onCancel={() => setShowCommunityForm(false)}
                loading={createCommunityStat.isPending}
              />
            </>
          )}
          {communityStats?.length === 0 && !showCommunityForm ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-700/80 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/60 ring-1 ring-zinc-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">No community stats yet</p>
              <p className="mt-1 text-xs text-zinc-600">Track Telegram and Discord member counts over time</p>
              {teamData?.canEdit && (
                <button
                  onClick={() => setShowCommunityForm(true)}
                  className="mt-4 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Add your first snapshot
                </button>
              )}
            </div>
          ) : (
            <div className="dashboard-panel-list min-h-0 flex-1">
              <ul className="space-y-2">
                {communityStats?.map((s) => (
                  <li
                    key={`${s.workspaceId}-${s.timestamp.toISOString()}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                  >
                    <span className="text-zinc-500">{new Date(s.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}</span>
                    <div className="community-stat-row text-sm">
                      <span className="text-sky-400">TG {s.telegramCount?.toLocaleString() ?? "—"}</span>
                      <span className="text-indigo-400">DC {s.discordCount?.toLocaleString() ?? "—"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
      </div>

      {/* Token info - fixed middle-right, persistent on scroll */}
      <aside className="fixed right-12 top-1/2 z-30 hidden w-64 -translate-y-1/2 lg:block">
        <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-900/20 ring-1 ring-zinc-800/40 shadow-xl shadow-black/30">
          {workspace.chain !== "solana" ? (
            <div className="p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Token</h2>
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-3">
                <p className="label text-[10px]">Contract</p>
                <div className="mt-0.5 flex items-start gap-1">
                  <p className="min-w-0 break-all font-mono text-xs text-zinc-400">{workspace.tokenContract}</p>
                  <CopyButton
                    value={workspace.tokenContract}
                    className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">Token metadata available for Solana only</p>
            </div>
          ) : tokenMeta ? (
            <>
              <div className="relative bg-gradient-to-br from-violet-500/10 via-zinc-900/50 to-emerald-500/5 px-6 pt-6 pb-5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(139,92,246,0.15),transparent)]" />
                <div className="relative flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/40 to-emerald-500/20 opacity-60 blur-md" />
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-lg ring-1 ring-zinc-700/50">
                      {tokenMeta.imageUrl ? (
                        <Image
                          src={tokenMeta.imageUrl}
                          alt={tokenMeta.name ?? tokenMeta.symbol ?? "Token"}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="flex h-full w-full items-center justify-center bg-zinc-800/80 text-2xl font-bold text-zinc-500"
                        style={{ display: tokenMeta.imageUrl ? "none" : "flex" }}
                      >
                        {(tokenMeta.symbol ?? "?")[0]}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-zinc-100">{tokenMeta.name ?? "—"}</p>
                  <p className="text-sm font-medium text-violet-400 opacity-90">{tokenMeta.symbol ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Decimals</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-200">{tokenMeta.decimals ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-2.5">
                  <p className="label text-[10px]">Supply</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-zinc-200" title={tokenMeta.supply?.toLocaleString()}>
                    {tokenMeta.supply != null
                      ? (() => {
                          const decimals = tokenMeta.decimals ?? 6;
                          const human = tokenMeta.supply / Math.pow(10, decimals);
                          if (human >= 1e12) return `${(human / 1e12).toFixed(1)}T`;
                          if (human >= 1e9) return `${(human / 1e9).toFixed(1)}B`;
                          if (human >= 1e6) return `${(human / 1e6).toFixed(1)}M`;
                          if (human >= 1e3) return `${(human / 1e3).toFixed(1)}K`;
                          return human.toLocaleString(undefined, { maximumFractionDigits: 0 });
                        })()
                      : "—"}
                  </p>
                </div>
                {tokenMeta.priceUsd != null && tokenMeta.priceUsd > 0 && (
                  <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                    <p className="label text-[10px] text-emerald-400/80">Price (USD)</p>
                    <p className="metric-value mt-0.5 text-base text-emerald-400">${formatPrice(tokenMeta.priceUsd)}</p>
                  </div>
                )}
                <div className="col-span-2 rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-2.5">
                  <p className="label text-[10px]">Mint</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <p className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">{workspace.tokenContract}</p>
                    <CopyButton
                      value={workspace.tokenContract}
                      className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : tokenMetaLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-zinc-800" />
              <p className="mt-3 text-sm text-zinc-500">Loading token…</p>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm text-zinc-500">Token metadata unavailable</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
