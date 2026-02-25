import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const communityRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
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
      return ctx.db.communityStat.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { timestamp: "desc" },
        take: input.limit,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().min(1),
        telegramCount: z.number().int().min(0).optional(),
        discordCount: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findUnique({ where: { id: input.workspaceId } });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = workspace.ownerWalletId === ctx.session.walletId;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      const canEdit = isOwner || (membership?.status === "active" && (membership.role === "admin" || membership.role === "editor"));
      if (!canEdit) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Editor or admin required" });
      }
      const now = new Date();
      return ctx.db.communityStat.upsert({
        where: {
          workspaceId_timestamp: { workspaceId: input.workspaceId, timestamp: now },
        },
        create: {
          workspaceId: input.workspaceId,
          timestamp: now,
          telegramCount: input.telegramCount,
          discordCount: input.discordCount,
        },
        update: {
          telegramCount: input.telegramCount,
          discordCount: input.discordCount,
        },
      });
    }),
});
