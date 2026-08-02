"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-[9px] text-[13px] font-medium text-pineFg transition-colors duration-fast hover:bg-pineMid disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
    >
      {creating ? (
        <Spinner className="h-[15px] w-[15px] border-pineInk border-t-pineFg" />
      ) : (
        <Plus className="h-[15px] w-[15px]" aria-hidden="true" />
      )}
      {creating ? "Creating…" : "New document"}
    </button>
  );
}
