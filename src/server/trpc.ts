import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "./db";
import { getSession } from "./auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSession();
  return {
    db,
    headers: opts.headers,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
