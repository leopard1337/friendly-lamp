import type { PrismaClient } from "@prisma/client";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between triggers per alert

export async function checkAlerts(
  db: PrismaClient,
  workspaceId: string,
  holderCount: number,
  healthScore: number | null
) {
  const alerts = await db.alert.findMany({
    where: { workspaceId },
  });

  for (const alert of alerts) {
    const value = alert.type === "holder_count" ? holderCount : (healthScore ?? 0);
    const crossed =
      alert.operator === "above"
        ? value >= alert.threshold
        : value <= alert.threshold;

    if (!crossed) continue;

    const lastTriggered = alert.lastTriggered?.getTime() ?? 0;
    if (Date.now() - lastTriggered < COOLDOWN_MS) continue;

    const typeLabel = alert.type === "holder_count" ? "Holder count" : "Health score";
    const opLabel = alert.operator === "above" ? "above" : "below";
    const message = `${typeLabel} crossed ${opLabel} ${alert.threshold} (current: ${value})`;

    await db.$transaction([
      db.alertNotification.create({
        data: {
          workspaceId,
          alertId: alert.id,
          message,
          value,
        },
      }),
      db.alert.update({
        where: { id: alert.id },
        data: { lastTriggered: new Date() },
      }),
    ]);
  }
}
