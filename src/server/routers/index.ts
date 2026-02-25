import { router, publicProcedure } from "../trpc";
import { authRouter } from "./auth";
import { workspaceRouter } from "./workspace";
import { campaignRouter } from "./campaign";
import { kolRouter } from "./kol";
import { snapshotRouter } from "./snapshot";
import { communityRouter } from "./community";
import { attributionRouter } from "./attribution";
import { teamRouter } from "./team";
import { tokenRouter } from "./token";

export const appRouter = router({
  health: router({
    check: publicProcedure.query(() => ({ ok: true, timestamp: new Date().toISOString() })),
  }),
  auth: authRouter,
  workspace: workspaceRouter,
  campaign: campaignRouter,
  kol: kolRouter,
  snapshot: snapshotRouter,
  community: communityRouter,
  attribution: attributionRouter,
  team: teamRouter,
  token: tokenRouter,
});

export type AppRouter = typeof appRouter;
