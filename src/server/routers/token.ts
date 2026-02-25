import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { getTokenMetadata } from "@/lib/helius";

export const tokenRouter = router({
  getMetadata: protectedProcedure
    .input(z.object({ mint: z.string().min(1), chain: z.enum(["solana", "evm"]) }))
    .query(async ({ input }) => {
      if (input.chain !== "solana") {
        return null;
      }
      return getTokenMetadata(input.mint);
    }),
});
