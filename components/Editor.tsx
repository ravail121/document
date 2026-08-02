"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft,
  Check,
  List,
  ListOrdered,
  UserPlus,
} from "lucide-react";
import { useLoading } from "@/components/LoadingProvider";
import { ShareDialog } from "@/components/ShareDialog";
import { Spinner } from "@/components/Spinner";
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
  ownerEmail: string;
  ownerId: string;
};

type DocumentResponse = {
  id: string;
  title: string;
  content: DocumentContent;
  version: number;
};

function ToolbarDivider() {
  return <span className="mx-1.5 h-[18px] w-px shrink-0 bg-line2" aria-hidden="true" />;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  ariaLabel,
  className = "",
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-[14px] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-pineSoft text-pineMid"
          : "bg-transparent text-section hover:bg-pill"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <Spinner className="h-[13px] w-[13px] border-line2 border-t-muted" />
        Saving…
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
        Unsaved changes
      </span>
    );
  }

  if (status === "conflict") {
    return <span className="text-[12px] text-muted">Conflict</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
      <Check className="h-[13px] w-[13px] text-pineMid" aria-hidden="true" />
      Saved
    </span>
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
  ownerEmail,
  ownerId,
}: EditorProps) {
  const { showLoading } = useLoading();
  const [title, setTitle] = useState(initialTitle);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [conflict, setConflict] = useState(false);
  const [toolbarTick, setToolbarTick] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

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
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
    ],
    content: initialContent,
    editable: !readOnly && !conflict,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "prose-doc outline-none",
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-canvas">
      <div className="sticky top-0 z-20">
        <div className="flex h-14 items-center justify-between gap-4 border-b border-line bg-surface px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to documents"
              onClick={() => {
                showLoading("Loading dashboard…");
              }}
              className="rounded-md p-1 text-section transition-colors duration-fast hover:bg-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <ArrowLeft className="h-[17px] w-[17px]" aria-hidden="true" />
            </Link>

            <input
              type="text"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              onBlur={handleTitleBlur}
              readOnly={readOnly || conflict}
              aria-label="Document title"
              placeholder="Untitled document"
              className="min-w-0 max-w-[min(420px,50vw)] truncate border-0 border-b border-transparent bg-transparent text-[15px] font-medium text-ink outline-none transition-colors duration-fast placeholder:text-faint focus:border-line2 focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-1"
            />

            <span className="hidden shrink-0 rounded-pill bg-pill px-2 py-0.5 text-[11px] text-muted sm:inline">
              {isOwner ? "Owner" : `Shared by ${ownerName}`}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3.5">
            <SaveStatusIndicator status={status} />
            {isOwner && (
              <button
                ref={shareButtonRef}
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-3.5 py-[7px] text-[13px] font-medium text-pineFg transition-colors duration-fast hover:bg-pineMid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
              >
                <UserPlus className="h-[14px] w-[14px]" aria-hidden="true" />
                Share
              </button>
            )}
          </div>
        </div>

        <div className="flex h-[50px] items-center justify-center overflow-x-auto border-b border-line bg-surface px-4">
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              ariaLabel="Bold"
              active={!!editor?.isActive("bold")}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="font-semibold"
            >
              B
            </ToolbarButton>
            <ToolbarButton
              ariaLabel="Italic"
              active={!!editor?.isActive("italic")}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="italic"
            >
              I
            </ToolbarButton>
            <ToolbarButton
              ariaLabel="Underline"
              active={!!editor?.isActive("underline")}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className="underline"
            >
              U
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              ariaLabel="Heading 1"
              active={!!editor?.isActive("heading", { level: 1 })}
              disabled={disabled}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className="w-auto px-2 text-[12px] font-bold"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              ariaLabel="Heading 2"
              active={!!editor?.isActive("heading", { level: 2 })}
              disabled={disabled}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className="w-auto px-2 text-[12px] font-bold"
            >
              H2
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              ariaLabel="Bulleted list"
              active={!!editor?.isActive("bulletList")}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-[15px] w-[15px]" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              ariaLabel="Numbered list"
              active={!!editor?.isActive("orderedList")}
              disabled={disabled}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-[15px] w-[15px]" aria-hidden="true" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {isOwner && shareOpen && (
        <ShareDialog
          documentId={documentId}
          documentTitle={title}
          owner={{
            id: ownerId,
            name: ownerName,
            email: ownerEmail,
          }}
          onClose={() => {
            setShareOpen(false);
            requestAnimationFrame(() => {
              shareButtonRef.current?.focus();
            });
          }}
        />
      )}

      {conflict && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-conflictBorder bg-conflictBg px-6 py-3 text-[13px] text-conflictText"
        >
          <span>This document was changed elsewhere.</span>
          <button
            type="button"
            onClick={() => {
              void handleReload();
            }}
            className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            Reload
          </button>
        </div>
      )}

      <div className="flex justify-center px-4 py-9 sm:px-6 sm:py-9">
        <div className="w-full max-w-[680px] rounded bg-surface px-6 py-8 sm:px-16 sm:py-14 border border-line">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
