"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import type { ShareUser, User } from "@/lib/types";

type ShareDialogProps = {
  documentId: string;
};

type ShareListResponse = {
  shares: ShareUser[];
  candidates: User[];
};

type ErrorBody = {
  error?: string;
};

export function ShareDialog({ documentId }: ShareDialogProps) {
  const [shares, setShares] = useState<ShareUser[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const applyPayload = useCallback((payload: ShareListResponse) => {
    setShares(payload.shares);
    setCandidates(payload.candidates);
    setSelectedUserId((current) => {
      if (current && payload.candidates.some((user) => user.id === current)) {
        return current;
      }
      return payload.candidates[0]?.id ?? "";
    });
  }, []);

  const refresh = useCallback(async () => {
    setError(null);

    const response = await fetch(`/api/documents/${documentId}/shares`);
    if (!response.ok) {
      const body = (await response.json()) as ErrorBody;
      throw new Error(body.error ?? "Failed to load share list");
    }

    const payload = (await response.json()) as ShareListResponse;
    applyPayload(payload);
  }, [applyPayload, documentId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load shares");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function handleAdd() {
    if (!selectedUserId || busy) return;

    const selected = candidates.find((user) => user.id === selectedUserId);
    setBusy(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorBody;
        setError(body.error ?? "Failed to share document");
        return;
      }

      await refresh();
      if (selected) {
        setConfirmation(`${selected.name} now has access.`);
      }
    } catch {
      setError("Failed to share document");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: string) {
    if (busy) return;

    setBusy(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorBody;
        setError(body.error ?? "Failed to revoke access");
        return;
      }

      await refresh();
    } catch {
      setError("Failed to revoke access");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 border border-neutral-300 bg-white px-4 py-3 text-sm">
      <h3 className="mb-3 font-medium text-neutral-900">Share document</h3>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-500">
          <Spinner className="h-4 w-4" />
          <span>Loading…</span>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              People with access
            </p>
            {shares.length === 0 ? (
              <p className="text-neutral-500">Not shared with anyone yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div>
                      <p className="text-neutral-900">{share.name}</p>
                      <p className="text-xs text-neutral-500">{share.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void handleRemove(share.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 disabled:opacity-50"
                    >
                      {busy && <Spinner className="h-3 w-3" />}
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Add people
            </p>
            {candidates.length === 0 ? (
              <p className="text-neutral-500">
                Everyone already has access to this document.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedUserId}
                  disabled={busy}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-900"
                >
                  {candidates.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || !selectedUserId}
                  onClick={() => {
                    void handleAdd();
                  }}
                  className="inline-flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-3 py-1 text-white disabled:opacity-50"
                >
                  {busy && (
                    <Spinner className="h-3.5 w-3.5 border-neutral-500 border-t-white" />
                  )}
                  Add
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {confirmation && !error && (
        <p className="mt-3 text-sm text-neutral-600">{confirmation}</p>
      )}
    </div>
  );
}
