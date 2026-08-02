"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLoading } from "@/components/LoadingProvider";
import { Spinner } from "@/components/Spinner";

type DocumentResponse = {
  id: string;
};

export function NewDocumentButton() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    showLoading("Creating document…");

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        hideLoading();
        return;
      }

      const doc = (await response.json()) as DocumentResponse;
      router.push(`/documents/${doc.id}`);
      // Keep overlay visible until the route transition completes.
    } catch {
      hideLoading();
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCreate();
      }}
      disabled={creating}
      className="inline-flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {creating && <Spinner className="h-3.5 w-3.5 border-neutral-500 border-t-white" />}
      {creating ? "Creating…" : "New document"}
    </button>
  );
}
