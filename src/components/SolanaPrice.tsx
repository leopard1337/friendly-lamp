"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
const POLL_MS = 30_000;

function formatSolPrice(usd: number): string {
  if (usd >= 1000) return usd.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (usd >= 1) return usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return usd.toFixed(4);
}

export function SolanaPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPrice = async () => {
    try {
      const res = await fetch(COINGECKO_URL);
      const data = (await res.json()) as { solana?: { usd?: number } };
      const usd = data?.solana?.usd;
      if (typeof usd === "number") {
        setPrice(usd);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const id = setInterval(fetchPrice, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="h-4 w-4 animate-pulse rounded bg-zinc-600" />
        <span>SOL —</span>
      </div>
    );
  }

  if (error || price == null) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Image
          src="https://cryptologos.cc/logos/solana-sol-logo.png"
          alt="SOL"
          width={16}
          height={16}
          className="shrink-0"
        />
        <span>SOL —</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <Image
        src="https://cryptologos.cc/logos/solana-sol-logo.png"
        alt="SOL"
        width={16}
        height={16}
        className="shrink-0"
      />
      <span className="font-medium text-emerald-400">${formatSolPrice(price)}</span>
    </div>
  );
}
