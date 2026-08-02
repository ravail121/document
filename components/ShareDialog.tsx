"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, X } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import type { ShareUser, User } from "@/lib/types";

type ShareDialogProps = {
  documentId: string;
  documentTitle: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  onClose: () => void;
};

type ShareListResponse = {
  shares: ShareUser[];
  candidates: User[];
};

type ErrorBody = {
  error?: string;
};

type Feedback =
  | { kind: "added"; message: string }
  | { kind: "removed"; message: string }
  | { kind: "error"; message: string }
  | null;

export function ShareDialog({
  documentId,
  documentTitle,
  owner,
  onClose,
}: ShareDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [shares, setShares] = useState<ShareUser[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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
          setFeedback({
            kind: "error",
            message:
              err instanceof Error ? err.message : "Failed to load shares",
          });
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

  useEffect(() => {
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  async function handleAdd() {
    if (!selectedUserId || busy) return;

    const selected = candidates.find((user) => user.id === selectedUserId);
    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorBody;
        setFeedback({
          kind: "error",
          message: body.error ?? "Failed to share document",
        });
        return;
      }

      await refresh();
      if (selected) {
        setFeedback({
          kind: "added",
          message: `${selected.name} now has access`,
        });
      }
    } catch {
      setFeedback({ kind: "error", message: "Failed to share document" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: string) {
    if (busy) return;

    const target = shares.find((share) => share.id === userId);
    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/shares`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorBody;
        setFeedback({
          kind: "error",
          message: body.error ?? "Failed to revoke access",
        });
        return;
      }

      await refresh();
      if (target) {
        setFeedback({
          kind: "removed",
          message: `${target.name} no longer has access`,
        });
      }
    } catch {
      setFeedback({ kind: "error", message: "Failed to revoke access" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] rounded-xl bg-surface p-6"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-[16px] font-medium leading-snug text-ink"
          >
            Share &ldquo;{documentTitle}&rdquo;
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close share dialog"
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors duration-fast hover:bg-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-muted">
          People with access can read and edit
        </p>

        {loading ? (
          <div className="mb-5 flex items-center gap-2 text-[13px] text-muted">
            <Spinner className="h-4 w-4" />
            <span>Loading…</span>
          </div>
        ) : (
          <>
            {candidates.length === 0 ? (
              <p className="mb-5 text-[13px] text-muted">
                Everyone already has access to this document.
              </p>
            ) : (
              <div className="mb-5 flex gap-2">
                <select
                  value={selectedUserId}
                  disabled={busy}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  aria-label="Choose a person to share with"
                  className="min-w-0 flex-1 rounded-lg border border-line2 bg-surface px-3 py-2 text-[13px] text-ink transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 rounded-lg bg-pine px-[18px] py-2 text-[13px] font-medium text-pineFg transition-colors duration-fast hover:bg-pineMid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:opacity-50"
                >
                  {busy && (
                    <Spinner className="h-3.5 w-3.5 border-pineInk border-t-pineFg" />
                  )}
                  Add
                </button>
              </div>
            )}

            <p className="mb-1.5 text-[11px] font-medium tracking-[0.06em] text-section">
              WHO HAS ACCESS
            </p>

            <ul>
              <li className="flex items-center gap-2.5 border-b border-rowLine py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pineMid text-[11px] font-medium text-surface">
                  {owner.name.charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{owner.name}</p>
                  <p className="truncate text-[12px] text-muted">{owner.email}</p>
                </div>
                <span className="shrink-0 text-[12px] text-muted">Owner</span>
              </li>

              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center gap-2.5 border-b border-rowLine py-2.5 last:border-b-0"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ownerDot text-[11px] font-medium text-surface">
                    {share.name.charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{share.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {share.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void handleRemove(share.id);
                    }}
                    className="shrink-0 text-[12px] text-muted underline transition-colors duration-fast hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {feedback?.kind === "added" && (
          <div className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-pineSoft px-3 py-2">
            <Check className="h-[13px] w-[13px] shrink-0 text-pineMid" aria-hidden="true" />
            <p className="text-[12px] text-pine">{feedback.message}</p>
          </div>
        )}
        {feedback?.kind === "removed" && (
          <div className="mt-3.5 rounded-lg bg-pill px-3 py-2">
            <p className="text-[12px] text-ink">{feedback.message}</p>
          </div>
        )}
        {feedback?.kind === "error" && (
          <div
            role="alert"
            className="mt-3.5 rounded-lg bg-dangerBg px-3 py-2"
          >
            <p className="text-[12px] text-danger">{feedback.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
