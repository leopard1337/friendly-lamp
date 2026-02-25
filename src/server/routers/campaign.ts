import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const campaignRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: { workspace: true },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: campaign.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return campaign;
    }),

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
      return ctx.db.campaign.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { startedAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        type: z.enum(["launch", "kol", "community", "other"]),
        startedAt: z.coerce.date(),
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
      return ctx.db.campaign.create({
        data: {
          workspaceId: input.workspaceId,
          type: input.type,
          startedAt: input.startedAt,
          notes: input.notes,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(["launch", "kol", "community", "other"]),
        startedAt: z.coerce.date(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: { workspace: true },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = campaign.workspace.ownerWalletId === ctx.session.walletId;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: campaign.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      const canEdit = isOwner || (membership?.status === "active" && (membership.role === "admin" || membership.role === "editor"));
      if (!canEdit) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Editor or admin required" });
      }
      return ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          type: input.type,
          startedAt: input.startedAt,
          notes: input.notes,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: { workspace: true },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = campaign.workspace.ownerWalletId === ctx.session.walletId;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: campaign.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      const canEdit = isOwner || (membership?.status === "active" && (membership.role === "admin" || membership.role === "editor"));
      if (!canEdit) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Editor or admin required" });
      }
      return ctx.db.campaign.delete({
        where: { id: input.id },
      });
    }),
});
