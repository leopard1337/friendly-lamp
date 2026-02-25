import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/trpc/Provider";
import { ToastProvider } from "@/components/Toast";
import { WalletProvider } from "@/components/WalletProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Token Analytics Dashboard",
  description: "Token analytics, holder tracking, and KOL attribution",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <ToastProvider>
            <WalletProvider>{children}</WalletProvider>
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
