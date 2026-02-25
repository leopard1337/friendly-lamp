import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getTokenMetadata } from "@/lib/helius";

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.workspaceMember.findMany({
      where: { walletId: ctx.session.walletId, status: "active" },
      include: {
        workspace: {
          include: {
            snapshots: { orderBy: { timestamp: "desc" }, take: 1 },
            _count: { select: { campaigns: true } },
          },
        },
      },
    });
    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      latestSnapshot: m.workspace.snapshots[0] ?? null,
      campaignCount: m.workspace._count.campaigns,
    }));
    const withMetadata = await Promise.all(
      workspaces.map(async (ws) => {
        let tokenSymbol: string | null = null;
        if (ws.chain === "solana" && ws.tokenContract) {
          try {
            const meta = await getTokenMetadata(ws.tokenContract);
            tokenSymbol = meta?.symbol ?? null;
          } catch {
            tokenSymbol = null;
          }
        }
        return {
          id: ws.id,
          name: ws.name,
          tokenContract: ws.tokenContract,
          chain: ws.chain,
          ownerWalletId: ws.ownerWalletId,
          createdAt: ws.createdAt,
          role: ws.role,
          latestSnapshot: ws.latestSnapshot,
          campaignCount: ws.campaignCount,
          tokenSymbol,
        };
      })
    );
    return withMetadata;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).transform((s) => s.trim()),
        tokenContract: z.string().min(1).max(128).transform((s) => s.trim()),
        chain: z.enum(["solana", "evm"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.create({
        data: {
          name: input.name,
          tokenContract: input.tokenContract,
          chain: input.chain,
          ownerWalletId: ctx.session.walletId,
        },
      });
      await ctx.db.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          walletId: ctx.session.walletId,
          role: "owner",
        },
      });
      return workspace;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: input.id },
        include: { members: { include: { wallet: true } } },
      });
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = workspace.ownerWalletId === ctx.session.walletId;
      const isMember = workspace.members.some(
        (m) => m.walletId === ctx.session.walletId && m.status === "active"
      );
      if (!isOwner && !isMember) throw new TRPCError({ code: "FORBIDDEN" });
      return workspace;
    }),

  getByToken: protectedProcedure
    .input(
      z.object({
        tokenContract: z.string(),
        chain: z.enum(["solana", "evm"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findFirst({
        where: {
          tokenContract: input.tokenContract,
          chain: input.chain,
        },
      });
      if (!workspace) return null;
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_walletId: {
            workspaceId: workspace.id,
            walletId: ctx.session.walletId,
          },
        },
      });
      if (!membership || membership.status !== "active") return null;
      return workspace;
    }),
});
