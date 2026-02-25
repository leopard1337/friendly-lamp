"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NotificationBell } from "@/components/NotificationBell";
import { SolanaPrice } from "@/components/SolanaPrice";
import { TokenLookup } from "@/components/TokenLookup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = trpc.auth.me.useQuery();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-dashboard">
      <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100 sm:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </>
                )}
              </svg>
            </button>
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
              <span className="hidden font-semibold tracking-tight sm:inline">Dashboard</span>
            </Link>
          </div>
          <div className="hidden flex-1 justify-center sm:flex">
            <TokenLookup variant="compact" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <SolanaPrice />
            <div className="h-4 w-px shrink-0 bg-zinc-700/60" aria-hidden />
            {session && <NotificationBell />}
            <ConnectWallet />
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-zinc-800/50 bg-zinc-950/95 px-4 py-4 sm:hidden">
            <div className="mb-4 flex justify-center">
              <SolanaPrice />
            </div>
            <div className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-800/60"
              >
                Workspaces
              </Link>
              <Link
                href="/dashboard/workspace/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-800/60"
              >
                New Workspace
              </Link>
              <Link
                href="/dashboard/watchlist"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-800/60"
              >
                Watchlist
              </Link>
              <Link
                href="/tool"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-800/60"
              >
                Token Lookup
              </Link>
              <div className="pt-2">
                <TokenLookup variant="compact" />
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
