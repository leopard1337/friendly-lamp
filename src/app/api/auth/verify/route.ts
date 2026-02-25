import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import {
  createAuthToken,
  setAuthCookie,
} from "@/server/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  address: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
  chain: z.enum(["solana", "evm"]),
});

async function verifySolanaSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const { PublicKey } = await import("@solana/web3.js");
    const nacl = await import("tweetnacl");
    const bs58 = await import("bs58");

    const publicKey = new PublicKey(address);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.default.decode(signature);

    if (signatureBytes.length !== 64) {
      console.error("Invalid signature length:", signatureBytes.length);
      return false;
    }

    return nacl.default.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (err) {
    console.error("Solana signature verification error:", err);
    return false;
  }
}

export async function POST(req: Request) {
  const { ok, retryAfter } = checkRateLimit(req, { prefix: "auth-verify" });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  try {
    const body = await req.json();
    const { address, signature, message, chain } = schema.parse(body);

    const normalizedAddress = chain === "evm" ? address.toLowerCase() : address;

    const nonceRecord = await db.authNonce.findFirst({
      where: {
        address: normalizedAddress,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!nonceRecord) {
      return NextResponse.json({ error: "Nonce expired or not found" }, { status: 400 });
    }

    if (!message.includes(nonceRecord.nonce)) {
      return NextResponse.json({ error: "Message does not match nonce" }, { status: 400 });
    }

    let valid = false;
    if (chain === "solana") {
      valid = await verifySolanaSignature(address, message, signature);
    } else if (chain === "evm") {
      return NextResponse.json(
        { error: "EVM (SIWE) sign-in is not yet supported. Use Solana wallet." },
        { status: 501 }
      );
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    await db.authNonce.deleteMany({ where: { address: normalizedAddress } });

    let wallet = await db.wallet.findUnique({
      where: { address: normalizedAddress },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          address: normalizedAddress,
          chain,
        },
      });
    }

    const memberships = await db.workspaceMember.findMany({
      where: { walletId: wallet.id, status: "active" },
      include: { workspace: true },
    });

    const workspaceIds = memberships.map((m) => m.workspaceId);
    const primaryRole = memberships[0]?.role ?? "member";

    const token = await createAuthToken({
      walletAddress: wallet.address,
      walletId: wallet.id,
      chain,
      workspaceIds,
      role: primaryRole,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      walletAddress: wallet.address,
      workspaceIds,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return NextResponse.json({ error: "Invalid request", details: msg }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
