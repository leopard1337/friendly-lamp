import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getTokenPriceVolume } from "@/lib/dexscreener";
import { getTokenPrice } from "@/lib/geckoterminal";

export const attributionRouter = router({
  forKolDeal: protectedProcedure
    .input(z.object({ kolDealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.kolDeal.findUnique({
        where: { id: input.kolDealId },
        include: { workspace: true },
      });
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: deal.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const dealDate = deal.date;
      const windowStart = new Date(dealDate);
      windowStart.setHours(windowStart.getHours() - 24);
      const windowEnd = new Date(dealDate);
      windowEnd.setHours(windowEnd.getHours() + 24);

      const snapshots = await ctx.db.holderSnapshot.findMany({
        where: {
          workspaceId: deal.workspaceId,
          timestamp: { gte: windowStart, lte: windowEnd },
        },
        orderBy: { timestamp: "asc" },
      });

      const beforeSnapshot = await ctx.db.holderSnapshot.findFirst({
        where: {
          workspaceId: deal.workspaceId,
          timestamp: { lt: windowStart },
        },
        orderBy: { timestamp: "desc" },
      });
      const afterSnapshot = await ctx.db.holderSnapshot.findFirst({
        where: {
          workspaceId: deal.workspaceId,
          timestamp: { gt: windowEnd },
        },
        orderBy: { timestamp: "asc" },
      });
      const latestSnapshot = await ctx.db.holderSnapshot.findFirst({
        where: { workspaceId: deal.workspaceId },
        orderBy: { timestamp: "desc" },
      });

      const beforeHolders = beforeSnapshot?.holderCount ?? 0;
      const afterHolders =
        afterSnapshot?.holderCount ??
        snapshots[snapshots.length - 1]?.holderCount ??
        (latestSnapshot && latestSnapshot.timestamp > dealDate ? latestSnapshot.holderCount : null) ??
        beforeHolders;
      const holderDelta = afterHolders - beforeHolders;

      let priceUsd: number | null = null;
      let volume24h: number | null = null;
      let geckoPrice: number | null = null;

      if (deal.workspace.chain === "solana") {
        try {
          const dex = await getTokenPriceVolume("solana", deal.workspace.tokenContract);
          if (dex) {
            priceUsd = dex.priceUsd;
            volume24h = dex.volume24h;
          }
        } catch {}
        try {
          geckoPrice = await getTokenPrice("solana", deal.workspace.tokenContract);
        } catch {}
      }

      return {
        deal: {
          id: deal.id,
          walletOfKol: deal.walletOfKol,
          paidAmount: Number(deal.paidAmount),
          date: deal.date,
          txid: deal.txid,
          chain: deal.workspace.chain,
        },
        holderDelta,
        beforeHolders,
        afterHolders,
        snapshotsInWindow: snapshots.length,
        priceUsd: priceUsd ?? geckoPrice,
        volume24h,
      };
    }),
});
