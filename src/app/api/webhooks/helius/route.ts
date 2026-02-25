import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getTokenHolderStats } from "@/lib/helius";
import { computeHealthScore } from "@/lib/health-score";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Verify Helius webhook: set HELIUS_WEBHOOK_SECRET when creating the webhook; Helius echoes it in Authorization. */
function verifyHeliusWebhook(req: Request): boolean {
  const secret = process.env.HELIUS_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || auth === secret;
}

export async function POST(req: Request) {
  if (!verifyHeliusWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { accountData } = body as {
      accountData?: Array<{
        tokenBalanceChanges?: Array<{ mint?: string }>;
      }>;
    };

    if (!accountData || !Array.isArray(accountData)) {
      return NextResponse.json({ received: true });
    }

    const mints = new Set<string>();
    for (const acc of accountData) {
      for (const change of acc.tokenBalanceChanges ?? []) {
        if (change.mint) mints.add(change.mint);
      }
    }

    if (mints.size === 0) return NextResponse.json({ received: true });

    const workspaces = await db.workspace.findMany({
      where: {
        tokenContract: { in: [...mints] },
        chain: "solana",
      },
    });

    const now = new Date();
    await Promise.all(
      workspaces.map(async (ws) => {
        try {
          const stats = await getTokenHolderStats(ws.tokenContract);
          const prev = await db.holderSnapshot.findFirst({
            where: { workspaceId: ws.id },
            orderBy: { timestamp: "desc" },
          });
          const healthScore = computeHealthScore(
            stats.holderCount,
            prev?.holderCount ?? null,
            stats.top10Concentration ?? prev?.top10Concentration ?? null
          );
          await db.holderSnapshot.upsert({
            where: {
              workspaceId_timestamp: { workspaceId: ws.id, timestamp: now },
            },
            create: {
              workspaceId: ws.id,
              timestamp: now,
              holderCount: stats.holderCount,
              top10Concentration: stats.top10Concentration,
              healthScore,
            },
            update: {
              holderCount: stats.holderCount,
              top10Concentration: stats.top10Concentration,
              healthScore,
            },
          });
        } catch (e) {
          console.error("Snapshot failed for workspace", ws.id, e);
        }
      })
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Helius webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
