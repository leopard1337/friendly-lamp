"use client";

import dynamic from "next/dynamic";
import { trpc } from "@/trpc/client";
import { ConnectWallet } from "@/components/ConnectWallet";
import { SpotlightCard } from "@/components/SpotlightCard";
import { SplitText } from "@/components/SplitText";
import { Typewriter } from "@/components/Typewriter";
import Link from "next/link";
import Image from "next/image";
import { SolanaPrice } from "@/components/SolanaPrice";

const Squares = dynamic(() => import("@/components/Squares").then((m) => m.default), { ssr: false });

const FEATURES = [
  {
    title: "Holder Tracking",
    description: "Track holder count over time with automatic snapshots",
  },
  {
    title: "KOL Attribution",
    description: "Log deals and see exactly which KOLs drove growth",
  },
  {
    title: "Health Score",
    description: "Know your token's distribution health at a glance",
  },
] as const;

export default function Home() {
  const { data, isLoading, error } = trpc.health.check.useQuery(undefined, { staleTime: 60_000 });

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="fixed inset-0 z-0">
        <Squares
          direction="down"
          speed={0.5}
          squareSize={64}
          borderColor="#271E37"
          hoverFillColor="#222222"
        />
      </div>
      <header className="relative z-10 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 className="flex shrink-0 items-center gap-3 text-xl font-semibold tracking-tight text-zinc-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400 ring-1 ring-zinc-700/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </span>
            Token Analytics
          </h1>
          <div className="flex flex-1 justify-center">
            <SolanaPrice />
          </div>
          <ConnectWallet />
        </div>
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl text-center">
          <SplitText
            text="Holder tracking and KOL attribution for token teams"
            tag="h2"
            className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg md:text-xl"
          />
          <p className="mt-4 text-base text-zinc-300">
            <Typewriter text="See how your campaigns move the needle. Connect your wallet to get started." speed={40} delay={1200} />
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/tool"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/60 bg-zinc-800/40 px-6 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700/50 hover:text-zinc-100"
            >
              Token Lookup
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500"
            >
              Go to Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 [content-visibility:auto]">
            {FEATURES.map((f) => (
              <SpotlightCard key={f.title} className="p-5 text-left">
                <h3 className="font-semibold text-zinc-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-500">{f.description}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </main>
      <footer className="relative z-10 mt-auto border-t border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white">
            <span>Token Analytics · Built on</span>
            <span className="flex items-center gap-1.5">
              <Image
                src="https://cryptologos.cc/logos/solana-sol-logo.png"
                alt="Solana"
                width={16}
                height={16}
                className="shrink-0"
                priority
              />
              Solana
            </span>
            <span className="hidden sm:inline text-zinc-500">·</span>
            <span className="flex items-center gap-2 text-zinc-500">
              {isLoading && <span className="text-zinc-600">Connecting…</span>}
              {error && <span className="text-red-400">Error</span>}
              {data && (
                <span>
                  API <span className={data.ok ? "text-emerald-400" : "text-red-400"}>{data.ok ? "online" : "error"}</span>
                </span>
              )}
            </span>
          </div>
          <div className="flex shrink-0 items-center justify-center">
            <SolanaPrice />
          </div>
          <div className="flex items-center gap-4 text-sm text-white sm:justify-end">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Github
            </a>
            <span className="text-zinc-500">|</span>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <Image
                src="https://img.freepik.com/free-vector/new-2023-twitter-logo-x-icon-design_1017-45418.jpg?semt=ais_user_personalization&w=740&q=80"
                alt="X"
                width={18}
                height={18}
                loading="lazy"
              />
              Twitter(X)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
