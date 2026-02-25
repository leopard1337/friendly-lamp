"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/trpc/client";

const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];

export function TeamDropdown({
  workspaceId,
  isAdmin,
}: {
  workspaceId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"add" | "remove" | "edit" | null>(null);
  const [addAddress, setAddAddress] = useState("");
  const [addRole, setAddRole] = useState<Role>("viewer");
  const [editWalletId, setEditWalletId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<(typeof ROLES)[number]>("viewer");
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.team.list.useQuery(
    { workspaceId },
    { enabled: open && !!workspaceId }
  );
  const utils = trpc.useUtils();
  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate({ workspaceId });
      setSubmenu(null);
      setAddAddress("");
    },
  });
  const remove = trpc.team.remove.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate({ workspaceId });
      setSubmenu(null);
      setEditWalletId(null);
    },
  });
  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate({ workspaceId });
      setSubmenu(null);
      setEditWalletId(null);
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border border-zinc-600/60 bg-zinc-800/40 px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200 active:scale-[0.98]"
      >
        Team
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[260px] rounded-xl border border-zinc-800/80 bg-zinc-900/95 shadow-2xl shadow-black/50 ring-1 ring-zinc-800/60">
          {data?.members?.filter((m) => m.status === "invited").length ? (
            <div className="border-b border-zinc-700 px-4 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Pending invites</p>
              <div className="space-y-1.5">
                {data.members
                  .filter((m) => m.status === "invited")
                  .map((m) => (
                    <div
                      key={m.walletId}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-zinc-400">
                        {m.wallet.address.length > 12
                          ? `${m.wallet.address.slice(0, 6)}...${m.wallet.address.slice(-4)}`
                          : m.wallet.address}
                      </span>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-400/90 ring-1 ring-amber-400/30">
                        Pending
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          <div className="py-1">
            <button
              onClick={() => setSubmenu(submenu === "add" ? null : "add")}
              className="flex w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Add
            </button>
            <button
              onClick={() => setSubmenu(submenu === "remove" ? null : "remove")}
              className="flex w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Remove
            </button>
            <button
              onClick={() => setSubmenu(submenu === "edit" ? null : "edit")}
              className="flex w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Edit
            </button>
          </div>

          {submenu === "add" && (
            <div className="border-t border-zinc-700 p-4">
              <label className="mb-2 block text-xs text-zinc-500">Wallet address</label>
              <input
                type="text"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                className="mb-3 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500"
              />
              <label className="mb-2 block text-xs text-zinc-500">Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as Role)}
                className="mb-3 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "admin" ? "Administrator" : r === "editor" ? "Editor" : "View only"}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  invite.mutate({
                    workspaceId,
                    walletAddress: addAddress.trim(),
                    role: addRole,
                  })
                }
                disabled={!addAddress.trim() || invite.isPending}
                className="w-full rounded bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {invite.isPending ? "Sending..." : "Send invite"}
              </button>
              {invite.error && (
                <p className="mt-2 text-xs text-red-400">{invite.error.message}</p>
              )}
            </div>
          )}

          {submenu === "remove" && (
            <div className="max-h-56 overflow-y-auto border-t border-zinc-700 p-4">
              <p className="mb-2 text-xs text-zinc-500">Select to remove or cancel invite</p>
              {isLoading ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : (
                <div className="space-y-1">
                  {data?.members
                    ?.filter((m) => m.role !== "owner" && (m.status === "active" || m.status === "invited"))
                    .map((m) => (
                      <button
                        key={m.walletId}
                        onClick={() =>
                          remove.mutate({ workspaceId, walletId: m.walletId })
                        }
                        disabled={remove.isPending}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                      >
                        <span className="font-mono text-xs">
                          {m.wallet.address.length > 12
                            ? `${m.wallet.address.slice(0, 6)}...${m.wallet.address.slice(-4)}`
                            : m.wallet.address}
                        </span>
                        <span className={m.status === "invited" ? "text-amber-400" : "text-red-400"}>
                          {m.status === "invited" ? "Cancel invite" : "Remove"}
                        </span>
                      </button>
                    ))}
                  {data?.members?.filter((m) => m.role !== "owner" && (m.status === "active" || m.status === "invited")).length === 0 && (
                    <p className="text-sm text-zinc-500">No members or pending invites</p>
                  )}
                </div>
              )}
            </div>
          )}

          {submenu === "edit" && (
            <div className="max-h-48 overflow-y-auto border-t border-zinc-700 p-4">
              {updateRole.error && (
                <p className="mb-2 text-xs text-red-400">{updateRole.error.message}</p>
              )}
              <p className="mb-2 text-xs text-zinc-500">Select member to change role</p>
              {isLoading ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : editWalletId ? (
                <div>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="mb-2 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r === "admin" ? "Administrator" : r === "editor" ? "Editor" : "View only"}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateRole.mutate({
                          workspaceId,
                          walletId: editWalletId,
                          role: editRole,
                        })
                      }
                      disabled={updateRole.isPending}
                      className="rounded bg-violet-600 px-3 py-1 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditWalletId(null);
                      }}
                      className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {data?.members
                    ?.filter((m) => m.status === "active" && m.role !== "owner")
                    .map((m) => (
                      <button
                        key={m.walletId}
                        onClick={() => {
                          setEditWalletId(m.walletId);
                          setEditRole((m.role as Role) || "viewer");
                        }}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-800"
                      >
                        <span className="font-mono text-xs">
                          {m.wallet.address.length > 12
                            ? `${m.wallet.address.slice(0, 6)}...${m.wallet.address.slice(-4)}`
                            : m.wallet.address}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-400/90 ring-1 ring-emerald-400/30">
                            Active
                          </span>
                          <span className="text-violet-400">{m.role}</span>
                        </span>
                      </button>
                    ))}
                  {data?.members?.filter((m) => m.status === "active" && m.role !== "owner").length === 0 && (
                    <p className="text-sm text-zinc-500">No active members to edit</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
