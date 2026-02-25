import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const alertRouter = router({
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
      return ctx.db.alert.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        type: z.enum(["holder_count", "health_score"]),
        operator: z.enum(["above", "below"]),
        threshold: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
      });
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
      if (!canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.alert.create({
        data: {
          workspaceId: input.workspaceId,
          type: input.type,
          operator: input.operator,
          threshold: input.threshold,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alert = await ctx.db.alert.findUnique({
        where: { id: input.id },
      });
      if (!alert) throw new TRPCError({ code: "NOT_FOUND" });
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: alert.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: alert.workspaceId },
      });
      const isOwner = workspace?.ownerWalletId === ctx.session.walletId;
      const isAdmin = membership?.role === "admin";
      if (!membership || membership.status !== "active") {
        if (!isOwner) throw new TRPCError({ code: "FORBIDDEN" });
      } else if (!isOwner && !isAdmin && membership.role !== "editor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.alert.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
