import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const ROLES = ["admin", "editor", "viewer"] as const;

async function requireAdminOrOwner(
  db: { workspace: { findUnique: (args: { where: { id: string } }) => Promise<{ ownerWalletId: string } | null> }; workspaceMember: { findUnique: (args: { where: { workspaceId_walletId: { workspaceId: string; walletId: string } } }) => Promise<{ role: string; status: string } | null> } },
  workspaceId: string,
  walletId: string
) {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
  if (workspace.ownerWalletId === walletId) return;
  const membership = await db.workspaceMember.findUnique({
    where: { workspaceId_walletId: { workspaceId, walletId } },
  });
  if (!membership || membership.status !== "active" || membership.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or owner required" });
  }
}

export const teamRouter = router({
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
      const members = await ctx.db.workspaceMember.findMany({
        where: {
          workspaceId: input.workspaceId,
          status: { in: ["active", "invited"] },
        },
        include: { wallet: true },
      });
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
      });
      const isAdmin = workspace?.ownerWalletId === ctx.session.walletId ||
        membership.role === "admin";
      const canEdit = isAdmin || membership.role === "editor";
      return { members, isAdmin, canEdit };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().min(1),
        walletAddress: z.string().min(32).max(64).transform((s) => s.trim()),
        role: z.enum(ROLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdminOrOwner(ctx.db, input.workspaceId, ctx.session.walletId);
      const raw = input.walletAddress;
      const normalizedAddr = raw.startsWith("0x") ? raw.toLowerCase() : raw;
      let wallet = await ctx.db.wallet.findUnique({
        where: { address: normalizedAddr },
      });
      if (!wallet && normalizedAddr !== raw) {
        wallet = await ctx.db.wallet.findUnique({
          where: { address: raw },
        });
      }
      if (!wallet) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must sign in at least once before they can be invited",
        });
      }
      if (wallet.id === ctx.session.walletId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot invite yourself",
        });
      }
      const existing = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: wallet.id,
          },
        },
      });
      if (existing) {
        if (existing.status === "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User is already a member" });
        }
        if (existing.status === "invited") {
          await ctx.db.workspaceMember.update({
            where: {
              workspaceId_walletId: {
                workspaceId: input.workspaceId,
                walletId: wallet.id,
              },
            },
            data: { role: input.role, invitedAt: new Date() },
          });
          return { success: true };
        }
      }
      await ctx.db.workspaceMember.upsert({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: wallet.id,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          walletId: wallet.id,
          role: input.role,
          status: "invited",
          invitedAt: new Date(),
        },
        update: {
          role: input.role,
          status: "invited",
          invitedAt: new Date(),
        },
      });
      return { success: true };
    }),

  remove: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        walletId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdminOrOwner(ctx.db, input.workspaceId, ctx.session.walletId);
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
      });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      if (workspace.ownerWalletId === input.walletId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove workspace owner" });
      }
      await ctx.db.workspaceMember.update({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: input.walletId,
          },
        },
        data: { status: "removed" },
      });
      return { success: true };
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().min(1),
        walletId: z.string().min(1),
        role: z.enum(ROLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdminOrOwner(ctx.db, input.workspaceId, ctx.session.walletId);
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.workspaceId },
      });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      if (workspace.ownerWalletId === input.walletId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change owner role" });
      }
      const target = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: input.walletId,
          },
        },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      await ctx.db.workspaceMember.update({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: input.walletId,
          },
        },
        data: { role: input.role },
      });
      return { success: true };
    }),

  myInvites: protectedProcedure.query(async ({ ctx }) => {
    const invites = await ctx.db.workspaceMember.findMany({
      where: {
        walletId: ctx.session.walletId,
        status: "invited",
      },
      include: {
        workspace: true,
        wallet: true,
      },
    });
    return invites;
  }),

  acceptInvite: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "invited") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      await ctx.db.workspaceMember.update({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
        data: { status: "active", invitedAt: null },
      });
      return { success: true };
    }),

  rejectInvite: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "invited") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      await ctx.db.workspaceMember.delete({
        where: {
          workspaceId_walletId: {
            workspaceId: input.workspaceId,
            walletId: ctx.session.walletId,
          },
        },
      });
      return { success: true };
    }),
});
