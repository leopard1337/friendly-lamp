const BASE = "https://api.dexscreener.com";

export type DexScreenerPair = {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string };
  quoteToken: { address: string; symbol: string };
  priceUsd?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

export async function getTokenPairs(chainId: string, tokenAddress: string): Promise<DexScreenerPair[]> {
  const res = await fetch(`${BASE}/token-pairs/v1/${chainId}/${tokenAddress}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.pairs ?? [];
}

export async function getTokenPriceVolume(chainId: string, tokenAddress: string) {
  const pairs = await getTokenPairs(chainId, tokenAddress);
  const top = pairs[0];
  if (!top) return null;
  return {
    priceUsd: top.priceUsd ? parseFloat(top.priceUsd) : null,
    volume24h: top.volume?.h24 ?? null,
    liquidityUsd: top.liquidity?.usd ?? null,
  };
}
