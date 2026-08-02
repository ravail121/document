"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

type HeaderProps = {
  currentUserId: string;
};

export function Header({ currentUserId }: HeaderProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setSelectedUserId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) return;
        const data = (await response.json()) as User[];
        if (!cancelled) {
          setUsers(data);
        }
      } catch {
        // Keep the switcher empty if users cannot be loaded.
      }
    }

    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChange(userId: string) {
    if (userId === selectedUserId || switching) {
      return;
    }

    setSwitching(true);
    setSelectedUserId(userId);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        setSelectedUserId(currentUserId);
        return;
      }

      router.refresh();
    } catch {
      setSelectedUserId(currentUserId);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-neutral-900"
        >
          docs
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <label className="flex items-center gap-2 text-neutral-700">
            <span className="text-neutral-500">Viewing as</span>
            <select
              value={selectedUserId}
              disabled={switching || users.length === 0}
              onChange={(event) => {
                void handleChange(event.target.value);
              }}
              aria-label="Viewing as"
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-900"
            >
              {users.length === 0 ? (
                <option value={selectedUserId}>Loading…</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <span className="text-xs text-neutral-400">
            Simulated accounts — no login required.
          </span>
        </div>
      </div>
    </header>
  );
}
