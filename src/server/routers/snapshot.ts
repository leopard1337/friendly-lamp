import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getTokenHolderStats } from "@/lib/helius";
import { computeHealthScore } from "@/lib/health-score";

export const snapshotRouter = router({
  run: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
      });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      if (workspace.chain !== "solana") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Snapshots only supported for Solana" });
      }
      if (!process.env.HELIUS_API_KEY) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Helius API key not configured" });
      }
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const stats = await getTokenHolderStats(workspace.tokenContract);
      const prev = await ctx.db.holderSnapshot.findFirst({
        where: { workspaceId: input.workspaceId },
        orderBy: { timestamp: "desc" },
      });
      const healthScore = computeHealthScore(
        stats.holderCount,
        prev?.holderCount ?? null,
        stats.top10Concentration ?? prev?.top10Concentration ?? null
      );
      const now = new Date();
      await ctx.db.holderSnapshot.upsert({
        where: {
          workspaceId_timestamp: { workspaceId: input.workspaceId, timestamp: now },
        },
        create: {
          workspaceId: input.workspaceId,
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
      return { holderCount: stats.holderCount, timestamp: now };
    }),

  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        limit: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.holderSnapshot.findMany({
        where: {
          workspaceId: input.workspaceId,
          ...(input.from && { timestamp: { gte: input.from } }),
          ...(input.to && { timestamp: { lte: input.to } }),
        },
        orderBy: { timestamp: "desc" },
        take: input.limit,
      });
    }),
});
