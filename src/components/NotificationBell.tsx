"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: invites, isLoading } = trpc.team.myInvites.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const utils = trpc.useUtils();
  const acceptInvite = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      utils.team.myInvites.invalidate();
    },
  });
  const rejectInvite = trpc.team.rejectInvite.useMutation({
    onSuccess: () => {
      utils.team.myInvites.invalidate();
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = invites?.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-zinc-600/80 bg-zinc-800/30 p-2.5 text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-medium text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50">
          <div className="border-b border-zinc-700 px-4 py-3">
            <h3 className="font-medium text-zinc-200">Invitations</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-zinc-500">Loading...</p>
            ) : invites?.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No pending invitations</p>
            ) : (
              invites?.map((inv) => (
                <div
                  key={`${inv.workspaceId}-${inv.walletId}`}
                  className="border-b border-zinc-800 p-4 last:border-0"
                >
                  <p className="text-sm text-zinc-300">
                    Invited to <strong>{inv.workspace.name}</strong> as{" "}
                    <span className="text-violet-400">{inv.role}</span>
                  </p>
                  {(acceptInvite.error || rejectInvite.error) && (
                    <p className="mb-2 text-xs text-red-400">
                      {acceptInvite.error?.message ?? rejectInvite.error?.message}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        acceptInvite.mutate(
                          { workspaceId: inv.workspaceId },
                          {
                            onSuccess: () => {
                              setOpen(false);
                              router.push(`/dashboard/workspace/${inv.workspaceId}`);
                            },
                          }
                        );
                      }}
                      disabled={acceptInvite.isPending}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {acceptInvite.isPending ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      onClick={() => rejectInvite.mutate({ workspaceId: inv.workspaceId })}
                      disabled={rejectInvite.isPending}
                      className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {rejectInvite.isPending ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
