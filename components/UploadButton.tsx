"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useLoading } from "@/components/LoadingProvider";
import { Spinner } from "@/components/Spinner";

type DocumentResponse = {
  id: string;
};

type ErrorBody = {
  error?: string;
};

export function UploadButton() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File | undefined) {
    if (!file || uploading) return;

    setUploading(true);
    setError(null);
    showLoading("Uploading file…");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as DocumentResponse & ErrorBody;
      if (!response.ok) {
        setError(payload.error ?? "Upload failed");
        hideLoading();
        return;
      }

      router.push(`/documents/${payload.id}`);
    } catch {
      setError("Upload failed");
      hideLoading();
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md"
        className="hidden"
        onChange={(event) => {
          void handleFileChange(event.target.files?.[0]);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 disabled:opacity-50"
      >
        {uploading && <Spinner className="h-3.5 w-3.5" />}
        {uploading ? "Uploading…" : "Upload a file"}
      </button>
      <p className="text-xs text-neutral-500">
        Supports .txt and .md files up to 1MB.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
