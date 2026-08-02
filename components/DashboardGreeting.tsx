"use client";

import { useEffect, useState } from "react";

type DashboardGreetingProps = {
  name: string;
  ownedCount: number;
  sharedCount: number;
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({
  name,
  ownedCount,
  sharedCount,
}: DashboardGreetingProps) {
  // Compute greeting only after mount so server HTML matches the first client render
  // (server UTC vs browser local time would otherwise hydrate-mismatch).
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const docsLabel = ownedCount === 1 ? "1 document" : `${ownedCount} documents`;
  const sharedLabel =
    sharedCount === 1
      ? "1 shared with you"
      : `${sharedCount} shared with you`;

  return (
    <div>
      <h1 className="text-[27px] font-medium leading-tight tracking-[-0.02em] text-ink">
        {greeting ? `${greeting}, ${name}` : `Hello, ${name}`}
      </h1>
      <p className="mt-1 text-[14px] text-muted">
        {docsLabel} · {sharedLabel}
      </p>
    </div>
  );
}
