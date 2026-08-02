"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DocumentResponse = {
  id: string;
};

export function NewDocumentButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return;
      }

      const doc = (await response.json()) as DocumentResponse;
      router.push(`/documents/${doc.id}`);
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
      className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {creating ? "Creating…" : "New document"}
    </button>
  );
}
