"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useLoading } from "@/components/LoadingProvider";
import { Spinner } from "@/components/Spinner";
import type { User } from "@/lib/types";

type HeaderProps = {
  currentUserId: string;
};

export function Header({ currentUserId }: HeaderProps) {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
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
    showLoading("Switching account…");

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
      hideLoading();
    }
  }

  const currentUser =
    users.find((user) => user.id === selectedUserId) ??
    users.find((user) => user.id === currentUserId);
  const displayName = currentUser?.name ?? "…";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <header className="h-14 border-b border-line bg-surface">
      <div className="flex h-full items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          onClick={() => {
            showLoading("Loading dashboard…");
          }}
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-pine text-[12px] font-medium text-pineInk">
            D
          </span>
          <span className="text-[14px] font-medium tracking-tight text-ink">
            Docs
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted">Simulated accounts</span>
          {switching && <Spinner className="h-3.5 w-3.5" label="Switching" />}
          <div className="relative">
            <div className="pointer-events-none flex items-center gap-2 rounded-pill bg-pill py-[5px] pl-[5px] pr-3 text-[13px] text-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pineMid text-[11px] font-medium text-surface">
                {initial}
              </span>
              <span>{displayName}</span>
              <ChevronDown
                className="h-[13px] w-[13px] text-muted"
                aria-hidden="true"
              />
            </div>
            <select
              value={selectedUserId}
              disabled={switching || users.length === 0}
              onChange={(event) => {
                void handleChange(event.target.value);
              }}
              aria-label="Viewing as"
              className="absolute inset-0 cursor-pointer opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </header>
  );
}
