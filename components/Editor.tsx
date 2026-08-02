"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { ShareDialog } from "@/components/ShareDialog";
import type { DocumentContent } from "@/lib/types";

type SaveStatus = "saved" | "saving" | "unsaved" | "conflict";

type EditorProps = {
  documentId: string;
  initialTitle: string;
  initialContent: DocumentContent;
  initialVersion: number;
  readOnly?: boolean;
  isOwner: boolean;
  ownerName: string;
};

type DocumentResponse = {
  id: string;
  title: string;
  content: DocumentContent;
  version: number;
};

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded border px-2 py-1 text-sm ${
        active
          ? "border-neutral-700 bg-neutral-200 text-neutral-900"
          : "border-neutral-300 bg-white text-neutral-700"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export function Editor({
  documentId,
  initialTitle,
  initialContent,
  initialVersion,
  readOnly = false,
  isOwner,
  ownerName,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [conflict, setConflict] = useState(false);
  const [toolbarTick, setToolbarTick] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const titleRef = useRef(title);
  const versionRef = useRef(version);
  const conflictRef = useRef(false);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const changeGenRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContentRef = useRef<DocumentContent>(initialContent);
  const scheduleSaveRef = useRef<() => void>(() => {});

  const scheduleSave = useCallback(() => {
    if (conflictRef.current || readOnly) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void (async () => {
        if (conflictRef.current || savingRef.current || !dirtyRef.current) {
          return;
        }

        savingRef.current = true;
        const saveGen = changeGenRef.current;
        setStatus("saving");

        const payload = {
          title: titleRef.current,
          content: editorContentRef.current,
          version: versionRef.current,
        };

        try {
          const response = await fetch(`/api/documents/${documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.status === 409) {
            setConflict(true);
            conflictRef.current = true;
            dirtyRef.current = false;
            setStatus("conflict");
            return;
          }

          if (!response.ok) {
            setStatus("unsaved");
            scheduleSaveRef.current();
            return;
          }

          const updated = (await response.json()) as DocumentResponse;
          setVersion(updated.version);
          versionRef.current = updated.version;

          if (changeGenRef.current === saveGen) {
            dirtyRef.current = false;
            setStatus("saved");
          } else {
            setStatus("unsaved");
            scheduleSaveRef.current();
          }
        } catch {
          // Keep dirty and retry on the next debounce tick.
          setStatus("unsaved");
          scheduleSaveRef.current();
        } finally {
          savingRef.current = false;
        }
      })();
    }, 800);
  }, [documentId, readOnly]);

  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const markDirty = useCallback(() => {
    if (readOnly || conflictRef.current) {
      return;
    }
    changeGenRef.current += 1;
    dirtyRef.current = true;
    setStatus("unsaved");
    scheduleSave();
  }, [readOnly, scheduleSave]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    editable: !readOnly && !conflict,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          "prose-doc min-h-[60vh] max-w-[800px] px-8 py-6 text-base leading-7 text-neutral-900 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      editorContentRef.current = current.getJSON() as DocumentContent;
      setToolbarTick((tick) => tick + 1);
      markDirty();
    },
    onSelectionUpdate: () => {
      setToolbarTick((tick) => tick + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly && !conflict);
  }, [editor, readOnly, conflict]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  async function handleReload() {
    const response = await fetch(`/api/documents/${documentId}`);
    if (!response.ok) {
      return;
    }

    const doc = (await response.json()) as DocumentResponse;
    setTitle(doc.title);
    titleRef.current = doc.title;
    setVersion(doc.version);
    versionRef.current = doc.version;
    editorContentRef.current = doc.content;
    editor?.commands.setContent(doc.content);
    setConflict(false);
    conflictRef.current = false;
    dirtyRef.current = false;
    changeGenRef.current += 1;
    setStatus("saved");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    markDirty();
  }

  function handleTitleBlur() {
    if (title.trim().length === 0) {
      const fallback = "Untitled document";
      setTitle(fallback);
      titleRef.current = fallback;
      markDirty();
    }
  }

  const disabled = readOnly || conflict || !editor;
  void toolbarTick;

  const statusLabel =
    status === "saving"
      ? "Saving…"
      : status === "unsaved"
        ? "Unsaved changes"
        : status === "conflict"
          ? "Conflict"
          : "Saved";

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <Link href="/" className="text-sm text-neutral-600 underline">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{statusLabel}</span>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setShareOpen((open) => !open)}
              className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-sm text-neutral-800"
            >
              {shareOpen ? "Close share" : "Share"}
            </button>
          ) : (
            <span className="text-sm text-neutral-600">
              Shared with you by {ownerName}
            </span>
          )}
        </div>
      </div>

      {isOwner && shareOpen && <ShareDialog documentId={documentId} />}

      {conflict && (
        <div
          role="alert"
          className="mb-4 border border-neutral-400 bg-neutral-100 px-4 py-3 text-sm text-neutral-900"
        >
          <p>
            This document was changed elsewhere. Reload to get the latest
            version.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleReload();
            }}
            className="mt-2 border border-neutral-500 bg-white px-3 py-1 text-sm"
          >
            Reload
          </button>
        </div>
      )}

      <div className="mb-2 flex items-baseline justify-between gap-4">
        <input
          type="text"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          onBlur={handleTitleBlur}
          readOnly={readOnly || conflict}
          aria-label="Document title"
          className="w-full border-0 bg-transparent text-3xl font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
          placeholder="Untitled document"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        <ToolbarButton
          label="Bold"
          active={!!editor?.isActive("bold")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          active={!!editor?.isActive("italic")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          active={!!editor?.isActive("underline")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="H1"
          active={!!editor?.isActive("heading", { level: 1 })}
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <ToolbarButton
          label="H2"
          active={!!editor?.isActive("heading", { level: 2 })}
          disabled={disabled}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <ToolbarButton
          label="Bulleted list"
          active={!!editor?.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Numbered list"
          active={!!editor?.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
