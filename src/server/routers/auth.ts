import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),
  session: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
});
