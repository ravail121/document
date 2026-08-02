import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { getCurrentUserId } from "@/lib/session";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <Header currentUserId={currentUserId} />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
