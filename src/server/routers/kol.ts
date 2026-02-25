import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const kolRouter = router({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
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
      return ctx.db.kolDeal.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { date: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().min(1),
        campaignId: z.string().optional().nullable(),
        walletOfKol: z.string().min(32).max(64).transform((s) => s.trim()),
        paidAmount: z.number().positive(),
        date: z.coerce.date(),
        txid: z.string().max(128).optional(),
        platform: z.string().max(64).optional(),
        notes: z.string().max(2000).optional(),
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
      return ctx.db.kolDeal.create({
        data: {
          workspaceId: input.workspaceId,
          campaignId: input.campaignId || null,
          walletOfKol: input.walletOfKol,
          paidAmount: input.paidAmount,
          date: input.date,
          txid: input.txid?.trim() || null,
          platform: input.platform,
          notes: input.notes,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        campaignId: z.string().optional().nullable(),
        walletOfKol: z.string().min(32).max(64).transform((s) => s.trim()).optional(),
        paidAmount: z.number().positive().optional(),
        date: z.coerce.date().optional(),
        txid: z.string().max(128).optional().nullable(),
        platform: z.string().max(64).optional().nullable(),
        notes: z.string().max(2000).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.db.kolDeal.findUnique({ where: { id: input.id }, include: { workspace: true } });
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = deal.workspace.ownerWalletId === ctx.session.walletId;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: { workspaceId: deal.workspaceId, walletId: ctx.session.walletId },
        },
      });
      const canEdit = isOwner || (membership?.status === "active" && (membership.role === "admin" || membership.role === "editor"));
      if (!canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...updates } = input;
      const clean: Record<string, unknown> = {};
      if (updates.campaignId !== undefined) clean.campaignId = updates.campaignId ?? null;
      if (updates.walletOfKol !== undefined) clean.walletOfKol = updates.walletOfKol;
      if (updates.paidAmount !== undefined) clean.paidAmount = updates.paidAmount;
      if (updates.date !== undefined) clean.date = updates.date;
      if (updates.txid !== undefined) clean.txid = updates.txid ?? null;
      if (updates.platform !== undefined) clean.platform = updates.platform ?? null;
      if (updates.notes !== undefined) clean.notes = updates.notes ?? null;
      return ctx.db.kolDeal.update({ where: { id }, data: clean });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.db.kolDeal.findUnique({ where: { id: input.id }, include: { workspace: true } });
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = deal.workspace.ownerWalletId === ctx.session.walletId;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: { workspaceId: deal.workspaceId, walletId: ctx.session.walletId },
        },
      });
      const canEdit = isOwner || (membership?.status === "active" && (membership.role === "admin" || membership.role === "editor"));
      if (!canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.kolDeal.delete({ where: { id: input.id } });
    }),
});
