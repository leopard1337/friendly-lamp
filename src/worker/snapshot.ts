import { createSnapshotWorker } from "@/lib/queue";
import { getTokenHolderStats } from "@/lib/helius";
import { computeHealthScore } from "@/lib/health-score";
import { db } from "@/server/db";

const worker = createSnapshotWorker(async (job) => {
  const { workspaceId } = job.data;
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace || workspace.chain !== "solana") return;

  const stats = await getTokenHolderStats(workspace.tokenContract);
  const prev = await db.holderSnapshot.findFirst({
    where: { workspaceId },
    orderBy: { timestamp: "desc" },
  });
  const healthScore = computeHealthScore(
    stats.holderCount,
    prev?.holderCount ?? null,
    stats.top10Concentration ?? prev?.top10Concentration ?? null
  );
  const now = new Date();

  await db.holderSnapshot.upsert({
    where: {
      workspaceId_timestamp: { workspaceId, timestamp: now },
    },
    create: {
      workspaceId,
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
});

worker.on("completed", (job) => console.log("Snapshot completed:", job.id));
worker.on("failed", (job, err) => console.error("Snapshot failed:", job?.id, err));
