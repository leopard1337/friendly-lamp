"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { CampaignWizard } from "@/components/CampaignWizard";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const { id, campaignId } = use(params);
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const { data: session } = trpc.auth.me.useQuery();
  const { data: campaign, isLoading } = trpc.campaign.getById.useQuery(
    { id: campaignId },
    { enabled: !!session }
  );
  const { data: kolDeals } = trpc.kol.list.useQuery(
    { workspaceId: id },
    { enabled: !!session && !!campaign }
  );
  const { data: teamData } = trpc.team.list.useQuery(
    { workspaceId: id },
    { enabled: !!session && !!campaign }
  );
  const utils = trpc.useUtils();
  const updateCampaign = trpc.campaign.update.useMutation({
    onSuccess: () => {
      utils.campaign.getById.invalidate({ id: campaignId });
      setEditing(false);
    },
  });
  const deleteCampaign = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/workspace/${id}`);
    },
  });

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8">
        <p className="mb-4 text-zinc-500">Sign in to view campaign</p>
        <ConnectWallet />
      </div>
    );
  }

  if (isLoading || !campaign) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/60" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  const windowDeals = kolDeals?.filter(
    (k) =>
      !k.campaignId &&
      new Date(k.date) >= new Date(campaign.startedAt) &&
      new Date(k.date) <= new Date(campaign.startedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  ) ?? [];

  return (
    <div>
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-colors hover:text-zinc-300">
          Dashboard
        </Link>
        <span className="text-zinc-600">/</span>
        <Link href={`/dashboard/workspace/${id}`} className="transition-colors hover:text-zinc-300">
          Workspace
        </Link>
        <span className="text-zinc-600">/</span>
        <Link href={`/dashboard/workspace/${id}`} className="transition-colors hover:text-zinc-300">
          Campaigns
        </Link>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-400">Campaign</span>
      </nav>
      <Link
        href={`/dashboard/workspace/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to workspace
      </Link>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-zinc-100 capitalize">
            {campaign.type} campaign
          </h1>
          <p className="text-sm text-zinc-500">
            Started {new Date(campaign.startedAt).toLocaleString()}
          </p>
        </div>
        {teamData?.canEdit && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu(!openMenu)}
              className="rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Options"
              aria-expanded={openMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {openMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setOpenMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl ring-1 ring-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(false);
                      setEditing(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(false);
                      if (confirm("Delete this campaign? This cannot be undone.")) {
                        deleteCampaign.mutate({ id: campaignId });
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
      </div>

      {editing && (
        <div className="mb-8">
          {updateCampaign.error && (
            <p className="mb-2 text-sm text-red-400">{updateCampaign.error.message}</p>
          )}
          <CampaignWizard
            key={`edit-${campaignId}`}
            workspaceId={id}
            campaignId={campaignId}
            initialData={{
              type: campaign.type,
              startedAt: campaign.startedAt,
              notes: campaign.notes,
            }}
            onUpdate={(data) => updateCampaign.mutate(data)}
            onCancel={() => setEditing(false)}
            loading={updateCampaign.isPending}
          />
        </div>
      )}

      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Details
          </h2>
          <p className="text-zinc-300">
            <span className="capitalize">{campaign.type}</span>
            {campaign.notes && (
              <span className="ml-2 text-zinc-500">· {campaign.notes}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Started {new Date(campaign.startedAt).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>

        {windowDeals.length > 0 && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 ring-1 ring-zinc-800/50">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              KOL deals in window
            </h2>
            <ul className="space-y-2">
              {windowDeals.map((k) => (
                    <li key={k.id}>
                      <Link
                        href={`/dashboard/workspace/${id}/kol/${k.id}`}
                        className="block rounded-lg border border-zinc-800/80 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                      >
                        <span className="font-mono text-sm text-zinc-300">{k.walletOfKol.slice(0, 12)}...</span>
                        <span className="mx-2 text-zinc-600">·</span>
                        <span className="text-emerald-400">${Number(k.paidAmount)}</span>
                        <span className="mx-2 text-zinc-600">·</span>
                        <span className="text-zinc-500">{new Date(k.date).toLocaleDateString()}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
      </div>
    </div>
  );
}
