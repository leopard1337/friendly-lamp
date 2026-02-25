"use client";

import Link from "next/link";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NotificationBell } from "@/components/NotificationBell";
import { TokenLookup } from "@/components/TokenLookup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = trpc.auth.me.useQuery();
  return (
    <div className="min-h-screen bg-dashboard">
      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link
            href="/dashboard"
            className="flex w-fit items-center gap-2.5 rounded-xl px-3 py-2 text-zinc-400 transition-all duration-200 hover:bg-zinc-800/40 hover:text-zinc-100 active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-700/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </span>
            <span className="font-semibold tracking-tight">Dashboard</span>
          </Link>
          <div className="flex justify-center justify-self-center">
            <TokenLookup variant="compact" />
          </div>
          <div className="flex items-center justify-end justify-self-end gap-2 sm:gap-3">
            {session && <NotificationBell />}
            <ConnectWallet />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
