import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  address: z.string().min(32).max(64),
  chain: z.enum(["solana", "evm"]),
});

// Solana addresses are base58, 32-44 chars. Store normalized for lookup.

export async function POST(req: Request) {
  const { ok, retryAfter } = checkRateLimit(req, { prefix: "auth-nonce" });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  try {
    const body = await req.json();
    const { address, chain } = schema.parse(body);

    const nonce = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const normalizedAddr = chain === "evm" ? address.toLowerCase() : address;
    await db.authNonce.create({
      data: {
        address: normalizedAddr,
        nonce,
        expiresAt,
      },
    });

    return NextResponse.json({ nonce, message: `Sign this nonce to authenticate: ${nonce}` });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}
