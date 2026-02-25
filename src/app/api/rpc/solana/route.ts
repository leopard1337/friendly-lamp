/**
 * Server-side Solana RPC proxy. Keeps HELIUS_API_KEY on the server.
 * Client uses /api/rpc/solana instead of embedding the API key.
 */
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Allowed RPC methods to prevent abuse. */
const ALLOWED_METHODS = new Set([
  "getAccountInfo", "getBalance", "getBlock", "getBlockHeight", "getBlockProduction",
  "getBlockCommitment", "getBlocks", "getBlocksWithLimit", "getClusterNodes",
  "getEpochInfo", "getEpochSchedule", "getFeeForMessage", "getFirstAvailableBlock",
  "getGenesisHash", "getHealth", "getHighestSnapshotSlot", "getIdentity",
  "getInflationGovernor", "getInflationRate", "getInflationReward", "getLargestAccounts",
  "getLatestBlockhash", "getMaxRetransmitSlot", "getMaxShredInsertSlot", "getMinimumBalanceForRentExemption",
  "getMultipleAccounts", "getProgramAccounts", "getRecentPerformanceSamples",
  "getRecentPrioritizationFees", "getSignaturesForAddress", "getSignatureStatuses",
  "getSlot", "getSlotLeader", "getSlotLeaders", "getStakeActivation", "getStakeMinimumDelegation",
  "getSupply", "getTokenAccountBalance", "getTokenAccountsByDelegate", "getTokenAccountsByOwner",
  "getTokenLargestAccounts", "getTokenSupply", "getTransaction", "getTransactionCount",
  "getVersion", "getVoteAccounts", "isBlockhashValid", "minimumBalanceForRentExemption",
  "requestAirdrop", "sendTransaction", "simulateTransaction",
  "getAssetsByOwner", "getAsset", "getTokenAccounts", "getProgramAccounts",
]);

function isValidRpcBody(body: unknown): body is { jsonrpc?: string; method?: string; params?: unknown; id?: unknown } {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (typeof o.method !== "string" || !o.method.trim()) return false;
  if (!ALLOWED_METHODS.has(o.method)) return false;
  return true;
}

export async function POST(req: Request) {
  const { ok, retryAfter } = checkRateLimit(req, { prefix: "rpc", maxRequests: 60 });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  const apiKey = process.env.HELIUS_API_KEY;
  const url = apiKey
    ? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
    : "https://api.mainnet-beta.solana.com";

  try {
    const raw = await req.text();
    let body: unknown;
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, { status: 400 });
    }
    if (!isValidRpcBody(body)) {
      const id = body && typeof body === "object" && "id" in body ? (body as { id: unknown }).id : null;
      return NextResponse.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid request" }, id }, { status: 400 });
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("RPC proxy error:", err);
    return NextResponse.json({ error: "RPC proxy failed" }, { status: 500 });
  }
}
