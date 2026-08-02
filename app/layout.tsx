import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { LoadingProvider } from "@/components/LoadingProvider";
import { getCurrentUserId } from "@/lib/session";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "docs",
  description: "Minimal Next.js app with Postgres",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUserId = getCurrentUserId();

  return (
    <html lang="en" className={sourceSerif.variable}>
      <body className="min-h-screen bg-canvas text-ink">
        <LoadingProvider>
          <Header currentUserId={currentUserId} />
          <ErrorBoundary>{children}</ErrorBoundary>
        </LoadingProvider>
      </body>
    </html>
  );
}
