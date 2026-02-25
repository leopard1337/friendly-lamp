import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getTokenHolderStats } from "@/lib/helius";
import { computeHealthScore } from "@/lib/health-score";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Cron endpoint: either enqueue jobs (Redis available) or run inline.
 * Set CRON_USE_QUEUE=true to enqueue jobs for the BullMQ worker.
 * Otherwise runs inline (Vercel cron, no worker needed).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !secret) {
    return NextResponse.json({ error: "CRON_SECRET required in production" }, { status: 401 });
  }
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const workspaces = await db.workspace.findMany({
    where: { chain: "solana" },
  });

  const useQueue = process.env.CRON_USE_QUEUE === "true";

  if (useQueue) {
    try {
      const { snapshotQueue } = await import("@/lib/queue");
      for (const ws of workspaces) {
        await snapshotQueue.add("snapshot", { workspaceId: ws.id });
      }
      return NextResponse.json({ ok: true, queued: workspaces.length });
    } catch (e) {
      console.error("Failed to enqueue snapshots:", e);
      return NextResponse.json(
        { error: "Queue failed. Ensure Redis is running when CRON_USE_QUEUE=true." },
        { status: 500 }
      );
    }
  }

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

  return NextResponse.json({ ok: true, count: workspaces.length });
}
