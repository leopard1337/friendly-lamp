"use client";

import { useCallback, useState, useEffect } from "react";
import bs58 from "bs58";
import { trpc } from "@/trpc/client";

declare global {
  interface Window {
    solana?: {
      publicKey: { toBase58: () => string };
      signMessage: (message: Uint8Array) => Promise<Uint8Array>;
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      on: (event: string, cb: () => void) => void;
    };
  }
}

export function ConnectWallet() {
  const [phantom, setPhantom] = useState<typeof window.solana | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.me.useQuery();

  useEffect(() => {
    const p = window.solana;
    if (p) {
      setPhantom(p);
      p.on("connect", () => {
        setConnected(true);
        setAddress(p.publicKey?.toBase58() ?? null);
      });
      p.on("disconnect", () => {
        setConnected(false);
        setAddress(null);
      });
      if (p.publicKey) {
        setConnected(true);
        setAddress(p.publicKey.toBase58());
      }
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (!phantom) {
      setError("Phantom wallet not installed. Install from phantom.app");
      return;
    }
    setError(null);
    try {
      await phantom.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [phantom]);

  const handleSignIn = useCallback(async () => {
    if (!phantom?.publicKey || !phantom.signMessage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: phantom.publicKey.toBase58(),
          chain: "solana",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get nonce");

      const { message } = data;
      const messageBytes = new TextEncoder().encode(message);

      let signatureBase58: string;
      const req = (phantom as { request?: (opts: unknown) => Promise<unknown> }).request;
      if (typeof req === "function") {
        const result = (await req({
          method: "signMessage",
          params: { message: messageBytes, display: "utf8" },
        })) as { signature?: string | Uint8Array };
        const sig = result?.signature;
        signatureBase58 =
          typeof sig === "string" ? sig : sig instanceof Uint8Array ? bs58.encode(sig) : "";
      } else {
        const sig = await phantom.signMessage(messageBytes);
        const raw = sig instanceof Uint8Array ? sig : (sig as { signature?: Uint8Array }).signature;
        signatureBase58 = raw ? bs58.encode(raw) : "";
      }

      if (!signatureBase58) {
        throw new Error("No signature received from wallet");
      }

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: phantom.publicKey.toBase58(),
          signature: signatureBase58,
          message,
          chain: "solana",
        }),
      });

      if (!verifyRes.ok) {
        const d = (await verifyRes.json()) as { error?: string; details?: string };
        throw new Error(d.details ? `${d.error}: ${d.details}` : d.error ?? "Verification failed");
      }
      await utils.auth.me.invalidate();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [phantom, utils]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await utils.auth.me.invalidate();
    window.location.reload();
  }, [utils]);

  const handleDisconnect = useCallback(async () => {
    if (phantom) await phantom.disconnect();
    setConnected(false);
    setAddress(null);
  }, [phantom]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/10">
        {error}
      </div>
    );
  }

  if (!phantom) {
    return (
      <a
        href="https://phantom.app"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Install Phantom
      </a>
    );
  }

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="btn-primary inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
      >
        Connect Wallet
      </button>
    );
  }

  if (session?.walletAddress === address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-zinc-800/60 px-3 py-1.5 font-mono text-sm text-zinc-400 ring-1 ring-zinc-700/50">
          {session.walletAddress.slice(0, 4)}...{session.walletAddress.slice(-4)}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-xl border border-zinc-600/80 px-3 py-1.5 text-sm text-zinc-400 transition-all hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-300"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-xl bg-zinc-800/60 px-3 py-1.5 font-mono text-sm text-zinc-400 ring-1 ring-zinc-700/50">
        {address?.slice(0, 4)}...{address?.slice(-4)}
      </span>
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="btn-primary rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "Signing…" : "Sign In"}
      </button>
      <button
        onClick={handleDisconnect}
        className="rounded-xl border border-zinc-600/80 px-3 py-1.5 text-sm text-zinc-400 transition-all hover:bg-zinc-800/80 active:scale-[0.98]"
      >
        Disconnect
      </button>
    </div>
  );
}
