import { NextResponse } from "next/server";
import { getTokenHolderStats } from "@/lib/helius";
import { computeHealthScore } from "@/lib/health-score";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Solana mint addresses are base58, 32–44 chars */
function isValidMint(mint: string): boolean {
  const trimmed = mint.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

export async function POST(req: Request) {
  const { ok, retryAfter } = checkRateLimit(req, {
    prefix: "tool-lookup",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  try {
    const body = await req.json();
    const mint = typeof body?.mint === "string" ? body.mint.trim() : "";
    if (!mint || !isValidMint(mint)) {
      return NextResponse.json(
        { error: "Invalid token address. Paste a valid Solana mint address (32–44 characters)." },
        { status: 400 }
      );
    }

    const stats = await getTokenHolderStats(mint);
    const healthScore = computeHealthScore(
      stats.holderCount,
      null,
      stats.top10Concentration
    );

    return NextResponse.json({
      holderCount: stats.holderCount,
      healthScore,
      top10Concentration: stats.top10Concentration,
      totalSupply: stats.totalSupply,
    });
  } catch (err) {
    console.error("Token lookup error:", err);
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json(
      { error: message.includes("Helius") ? "Token not found or RPC error. Try again." : message },
      { status: 500 }
    );
  }
}
