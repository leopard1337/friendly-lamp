import { env } from "./env";

const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${env.heliusApiKey}`;

/** Allow only https URLs to avoid javascript: or other schemes. */
function sanitizeImageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

type TokenAccount = { owner?: string; amount?: number | string };

/**
 * Fetches holder count, total supply, and top-10 concentration for a token.
 * Used for snapshots and health score calculation.
 */
export async function getTokenHolderStats(mint: string): Promise<{
  holderCount: number;
  totalSupply: number;
  top10Concentration: number | null;
}> {
  const ownerBalances = new Map<string, number>();
  let totalSupply = 0;
  let cursor: string | undefined;

  for (let i = 0; i < 100; i++) {
    const body: Record<string, unknown> = {
      jsonrpc: "2.0",
      id: "1",
      method: "getTokenAccounts",
      params: { mint, limit: 1000 },
    };
    if (cursor) (body.params as Record<string, unknown>).cursor = cursor;

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Helius RPC error: ${res.status}`);

    const data = (await res.json()) as {
      result?: {
        token_accounts?: TokenAccount[];
        cursor?: string;
      };
    };
    const accounts = data.result?.token_accounts ?? [];
    for (const acc of accounts) {
      const owner = acc.owner;
      const amount = Number(acc.amount ?? 0);
      if (owner && amount > 0) {
        ownerBalances.set(owner, (ownerBalances.get(owner) ?? 0) + amount);
        totalSupply += amount;
      }
    }

    cursor = data.result?.cursor;
    if (!cursor || accounts.length < 1000) break;
  }

  let top10Concentration: number | null = null;
  if (totalSupply > 0 && ownerBalances.size > 0) {
    const sorted = [...ownerBalances.values()].sort((a, b) => b - a);
    const top10Sum = sorted.slice(0, 10).reduce((s, v) => s + v, 0);
    top10Concentration = (top10Sum / totalSupply) * 100;
  }

  return {
    holderCount: ownerBalances.size,
    totalSupply,
    top10Concentration,
  };
}

/**
 * Fetches token metadata (name, symbol, decimals, supply, price, logo) via Helius DAS getAsset.
 * Returns null if the token is not found or not on Solana.
 */
export async function getTokenMetadata(mint: string): Promise<{
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  supply: number | null;
  priceUsd: number | null;
  tokenProgram: string | null;
  imageUrl: string | null;
} | null> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "token-metadata",
      method: "getAsset",
      params: { id: mint },
    }),
  });
  if (!res.ok) return null;

  let data: { result?: unknown; error?: { code?: number; message?: string } };
  try {
    const text = await res.text();
    data = JSON.parse(text) as typeof data;
  } catch {
    return null;
  }

  const typedData = data as {
    result?: {
      id?: string;
      content?: {
        metadata?: { name?: string; symbol?: string };
        files?: Array<{ uri?: string; cdn_uri?: string; mime?: string }>;
        links?: { image?: string };
      };
      token_info?: {
        decimals?: number;
        supply?: number;
        token_program?: string;
        price_info?: { price_per_token?: number };
      };
    };
    error?: { code?: number; message?: string };
  };

  if (typedData.error || !typedData.result) return null;

  const r = typedData.result;
  const metadata = r.content?.metadata;
  const tokenInfo = r.token_info;
  const content = r.content;

  let imageUrl: string | null = null;
  if (content?.links?.image) {
    imageUrl = sanitizeImageUrl(content.links.image);
  } else if (content?.files?.length) {
    const img = content.files.find((f) => !f.mime || f.mime.startsWith("image/"));
    const raw = img?.cdn_uri ?? img?.uri ?? null;
    imageUrl = raw ? sanitizeImageUrl(raw) : null;
  }
  if (!imageUrl) {
    imageUrl = `https://img.raydium.io/icon/${mint}.png`;
  }

  return {
    name: metadata?.name ?? null,
    symbol: metadata?.symbol ?? null,
    decimals: tokenInfo?.decimals ?? null,
    supply: tokenInfo?.supply ?? null,
    priceUsd: tokenInfo?.price_info?.price_per_token ?? null,
    tokenProgram: tokenInfo?.token_program ?? null,
    imageUrl,
  };
}
