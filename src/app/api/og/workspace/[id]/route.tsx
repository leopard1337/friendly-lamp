import { ImageResponse } from "next/og";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspace = await db.workspace.findUnique({
    where: { id },
    include: {
      snapshots: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { campaigns: true, kolDeals: true } },
    },
  });

  if (!workspace) {
    return new Response("Workspace not found", { status: 404 });
  }

  const latest = workspace.snapshots[0];
  const holderCount = latest?.holderCount ?? 0;
  const healthScore = latest?.healthScore ?? null;
  const healthColor =
    healthScore == null
      ? "#71717a"
      : healthScore >= 70
        ? "#34d399"
        : healthScore >= 40
          ? "#fbbf24"
          : "#f87171";

  const mintShort =
    workspace.tokenContract.length > 20
      ? `${workspace.tokenContract.slice(0, 8)}...${workspace.tokenContract.slice(-6)}`
      : workspace.tokenContract;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0b 0%, #18181b 50%, #0f0f10 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "90%",
            maxWidth: 800,
            padding: 48,
            borderRadius: 24,
            border: "1px solid rgba(63, 63, 70, 0.6)",
            background: "rgba(24, 24, 27, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(139, 92, 246, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#fafafa",
              }}
            >
              {workspace.name}
            </span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#71717a",
              fontFamily: "monospace",
              marginBottom: 32,
            }}
          >
            {mintShort} · {workspace.chain}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 32,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 28px",
                borderRadius: 16,
                background: "rgba(39, 39, 42, 0.8)",
                border: "1px solid rgba(63, 63, 70, 0.5)",
              }}
            >
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Holders
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#fafafa", marginTop: 8 }}>
                {holderCount.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 28px",
                borderRadius: 16,
                background: "rgba(39, 39, 42, 0.8)",
                border: "1px solid rgba(63, 63, 70, 0.5)",
              }}
            >
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Health Score
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: healthColor, marginTop: 8 }}>
                {healthScore != null ? Math.round(healthScore) : "—"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 28px",
                borderRadius: 16,
                background: "rgba(39, 39, 42, 0.8)",
                border: "1px solid rgba(63, 63, 70, 0.5)",
              }}
            >
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Campaigns
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#fafafa", marginTop: 8 }}>
                {workspace._count.campaigns}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 28px",
                borderRadius: 16,
                background: "rgba(39, 39, 42, 0.8)",
                border: "1px solid rgba(63, 63, 70, 0.5)",
              }}
            >
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                KOL Deals
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#fafafa", marginTop: 8 }}>
                {workspace._count.kolDeals}
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 12,
              color: "#52525b",
            }}
          >
            Token Analytics · Shareable snapshot
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
