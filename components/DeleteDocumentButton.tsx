"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteDocumentButtonProps = {
  documentId: string;
  title: string;
};

export function DeleteDocumentButton({
  documentId,
  title,
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete “${title}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleDelete();
      }}
      disabled={deleting}
      className="text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
