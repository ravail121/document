"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useLoading } from "@/components/LoadingProvider";
import { Spinner } from "@/components/Spinner";

type DeleteDocumentButtonProps = {
  documentId: string;
  title: string;
};

export function DeleteDocumentButton({
  documentId,
  title,
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete “${title}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    showLoading("Deleting document…");
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
      hideLoading();
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
      aria-label={`Delete ${title}`}
      className="shrink-0 rounded-md p-1 text-trash opacity-0 transition-all duration-fast group-hover:opacity-100 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:opacity-50"
    >
      {deleting ? (
        <Spinner className="h-[15px] w-[15px]" />
      ) : (
        <Trash2 className="h-[15px] w-[15px]" aria-hidden="true" />
      )}
    </button>
  );
}
