import type { Metadata } from "next";
import { db } from "@/server/db";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workspace = await db.workspace.findUnique({ where: { id } });
  if (!workspace) return { title: "Workspace" };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const ogImage = `${baseUrl}/api/og/workspace/${id}`;

  return {
    title: `${workspace.name} | Token Analytics`,
    description: `Track holders, health score, campaigns, and KOL deals for ${workspace.name}`,
    openGraph: {
      title: `${workspace.name} | Token Analytics`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${workspace.name} | Token Analytics`,
      images: [ogImage],
    },
  };
}

export default function WorkspaceLayout({ children }: Props) {
  return children;
}
