"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import Link from "next/link";
export default function NewWorkspacePage() {
  const router = useRouter();
  const { data: session } = trpc.auth.me.useQuery();
  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: (data) => router.push(`/dashboard/workspace/${data.id}`),
  });
  const [name, setName] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [chain, setChain] = useState<"solana" | "evm">("solana");

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
        <p className="mb-4 text-zinc-400">Sign in to create a workspace</p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-50">New Workspace</h1>
        <p className="mb-8 text-sm text-zinc-500">Create a workspace to track a token&apos;s holders and campaigns</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createWorkspace.mutate({ name, tokenContract, chain });
          }}
          className="space-y-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 ring-1 ring-zinc-800/40"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Token"
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2.5 text-zinc-50 placeholder-zinc-500 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Token Contract</label>
            <input
              type="text"
              value={tokenContract}
              onChange={(e) => setTokenContract(e.target.value)}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2.5 font-mono text-sm text-zinc-50 placeholder-zinc-500 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Mint or contract address"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Chain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as "solana" | "evm")}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2.5 text-zinc-50 transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="solana">Solana</option>
              <option value="evm">EVM</option>
            </select>
          </div>
          {createWorkspace.error && (
            <p className="text-sm text-red-400">{createWorkspace.error.message}</p>
          )}
          <button
            type="submit"
            disabled={createWorkspace.isPending}
            className="btn-primary w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
          >
            {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
